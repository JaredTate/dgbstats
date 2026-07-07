import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import {
  Box, Card, CardContent, Typography, Divider, CircularProgress,
  ToggleButtonGroup, ToggleButton, useTheme, useMediaQuery,
} from '@mui/material';

Chart.register(...registerables);

/**
 * Range options for the history charts. Daily → hourly granularity (last 24h);
 * the others slice the daily series. Default view is 30D.
 */
export const HISTORY_RANGES = [
  { key: 'daily', label: 'Daily', granularity: 'hourly' },
  { key: '7d', label: '7D', granularity: 'daily', days: 7 },
  { key: '30d', label: '30D', granularity: 'daily', days: 30 },
  { key: '3m', label: '3M', granularity: 'daily', days: 90 },
];
export const DEFAULT_RANGE_KEY = '30d';

/**
 * Pick the entries + granularity to plot for a given range key. Pure/testable.
 * @returns {{ entries: Array, granularity: 'daily'|'hourly' }}
 */
export const resolveView = (daily = [], hourly = [], rangeKey = DEFAULT_RANGE_KEY) => {
  const range = HISTORY_RANGES.find((r) => r.key === rangeKey)
    || HISTORY_RANGES.find((r) => r.key === DEFAULT_RANGE_KEY);
  if (range.granularity === 'hourly') {
    return { entries: hourly.slice(-24), granularity: 'hourly' };
  }
  return { entries: daily.slice(-range.days), granularity: 'daily' };
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Short axis label for a bucket. Daily → 'Jun 8'; hourly → local hour like '2p'.
 * Pure/testable.
 */
export const bucketLabel = (entry, granularity) => {
  if (granularity === 'hourly') {
    const d = new Date(entry.hour);
    if (Number.isNaN(d.getTime())) return String(entry.hour || '');
    let h = d.getHours();
    const ampm = h >= 12 ? 'p' : 'a';
    h %= 12; if (h === 0) h = 12;
    return `${h}${ampm}`;
  }
  const parts = String(entry.date || '').split('-').map(Number);
  if (parts.length < 3) return String(entry.date || '');
  return `${MONTHS[parts[1] - 1]} ${parts[2]}`;
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
 *  - "stacked-100" : 100% stacked BAR of each algorithm's per-bucket share.
 *
 * @param {object} props
 * @param {'lines-log'|'stacked-100'} props.mode
 * @param {Array}  props.daily   - daily entries ({date, perAlgo, ...})
 * @param {Array}  props.hourly  - hourly entries ({hour, perAlgo, ...})
 * @param {string[]} props.algos - series order (fixed identity colors)
 * @param {Object} props.colors  - algo -> hex
 * @param {(entry:object, algo:string)=>number} props.getValue
 * @param {(n:number)=>string} [props.valueFormat]
 * @param {string} props.title
 * @param {string} [props.subtitle]
 * @param {string} [props.yLabel]
 * @param {boolean} props.loading
 * @param {string|null} props.error
 * @param {number} [props.height=380]
 * @param {string} [props.accentColor='#002352']
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

  const { entries, granularity } = useMemo(
    () => resolveView(daily, hourly, rangeKey), [daily, hourly, rangeKey],
  );
  const labels = useMemo(() => entries.map((e) => bucketLabel(e, granularity)), [entries, granularity]);
  const stacked = mode === 'stacked-100';

  useEffect(() => {
    if (!canvasRef.current || loading || error || entries.length === 0) return;
    const ctx = canvasRef.current.getContext('2d');

    const dayTotals = entries.map((entry) =>
      algos.reduce((sum, a) => sum + (getValue(entry, a) || 0), 0));

    const datasets = algos.map((algo) => {
      const color = colors[algo] || '#0066cc';
      const raw = entries.map((entry) => getValue(entry, algo) || 0);
      if (stacked) {
        return {
          label: algo,
          data: raw.map((v, i) => (dayTotals[i] > 0 ? (v / dayTotals[i]) * 100 : 0)),
          _raw: raw,
          backgroundColor: color,
          borderColor: '#ffffff',
          borderWidth: { top: 0, right: 0, bottom: 0, left: 0 },
          borderSkipped: false,
          categoryPercentage: 0.98,
          barPercentage: 0.98,
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
        tension: 0.3,
        spanGaps: true,
      };
    });

    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(ctx, {
      type: stacked ? 'bar' : 'line',
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
                return e ? (granularity === 'hourly' ? e.hour : e.date) : '';
              },
              label: (item) => {
                const ds = item.dataset;
                if (stacked) {
                  const rawv = ds._raw ? ds._raw[item.dataIndex] : null;
                  return `  ${ds.label}: ${item.parsed.y.toFixed(1)}%${rawv != null ? ` (${valueFormat(rawv)})` : ''}`;
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
            stacked, grid: { display: false },
            ticks: { color: '#888', font: { size: 10 }, maxRotation: 0, autoSkip: true, maxTicksLimit: isMobile ? 6 : 12 },
          },
          y: stacked
            ? {
                stacked: true, min: 0, max: 100,
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
          <ToggleButtonGroup size="small" exclusive value={rangeKey} onChange={(_, v) => v && setRangeKey(v)} aria-label="history range">
            {HISTORY_RANGES.map((r) => (
              <ToggleButton key={r.key} value={r.key} sx={{ px: 1.4, py: 0.25, textTransform: 'none' }}>
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
          <Box sx={{ position: 'relative', height }}><canvas ref={canvasRef} /></Box>
        )}
      </CardContent>
    </Card>
  );
};

export default HistoryChart;
