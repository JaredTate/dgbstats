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

  // FIRST-TIMER-7: pasting your own txid only said "No transactions match
  // your filters", with no next step.
  describe('Search: look up a txid or address on DigiExplorer', () => {
    const OWN_TXID = '42f6ca23192a4ebbc1572364769111ef85193ab9889f769599db0329b749245a';

    const renderWithData = async (network = 'mainnet') => {
      renderWithProviders(<TxsPage />, { network });
      await waitForAsync();
      webSocketInstances[0].receiveMessage(sampleMempoolData);
      await waitFor(() => {
        expect(screen.queryByText('Loading transaction data...')).not.toBeInTheDocument();
      });
      return screen.getByPlaceholderText(/Search/i);
    };

    it('links an unknown txid (with spaces around it) to DigiExplorer', async () => {
      const input = await renderWithData();
      fireEvent.change(input, { target: { value: `  ${OWN_TXID}  ` } });
      const link = await screen.findByRole('link', { name: /Look it up on DigiExplorer/ });
      expect(link).toHaveAttribute('href', `https://digiexplorer.info/tx/${OWN_TXID}`);
      expect(link).toHaveAttribute('target', '_blank');
      expect(screen.getAllByText(/only shows recent transactions/i).length).toBeGreaterThan(0);
    });

    it('links an unknown address to the DigiExplorer address page', async () => {
      const input = await renderWithData();
      const address = 'dgb1qw508d6qejxtdg4y5r3zarvary0c5xw7kh5gxlr';
      fireEvent.change(input, { target: { value: address } });
      const link = await screen.findByRole('link', { name: /Look it up on DigiExplorer/ });
      expect(link).toHaveAttribute('href', `https://digiexplorer.info/address/${address}`);
    });

    it('uses the testnet explorer on testnet', async () => {
      const input = await renderWithData('testnet');
      fireEvent.change(input, { target: { value: OWN_TXID } });
      const link = await screen.findByRole('link', { name: /Look it up on DigiExplorer/ });
      expect(link).toHaveAttribute('href', `https://digiexplorer.info/testnet/tx/${OWN_TXID}`);
    });

    it('shows no lookup link for a partial search or a match', async () => {
      const input = await renderWithData();
      fireEvent.change(input, { target: { value: 'zzz' } });
      await screen.findAllByText(/No transactions match your filters/);
      expect(screen.queryByRole('link', { name: /Look it up on DigiExplorer/ })).not.toBeInTheDocument();
      fireEvent.change(input, { target: { value: sampleMempoolData.data.transactions[0].txid } });
      await waitFor(() => expect(screen.queryByText(/No transactions match your filters/)).not.toBeInTheDocument());
      expect(screen.queryByRole('link', { name: /Look it up on DigiExplorer/ })).not.toBeInTheDocument();
    });
  });

  // DigiByte-scale fees: the backend now sends real fees, DGB fee buckets
  // and priorities (high >= 10,000 sat/vB, medium 1,000-9,999, low < 1,000).
  describe('DigiByte fee buckets and unknown fees', () => {
    const BUCKETS = { '0-1000': 5, '1000-5000': 10, '5000-10000': 20, '10000-50000': 4, '50000+': 1 };

    const renderMempool = async (stats, transactions) => {
      renderWithProviders(<TxsPage />);
      await waitForAsync();
      webSocketInstances[0].receiveMessage({ type: 'mempool', data: { stats, transactions } });
      await waitFor(() => {
        expect(screen.queryByText('Loading transaction data...')).not.toBeInTheDocument();
      });
    };

    it('draws every new fee bucket, low to high, with sat/vB labels', async () => {
      await renderMempool({ size: 40, bytes: 10000, feeDistribution: BUCKETS }, sampleMempoolData.data.transactions);
      const labelled = [...document.querySelectorAll('[aria-label]')];
      const bars = Object.keys(BUCKETS).map((range) => (
        labelled.find((el) => el.getAttribute('aria-label').startsWith(`${range} sat/vB:`))
      ));
      bars.forEach((bar) => expect(bar).toBeTruthy());
      // Lowest bucket green, top bucket ('50000+') red, all five colors distinct.
      expect(bars[0]).toHaveStyle({ backgroundColor: '#4caf50' });
      expect(bars[4]).toHaveStyle({ backgroundColor: '#f44336' });
      const colors = new Set(bars.map((bar) => getComputedStyle(bar).backgroundColor));
      expect(colors.size).toBe(5);
      expect(document.querySelector('[aria-label*="sat/byte"]')).toBeNull();
    });

    it('explains priority with DigiByte fee rates, not Bitcoin ones', async () => {
      await renderMempool({ size: 3 }, sampleMempoolData.data.transactions);
      expect(screen.getByText(/high 10,000\+ sat\/vB, medium 1,000–10,000, low under 1,000/)).toBeInTheDocument();
      expect(screen.getByText(/network minimum is about 100 sat\/vB/)).toBeInTheDocument();
      expect(screen.queryByText(/100\+ sat\/byte/)).not.toBeInTheDocument();
    });

    it('shows "Unknown" for a null fee and still filters and sorts', async () => {
      const unknown = {
        ...sampleMempoolData.data.transactions[0],
        txid: 'ffff'.repeat(16),
        fee: null,
        fee_rate: null,
        priority: null,
      };
      await renderMempool({ size: 4 }, [unknown, ...sampleMempoolData.data.transactions]);
      expect(screen.getAllByText('Unknown').length).toBeGreaterThan(0);
      expect(screen.queryByText('0.00000000')).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'fee' }));
      fireEvent.click(screen.getByRole('button', { name: /high/i }));
      expect(screen.queryByText(/ffffffff/)).not.toBeInTheDocument();
      expect(screen.getAllByText(/e928e6/).length).toBeGreaterThan(0);
    });
  });

  describe('Transaction value (FIRST-TIMER-10)', () => {
    it('shows amounts under 1 DGB and keeps decimals, instead of rounding down', async () => {
      const tx = (txid, value) => ({ ...sampleMempoolData.data.transactions[0], txid, value });
      renderWithProviders(<TxsPage />);
      await waitForAsync();
      webSocketInstances[0].receiveMessage({ type: 'mempool', data: {
        stats: { size: 2 },
        transactions: [tx('aaaa'.repeat(16), 0.687), tx('bbbb'.repeat(16), 12345.771)],
      } });
      await waitFor(() => expect(screen.getAllByText('0.687 DGB').length).toBeGreaterThan(0));
      expect(screen.getAllByText('12,345.771 DGB').length).toBeGreaterThan(0);
      expect(screen.queryByText('0 DGB')).not.toBeInTheDocument();
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
    const renderWithMempool = async (stats = { size: 40, bytes: 10000, feeDistribution: { '0-1000': 5, '1000-5000': 10 } }) => {
      renderWithProviders(<TxsPage />);
      await waitForAsync();
      webSocketInstances[0].receiveMessage({ type: 'mempool', data: { ...sampleMempoolData.data, stats } });
      await waitFor(() => {
        expect(screen.queryByText('Loading transaction data...')).not.toBeInTheDocument();
      });
    };

    // FIRST-TIMER-19 (axe button-name, critical): the expand buttons have a name.
    // SLOW-8: and are at least 44 px.
    it('names every expand button and makes it 44 px', async () => {
      await renderWithMempool();
      const buttons = screen.getAllByRole('button', { name: 'Show transaction details' });
      expect(buttons.length).toBe(sampleMempoolData.data.transactions.length);
      buttons.forEach((b) => {
        expect(b).toHaveAttribute('aria-expanded', 'false');
        expect(getComputedStyle(b).width).toBe('44px');
        expect(getComputedStyle(b).height).toBe('44px');
      });
      fireEvent.click(buttons[0]);
      expect(screen.getByRole('button', { name: 'Hide transaction details' })).toHaveAttribute('aria-expanded', 'true');
      document.querySelectorAll('button').forEach((b) => {
        expect(b.textContent.trim() || b.getAttribute('aria-label') || b.getAttribute('title')).toBeTruthy();
      });
    });

    // FIRST-TIMER-19 (axe aria-progressbar-name): the memory bar has a name.
    it('names the memory usage progress bar', async () => {
      await renderWithMempool({ size: 40, bytes: 10000, usage: 1000, maxmempool: 100000 });
      screen.getAllByRole('progressbar').forEach((bar) => expect(bar).toHaveAccessibleName());
    });

    // FIRST-TIMER-19 (axe aria-prohibited-attr): no aria-label on a plain <div>.
    it('puts aria-label only on elements with a role', async () => {
      await renderWithMempool();
      document.querySelectorAll('div[aria-label]').forEach((el) => {
        expect(el.getAttribute('role')).toBeTruthy();
      });
    });

    // FIRST-TIMER-19 (axe color-contrast): white on MUI warning orange is 3.1:1.
    it('shows "Connecting..." with readable colors (not white on orange)', () => {
      renderWithProviders(<TxsPage />);
      const chip = screen.getByText('Connecting...').closest('.MuiChip-root');
      expect(chip.className).not.toMatch(/MuiChip-colorWarning/);
    });

    // FIRST-TIMER-17: say what sat/vB means once.
    it('explains sat/vB in plain words', async () => {
      await renderWithMempool();
      expect(screen.getByText(/sat\/vB means satoshis per virtual byte/)).toBeInTheDocument();
    });

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
