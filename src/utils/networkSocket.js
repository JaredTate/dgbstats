/**
 * One WebSocket per page, and it comes back by itself.
 *
 * Each page opens its own socket (the server sends fresh snapshots such as
 * `recentBlocks` and `initialData` on connect). The site-wide ForkAlertBanner
 * used to open a second socket on every page; now it listens to the page's
 * socket through `subscribeNetworkMessages` instead.
 *
 * `openNetworkSocket` returns a small WebSocket-like object. Pages set
 * `onopen` / `onmessage` / `onclose` / `onerror` on it as before. When the
 * connection drops (phone sleep, Wi-Fi change, server restart) it reconnects
 * with capped exponential backoff (1, 2, 4, 8, 16, 30 s, with jitter) and keeps
 * the page's handlers. `close()` stops it for good, also while it is still
 * connecting or waiting to retry. `LiveDataNotice` shows a calm message while
 * the live feed is down (via `subscribeLiveStatus`).
 */
const listeners = new Set();
const statusListeners = new Set();
const liveSockets = new Set();

const CONNECTING = 0;
const OPEN = 1;
const CLOSING = 2;
const CLOSED = 3;

/** Base reconnect delays; the last one is the cap. */
export const RECONNECT_DELAYS_MS = [1000, 2000, 4000, 8000, 16000, 30000];

/** Delay before reconnect attempt `attempt` (0-based): 75–100% of the base. */
export function reconnectDelay(attempt) {
  const base = RECONNECT_DELAYS_MS[Math.min(attempt, RECONNECT_DELAYS_MS.length - 1)];
  return Math.round(base * (0.75 + 0.25 * Math.random()));
}

/** True when a page socket exists and is not connected. */
export function isLiveFeedDown() {
  for (const socket of liveSockets) {
    if (socket.readyState !== OPEN) return true;
  }
  return false;
}

let lastDown = false;
function notifyStatus() {
  const down = isLiveFeedDown();
  if (down === lastDown) return;
  lastDown = down;
  statusListeners.forEach((listener) => listener(down));
}

/** Listen for live-feed up/down changes. Returns an unsubscribe. */
export function subscribeLiveStatus(listener) {
  statusListeners.add(listener);
  return () => statusListeners.delete(listener);
}

function forwardToSubscribers(event) {
  if (listeners.size === 0) return;
  let message;
  try {
    message = JSON.parse(event.data);
  } catch {
    return;
  }
  listeners.forEach((listener) => listener(message));
}

function detach(ws) {
  ws.onopen = null;
  ws.onmessage = null;
  ws.onerror = null;
  ws.onclose = null;
  ws.removeEventListener?.('message', forwardToSubscribers);
}

class LiveSocket {
  constructor(url) {
    this.url = url;
    this.onopen = null;
    this.onmessage = null;
    this.onclose = null;
    this.onerror = null;
    this._ws = null;
    this._timer = null;
    this._attempt = 0;
    this._stopped = false;
    liveSockets.add(this);
    this._connect();
  }

  get readyState() {
    if (this._stopped) return CLOSED;
    return this._ws ? this._ws.readyState : CONNECTING;
  }

  _connect() {
    this._timer = null;
    if (this._stopped) return;
    if (this._ws) {
      // Should already be closed; make sure it can never stay alive.
      const old = this._ws;
      detach(old);
      if (old.readyState === CONNECTING || old.readyState === OPEN) old.close();
    }
    let ws;
    try {
      ws = new WebSocket(this.url);
    } catch (error) {
      this._ws = null;
      this._scheduleReconnect();
      return;
    }
    this._ws = ws;
    ws.addEventListener?.('message', forwardToSubscribers);
    ws.onopen = (event) => {
      this._attempt = 0;
      notifyStatus();
      this.onopen?.(event);
    };
    ws.onmessage = (event) => this.onmessage?.(event);
    ws.onerror = (event) => this.onerror?.(event);
    ws.onclose = (event) => {
      detach(ws);
      this._scheduleReconnect();
      this.onclose?.(event);
    };
    notifyStatus();
  }

  _scheduleReconnect() {
    if (this._stopped || this._timer) return;
    notifyStatus();
    this._timer = setTimeout(() => this._connect(), reconnectDelay(this._attempt));
    this._attempt += 1;
  }

  send(data) {
    if (this._ws && this._ws.readyState === OPEN) this._ws.send(data);
  }

  /** Close for good (page unmount). Works while connecting or waiting too. */
  close(code, reason) {
    if (this._stopped) return;
    this._stopped = true;
    clearTimeout(this._timer);
    this._timer = null;
    liveSockets.delete(this);
    const ws = this._ws;
    this._ws = null;
    if (ws) {
      detach(ws);
      if (ws.readyState === CONNECTING || ws.readyState === OPEN) {
        ws.close(code, reason);
      }
    }
    notifyStatus();
  }
}

LiveSocket.CONNECTING = CONNECTING;
LiveSocket.OPEN = OPEN;
LiveSocket.CLOSING = CLOSING;
LiveSocket.CLOSED = CLOSED;

/** Open a page socket that reconnects. Its messages also go to subscribers. */
export function openNetworkSocket(url) {
  return new LiveSocket(url);
}

/** Listen to messages from the current page socket. Returns an unsubscribe. */
export function subscribeNetworkMessages(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
