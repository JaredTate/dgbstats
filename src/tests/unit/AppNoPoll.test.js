import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import App from '../../App';
import { createWebSocketMock } from '../utils/testUtils';

// SLOW-10: App used to fetch 4 REST APIs every 30 s on every page, even where
// nothing used them. Pages that need this data fetch it themselves.
const POLLED = /\/api\/(getblockchaininfo|getchaintxstats|gettxoutsetinfo|getblockreward)\b/;

describe('App (SLOW-10: no app-wide polling)', () => {
  let ws;
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    ws = createWebSocketMock();
    global.WebSocket = ws.MockWebSocket;
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    ws.instances.forEach((s) => s.close());
    ws.clearInstances();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it.each(['/', '/testnet/blocks'])('does not poll the REST APIs on %s', async (path) => {
    window.history.pushState({}, '', path);
    render(<App />);
    await screen.findAllByRole('heading', { level: 1 });
    await act(async () => { vi.advanceTimersByTime(65000); });
    const polled = global.fetch.mock.calls.map(([url]) => String(url)).filter((u) => POLLED.test(u));
    expect(polled).toEqual([]);
  });
});
