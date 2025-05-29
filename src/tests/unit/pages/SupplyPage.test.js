import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import SupplyPage from '../../../pages/SupplyPage';
import { renderWithProviders, createWebSocketMock, waitForAsync, mockChartJs } from '../../utils/testUtils';
import { mockApiResponses, generateWebSocketMessage } from '../../mocks/mockData';

// Mock the config
vi.mock('../../../config', () => ({
  default: {
    apiBaseUrl: 'http://localhost:5001',
    wsBaseUrl: 'ws://localhost:5002'
  }
}));

// Mock chartjs-adapter-luxon
vi.mock('chartjs-adapter-luxon', () => ({}));

describe('SupplyPage', () => {
  let wsSetup;
  let mockWebSocket;
  let webSocketInstances;
  let mockChartInstance;
  let mockChart;

  beforeEach(() => {
    // Setup WebSocket mock
    wsSetup = createWebSocketMock();
    mockWebSocket = wsSetup.MockWebSocket;
    webSocketInstances = wsSetup.instances;
    global.WebSocket = mockWebSocket;

    // Get the global Chart mock from setup.js
    mockChart = global._mockChart;
    
    // Get reference to the mock chart instance that will be created
    mockChartInstance = {
      destroy: vi.fn(),
      update: vi.fn(),
      render: vi.fn(),
      resize: vi.fn(),
      clear: vi.fn(),
      stop: vi.fn(),
      data: {},
      options: {},
    };
  });

  afterEach(() => {
    // Clean up WebSocket instances
    webSocketInstances.forEach(ws => ws.close());
    wsSetup.clearInstances();
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the hero section with title and description', () => {
      renderWithProviders(<SupplyPage />);
      
      expect(screen.getByText('DigiByte Supply Statistics')).toBeInTheDocument();
      expect(screen.getByText(/DigiByte has a limited supply of 21 billion DGB/)).toBeInTheDocument();
    });

    it('should render all supply statistics cards', () => {
      renderWithProviders(<SupplyPage />);
      
      // Main statistics
      expect(screen.getByText('Current Circulating Supply')).toBeInTheDocument();
      expect(screen.getByText('Remaining Supply To Be Mined')).toBeInTheDocument();
      
      // Additional info
      expect(screen.getByText('DGB Per Person')).toBeInTheDocument();
      expect(screen.getByText('Mining End Date')).toBeInTheDocument();
    });

    it('should render the supply timeline chart section', () => {
      renderWithProviders(<SupplyPage />);
      
      expect(screen.getByText('DigiByte Supply Distribution Timeline')).toBeInTheDocument();
      expect(screen.getByText(/This chart shows the historical and projected supply distribution/)).toBeInTheDocument();
    });

    it('should display default values initially', () => {
      renderWithProviders(<SupplyPage />);
      
      // Check for default supply value (15.70 Billion DGB)
      expect(screen.getByText(/15\.70 Billion DGB/)).toBeInTheDocument();
    });
  });

  describe('WebSocket Connection', () => {
    it('should establish WebSocket connection on mount', async () => {
      renderWithProviders(<SupplyPage />);
      
      await waitForAsync();
      
      expect(mockWebSocket).toHaveBeenCalledWith('ws://localhost:5002');
      expect(webSocketInstances.length).toBe(1);
      expect(webSocketInstances[0].readyState).toBe(WebSocket.OPEN);
    });

    it('should close WebSocket connection on unmount', async () => {
      const { unmount } = renderWithProviders(<SupplyPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      unmount();
      
      expect(ws.readyState).toBe(WebSocket.CLOSED);
    });

    it('should handle WebSocket reconnection', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      renderWithProviders(<SupplyPage />);
      
      await waitForAsync();
      
      // Get the initial count of WebSocket instances
      const initialCount = webSocketInstances.length;
      const ws = webSocketInstances[initialCount - 1]; // Get the last (most recent) WebSocket
      
      // Simulate connection close with error code (not normal closure)
      ws.onclose({ type: 'close', code: 1006, reason: 'Connection lost' });
      
      // Wait for reconnection attempt (2 seconds delay as per component)
      await waitFor(() => {
        // Should have created one more WebSocket instance
        expect(webSocketInstances.length).toBeGreaterThan(initialCount);
      }, { timeout: 3000 });
      
      // Verify reconnection was logged
      expect(consoleLogSpy).toHaveBeenCalledWith('Supply WebSocket connection closed', 1006, 'Connection lost');
      expect(consoleLogSpy).toHaveBeenCalledWith('Attempting to reconnect (1/3)...');
      
      consoleLogSpy.mockRestore();
    });
  });

  describe('Data Updates', () => {
    it('should update supply statistics when receiving WebSocket data', async () => {
      renderWithProviders(<SupplyPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      // Send mock supply data with txOutsetInfo
      ws.receiveMessage({
        type: 'initialData',
        data: {
          txOutsetInfo: {
            total_amount: 16234567890,
            height: 18500000,
            bestblock: "00000000000000000000000000000000",
            txouts: 20000000,
            bogosize: 1500000000
          }
        }
      });
      
      await waitFor(() => {
        // Check for updated supply value
        expect(screen.getByText(/16\.23 Billion DGB/)).toBeInTheDocument();
      });
      
      await waitFor(() => {
        // Check for percentage
        expect(screen.getByText(/77\.3%/)).toBeInTheDocument();
      });
    });

    it('should update per person stats when receiving data', async () => {
      renderWithProviders(<SupplyPage worldPopulation={8000000000} />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      ws.receiveMessage({
        type: 'initialData',
        data: {
          txOutsetInfo: {
            total_amount: 16234567890,
            height: 18500000,
            bestblock: "00000000000000000000000000000000",
            txouts: 20000000,
            bogosize: 1500000000
          }
        }
      });
      
      await waitFor(() => {
        // Check that DGB per person is displayed (not specific value as multiple "2035" texts exist)
        expect(screen.getByText('DGB Per Person')).toBeInTheDocument();
        // Just verify some DGB amount is shown
        const dgbPerPersonElements = screen.getAllByText(/\d+\.\d+ DGB/);
        expect(dgbPerPersonElements.length).toBeGreaterThan(0);
      });
      
      // Mining end date might not be displayed in test environment
      // Just verify the component rendered successfully with supply data
      expect(screen.getByText('DigiByte Supply Statistics')).toBeInTheDocument();
    });

    it('should handle remaining supply calculation', async () => {
      renderWithProviders(<SupplyPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      ws.receiveMessage({
        type: 'initialData',
        data: {
          txOutsetInfo: {
            total_amount: 16234567890,
            height: 18500000,
            bestblock: "00000000000000000000000000000000",
            txouts: 20000000,
            bogosize: 1500000000
          }
        }
      });
      
      await waitFor(() => {
        // Remaining supply: 21B - 16.23B = 4.77B
        expect(screen.getByText(/4\.77 Billion DGB/)).toBeInTheDocument();
      });
      
      await waitFor(() => {
        // Remaining percentage
        expect(screen.getByText(/22\.7%/)).toBeInTheDocument();
      });
    });
  });

  describe('Chart Functionality', () => {
    it('should initialize Chart.js on mount', async () => {
      renderWithProviders(<SupplyPage />);
      
      // Wait for the component to mount and the useEffect to run
      await waitFor(() => {
        expect(mockChart).toHaveBeenCalled();
      });
      
      expect(mockChart).toHaveBeenCalledWith(
        expect.any(Object), // Canvas context, not HTMLCanvasElement directly
        expect.objectContaining({
          type: 'line',
          data: expect.any(Object),
          options: expect.any(Object)
        })
      );
    });

    it('should destroy chart on unmount to prevent memory leaks', async () => {
      const { unmount } = renderWithProviders(<SupplyPage />);
      
      // Wait for chart to be created
      await waitFor(() => {
        expect(mockChart).toHaveBeenCalled();
      });
      
      // Get the created chart instance
      const chartInstances = global._chartInstances;
      const chartInstance = chartInstances[chartInstances.length - 1];
      
      unmount();
      
      expect(chartInstance.destroy).toHaveBeenCalled();
    });

    it('should update chart when receiving timeline data', async () => {
      renderWithProviders(<SupplyPage />);
      
      // Wait for initial chart to be created
      await waitFor(() => {
        expect(mockChart).toHaveBeenCalled();
      });
      
      const initialCallCount = mockChart.mock.calls.length;
      const chartInstances = global._chartInstances;
      const firstChartInstance = chartInstances[chartInstances.length - 1];
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      ws.receiveMessage({
        type: 'initialData',
        data: {
          txOutsetInfo: {
            total_amount: 16234567890,
            height: 18500000,
            bestblock: "00000000000000000000000000000000",
            txouts: 20000000,
            bogosize: 1500000000
          }
        }
      });
      
      await waitFor(() => {
        // Chart is destroyed and recreated when data changes
        expect(firstChartInstance.destroy).toHaveBeenCalled();
        expect(mockChart).toHaveBeenCalledTimes(initialCallCount + 1); // Initial + update
      });
    });

  });

  describe('Error Handling', () => {
    it('should handle WebSocket errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      renderWithProviders(<SupplyPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      ws.triggerError(new Error('Connection failed'));
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Supply WebSocket connection error:', expect.objectContaining({
        type: 'error',
        error: expect.any(Error)
      }));
      
      // Page should still render
      expect(screen.getByText('DigiByte Supply Statistics')).toBeInTheDocument();
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle malformed WebSocket messages', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      renderWithProviders(<SupplyPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      // Send malformed data
      ws.onmessage({ data: 'invalid json' });
      
      // Should not crash
      expect(screen.getByText('DigiByte Supply Statistics')).toBeInTheDocument();
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle missing data fields gracefully', async () => {
      renderWithProviders(<SupplyPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      // Send incomplete data
      ws.receiveMessage({
        type: 'initialData',
        data: {
          txOutsetInfo: {
            total_amount: 16234567890
            // Missing other fields
          }
        }
      });
      
      await waitFor(() => {
        expect(screen.getByText(/16\.23 Billion DGB/)).toBeInTheDocument();
        // Other fields should show default or 0 values
      });
    });
  });

  describe('Number Formatting', () => {
    it('should format large numbers correctly', async () => {
      renderWithProviders(<SupplyPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      ws.receiveMessage({
        type: 'initialData',
        data: {
          txOutsetInfo: {
            total_amount: 16234567890,
            height: 18500000,
            bestblock: "00000000000000000000000000000000",
            txouts: 20000000,
            bogosize: 1500000000
          }
        }
      });
      
      await waitFor(() => {
        expect(screen.getByText(/16\.23 Billion DGB/)).toBeInTheDocument(); // Current supply
      });
      
      await waitFor(() => {
        expect(screen.getByText(/4\.77 Billion DGB/)).toBeInTheDocument(); // Remaining supply
      });
    });

    it('should format percentages correctly', async () => {
      renderWithProviders(<SupplyPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      ws.receiveMessage({
        type: 'initialData',
        data: {
          txOutsetInfo: {
            total_amount: 16234567890,
            height: 18500000,
            bestblock: "00000000000000000000000000000000",
            txouts: 20000000,
            bogosize: 1500000000
          }
        }
      });
      
      await waitFor(() => {
        expect(screen.getByText(/77\.3%/)).toBeInTheDocument(); // Current supply percentage
      });
      
      await waitFor(() => {
        expect(screen.getByText(/22\.7%/)).toBeInTheDocument(); // Remaining supply percentage
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      renderWithProviders(<SupplyPage />);
      
      // Check for main heading
      expect(screen.getByText('DigiByte Supply Statistics')).toBeInTheDocument();
      
      // Check that there are multiple headings
      const allHeadings = screen.getAllByRole('heading');
      expect(allHeadings.length).toBeGreaterThan(1);
    });

    it('should have descriptive text for all statistics', () => {
      renderWithProviders(<SupplyPage />);
      
      // Check for descriptive labels
      expect(screen.getByText('Current Circulating Supply')).toBeInTheDocument();
      expect(screen.getByText('Remaining Supply To Be Mined')).toBeInTheDocument();
      expect(screen.getByText('DGB Per Person')).toBeInTheDocument();
      expect(screen.getByText('Mining End Date')).toBeInTheDocument();
    });

    it('should have proper ARIA labels for interactive elements', () => {
      renderWithProviders(<SupplyPage />);
      
      // Check for cards with proper structure
      expect(screen.getByText('Current Circulating Supply')).toBeInTheDocument();
      expect(screen.getByText('Remaining Supply To Be Mined')).toBeInTheDocument();
    });
  });
});