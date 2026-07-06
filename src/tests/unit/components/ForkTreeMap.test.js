import { describe, it, expect, vi, afterEach } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';
import ForkTreeMap from '../../../components/ForkTreeMap';
import { renderWithProviders } from '../../utils/testUtils';

// The map derives its visible window (N heights) from useWidth(); mock it via a
// hoisted mutable so tests default to a desktop width (N === 24) but can opt
// into a mobile width to exercise the responsive branches.
const widthState = vi.hoisted(() => ({ value: 800 }));
vi.mock('../../../utils', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useWidth: () => widthState.value };
});

afterEach(() => {
  widthState.value = 800;
});

const TOP = 23784910;

const makeBlock = (height, overrides = {}) => ({
  height,
  hash: `${height.toString(16)}`.padStart(2, '0').repeat(32).slice(0, 64),
  algo: 'skein',
  poolIdentifier: 'SkeinPool',
  timestamp: Math.floor(Date.now() / 1000),
  ...overrides,
});

// Six consecutive main-chain blocks, newest first.
const blocks = [
  makeBlock(TOP, { hash: 'aa'.repeat(32), algo: 'sha256d', poolIdentifier: 'DigiHash' }),
  makeBlock(TOP - 1, { hash: 'bb'.repeat(32) }),
  makeBlock(TOP - 2, { hash: 'cc'.repeat(32) }),
  makeBlock(TOP - 3, { hash: 'dd'.repeat(32) }),
  makeBlock(TOP - 4, { hash: 'ee'.repeat(32) }),
  makeBlock(TOP - 5, { hash: 'ff'.repeat(32) }),
];

describe('ForkTreeMap', () => {
  it('renders the map container with its data-testid', () => {
    renderWithProviders(
      <ForkTreeMap blocks={blocks} tips={[]} activeHash={'aa'.repeat(32)} accentColor="#002352" />
    );
    expect(screen.getByTestId('fork-tree-map')).toBeInTheDocument();
  });

  it('renders one spine node per in-window main-chain block', () => {
    renderWithProviders(
      <ForkTreeMap blocks={blocks} tips={[]} activeHash={'aa'.repeat(32)} accentColor="#002352" />
    );
    const nodes = screen.getAllByTestId('spine-node');
    expect(nodes.length).toBe(6);
  });

  it('marks the active tip node (hash === activeHash)', () => {
    renderWithProviders(
      <ForkTreeMap blocks={blocks} tips={[]} activeHash={'aa'.repeat(32)} accentColor="#002352" />
    );
    const active = screen.getAllByTestId('spine-node').filter(
      (n) => n.getAttribute('data-active') === 'true'
    );
    expect(active.length).toBe(1);
  });

  it('renders a fork branch when a tip forkHeight is within the visible window', () => {
    const tips = [
      {
        hash: '12'.repeat(32),
        height: TOP - 2,
        branchlen: 2,
        status: 'valid-fork',
        forkHeight: TOP - 4,
      },
    ];
    renderWithProviders(
      <ForkTreeMap blocks={blocks} tips={tips} activeHash={'aa'.repeat(32)} accentColor="#002352" />
    );
    const branches = screen.getAllByTestId('fork-branch');
    expect(branches.length).toBe(1);
    expect(branches[0].getAttribute('data-status')).toBe('valid-fork');
    // The branch renders branchlen small nodes.
    expect(screen.getAllByTestId('branch-node').length).toBeGreaterThanOrEqual(1);
  });

  it('labels the branch tip with its short hash on desktop widths', () => {
    const tips = [
      { hash: '12'.repeat(32), height: TOP - 2, branchlen: 2, status: 'valid-fork', forkHeight: TOP - 4 },
    ];
    renderWithProviders(
      <ForkTreeMap blocks={blocks} tips={tips} activeHash={'aa'.repeat(32)} accentColor="#002352" />
    );
    const label = screen.getByTestId('branch-tip-label');
    expect(label.textContent).toContain('1212');
    expect(label.textContent).toContain('…');
  });

  it('does not render a branch whose forkHeight is out of the window', () => {
    const tips = [
      {
        hash: '34'.repeat(32),
        height: TOP - 200,
        branchlen: 2,
        status: 'invalid',
        forkHeight: TOP - 202,
      },
    ];
    renderWithProviders(
      <ForkTreeMap blocks={blocks} tips={tips} activeHash={'aa'.repeat(32)} accentColor="#002352" />
    );
    expect(screen.queryByTestId('fork-branch')).not.toBeInTheDocument();
  });

  it('shows a waiting placeholder and does not crash with no blocks', () => {
    renderWithProviders(
      <ForkTreeMap blocks={[]} tips={[]} activeHash={null} accentColor="#002352" />
    );
    expect(screen.getByTestId('fork-tree-map')).toBeInTheDocument();
    expect(screen.getByText(/Waiting for live chain data/i)).toBeInTheDocument();
    expect(screen.queryByTestId('spine-node')).not.toBeInTheDocument();
  });

  it('shows a tooltip with the block height when a spine node is hovered', () => {
    renderWithProviders(
      <ForkTreeMap blocks={blocks} tips={[]} activeHash={'aa'.repeat(32)} accentColor="#002352" />
    );
    const node = screen.getAllByTestId('spine-node')[0];
    fireEvent.mouseOver(node);
    const tooltip = screen.getByTestId('fork-tooltip');
    expect(within(tooltip).getByText(new RegExp(String(TOP)))).toBeInTheDocument();
  });

  it('renders a status legend', () => {
    renderWithProviders(
      <ForkTreeMap blocks={blocks} tips={[]} activeHash={'aa'.repeat(32)} accentColor="#002352" />
    );
    expect(screen.getByTestId('fork-legend')).toBeInTheDocument();
  });

  it('clears the tooltip on mouse out and reopens on click', () => {
    renderWithProviders(
      <ForkTreeMap blocks={blocks} tips={[]} activeHash={'aa'.repeat(32)} accentColor="#002352" />
    );
    const node = screen.getAllByTestId('spine-node')[0];
    fireEvent.mouseOver(node);
    expect(screen.getByTestId('fork-tooltip')).toBeInTheDocument();
    fireEvent.mouseOut(node);
    expect(screen.queryByTestId('fork-tooltip')).not.toBeInTheDocument();
    fireEvent.click(node);
    expect(screen.getByTestId('fork-tooltip')).toBeInTheDocument();
  });

  it('shows a tooltip with the tip status when a branch node is hovered', () => {
    const tips = [
      { hash: '12'.repeat(32), height: TOP - 2, branchlen: 2, status: 'invalid', forkHeight: TOP - 4, algo: 'scrypt', pool: 'ForkPool' },
    ];
    renderWithProviders(
      <ForkTreeMap blocks={blocks} tips={tips} activeHash={'aa'.repeat(32)} accentColor="#002352" />
    );
    const branchNode = screen.getAllByTestId('branch-node')[0];
    fireEvent.mouseOver(branchNode);
    const tooltip = screen.getByTestId('fork-tooltip');
    expect(within(tooltip).getByText(/invalid/)).toBeInTheDocument();
    expect(within(tooltip).getByText(/ForkPool/)).toBeInTheDocument();
    fireEvent.click(branchNode);
    expect(screen.getByTestId('fork-tooltip')).toBeInTheDocument();
  });

  it('derives the fork height from branchlen when forkHeight is absent (single-node branch)', () => {
    const tips = [
      { hash: '99'.repeat(32), height: TOP - 1, branchlen: 1, status: 'headers-only' },
    ];
    renderWithProviders(
      <ForkTreeMap blocks={blocks} tips={tips} activeHash={'aa'.repeat(32)} accentColor="#002352" />
    );
    const branch = screen.getByTestId('fork-branch');
    expect(branch.getAttribute('data-status')).toBe('headers-only');
    expect(screen.getAllByTestId('branch-node').length).toBe(1);
  });

  it('renders on a mobile width and tolerates null/odd blocks and sparse tips', () => {
    widthState.value = 375; // isMobile -> N=14, VBW=300, branchGap=34
    const oddBlocks = [
      null, // filtered out by the `b &&` guard
      makeBlock(TOP, { hash: 'aa'.repeat(32), algo: null, poolIdentifier: undefined, pool: 'FallbackPool' }),
      makeBlock(TOP, { hash: 'ab'.repeat(32) }), // duplicate height -> deduped
      makeBlock(TOP - 1, { hash: 'bb'.repeat(32) }),
      makeBlock(NaN, { hash: 'cc'.repeat(32) }), // non-finite height -> filtered out
      makeBlock(TOP - 100, { hash: 'zz'.repeat(32) }), // below the window -> dropped
    ];
    const sparseTips = [
      { hash: '77'.repeat(32), height: TOP - 1 }, // no status, no branchlen, no forkHeight
    ];
    renderWithProviders(
      <ForkTreeMap blocks={oddBlocks} tips={sparseTips} activeHash={'aa'.repeat(32)} accentColor="#002352" />
    );
    // TOP (deduped) + TOP-1 -> 2 spine nodes.
    expect(screen.getAllByTestId('spine-node').length).toBe(2);
    // Sparse tip defaults to the valid-fork status.
    expect(screen.getByTestId('fork-branch').getAttribute('data-status')).toBe('valid-fork');
    // Pool fallback (poolIdentifier missing -> pool).
    fireEvent.mouseOver(screen.getAllByTestId('spine-node')[0]);
    expect(within(screen.getByTestId('fork-tooltip')).getByText(/FallbackPool/)).toBeInTheDocument();
  });

  it('renders the placeholder when blocks/tips are null', () => {
    renderWithProviders(
      <ForkTreeMap blocks={null} tips={null} activeHash={null} accentColor="#002352" />
    );
    expect(screen.getByText(/Waiting for live chain data/i)).toBeInTheDocument();
  });

  it('handles blocks with unknown algo, short and missing hashes without crashing', () => {
    const oddBlocks = [
      makeBlock(TOP, { hash: undefined, algo: 'mysteryalgo' }),
      makeBlock(TOP - 1, { hash: 'abcd', algo: 'skein' }),
    ];
    renderWithProviders(
      <ForkTreeMap blocks={oddBlocks} tips={[]} activeHash={null} accentColor="#002352" />
    );
    const nodes = screen.getAllByTestId('spine-node');
    expect(nodes.length).toBe(2);
    // No node is active because activeHash is null.
    expect(nodes.filter((n) => n.getAttribute('data-active') === 'true').length).toBe(0);
    fireEvent.mouseOver(nodes[0]);
    expect(within(screen.getByTestId('fork-tooltip')).getByText('—')).toBeInTheDocument();
    fireEvent.mouseOver(nodes[1]);
    expect(within(screen.getByTestId('fork-tooltip')).getByText('abcd')).toBeInTheDocument();
  });
});
