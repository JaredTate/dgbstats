import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, createWebSocketMock, waitForAsync } from '../../utils/testUtils';

import HomePage from '../../../pages/HomePage';

// Mock the config
vi.mock('../../../config', () => ({
  default: {
    apiBaseUrl: 'http://localhost:5001',
    wsBaseUrl: 'ws://localhost:5002'
  }
}));

// Mock utils
vi.mock('../../../utils', () => ({
  formatNumber: (num) => num.toLocaleString(),
  numberWithCommas: (x) => x ? x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0"
}));

describe('HomePage', () => {
  let mockWebSocket;
  let webSocketInstances;
  let wsSetup;

  // Helper function to render HomePage with required props
  const renderHomePage = () => {
    return renderWithProviders(
      <HomePage 
        numberWithCommas={(x) => {
          if (x === null || x === undefined) return "0";
          return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }}
        formatNumber={(num) => {
          if (num === null || num === undefined) return "0";
          return num.toLocaleString();
        }}
      />
    );
  };

  beforeEach(() => {
    // Setup WebSocket mock
    wsSetup = createWebSocketMock();
    mockWebSocket = wsSetup.MockWebSocket;
    webSocketInstances = wsSetup.instances;
    global.WebSocket = mockWebSocket;
  });

  afterEach(() => {
    // Clean up WebSocket instances
    webSocketInstances.forEach(ws => ws.close());
    wsSetup.clearInstances();
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the hero section with title and description', () => {
      renderHomePage();
      
      expect(screen.getByText('DigiByte Blockchain Statistics')).toBeInTheDocument();
      expect(screen.getByText(/This is a free & open source website/)).toBeInTheDocument();
    });

    it('should render all stat cards with loading state initially', () => {
      renderHomePage();
      
      // Check for stat card titles
      expect(screen.getByText('Total Blocks')).toBeInTheDocument();
      expect(screen.getByText('Total Transactions')).toBeInTheDocument();
      expect(screen.getByText('Total Size')).toBeInTheDocument();
      expect(screen.getByText('Current Circulating Supply')).toBeInTheDocument();
      expect(screen.getByText('Remaining Supply To Be Mined')).toBeInTheDocument();
      expect(screen.getByText('Last Block Reward')).toBeInTheDocument();
      
      // Initially should show loading state
      const loadingIndicators = screen.getAllByText('Loading...');
      expect(loadingIndicators.length).toBeGreaterThan(0);
    });

    it('should render algorithm difficulties card', async () => {
      // SKIPPED: HomePage has a bug where it doesn't check blockchainInfo.softforks before calling Object.entries()
      renderHomePage();
      
      // The card title should be visible immediately
      expect(screen.getByText('Algo Difficulties')).toBeInTheDocument();
      
      // Send data to populate the difficulties
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      ws.receiveMessage({
        type: 'initialData',
        data: {
          blockchainInfo: {
            blocks: 17456789,
            difficulties: {
              sha256d: 12345678,
              scrypt: 234567,
              skein: 345678,
              qubit: 456789,
              odocrypt: 567890
            }
          }
        }
      });
      
      // Wait for the difficulties to be displayed
      await waitFor(() => {
        expect(screen.getByText('SHA256d:')).toBeInTheDocument();
        expect(screen.getByText('Scrypt:')).toBeInTheDocument();
        expect(screen.getByText('Skein:')).toBeInTheDocument();
        expect(screen.getByText('Qubit:')).toBeInTheDocument();
        expect(screen.getByText('Odo:')).toBeInTheDocument();
      });
    });

    it('should render active softforks card', () => {
      renderHomePage();
      
      expect(screen.getByText('Active Softforks')).toBeInTheDocument();
    });
  });

  describe('WebSocket Connection', () => {
    it('should establish WebSocket connection on mount', async () => {
      renderHomePage();
      
      await waitForAsync();
      
      expect(mockWebSocket).toHaveBeenCalledWith('ws://localhost:5002');
      expect(webSocketInstances.length).toBe(1);
      expect(webSocketInstances[0].readyState).toBe(WebSocket.OPEN);
    });

    it('should close WebSocket connection on unmount', async () => {
      const { unmount } = renderHomePage();
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      unmount();
      
      expect(ws.readyState).toBe(WebSocket.CLOSED);
    });

    it('should handle WebSocket connection', async () => {
      renderHomePage();
      
      await waitForAsync();
      
      // Just verify WebSocket was created
      expect(webSocketInstances).toHaveLength(1);
      expect(webSocketInstances[0].readyState).toBe(WebSocket.OPEN);
    });
  });

  describe('Data Updates', () => {
    it('should update stats when receiving WebSocket data', async () => {
      // SKIPPED: HomePage has a bug where it doesn't check blockchainInfo.softforks before calling Object.entries()
      renderHomePage();
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      // Send initial data message
      ws.receiveMessage({
        type: 'initialData',
        data: {
          blockchainInfo: {
            blocks: 17456789,
            size_on_disk: 123456789012,
            difficulties: {
              sha256d: 12345678.90,
              scrypt: 234567.89,
              skein: 345678.90,
              qubit: 456789.01,
              odo: 567890.12
            }
          },
          chainTxStats: {
            txcount: 987654321
          },
          txOutsetInfo: {
            total_amount: 16234567890.12
          },
          blockReward: 625.0
        }
      });
      
      await waitFor(() => {
        // Check that data is displayed
        expect(screen.getByText('17,456,789')).toBeInTheDocument(); // Block count
        expect(screen.getByText('987,654,321')).toBeInTheDocument(); // Transaction count
      });
    });

    it('should update algorithm difficulties with data', async () => {
      // SKIPPED: HomePage has a bug where it doesn't check blockchainInfo.softforks before calling Object.entries()
      renderHomePage();
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      // Send data with difficulties
      ws.receiveMessage({
        type: 'initialData',
        data: {
          blockchainInfo: {
            blocks: 17456789,
            difficulties: {
              sha256d: 12345678,
              scrypt: 234567,
              skein: 345678,
              qubit: 456789,
              odo: 567890
            }
          }
        }
      });
      
      await waitFor(() => {
        expect(screen.getByText('12,345,678')).toBeInTheDocument(); // SHA256d difficulty
        expect(screen.getByText('234,567')).toBeInTheDocument(); // Scrypt difficulty
      });
    });

    it('should display active softforks', async () => {
      renderHomePage();
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      ws.receiveMessage({
        type: 'initialData',
        data: {
          blockchainInfo: {
            blocks: 17456789,
            softforks: {
              csv: { type: 'buried', active: true, height: 419328 },
              segwit: { type: 'buried', active: true, height: 1201536 },
              taproot: { type: 'bip9', active: true }
            }
          }
        }
      });
      
      await waitFor(() => {
        expect(screen.getByText('Active Softforks')).toBeInTheDocument();
        expect(screen.getByText('csv:')).toBeInTheDocument();
        expect(screen.getByText('segwit:')).toBeInTheDocument();
        expect(screen.getByText('taproot:')).toBeInTheDocument();
        // There are multiple "buried" texts, so use getAllByText
        const buriedTexts = screen.getAllByText('buried');
        expect(buriedTexts.length).toBe(2); // csv and segwit are both buried
        expect(screen.getByText('bip9')).toBeInTheDocument();
      });
    });
  });

  describe('Number Formatting', () => {
    it('should format large numbers correctly', async () => {
      // SKIPPED: HomePage has a bug where it doesn't check blockchainInfo.softforks before calling Object.entries()
      renderHomePage();
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      ws.receiveMessage({
        type: 'initialData',
        data: {
          blockchainInfo: {
            blocks: 123456789
          },
          txOutsetInfo: {
            total_amount: 12345678901.234
          }
        }
      });
      
      await waitFor(() => {
        expect(screen.getByText('123,456,789')).toBeInTheDocument(); // Block height with commas
        expect(screen.getByText('12,345,678,901.23 DGB')).toBeInTheDocument(); // Supply with commas
      });
    });
  });

  describe('User Interactions', () => {
    it('should have clickable cards with hover effects', async () => {
      renderHomePage();
      
      // Wait for WebSocket data to populate cards
      await waitForAsync();
      
      // Look for stat card titles
      expect(screen.getByText('Total Blocks')).toBeInTheDocument();
      expect(screen.getByText('Total Transactions')).toBeInTheDocument();
      expect(screen.getByText('Total Size')).toBeInTheDocument();
    });

    it('should handle rapid WebSocket updates', async () => {
      // SKIPPED: HomePage has a bug where it doesn't check blockchainInfo.softforks before calling Object.entries()
      renderHomePage();
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      // Send multiple rapid updates
      for (let i = 0; i < 10; i++) {
        ws.receiveMessage({
          type: 'initialData',
          data: {
            blockchainInfo: {
              blocks: 17456789 + i
            }
          }
        });
      }
      
      await waitFor(() => {
        expect(screen.getByText('17,456,798')).toBeInTheDocument(); // Last update
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed WebSocket messages', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      renderHomePage();
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      // Send malformed data through the mock's receiveMessage
      // The mock WebSocket will parse this, so we need to simulate the error differently
      ws.receiveMessage({ type: 'error', data: null });
      
      // Should not crash and continue to display
      expect(screen.getByText('DigiByte Blockchain Statistics')).toBeInTheDocument();
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle missing data gracefully', async () => {
      // SKIPPED: HomePage has a bug where it doesn't check blockchainInfo.softforks before calling Object.entries()
      renderHomePage();
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      // Send incomplete data
      ws.receiveMessage({
        type: 'initialData',
        data: {
          blockchainInfo: {
            blocks: 12345
          }
          // Missing other required fields
        }
      });
      
      await waitFor(() => {
        expect(screen.getByText('12,345')).toBeInTheDocument(); // Should update what's available
        const loadingElements = screen.getAllByText('Loading...');
        expect(loadingElements.length).toBeGreaterThan(0); // Missing data shows loading
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      // SKIPPED: HomePage has a bug where it doesn't check blockchainInfo.softforks before calling Object.entries()
      renderHomePage();
      
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('DigiByte Blockchain Statistics');
      
      // Wait for WebSocket data to populate stat cards with h6 headings
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      ws.receiveMessage({
        type: 'initialData',
        data: {
          blockchainInfo: {
            blocks: 17456789
          }
        }
      });
      
      await waitFor(() => {
        const headings = screen.getAllByRole('heading');
        expect(headings.length).toBeGreaterThan(1);
      });
    });

    it('should have descriptive text for screen readers', () => {
      renderHomePage();
      
      // Check for descriptive content
      expect(screen.getByText(/This is a free & open source website/)).toBeInTheDocument();
      expect(screen.getByText(/Total blocks in the DigiByte blockchain since the chain was started/)).toBeInTheDocument();
    });
  });
});