import { describe, it, expect } from 'vitest';
import {
  resolveView, bucketLabel, HISTORY_RANGES, DEFAULT_RANGE_KEY,
} from '../../../components/HistoryChart';

const daily = Array.from({ length: 90 }, (_, i) => ({ date: `d${i}`, perAlgo: {} }));
const hourly = Array.from({ length: 30 }, (_, i) => ({ hour: `h${i}`, perAlgo: {} }));

describe('HISTORY_RANGES / defaults', () => {
  it('exposes Daily / 7D / 30D / 3M in order', () => {
    expect(HISTORY_RANGES.map((r) => r.label)).toEqual(['Daily', '7D', '30D', '3M']);
  });
  it('defaults to the 30-day range', () => {
    expect(DEFAULT_RANGE_KEY).toBe('30d');
  });
});

describe('resolveView', () => {
  it('defaults to 30 days of daily data', () => {
    const v = resolveView(daily, hourly, DEFAULT_RANGE_KEY);
    expect(v.granularity).toBe('daily');
    expect(v.entries).toHaveLength(30);
    expect(v.entries[v.entries.length - 1].date).toBe('d89');
    expect(v.entries[0].date).toBe('d60');
  });

  it('7d slices the last 7 daily entries', () => {
    expect(resolveView(daily, hourly, '7d').entries).toHaveLength(7);
  });

  it('3m slices the last 90 daily entries', () => {
    expect(resolveView(daily, hourly, '3m').entries).toHaveLength(90);
  });

  it('the Daily range uses the last 24 hourly entries', () => {
    const v = resolveView(daily, hourly, 'daily');
    expect(v.granularity).toBe('hourly');
    expect(v.entries).toHaveLength(24);
    expect(v.entries[v.entries.length - 1].hour).toBe('h29');
  });

  it('an unknown range key falls back to the 30-day default', () => {
    const v = resolveView(daily, hourly, 'bogus');
    expect(v.granularity).toBe('daily');
    expect(v.entries).toHaveLength(30);
  });

  it('is safe with empty inputs', () => {
    expect(resolveView([], [], '30d').entries).toEqual([]);
    expect(resolveView(undefined, undefined, 'daily').entries).toEqual([]);
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
  });
});
