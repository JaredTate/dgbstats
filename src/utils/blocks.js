/**
 * Prepend a live `newBlock` to a block list, skipping it when a block with the
 * same hash is already there. The server can send the same block more than
 * once (and the list may already hold it from `recentBlocks`), so every page
 * that merges live blocks should go through this.
 *
 * @param {Array} blocks - current list, newest first
 * @param {Object} block - the incoming block
 * @param {number} [limit] - optional max length of the result
 * @returns {Array} the new list (or the same list if the block was a duplicate)
 */
export function prependUniqueBlock(blocks = [], block, limit) {
  if (block?.hash && blocks.some((b) => b?.hash === block.hash)) return blocks;
  const next = [block, ...blocks];
  return limit ? next.slice(0, limit) : next;
}
