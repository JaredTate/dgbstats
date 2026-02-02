import React from 'react';
import { render, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { vi } from 'vitest';
import { NetworkProvider } from '../../context/NetworkContext';

// Ensure window.matchMedia is available before Material-UI components load
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation(query => {
      const mediaQueryList = {
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
      return mediaQueryList;
    }),
  });
}

// Additional safety check - make sure window.matchMedia is always defined
if (typeof window !== 'undefined' && typeof window.matchMedia === 'undefined') {
  window.matchMedia = vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// Create a default theme for tests
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1e88e5',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

// Custom render function that includes providers
export function renderWithProviders(
  ui,
  {
    route = '/',
    theme: customTheme = theme,
    network = 'mainnet',
    ...renderOptions
  } = {}
) {
  window.history.pushState({}, 'Test page', route);

  function Wrapper({ children }) {
    return (
      <NetworkProvider network={network}>
        <ThemeProvider theme={customTheme}>
          <BrowserRouter>
            {children}
          </BrowserRouter>
        </ThemeProvider>
      </NetworkProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

// WebSocket mock class
export class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = WebSocket.CONNECTING;
    this.onopen = null;
    this.onclose = null;
    this.onerror = null;
    this.onmessage = null;
    this._sentMessages = [];

    // Make close a spy for verification
    // Use code 1000 (normal closure) to prevent reconnection logic from triggering
    this.close = vi.fn(() => {
      this.readyState = WebSocket.CLOSED;
      if (this.onclose) {
        act(() => {
          this.onclose({ type: 'close', code: 1000, reason: 'Normal closure' });
        });
      }
    });

    // Simulate connection opening asynchronously wrapped in act
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      if (this.onopen) {
        act(() => {
          this.onopen({ type: 'open' });
        });
      }
    }, 0);
  }

  send(data) {
    // Store sent messages for verification
    this._sentMessages.push(data);
  }

  // Helper method to get sent messages for test assertions
  getSentMessages() {
    return this._sentMessages;
  }

  // Helper method to simulate receiving a message - wrapped in act for React state updates
  receiveMessage(data) {
    if (this.onmessage && this.readyState === WebSocket.OPEN) {
      act(() => {
        this.onmessage({ data: JSON.stringify(data) });
      });
    }
  }

  // Helper method to simulate an error - wrapped in act for React state updates
  triggerError(error) {
    if (this.onerror) {
      act(() => {
        this.onerror({ type: 'error', error });
      });
    }
  }
}

// Create WebSocket mock
export function createWebSocketMock() {
  const mockInstances = [];

  const MockWebSocketConstructor = vi.fn().mockImplementation((url) => {
    const instance = new MockWebSocket(url);
    mockInstances.push(instance);
    return instance;
  });

  // Add static properties
  MockWebSocketConstructor.CONNECTING = 0;
  MockWebSocketConstructor.OPEN = 1;
  MockWebSocketConstructor.CLOSING = 2;
  MockWebSocketConstructor.CLOSED = 3;

  // Expose instances on the constructor for tests that access global.WebSocket.instances
  MockWebSocketConstructor.instances = mockInstances;

  return {
    MockWebSocket: MockWebSocketConstructor,
    instances: mockInstances,
    clearInstances: () => {
      mockInstances.length = 0;
    }
  };
}

// Wait for async updates - wraps in act and allows microtasks to flush
export const waitForAsync = async () => {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });
};

// Mock Chart.js
export function mockChartJs() {
  return {
    Chart: vi.fn().mockImplementation(() => ({
      destroy: vi.fn(),
      update: vi.fn(),
      render: vi.fn(),
      resize: vi.fn(),
      clear: vi.fn(),
      stop: vi.fn(),
      data: {},
      options: {},
    })),
  };
}

// Mock D3 selection
export function mockD3Selection() {
  const selection = {
    select: vi.fn().mockReturnThis(),
    selectAll: vi.fn().mockReturnThis(),
    append: vi.fn().mockReturnThis(),
    attr: vi.fn().mockReturnThis(),
    style: vi.fn().mockReturnThis(),
    text: vi.fn().mockReturnThis(),
    html: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    transition: vi.fn().mockReturnThis(),
    duration: vi.fn().mockReturnThis(),
    ease: vi.fn().mockReturnThis(),
    remove: vi.fn().mockReturnThis(),
    exit: vi.fn().mockReturnThis(),
    enter: vi.fn().mockReturnThis(),
    merge: vi.fn().mockReturnThis(),
    data: vi.fn().mockReturnThis(),
    join: vi.fn().mockReturnThis(),
    call: vi.fn().mockReturnThis(),
    each: vi.fn().mockReturnThis(),
    nodes: vi.fn().mockReturnValue([]),
    node: vi.fn().mockReturnValue(null),
    empty: vi.fn().mockReturnValue(false),
    size: vi.fn().mockReturnValue(1),
  };
  
  return selection;
}

// Mock localStorage
export function mockLocalStorage() {
  const store = {};
  
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
  };
}

// Common test data generators
export const generateMockNode = (overrides = {}) => ({
  ip: '1.2.3.4',
  lat: 40.7128,
  lon: -74.0060,
  country: 'US',
  city: 'New York',
  ...overrides
});

export const generateMockBlock = (overrides = {}) => ({
  height: 17456789,
  hash: '0000000000000000001234567890abcdef',
  time: Date.now(),
  size: 1234,
  txCount: 10,
  miner: 'DigiHash Pool',
  algorithm: 'sha256d',
  difficulty: 12345678.90,
  ...overrides
});

export const generateMockMiner = (overrides = {}) => ({
  name: 'Test Pool',
  address: 'DTestAddress123456789',
  blocks: 100,
  percentage: 10.5,
  signaling: true,
  ...overrides
});

// Re-export everything from @testing-library/react
export * from '@testing-library/react';