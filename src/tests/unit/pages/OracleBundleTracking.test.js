/**
 * TDD: per-block DigiDollar oracle-bundle tracking across BlocksPage,
 * PoolsPage, and DDActivationPage.
 *
 * Now that DigiDollar is ACTIVE on mainnet, blocks mined by fully upgraded,
 * oracle-publishing pools carry an oracle price bundle (OP_RETURN OP_ORACLE
 * coinbase output). dgbstats-server ships three new fields on every block:
 *   hasOracleBundle: boolean
 *   oracleSignerCount: number|null   (popcount of the participation bitmap)
 *   oraclePriceUsd: number|null      (price_micro_usd / 1e6)
 *
 * UI contract under test:
 * - BlocksPage: bundle-carrying blocks get an "Oracle Bundle" chip showing
 *   signer count and the card is visually highlighted (data-oracle="true").
 * - PoolsPage: miners get an "Oracle n/m" chip when n of their m recent
 *   blocks carried bundles; the stats summary reports network-wide coverage.
 * - DDActivationPage: an "Oracle Bundle Adoption" section categorises pools
 *   as Publishing / Upgraded — no bundles yet / Not upgraded, so the team
 *   knows exactly who to reach out to.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import BlocksPage from '../../../pages/BlocksPage';
import PoolsPage from '../../../pages/PoolsPage';
import DDActivationPage from '../../../pages/DDActivationPage';
import { renderWithProviders, createWebSocketMock, waitForAsync, generateMockBlock } from '../../utils/testUtils';

// Mock the config used by PoolsPage (and available to others)
vi.mock('../../../config', () => ({
  default: {
    apiBaseUrl: 'http://localhost:5001',
    wsBaseUrl: 'ws://localhost:5002'
  }
}));

/** Block fixture shaped exactly like a dgbstats-server WS block object. */
const wsBlock = (overrides = {}) => ({
  ...generateMockBlock(),
  height: 23800000,
  hash: `hash-${overrides.height ?? 23800000}-${overrides.poolIdentifier ?? 'x'}`,
  algo: 'SHA256D',
  txCount: 4,
  difficulty: 1234.5,
  timestamp: 1789000000,
  minedTo: 'DAddrDefault',
  minerAddress: 'DAddrDefault',
  poolIdentifier: 'SomePool',
  ...overrides,
});

const bundleFields = { hasOracleBundle: true, oracleSignerCount: 7, oraclePriceUsd: 0.00913 };

describe('Oracle bundle tracking', () => {
  let wsSetup;
  let webSocketInstances;

  beforeEach(() => {
    wsSetup = createWebSocketMock();
    webSocketInstances = wsSetup.instances;
    global.WebSocket = wsSetup.MockWebSocket;
  });

  afterEach(() => {
    webSocketInstances.forEach(ws => ws.close());
    wsSetup.clearInstances();
    vi.clearAllMocks();
  });

  // =========================================================================
  // BlocksPage
  // =========================================================================
  describe('BlocksPage', () => {
    const blocks = [
      wsBlock({ height: 23800002, minerAddress: 'DA1', poolIdentifier: 'DigiHash', ...bundleFields }),
      wsBlock({ height: 23800001, minerAddress: 'DA2', poolIdentifier: 'ViaBTC' }),
      wsBlock({ height: 23800000, minerAddress: 'DA1', poolIdentifier: 'DigiHash', ...bundleFields, oracleSignerCount: 9 }),
    ];

    it('renders an Oracle Bundle chip with signer count on bundle-carrying blocks', async () => {
      renderWithProviders(<BlocksPage />);
      await waitForAsync();
      webSocketInstances[0].receiveMessage({ type: 'recentBlocks', data: blocks });

      await waitFor(() => {
        expect(screen.getAllByTestId('oracle-bundle-chip')).toHaveLength(2);
      });
      expect(screen.getByText('7 signers')).toBeInTheDocument();
      expect(screen.getByText('9 signers')).toBeInTheDocument();
    });

    it('visually highlights bundle-carrying block cards and not the others', async () => {
      const { container } = renderWithProviders(<BlocksPage />);
      await waitForAsync();
      webSocketInstances[0].receiveMessage({ type: 'recentBlocks', data: blocks });

      await waitFor(() => {
        expect(container.querySelectorAll('[data-oracle="true"]')).toHaveLength(2);
      });
      expect(container.querySelectorAll('[data-oracle="false"]')).toHaveLength(1);
    });

    it('shows no oracle chip on blocks without a bundle', async () => {
      renderWithProviders(<BlocksPage />);
      await waitForAsync();
      webSocketInstances[0].receiveMessage({
        type: 'recentBlocks',
        data: [wsBlock({ height: 23800005, poolIdentifier: 'ViaBTC' })],
      });

      await waitFor(() => {
        expect(screen.getAllByText('Oracle Bundle')[0]).toBeInTheDocument();
      });
      expect(screen.queryByTestId('oracle-bundle-chip')).not.toBeInTheDocument();
    });

    it('highlights a bundle-carrying block arriving via newBlock in realtime', async () => {
      renderWithProviders(<BlocksPage />);
      await waitForAsync();
      const ws = webSocketInstances[0];
      ws.receiveMessage({ type: 'recentBlocks', data: [wsBlock({ height: 23800000 })] });
      await waitFor(() => expect(screen.getAllByText('Height')[0]).toBeInTheDocument());

      ws.receiveMessage({
        type: 'newBlock',
        data: wsBlock({ height: 23800001, poolIdentifier: 'DigiHash', ...bundleFields }),
      });

      await waitFor(() => {
        expect(screen.getByTestId('oracle-bundle-chip')).toBeInTheDocument();
      });
      expect(screen.getByText('7 signers')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // PoolsPage
  // =========================================================================
  describe('PoolsPage', () => {
    // DigiHash: 3 blocks, 2 with bundles (publishing). ViaBTC: 2 blocks, no
    // bundles. Solo: 1 block, no bundle.
    const poolBlocks = [
      wsBlock({ height: 23800005, minerAddress: 'DHash1', poolIdentifier: 'DigiHash', ...bundleFields }),
      wsBlock({ height: 23800004, minerAddress: 'DVia1', poolIdentifier: 'ViaBTC' }),
      wsBlock({ height: 23800003, minerAddress: 'DHash1', poolIdentifier: 'DigiHash', ...bundleFields, oracleSignerCount: 8 }),
      wsBlock({ height: 23800002, minerAddress: 'DVia1', poolIdentifier: 'ViaBTC' }),
      wsBlock({ height: 23800001, minerAddress: 'DHash1', poolIdentifier: 'DigiHash' }),
      wsBlock({ height: 23800000, minerAddress: 'DSolo1', poolIdentifier: 'Unknown' }),
    ];

    it('shows an Oracle n/m chip for miners whose blocks carry bundles', async () => {
      renderWithProviders(<PoolsPage />);
      await waitForAsync();
      webSocketInstances[0].receiveMessage({ type: 'recentBlocks', data: poolBlocks });

      await waitFor(() => {
        expect(screen.getByText('Oracle 2/3')).toBeInTheDocument();
      });
    });

    it('does not show an oracle chip for miners without bundle blocks', async () => {
      renderWithProviders(<PoolsPage />);
      await waitForAsync();
      webSocketInstances[0].receiveMessage({ type: 'recentBlocks', data: poolBlocks });

      await waitFor(() => {
        expect(screen.getByText('Oracle 2/3')).toBeInTheDocument();
      });
      // ViaBTC (2 blocks) and the solo miner have no bundles → exactly one oracle chip
      expect(screen.getAllByText(/^Oracle \d+\/\d+$/)).toHaveLength(1);
    });

    it('reports network-wide bundle coverage in the stats summary', async () => {
      renderWithProviders(<PoolsPage />);
      await waitForAsync();
      webSocketInstances[0].receiveMessage({ type: 'recentBlocks', data: poolBlocks });

      await waitFor(() => {
        expect(screen.getByText(/2 of 6 blocks carry an oracle price bundle/i)).toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // DDActivationPage
  // =========================================================================
  describe('DDActivationPage — Oracle Bundle Adoption', () => {
    const startedDeployment = {
      enabled: false,
      status: 'started',
      bit: 23,
      start_time: 1763932527,
      timeout: 1830297600,
      min_activation_height: 600,
      signaling_blocks: 90,
      threshold: 140,
      period_blocks: 200,
      progress_percent: 64.3,
    };

    // PoolA publishes bundles; PoolB signals upgrade but no bundles; PoolC nothing.
    const adoptionBlocks = [
      wsBlock({ height: 23800008, minerAddress: 'DA', poolIdentifier: 'PoolA', ...bundleFields }),
      wsBlock({ height: 23800007, minerAddress: 'DB', poolIdentifier: 'PoolB', digidollarSignaling: true, algolockSignaling: true }),
      wsBlock({ height: 23800006, minerAddress: 'DC', poolIdentifier: 'PoolC' }),
      wsBlock({ height: 23800005, minerAddress: 'DA', poolIdentifier: 'PoolA', ...bundleFields, oracleSignerCount: 11 }),
      wsBlock({ height: 23800004, minerAddress: 'DB', poolIdentifier: 'PoolB', digidollarSignaling: true, algolockSignaling: true }),
      wsBlock({ height: 23800003, minerAddress: 'DC', poolIdentifier: 'PoolC' }),
      wsBlock({ height: 23800002, minerAddress: 'DA', poolIdentifier: 'PoolA' }),
      wsBlock({ height: 23800001, minerAddress: 'DB', poolIdentifier: 'PoolB', algolockSignaling: true }),
    ];

    async function renderWithAdoptionData() {
      renderWithProviders(<DDActivationPage />);
      await waitForAsync();
      const ws = webSocketInstances[0];
      ws.receiveMessage({ type: 'ddDeploymentData', data: startedDeployment });
      ws.receiveMessage({ type: 'initialData', data: { blockchainInfo: { blocks: 23800008 } } });
      ws.receiveMessage({ type: 'recentBlocks', data: adoptionBlocks });
      return ws;
    }

    it('renders the Oracle Bundle Adoption section with per-pool status', async () => {
      await renderWithAdoptionData();

      await waitFor(() => {
        expect(screen.getByText(/Oracle Bundle Adoption/i)).toBeInTheDocument();
      });
      expect(screen.getByText('PoolA')).toBeInTheDocument();
      expect(screen.getByText('PoolB')).toBeInTheDocument();
      expect(screen.getByText('PoolC')).toBeInTheDocument();
    });

    it('categorises pools: publishing / upgraded without bundles / not upgraded', async () => {
      await renderWithAdoptionData();

      await waitFor(() => {
        expect(screen.getByText('Publishing')).toBeInTheDocument();
      });
      expect(screen.getByText('Upgraded — no bundles yet')).toBeInTheDocument();
      expect(screen.getByText('Not upgraded')).toBeInTheDocument();
    });

    it('reports bundle coverage over the observed blocks', async () => {
      await renderWithAdoptionData();

      // 2 of 8 observed blocks carry bundles → 25.0%
      await waitFor(() => {
        expect(screen.getByText(/2 of 8 blocks/i)).toBeInTheDocument();
      });
      expect(screen.getByText(/25\.0%/)).toBeInTheDocument();
    });

    it('updates live when a bundle-carrying newBlock arrives', async () => {
      const ws = await renderWithAdoptionData();
      await waitFor(() => expect(screen.getByText(/2 of 8 blocks/i)).toBeInTheDocument());

      ws.receiveMessage({
        type: 'newBlock',
        data: wsBlock({ height: 23800009, minerAddress: 'DC', poolIdentifier: 'PoolC', ...bundleFields }),
      });

      await waitFor(() => {
        expect(screen.getByText(/3 of 9 blocks/i)).toBeInTheDocument();
      });
      // PoolC just published its first bundle → no longer "Not upgraded"
      expect(screen.queryByText('Not upgraded')).not.toBeInTheDocument();
    });
  });
});
