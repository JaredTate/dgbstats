import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import MainnetLayout from '../../../components/MainnetLayout';
import HomePage from '../../../pages/HomePage';
import BlocksPage from '../../../pages/BlocksPage';
import TxsPage from '../../../pages/TxsPage';
import SupplyPage from '../../../pages/SupplyPage';
import { LIVE_NOTICE_DELAY_MS } from '../../../components/LiveDataNotice';
import { createWebSocketMock } from '../../utils/testUtils';

// SLOW-2 / CHAOS-4: pages never reconnected after the live socket dropped.
// CHAOS-3: leaving /txs while its socket was CONNECTING leaked the socket.
// CHAOS-5: /supply's retry timer opened a socket after the page was gone.
// SLOW-3: nothing told the user the live feed was down.

const CLOSED = 3;
const NOTICE = /Live data paused – reconnecting…/;

let navigate;
const NavigateGrabber = () => {
  navigate = useNavigate();
  return null;
};

function renderApp(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <NavigateGrabber />
      <Routes>
        <Route element={<MainnetLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/blocks" element={<BlocksPage />} />
          <Route path="/txs" element={<TxsPage />} />
          <Route path="/supply" element={<SupplyPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('Pages reconnect after the live socket drops', () => {
  let wsSetup;
  const live = () => wsSetup.instances.filter((ws) => ws.readyState !== CLOSED);
  const last = () => wsSetup.instances[wsSetup.instances.length - 1];
  const advance = (ms) => act(() => { vi.advanceTimersByTime(ms); });
  const drop = (ws = last()) => act(() => {
    ws.readyState = CLOSED;
    ws.onclose?.({ type: 'close', code: 1006, reason: 'dropped' });
  });

  // A socket that stays CONNECTING (server or network not answering).
  function hangingSocket(url) {
    const ws = {
      url,
      readyState: 0,
      close: vi.fn(() => { ws.readyState = CLOSED; }),
      send: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    wsSetup.instances.push(ws);
    return ws;
  }

  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(1); // no jitter
    vi.spyOn(console, 'log').mockImplementation(() => {});
    wsSetup = createWebSocketMock();
    global.WebSocket = wsSetup.MockWebSocket;
    global.fetch = vi.fn(() => new Promise(() => {})); // REST never answers
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it.each(['/', '/blocks', '/txs', '/supply'])('%s opens a new socket after a drop', (path) => {
    renderApp(path);
    advance(1);
    expect(wsSetup.instances).toHaveLength(1);
    drop();
    advance(1000);
    expect(wsSetup.instances).toHaveLength(2);
    advance(1);
    expect(live()).toHaveLength(1);
  });

  it('/txs and /supply reconnect only once per drop (no double reconnect)', () => {
    for (const path of ['/txs', '/supply']) {
      const { unmount } = renderApp(path);
      advance(1);
      const before = wsSetup.instances.length;
      drop();
      advance(60000);
      expect(wsSetup.instances.length).toBe(before + 1);
      expect(live()).toHaveLength(1);
      unmount();
    }
  });

  it('closes the /txs socket when you leave while it is still connecting (CHAOS-3)', () => {
    renderApp('/');
    advance(1);
    for (let i = 0; i < 3; i += 1) {
      act(() => navigate('/txs'));
      act(() => navigate(-1)); // leave before the /txs socket opens
      advance(1);
    }
    advance(60000);
    expect(live()).toHaveLength(1); // only the home page socket
  });

  it('does not open a socket after leaving /supply during a retry wait (CHAOS-5)', () => {
    renderApp('/supply');
    advance(1);
    drop();
    advance(500);
    act(() => navigate('/blocks'));
    advance(60000);
    expect(live()).toHaveLength(1);
    expect(live()[0]).toBe(last());
  });

  it('shows a calm notice only after the feed has been down a few seconds', () => {
    renderApp('/');
    advance(1);
    expect(screen.queryByText(NOTICE)).not.toBeInTheDocument();
    global.WebSocket.mockImplementation(hangingSocket); // reconnects hang
    drop();
    advance(LIVE_NOTICE_DELAY_MS - 100);
    expect(screen.queryByText(NOTICE)).not.toBeInTheDocument();
    advance(200);
    expect(screen.getByRole('status')).toHaveTextContent(NOTICE);
    // The pending attempt finally connects: the notice goes away.
    const ws = last();
    act(() => {
      ws.readyState = 1;
      ws.onopen?.({ type: 'open' });
    });
    expect(screen.queryByText(NOTICE)).not.toBeInTheDocument();
  });

  it('shows the notice when the first connection hangs and never opens (SLOW-3)', () => {
    global.WebSocket.mockImplementation(hangingSocket);
    renderApp('/');
    advance(LIVE_NOTICE_DELAY_MS - 100);
    expect(screen.queryByText(NOTICE)).not.toBeInTheDocument();
    advance(200);
    expect(screen.getByRole('status')).toHaveTextContent(NOTICE);
  });

  it('a short blip does not show the notice', () => {
    renderApp('/');
    advance(1);
    drop();
    advance(1001); // reconnected after ~1 s
    advance(LIVE_NOTICE_DELAY_MS);
    expect(screen.queryByText(NOTICE)).not.toBeInTheDocument();
  });

  it('fuzz: random drops and page changes never leave more than one live socket', () => {
    const paths = ['/', '/blocks', '/txs', '/supply'];
    let seed = 7;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const { unmount } = renderApp('/');
    for (let step = 0; step < 120; step += 1) {
      const roll = rand();
      if (roll < 0.3) advance(Math.floor(rand() * 35000));
      else if (roll < 0.45) advance(1);
      else if (roll < 0.65) { if (live().length) drop(live()[0]); }
      else if (roll < 0.75) act(() => last().onerror?.({ type: 'error' }));
      else act(() => navigate(paths[Math.floor(rand() * paths.length)]));
      expect(live().length).toBeLessThanOrEqual(1);
    }
    unmount();
    advance(120000);
    expect(live()).toHaveLength(0);
  });
});
