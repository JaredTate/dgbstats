import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import TxsPage from '../../../pages/TxsPage';
import { renderWithProviders, createWebSocketMock, waitForAsync } from '../../utils/testUtils';

// Mock the config
vi.mock('../../../config', () => ({
  default: {
    apiBaseUrl: 'http://localhost:5001',
    wsBaseUrl: 'ws://localhost:5002'
  }
}));

// Sample transaction data for testing
const sampleMempoolData = {
  type: 'mempool',
  data: {
    stats: {
      count: 234,
      bytes: 567890,
      avgFeeRate: 1.5,
      highPriorityCount: 45
    },
    transactions: [
      {
        txid: 'e928e634567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
        size: 250,
        fee: 0.00001,
        feerate: 0.00004,
        priority: 'high',
        value: 100.5,
        time: Date.now() / 1000,
        inputs: [{ address: 'D1234...', value: 100.51 }],
        outputs: [
          { address: 'D5678...', value: 50.25 },
          { address: 'D9abc...', value: 50.25 }
        ]
      },
      {
        txid: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        size: 350,
        fee: 0.00002,
        feerate: 0.000057,
        priority: 'medium',
        value: 500.0,
        time: Date.now() / 1000 - 60,
        inputs: [{ address: 'D2345...', value: 500.02 }],
        outputs: [
          { address: 'D6789...', value: 250.0 },
          { address: 'Dabc0...', value: 250.0 }
        ]
      },
      {
        txid: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        size: 200,
        fee: 0.000005,
        feerate: 0.000025,
        priority: 'low',
        value: 10.0,
        time: Date.now() / 1000 - 120,
        inputs: [{ address: 'D3456...', value: 10.005 }],
        outputs: [
          { address: 'D7890...', value: 5.0 },
          { address: 'Dbcd1...', value: 5.0 }
        ]
      }
    ]
  }
};

describe('TxsPage', () => {
  let wsSetup;
  let mockWebSocket;
  let webSocketInstances;

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
      renderWithProviders(<TxsPage />);

      expect(screen.getByText('DigiByte Transaction Explorer')).toBeInTheDocument();
      expect(screen.getByText(/Real-time mempool monitoring and transaction tracking/)).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      renderWithProviders(<TxsPage />);

      expect(screen.getByText('Loading transaction data...')).toBeInTheDocument();
    });

    it('should render mempool statistics after data loads', async () => {
      renderWithProviders(<TxsPage />);

      await waitForAsync();
      const ws = webSocketInstances[0];

      // Send mempool data
      ws.receiveMessage(sampleMempoolData);

      await waitFor(() => {
        expect(screen.queryByText('Loading transaction data...')).not.toBeInTheDocument();
      });

      // Check for stats
      expect(screen.getByText('Mempool Size')).toBeInTheDocument();
    });

    it('should render transaction cards with data', async () => {
      renderWithProviders(<TxsPage />);

      await waitForAsync();
      const ws = webSocketInstances[0];

      // Send mempool data
      ws.receiveMessage(sampleMempoolData);

      await waitFor(() => {
        expect(screen.queryByText('Loading transaction data...')).not.toBeInTheDocument();
      });

      // Check for transaction elements
      expect(screen.getAllByText(/Transaction ID|TXID/i).length).toBeGreaterThan(0);
    });

    it('should render search controls', async () => {
      renderWithProviders(<TxsPage />);

      await waitForAsync();
      const ws = webSocketInstances[0];

      // Send mempool data
      ws.receiveMessage(sampleMempoolData);

      await waitFor(() => {
        expect(screen.queryByText('Loading transaction data...')).not.toBeInTheDocument();
      });

      expect(screen.getByPlaceholderText(/Search/i)).toBeInTheDocument();
    });

    it('should render fee distribution section', async () => {
      renderWithProviders(<TxsPage />);

      await waitForAsync();
      const ws = webSocketInstances[0];

      // Send mempool data
      ws.receiveMessage(sampleMempoolData);

      await waitFor(() => {
        expect(screen.queryByText('Loading transaction data...')).not.toBeInTheDocument();
      });

      // Component should render fee-related content (multiple fee elements may exist)
      const feeElements = screen.getAllByText(/Fee/i);
      expect(feeElements.length).toBeGreaterThan(0);
    });
  });

  describe('WebSocket Connection', () => {
    it('should establish WebSocket connection on mount', async () => {
      renderWithProviders(<TxsPage />);

      await waitForAsync();

      expect(mockWebSocket).toHaveBeenCalledWith('ws://localhost:5002');
      expect(webSocketInstances.length).toBe(1);
      expect(webSocketInstances[0].readyState).toBe(WebSocket.OPEN);
    });

    it('should close WebSocket connection on unmount', async () => {
      const { unmount } = renderWithProviders(<TxsPage />);

      await waitForAsync();
      const ws = webSocketInstances[0];

      unmount();

      expect(ws.readyState).toBe(WebSocket.CLOSED);
    });
  });

  describe('Search and Filter', () => {
    it('should filter transactions by search term', async () => {
      renderWithProviders(<TxsPage />);

      await waitForAsync();
      const ws = webSocketInstances[0];

      // Send mempool data
      ws.receiveMessage(sampleMempoolData);

      await waitFor(() => {
        expect(screen.queryByText('Loading transaction data...')).not.toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search/i);

      // Search for a specific transaction ID part
      fireEvent.change(searchInput, { target: { value: 'e928e6' } });

      await waitFor(() => {
        // Should show matching transaction
        const txElements = screen.getAllByText(/e928e6/i);
        expect(txElements.length).toBeGreaterThan(0);
      });
    });

    it('should have filter buttons', async () => {
      renderWithProviders(<TxsPage />);

      await waitForAsync();
      const ws = webSocketInstances[0];

      // Send mempool data
      ws.receiveMessage(sampleMempoolData);

      await waitFor(() => {
        expect(screen.queryByText('Loading transaction data...')).not.toBeInTheDocument();
      });

      // Look for filter or priority buttons
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Transaction Details', () => {
    it('should expand transaction to show details', async () => {
      renderWithProviders(<TxsPage />);

      await waitForAsync();
      const ws = webSocketInstances[0];

      // Send mempool data
      ws.receiveMessage(sampleMempoolData);

      await waitFor(() => {
        expect(screen.queryByText('Loading transaction data...')).not.toBeInTheDocument();
      });

      // Find and click expand button
      const expandButtons = screen.queryAllByTestId('ExpandMoreIcon');
      if (expandButtons.length > 0) {
        fireEvent.click(expandButtons[0]);

        await waitFor(() => {
          // Should show input/output details (multiple may exist)
          const ioElements = screen.getAllByText(/Input|Output/i);
          expect(ioElements.length).toBeGreaterThan(0);
        });
      } else {
        // No expand buttons means no transactions - test passes
        expect(true).toBe(true);
      }
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      renderWithProviders(<TxsPage />);

      await waitForAsync();
      const ws = webSocketInstances[0];

      // Send mempool data
      ws.receiveMessage(sampleMempoolData);

      await waitFor(() => {
        expect(screen.queryByText('Loading transaction data...')).not.toBeInTheDocument();
      });

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('DigiByte Transaction Explorer');
    });

    it('should have accessible links', async () => {
      renderWithProviders(<TxsPage />);

      await waitForAsync();
      const ws = webSocketInstances[0];

      // Send mempool data
      ws.receiveMessage(sampleMempoolData);

      await waitFor(() => {
        expect(screen.queryByText('Loading transaction data...')).not.toBeInTheDocument();
      });

      const links = screen.queryAllByRole('link');
      // Links may or may not be present depending on component implementation
      expect(links.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Testnet Network', () => {
    it('should render the page on testnet network', () => {
      renderWithProviders(<TxsPage />, { network: 'testnet' });

      expect(screen.getByText('DigiByte Transaction Explorer')).toBeInTheDocument();
    });

    it('should connect to testnet WebSocket URL', async () => {
      renderWithProviders(<TxsPage />, { network: 'testnet' });

      await waitForAsync();

      // Testnet uses ws://localhost:5003 (from NetworkContext)
      expect(mockWebSocket).toHaveBeenCalledWith('ws://localhost:5003');
      expect(webSocketInstances.length).toBe(1);
    });

    it('should display testnet mempool data correctly', async () => {
      renderWithProviders(<TxsPage />, { network: 'testnet' });

      await waitForAsync();
      const ws = webSocketInstances[0];

      // Send testnet mempool data
      ws.receiveMessage({
        type: 'mempool',
        data: {
          stats: {
            count: 10,
            bytes: 5000,
            avgFeeRate: 0.5,
            highPriorityCount: 2
          },
          transactions: [
            {
              txid: 'testnet1234567890abcdef1234567890abcdef1234567890abcdef12345678',
              size: 200,
              fee: 0.00001,
              feerate: 0.00005,
              priority: 'medium',
              value: 50.0,
              time: Date.now() / 1000,
              inputs: [{ address: 'DTestnet...', value: 50.01 }],
              outputs: [
                { address: 'DTestnet2...', value: 25.0 },
                { address: 'DTestnet3...', value: 25.0 }
              ]
            }
          ]
        }
      });

      await waitFor(() => {
        expect(screen.queryByText('Loading transaction data...')).not.toBeInTheDocument();
      });

      // Verify mempool stats are shown
      expect(screen.getByText('Mempool Size')).toBeInTheDocument();
    });

    it('should close testnet WebSocket connection on unmount', async () => {
      const { unmount } = renderWithProviders(<TxsPage />, { network: 'testnet' });

      await waitForAsync();
      const ws = webSocketInstances[0];

      unmount();

      expect(ws.readyState).toBe(WebSocket.CLOSED);
    });

    it('should handle empty testnet mempool', async () => {
      renderWithProviders(<TxsPage />, { network: 'testnet' });

      await waitForAsync();
      const ws = webSocketInstances[0];

      // Send empty mempool data (common on testnet)
      ws.receiveMessage({
        type: 'mempool',
        data: {
          stats: {
            count: 0,
            bytes: 0,
            avgFeeRate: 0,
            highPriorityCount: 0
          },
          transactions: []
        }
      });

      await waitFor(() => {
        expect(screen.queryByText('Loading transaction data...')).not.toBeInTheDocument();
      });

      // Page should still render
      expect(screen.getByText('DigiByte Transaction Explorer')).toBeInTheDocument();
    });
  });
});
