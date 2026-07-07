import { describe, it, expect } from 'vitest';
import {
  resolveView, bucketLabel, applyZoom, sliderMarks,
  entryToDate, monthYearLabel, fullDateLabel,
  HISTORY_RANGES, DEFAULT_RANGE_KEY, ZOOMABLE_RANGES,
  DGB_ERAS, eraBoundariesInRange, erasOverlappingRange, activeAlgosIn,
  applyAlgoFilter, toggleHidden,
} from '../../../components/HistoryChart';

const daily = Array.from({ length: 2000 }, (_, i) => ({ date: `d${i}`, perAlgo: {} }));
const hourly = Array.from({ length: 30 }, (_, i) => ({ hour: `h${i}`, perAlgo: {} }));

describe('HISTORY_RANGES / defaults', () => {
  it('exposes Daily / 7D / 30D / 3M / 6M / 1Y / 3Y / 5Y / All in order', () => {
    expect(HISTORY_RANGES.map((r) => r.label)).toEqual(['Daily', '7D', '30D', '3M', '6M', '1Y', '3Y', '5Y', 'All']);
  });
  it('defaults to the 30-day range', () => {
    expect(DEFAULT_RANGE_KEY).toBe('30d');
  });
  it('marks 1Y / 3Y / 5Y / All as zoomable (long ranges get the brush slider)', () => {
    expect(ZOOMABLE_RANGES).toEqual(['1y', '3y', '5y', 'all']);
  });
});

describe('resolveView', () => {
  it('defaults to 30 days of daily data', () => {
    const v = resolveView(daily, hourly, DEFAULT_RANGE_KEY);
    expect(v.granularity).toBe('daily');
    expect(v.entries).toHaveLength(30);
    expect(v.entries.at(-1).date).toBe('d1999');
  });

  it('slices 7 / 90 / 180 / 365 / 1095 / 1825 for 7D / 3M / 6M / 1Y / 3Y / 5Y', () => {
    expect(resolveView(daily, hourly, '7d').entries).toHaveLength(7);
    expect(resolveView(daily, hourly, '3m').entries).toHaveLength(90);
    expect(resolveView(daily, hourly, '6m').entries).toHaveLength(180);
    expect(resolveView(daily, hourly, '1y').entries).toHaveLength(365);
    expect(resolveView(daily, hourly, '3y').entries).toHaveLength(1095);
    expect(resolveView(daily, hourly, '5y').entries).toHaveLength(1825);
  });

  it('the All range returns the ENTIRE daily series (no slice)', () => {
    const v = resolveView(daily, hourly, 'all');
    expect(v.granularity).toBe('daily');
    expect(v.entries).toHaveLength(daily.length);
    expect(v.entries[0].date).toBe('d0');
    expect(v.entries.at(-1).date).toBe('d1999');
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
    expect(one[0]).toEqual({ value: 0, label: "Jun '26" });
  });
});

describe('date helpers (time-axis + slider labels)', () => {
  it('entryToDate builds a UTC date for daily and hourly', () => {
    expect(entryToDate({ date: '2026-06-08' }, 'daily').toISOString()).toBe('2026-06-08T00:00:00.000Z');
    expect(entryToDate({ hour: '2026-07-07T14:00:00Z' }, 'hourly').toISOString()).toBe('2026-07-07T14:00:00.000Z');
  });

  it("monthYearLabel → \"Mon 'YY\"", () => {
    expect(monthYearLabel({ date: '2025-01-03' })).toBe("Jan '25");
    expect(monthYearLabel({ date: '2026-12-31' })).toBe("Dec '26");
  });

  it('fullDateLabel → "Mon D, YYYY"', () => {
    expect(fullDateLabel({ date: '2026-06-08' })).toBe('Jun 8, 2026');
    expect(fullDateLabel({ date: '2024-11-01' })).toBe('Nov 1, 2024');
  });

  it('degrade gracefully on bad input', () => {
    expect(monthYearLabel({ date: '' })).toBe('');
    expect(fullDateLabel({})).toBe('');
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

describe('DGB_ERAS (chain mining eras)', () => {
  it('lists the five mainnet eras oldest -> newest, starting single-algo Scrypt at genesis', () => {
    expect(DGB_ERAS.map((e) => e.key)).toEqual(['digishield', 'multialgo', 'multishield', 'digispeed', 'odocrypt']);
    expect(DGB_ERAS[0]).toMatchObject({ start: '2014-01-10', startHeight: 0 });
    expect(DGB_ERAS[0].algos).toEqual(['Scrypt']); // single-algo launch
    expect(DGB_ERAS.at(-1).algos).toContain('Odo'); // current era mines Odocrypt
    expect(DGB_ERAS.at(-1).algos).not.toContain('Myriad-Groestl'); // Groestl swapped out
    DGB_ERAS.forEach((e) => expect(typeof e.name).toBe('string'));
  });
  it('records the verified activation dates / heights', () => {
    const byKey = Object.fromEntries(DGB_ERAS.map((e) => [e.key, e]));
    expect(byKey.multialgo).toMatchObject({ start: '2014-09-01', startHeight: 145000 });
    expect(byKey.multishield).toMatchObject({ start: '2014-12-10', startHeight: 400000 });
    expect(byKey.digispeed).toMatchObject({ start: '2015-12-04', startHeight: 1430000 });
    expect(byKey.odocrypt).toMatchObject({ start: '2019-07-22', startHeight: 9112320 });
  });
});

describe('eraBoundariesInRange — vertical divider positions (max/All view)', () => {
  it('returns the 4 internal boundaries across the full history (genesis is the left edge, excluded)', () => {
    const b = eraBoundariesInRange('2014-01-10', '2026-07-07');
    expect(b.map((x) => x.key)).toEqual(['multialgo', 'multishield', 'digispeed', 'odocrypt']);
    expect(b[0]).toMatchObject({ start: '2014-09-01', name: expect.any(String) });
  });
  it('returns none for a window entirely inside one era (e.g. a 5Y view in the Odocrypt era)', () => {
    expect(eraBoundariesInRange('2021-07-01', '2026-07-07')).toEqual([]);
  });
  it('returns only the boundaries that fall inside the window', () => {
    expect(eraBoundariesInRange('2014-08-01', '2015-01-01').map((x) => x.key))
      .toEqual(['multialgo', 'multishield']);
  });
  it('excludes a boundary exactly at the left edge (no redundant divider)', () => {
    expect(eraBoundariesInRange('2014-09-01', '2015-01-01').map((x) => x.key)).toEqual(['multishield']);
  });
});

describe('erasOverlappingRange — which eras the explainer lists', () => {
  it('lists all five for the full history', () => {
    expect(erasOverlappingRange('2014-01-10', '2026-07-07').map((e) => e.key))
      .toEqual(['digishield', 'multialgo', 'multishield', 'digispeed', 'odocrypt']);
  });
  it('lists only the Odocrypt era for a recent 5Y window', () => {
    expect(erasOverlappingRange('2021-07-01', '2026-07-07').map((e) => e.key)).toEqual(['odocrypt']);
  });
  it('lists the single era a narrow window sits inside', () => {
    expect(erasOverlappingRange('2015-01-01', '2015-06-01').map((e) => e.key)).toEqual(['multishield']);
  });
  it('includes both eras a window straddling a boundary intersects', () => {
    expect(erasOverlappingRange('2019-06-01', '2019-08-01').map((e) => e.key))
      .toEqual(['digispeed', 'odocrypt']);
  });
});

describe('activeAlgosIn — drop algos with no data in the visible window', () => {
  const gv = (e, a) => e.perAlgo[a];
  const algos = ['SHA256D', 'Scrypt', 'Myriad-Groestl', 'Odo'];
  it('keeps only algos with a positive value somewhere in the entries, in input order', () => {
    const entries = [
      { perAlgo: { SHA256D: 5, Scrypt: 3, 'Myriad-Groestl': 0 } },
      { perAlgo: { SHA256D: 6, Scrypt: 4, Odo: 0 } },
    ];
    expect(activeAlgosIn(entries, algos, gv)).toEqual(['SHA256D', 'Scrypt']);
  });
  it('surfaces a historical algo that only has data early in the window (e.g. Groestl)', () => {
    const entries = [
      { perAlgo: { Scrypt: 1, 'Myriad-Groestl': 7 } }, // early era
      { perAlgo: { Scrypt: 1, Odo: 5 } }, // later era
    ];
    expect(activeAlgosIn(entries, algos, gv)).toEqual(['Scrypt', 'Myriad-Groestl', 'Odo']);
  });
  it('is safe with empty entries / missing getValue results', () => {
    expect(activeAlgosIn([], algos, gv)).toEqual([]);
    expect(activeAlgosIn([{ perAlgo: {} }], algos, gv)).toEqual([]);
  });
});

describe('algo filter (Difficulties / Hashrate line charts)', () => {
  const algos = ['SHA256D', 'Scrypt', 'Skein', 'Qubit', 'Odo'];

  describe('applyAlgoFilter', () => {
    it('shows all when nothing is hidden', () => {
      expect(applyAlgoFilter(algos, new Set())).toEqual(algos);
      expect(applyAlgoFilter(algos, undefined)).toEqual(algos);
    });
    it('drops hidden algos, preserving input order (color stability)', () => {
      expect(applyAlgoFilter(algos, new Set(['Scrypt', 'Qubit']))).toEqual(['SHA256D', 'Skein', 'Odo']);
    });
    it('supports soloing a single algo', () => {
      expect(applyAlgoFilter(algos, new Set(['SHA256D', 'Scrypt', 'Skein', 'Qubit']))).toEqual(['Odo']);
    });
    it('never returns empty — falls back to all if every algo got hidden (e.g. after a range change)', () => {
      expect(applyAlgoFilter(algos, new Set(algos))).toEqual(algos);
    });
  });

  describe('toggleHidden', () => {
    it('hides a shown algo', () => {
      expect([...toggleHidden(new Set(), 'Scrypt', algos)]).toEqual(['Scrypt']);
    });
    it('un-hides a hidden algo', () => {
      expect([...toggleHidden(new Set(['Scrypt']), 'Scrypt', algos)]).toEqual([]);
    });
    it('refuses to hide the LAST visible algo (never corrupts to an empty chart)', () => {
      const hidden = new Set(['SHA256D', 'Scrypt', 'Skein', 'Qubit']); // only Odo left
      const next = toggleHidden(hidden, 'Odo', algos);
      expect(next.has('Odo')).toBe(false); // Odo stays visible
      expect(applyAlgoFilter(algos, next)).toEqual(['Odo']);
    });
    it('does not mutate the input set', () => {
      const h = new Set(['Scrypt']);
      toggleHidden(h, 'Skein', algos);
      expect([...h]).toEqual(['Scrypt']);
    });
  });
});
