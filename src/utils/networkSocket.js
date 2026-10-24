/**
 * One WebSocket per page.
 *
 * Each page opens its own socket (the server sends fresh snapshots such as
 * `recentBlocks` and `initialData` on connect). The site-wide ForkAlertBanner
 * used to open a second socket on every page; now it listens to the page's
 * socket through `subscribeNetworkMessages` instead.
 */
const listeners = new Set();

/** Open a page socket. Its parsed messages are also passed to subscribers. */
export function openNetworkSocket(url) {
  const socket = new WebSocket(url);
  socket.addEventListener?.('message', (event) => {
    if (listeners.size === 0) return;
    let message;
    try {
      message = JSON.parse(event.data);
    } catch {
      return;
    }
    listeners.forEach((listener) => listener(message));
  });
  return socket;
}

/** Listen to messages from the current page socket. Returns an unsubscribe. */
export function subscribeNetworkMessages(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
