import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import PoolUpgradeTrackerPage from '../../../pages/PoolUpgradeTrackerPage';
import { renderWithProviders, createWebSocketMock, waitForAsync } from '../../utils/testUtils';

// Mock the config
vi.mock('../../../config', () => ({
  default: {
    apiBaseUrl: 'http://localhost:5001',
    wsBaseUrl: 'ws://localhost:5002'
  }
}));

// -----------------------------------------------------------------------------
// Block fixtures — shape matches what dgbstats-server ships on every block.
// DigiDollar is ACTIVE: BIP9 bit-23 signaling is over. The post-activation
// questions are (1) which pools attach v0x03 oracle bundles to their coinbase
// (fully integrated), (2) which are on v9.26.x but not publishing bundles
// (needs the digidollar-oracle GBT rule / commitment preservation), and
// (3) which show no v9.26 evidence at all (needs the Core upgrade).
// -----------------------------------------------------------------------------
const makeBlock = (overrides = {}) => ({
  height: 23870100,
  hash: '000000000000000000abcdef1234567890abcdef1234567890abcdef12345678',
  algo: 'skein',
  poolIdentifier: 'SomePool',
  minerAddress: 'DSomeAddr1111111111111111111111111',
  timestamp: Math.floor(Date.now() / 1000),
  txCount: 10,
  difficulty: 345678.9,
  version: 0x20000602,
  digidollarSignaling: false,
  algolockSignaling: false,
  versionRolled: false,
  taprootSignaling: true,
  hasOracleBundle: false,
  oracleSignerCount: null,
  oraclePriceUsd: null,
  ...overrides
});

// BundlePool: 3 blocks, 2 carrying oracle bundles -> Publishing bundles
// AlgolockPool: 2 blocks with algolock bit 0, no bundles -> Upgraded — not publishing
// OldPool: 2 blocks with no evidence at all -> Not upgraded
const adoptionBlocks = [
  makeBlock({ height: 23870107, hash: 'a1'.repeat(32), poolIdentifier: 'BundlePool', minerAddress: 'DBundle1', hasOracleBundle: true, oracleSignerCount: 7, oraclePriceUsd: 0.00913 }),
  makeBlock({ height: 23870106, hash: 'b1'.repeat(32), poolIdentifier: 'AlgolockPool', minerAddress: 'DAlgo1', algolockSignaling: true }),
  makeBlock({ height: 23870105, hash: 'c1'.repeat(32), poolIdentifier: 'OldPool', minerAddress: 'DOld1' }),
  makeBlock({ height: 23870104, hash: 'a2'.repeat(32), poolIdentifier: 'BundlePool', minerAddress: 'DBundle1', hasOracleBundle: true, oracleSignerCount: 9, oraclePriceUsd: 0.00914 }),
  makeBlock({ height: 23870103, hash: 'b2'.repeat(32), poolIdentifier: 'AlgolockPool', minerAddress: 'DAlgo1', algolockSignaling: true }),
  makeBlock({ height: 23870102, hash: 'c2'.repeat(32), poolIdentifier: 'OldPool', minerAddress: 'DOld1' }),
  makeBlock({ height: 23870101, hash: 'a3'.repeat(32), poolIdentifier: 'BundlePool', minerAddress: 'DBundle1' }),
];

describe('PoolUpgradeTrackerPage', () => {
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

  async function renderWithBlocks(blocks = adoptionBlocks) {
    renderWithProviders(<PoolUpgradeTrackerPage />);
    await waitForAsync();
    const ws = webSocketInstances[0];
    ws.receiveMessage({ type: 'recentBlocks', data: blocks });
    return ws;
  }

  describe('Rendering', () => {
    it('should render the hero with the post-activation framing', async () => {
      renderWithProviders(<PoolUpgradeTrackerPage />);

      expect(screen.getByText('Pool Upgrade Tracker')).toBeInTheDocument();
      expect(screen.getByText(/DigiDollar is ACTIVE/i)).toBeInTheDocument();
    });

    it('should show a loading spinner until blocks arrive', () => {
      renderWithProviders(<PoolUpgradeTrackerPage />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should establish a WebSocket connection on mount', async () => {
      renderWithProviders(<PoolUpgradeTrackerPage />);
      await waitForAsync();
      expect(mockWebSocket).toHaveBeenCalledWith('ws://localhost:5002');
    });
  });

  describe('Per-pool status classification', () => {
    it('marks a pool mining bundle blocks with the green DigiDollar Bundles badge', async () => {
      await renderWithBlocks();

      await waitFor(() => {
        expect(screen.getByText('BundlePool')).toBeInTheDocument();
      });
      const row = screen.getByText('BundlePool').closest('tr');
      expect(within(row).getByText('Publishing DigiDollar Bundles')).toBeInTheDocument();
      // 2 of its 3 blocks carried bundles
      expect(within(row).getByText('2/3 (67%)')).toBeInTheDocument();
    });

    it('marks an upgraded pool without bundles as Upgraded — not publishing', async () => {
      await renderWithBlocks();

      await waitFor(() => {
        expect(screen.getByText('AlgolockPool')).toBeInTheDocument();
      });
      const row = screen.getByText('AlgolockPool').closest('tr');
      expect(within(row).getByText('Upgraded — not publishing')).toBeInTheDocument();
      expect(within(row).queryByText('Publishing DigiDollar Bundles')).not.toBeInTheDocument();
    });

    it('marks a pool with no evidence at all as No bundles', async () => {
      await renderWithBlocks();

      await waitFor(() => {
        expect(screen.getByText('OldPool')).toBeInTheDocument();
      });
      const row = screen.getByText('OldPool').closest('tr');
      expect(within(row).getByText('No bundles')).toBeInTheDocument();
    });

    it('treats historical clean bit-23 signaling as upgrade evidence', async () => {
      await renderWithBlocks([
        makeBlock({ height: 23870110, hash: 'd1'.repeat(32), poolIdentifier: 'LegacySignal', minerAddress: 'DLeg1', digidollarSignaling: true }),
        makeBlock({ height: 23870109, hash: 'd2'.repeat(32), poolIdentifier: 'LegacySignal', minerAddress: 'DLeg1' }),
      ]);

      await waitFor(() => {
        expect(screen.getByText('LegacySignal')).toBeInTheDocument();
      });
      const row = screen.getByText('LegacySignal').closest('tr');
      expect(within(row).getByText('Upgraded — not publishing')).toBeInTheDocument();
    });
  });

  describe('Network-wide summaries', () => {
    it('reports DigiDollar Bundle coverage over the window', async () => {
      await renderWithBlocks();

      // 2 bundles across 7 observed blocks
      await waitFor(() => {
        expect(screen.getByText(/2 of 7 recent blocks carry a DigiDollar Bundle/i)).toBeInTheDocument();
      });
    });

    it('counts pools in each bucket', async () => {
      await renderWithBlocks();

      // KPI tiles: 1 publishing / 1 upgraded-not-publishing / 1 not-upgraded
      // (label appears on both the KPI tile and the status chip)
      await waitFor(() => {
        expect(screen.getAllByText(/Publishing DigiDollar Bundles/i).length).toBeGreaterThan(0);
      });
      expect(screen.getByText(/Upgraded, not publishing/i)).toBeInTheDocument();
      // Signalling has ended network-wide, so the third bucket claims only
      // what the chain proves: no bundles (tile + chip may both match).
      expect(screen.getAllByText(/No bundles/i).length).toBeGreaterThan(0);
      // one pool in each bucket for this fixture
      expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(3);
    });

    it('no longer shows the retired Algolock / Groestl sections', async () => {
      await renderWithBlocks();

      await waitFor(() => {
        expect(screen.getByText('BundlePool')).toBeInTheDocument();
      });
      // Section titles/columns from the signalling era must be gone. (The
      // fixture pool literally named 'AlgolockPool' still renders — assert on
      // the retired UI strings, not the substring.)
      expect(screen.queryByText(/Algolock \(bit\s?0\)/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/v9\.26 adoption/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Groestl Retirement/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/version-rolling window/i)).not.toBeInTheDocument();
    });

    it('explains the GBT fix for upgraded-but-not-publishing pools', async () => {
      await renderWithBlocks();

      await waitFor(() => {
        expect(screen.getAllByText(/digidollar-oracle/).length).toBeGreaterThan(0);
      });
      expect(screen.getAllByText(/default_oracle_commitment/).length).toBeGreaterThan(0);
    });
  });

  describe('Live updates', () => {
    it('reclassifies a pool when its first bundle block arrives via newBlock', async () => {
      const ws = await renderWithBlocks();
      await waitFor(() => expect(screen.getByText('OldPool')).toBeInTheDocument());

      ws.receiveMessage({
        type: 'newBlock',
        data: makeBlock({ height: 23870108, hash: 'c9'.repeat(32), poolIdentifier: 'OldPool', minerAddress: 'DOld1', hasOracleBundle: true, oracleSignerCount: 8, oraclePriceUsd: 0.00915 }),
      });

      await waitFor(() => {
        const row = screen.getByText('OldPool').closest('tr');
        expect(within(row).getByText('Publishing DigiDollar Bundles')).toBeInTheDocument();
      });
      // No pool row carries the Not upgraded chip any more (the footer legend
      // still mentions the term, so scope to chips).
      expect(screen.queryByText('Not upgraded', { selector: '.MuiChip-label' })).not.toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('should show an empty-table message when no blocks are received', async () => {
      await renderWithBlocks([]);

      await waitFor(() => {
        expect(screen.getByText('No recent blocks available.')).toBeInTheDocument();
      });
    });
  });
});
