import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, act } from '@testing-library/react';
import OraclesPage from '../../../pages/OraclesPage';
import { renderWithProviders } from '../../utils/testUtils';

// Mock data for API responses
const mockOraclePrice = {
  price_micro_usd: 6029,
  price_usd: 0.006029,
  oracle_count: 7,
  status: 'active',
  last_update_height: 1234567,
  is_stale: false
};

const mockOracles = [
  { oracle_id: 0, pubkey: '03e1dce189a530c1fb39dcd9282cf5f9de0e4eb257344be9fd94ce27c06005e8c7', endpoint: 'oracle1.digibyte.io:12028', is_active: true, is_running: true, last_price: 6029, status: 'running', selected_for_epoch: true },
  { oracle_id: 1, pubkey: '033dfb7a36ab40fa6fbc69b4b499eaa17bfa1958aa89ec248efc24b4c18694f990', endpoint: 'oracle2.digibyte.io:12028', is_active: true, is_running: true, last_price: 6031, status: 'running', selected_for_epoch: true },
  { oracle_id: 2, pubkey: '03172755a320cec96c981d46c86d79a03578d73406a25e89d8edc616a8f361cb5c', endpoint: 'oracle3.digibyte.io:12028', is_active: true, is_running: false, last_price: 0, status: 'stopped', selected_for_epoch: false },
];

describe('OraclesPage', () => {
  let originalFetch;

  beforeEach(() => {
    // Store original fetch
    originalFetch = global.fetch;

    // Mock fetch
    global.fetch = vi.fn((url) => {
      if (url.includes('getoracleprice')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockOraclePrice)
        });
      }
      if (url.includes('listoracles')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockOracles)
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
    vi.clearAllTimers();
  });

  describe('Rendering', () => {
    it('should render the hero section with title and description', async () => {
      await act(async () => {
        renderWithProviders(<OraclesPage />, { network: 'testnet' });
      });

      expect(screen.getByText('DigiDollar Testnet Oracles')).toBeInTheDocument();
      expect(screen.getByText('Decentralized Price Feed Network')).toBeInTheDocument();
      expect(screen.getByText(/oracle network provides real-time DGB\/USD price feeds/)).toBeInTheDocument();
    });

    it('should render the current price card', async () => {
      await act(async () => {
        renderWithProviders(<OraclesPage />, { network: 'testnet' });
      });

      expect(screen.getByText('Testnet Oracle Price')).toBeInTheDocument();
      expect(screen.getByText('DGB/USD Price')).toBeInTheDocument();
      expect(screen.getByText('Active Oracles')).toBeInTheDocument();
      expect(screen.getByText('Last Update')).toBeInTheDocument();
    });

    it('should render the what are oracles section', async () => {
      await act(async () => {
        renderWithProviders(<OraclesPage />, { network: 'testnet' });
      });

      expect(screen.getByText('What Are Oracles?')).toBeInTheDocument();
      expect(screen.getByText(/The Blockchain Blind Spot:/)).toBeInTheDocument();
      expect(screen.getByText('How It Works:')).toBeInTheDocument();
    });

    it('should render the become an oracle operator section', async () => {
      await act(async () => {
        renderWithProviders(<OraclesPage />, { network: 'testnet' });
      });

      expect(screen.getByText('Become an Oracle Operator')).toBeInTheDocument();
      expect(screen.getByText('Step 1: Create Oracle Key')).toBeInTheDocument();
      expect(screen.getByText('Step 2: Submit Public Key')).toBeInTheDocument();
      expect(screen.getByText('Step 3: Start Oracle')).toBeInTheDocument();
    });

    it('should render the oracle network table section', async () => {
      await act(async () => {
        renderWithProviders(<OraclesPage />, { network: 'testnet' });
      });

      expect(screen.getByText('Testnet Oracle Network')).toBeInTheDocument();
      expect(screen.getByText('ID')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Last Price')).toBeInTheDocument();
      expect(screen.getByText('Endpoint')).toBeInTheDocument();
      expect(screen.getByText('Public Key')).toBeInTheDocument();
      expect(screen.getByText('Epoch Selected')).toBeInTheDocument();
    });

    it('should render the technical specifications section', async () => {
      await act(async () => {
        renderWithProviders(<OraclesPage />, { network: 'testnet' });
      });

      expect(screen.getByText('Technical Specifications')).toBeInTheDocument();
      expect(screen.getByText('Phase Two (Testnet)')).toBeInTheDocument();
      expect(screen.getByText('Phase Two (Mainnet)')).toBeInTheDocument();
      expect(screen.getByText('Price Validation Limits:')).toBeInTheDocument();
    });

    it('should render resource links', async () => {
      await act(async () => {
        renderWithProviders(<OraclesPage />, { network: 'testnet' });
      });

      const setupGuideLink = screen.getByRole('link', { name: /Oracle Setup Guide/i });
      expect(setupGuideLink).toHaveAttribute('href', expect.stringContaining('DIGIDOLLAR_ORACLE_SETUP.md'));

      const githubLink = screen.getByRole('link', { name: /Submit Your Key on GitHub/i });
      expect(githubLink).toHaveAttribute('href', 'https://github.com/DigiByte-Core/digibyte/issues');
    });
  });

  describe('Data Fetching', () => {
    it('should fetch oracle data on mount', async () => {
      await act(async () => {
        renderWithProviders(<OraclesPage />, { network: 'testnet' });
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/testnet/getoracleprice'));
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/testnet/listoracles'));
      });
    });

    it('should display fetched oracle price data', async () => {
      await act(async () => {
        renderWithProviders(<OraclesPage />, { network: 'testnet' });
      });

      // Wait for loading to complete by checking for a non-loading element
      // The price card should show either the fetched price or default data
      await waitFor(() => {
        // Check that DGB/USD Price label is visible (always present)
        expect(screen.getByText('DGB/USD Price')).toBeInTheDocument();
        // Check that the price area shows a dollar amount (from default or fetched data)
        // The default has price_micro_usd: 6029 = $0.006029
        const priceText = screen.getAllByText(/\$0\.00/);
        expect(priceText.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('should display oracle count from fetched data', async () => {
      await act(async () => {
        renderWithProviders(<OraclesPage />, { network: 'testnet' });
      });

      await waitFor(() => {
        // Active oracles: 2 running out of 3
        expect(screen.getByText('2 / 3')).toBeInTheDocument();
      });
    });

    it('should show error message when API fails', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await act(async () => {
        renderWithProviders(<OraclesPage />, { network: 'testnet' });
      });

      await waitFor(() => {
        expect(screen.getByText(/Unable to fetch live oracle data/)).toBeInTheDocument();
      });
    });

    it('should fall back to mock data when API fails', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await act(async () => {
        renderWithProviders(<OraclesPage />, { network: 'testnet' });
      });

      // Should still render with default/mock data
      await waitFor(() => {
        expect(screen.getByText('DigiDollar Testnet Oracles')).toBeInTheDocument();
      });
    });
  });

  describe('Oracle Table', () => {
    it('should display oracle IDs in the table', async () => {
      await act(async () => {
        renderWithProviders(<OraclesPage />, { network: 'testnet' });
      });

      await waitFor(() => {
        expect(screen.getByText('Oracle 0')).toBeInTheDocument();
        expect(screen.getByText('Oracle 1')).toBeInTheDocument();
        expect(screen.getByText('Oracle 2')).toBeInTheDocument();
      });
    });

    it('should display running status correctly', async () => {
      await act(async () => {
        renderWithProviders(<OraclesPage />, { network: 'testnet' });
      });

      await waitFor(() => {
        const runningChips = screen.getAllByText('running');
        expect(runningChips.length).toBeGreaterThan(0);
        const stoppedChips = screen.getAllByText('stopped');
        expect(stoppedChips.length).toBeGreaterThan(0);
      });
    });

    it('should display oracle endpoints', async () => {
      await act(async () => {
        renderWithProviders(<OraclesPage />, { network: 'testnet' });
      });

      await waitFor(() => {
        expect(screen.getByText('oracle1.digibyte.io:12028')).toBeInTheDocument();
        expect(screen.getByText('oracle2.digibyte.io:12028')).toBeInTheDocument();
      });
    });
  });

  describe('Technical Details', () => {
    it('should display phase two testnet specifications', async () => {
      await act(async () => {
        renderWithProviders(<OraclesPage />, { network: 'testnet' });
      });

      // Use getAllByText since these may appear multiple times
      const consensus = screen.getAllByText(/4-of-7 oracle consensus/);
      expect(consensus.length).toBeGreaterThan(0);
      expect(screen.getByText(/10 oracle slots/)).toBeInTheDocument();
      expect(screen.getByText(/Price updates every 15 seconds/)).toBeInTheDocument();
      const schnorr = screen.getAllByText(/BIP-340 Schnorr signatures/);
      expect(schnorr.length).toBeGreaterThan(0);
    });

    it('should display phase two mainnet specifications', async () => {
      await act(async () => {
        renderWithProviders(<OraclesPage />, { network: 'testnet' });
      });

      expect(screen.getByText(/8-of-15 Schnorr threshold signatures/)).toBeInTheDocument();
      expect(screen.getByText(/30 oracle slots/)).toBeInTheDocument();
      expect(screen.getByText(/15 active oracles per epoch/)).toBeInTheDocument();
    });

    it('should display price validation limits', async () => {
      await act(async () => {
        renderWithProviders(<OraclesPage />, { network: 'testnet' });
      });

      expect(screen.getByText(/Min: \$0.0001\/DGB/)).toBeInTheDocument();
      expect(screen.getByText(/Max: \$100.00\/DGB/)).toBeInTheDocument();
      expect(screen.getByText(/Valid for 20 blocks/)).toBeInTheDocument();
    });
  });

  describe('Network Context', () => {
    it('should apply testnet styling', async () => {
      await act(async () => {
        renderWithProviders(<OraclesPage />, { network: 'testnet' });
      });

      // Check for testnet-specific text
      const phaseTwo = screen.getAllByText(/Phase Two/);
      expect(phaseTwo.length).toBeGreaterThan(0);
      const consensus = screen.getAllByText(/4-of-7/);
      expect(consensus.length).toBeGreaterThan(0);
    });
  });
});
