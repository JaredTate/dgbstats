import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, act } from '@testing-library/react';
import OraclesPage from '../../../pages/OraclesPage';
import { renderWithProviders, createWebSocketMock, waitForAsync } from '../../utils/testUtils';

// Mock data matching the WebSocket message format
// Backend sends: { type: 'oracleData', data: { price, allPrices, oracles } }
const mockOraclePrice = {
  price_micro_usd: 50000,
  price_usd: 0.05,
  oracle_count: 9,
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
  oracle_count: 9,
  required: 9,
  total_oracles: 17,
  oracles: [
    { oracle_id: 0, name: 'Jared', endpoint: 'oracle1.digibyte.io:12030', price_micro_usd: 50000, price_usd: 0.05, timestamp: 1770064194, deviation_pct: 0, signature_valid: true, status: 'reporting' },
    { oracle_id: 1, name: 'Green Candle', endpoint: 'oracle2.digibyte.io:12030', price_micro_usd: 50000, price_usd: 0.05, timestamp: 1770064192, deviation_pct: 0, signature_valid: true, status: 'reporting' },
    { oracle_id: 2, name: 'Bastian', endpoint: 'oracle3.digibyte.io:12030', price_micro_usd: 50000, price_usd: 0.05, timestamp: 1770064190, deviation_pct: 0, signature_valid: true, status: 'reporting' },
    { oracle_id: 3, name: 'DanGB', endpoint: 'oracle4.digibyte.io:12030', price_micro_usd: 50000, price_usd: 0.05, timestamp: 1770064188, deviation_pct: 0, signature_valid: true, status: 'reporting' },
    { oracle_id: 4, name: 'Shenger', endpoint: 'oracle5.digibyte.io:12030', price_micro_usd: 0, price_usd: 0, timestamp: 0, deviation_pct: 0, signature_valid: false, status: 'no_data' },
    { oracle_id: 5, name: 'Ycagel', endpoint: 'oracle6.digibyte.io:12030', price_micro_usd: 50000, price_usd: 0.05, timestamp: 1770064186, deviation_pct: 0, signature_valid: true, status: 'reporting' },
    { oracle_id: 6, name: 'Aussie', endpoint: 'oracle7.digibyte.io:12030', price_micro_usd: 0, price_usd: 0, timestamp: 0, deviation_pct: 0, signature_valid: false, status: 'no_data' },
    { oracle_id: 7, name: 'LookInto', endpoint: 'oracle8.digibyte.io:12030', price_micro_usd: 0, price_usd: 0, timestamp: 0, deviation_pct: 0, signature_valid: false, status: 'no_data' },
    { oracle_id: 8, name: 'JohnnyLawDGB', endpoint: 'oracle9.digibyte.io:12030', price_micro_usd: 50000, price_usd: 0.05, timestamp: 1770064184, deviation_pct: 0, signature_valid: true, status: 'reporting' },
    { oracle_id: 9, name: 'Ogilvie', endpoint: 'oracle10.digibyte.io:12030', price_micro_usd: 50000, price_usd: 0.05, timestamp: 1770064182, deviation_pct: 0, signature_valid: true, status: 'reporting' },
    { oracle_id: 10, name: 'ChopperBrian', endpoint: 'oracle11.digibyte.io:12030', price_micro_usd: 0, price_usd: 0, timestamp: 0, deviation_pct: 0, signature_valid: false, status: 'no_data' },
    { oracle_id: 11, name: 'hallvardo', endpoint: 'oracle12.digibyte.io:12030', price_micro_usd: 50000, price_usd: 0.05, timestamp: 1770064180, deviation_pct: 0, signature_valid: true, status: 'reporting' },
    { oracle_id: 12, name: 'DaPunzy', endpoint: 'oracle13.digibyte.io:12030', price_micro_usd: 0, price_usd: 0, timestamp: 0, deviation_pct: 0, signature_valid: false, status: 'no_data' },
    { oracle_id: 13, name: 'DigiByteForce', endpoint: 'oracle14.digibyte.io:12030', price_micro_usd: 50000, price_usd: 0.05, timestamp: 1770064178, deviation_pct: 0, signature_valid: true, status: 'reporting' },
    { oracle_id: 14, name: 'Neel', endpoint: 'oracle15.digibyte.io:12030', price_micro_usd: 0, price_usd: 0, timestamp: 0, deviation_pct: 0, signature_valid: false, status: 'no_data' },
    { oracle_id: 15, name: 'DigiSwarm', endpoint: 'oracle16.digibyte.io:12030', price_micro_usd: 0, price_usd: 0, timestamp: 0, deviation_pct: 0, signature_valid: false, status: 'no_data' },
    { oracle_id: 16, name: 'GTO90', endpoint: 'oracle17.digibyte.io:12030', price_micro_usd: 0, price_usd: 0, timestamp: 0, deviation_pct: 0, signature_valid: false, status: 'no_data' },
  ]
};

// Mock oracle config data (from getoracles RPC)
// Simulates the RPC returning MORE than 17 entries (legacy vOracleNodes)
// to test that the frontend correctly filters to active oracles only.
// IDs 11-16 return name="Unknown" from the node in some builds — the ORACLE_NAMES
// mapping in OraclesPage.js should supply their real names.
const selectedOracleIds = new Set([0, 1, 2, 4, 5, 8, 9, 11, 13]);

const heartbeatForOracle = (oracleId) => {
  if (oracleId <= 9) {
    return {
      in_consensus: true,
      selected_for_epoch: selectedOracleIds.has(oracleId),
      is_running_locally: oracleId <= 1,
      heartbeat_status: 'fresh',
      software_version: 'v9.26.0-rc38',
      client_version: 9260038,
      p2p_protocol_version: 70017,
      oracle_protocol_version: 1,
      musig2_context_version: 2,
      heartbeat_timestamp: 1770064200 - oracleId,
      heartbeat_age_seconds: 180 + oracleId,
      heartbeat_signature_valid: true
    };
  }

  if (oracleId === 10) {
    return {
      in_consensus: true,
      selected_for_epoch: false,
      is_running_locally: false,
      heartbeat_status: 'stale',
      software_version: 'v9.26.0-rc37',
      client_version: 9260037,
      p2p_protocol_version: 70017,
      oracle_protocol_version: 1,
      musig2_context_version: 1,
      heartbeat_timestamp: 1770060000,
      heartbeat_age_seconds: 3720,
      heartbeat_signature_valid: true
    };
  }

  return {
    in_consensus: oracleId <= 16,
    selected_for_epoch: selectedOracleIds.has(oracleId),
    is_running_locally: false,
    heartbeat_status: 'unknown',
    software_version: '',
    client_version: 0,
    p2p_protocol_version: 0,
    oracle_protocol_version: 0,
    musig2_context_version: 0,
    heartbeat_timestamp: 0,
    heartbeat_age_seconds: -1,
    heartbeat_signature_valid: false
  };
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
  { oracle_id: 8, name: 'JohnnyLawDGB', pubkey: '0289d5c588c8e0d311028f2f7e0db6df1a9fb0319c5e3b2cfc32efaee86538d250', endpoint: 'oracle9.digibyte.io:12030', is_active: true, status: 'no_data' },
  { oracle_id: 9, name: 'Ogilvie', pubkey: '02028a52c7a3e8f22c44e356dcda43a0e24ed5e8e284c53c902599f0947763113c', endpoint: 'oracle10.digibyte.io:12030', is_active: true, status: 'no_data' },
  { oracle_id: 10, name: 'ChopperBrian', pubkey: '03d2f9b0e00ed2fb0a93d04f12eb250b4adf2e4ac8335692c7942e4cba6e462484', endpoint: 'oracle11.digibyte.io:12030', is_active: true, status: 'no_data' },
  { oracle_id: 11, name: 'Unknown', pubkey: '026b51d431df5d7f141cbececcf79edf3dd861c3b4069f0b11661a3eefacbba918', endpoint: 'oracle12.digibyte.io:12030', is_active: true, status: 'no_data' },
  { oracle_id: 12, name: 'Unknown', pubkey: '033fdba35f04dc8c462986c992bcf875546257113072a909c162f7e470e581e278', endpoint: 'oracle13.digibyte.io:12030', is_active: true, status: 'no_data' },
  { oracle_id: 13, name: 'DigiByteForce', pubkey: '028527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61', endpoint: 'oracle14.digibyte.io:12030', is_active: true, status: 'no_data' },
  { oracle_id: 14, name: 'Unknown', pubkey: '03e629fa6598d732768f7c726b4b621285f9c3b85303900aa912017db7617d8bdb', endpoint: 'oracle15.digibyte.io:12030', is_active: true, status: 'no_data' },
  { oracle_id: 15, name: 'Unknown', pubkey: '02f629fa6598d732768f7c726b4b621285f9c3b85303900aa912017db7617d811', endpoint: 'oracle16.digibyte.io:12030', is_active: true, status: 'no_data' },
  { oracle_id: 16, name: 'Unknown', pubkey: '03a629fa6598d732768f7c726b4b621285f9c3b85303900aa912017db7617d822', endpoint: 'oracle17.digibyte.io:12030', is_active: true, status: 'no_data' },
  // Legacy entries beyond ID 16 — these should be FILTERED OUT by the frontend
  { oracle_id: 17, name: 'Unknown', pubkey: '03b629fa6598d732768f7c726b4b621285f9c3b85303900aa912017db7617d833', endpoint: 'oracle18.digidollar.org:9018', is_active: false, status: 'no_data' },
  { oracle_id: 18, name: 'Unknown', pubkey: '03c629fa6598d732768f7c726b4b621285f9c3b85303900aa912017db7617d844', endpoint: 'oracle19.digidollar.org:9019', is_active: false, status: 'no_data' },
].map(oracle => ({
  ...oracle,
  ...heartbeatForOracle(oracle.oracle_id)
}));

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
      expect(screen.getByText('Mainnet (Planned)')).toBeInTheDocument();
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
        expect(screen.getAllByText('9/17').length).toBeGreaterThan(0);
      });

      // Send updated data with 8 reporting oracles (Shenger comes online)
      const updatedAllPrices = {
        ...mockAllOraclePrices,
        oracle_count: 8,
        oracles: mockAllOraclePrices.oracles.map(o =>
          o.oracle_id === 4 ? { ...o, price_micro_usd: 50000, price_usd: 0.05, timestamp: 1770064185, signature_valid: true, status: 'reporting' } : o
        )
      };

      sendOracleData(ws, {
        price: { ...mockOraclePrice, oracle_count: 8 },
        allPrices: updatedAllPrices
      });

      await waitFor(() => {
        expect(screen.getAllByText('10/17').length).toBeGreaterThan(0);
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
        expect(screen.getAllByText('9/17').length).toBeGreaterThan(0);
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

  describe('RC38 Oracle Sitrep', () => {
    it('should display signed heartbeat and MuSig2 context readiness counts', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendOracleData(ws);

      await waitFor(() => {
        expect(screen.getByText('Oracle Operator Sitrep')).toBeInTheDocument();
        expect(screen.getByText('Fresh Heartbeats')).toBeInTheDocument();
        expect(screen.getByText('RC38 MuSig2 Context')).toBeInTheDocument();
        expect(screen.getByText('Selected This Epoch')).toBeInTheDocument();
        expect(screen.getAllByText('10/17').length).toBeGreaterThan(0);
        expect(screen.getAllByText('9/17').length).toBeGreaterThan(0);
      });
    });

    it('should show per-oracle heartbeat age, software version, and epoch role', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendOracleData(ws);

      await waitFor(() => {
        expect(screen.getByText('Heartbeat / Version')).toBeInTheDocument();
        expect(screen.getByText('Epoch Role')).toBeInTheDocument();
        expect(screen.getAllByText('v9.26.0-rc38').length).toBeGreaterThan(0);
        expect(screen.getAllByText('MuSig2 ctx 2').length).toBeGreaterThan(0);
        expect(screen.getByText('3m 0s ago')).toBeInTheDocument();
        expect(screen.getAllByText('selected').length).toBeGreaterThan(0);
        expect(screen.getAllByText('standby').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Technical Details', () => {
    it('should display phase two testnet specifications', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });

      const consensus = screen.getAllByText(/9-of-17 oracle consensus/);
      expect(consensus.length).toBeGreaterThan(0);
      expect(screen.getByText(/17 oracle slots/)).toBeInTheDocument();
      expect(screen.getByText(/MuSig2 aggregate signing \(v0x03\) with individual fallback \(v0x02\)/)).toBeInTheDocument();
      expect(screen.getByText(/Price updates every 15 seconds/)).toBeInTheDocument();
      const schnorr = screen.getAllByText(/BIP-340 Schnorr signatures/);
      expect(schnorr.length).toBeGreaterThan(0);
    });

    it('should display phase two mainnet specifications', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });

      const musig2 = screen.getAllByText(/MuSig2 aggregate signing \(v0x03\)/);
      expect(musig2.length).toBeGreaterThan(0);
      expect(screen.getByText(/Expanded oracle network/)).toBeInTheDocument();
      expect(screen.getByText(/BIP9 activation for deployment/)).toBeInTheDocument();
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

  describe('All 17 Active Oracles', () => {
    it('should display all 17 oracles including new RC30 additions', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendOracleData(ws);

      await waitFor(() => {
        // Original 9 oracles
        expect(screen.getByText('Jared')).toBeInTheDocument();
        expect(screen.getByText('Green Candle')).toBeInTheDocument();
        expect(screen.getByText('Bastian')).toBeInTheDocument();
        expect(screen.getByText('DanGB')).toBeInTheDocument();
        expect(screen.getByText('Shenger')).toBeInTheDocument();
        expect(screen.getByText('Ycagel')).toBeInTheDocument();
        expect(screen.getByText('Aussie')).toBeInTheDocument();
        expect(screen.getByText('LookInto')).toBeInTheDocument();
        expect(screen.getByText('JohnnyLawDGB')).toBeInTheDocument();
        expect(screen.getByText('Ogilvie')).toBeInTheDocument();
        expect(screen.getByText('ChopperBrian')).toBeInTheDocument();
        expect(screen.getByText('hallvardo')).toBeInTheDocument();
        expect(screen.getByText('DaPunzy')).toBeInTheDocument();
        expect(screen.getByText('DigiByteForce')).toBeInTheDocument();
        expect(screen.getByText('Neel')).toBeInTheDocument();
        expect(screen.getByText('DigiSwarm')).toBeInTheDocument();
        expect(screen.getByText('GTO90')).toBeInTheDocument();
      });
    });

    it('should show correct no data count (8 of 17)', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendOracleData(ws);

      await waitFor(() => {
        const noDataChips = screen.getAllByText('no data');
        expect(noDataChips.length).toBe(8);
      });
    });

    it('should correctly count 9 reporting oracles out of 17 total', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendOracleData(ws);

      await waitFor(() => {
        expect(screen.getAllByText('9/17').length).toBeGreaterThan(0);
        expect(screen.getByText('Online Reporting')).toBeInTheDocument();
      });
    });
  });

  describe('Reporting Count Accuracy', () => {
    it('should count 10/17 when 10 oracles are reporting', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      const tenReporting = {
        ...mockAllOraclePrices,
        oracle_count: 10,
        oracles: mockAllOraclePrices.oracles.map(o =>
          o.oracle_id === 4 ? { ...o, price_micro_usd: 50000, price_usd: 0.05, timestamp: 1770064185, signature_valid: true, status: 'reporting' } : o
        )
      };

      sendOracleData(ws, {
        price: { ...mockOraclePrice, oracle_count: 10 },
        allPrices: tenReporting
      });

      await waitFor(() => {
        expect(screen.getAllByText('10/17').length).toBeGreaterThan(0);
      });
    });

    it('should show reporting count from getalloracleprices not getoracleprice', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      // price says 3 but allPrices data shows 9 reporting
      sendOracleData(ws, {
        price: { ...mockOraclePrice, oracle_count: 3 }
      });

      await waitFor(() => {
        expect(screen.getAllByText('9/17').length).toBeGreaterThan(0);
      });
    });

    it('should show 9 reporting chips and 8 no data chips', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendOracleData(ws);

      await waitFor(() => {
        const reportingChips = screen.getAllByText('reporting');
        expect(reportingChips.length).toBe(9);
        const noDataChips = screen.getAllByText('no data');
        expect(noDataChips.length).toBe(8);
      });
    });
  });

  describe('Network Context', () => {
    it('should apply testnet styling', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });

      const phaseTwo = screen.getAllByText(/Phase Two/);
      expect(phaseTwo.length).toBeGreaterThan(0);
      const consensus = screen.getAllByText(/9-of-17/);
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

    it('should show waiting for activation instead of network unavailable when deployment is pre-activation', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      ws.receiveMessage({ type: 'ddDeploymentData', data: { status: 'defined' } });
      ws.onerror?.(new Event('error'));

      expect(screen.getByText('Oracle Network Waiting for Activation')).toBeInTheDocument();
      expect(screen.getByText(/live oracle price reporting is not available yet/i)).toBeInTheDocument();
      expect(screen.queryByText('Oracle Network Unavailable')).not.toBeInTheDocument();
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

  // =====================================================================
  // GUARDRAIL TESTS — prevent regressions on oracle count and naming
  // =====================================================================
  describe('Guardrails: Oracle Count & Naming (RC30)', () => {
    it('should NEVER display more than 17 oracles even when RPC returns 18+', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      // mockOracles contains 19 entries (17 active + 2 legacy)
      // The frontend MUST filter to 17
      sendOracleData(ws);

      await waitFor(() => {
        // Count oracle rows in the table. Each oracle renders its endpoint.
        // Active oracles (IDs 0-16) have endpoints matching *digibyte.io* or IP
        // Legacy oracles (IDs 11-14) have endpoints matching *digidollar.org*
        const legacyEndpoints = screen.queryAllByText(/digidollar\.org/);
        expect(legacyEndpoints.length).toBe(0);
      });
    });

    it('should never show oracle IDs above 16', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendOracleData(ws);

      await waitFor(() => {
        // Legacy endpoints from IDs 17+ must not appear
        expect(screen.queryByText('oracle12.digidollar.org:9012')).not.toBeInTheDocument();
        expect(screen.queryByText('oracle13.digidollar.org:9013')).not.toBeInTheDocument();
        expect(screen.queryByText('oracle14.digidollar.org:9014')).not.toBeInTheDocument();
        expect(screen.queryByText('oracle15.digidollar.org:9015')).not.toBeInTheDocument();
        expect(screen.queryByText('oracle18.digidollar.org:9018')).not.toBeInTheDocument();
        expect(screen.queryByText('oracle19.digidollar.org:9019')).not.toBeInTheDocument();
      });
    });

    it('should display hallvardo for oracle ID 11 (not Unknown)', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendOracleData(ws);

      await waitFor(() => {
        expect(screen.getByText('hallvardo')).toBeInTheDocument();
      });
    });

    it('should display GTO90 for oracle ID 16 (not Unknown)', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendOracleData(ws);

      await waitFor(() => {
        expect(screen.getByText('GTO90')).toBeInTheDocument();
      });
    });

    it('should display exactly 17 oracle entries in the table', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendOracleData(ws);

      await waitFor(() => {
        // 9 reporting + 8 no_data = 17 total status chips
        const reporting = screen.getAllByText('reporting');
        const noData = screen.getAllByText('no data');
        expect(reporting.length + noData.length).toBe(17);
      });
    });

    it('should show 9-of-17 consensus text (not 6-of-15 or 6-of-8)', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });

      const consensus = screen.getAllByText(/9-of-17/);
      expect(consensus.length).toBeGreaterThan(0);

      // Must NEVER contain old references
      expect(screen.queryByText(/6-of-15/)).not.toBeInTheDocument();
      expect(screen.queryByText(/6-of-8/)).not.toBeInTheDocument();
      expect(screen.queryByText(/5-of-9/)).not.toBeInTheDocument();
      expect(screen.queryByText(/9-of-15/)).not.toBeInTheDocument();
    });

    it('should display /17 in the reporting fraction (not /15 or /8)', async () => {
      renderWithProviders(<OraclesPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendOracleData(ws);

      await waitFor(() => {
        expect(screen.getAllByText('9/17').length).toBeGreaterThan(0);
        expect(screen.queryByText(/\/15/)).not.toBeInTheDocument();
        expect(screen.queryByText(/\/8/)).not.toBeInTheDocument();
      });
    });
  });
});
