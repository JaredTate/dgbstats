import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-luxon';
import {
  Box, Card, CardContent, Typography, Divider, CircularProgress,
  ToggleButtonGroup, ToggleButton, Slider, useTheme, useMediaQuery,
} from '@mui/material';

Chart.register(...registerables);

/**
 * Range options. Daily → hourly granularity (last 24h); the rest slice the daily
 * series. 1Y / 3Y are zoomable (a brush slider lets you focus a sub-period).
 */
export const HISTORY_RANGES = [
  { key: 'daily', label: 'Daily', granularity: 'hourly' },
  { key: '7d', label: '7D', granularity: 'daily', days: 7 },
  { key: '30d', label: '30D', granularity: 'daily', days: 30 },
  { key: '3m', label: '3M', granularity: 'daily', days: 90 },
  { key: '6m', label: '6M', granularity: 'daily', days: 180 },
  { key: '1y', label: '1Y', granularity: 'daily', days: 365 },
  { key: '3y', label: '3Y', granularity: 'daily', days: 1095 },
  { key: '5y', label: '5Y', granularity: 'daily', days: 1825 },
  { key: 'all', label: 'All', granularity: 'daily', days: Infinity }, // full history back to genesis
];
export const DEFAULT_RANGE_KEY = '30d';
// Long ranges get a brush slider to zoom into a sub-period.
export const ZOOMABLE_RANGES = ['1y', '3y', '5y', 'all'];

/**
 * Entries + granularity to plot for a range key. Pure/testable.
 * @returns {{ entries: Array, granularity: 'daily'|'hourly' }}
 */
export const resolveView = (daily = [], hourly = [], rangeKey = DEFAULT_RANGE_KEY) => {
  const range = HISTORY_RANGES.find((r) => r.key === rangeKey)
    || HISTORY_RANGES.find((r) => r.key === DEFAULT_RANGE_KEY);
  if (range.granularity === 'hourly') {
    return { entries: (hourly || []).slice(-24), granularity: 'hourly' };
  }
  const d = daily || [];
  // "All" (days = Infinity) returns the entire series; the rest slice the tail.
  const entries = Number.isFinite(range.days) ? d.slice(-range.days) : d.slice();
  return { entries, granularity: 'daily' };
};

/** Apply an inclusive [startIdx, endIdx] zoom window to entries; null → full. Pure/testable. */
export const applyZoom = (entries = [], zoom) => {
  if (!zoom || !Array.isArray(zoom) || zoom.length !== 2) return entries;
  const lo = Math.max(0, Math.min(zoom[0], zoom[1]));
  const hi = Math.min(entries.length - 1, Math.max(zoom[0], zoom[1]));
  if (hi < lo) return entries;
  return entries.slice(lo, hi + 1);
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Short axis label for a bucket. Daily → 'Jun 8'; hourly → local hour like '2p'. Pure/testable. */
export const bucketLabel = (entry, granularity) => {
  if (!entry) return '';
  if (granularity === 'hourly') {
    const d = new Date(entry.hour);
    if (Number.isNaN(d.getTime())) return String(entry.hour || '');
    let h = d.getHours();
    const ampm = h >= 12 ? 'p' : 'a';
    h %= 12; if (h === 0) h = 12;
    return `${h}${ampm}`;
  }
  const parts = String(entry.date || '').split('-').map(Number);
  if (parts.length < 3 || Number.isNaN(parts[1])) return String(entry.date || '');
  return `${MONTHS[parts[1] - 1]} ${parts[2]}`;
};

/** UTC Date for a bucket entry — daily → midnight UTC; hourly → the hour instant. Pure/testable. */
export const entryToDate = (entry, granularity) => {
  if (!entry) return new Date(NaN);
  if (granularity === 'hourly') return new Date(entry.hour);
  return new Date(`${entry.date}T00:00:00Z`);
};

/** "Jun '25" — month + 2-digit year (slider marks on long ranges). Pure/testable. */
export const monthYearLabel = (entry) => {
  const p = String(entry?.date || '').split('-').map(Number);
  if (p.length < 3 || Number.isNaN(p[1])) return String(entry?.date || '');
  return `${MONTHS[p[1] - 1]} '${String(p[0]).slice(-2)}`;
};

/** "Jun 8, 2026" — full date (slider thumb + daily tooltip). Pure/testable. */
export const fullDateLabel = (entry) => {
  const p = String(entry?.date || '').split('-').map(Number);
  if (p.length < 3 || Number.isNaN(p[1])) return String(entry?.date || '');
  return `${MONTHS[p[1] - 1]} ${p[2]}, ${p[0]}`;
};

/** Evenly-spaced slider marks (index + month/year label). Pure/testable. */
export const sliderMarks = (entries = [], maxMarks = 6) => {
  const n = entries.length;
  if (n === 0) return [];
  const count = Math.min(maxMarks, n);
  const marks = [];
  const seen = new Set();
  for (let k = 0; k < count; k += 1) {
    const idx = count === 1 ? 0 : Math.round((k * (n - 1)) / (count - 1));
    if (seen.has(idx)) continue;
    seen.add(idx);
    marks.push({ value: idx, label: monthYearLabel(entries[idx]) });
  }
  return marks;
};

// ---------------------------------------------------------------------------
// DigiByte mining eras — verified against the live chain (block heights + the
// UTC date of each activation block). Used to draw era divider lines + labels on
// the long-range (5Y / All) charts and an explainer beneath them. `algos` is the
// set active during the era (Myriad-Groestl = DigiByte's ALGO_GROESTL, swapped
// for Odocrypt at 9,112,320). Source: DIGIBYTE_v8.26_MULTI_ALGO_MINING_REPORT.md.
// ---------------------------------------------------------------------------
export const DGB_ERAS = [
  { key: 'digishield', name: 'DigiShield', start: '2014-01-10', startHeight: 0,
    algos: ['Scrypt'],
    note: 'Single-algo launch on Scrypt; DigiShield real-time difficulty from block 67,200.' },
  { key: 'multialgo', name: 'MultiAlgo', start: '2014-09-01', startHeight: 145000,
    algos: ['SHA256D', 'Scrypt', 'Myriad-Groestl', 'Skein', 'Qubit'],
    note: 'Five simultaneous mining algorithms activated — a blockchain first.' },
  { key: 'multishield', name: 'MultiShield', start: '2014-12-10', startHeight: 400000,
    algos: ['SHA256D', 'Scrypt', 'Myriad-Groestl', 'Skein', 'Qubit'],
    note: 'Global + per-algorithm difficulty balancing.' },
  { key: 'digispeed', name: 'DigiSpeed', start: '2015-12-04', startHeight: 1430000,
    algos: ['SHA256D', 'Scrypt', 'Myriad-Groestl', 'Skein', 'Qubit'],
    note: '15-second blocks — 2× faster confirmations.' },
  { key: 'odocrypt', name: 'Odocrypt', start: '2019-07-22', startHeight: 9112320,
    algos: ['SHA256D', 'Scrypt', 'Skein', 'Qubit', 'Odo'],
    note: 'Groestl swapped for ASIC-resistant Odocrypt (self-changing every 10 days).' },
];

// Muted slate palette for era markers — deliberately distinct from the vivid
// algorithm colors so era annotations never read as a data series.
export const ERA_COLORS = {
  digishield: '#8d99ae', multialgo: '#5c6b8a', multishield: '#7d6b91',
  digispeed: '#4a7a96', odocrypt: '#3a5a78',
};

/**
 * Era-start boundaries whose activation date falls inside (firstDate, lastDate].
 * The genesis era is the left edge, so it never yields a divider. ISO 'YYYY-MM-DD'
 * strings compare chronologically. Pure/testable.
 */
export const eraBoundariesInRange = (firstDate, lastDate, eras = DGB_ERAS) => {
  if (!firstDate || !lastDate) return [];
  return eras
    .filter((e, i) => i > 0 && e.start > firstDate && e.start <= lastDate)
    .map((e) => ({ key: e.key, name: e.name, start: e.start }));
};

/** Eras whose [start, nextStart) span intersects [firstDate, lastDate]. Pure/testable. */
export const erasOverlappingRange = (firstDate, lastDate, eras = DGB_ERAS) => {
  if (!firstDate || !lastDate) return [];
  return eras.filter((e, i) => {
    const end = i < eras.length - 1 ? eras[i + 1].start : '9999-12-31';
    return e.start <= lastDate && end > firstDate;
  });
};

/** Compact "Sep 2014 – Dec 2014" (or "… – now") span for an era's card. */
export const eraSpanLabel = (era, eras = DGB_ERAS) => {
  const fmt = (iso) => {
    const p = String(iso).split('-').map(Number);
    return p.length >= 2 && !Number.isNaN(p[1]) ? `${MONTHS[p[1] - 1]} ${p[0]}` : String(iso);
  };
  const i = eras.findIndex((e) => e.key === era.key);
  const next = i >= 0 ? eras[i + 1] : null;
  return `${fmt(era.start)} – ${next ? fmt(next.start) : 'now'}`;
};

/** Algos with at least one positive value across the visible entries, in input order. Pure/testable. */
export const activeAlgosIn = (entries = [], algos = [], getValue) =>
  algos.filter((a) => (entries || []).some((e) => (getValue(e, a) || 0) > 0));

/**
 * Visible algos after applying the user's hidden set (line charts). Preserves
 * order (colors stay stable) and NEVER returns empty — if every algo is hidden
 * (e.g. the window shrank after a range change) it falls back to all, so the
 * chart can't be corrupted into a blank/broken axis. Pure/testable.
 */
export const applyAlgoFilter = (windowAlgos = [], hidden) => {
  if (!hidden || hidden.size === 0) return windowAlgos;
  const shown = windowAlgos.filter((a) => !hidden.has(a));
  return shown.length ? shown : windowAlgos;
};

/**
 * Toggle one algo in the hidden set, but never hide the LAST visible algo (keeps
 * ≥1 line on screen). Returns a NEW set (no mutation). Pure/testable.
 */
export const toggleHidden = (hidden, algo, windowAlgos = []) => {
  const next = new Set(hidden || []);
  if (next.has(algo)) { next.delete(algo); return next; }
  const stillVisible = windowAlgos.filter((a) => a !== algo && !next.has(a));
  if (stillVisible.length === 0) return next; // would empty the chart → ignore
  next.add(algo);
  return next;
};

/** Faint plot-surface tint so thin light-colored lines keep contrast (dataviz). */
const surfacePlugin = {
  id: 'historySurface',
  beforeDraw: (chart) => {
    const { ctx, chartArea } = chart;
    if (!chartArea) return;
    ctx.save();
    ctx.fillStyle = '#f7f8fb';
    ctx.fillRect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, chartArea.bottom - chartArea.top);
    ctx.restore();
  },
};

/** Direct end-labels (color dot + short algo name) at each line's last point. */
const endLabelPlugin = {
  id: 'historyEndLabels',
  afterDatasetsDraw: (chart) => {
    if (!chart.options.plugins.historyEndLabels?.show) return;
    const { ctx } = chart;
    ctx.save();
    ctx.font = '600 11px Roboto, Helvetica, Arial, sans-serif';
    ctx.textBaseline = 'middle';
    chart.data.datasets.forEach((ds, i) => {
      const meta = chart.getDatasetMeta(i);
      if (meta.hidden) return;
      const pts = meta.data;
      if (!pts || !pts.length) return;
      const last = pts[pts.length - 1];
      if (!last || last.x == null || last.y == null) return;
      ctx.beginPath();
      ctx.arc(last.x + 3, last.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = ds.borderColor;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.strokeText(ds.label, last.x + 9, last.y);
      ctx.fillStyle = '#333';
      ctx.fillText(ds.label, last.x + 9, last.y);
    });
    ctx.restore();
  },
};

/**
 * Era divider lines + bottom labels. Reads boundaries from
 * options.plugins.eraDividers.boundaries = [{ time:<ms>, name }]. Draws a dashed
 * vertical line at each boundary that lands inside the plot, then labels it near
 * the BOTTOM of the chart. Labels are stacked into lanes (greedy) so tightly
 * clustered eras (2014–2015) never overlap.
 */
const eraDividerPlugin = {
  id: 'eraDividers',
  afterDatasetsDraw: (chart) => {
    const cfg = chart.options.plugins.eraDividers;
    const boundaries = cfg && cfg.boundaries;
    if (!boundaries || !boundaries.length) return;
    const { ctx, chartArea, scales } = chart;
    const x = scales.x;
    if (!x || !chartArea) return;

    ctx.save();
    ctx.font = '700 10px Roboto, Helvetica, Arial, sans-serif';
    ctx.textBaseline = 'bottom';
    const laneRightEdge = []; // laneRightEdge[l] = right-most label x used in lane l

    // Ascending by pixel so greedy lane packing reads left→right.
    const placed = boundaries
      .map((b) => ({ ...b, px: x.getPixelForValue(b.time) }))
      .filter((b) => b.px != null && b.px >= chartArea.left - 1 && b.px <= chartArea.right + 1)
      .sort((a, b) => a.px - b.px);

    placed.forEach((b) => {
      // Vertical dashed divider.
      ctx.beginPath();
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = ERA_COLORS[b.key] ? `${ERA_COLORS[b.key]}` : 'rgba(50,50,60,0.6)';
      ctx.globalAlpha = 0.75;
      ctx.moveTo(b.px, chartArea.top);
      ctx.lineTo(b.px, chartArea.bottom);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.setLineDash([]);

      // Label: to the right of the line, flipped left if it would overflow.
      const tw = ctx.measureText(b.name).width;
      let lx = b.px + 5;
      if (lx + tw > chartArea.right) lx = b.px - 5 - tw;
      // Greedy lane: first lane whose last label ends left of this one.
      let lane = 0;
      while (lane < laneRightEdge.length && laneRightEdge[lane] > lx - 6) lane += 1;
      laneRightEdge[lane] = lx + tw;
      const ly = chartArea.bottom - 4 - lane * 14;

      ctx.fillStyle = 'rgba(255,255,255,0.88)';
      ctx.fillRect(lx - 3, ly - 12, tw + 6, 14);
      ctx.fillStyle = ERA_COLORS[b.key] || '#2b2b33';
      ctx.fillText(b.name, lx, ly);
    });
    ctx.restore();
  },
};

/**
 * EraLegend — the explainer beneath the chart on 5Y / All views. Lists each
 * DigiByte mining era intersecting the visible window: color swatch, name, span,
 * active algorithms, and a one-line note. Memoized (pure render from props).
 */
const EraLegend = React.memo(({ eras }) => {
  if (!eras || !eras.length) return null;
  return (
    <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid #eee' }}>
      <Typography variant="caption" sx={{ display: 'block', color: '#555', fontWeight: 700, mb: 1 }}>
        DigiByte mining eras in view
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {eras.map((e) => (
          <Box
            key={e.key}
            sx={{
              flex: '1 1 240px', minWidth: 200, border: '1px solid #eee',
              borderLeft: `3px solid ${ERA_COLORS[e.key] || '#888'}`,
              borderRadius: '8px', p: 1.25, bgcolor: '#fafbfd',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 0.75, mb: 0.25 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#222' }}>{e.name}</Typography>
              <Typography variant="caption" sx={{ color: '#888' }}>{eraSpanLabel(e)}</Typography>
            </Box>
            <Typography variant="caption" sx={{ display: 'block', color: '#666', lineHeight: 1.35 }}>{e.note}</Typography>
            <Typography variant="caption" sx={{ display: 'block', color: '#9098a6', mt: 0.5, fontWeight: 600 }}>
              {e.algos.join(' · ')}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
});
EraLegend.displayName = 'EraLegend';

/**
 * AlgoFilter — the tap-to-compare chip row on the line charts (Difficulties /
 * Hashrate). Each chip doubles as a legend entry: colored dot + name when shown,
 * greyed + struck-through when hidden. Tap toggles; the parent guards against an
 * empty selection. Wraps on mobile with 30px tap targets. Memoized.
 */
const AlgoFilter = React.memo(({ algos, hidden, colors, onToggle, onReset, showReset }) => {
  if (!algos || algos.length <= 1) return null; // nothing to compare
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
      <Typography variant="caption" sx={{ color: '#888', fontWeight: 700, mr: 0.25 }}>Show:</Typography>
      {algos.map((a) => {
        const off = hidden.has(a);
        const color = colors[a] || '#0066cc';
        return (
          <Box
            key={a}
            role="button"
            tabIndex={0}
            aria-pressed={!off}
            aria-label={`${off ? 'Show' : 'Hide'} ${a}`}
            onClick={() => onToggle(a)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(a); } }}
            sx={{
              display: 'inline-flex', alignItems: 'center', gap: 0.75, px: 1, py: 0.4,
              borderRadius: '16px', cursor: 'pointer', userSelect: 'none', minHeight: 30,
              border: '1px solid', transition: 'all .15s',
              borderColor: off ? '#e0e0e0' : `${color}66`,
              bgcolor: off ? '#f6f6f6' : `${color}14`,
              opacity: off ? 0.65 : 1,
              '&:hover': { borderColor: off ? '#c8c8c8' : color },
            }}
          >
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: off ? '#bbb' : color, flexShrink: 0 }} />
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, color: off ? '#999' : '#333', textDecoration: off ? 'line-through' : 'none' }}
            >
              {a}
            </Typography>
          </Box>
        );
      })}
      {showReset && (
        <Typography
          variant="caption"
          role="button"
          tabIndex={0}
          onClick={onReset}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onReset(); } }}
          sx={{ color: '#0066cc', cursor: 'pointer', fontWeight: 700, ml: 0.5, '&:hover': { textDecoration: 'underline' } }}
        >
          Reset
        </Typography>
      )}
    </Box>
  );
});
AlgoFilter.displayName = 'AlgoFilter';

/**
 * HistoryChart — reusable daily/hourly time-series chart for the Algos /
 * Difficulties / Hashrate history features.
 *
 * Modes:
 *  - "lines-log"   : one line per algorithm, logarithmic y (difficulty, hashrate).
 *  - "stacked-100" : smooth 100% stacked area of each algorithm's per-bucket share.
 *
 * Ranges: Daily / 7D / 30D / 3M / 6M / 1Y / 3Y (default 30D). On 1Y & 3Y a brush
 * slider under the chart zooms into a sub-period.
 */
const HistoryChart = ({
  mode = 'lines-log', daily = [], hourly = [], algos = [], colors = {}, getValue,
  valueFormat = (n) => `${n}`, title, subtitle, yLabel,
  loading = false, error = null, height = 380, accentColor = '#002352',
  defaultHidden = [],
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const [rangeKey, setRangeKey] = useState(DEFAULT_RANGE_KEY);
  const [zoom, setZoom] = useState(null);
  // Algos toggled off on line charts. Starts from defaultHidden (e.g. the retired
  // Myriad-Groestl, whose near-zero recent difficulty would otherwise squash the
  // log axis) — always one tap away via its chip.
  const [hidden, setHidden] = useState(() => new Set(defaultHidden));

  const stacked = mode === 'stacked-100';
  const zoomable = ZOOMABLE_RANGES.includes(rangeKey);
  const filterable = mode === 'lines-log'; // tap-to-compare chips (not for the stacked distribution)

  const { entries: fullEntries, granularity } = useMemo(
    () => resolveView(daily, hourly, rangeKey), [daily, hourly, rangeKey],
  );

  // Reset the zoom window whenever the range or the data length changes.
  useEffect(() => { setZoom(null); }, [rangeKey, fullEntries.length]);

  const entries = useMemo(
    () => (zoomable ? applyZoom(fullEntries, zoom) : fullEntries), [fullEntries, zoom, zoomable],
  );
  const labels = useMemo(() => entries.map((e) => entryToDate(e, granularity)), [entries, granularity]);
  const marks = useMemo(
    () => (zoomable ? sliderMarks(fullEntries, isMobile ? 4 : 7) : []), [fullEntries, zoomable, isMobile],
  );

  // Era annotations (5Y / All only, daily granularity). The visible date window
  // — after any zoom — drives which era dividers + explainer cards appear.
  const showEras = granularity === 'daily' && (rangeKey === '5y' || rangeKey === 'all');
  const firstDate = granularity === 'daily' && entries.length ? entries[0].date : null;
  const lastDate = granularity === 'daily' && entries.length ? entries[entries.length - 1].date : null;
  const eraBoundaries = useMemo(
    () => (showEras ? eraBoundariesInRange(firstDate, lastDate) : []),
    [showEras, firstDate, lastDate],
  );
  const visibleEras = useMemo(
    () => (showEras ? erasOverlappingRange(firstDate, lastDate) : []),
    [showEras, firstDate, lastDate],
  );
  // Algos with data in the visible window: drops retired Myriad-Groestl on
  // post-2019 ranges, surfaces it on All. Colors stay keyed by algo name, so
  // survivors never repaint. Falls back to all algos if the window is empty.
  const windowAlgos = useMemo(() => {
    const a = activeAlgosIn(entries, algos, getValue);
    return a.length ? a : algos;
  }, [entries, algos, getValue]);
  // What actually gets plotted: on line charts, minus the user's hidden set
  // (never empty — see applyAlgoFilter). Stacked distribution isn't filterable.
  const drawAlgos = useMemo(
    () => (filterable ? applyAlgoFilter(windowAlgos, hidden) : windowAlgos),
    [filterable, windowAlgos, hidden],
  );
  const toggleAlgo = useCallback((a) => setHidden((h) => toggleHidden(h, a, windowAlgos)), [windowAlgos]);
  const resetAlgos = useCallback(() => setHidden(new Set(defaultHidden)), [defaultHidden]);
  // "Reset" is offered only once the user has diverged from the default filter,
  // so it never appears on first load just because a retired algo starts hidden.
  const defaultHiddenSet = useMemo(() => new Set(defaultHidden), [defaultHidden]);
  const isDefaultFilter = hidden.size === defaultHiddenSet.size
    && [...hidden].every((a) => defaultHiddenSet.has(a));

  useEffect(() => {
    if (!canvasRef.current || loading || error || entries.length === 0) return;
    const ctx = canvasRef.current.getContext('2d');

    const dayTotals = entries.map((entry) => drawAlgos.reduce((sum, a) => sum + (getValue(entry, a) || 0), 0));
    // Running cumulative % per entry → a smooth 100% stacked area that always fills
    // 0–100% (deterministic; no reliance on Chart.js scale-stacking of filled lines).
    const running = entries.map(() => 0);

    const datasets = drawAlgos.map((algo, idx) => {
      const color = colors[algo] || '#0066cc';
      if (stacked) {
        const raw = entries.map((entry) => getValue(entry, algo) || 0);
        const share = raw.map((v, i) => (dayTotals[i] > 0 ? (v / dayTotals[i]) * 100 : 0));
        const data = share.map((s, i) => { running[i] += s; return running[i]; });
        return {
          label: algo,
          data,
          _share: share,
          _raw: raw,
          backgroundColor: `${color}D9`,
          borderColor: '#ffffff',
          borderWidth: 1,
          fill: idx === 0 ? 'origin' : '-1',
          pointRadius: 0,
          pointHoverRadius: 4,
          cubicInterpolationMode: 'monotone',
        };
      }
      // lines-log: use null (not 0) where an algo has no block that bucket, so the
      // log axis skips it and era gaps render honestly (e.g. Groestl only exists
      // 2014-09 → 2019-07; leading/trailing nulls aren't bridged by spanGaps).
      const data = entries.map((entry) => { const v = getValue(entry, algo); return v > 0 ? v : null; });
      return {
        label: algo,
        data,
        borderColor: color,
        backgroundColor: `${color}14`,
        borderWidth: 2,
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: color,
        pointHoverBorderColor: '#fff',
        cubicInterpolationMode: 'monotone',
        spanGaps: true,
      };
    });

    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      plugins: stacked ? [surfacePlugin, eraDividerPlugin] : [surfacePlugin, endLabelPlugin, eraDividerPlugin],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { right: !stacked && !isMobile ? 64 : 8, top: 4 } },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          historyEndLabels: { show: !stacked && !isMobile },
          eraDividers: {
            boundaries: eraBoundaries.map((b) => ({
              key: b.key, name: b.name, time: Date.parse(`${b.start}T00:00:00Z`),
            })),
          },
          legend: {
            // On line charts the AlgoFilter chip row is the (interactive) legend.
            display: !filterable, position: 'top',
            labels: { usePointStyle: true, boxWidth: 8, padding: 14, color: '#333', font: { size: 12, weight: '600' } },
          },
          tooltip: {
            backgroundColor: 'rgba(255,255,255,0.97)', titleColor: '#111', bodyColor: '#333',
            borderColor: '#ddd', borderWidth: 1, padding: 10, usePointStyle: true,
            callbacks: {
              title: (items) => {
                const e = entries[items[0]?.dataIndex];
                if (!e) return '';
                if (granularity === 'hourly') {
                  const d = new Date(e.hour);
                  let h = d.getHours(); const ap = h >= 12 ? 'p' : 'a'; h %= 12; if (h === 0) h = 12;
                  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${h}${ap}`;
                }
                return fullDateLabel(e);
              },
              label: (item) => {
                const ds = item.dataset;
                if (stacked) {
                  const share = ds._share ? ds._share[item.dataIndex] : item.parsed.y;
                  const rawv = ds._raw ? ds._raw[item.dataIndex] : null;
                  return `  ${ds.label}: ${share.toFixed(1)}%${rawv != null ? ` (${valueFormat(rawv)})` : ''}`;
                }
                return `  ${ds.label}: ${valueFormat(item.parsed.y)}`;
              },
              afterBody: (items) => {
                const e = entries[items[0]?.dataIndex];
                return e && e.partial ? ['', granularity === 'hourly' ? '  (current hour — partial)' : '  (today — partial)'] : '';
              },
            },
          },
        },
        scales: {
          x: {
            type: 'time',
            time: {
              displayFormats: {
                hour: 'ha', day: 'MMM d', week: 'MMM d',
                month: "MMM ''yy", quarter: "MMM ''yy", year: 'yyyy',
              },
            },
            grid: { display: false },
            ticks: {
              color: '#888', font: { size: 10 }, maxRotation: 0,
              autoSkip: true, maxTicksLimit: isMobile ? 7 : 13, major: { enabled: true },
            },
          },
          y: stacked
            ? {
                min: 0, max: 100,
                grid: { color: 'rgba(0,0,0,0.05)' },
                ticks: { color: '#888', font: { size: 10 }, callback: (v) => `${v}%` },
                title: { display: !!yLabel, text: yLabel, color: '#888' },
              }
            : {
                type: 'logarithmic',
                grid: { color: 'rgba(0,0,0,0.05)' },
                ticks: {
                  color: '#888', font: { size: 10 },
                  callback: (v) => {
                    const l = Math.log10(v);
                    return Math.abs(l - Math.round(l)) < 1e-9 ? valueFormat(v) : '';
                  },
                },
                title: { display: !!yLabel, text: yLabel, color: '#888' },
              },
        },
        animation: { duration: 300 },
      },
    });

    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [entries, labels, granularity, drawAlgos, colors, getValue, valueFormat, stacked, filterable, yLabel, loading, error, isMobile, eraBoundaries]);

  const hourlyMissing = rangeKey === 'daily' && !loading && !error && entries.length === 0;

  return (
    <Card elevation={3} sx={{ borderRadius: '12px', mb: 4 }}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 0.5 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ color: accentColor }}>{title}</Typography>
          <ToggleButtonGroup
            size="small" exclusive value={rangeKey}
            onChange={(_, v) => v && setRangeKey(v)}
            aria-label="history range" sx={{ flexWrap: 'wrap' }}
          >
            {HISTORY_RANGES.map((r) => (
              <ToggleButton key={r.key} value={r.key} sx={{ px: 1.25, py: 0.25, textTransform: 'none' }}>
                {r.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
        {subtitle && <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>{subtitle}</Typography>}
        <Divider sx={{ mb: 2 }} />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height }}><CircularProgress /></Box>
        ) : error ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height, textAlign: 'center' }}>
            <Typography variant="body2" color="#888">
              History data isn't available yet{error ? ` (${error})` : ''}. It fills in as the server records stats.
            </Typography>
          </Box>
        ) : hourlyMissing ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height, textAlign: 'center' }}>
            <Typography variant="body2" color="#888">Hourly data is still filling in — try 7D / 30D / 3M.</Typography>
          </Box>
        ) : entries.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height }}>
            <Typography variant="body2" color="#888">No history recorded yet — check back soon.</Typography>
          </Box>
        ) : (
          <>
            {filterable && (
              <AlgoFilter
                algos={windowAlgos} hidden={hidden} colors={colors}
                onToggle={toggleAlgo} onReset={resetAlgos} showReset={!isDefaultFilter}
              />
            )}
            <Box sx={{ position: 'relative', height }}><canvas ref={canvasRef} /></Box>
            {zoomable && fullEntries.length > 2 && (
              <Box sx={{ px: { xs: 1, md: 3 }, mt: 2 }}>
                <Slider
                  size="small"
                  value={zoom || [0, fullEntries.length - 1]}
                  min={0}
                  max={fullEntries.length - 1}
                  marks={marks}
                  onChange={(_, v) => Array.isArray(v) && v[1] - v[0] >= 2 && setZoom(v)}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(idx) => fullDateLabel(fullEntries[idx])}
                  disableSwap
                  getAriaLabel={(i) => (i === 0 ? 'Zoom period start' : 'Zoom period end')}
                  getAriaValueText={(idx) => fullDateLabel(fullEntries[idx])}
                  sx={{ color: accentColor, '& .MuiSlider-markLabel': { fontSize: '0.68rem', color: '#888' } }}
                />
                <Typography variant="caption" sx={{ display: 'block', color: '#888', textAlign: 'center' }}>
                  Drag the handles to zoom into a specific time period
                </Typography>
              </Box>
            )}
            {showEras && <EraLegend eras={visibleEras} />}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default HistoryChart;
