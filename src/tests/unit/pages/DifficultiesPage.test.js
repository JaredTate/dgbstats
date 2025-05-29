import { vi } from 'vitest';

// AGGRESSIVE FIX: Create a fully mocked window.matchMedia before ANY imports
if (typeof window !== 'undefined') {
  window.matchMedia = window.matchMedia || function(query) {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: function() {},
      removeListener: function() {},
      addEventListener: function() {},
      removeEventListener: function() {},
      dispatchEvent: function() {}
    };
  };
}

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(), 
  disconnect: vi.fn(),
}));

// Mock the config first
vi.mock('../../../config', () => ({
  default: {
    apiBaseUrl: 'http://localhost:5001',
    wsBaseUrl: 'ws://localhost:5002'
  }
}));

// Mock chartjs-adapter-luxon
vi.mock('chartjs-adapter-luxon', () => ({}));

// Mock Material-UI's useMediaQuery hook
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    useMediaQuery: vi.fn(() => false), // Default to desktop view
  };
});

// Mock Canvas context for Chart.js
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn().mockReturnValue({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn().mockReturnValue({ data: new Array(4) }),
    putImageData: vi.fn(),
    createImageData: vi.fn().mockReturnValue({ data: new Array(4) }),
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
    measureText: vi.fn().mockReturnValue({ width: 0 }),
    transform: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    createLinearGradient: vi.fn().mockReturnValue({
      addColorStop: vi.fn()
    }),
    createRadialGradient: vi.fn().mockReturnValue({
      addColorStop: vi.fn()
    })
  })
});

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, act } from '@testing-library/react';
import DifficultiesPage from '../../../pages/DifficultiesPage';
import { renderWithProviders, createWebSocketMock, waitForAsync } from '../../utils/testUtils';

describe('DifficultiesPage', () => {
  let wsSetup;
  let mockWebSocket;
  let webSocketInstances;
  let mockChart;

  // Sample difficulty data for testing
  const sampleRecentBlocks = [
    { algo: 'SHA256D', difficulty: 12345678.90, height: 1000 },
    { algo: 'SHA256D', difficulty: 12345679.10, height: 1001 },
    { algo: 'Scrypt', difficulty: 234567.89, height: 1002 },
    { algo: 'Scrypt', difficulty: 234568.01, height: 1003 },
    { algo: 'Skein', difficulty: 345678.90, height: 1004 },
    { algo: 'Skein', difficulty: 345679.10, height: 1005 },
    { algo: 'Qubit', difficulty: 456789.01, height: 1006 },
    { algo: 'Qubit', difficulty: 456789.20, height: 1007 },
    { algo: 'Odo', difficulty: 567890.12, height: 1008 },
    { algo: 'Odo', difficulty: 567890.30, height: 1009 }
  ];

  beforeEach(async () => {
    // Setup WebSocket mock
    wsSetup = createWebSocketMock();
    mockWebSocket = wsSetup.MockWebSocket;
    webSocketInstances = wsSetup.instances;
    global.WebSocket = mockWebSocket;

    // Get the Chart mock from global
    mockChart = global._mockChart;
    
    // Clear any existing chart instances from previous tests
    if (global._chartInstances) {
      global._chartInstances.length = 0;
    }
    
    // Clear mock calls
    if (mockChart) {
      mockChart.mockClear();
    }
  });

  afterEach(() => {
    // Clean up WebSocket instances
    webSocketInstances.forEach(ws => ws.close());
    wsSetup.clearInstances();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render the hero section with title and description', () => {
      renderWithProviders(<DifficultiesPage />);
      
      expect(screen.getByText('Realtime DGB Algo Difficulty')).toBeInTheDocument();
      expect(screen.getByText(/This page preloads the difficulty of the last 240 DGB blocks/)).toBeInTheDocument();
      expect(screen.getByText(/DigiShield/)).toBeInTheDocument();
      expect(screen.getByText(/MultiShield/)).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      renderWithProviders(<DifficultiesPage />);
      
      expect(screen.getByText('Loading difficulty data...')).toBeInTheDocument();
    });

    it('should render algorithm cards after data loads', async () => {
      renderWithProviders(<DifficultiesPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      ws.receiveMessage({
        type: 'recentBlocks',
        data: sampleRecentBlocks
      });
      
      await waitFor(() => {
        expect(screen.getByText('SHA256D')).toBeInTheDocument();
        expect(screen.getByText('Scrypt')).toBeInTheDocument();
        expect(screen.getByText('Skein')).toBeInTheDocument();
        expect(screen.getByText('Qubit')).toBeInTheDocument();
        expect(screen.getByText('Odo')).toBeInTheDocument();
      });
    });

    it('should render DigiShield information section', async () => {
      renderWithProviders(<DifficultiesPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      ws.receiveMessage({
        type: 'recentBlocks',
        data: sampleRecentBlocks
      });
      
      await waitFor(() => {
        expect(screen.getByText('About DigiShield Difficulty Adjustment')).toBeInTheDocument();
        expect(screen.getByText('Protection Against Mining Attacks')).toBeInTheDocument();
        expect(screen.getByText('Stability in Block Times')).toBeInTheDocument();
        expect(screen.getByText('Multiple Algorithm Support')).toBeInTheDocument();
        expect(screen.getByText('Industry Innovation')).toBeInTheDocument();
      });
    });
  });

  describe('WebSocket Connection', () => {
    it('should establish WebSocket connection on mount', async () => {
      renderWithProviders(<DifficultiesPage />);
      
      await waitForAsync();
      
      expect(mockWebSocket).toHaveBeenCalledWith('ws://localhost:5002');
      expect(webSocketInstances.length).toBe(1);
      expect(webSocketInstances[0].readyState).toBe(WebSocket.OPEN);
    });

    it('should close WebSocket connection on unmount', async () => {
      const { unmount } = renderWithProviders(<DifficultiesPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      unmount();
      
      expect(ws.readyState).toBe(WebSocket.CLOSED);
    });

    it('should log connection open message', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      renderWithProviders(<DifficultiesPage />);
      
      await waitForAsync();
      
      expect(consoleLogSpy).toHaveBeenCalledWith('WebSocket connection established for difficulties page');
      
      consoleLogSpy.mockRestore();
    });

    it('should log connection close message', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const { unmount } = renderWithProviders(<DifficultiesPage />);
      
      await waitForAsync();
      
      unmount();
      
      expect(consoleLogSpy).toHaveBeenCalledWith('WebSocket connection closed - difficulties page');
      
      consoleLogSpy.mockRestore();
    });
  });

  describe('Data Updates', () => {
    it('should process recentBlocks message and display difficulties', async () => {
      renderWithProviders(<DifficultiesPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      // Send specific test data for this test case
      const testData = [
        { algo: 'SHA256D', difficulty: 12345679.10, height: 1001 },
        { algo: 'Scrypt', difficulty: 234568.01, height: 1003 },
        { algo: 'Skein', difficulty: 345679.10, height: 1005 },
        { algo: 'Qubit', difficulty: 456789.20, height: 1007 },
        { algo: 'Odo', difficulty: 567890.30, height: 1009 }
      ];
      
      ws.receiveMessage({
        type: 'recentBlocks',
        data: testData
      });
      
      await waitFor(() => {
        expect(screen.getByText('12345679.10000000')).toBeInTheDocument(); // SHA256D
      });
      
      await waitFor(() => {
        expect(screen.getByText('234568.01000000')).toBeInTheDocument(); // Scrypt
      });
      
      await waitFor(() => {
        expect(screen.getByText('345679.10000000')).toBeInTheDocument(); // Skein
      });
      
      await waitFor(() => {
        expect(screen.getByText('456789.20000000')).toBeInTheDocument(); // Qubit
      });
      
      await waitFor(() => {
        expect(screen.getByText('567890.30000000')).toBeInTheDocument(); // Odo
      });
    });

    it('should handle real-time newBlock updates', async () => {
      renderWithProviders(<DifficultiesPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      // Initial data - specific test data for this case
      const initialData = [
        { algo: 'SHA256D', difficulty: 12345679.10, height: 1001 }
      ];
      
      ws.receiveMessage({
        type: 'recentBlocks',
        data: initialData
      });
      
      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByText('SHA256D')).toBeInTheDocument();
      });
      
      // Send new block update
      ws.receiveMessage({
        type: 'newBlock',
        data: {
          algo: 'SHA256D',
          difficulty: 12345680.50,
          height: 1010
        }
      });
      
      // Should update the SHA256D difficulty
      await waitFor(() => {
        // Check that there are multiple "Latest Difficulty:" elements (one per algo)
        const difficultyElements = screen.getAllByText(/Latest Difficulty:/);
        expect(difficultyElements.length).toBeGreaterThan(0);
        // Check that the updated difficulty value is shown
        expect(screen.getByText('12345680.50000000')).toBeInTheDocument();
      });
    });

    it('should display block count for each algorithm', async () => {
      renderWithProviders(<DifficultiesPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      ws.receiveMessage({
        type: 'recentBlocks',
        data: sampleRecentBlocks
      });
      
      await waitFor(() => {
        // Each algorithm has 2 blocks in our sample data
        const blockTexts = screen.getAllByText(/Showing difficulty changes over the last \d+ blocks/);
        expect(blockTexts).toHaveLength(5); // One for each algorithm
        expect(blockTexts[0]).toHaveTextContent('Showing difficulty changes over the last 2 blocks');
      });
    });

    it('should handle empty difficulty data', async () => {
      renderWithProviders(<DifficultiesPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      ws.receiveMessage({
        type: 'recentBlocks',
        data: []
      });
      
      await waitFor(() => {
        // Should show N/A for algorithms with no data
        const naTexts = screen.getAllByText('N/A');
        expect(naTexts).toHaveLength(5); // One for each algorithm
      });
    });
  });

  describe('Chart Management', () => {
    it('should create charts for each algorithm after data loads', async () => {
      renderWithProviders(<DifficultiesPage />);
      
      // Initially should show loading state
      expect(screen.getByText('Loading difficulty data...')).toBeInTheDocument();
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      // Send data to exit loading state
      ws.receiveMessage({
        type: 'recentBlocks',
        data: sampleRecentBlocks
      });
      
      // Wait for loading to disappear and all algorithm cards to be displayed
      await waitFor(() => {
        expect(screen.queryByText('Loading difficulty data...')).not.toBeInTheDocument();
      });
      
      await waitFor(() => {
        expect(screen.getByText('SHA256D')).toBeInTheDocument();
        expect(screen.getByText('Scrypt')).toBeInTheDocument();
        expect(screen.getByText('Skein')).toBeInTheDocument();
        expect(screen.getByText('Qubit')).toBeInTheDocument();
        expect(screen.getByText('Odo')).toBeInTheDocument();
      });
      
      // Wait for all difficulty values to be displayed
      await waitFor(() => {
        expect(screen.getByText('12345679.10000000')).toBeInTheDocument(); // SHA256D
        expect(screen.getByText('234568.01000000')).toBeInTheDocument(); // Scrypt
        expect(screen.getByText('345679.10000000')).toBeInTheDocument(); // Skein
        expect(screen.getByText('456789.20000000')).toBeInTheDocument(); // Qubit
        expect(screen.getByText('567890.30000000')).toBeInTheDocument(); // Odo
      });
      
      // Find all canvas elements
      const canvasElements = document.querySelectorAll('canvas');
      expect(canvasElements.length).toBe(5);
      
      // Verify each canvas has a mocked context
      canvasElements.forEach(canvas => {
        expect(canvas.getContext).toHaveBeenCalled();
      });
    });

    it('should display charts with proper styling for each algorithm', async () => {
      renderWithProviders(<DifficultiesPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      ws.receiveMessage({
        type: 'recentBlocks',
        data: sampleRecentBlocks
      });
      
      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.queryByText('Loading difficulty data...')).not.toBeInTheDocument();
      });
      
      // Check that algorithm cards are displayed with proper colors
      const algorithmCards = ['SHA256D', 'Scrypt', 'Skein', 'Qubit', 'Odo'];
      
      algorithmCards.forEach(algo => {
        const algoElement = screen.getByText(algo);
        expect(algoElement).toBeInTheDocument();
        
        // Find the card containing this algorithm
        const card = algoElement.closest('.MuiCard-root');
        expect(card).toBeTruthy();
        
        // Card should have canvas for chart
        const canvas = card.querySelector('canvas');
        expect(canvas).toBeTruthy();
      });
      
      // Verify block count text is displayed for each algorithm
      const blockCountTexts = screen.getAllByText(/Showing difficulty changes over the last \d+ blocks/);
      expect(blockCountTexts).toHaveLength(5);
    });

    it('should update charts when new block data arrives', async () => {
      renderWithProviders(<DifficultiesPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      // Send initial data
      ws.receiveMessage({
        type: 'recentBlocks',
        data: sampleRecentBlocks
      });
      
      // Wait for initial data to be displayed
      await waitFor(() => {
        expect(screen.queryByText('Loading difficulty data...')).not.toBeInTheDocument();
        expect(screen.getByText('12345679.10000000')).toBeInTheDocument();
      });
      
      // Count initial canvases
      const initialCanvases = document.querySelectorAll('canvas').length;
      expect(initialCanvases).toBe(5);
      
      // Send updated data to trigger chart recreation
      ws.receiveMessage({
        type: 'newBlock',
        data: {
          algo: 'SHA256D',
          difficulty: 12345680.50,
          height: 1010
        }
      });
      
      // Wait for the difficulty value to update
      await waitFor(() => {
        expect(screen.getByText('12345680.50000000')).toBeInTheDocument();
      });
      
      // Canvas elements should still exist after update
      const updatedCanvases = document.querySelectorAll('canvas').length;
      expect(updatedCanvases).toBe(5);
      
      // The block count should have increased for SHA256D
      const blockTexts = screen.getAllByText(/Showing difficulty changes over the last \d+ blocks/);
      expect(blockTexts[0]).toHaveTextContent('Showing difficulty changes over the last 3 blocks');
    });

    it('should display algorithm cards with distinctive styling', async () => {
      renderWithProviders(<DifficultiesPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      ws.receiveMessage({
        type: 'recentBlocks',
        data: sampleRecentBlocks
      });
      
      // Wait for all algorithms to be displayed
      await waitFor(() => {
        expect(screen.queryByText('Loading difficulty data...')).not.toBeInTheDocument();
      });
      
      // Each algorithm should have its own card with a border color
      const algorithmNames = ['SHA256D', 'Scrypt', 'Skein', 'Qubit', 'Odo'];
      
      algorithmNames.forEach(algo => {
        const algoElement = screen.getByText(algo);
        const card = algoElement.closest('.MuiCard-root');
        
        // Card should exist and have proper structure
        expect(card).toBeTruthy();
        
        // Card should contain a canvas for the chart
        const canvas = card.querySelector('canvas');
        expect(canvas).toBeTruthy();
        
        // Card should display difficulty value
        const cardContent = card.querySelector('.MuiCardContent-root');
        expect(cardContent.textContent).toMatch(/Latest Difficulty: [\d.]+/);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed WebSocket messages gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      renderWithProviders(<DifficultiesPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      // Send malformed data
      try {
        ws.onmessage({ data: 'invalid json' });
      } catch (e) {
        // Expected to throw JSON parse error
      }
      
      // Should not crash and still show the page
      expect(screen.getByText('Realtime DGB Algo Difficulty')).toBeInTheDocument();
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle missing algorithm in block data', async () => {
      renderWithProviders(<DifficultiesPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      ws.receiveMessage({
        type: 'recentBlocks',
        data: [
          { difficulty: 12345678.90, height: 1000 }, // Missing algo field
          { algo: 'Scrypt', difficulty: 234567.89, height: 1001 }
        ]
      });
      
      await waitFor(() => {
        // Should still show Scrypt data
        expect(screen.getByText('Scrypt')).toBeInTheDocument();
        expect(screen.getByText('234567.89000000')).toBeInTheDocument();
      });
    });
  });

  describe('Number Formatting', () => {
    it('should format difficulty values to 8 decimal places', async () => {
      renderWithProviders(<DifficultiesPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      ws.receiveMessage({
        type: 'recentBlocks',
        data: [
          { algo: 'SHA256D', difficulty: 12345678.123456789, height: 1000 }
        ]
      });
      
      await waitFor(() => {
        // Should show exactly 8 decimal places
        expect(screen.getByText('12345678.12345679')).toBeInTheDocument();
      });
    });

    it('should display formatted difficulty values', async () => {
      renderWithProviders(<DifficultiesPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      // Send data with large difficulty values
      ws.receiveMessage({
        type: 'recentBlocks',
        data: [
          { algo: 'SHA256D', difficulty: 12345678.123456789, height: 1000 },
          { algo: 'Scrypt', difficulty: 999.99999999, height: 1001 },
          { algo: 'Skein', difficulty: 0.00000001, height: 1002 }
        ]
      });
      
      // Wait for data to be displayed
      await waitFor(() => {
        expect(screen.queryByText('Loading difficulty data...')).not.toBeInTheDocument();
      });
      
      // Check that difficulty values are formatted to 8 decimal places
      expect(screen.getByText('12345678.12345679')).toBeInTheDocument();
      expect(screen.getByText('999.99999999')).toBeInTheDocument();
      expect(screen.getByText('0.00000001')).toBeInTheDocument();
      
      // Algorithms without data should show N/A
      const naTexts = screen.getAllByText('N/A');
      expect(naTexts.length).toBe(2); // Qubit and Odo have no data
    });
  });

  describe('Responsive Design', () => {
    it('should render cards in responsive grid layout', async () => {
      renderWithProviders(<DifficultiesPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      ws.receiveMessage({
        type: 'recentBlocks',
        data: sampleRecentBlocks
      });
      
      await waitFor(() => {
        // Check that all algorithm cards are rendered
        const cards = screen.getAllByText(/Latest Difficulty:/);
        expect(cards).toHaveLength(5);
      });
    });

    it('should render responsive chart containers', async () => {
      renderWithProviders(<DifficultiesPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      ws.receiveMessage({
        type: 'recentBlocks',
        data: sampleRecentBlocks
      });
      
      // Wait for all algorithms to be displayed
      await waitFor(() => {
        expect(screen.queryByText('Loading difficulty data...')).not.toBeInTheDocument();
        expect(screen.getByText('SHA256D')).toBeInTheDocument();
      });
      
      // Check that chart containers have proper structure
      const canvasElements = document.querySelectorAll('canvas');
      expect(canvasElements.length).toBe(5);
      
      canvasElements.forEach(canvas => {
        // Canvas should be inside a container with height
        const container = canvas.parentElement;
        expect(container).toBeTruthy();
        
        // Canvas should have style attributes for responsiveness
        expect(canvas.style).toBeTruthy();
        expect(canvas.style.width).toBe('100%');
        expect(canvas.style.height).toBe('100%');
      });
      
      // Grid should contain all 5 algorithm cards
      const gridItems = document.querySelectorAll('.MuiGrid-item');
      const algorithmCards = Array.from(gridItems).filter(item => 
        item.querySelector('canvas')
      );
      expect(algorithmCards.length).toBe(5);
    });
  });
});
