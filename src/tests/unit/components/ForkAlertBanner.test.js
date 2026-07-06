import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, fireEvent, act } from '@testing-library/react';
import ForkAlertBanner from '../../../components/ForkAlertBanner';
import { renderWithProviders, createWebSocketMock, waitForAsync } from '../../utils/testUtils';

vi.mock('../../../config', () => ({
  default: {
    apiBaseUrl: 'http://localhost:5001',
    wsBaseUrl: 'ws://localhost:5002',
  },
}));

describe('ForkAlertBanner', () => {
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

  it('renders nothing before any alert arrives', async () => {
    renderWithProviders(<ForkAlertBanner />);
    await waitForAsync();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('stays hidden when a level:none alert arrives', async () => {
    renderWithProviders(<ForkAlertBanner />);
    await waitForAsync();
    const ws = webSocketInstances[0];
    ws.receiveMessage({ type: 'forkAlert', data: { network: 'mainnet', level: 'none', reason: 'all clear' } });
    await waitForAsync();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('opens its WebSocket to the mainnet endpoint', async () => {
    renderWithProviders(<ForkAlertBanner />);
    await waitForAsync();
    expect(mockWebSocket).toHaveBeenCalledWith('ws://localhost:5002');
  });

  it('shows a warning Alert with a /tips link on an elevated alert', async () => {
    renderWithProviders(<ForkAlertBanner />);
    await waitForAsync();
    const ws = webSocketInstances[0];
    ws.receiveMessage({
      type: 'forkAlert',
      data: { network: 'mainnet', level: 'elevated', reason: 'competing branch at tip', height: 100, branchlen: 1 },
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    const alert = screen.getByRole('alert');
    expect(alert.className).toMatch(/Warning/);
    expect(screen.getByText(/competing branch at tip/)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /view chain tips/i });
    expect(link).toHaveAttribute('href', '/tips');
  });

  it('shows an error severity Alert on a critical alert', async () => {
    renderWithProviders(<ForkAlertBanner />);
    await waitForAsync();
    const ws = webSocketInstances[0];
    ws.receiveMessage({
      type: 'forkAlert',
      data: { network: 'mainnet', level: 'critical', reason: 'deep reorg detected', height: 200, branchlen: 4 },
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.getByRole('alert').className).toMatch(/Error/);
    expect(screen.getByText(/deep reorg detected/)).toBeInTheDocument();
  });

  it('can be dismissed and then stays hidden for the same severity', async () => {
    renderWithProviders(<ForkAlertBanner />);
    await waitForAsync();
    const ws = webSocketInstances[0];
    ws.receiveMessage({
      type: 'forkAlert',
      data: { network: 'mainnet', level: 'elevated', reason: 'competing branch', height: 100, branchlen: 1 },
    });

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());

    const closeBtn = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeBtn);
    await waitForAsync();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    // A repeat elevated alert (same severity) stays dismissed.
    ws.receiveMessage({
      type: 'forkAlert',
      data: { network: 'mainnet', level: 'elevated', reason: 'still competing', height: 101, branchlen: 1 },
    });
    await waitForAsync();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('re-shows when a higher-severity alert arrives after dismissal', async () => {
    renderWithProviders(<ForkAlertBanner />);
    await waitForAsync();
    const ws = webSocketInstances[0];
    ws.receiveMessage({
      type: 'forkAlert',
      data: { network: 'mainnet', level: 'elevated', reason: 'competing branch', height: 100, branchlen: 1 },
    });
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    await waitForAsync();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    ws.receiveMessage({
      type: 'forkAlert',
      data: { network: 'mainnet', level: 'critical', reason: 'deep reorg', height: 200, branchlen: 5 },
    });
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert').className).toMatch(/Error/);
  });

  it('stays hidden for an unknown level and renders without a branch length', async () => {
    renderWithProviders(<ForkAlertBanner />);
    await waitForAsync();
    const ws = webSocketInstances[0];
    // Unknown level ranks as 0 -> hidden.
    ws.receiveMessage({ type: 'forkAlert', data: { network: 'mainnet', level: 'bogus', reason: 'weird' } });
    await waitForAsync();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    // Elevated alert without a branchlen still renders (no branch-length suffix).
    ws.receiveMessage({ type: 'forkAlert', data: { network: 'mainnet', level: 'elevated', reason: 'no branchlen here' } });
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByText(/no branchlen here/)).toBeInTheDocument();
    expect(screen.queryByText(/branch length/)).not.toBeInTheDocument();
  });

  it('ignores malformed WebSocket payloads without crashing', async () => {
    renderWithProviders(<ForkAlertBanner />);
    await waitForAsync();
    const ws = webSocketInstances[0];
    act(() => {
      ws.onmessage({ data: '{not valid json' });
    });
    await waitForAsync();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('links to the testnet tips page on testnet', async () => {
    renderWithProviders(<ForkAlertBanner />, { network: 'testnet' });
    await waitForAsync();
    const ws = webSocketInstances[0];
    ws.receiveMessage({
      type: 'forkAlert',
      data: { network: 'testnet', level: 'elevated', reason: 'competing branch', height: 100, branchlen: 1 },
    });
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    const link = screen.getByRole('link', { name: /view chain tips/i });
    expect(link).toHaveAttribute('href', '/testnet/tips');
  });
});
