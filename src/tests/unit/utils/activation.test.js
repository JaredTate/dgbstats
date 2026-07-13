import { describe, it, expect } from 'vitest';
import {
  ceilToPeriod,
  nextPeriodBoundary,
  lockInActivationHeight,
  blocksRemaining,
  splitDuration,
  formatEta,
} from '../../../utils/activation';

// DigiByte mainnet BIP9 params for DigiDollar (bit 23).
const MAINNET_PERIOD = 40320;
const MAINNET_MIN_ACTIVATION = 23627520; // = 586 * 40320 (already passed at lock-in)

describe('activation math (BIP9)', () => {
  describe('ceilToPeriod', () => {
    it('rounds up to the next period boundary', () => {
      expect(ceilToPeriod(23627521, 40320)).toBe(23667840); // 587 * 40320
    });
    it('is a no-op for exact boundaries', () => {
      expect(ceilToPeriod(23627520, 40320)).toBe(23627520); // 586 * 40320
    });
  });

  describe('nextPeriodBoundary', () => {
    it('returns the start of the period after the one containing height', () => {
      // 23,846,625 is in window 591 [23,829,120 .. 23,869,439]
      expect(nextPeriodBoundary(23846625, 40320)).toBe(23869440); // 592 * 40320
    });
    it('advances a full period past an exact boundary', () => {
      expect(nextPeriodBoundary(23829120, 40320)).toBe(23869440);
    });
  });

  describe('lockInActivationHeight — mainnet LOCKED_IN (the bug)', () => {
    // Live mainnet getdeploymentinfo at the time of writing:
    //   status locked_in, since 23,829,120, period 40,320, height 23,846,625
    it('activates at since + period, NOT at min_activation_height', () => {
      const h = lockInActivationHeight({
        currentHeight: 23846625,
        period: MAINNET_PERIOD,
        minActivationHeight: MAINNET_MIN_ACTIVATION,
        since: 23829120,
      });
      expect(h).toBe(23869440);
      expect(h).not.toBe(MAINNET_MIN_ACTIVATION);
    });

    it('is correct without `since` (older WebSocket payload) via current height', () => {
      const h = lockInActivationHeight({
        currentHeight: 23846625,
        period: MAINNET_PERIOD,
        minActivationHeight: MAINNET_MIN_ACTIVATION,
      });
      expect(h).toBe(23869440);
    });

    it('reports a positive, real countdown instead of 0 blocks remaining', () => {
      const target = lockInActivationHeight({
        currentHeight: 23846625,
        period: MAINNET_PERIOD,
        minActivationHeight: MAINNET_MIN_ACTIVATION,
        since: 23829120,
      });
      expect(blocksRemaining(target, 23846625)).toBe(22815);
      // The old (buggy) behaviour used min_activation_height and got 0.
      expect(blocksRemaining(MAINNET_MIN_ACTIVATION, 23846625)).toBe(0);
    });
  });

  describe('lockInActivationHeight — testnet-style (min_activation ahead of tip)', () => {
    // period 200, min_activation 600, tip 289 in window [200..399].
    it('honours min_activation_height when it is beyond the next boundary', () => {
      const h = lockInActivationHeight({
        currentHeight: 289,
        period: 200,
        minActivationHeight: 600,
      });
      expect(h).toBe(600); // next boundary is 400, but the floor 600 wins
      expect(blocksRemaining(h, 289)).toBe(311);
    });

    it('falls back to the min_activation floor when height is unknown', () => {
      const h = lockInActivationHeight({ period: 200, minActivationHeight: 600 });
      expect(h).toBe(600);
    });
  });

  describe('lockInActivationHeight — waiting for a future min_activation_height', () => {
    it('activates at the first boundary >= min_activation_height', () => {
      // Locked in at window 5 (since 1000, period 200) but floor is window 10.
      const h = lockInActivationHeight({
        currentHeight: 1450,
        period: 200,
        minActivationHeight: 2000,
        since: 1000,
      });
      expect(h).toBe(2000);
    });
  });

  it('lockInActivationHeight returns null for an unusable period', () => {
    expect(lockInActivationHeight({ currentHeight: 100, period: 0 })).toBeNull();
  });

  describe('splitDuration', () => {
    it('splits seconds into d/h/m/s', () => {
      // 22,815 blocks * 15s = 342,225s = 3d 23h 3m 45s
      expect(splitDuration(342225)).toEqual({
        days: 3, hours: 23, minutes: 3, seconds: 45, totalSeconds: 342225,
      });
    });
    it('clamps negatives to zero', () => {
      expect(splitDuration(-5)).toEqual({
        days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0,
      });
    });
  });

  describe('formatEta', () => {
    it('formats multi-day ETAs', () => {
      expect(formatEta(22815)).toBe('~4.0 days');
    });
    it('formats sub-day ETAs in hours', () => {
      expect(formatEta(311)).toBe('~1.3 hours');
    });
    it('formats sub-hour ETAs in minutes', () => {
      expect(formatEta(20)).toBe('~5 minutes');
    });
    it('handles null', () => {
      expect(formatEta(null)).toBe('—');
    });
  });
});
