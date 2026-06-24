import { describe, expect, it } from 'vitest';
import { parseBlockRewardResponse } from '../../App';

describe('App data guards', () => {
  it('returns null when block reward data is unavailable', () => {
    expect(parseBlockRewardResponse(null)).toBeNull();
    expect(parseBlockRewardResponse({})).toBeNull();
  });

  it('parses current and legacy block reward response shapes', () => {
    expect(parseBlockRewardResponse({ blockReward: { blockreward: '625.0' } })).toBe(625);
    expect(parseBlockRewardResponse({ blockreward: '312.5' })).toBe(312.5);
    expect(parseBlockRewardResponse({ blockReward: '156.25' })).toBe(156.25);
  });
});
