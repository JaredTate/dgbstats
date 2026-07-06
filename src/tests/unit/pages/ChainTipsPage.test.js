import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, within, act } from '@testing-library/react';
import ChainTipsPage, { buildOrphanBuckets, buildDailySeries } from '../../../pages/ChainTipsPage';
import { renderWithProviders, createWebSocketMock, waitForAsync } from '../../utils/testUtils';

vi.mock('../../../config', () => ({
  default: {
    apiBaseUrl: 'http://localhost:5001',
    wsBaseUrl: 'ws://localhost:5002',
  },
}));

const TOP = 23784910;

const chainTipsData = {
  network: 'mainnet',
  updatedAt: Date.now(),
  active: { height: TOP, hash: 'aa'.repeat(32) },
  counts: { validFork: 2, validHeaders: 1, headersOnly: 3, invalid: 1 },
  totalTips: 7,
  maxBranchLen: 4,
  tips: [
    { hash: '11'.repeat(32), height: TOP - 1, branchlen: 1, status: 'valid-fork', forkHeight: TOP - 2 },
    { hash: '22'.repeat(32), height: TOP - 3, branchlen: 2, status: 'valid-headers', forkHeight: TOP - 5 },
    { hash: '33'.repeat(32), height: TOP - 6, branchlen: 4, status: 'invalid', forkHeight: TOP - 10 },
  ],
  orphans24h: 5,
  orphans: [
    {
      hash: '44'.repeat(32),
      height: TOP - 2,
      branchlen: 1,
      status: 'valid-fork',
      algo: 'skein',
      pool: 'DigiHash',
      firstSeen: Date.now() - 60 * 1000,
    },
    {
      hash: '55'.repeat(32),
      height: TOP - 8,
      branchlen: 1,
      status: 'valid-fork',
      algo: 'scrypt',
      pool: 'SkeinPool',
      firstSeen: Date.now() - 3 * 3600 * 1000,
    },
  ],
  dailyOrphans: [
    { day: '2026-06-20', count: 4, maxBranchlen: 1 },
    { day: '2026-06-22', count: 7, maxBranchlen: 2 },
  ],
  avgPerDay: 3.4,
  trackedDays: 22,
};

describe('ChainTipsPage', () => {
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
    webSocketInstances.forEach((ws) => ws.close());
    wsSetup.clearInstances();
    vi.clearAllMocks();
  });

  it('renders the hero title and subtitle', () => {
    renderWithProviders(<ChainTipsPage />);
    expect(screen.getByText('Chain Tips & Orphans')).toBeInTheDocument();
    expect(screen.getByText(/15s blocks across 5 algos/i)).toBeInTheDocument();
  });

  it('shows a loading indicator before any data arrives', () => {
    renderWithProviders(<ChainTipsPage />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('opens a WebSocket to the mainnet endpoint', async () => {
    renderWithProviders(<ChainTipsPage />);
    await waitForAsync();
    expect(mockWebSocket).toHaveBeenCalledWith('ws://localhost:5002');
  });

  it('populates KPI tiles from a chainTips message', async () => {
    renderWithProviders(<ChainTipsPage />);
    await waitForAsync();
    const ws = webSocketInstances[0];
    ws.receiveMessage({ type: 'chainTips', data: chainTipsData });

    await waitFor(() => {
      expect(screen.getByText('Active Height')).toBeInTheDocument();
    });
    // Active height 23,784,910
    expect(screen.getByText('23,784,910')).toBeInTheDocument();
    // Competing tips = validFork(2) + validHeaders(1) + invalid(1) = 4
    const competing = screen.getByText('Competing Tips').closest('div');
    expect(within(competing).getByText('4')).toBeInTheDocument();
    // Orphans (24h) = 5
    const orphansTile = screen.getByText('Orphans (24h)').closest('div');
    expect(within(orphansTile).getByText('5')).toBeInTheDocument();
    // Deepest Branch = 4
    const deepest = screen.getByText('Deepest Branch').closest('div');
    expect(within(deepest).getByText('4')).toBeInTheDocument();
  });

  it('renders chain-tips table rows with status chips', async () => {
    renderWithProviders(<ChainTipsPage />);
    await waitForAsync();
    const ws = webSocketInstances[0];
    ws.receiveMessage({ type: 'chainTips', data: chainTipsData });

    await waitFor(() => {
      expect(screen.getByText('valid-fork')).toBeInTheDocument();
    });
    expect(screen.getByText('valid-headers')).toBeInTheDocument();
    expect(screen.getByText('invalid')).toBeInTheDocument();
    // Short hash + explorer link for the first tip
    const links = screen.getAllByRole('link').filter((l) =>
      (l.getAttribute('href') || '').includes('digiexplorer.info/block/' + '11'.repeat(32))
    );
    expect(links.length).toBeGreaterThan(0);
  });

  it('drives the fork-risk hero from forkAlert messages', async () => {
    renderWithProviders(<ChainTipsPage />);
    await waitForAsync();
    const ws = webSocketInstances[0];
    ws.receiveMessage({ type: 'chainTips', data: chainTipsData });

    await waitFor(() => expect(screen.getByText('Network Healthy')).toBeInTheDocument());

    ws.receiveMessage({
      type: 'forkAlert',
      data: { network: 'mainnet', level: 'elevated', reason: 'competing branch near tip', height: TOP, branchlen: 1 },
    });
    await waitFor(() => expect(screen.getByText(/ELEVATED/i)).toBeInTheDocument());
    expect(screen.getByText('competing branch near tip')).toBeInTheDocument();

    ws.receiveMessage({
      type: 'forkAlert',
      data: { network: 'mainnet', level: 'critical', reason: 'deep reorg', height: TOP, branchlen: 5 },
    });
    // Exact match scopes to the hero (the explainer has a "fork risk?" heading).
    await waitFor(() => expect(screen.getByText('Fork Risk')).toBeInTheDocument());
  });

  it('renders the recent orphans feed', async () => {
    renderWithProviders(<ChainTipsPage />);
    await waitForAsync();
    const ws = webSocketInstances[0];
    ws.receiveMessage({ type: 'chainTips', data: chainTipsData });

    await waitFor(() => {
      expect(screen.getByText('DigiHash')).toBeInTheDocument();
    });
    expect(screen.getByText('SkeinPool')).toBeInTheDocument();
  });

  it('shows an empty state when there are no orphans', async () => {
    renderWithProviders(<ChainTipsPage />);
    await waitForAsync();
    const ws = webSocketInstances[0];
    ws.receiveMessage({
      type: 'chainTips',
      data: { ...chainTipsData, orphans24h: 0, orphans: [] },
    });

    await waitFor(() => {
      expect(screen.getByText('No orphaned blocks in the last 24 hours.')).toBeInTheDocument();
    });
  });

  it('renders the orphans-per-day chart canvas', async () => {
    const { container } = renderWithProviders(<ChainTipsPage />);
    await waitForAsync();
    const ws = webSocketInstances[0];
    ws.receiveMessage({ type: 'chainTips', data: chainTipsData });

    await waitFor(() => {
      expect(container.querySelector('canvas')).toBeInTheDocument();
    });
  });

  it('renders the live fork-tree map', async () => {
    renderWithProviders(<ChainTipsPage />);
    await waitForAsync();
    const ws = webSocketInstances[0];
    ws.receiveMessage({ type: 'recentBlocks', data: [] });
    ws.receiveMessage({ type: 'chainTips', data: chainTipsData });

    await waitFor(() => {
      expect(screen.getByTestId('fork-tree-map')).toBeInTheDocument();
    });
  });

  it('tracks height from initialData and newBlock messages', async () => {
    renderWithProviders(<ChainTipsPage />);
    await waitForAsync();
    const ws = webSocketInstances[0];
    ws.receiveMessage({ type: 'initialData', data: { blockchainInfo: { blocks: TOP } } });
    ws.receiveMessage({
      type: 'recentBlocks',
      data: [{ height: TOP, hash: 'aa'.repeat(32), algo: 'sha256d', poolIdentifier: 'DigiHash', timestamp: 1 }],
    });
    ws.receiveMessage({
      type: 'newBlock',
      data: { height: TOP + 1, hash: 'bc'.repeat(32), algo: 'skein', poolIdentifier: 'SkeinPool', timestamp: 2 },
    });
    await waitFor(() => {
      expect(screen.getByTestId('fork-tree-map')).toBeInTheDocument();
    });
  });

  it('leaves loading on a socket error and ignores malformed payloads', async () => {
    renderWithProviders(<ChainTipsPage />);
    await waitForAsync();
    const ws = webSocketInstances[0];
    // Malformed payload hits the catch branch without crashing.
    act(() => ws.onmessage({ data: '{bad json' }));
    // A socket error clears the loading state.
    ws.triggerError(new Error('boom'));
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    // With no data, the tips/orphans empty states are shown.
    expect(screen.getByText('No orphaned blocks in the last 24 hours.')).toBeInTheDocument();
    expect(
      screen.getByText('Only the active tip — no competing branches right now.')
    ).toBeInTheDocument();
  });

  it('rebuilds the chart when a second chainTips message changes the orphan set', async () => {
    const { container } = renderWithProviders(<ChainTipsPage />);
    await waitForAsync();
    const ws = webSocketInstances[0];
    ws.receiveMessage({ type: 'chainTips', data: chainTipsData });
    await waitFor(() => expect(container.querySelector('canvas')).toBeInTheDocument());

    ws.receiveMessage({
      type: 'chainTips',
      data: {
        ...chainTipsData,
        maxBranchLen: 1,
        orphans24h: 3,
        orphans: [
          { hash: '66'.repeat(32), height: TOP - 4, branchlen: 1, status: 'valid-fork', algo: 'qubit', pool: 'X', firstSeen: Date.now() - 5 * 1000 },
          { hash: '77'.repeat(32), height: TOP - 9, branchlen: 1, status: 'valid-fork', algo: 'odo', pool: 'Y', firstSeen: Date.now() - 2 * 86400 * 1000 },
          { hash: '88'.repeat(32), height: TOP - 12, branchlen: 1, status: 'valid-fork', algo: 'skein', pool: 'Z', firstSeen: NaN },
        ],
      },
    });
    await waitFor(() => {
      const deepest = screen.getByText('Deepest Branch').closest('div');
      expect(within(deepest).getByText('1')).toBeInTheDocument();
    });
    // Relative-time buckets: seconds-ago and days-ago strings both render.
    expect(screen.getByText('5s ago')).toBeInTheDocument();
    expect(screen.getByText('2d ago')).toBeInTheDocument();
  });

  it('handles sparse tips/orphans and partial messages without crashing', async () => {
    renderWithProviders(<ChainTipsPage />);
    await waitForAsync();
    const ws = webSocketInstances[0];
    // recentBlocks without a data array -> defaults to [] and clears loading.
    ws.receiveMessage({ type: 'recentBlocks' });
    // chainTips with no data payload is ignored.
    ws.receiveMessage({ type: 'chainTips' });
    // chainTips with sparse rows and no active tip.
    ws.receiveMessage({
      type: 'chainTips',
      data: {
        counts: {},
        tips: [
          { hash: undefined, status: undefined }, // missing everything + unknown status
          { hash: 'abcd', height: 10, branchlen: 1, status: 'valid-fork' }, // short hash
        ],
        orphans: [
          { hash: '99'.repeat(32) }, // missing height/algo/pool/branchlen/firstSeen
        ],
      },
    });

    await waitFor(() => expect(screen.getByText('Active Height')).toBeInTheDocument());
    // No active tip -> Active Height renders an em dash.
    const activeTile = screen.getByText('Active Height').closest('div');
    expect(within(activeTile).getByText('—')).toBeInTheDocument();
    // Sparse orphan renders em dashes for missing algo/pool.
    expect(screen.getAllByText('—').length).toBeGreaterThan(1);
  });

  it('buildOrphanBuckets returns seven day buckets and counts by local day', () => {
    const buckets = buildOrphanBuckets([
      { firstSeen: Date.now() },
      { firstSeen: NaN },
      null,
    ]);
    expect(buckets.length).toBe(7);
    expect(buckets[6].count).toBe(1);
  });

  it('buildDailySeries fills gaps to N UTC days and computes a trailing average', () => {
    const now = Date.UTC(2026, 6, 5, 12, 0, 0); // 2026-07-05
    const series = buildDailySeries(
      [
        { day: '2026-07-05', count: 3 },
        { day: '2026-07-03', count: 2 },
      ],
      5,
      now
    );
    expect(series.days.map((d) => d.day)).toEqual([
      '2026-07-01', '2026-07-02', '2026-07-03', '2026-07-04', '2026-07-05',
    ]);
    expect(series.counts).toEqual([0, 0, 2, 0, 3]); // gap on 07-04
    expect(series.rollingAvg[4]).toBeCloseTo(1.0, 1); // (0+0+2+0+3)/5
    expect(series.labels).toHaveLength(5);
  });

  it('buildDailySeries tolerates empty/undefined input', () => {
    const series = buildDailySeries(undefined, 30, Date.UTC(2026, 6, 5));
    expect(series.days).toHaveLength(30);
    expect(series.counts.every((c) => c === 0)).toBe(true);
  });

  it('connects to the testnet WebSocket endpoint on testnet', async () => {
    renderWithProviders(<ChainTipsPage />, { network: 'testnet' });
    await waitForAsync();
    expect(mockWebSocket).toHaveBeenCalledWith('ws://localhost:5003');
    const ws = webSocketInstances[0];
    ws.receiveMessage({ type: 'chainTips', data: { ...chainTipsData, network: 'testnet' } });
    await waitFor(() => {
      expect(screen.getByText('Active Height')).toBeInTheDocument();
    });
    // Testnet explorer link
    const links = screen.getAllByRole('link').filter((l) =>
      (l.getAttribute('href') || '').includes('/block/' + '11'.repeat(32))
    );
    expect(links.length).toBeGreaterThan(0);
  });
});
