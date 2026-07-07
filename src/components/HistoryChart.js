import React, { useEffect, useMemo, useRef, useState } from 'react';
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
];
export const DEFAULT_RANGE_KEY = '30d';
export const ZOOMABLE_RANGES = ['1y', '3y'];

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
  return { entries: (daily || []).slice(-range.days), granularity: 'daily' };
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
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const [rangeKey, setRangeKey] = useState(DEFAULT_RANGE_KEY);
  const [zoom, setZoom] = useState(null);

  const stacked = mode === 'stacked-100';
  const zoomable = ZOOMABLE_RANGES.includes(rangeKey);

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

  useEffect(() => {
    if (!canvasRef.current || loading || error || entries.length === 0) return;
    const ctx = canvasRef.current.getContext('2d');

    const dayTotals = entries.map((entry) => algos.reduce((sum, a) => sum + (getValue(entry, a) || 0), 0));
    // Running cumulative % per entry → a smooth 100% stacked area that always fills
    // 0–100% (deterministic; no reliance on Chart.js scale-stacking of filled lines).
    const running = entries.map(() => 0);

    const datasets = algos.map((algo, idx) => {
      const color = colors[algo] || '#0066cc';
      const raw = entries.map((entry) => getValue(entry, algo) || 0);
      if (stacked) {
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
      return {
        label: algo,
        data: raw,
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
      plugins: stacked ? [surfacePlugin] : [surfacePlugin, endLabelPlugin],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { right: !stacked && !isMobile ? 64 : 8, top: 4 } },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          historyEndLabels: { show: !stacked && !isMobile },
          legend: {
            display: true, position: 'top',
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
  }, [entries, labels, granularity, algos, colors, getValue, valueFormat, stacked, yLabel, loading, error, isMobile]);

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
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default HistoryChart;
