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
// Realistic versions:
//   skein, clean bit-23 signal:            0x20800602
//   sha256d, version-rolled with bit 23:   0x20810202
//   sha256d, version-rolled without bit 23: 0x20010202
// -----------------------------------------------------------------------------
const makeBlock = (overrides = {}) => ({
  height: 23784900,
  hash: '000000000000000000abcdef1234567890abcdef1234567890abcdef12345678',
  algo: 'skein',
  poolIdentifier: 'SkeinPool',
  minerAddress: 'DSkeinAddr111111111111111111111111',
  timestamp: Math.floor(Date.now() / 1000),
  txCount: 10,
  difficulty: 345678.9,
  version: 0x20800602,
  digidollarSignaling: true,
  algolockSignaling: false,
  versionRolled: false,
  taprootSignaling: true,
  ...overrides
});

// (a) Pool with 3 clean skein signaling blocks -> upgraded (v9.26.x)
const cleanSkeinBlocks = [
  makeBlock({ height: 23784900, hash: 'a1'.repeat(32) }),
  makeBlock({ height: 23784897, hash: 'a2'.repeat(32) }),
  makeBlock({ height: 23784894, hash: 'a3'.repeat(32) }),
];

// (b) Pool with ONLY version-rolled sha256d blocks (bit 23 is a coin flip
// inside the BIP310 roll window) -> indeterminate: 'Rolling — bit 23 n/a'
const rolledSha256dBlocks = [
  makeBlock({
    height: 23784899, hash: 'b1'.repeat(32), algo: 'sha256d',
    poolIdentifier: 'RolledPool', minerAddress: 'DRolledAddr2222222222222222222222',
    version: 0x20810202, digidollarSignaling: true, versionRolled: true
  }),
  makeBlock({
    height: 23784898, hash: 'b2'.repeat(32), algo: 'sha256d',
    poolIdentifier: 'RolledPool', minerAddress: 'DRolledAddr2222222222222222222222',
    version: 0x20010202, digidollarSignaling: false, versionRolled: true
  }),
  makeBlock({
    height: 23784896, hash: 'b3'.repeat(32), algo: 'sha256d',
    poolIdentifier: 'RolledPool', minerAddress: 'DRolledAddr2222222222222222222222',
    version: 0x20810202, digidollarSignaling: true, versionRolled: true
  }),
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

  describe('Rendering', () => {
    it('should render the hero section with title and BIP9 description', () => {
      renderWithProviders(<PoolUpgradeTrackerPage />);

      expect(screen.getByText('Pool Upgrade Tracker')).toBeInTheDocument();
      expect(screen.getByText(/Live pool readiness across the last/)).toBeInTheDocument();
    });

    it('should show a loading spinner until blocks arrive', () => {
      renderWithProviders(<PoolUpgradeTrackerPage />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should establish a WebSocket connection on mount', async () => {
      renderWithProviders(<PoolUpgradeTrackerPage />);

      await waitForAsync();

      expect(mockWebSocket).toHaveBeenCalledWith('ws://localhost:5002');
      expect(webSocketInstances.length).toBe(1);
    });
  });

  describe('Pool classification', () => {
    it('should show a v9.26.x chip and 3/3 for a pool with 3 clean skein signaling blocks', async () => {
      renderWithProviders(<PoolUpgradeTrackerPage />);

      await waitForAsync();
      const ws = webSocketInstances[0];

      ws.receiveMessage({ type: 'recentBlocks', data: cleanSkeinBlocks });

      await waitFor(() => {
        expect(screen.getByText('SkeinPool')).toBeInTheDocument();
      });

      const row = screen.getByText('SkeinPool').closest('tr');
      expect(row).not.toBeNull();
      // Upgraded chip (clean, non-rolled bit-23 signal on every block)
      expect(within(row).getByText('v9.26.x')).toBeInTheDocument();
      // Raw bit-23 count over the pool's blocks: 3 of 3 (100%)
      expect(within(row).getByText('3/3 (100%)')).toBeInTheDocument();
    });

    it('should show a Rolling — bit 23 n/a chip for a pool with only rolled sha256d blocks', async () => {
      renderWithProviders(<PoolUpgradeTrackerPage />);

      await waitForAsync();
      const ws = webSocketInstances[0];

      ws.receiveMessage({ type: 'recentBlocks', data: rolledSha256dBlocks });

      await waitFor(() => {
        expect(screen.getByText('RolledPool')).toBeInTheDocument();
      });

      const row = screen.getByText('RolledPool').closest('tr');
      expect(row).not.toBeNull();
      // Every block is version-rolled SHA256D: bit 23 is a coin flip there, so
      // the pool is indeterminate rather than upgraded or non-signaling.
      expect(within(row).getByText('Rolling — bit 23 n/a')).toBeInTheDocument();
      expect(within(row).queryByText('v9.26.x')).not.toBeInTheDocument();
    });

    it('should show a No chip for a scrypt pool on an old non-signaling node', async () => {
      renderWithProviders(<PoolUpgradeTrackerPage />);

      await waitForAsync();
      const ws = webSocketInstances[0];

      // scrypt old node: version 0x20000002 — no bit 23, no bit 0, not rolled
      ws.receiveMessage({
        type: 'recentBlocks',
        data: [
          makeBlock({
            height: 23784895, hash: 'c1'.repeat(32), algo: 'scrypt',
            poolIdentifier: 'ScryptPool', minerAddress: 'DScryptAddr3333333333333333333333',
            version: 0x20000002, digidollarSignaling: false, versionRolled: false
          }),
          makeBlock({
            height: 23784893, hash: 'c2'.repeat(32), algo: 'scrypt',
            poolIdentifier: 'ScryptPool', minerAddress: 'DScryptAddr3333333333333333333333',
            version: 0x20000002, digidollarSignaling: false, versionRolled: false
          }),
        ]
      });

      await waitFor(() => {
        expect(screen.getByText('ScryptPool')).toBeInTheDocument();
      });

      const row = screen.getByText('ScryptPool').closest('tr');
      expect(row).not.toBeNull();
      expect(within(row).getByText('No')).toBeInTheDocument();
      // Scope to the DigiDollar column: the Algolock column shows the same
      // "0/2 (0%)" caption for a non-signaling pool.
      const ddCell = row.querySelectorAll('td')[2];
      expect(within(ddCell).getByText('0/2 (0%)')).toBeInTheDocument();
      expect(within(row).queryByText('v9.26.x')).not.toBeInTheDocument();
      expect(within(row).queryByText('Rolling — bit 23 n/a')).not.toBeInTheDocument();
    });

    it('should classify both pools independently in the same window', async () => {
      renderWithProviders(<PoolUpgradeTrackerPage />);

      await waitForAsync();
      const ws = webSocketInstances[0];

      ws.receiveMessage({
        type: 'recentBlocks',
        data: [...cleanSkeinBlocks, ...rolledSha256dBlocks]
      });

      await waitFor(() => {
        expect(screen.getByText('SkeinPool')).toBeInTheDocument();
        expect(screen.getByText('RolledPool')).toBeInTheDocument();
      });

      const skeinRow = screen.getByText('SkeinPool').closest('tr');
      const rolledRow = screen.getByText('RolledPool').closest('tr');
      expect(within(skeinRow).getByText('v9.26.x')).toBeInTheDocument();
      expect(within(rolledRow).getByText('Rolling — bit 23 n/a')).toBeInTheDocument();
      expect(screen.getByText(/Pools \(last 6 blocks\)/)).toBeInTheDocument();
    });
  });

  describe('Raw version-bit classification (fallback for older servers)', () => {
    // Blocks WITHOUT the server-computed boolean flags: the page must fall
    // back to classifying the raw block version locally. One block per pool,
    // one for each real-world version example:
    //   0x20800602 skein, clean bit-23 signal        -> ddRaw + ddClean
    //   0x20800e02 odocrypt, clean bit-23 signal     -> ddRaw + ddClean
    //   0x20000002 scrypt, old node                  -> no signal
    //   0x33fcc202 sha256d rolled, bit 28 set        -> rolled, signals NOTHING
    //                                                   (0xF0000000 top-mask)
    //   0x20810202 sha256d rolled carrying bit 23    -> ddRaw (BIP9 counts it), rolled
    //   0x20800202 sha256d, clean bit-23 signal      -> ddRaw + ddClean
    const rawBlock = (height, hash, algo, pool, version) => ({
      height,
      hash: hash.repeat(32),
      algo,
      poolIdentifier: pool,
      minerAddress: `D${pool}Addr00000000000000000000000000`,
      timestamp: Math.floor(Date.now() / 1000),
      txCount: 5,
      difficulty: 12345.6,
      version
    });

    const rawVersionBlocks = [
      rawBlock(23784906, 'd1', 'skein', 'SkeinRaw', 0x20800602),
      rawBlock(23784905, 'd2', 'odocrypt', 'OdoRaw', 0x20800e02),
      rawBlock(23784904, 'd3', 'scrypt', 'ScryptRaw', 0x20000002),
      rawBlock(23784903, 'd4', 'sha256d', 'RolledNoBitRaw', 0x33fcc202),
      rawBlock(23784902, 'd5', 'sha256d', 'RolledBit23Raw', 0x20810202),
      rawBlock(23784901, 'd6', 'sha256d', 'CleanShaRaw', 0x20800202),
    ];

    it('should classify all real-world version examples from raw version bits', async () => {
      renderWithProviders(<PoolUpgradeTrackerPage />);

      await waitForAsync();
      const ws = webSocketInstances[0];

      ws.receiveMessage({ type: 'recentBlocks', data: rawVersionBlocks });

      await waitFor(() => {
        expect(screen.getByText('SkeinRaw')).toBeInTheDocument();
      });

      // Network-wide aggregates: raw bit 23 on 4 of 6 blocks (BIP9 consensus
      // count) = 3 clean proofs + 1 riding on a rolled block; 2 of the 6 are
      // version-rolled. The rolled 0x33fcc202 block has bit 28 set, so it
      // signals nothing.
      expect(screen.getByText(/4 of 6 recent blocks carry bit 23/)).toBeInTheDocument();
      expect(
        screen.getByText(/3 clean, hard proof of v9\.26\.x, plus 1 riding on rolled blocks/)
      ).toBeInTheDocument();
      expect(screen.getByText(/2 of the 6 are version-rolled SHA256D blocks/)).toBeInTheDocument();
      expect(screen.getByText(/67% of recent blocks signalling \(70% needed\)/)).toBeInTheDocument();

      // Per-pool upgrade states inferred from the version bits alone
      const chipFor = (pool) => screen.getByText(pool).closest('tr');
      expect(within(chipFor('SkeinRaw')).getByText('v9.26.x')).toBeInTheDocument();
      expect(within(chipFor('OdoRaw')).getByText('v9.26.x')).toBeInTheDocument();
      expect(within(chipFor('CleanShaRaw')).getByText('v9.26.x')).toBeInTheDocument();
      expect(within(chipFor('ScryptRaw')).getByText('No')).toBeInTheDocument();
      expect(within(chipFor('RolledNoBitRaw')).getByText('Rolling — bit 23 n/a')).toBeInTheDocument();
      expect(within(chipFor('RolledBit23Raw')).getByText('Rolling — bit 23 n/a')).toBeInTheDocument();

      // The rolled block carrying bit 23 is still counted raw (1/1), while the
      // bit-28 rolled block is not (0/1) — DigiByte's 0xF0000000 top-mask.
      // Scope to the DigiDollar column (index 2): the Algolock column repeats
      // the same "0/1 (0%)" caption for non-signaling pools.
      const ddCellFor = (pool) => chipFor(pool).querySelectorAll('td')[2];
      expect(within(ddCellFor('RolledBit23Raw')).getByText('1/1 (100%)')).toBeInTheDocument();
      expect(within(ddCellFor('RolledNoBitRaw')).getByText('0/1 (0%)')).toBeInTheDocument();
    });

    it('should prefer server-computed flags over the raw version when both exist', async () => {
      renderWithProviders(<PoolUpgradeTrackerPage />);

      await waitForAsync();
      const ws = webSocketInstances[0];

      // The raw version (0x20000002) alone would classify as "no signal", but
      // the server flags mark it as a clean DigiDollar signal — flags win.
      ws.receiveMessage({
        type: 'recentBlocks',
        data: [{
          ...rawBlock(23784910, 'e1', 'sha256d', 'FlaggedPool', 0x20000002),
          digidollarSignaling: true,
          algolockSignaling: false,
          versionRolled: false
        }]
      });

      await waitFor(() => {
        expect(screen.getByText('FlaggedPool')).toBeInTheDocument();
      });

      const row = screen.getByText('FlaggedPool').closest('tr');
      expect(within(row).getByText('v9.26.x')).toBeInTheDocument();
      expect(within(row).getByText('1/1 (100%)')).toBeInTheDocument();
    });
  });

  describe('Official BIP9 window (getdeploymentinfo via MSW)', () => {
    it('should render the official-window Alert with the no-longer-possible warning', async () => {
      renderWithProviders(<PoolUpgradeTrackerPage />);

      await waitForAsync();
      const ws = webSocketInstances[0];

      // Blocks must arrive for the summary cards (and their Alert) to render
      ws.receiveMessage({ type: 'recentBlocks', data: cleanSkeinBlocks });

      // MSW getdeploymentinfo statistics: {period: 40320, threshold: 28224,
      // elapsed: 36377, count: 10808, possible: false} -> warning Alert
      await waitFor(() => {
        expect(screen.getByText(/no longer possible in this window/)).toBeInTheDocument();
      });
      expect(screen.getByText(/Official window:/)).toBeInTheDocument();
      expect(screen.getByText('10,808')).toBeInTheDocument();
      expect(screen.getByText('28,224')).toBeInTheDocument();
      expect(screen.getByText('36,377')).toBeInTheDocument();
    });

    it('should show the algolock window as not yet open (status defined)', async () => {
      renderWithProviders(<PoolUpgradeTrackerPage />);

      await waitForAsync();
      const ws = webSocketInstances[0];

      ws.receiveMessage({ type: 'recentBlocks', data: cleanSkeinBlocks });

      await waitFor(() => {
        expect(
          screen.getByText(/Algolock BIP9 signalling has not opened yet/)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Empty state', () => {
    it('should show an empty-table message when no blocks are received', async () => {
      renderWithProviders(<PoolUpgradeTrackerPage />);

      await waitForAsync();
      const ws = webSocketInstances[0];

      ws.receiveMessage({ type: 'recentBlocks', data: [] });

      await waitFor(() => {
        expect(screen.getByText('No recent blocks available.')).toBeInTheDocument();
      });
    });
  });
});
