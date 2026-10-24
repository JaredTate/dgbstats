import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  openNetworkSocket,
  subscribeNetworkMessages,
  subscribeLiveStatus,
  isLiveFeedDown,
  reconnectDelay,
  RECONNECT_DELAYS_MS,
} from '../../../utils/networkSocket';
import { createWebSocketMock } from '../../utils/testUtils';

// SLOW-2 / CHAOS-4: pages never reconnected after the live socket dropped.
// CHAOS-3: closing a CONNECTING socket was skipped, so it leaked.
// The shared page socket now reconnects with capped backoff and always closes.

const OPEN = 1;
const CLOSED = 3;

/** The server (or the network) drops this raw socket. */
const drop = (raw, code = 1006) => {
  raw.readyState = CLOSED;
  raw.onclose?.({ type: 'close', code, reason: 'dropped' });
};

/** A connection attempt fails before it opens (error, then close). */
const fail = (raw) => {
  raw.onerror?.({ type: 'error' });
  drop(raw);
};

const live = (instances) => instances.filter((ws) => ws.readyState !== CLOSED);

describe('openNetworkSocket: reconnect with backoff', () => {
  let wsSetup;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(1); // no jitter: delay = base
    wsSetup = createWebSocketMock();
    global.WebSocket = wsSetup.MockWebSocket;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('opens one socket and forwards open and message events', () => {
    const socket = openNetworkSocket('ws://x');
    const onopen = vi.fn();
    const onmessage = vi.fn();
    socket.onopen = onopen;
    socket.onmessage = onmessage;
    vi.advanceTimersByTime(1);
    expect(wsSetup.instances).toHaveLength(1);
    expect(onopen).toHaveBeenCalledTimes(1);
    expect(socket.readyState).toBe(OPEN);
    wsSetup.instances[0].receiveMessage({ type: 'newBlock', data: { height: 1 } });
    expect(onmessage).toHaveBeenCalledTimes(1);
    socket.close();
  });

  it('reconnects after the server closes the socket', () => {
    const socket = openNetworkSocket('ws://x');
    const onopen = vi.fn();
    socket.onopen = onopen;
    vi.advanceTimersByTime(1);
    drop(wsSetup.instances[0]);
    vi.advanceTimersByTime(999);
    expect(wsSetup.instances).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(wsSetup.instances).toHaveLength(2);
    vi.advanceTimersByTime(1);
    expect(onopen).toHaveBeenCalledTimes(2); // page handlers carry over
    socket.close();
  });

  it('grows the delay 1, 2, 4, 8, 16, 30 s and caps it at 30 s', () => {
    const socket = openNetworkSocket('ws://x');
    const gaps = [];
    for (let i = 0; i < 8; i += 1) {
      const before = wsSetup.instances.length;
      fail(wsSetup.instances[before - 1]);
      let waited = 0;
      while (wsSetup.instances.length === before && waited < 60000) {
        vi.advanceTimersByTime(1000);
        waited += 1000;
      }
      gaps.push(waited);
    }
    expect(gaps).toEqual([1000, 2000, 4000, 8000, 16000, 30000, 30000, 30000]);
    socket.close();
  });

  it('resets the backoff after a successful connection', () => {
    const socket = openNetworkSocket('ws://x');
    fail(wsSetup.instances[0]);
    vi.advanceTimersByTime(1000);
    fail(wsSetup.instances[1]);
    vi.advanceTimersByTime(2000);
    expect(wsSetup.instances).toHaveLength(3);
    vi.advanceTimersByTime(1); // third socket opens
    drop(wsSetup.instances[2]);
    vi.advanceTimersByTime(1000); // back to 1 s
    expect(wsSetup.instances).toHaveLength(4);
    socket.close();
  });

  it('adds jitter but never waits longer than the cap', () => {
    Math.random.mockReturnValue(0);
    expect(reconnectDelay(0)).toBe(750);
    expect(reconnectDelay(99)).toBe(22500);
    Math.random.mockReturnValue(1);
    expect(reconnectDelay(99)).toBe(30000);
    expect(RECONNECT_DELAYS_MS).toEqual([1000, 2000, 4000, 8000, 16000, 30000]);
  });

  it('does not reconnect after the page closes it (unmount)', () => {
    const socket = openNetworkSocket('ws://x');
    const onclose = vi.fn();
    socket.onclose = onclose;
    vi.advanceTimersByTime(1);
    socket.close();
    vi.advanceTimersByTime(120000);
    expect(wsSetup.instances).toHaveLength(1);
    expect(live(wsSetup.instances)).toHaveLength(0);
    expect(onclose).not.toHaveBeenCalled(); // no state updates after unmount
  });

  it('cancels a pending retry when the page closes during the wait', () => {
    const socket = openNetworkSocket('ws://x');
    vi.advanceTimersByTime(1);
    drop(wsSetup.instances[0]);
    socket.close();
    vi.advanceTimersByTime(120000);
    expect(wsSetup.instances).toHaveLength(1);
  });

  it('closes a socket that is still CONNECTING (no leak)', () => {
    const socket = openNetworkSocket('ws://x');
    expect(wsSetup.instances[0].readyState).toBe(0);
    socket.close();
    vi.advanceTimersByTime(60000);
    expect(wsSetup.instances[0].close).toHaveBeenCalled();
    expect(live(wsSetup.instances)).toHaveLength(0);
  });

  it('still feeds site-wide subscribers after a reconnect', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeNetworkMessages(listener);
    const socket = openNetworkSocket('ws://x');
    vi.advanceTimersByTime(1);
    drop(wsSetup.instances[0]);
    vi.advanceTimersByTime(1000);
    vi.advanceTimersByTime(1);
    wsSetup.instances[1].receiveMessage({ type: 'forkAlert', data: { level: 'none' } });
    expect(listener).toHaveBeenCalledWith({ type: 'forkAlert', data: { level: 'none' } });
    unsubscribe();
    socket.close();
  });

  it('send() is a no-op while disconnected instead of throwing', () => {
    const socket = openNetworkSocket('ws://x');
    expect(() => socket.send('hi')).not.toThrow();
    vi.advanceTimersByTime(1);
    socket.send('hi');
    expect(wsSetup.instances[0].getSentMessages()).toEqual(['hi']);
    socket.close();
  });

  it('reports the live status to subscribers', () => {
    const states = [];
    const unsubscribe = subscribeLiveStatus((down) => states.push(down));
    const socket = openNetworkSocket('ws://x');
    expect(isLiveFeedDown()).toBe(true); // connecting
    vi.advanceTimersByTime(1);
    expect(isLiveFeedDown()).toBe(false);
    drop(wsSetup.instances[0]);
    expect(isLiveFeedDown()).toBe(true);
    socket.close();
    expect(isLiveFeedDown()).toBe(false); // no page socket = nothing to warn about
    expect(states).toEqual([true, false, true, false]);
    unsubscribe();
  });
});

describe('openNetworkSocket: fuzz (random open/close/error/unmount)', () => {
  // Small seeded PRNG so a failure can be replayed.
  const mulberry32 = (seed) => () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('never leaves more than one live socket per page and never throws', () => {
    for (let seed = 1; seed <= 60; seed += 1) {
      vi.useFakeTimers();
      const rand = mulberry32(seed);
      const wsSetup = createWebSocketMock();
      global.WebSocket = wsSetup.MockWebSocket;
      // Opening may happen at any time; we drive it from the fuzz loop instead.
      let page = openNetworkSocket('ws://x');
      const log = [];

      expect(() => {
        for (let step = 0; step < 80; step += 1) {
          const raw = wsSetup.instances[wsSetup.instances.length - 1];
          const roll = rand();
          if (roll < 0.25) {
            log.push('advance');
            vi.advanceTimersByTime(Math.floor(rand() * 40000));
          } else if (roll < 0.45) {
            log.push('open');
            vi.advanceTimersByTime(1);
          } else if (roll < 0.65) {
            log.push('close');
            if (raw) drop(raw, rand() < 0.5 ? 1006 : 1001);
          } else if (roll < 0.8) {
            log.push('error');
            if (raw) fail(raw);
          } else if (roll < 0.9) {
            log.push('unmount+remount');
            page.close();
            page = openNetworkSocket('ws://x');
          } else {
            log.push('page-close-twice');
            page.close();
            page.close();
            page = openNetworkSocket('ws://x');
          }
          expect(live(wsSetup.instances).length).toBeLessThanOrEqual(1);
        }
        page.close();
        vi.advanceTimersByTime(300000);
      }).not.toThrow();

      if (live(wsSetup.instances).length) throw new Error(`seed ${seed}: ${log.join(',')}`);
      expect(isLiveFeedDown()).toBe(false);
      vi.useRealTimers();
    }
  });
});
