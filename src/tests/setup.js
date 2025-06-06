import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { server } from './mocks/server';
import 'vitest-canvas-mock';

// Mock Chart.js before any imports
const createMockChartInstance = () => ({
  destroy: vi.fn(),
  update: vi.fn(),
  render: vi.fn(),
  resize: vi.fn(),
  clear: vi.fn(),
  stop: vi.fn(),
  options: {},
  data: {}
});

// Store all created instances for testing
const chartInstances = [];

const mockChart = vi.fn().mockImplementation(() => {
  const instance = createMockChartInstance();
  chartInstances.push(instance);
  return instance;
});

mockChart.register = vi.fn();
mockChart.defaults = {};
mockChart.instances = chartInstances;

// Make the mock available globally for tests
global._mockChart = mockChart;
global._chartInstances = chartInstances;

vi.mock('chart.js', () => ({
  Chart: mockChart,
  registerables: [],
  LineController: {},
  CategoryScale: {},
  LinearScale: {},
  PointElement: {},
  LineElement: {},
  Title: {},
  Tooltip: {},
  Legend: {},
  TimeScale: {},
  LogarithmicScale: {}
}));

// Mock chartjs-adapter-luxon
vi.mock('chartjs-adapter-luxon', () => ({}));

// Establish API mocking before all tests.
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

// Clear Chart instances before each test
beforeEach(() => {
  chartInstances.length = 0;
  mockChart.mockClear();
});

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => {
  cleanup();
  server.resetHandlers();
});

// Clean up after the tests are finished.
afterAll(() => {
  server.close();
});

// Make WebSocket writable for tests
Object.defineProperty(global, 'WebSocket', {
  writable: true,
  value: WebSocket
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// vitest-canvas-mock now handles canvas mocking
// If needed, we can extend specific canvas methods here

// Ensure canvas getContext is properly mocked
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((type) => {
    if (type === '2d') {
      return {
        fillRect: vi.fn(),
        clearRect: vi.fn(),
        getImageData: vi.fn(),
        putImageData: vi.fn(),
        createImageData: vi.fn(),
        setTransform: vi.fn(),
        drawImage: vi.fn(),
        save: vi.fn(),
        fillText: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        closePath: vi.fn(),
        stroke: vi.fn(),
        translate: vi.fn(),
        scale: vi.fn(),
        rotate: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        measureText: vi.fn(() => ({ width: 0 })),
        transform: vi.fn(),
        rect: vi.fn(),
        clip: vi.fn(),
        createLinearGradient: vi.fn().mockReturnValue({
          addColorStop: vi.fn()
        }),
        createRadialGradient: vi.fn().mockReturnValue({
          addColorStop: vi.fn()
        })
      };
    }
    return null;
  });
}

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Suppress console errors in tests unless explicitly testing error handling
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});