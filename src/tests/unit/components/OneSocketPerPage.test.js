import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom';
import MainnetLayout from '../../../components/MainnetLayout';
import TestnetLayout from '../../../components/TestnetLayout';
import BlocksPage from '../../../pages/BlocksPage';
import ChainTipsPage from '../../../pages/ChainTipsPage';
import { createWebSocketMock, waitForAsync } from '../../utils/testUtils';

// B2: each page opened 2 WebSockets — one for the page and one for the
// site-wide ForkAlertBanner in the layout. Each page must open exactly one.

function renderApp(initialPath) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Link to="/tips">go-tips</Link>
      <Routes>
        <Route element={<MainnetLayout />}>
          <Route path="/blocks" element={<BlocksPage />} />
          <Route path="/tips" element={<ChainTipsPage />} />
        </Route>
        <Route path="/testnet" element={<TestnetLayout />}>
          <Route path="blocks" element={<BlocksPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('One WebSocket per page (B2)', () => {
  let wsSetup;
  const open = () => wsSetup.instances.filter((ws) => ws.readyState !== WebSocket.CLOSED);

  beforeEach(() => {
    wsSetup = createWebSocketMock();
    global.WebSocket = wsSetup.MockWebSocket;
  });

  afterEach(() => {
    wsSetup.instances.forEach((ws) => ws.close());
    wsSetup.clearInstances();
    vi.clearAllMocks();
  });

  it('opens exactly one mainnet socket for a page with the fork banner', async () => {
    renderApp('/blocks');
    await waitForAsync();
    expect(wsSetup.instances).toHaveLength(1);
    expect(wsSetup.instances[0].url).toBe('ws://localhost:5002');
  });

  it('opens exactly one testnet socket on a testnet page', async () => {
    renderApp('/testnet/blocks');
    await waitForAsync();
    expect(wsSetup.instances).toHaveLength(1);
    expect(wsSetup.instances[0].url).toBe('ws://localhost:5003');
  });

  it('still shows the fork banner, fed by the page socket', async () => {
    renderApp('/blocks');
    await waitForAsync();
    wsSetup.instances[0].receiveMessage({
      type: 'forkAlert',
      data: { network: 'mainnet', level: 'critical', reason: 'deep reorg detected', branchlen: 4 },
    });
    await waitFor(() => expect(screen.getByText(/deep reorg detected/)).toBeInTheDocument());
  });

  it('keeps one open socket after navigating to another page', async () => {
    renderApp('/blocks');
    await waitForAsync();
    fireEvent.click(screen.getByText('go-tips'));
    await waitForAsync();
    expect(open()).toHaveLength(1);
    expect(wsSetup.instances).toHaveLength(2); // old page closed, new page opened
  });
});
