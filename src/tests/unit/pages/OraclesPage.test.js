import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, act } from '@testing-library/react';
import OraclesPage from '../../../pages/OraclesPage';
import { renderWithProviders, createWebSocketMock, waitForAsync } from '../../utils/testUtils';

// Mock data matching the WebSocket message format
// Backend sends: { type: 'oracleData', data: { price, allPrices, oracles } }
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
    { oracle_id: 7, name: 'LookInto', endpoint: 'oracle8.digibyte.io:12030', price_micro_usd: 0, price_usd: 0, timestamp: 0, deviation_pct: 0, signature_valid: false, status: 'no_data' },
  ]
};

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

// Combined message that backend sends via WebSocket
const mockOracleDataMessage = {
  type: 'oracleData',
  data: {
    price: mockOraclePrice,
    allPrices: mockAllOraclePrices,
    oracles: mockOracles
  }
};

// Helper to send oracle data via WebSocket
function sendOracleData(ws, overrides = {}) {
  const data = {
    ...mockOracleDataMessage.data,
    ...overrides
  };
  ws.receiveMessage({ type: 'oracleData', data });
}

describe('OraclesPage', () => {
  let wsSetup;
  let mockWebSocket;
  let webSocketInstances;

  beforeEach(() => {
    wsSetup = createWebSocketMock();
    mockWebSocket = wsSetup.MockWebSocket;
    webSocketInstances = wsSetup.instances;
    global.WebSocket = mockWebSocket;
  });

  afterEach(() => {
    webSocketInstances.forEach(ws => ws.close());
    wsSetup.clearInstances();
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the hero section with title and description', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });

      expect(screen.getByText('DigiDollar Testnet Oracles')).toBeInTheDocument();
      expect(screen.getByText('Decentralized Price Feed Network')).toBeInTheDocument();
      expect(screen.getByText(/oracle network provides real-time DGB\/USD price feeds/)).toBeInTheDocument();
    });

    it('should render the current price card', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendOracleData(ws);

      await waitFor(() => {
        expect(screen.getByText('Testnet Oracle Price')).toBeInTheDocument();
        expect(screen.getByText('DGB/USD Price')).toBeInTheDocument();
        expect(screen.getByText('Network Oracles')).toBeInTheDocument();
        expect(screen.getByText('Last Update')).toBeInTheDocument();
      });
    });

    it('should render the what are oracles section', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });

      expect(screen.getByText('What Are Oracles?')).toBeInTheDocument();
      expect(screen.getByText(/The Blockchain Blind Spot:/)).toBeInTheDocument();
      expect(screen.getByText('How It Works:')).toBeInTheDocument();
    });

    it('should render the become an oracle operator section', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });

      expect(screen.getByText('Become an Oracle Operator')).toBeInTheDocument();
      expect(screen.getByText('Step 1: Create Oracle Key')).toBeInTheDocument();
      expect(screen.getByText('Step 2: Submit Public Key')).toBeInTheDocument();
      expect(screen.getByText('Step 3: Start Oracle')).toBeInTheDocument();
    });

    it('should render the oracle network table section', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];
      sendOracleData(ws);

      await waitFor(() => {
        expect(screen.getByText('Testnet Oracle Network')).toBeInTheDocument();
      });
      expect(screen.getByText('Oracle')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Price')).toBeInTheDocument();
      expect(screen.getByText('Endpoint')).toBeInTheDocument();
      expect(screen.getByText('Public Key')).toBeInTheDocument();
      expect(screen.getByText('Signature')).toBeInTheDocument();
    });

    it('should render the technical specifications section', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });

      expect(screen.getByText('Technical Specifications')).toBeInTheDocument();
      expect(screen.getByText('Phase Two (Testnet)')).toBeInTheDocument();
      expect(screen.getByText('Phase Two (Mainnet)')).toBeInTheDocument();
      expect(screen.getByText('Price Validation Limits:')).toBeInTheDocument();
    });

    it('should render resource links', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });

      const setupGuideLink = screen.getByRole('link', { name: /Oracle Setup Guide/i });
      expect(setupGuideLink).toHaveAttribute('href', expect.stringContaining('DIGIDOLLAR_ORACLE_SETUP.md'));

      const githubLink = screen.getByRole('link', { name: /Submit Your Key on GitHub/i });
      expect(githubLink).toHaveAttribute('href', 'https://github.com/DigiByte-Core/digibyte/issues');
    });
  });

  describe('WebSocket Connection', () => {
    it('should establish WebSocket connection on mount', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });

      await waitForAsync();

      expect(mockWebSocket).toHaveBeenCalledWith('ws://localhost:5003');
      expect(webSocketInstances.length).toBe(1);
      expect(webSocketInstances[0].readyState).toBe(WebSocket.OPEN);
    });

    it('should close WebSocket connection on unmount', async () => {
      const { unmount } = renderWithProviders(<OraclesPage />, { network: 'testnet' });

      await waitForAsync();
      const ws = webSocketInstances[0];

      unmount();

      expect(ws.readyState).toBe(WebSocket.CLOSED);
    });

    it('should update data on subsequent oracleData messages', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      // Send initial data
      sendOracleData(ws);

      await waitFor(() => {
        expect(screen.getByText('5/8')).toBeInTheDocument();
      });

      // Send updated data with 6 reporting oracles
      const updatedAllPrices = {
        ...mockAllOraclePrices,
        oracle_count: 6,
        oracles: mockAllOraclePrices.oracles.map(o =>
          o.oracle_id === 4 ? { ...o, price_micro_usd: 50000, price_usd: 0.05, timestamp: 1770064185, signature_valid: true, status: 'reporting' } : o
        )
      };

      sendOracleData(ws, {
        price: { ...mockOraclePrice, oracle_count: 6 },
        allPrices: updatedAllPrices
      });

      await waitFor(() => {
        expect(screen.getByText('6/8')).toBeInTheDocument();
      });
    });
  });

  describe('Data Display', () => {
    it('should display fetched oracle price data', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendOracleData(ws);

      await waitFor(() => {
        expect(screen.getByText('DGB/USD Price')).toBeInTheDocument();
        const priceText = screen.getAllByText(/\$0\.00/);
        expect(priceText.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('should display network oracle count from fetched data', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendOracleData(ws);

      await waitFor(() => {
        expect(screen.getByText('5/8')).toBeInTheDocument();
      });
    });

    it('should show error state when WebSocket fails', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      ws.triggerError(new Error('Connection failed'));

      await waitFor(() => {
        expect(screen.getByText(/Unable to connect to oracle data feed/)).toBeInTheDocument();
      });
    });

    it('should still render page structure when WebSocket errors', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      ws.triggerError(new Error('Connection failed'));

      await waitFor(() => {
        expect(screen.getByText('DigiDollar Testnet Oracles')).toBeInTheDocument();
      });
    });
  });

  describe('Oracle Table', () => {
    it('should display oracle names in the table', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendOracleData(ws);

      await waitFor(() => {
        expect(screen.getByText('Jared')).toBeInTheDocument();
        expect(screen.getByText('Green Candle')).toBeInTheDocument();
        expect(screen.getByText('Bastian')).toBeInTheDocument();
      });
    });

    it('should display reporting status correctly', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendOracleData(ws);

      await waitFor(() => {
        const reportingChips = screen.getAllByText('reporting');
        expect(reportingChips.length).toBeGreaterThan(0);
        const noDataChips = screen.getAllByText('no data');
        expect(noDataChips.length).toBeGreaterThan(0);
      });
    });

    it('should display oracle endpoints', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendOracleData(ws);

      await waitFor(() => {
        expect(screen.getByText('oracle1.digibyte.io:12030')).toBeInTheDocument();
        expect(screen.getByText('oracle2.digibyte.io:12030')).toBeInTheDocument();
      });
    });
  });

  describe('Technical Details', () => {
    it('should display phase two testnet specifications', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });

      const consensus = screen.getAllByText(/5-of-8 oracle consensus/);
      expect(consensus.length).toBeGreaterThan(0);
      expect(screen.getByText(/10 oracle slots/)).toBeInTheDocument();
      expect(screen.getByText(/Price updates every 15 seconds/)).toBeInTheDocument();
      const schnorr = screen.getAllByText(/BIP-340 Schnorr signatures/);
      expect(schnorr.length).toBeGreaterThan(0);
    });

    it('should display phase two mainnet specifications', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });

      expect(screen.getByText(/8-of-15 Schnorr threshold signatures/)).toBeInTheDocument();
      expect(screen.getByText(/30 oracle slots/)).toBeInTheDocument();
      expect(screen.getByText(/15 active oracles per epoch/)).toBeInTheDocument();
    });

    it('should display price validation limits', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });

      expect(screen.getByText(/Min: \$0.0001\/DGB/)).toBeInTheDocument();
      expect(screen.getByText(/Max: \$100.00\/DGB/)).toBeInTheDocument();
      expect(screen.getByText(/Valid for 20 blocks/)).toBeInTheDocument();
    });
  });

  describe('Stale/Fresh Status', () => {
    it('should display Fresh chip when is_stale is false', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendOracleData(ws);

      await waitFor(() => {
        expect(screen.getByText('Fresh')).toBeInTheDocument();
      });
    });

    it('should display Stale chip when is_stale is true', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendOracleData(ws, {
        price: { ...mockOraclePrice, is_stale: true }
      });

      await waitFor(() => {
        expect(screen.getByText('Stale')).toBeInTheDocument();
      });
    });

    it('should display last update block height', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendOracleData(ws);

      await waitFor(() => {
        expect(screen.getByText('Block 2,000')).toBeInTheDocument();
      });
    });
  });

  describe('Oracle 7 (LookInto)', () => {
    it('should display all 8 oracles including LookInto', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendOracleData(ws);

      await waitFor(() => {
        expect(screen.getByText('LookInto')).toBeInTheDocument();
        expect(screen.getByText('oracle8.digibyte.io:12030')).toBeInTheDocument();
      });
    });

    it('should show LookInto with no data status', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendOracleData(ws);

      await waitFor(() => {
        expect(screen.getByText('LookInto')).toBeInTheDocument();
        const noDataChips = screen.getAllByText('no data');
        expect(noDataChips.length).toBe(3);
      });
    });

    it('should correctly count 5 reporting oracles out of 8 total', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendOracleData(ws);

      await waitFor(() => {
        expect(screen.getByText('5/8')).toBeInTheDocument();
        expect(screen.getByText('Online Reporting')).toBeInTheDocument();
      });
    });
  });

  describe('Reporting Count Accuracy', () => {
    it('should count 6/8 when 6 oracles are reporting', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      const sixReporting = {
        ...mockAllOraclePrices,
        oracle_count: 6,
        oracles: mockAllOraclePrices.oracles.map(o =>
          o.oracle_id === 4 ? { ...o, price_micro_usd: 50000, price_usd: 0.05, timestamp: 1770064185, signature_valid: true, status: 'reporting' } : o
        )
      };

      sendOracleData(ws, {
        price: { ...mockOraclePrice, oracle_count: 6 },
        allPrices: sixReporting
      });

      await waitFor(() => {
        expect(screen.getByText('6/8')).toBeInTheDocument();
      });
    });

    it('should show reporting count from getalloracleprices not getoracleprice', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      // price says 3 but allPrices data shows 5 reporting
      sendOracleData(ws, {
        price: { ...mockOraclePrice, oracle_count: 3 }
      });

      await waitFor(() => {
        expect(screen.getByText('5/8')).toBeInTheDocument();
      });
    });

    it('should show 5 reporting chips and 3 no data chips', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendOracleData(ws);

      await waitFor(() => {
        const reportingChips = screen.getAllByText('reporting');
        expect(reportingChips.length).toBe(5);
        const noDataChips = screen.getAllByText('no data');
        expect(noDataChips.length).toBe(3);
      });
    });
  });

  describe('Network Context', () => {
    it('should apply testnet styling', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });

      const phaseTwo = screen.getAllByText(/Phase Two/);
      expect(phaseTwo.length).toBeGreaterThan(0);
      const consensus = screen.getAllByText(/5-of-8/);
      expect(consensus.length).toBeGreaterThan(0);
    });
  });

  describe('DigiDollar Activation Banner', () => {
    it('should show activation banner when DigiDollar is not active', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      ws.receiveMessage({ type: 'ddDeploymentData', data: { status: 'started' } });

      expect(screen.getByText(/DigiDollar is not active yet/)).toBeInTheDocument();
      expect(screen.getByText('STARTED')).toBeInTheDocument();
      expect(screen.getByText('Track Activation →')).toBeInTheDocument();
    });

    it('should not show activation banner when DigiDollar is active', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      ws.receiveMessage({ type: 'ddDeploymentData', data: { status: 'active' } });

      expect(screen.queryByText(/DigiDollar is not active yet/)).not.toBeInTheDocument();
    });

    it('should not show activation banner before deployment data arrives', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });
      await waitForAsync();

      expect(screen.queryByText(/DigiDollar is not active yet/)).not.toBeInTheDocument();
    });

    it('should show DEFINED stage in banner during defined phase', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      ws.receiveMessage({ type: 'ddDeploymentData', data: { status: 'defined' } });

      expect(screen.getByText(/DigiDollar is not active yet/)).toBeInTheDocument();
      expect(screen.getByText('DEFINED')).toBeInTheDocument();
    });

    it('should show LOCKED IN stage in banner during locked_in phase', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      ws.receiveMessage({ type: 'ddDeploymentData', data: { status: 'locked_in' } });

      expect(screen.getByText(/DigiDollar is not active yet/)).toBeInTheDocument();
      expect(screen.getByText('LOCKED IN')).toBeInTheDocument();
    });

    it('should have a link to the activation page', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      ws.receiveMessage({ type: 'ddDeploymentData', data: { status: 'started' } });

      const link = screen.getByText('Track Activation →');
      expect(link.closest('a')).toHaveAttribute('href', '/testnet/activation');
    });
  });
});
