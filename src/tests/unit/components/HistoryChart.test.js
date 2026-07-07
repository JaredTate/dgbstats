import { describe, it, expect } from 'vitest';
import {
  resolveView, bucketLabel, applyZoom, sliderMarks,
  HISTORY_RANGES, DEFAULT_RANGE_KEY, ZOOMABLE_RANGES,
} from '../../../components/HistoryChart';

const daily = Array.from({ length: 1200 }, (_, i) => ({ date: `d${i}`, perAlgo: {} }));
const hourly = Array.from({ length: 30 }, (_, i) => ({ hour: `h${i}`, perAlgo: {} }));

describe('HISTORY_RANGES / defaults', () => {
  it('exposes Daily / 7D / 30D / 3M / 6M / 1Y / 3Y in order', () => {
    expect(HISTORY_RANGES.map((r) => r.label)).toEqual(['Daily', '7D', '30D', '3M', '6M', '1Y', '3Y']);
  });
  it('defaults to the 30-day range', () => {
    expect(DEFAULT_RANGE_KEY).toBe('30d');
  });
  it('marks 1Y and 3Y as zoomable', () => {
    expect(ZOOMABLE_RANGES).toEqual(['1y', '3y']);
  });
});

describe('resolveView', () => {
  it('defaults to 30 days of daily data', () => {
    const v = resolveView(daily, hourly, DEFAULT_RANGE_KEY);
    expect(v.granularity).toBe('daily');
    expect(v.entries).toHaveLength(30);
    expect(v.entries.at(-1).date).toBe('d1199');
  });

  it('slices 7 / 90 / 180 / 365 / 1095 for 7D / 3M / 6M / 1Y / 3Y', () => {
    expect(resolveView(daily, hourly, '7d').entries).toHaveLength(7);
    expect(resolveView(daily, hourly, '3m').entries).toHaveLength(90);
    expect(resolveView(daily, hourly, '6m').entries).toHaveLength(180);
    expect(resolveView(daily, hourly, '1y').entries).toHaveLength(365);
    expect(resolveView(daily, hourly, '3y').entries).toHaveLength(1095);
  });

  it('the Daily range uses the last 24 hourly entries', () => {
    const v = resolveView(daily, hourly, 'daily');
    expect(v.granularity).toBe('hourly');
    expect(v.entries).toHaveLength(24);
    expect(v.entries.at(-1).hour).toBe('h29');
  });

  it('an unknown range key falls back to the 30-day default', () => {
    expect(resolveView(daily, hourly, 'bogus').entries).toHaveLength(30);
  });

  it('is safe with empty inputs', () => {
    expect(resolveView([], [], '30d').entries).toEqual([]);
    expect(resolveView(undefined, undefined, 'daily').entries).toEqual([]);
  });
});

describe('applyZoom', () => {
  const e = Array.from({ length: 100 }, (_, i) => ({ date: `x${i}` }));

  it('returns the full array when zoom is null', () => {
    expect(applyZoom(e, null)).toHaveLength(100);
  });

  it('slices the inclusive [start,end] window', () => {
    const z = applyZoom(e, [10, 19]);
    expect(z).toHaveLength(10);
    expect(z[0].date).toBe('x10');
    expect(z.at(-1).date).toBe('x19');
  });

  it('normalizes reversed / out-of-range handles', () => {
    expect(applyZoom(e, [19, 10])).toHaveLength(10);
    expect(applyZoom(e, [-5, 500])).toHaveLength(100);
  });

  it('ignores a malformed zoom', () => {
    expect(applyZoom(e, [5])).toHaveLength(100);
    expect(applyZoom(e, 'nope')).toHaveLength(100);
  });
});

describe('sliderMarks', () => {
  it('returns evenly-spaced marks bounded by maxMarks, spanning the range', () => {
    const m = sliderMarks(Array.from({ length: 365 }, () => ({ date: '2026-06-08' })), 7);
    expect(m.length).toBeLessThanOrEqual(7);
    expect(m[0].value).toBe(0);
    expect(m.at(-1).value).toBe(364);
    m.forEach((mk) => expect(typeof mk.label).toBe('string'));
  });

  it('handles small / empty inputs', () => {
    expect(sliderMarks([], 6)).toEqual([]);
    const one = sliderMarks([{ date: '2026-06-08' }], 6);
    expect(one).toHaveLength(1);
    expect(one[0]).toEqual({ value: 0, label: 'Jun 8' });
  });
});

describe('bucketLabel', () => {
  it('formats a daily date as "Mon D"', () => {
    expect(bucketLabel({ date: '2026-06-08' }, 'daily')).toBe('Jun 8');
    expect(bucketLabel({ date: '2026-12-25' }, 'daily')).toBe('Dec 25');
  });

  it('formats an hourly bucket as a short local hour (Na / Np)', () => {
    expect(bucketLabel({ hour: '2026-07-07T14:00:00Z' }, 'hourly')).toMatch(/^\d{1,2}[ap]$/);
  });

  it('degrades gracefully on malformed input', () => {
    expect(bucketLabel({ date: '' }, 'daily')).toBe('');
    expect(bucketLabel({ hour: 'not-a-date' }, 'hourly')).toBe('not-a-date');
    expect(bucketLabel(null, 'daily')).toBe('');
  });
});
