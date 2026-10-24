import { describe, it, expect } from 'vitest';
import { prependUniqueBlock } from '../../../utils/blocks';

describe('prependUniqueBlock', () => {
  const a = { height: 3, hash: 'aaa' };
  const b = { height: 2, hash: 'bbb' };
  const c = { height: 1, hash: 'ccc' };

  it('prepends a new block', () => {
    expect(prependUniqueBlock([b, c], a)).toEqual([a, b, c]);
  });

  it('ignores a block whose hash is already in the list', () => {
    const list = [a, b, c];
    expect(prependUniqueBlock(list, { ...b })).toBe(list);
  });

  it('ignores the same newBlock sent twice in a row', () => {
    const once = prependUniqueBlock([b, c], a);
    expect(prependUniqueBlock(once, { ...a })).toEqual([a, b, c]);
  });

  it('keeps blocks that have no hash (cannot be de-duplicated)', () => {
    const noHash = { height: 4 };
    expect(prependUniqueBlock([a], noHash)).toEqual([noHash, a]);
  });

  it('caps the list length when a limit is given', () => {
    expect(prependUniqueBlock([b, c], a, 2)).toEqual([a, b]);
  });

  it('handles a missing previous list', () => {
    expect(prependUniqueBlock(undefined, a)).toEqual([a]);
  });
});
