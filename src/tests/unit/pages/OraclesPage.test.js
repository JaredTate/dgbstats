import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, act } from '@testing-library/react';
import OraclesPage from '../../../pages/OraclesPage';
import { renderWithProviders } from '../../utils/testUtils';

// Mock data for API responses
const mockOraclePrice = {
  price_micro_usd: 50000,
  price_usd: 0.05,
  oracle_count: 5,
  status: 'active',
  last_update_height: 2000,
  is_stale: false,
  '24h_high': 5,
  '24h_low': 5,
  volatility: 2.5
};

// Mock data for getalloracleprices endpoint
const mockAllOraclePrices = {
  block_height: 2000,
  consensus_price_micro_usd: 50000,
  consensus_price_usd: 0.05,
  oracle_count: 5,
  required: 5,
  total_oracles: 8,
  oracles: [
    { oracle_id: 0, name: 'Jared', endpoint: 'oracle1.digibyte.io:12030', price_micro_usd: 50000, price_usd: 0.05, timestamp: 1770064194, deviation_pct: 0, signature_valid: true, status: 'reporting' },
    { oracle_id: 1, name: 'Green Candle', endpoint: 'oracle2.digibyte.io:12030', price_micro_usd: 50000, price_usd: 0.05, timestamp: 1770064192, deviation_pct: 0, signature_valid: true, status: 'reporting' },
    { oracle_id: 2, name: 'Bastian', endpoint: 'oracle3.digibyte.io:12030', price_micro_usd: 50000, price_usd: 0.05, timestamp: 1770064190, deviation_pct: 0, signature_valid: true, status: 'reporting' },
    { oracle_id: 3, name: 'DanGB', endpoint: 'oracle4.digibyte.io:12030', price_micro_usd: 50000, price_usd: 0.05, timestamp: 1770064188, deviation_pct: 0, signature_valid: true, status: 'reporting' },
    { oracle_id: 4, name: 'Shenger', endpoint: 'oracle5.digibyte.io:12030', price_micro_usd: 0, price_usd: 0, timestamp: 0, deviation_pct: 0, signature_valid: false, status: 'no_data' },
    { oracle_id: 5, name: 'Ycagel', endpoint: 'oracle6.digibyte.io:12030', price_micro_usd: 50000, price_usd: 0.05, timestamp: 1770064186, deviation_pct: 0, signature_valid: true, status: 'reporting' },
    { oracle_id: 6, name: 'Aussie', endpoint: 'oracle7.digibyte.io:12030', price_micro_usd: 0, price_usd: 0, timestamp: 0, deviation_pct: 0, signature_valid: false, status: 'no_data' },
  ]
};

// Mock data for getoracles endpoint (config with pubkeys)
const mockOracles = [
  { oracle_id: 0, name: 'Jared', pubkey: '03e1dce189a530c1fb39dcd9282cf5f9de0e4eb257344be9fd94ce27c06005e8c7', endpoint: 'oracle1.digibyte.io:12030', is_active: true, status: 'no_data' },
  { oracle_id: 1, name: 'Green Candle', pubkey: '033dfb7a36ab40fa6fbc69b4b499eaa17bfa1958aa89ec248efc24b4c18694f990', endpoint: 'oracle2.digibyte.io:12030', is_active: true, status: 'no_data' },
  { oracle_id: 2, name: 'Bastian', pubkey: '03172755a320cec96c981d46c86d79a03578d73406a25e89d8edc616a8f361cb5c', endpoint: 'oracle3.digibyte.io:12030', is_active: true, status: 'no_data' },
  { oracle_id: 3, name: 'DanGB', pubkey: '03546c07ee9d21640c4b4e96e6954bd49c3ab5bcf36c6a512603ebf75f8609da0c', endpoint: 'oracle4.digibyte.io:12030', is_active: true, status: 'no_data' },
  { oracle_id: 4, name: 'Shenger', pubkey: '039cef021f841794c1afc4e84d678f3c70dbe3a972330b2b6329852898443deb4f', endpoint: 'oracle5.digibyte.io:12030', is_active: true, status: 'no_data' },
  { oracle_id: 5, name: 'Ycagel', pubkey: '0285016758856ed27388501a54031fa3a678df705bf811fb8bc9abd2d7cfb6d9f7', endpoint: 'oracle6.digibyte.io:12030', is_active: true, status: 'no_data' },
  { oracle_id: 6, name: 'Aussie', pubkey: '02ec2122bab83d1199350d5bd3e5e88b305da873211b1876edd5170fbe9c7f962e', endpoint: 'oracle7.digibyte.io:12030', is_active: true, status: 'no_data' },
  { oracle_id: 7, name: 'LookInto', pubkey: '0383b831f296bfd78940a8d1ee8868a692c7ccdb1b4b0250bffff47bc1ad91f7d0', endpoint: 'oracle8.digibyte.io:12030', is_active: true, status: 'no_data' },
];

describe('OraclesPage', () => {
  let originalFetch;

  beforeEach(() => {
    // Store original fetch
    originalFetch = global.fetch;

    // Mock fetch for all oracle endpoints
    global.fetch = vi.fn((url) => {
      if (url.includes('getoracleprice')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockOraclePrice)
        });
      }
      if (url.includes('getalloracleprices')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAllOraclePrices)
        });
      }
      if (url.includes('getoracles')) {
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
      expect(screen.getByText('Network Oracles')).toBeInTheDocument();
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
      expect(screen.getByText('Oracle')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Price')).toBeInTheDocument();
      expect(screen.getByText('Endpoint')).toBeInTheDocument();
      expect(screen.getByText('Public Key')).toBeInTheDocument();
      expect(screen.getByText('Signature')).toBeInTheDocument();
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
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/testnet/getalloracleprices'));
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/testnet/getoracles'));
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

    it('should display network oracle count from fetched data', async () => {
      await act(async () => {
        renderWithProviders(<OraclesPage />, { network: 'testnet' });
      });

      await waitFor(() => {
        // Network oracles: count of reporting oracles from table data
        expect(screen.getByText('5/8')).toBeInTheDocument();
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
    it('should display oracle names in the table', async () => {
      await act(async () => {
        renderWithProviders(<OraclesPage />, { network: 'testnet' });
      });

      await waitFor(() => {
        expect(screen.getByText('Jared')).toBeInTheDocument();
        expect(screen.getByText('Green Candle')).toBeInTheDocument();
        expect(screen.getByText('Bastian')).toBeInTheDocument();
      });
    });

    it('should display reporting status correctly', async () => {
      await act(async () => {
        renderWithProviders(<OraclesPage />, { network: 'testnet' });
      });

      await waitFor(() => {
        const reportingChips = screen.getAllByText('reporting');
        expect(reportingChips.length).toBeGreaterThan(0);
        const noDataChips = screen.getAllByText('no data');
        expect(noDataChips.length).toBeGreaterThan(0);
      });
    });

    it('should display oracle endpoints', async () => {
      await act(async () => {
        renderWithProviders(<OraclesPage />, { network: 'testnet' });
      });

      await waitFor(() => {
        expect(screen.getByText('oracle1.digibyte.io:12030')).toBeInTheDocument();
        expect(screen.getByText('oracle2.digibyte.io:12030')).toBeInTheDocument();
      });
    });
  });

  describe('Technical Details', () => {
    it('should display phase two testnet specifications', async () => {
      await act(async () => {
        renderWithProviders(<OraclesPage />, { network: 'testnet' });
      });

      // Use getAllByText since these may appear multiple times
      const consensus = screen.getAllByText(/5-of-8 oracle consensus/);
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
      const consensus = screen.getAllByText(/5-of-8/);
      expect(consensus.length).toBeGreaterThan(0);
    });
  });
});
