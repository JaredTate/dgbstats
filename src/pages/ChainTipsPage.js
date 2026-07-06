import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Container, Typography, Box, Card, CardContent, Divider, Grid,
  Table, TableContainer, TableHead, TableBody, TableRow, TableCell,
  Paper, Chip, CircularProgress, Link,
} from '@mui/material';
import { Chart, registerables } from 'chart.js';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import HistoryIcon from '@mui/icons-material/History';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { useNetwork } from '../context/NetworkContext';
import ForkTreeMap from '../components/ForkTreeMap';
import ChainTipsExplainer from '../components/ChainTipsExplainer';

Chart.register(...registerables);

// Status colours shared with the ForkTreeMap legend.
const STATUS_COLORS = {
  active: '#4caf50',
  'valid-fork': '#ff9800',
  'valid-headers': '#ffc107',
  'headers-only': '#9e9e9e',
  invalid: '#f44336',
};

// Fork-risk banner states, keyed by the latest forkAlert level.
const RISK_STATES = {
  none: { text: 'Network Healthy', color: '#2e7d32', bg: '#e8f5e9', defaultReason: 'Only routine single-block stale tips — DigiByte working as designed.' },
  elevated: { text: 'Elevated — Competing Branch', color: '#e65100', bg: '#fff3e0', defaultReason: 'A competing branch is being tracked near the chain tip.' },
  critical: { text: 'Fork Risk', color: '#c62828', bg: '#ffebee', defaultReason: 'A deep competing branch has been detected.' },
};

const shortHash = (hash) => {
  if (!hash || typeof hash !== 'string') return '—';
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 8)}…${hash.slice(-4)}`;
};

const relTime = (ms) => {
  if (!Number.isFinite(ms)) return '—';
  const s = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

// Bucket the orphan feed into the last 7 local calendar days.
export const buildOrphanBuckets = (orphans) => {
  const now = new Date();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    days.push({ time: d.getTime(), label: `${d.getMonth() + 1}/${d.getDate()}`, count: 0 });
  }
  for (const o of orphans || []) {
    if (!o || !Number.isFinite(o.firstSeen)) continue;
    const od = new Date(o.firstSeen);
    const key = new Date(od.getFullYear(), od.getMonth(), od.getDate()).getTime();
    const bucket = days.find((x) => x.time === key);
    if (bucket) bucket.count += 1;
  }
  return days;
};

// Build a continuous N-day UTC series from the server's sparse dailyOrphans
// ([{day:'YYYY-MM-DD', count}]), filling gaps with 0 and adding a 7-day
// trailing rolling average — the long-term "orphans per day" history.
export const buildDailySeries = (dailyOrphans, days = 30, now = Date.now()) => {
  const counts = new Map((dailyOrphans || []).map((d) => [d.day, d.count]));
  const base = new Date(now);
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() - i));
    const day = d.toISOString().slice(0, 10);
    out.push({ day, label: `${d.getUTCMonth() + 1}/${d.getUTCDate()}`, count: counts.get(day) || 0 });
  }
  const rollingAvg = out.map((_, idx) => {
    const slice = out.slice(Math.max(0, idx - 6), idx + 1);
    const avg = slice.reduce((s, x) => s + x.count, 0) / slice.length;
    return Math.round(avg * 10) / 10;
  });
  return {
    days: out,
    labels: out.map((o) => o.label),
    counts: out.map((o) => o.count),
    rollingAvg,
  };
};

const KpiTile = ({ label, value, caption, color }) => (
  <Grid item xs={6} sm={3}>
    <Card elevation={2} sx={{ borderRadius: '12px', height: '100%' }}>
      <CardContent sx={{ textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Typography variant="caption" sx={{ color: '#8a94a6', fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase', fontSize: '0.68rem' }}>
          {label}
        </Typography>
        <Typography variant="h5" fontWeight="800" sx={{ color: color || 'inherit', lineHeight: 1.25 }}>
          {value}
        </Typography>
        {caption && (
          <Typography variant="caption" sx={{ color: '#a5aebc', display: 'block', fontSize: '0.68rem' }}>
            {caption}
          </Typography>
        )}
      </CardContent>
    </Card>
  </Grid>
);

const ChainTipsPage = () => {
  const network = useNetwork();
  const { wsBaseUrl, theme: networkTheme, isTestnet } = network;
  const primaryColor = networkTheme.primary;
  const secondaryColor = networkTheme.secondary;

  const [blocks, setBlocks] = useState([]);
  const [currentHeight, setCurrentHeight] = useState(0);
  const [chainTips, setChainTips] = useState(null);
  const [forkAlert, setForkAlert] = useState(null);
  const [loading, setLoading] = useState(true);

  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const explorerBase = isTestnet ? 'https://testnet.digiexplorer.info' : 'https://digiexplorer.info';
  const explorerUrl = (hash) => `${explorerBase}/block/${hash}`;

  // Live feed over the network WebSocket.
  useEffect(() => {
    const socket = new WebSocket(wsBaseUrl);
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'recentBlocks') {
          setBlocks(message.data || []);
          setLoading(false);
        } else if (message.type === 'newBlock' && message.data) {
          setBlocks((prev) => {
            const next = [message.data, ...prev.filter((b) => b.hash !== message.data.hash)];
            next.sort((a, b) => b.height - a.height);
            return next.slice(0, 240);
          });
          setCurrentHeight((prev) => Math.max(prev, message.data.height || 0));
        } else if (message.type === 'initialData' && message.data?.blockchainInfo) {
          setCurrentHeight((prev) => Math.max(prev, message.data.blockchainInfo.blocks || 0));
        } else if (message.type === 'chainTips' && message.data) {
          setChainTips(message.data);
          setLoading(false);
          if (message.data.active?.height) {
            setCurrentHeight((prev) => Math.max(prev, message.data.active.height));
          }
        } else if (message.type === 'forkAlert' && message.data) {
          setForkAlert(message.data);
        }
      } catch (err) {
        console.error('ChainTipsPage WS parse error:', err);
      }
    };
    socket.onerror = () => setLoading(false);
    return () => socket.close();
  }, [wsBaseUrl]);

  const tips = chainTips?.tips || [];
  const orphans = chainTips?.orphans || [];
  const counts = chainTips?.counts || {};
  const activeHeight = chainTips?.active?.height ?? currentHeight;
  const activeHash = chainTips?.active?.hash || null;
  const competingTips =
    (counts.validFork || 0) + (counts.validHeaders || 0) + (counts.invalid || 0);
  const orphans24h = chainTips?.orphans24h ?? orphans.length;
  const deepestBranch = chainTips?.maxBranchLen ?? 0;

  const level = forkAlert?.level && RISK_STATES[forkAlert.level] ? forkAlert.level : 'none';
  const risk = RISK_STATES[level];
  const riskReason = forkAlert?.reason || risk.defaultReason;

  const avgPerDay = chainTips?.avgPerDay;
  const trackedDays = chainTips?.trackedDays;
  const dailySeries = useMemo(
    () => buildDailySeries(chainTips?.dailyOrphans, 30),
    [chainTips?.dailyOrphans]
  );

  // Orphans-per-day chart: 30-day bars + a 7-day rolling-average line
  // (Chart.js manual lifecycle, mirrors DifficultiesPage).
  useEffect(() => {
    if (loading) return undefined;
    const ctx = chartRef.current?.getContext('2d');
    if (!ctx) return undefined;

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: dailySeries.labels,
        datasets: [
          {
            type: 'line',
            label: '7-day average',
            data: dailySeries.rollingAvg,
            borderColor: '#c62828',
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.35,
            order: 0,
          },
          {
            type: 'bar',
            label: 'Orphans/day',
            data: dailySeries.counts,
            backgroundColor: secondaryColor,
            borderRadius: 3,
            maxBarThickness: 22,
            order: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: true, position: 'top', labels: { boxWidth: 12, usePointStyle: true } } },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } },
          x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 10 } },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [loading, dailySeries, secondaryColor]);

  const statusChip = (status) => (
    <Chip
      label={status}
      size="small"
      sx={{
        backgroundColor: STATUS_COLORS[status] || '#9e9e9e',
        color: '#fff',
        fontWeight: 'bold',
      }}
    />
  );

  return (
    <Box sx={{ py: 4, backgroundImage: 'linear-gradient(to bottom, #f8f9fa, #ffffff)', minHeight: '100vh' }}>
      <Container maxWidth="lg">
        {/* (a) Hero — compact */}
        <Card elevation={2} sx={{ backgroundColor: '#f2f4f8', borderRadius: '12px', mb: 3 }}>
          <CardContent sx={{ py: { xs: 2.5, md: 3 }, textAlign: 'center', '&:last-child': { pb: { xs: 2.5, md: 3 } } }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 1 }}>
              <AccountTreeIcon sx={{ fontSize: { xs: '1.8rem', md: '2.2rem' }, color: primaryColor, mr: 1.5 }} />
              <Typography
                variant="h4"
                component="h1"
                fontWeight="800"
                color={primaryColor}
                sx={{ fontSize: { xs: '1.6rem', md: '2.1rem' } }}
              >
                Chain Tips & Orphans
              </Typography>
            </Box>
            <Typography variant="subtitle1" sx={{ maxWidth: 720, mx: 'auto', color: '#33475b' }}>
              A live window into DigiByte's chain tips, stale blocks, and fork risk.
            </Typography>
            <Typography variant="body2" sx={{ maxWidth: 720, mx: 'auto', mt: 0.5, color: '#78859a' }}>
              15s blocks across 5 algos make the occasional single-block stale normal — deep or growing
              branches are what matter.
            </Typography>
          </CardContent>
        </Card>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* (b) Fork-risk status strip — slim */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: { xs: 0.5, sm: 1.5 },
                borderRadius: '12px',
                mb: 3,
                px: 2,
                py: 1.5,
                backgroundColor: risk.bg,
                border: `1px solid ${risk.color}30`,
              }}
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: risk.color,
                  flexShrink: 0,
                  boxShadow: `0 0 8px ${risk.color}90`,
                }}
              />
              <Typography variant="h6" fontWeight="800" sx={{ color: risk.color, letterSpacing: '0.3px', lineHeight: 1.3 }}>
                {risk.text}
              </Typography>
              <Typography variant="body2" sx={{ color: '#5a6b7f', textAlign: 'center' }}>
                {riskReason}
              </Typography>
            </Box>

            {/* (c) KPI tiles */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <KpiTile label="Active Height" value={activeHeight ? activeHeight.toLocaleString() : '—'} caption="main chain tip" color={primaryColor} />
              <KpiTile label="Competing Tips" value={competingTips} caption="near the tip" color={competingTips > 0 ? '#e65100' : primaryColor} />
              <KpiTile label="Orphans (24h)" value={orphans24h} caption="stale blocks seen" color={orphans24h > 0 ? '#e65100' : primaryColor} />
              <KpiTile label="Deepest Branch" value={deepestBranch} caption="blocks off-chain" color={deepestBranch >= 3 ? '#c62828' : primaryColor} />
            </Grid>

            {/* (d) Main band: live fork-tree map beside the tips/orphans feeds
                (side-by-side on desktop to cut scrolling; stacks on mobile) */}
            <Grid container spacing={3} alignItems="stretch" sx={{ mb: 3 }}>
              <Grid item xs={12} md={5} sx={{ display: 'flex' }}>
            <Card elevation={3} sx={{ borderRadius: '12px', width: '100%', borderTop: `4px solid ${primaryColor}` }}>
              <CardContent>
                <style>{`
                  @keyframes ct-live-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.25; } }
                  @media (prefers-reduced-motion: reduce) { .ct-live-dot { animation: none !important; } }
                `}</style>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccountTreeIcon sx={{ color: primaryColor }} />
                    <Typography variant="h5" fontWeight="bold" sx={{ color: primaryColor }}>
                      Live Fork-Tree Map
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Box
                      className="ct-live-dot"
                      sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: '#e53935', animation: 'ct-live-pulse 1.4s ease-in-out infinite' }}
                    />
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#e53935', letterSpacing: '0.5px' }}>
                      LIVE
                    </Typography>
                    {chainTips?.updatedAt && (
                      <Typography variant="caption" sx={{ color: '#90a4ae' }}>
                        · updated {relTime(chainTips.updatedAt)}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <ForkTreeMap
                  blocks={blocks}
                  tips={tips}
                  activeHash={activeHash}
                  accentColor={primaryColor}
                />
              </CardContent>
            </Card>
              </Grid>

              <Grid item xs={12} md={7} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* (e) Current chain tips table */}
            <Card elevation={3} sx={{ borderRadius: '12px', borderTop: `4px solid ${primaryColor}` }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <CallSplitIcon sx={{ color: primaryColor }} />
                  <Typography variant="h5" fontWeight="bold" sx={{ color: primaryColor }}>
                    Current Chain Tips
                  </Typography>
                </Box>
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: `${primaryColor}12` }}>
                      <TableRow>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell align="right"><strong>Height</strong></TableCell>
                        <TableCell align="right"><strong>Branch Len</strong></TableCell>
                        <TableCell><strong>Hash</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tips.map((tip, i) => (
                        <TableRow key={tip.hash || `tip-${i}`} hover>
                          <TableCell>{statusChip(tip.status)}</TableCell>
                          <TableCell align="right">{(tip.height ?? 0).toLocaleString()}</TableCell>
                          <TableCell align="right">{tip.branchlen ?? 0}</TableCell>
                          <TableCell>
                            <Link
                              href={explorerUrl(tip.hash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                            >
                              {shortHash(tip.hash)}
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                      {tips.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            Only the active tip — no competing branches right now.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>

            {/* (f) Recent orphans feed (internal scroll keeps the column compact) */}
            <Card elevation={3} sx={{ borderRadius: '12px', flexGrow: 1, borderTop: `4px solid ${primaryColor}` }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <HistoryIcon sx={{ color: primaryColor }} />
                  <Typography variant="h5" fontWeight="bold" sx={{ color: primaryColor }}>
                    Recent Orphans (last 24h)
                  </Typography>
                </Box>
                {orphans.length === 0 ? (
                  <Typography variant="body1" sx={{ color: '#777', textAlign: 'center', py: 3 }}>
                    No orphaned blocks in the last 24 hours.
                  </Typography>
                ) : (
                  <TableContainer
                    component={Paper}
                    elevation={0}
                    sx={{ border: '1px solid #e0e0e0', maxHeight: { xs: 320, md: 380 } }}
                  >
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell align="right" sx={{ backgroundColor: '#eef2f8' }}><strong>Height</strong></TableCell>
                          <TableCell sx={{ backgroundColor: '#eef2f8' }}><strong>Hash</strong></TableCell>
                          <TableCell sx={{ backgroundColor: '#eef2f8', display: { xs: 'none', sm: 'table-cell' } }}><strong>Algo</strong></TableCell>
                          <TableCell sx={{ backgroundColor: '#eef2f8', display: { xs: 'none', sm: 'table-cell' } }}><strong>Pool</strong></TableCell>
                          <TableCell align="right" sx={{ backgroundColor: '#eef2f8' }}><strong>Branch</strong></TableCell>
                          <TableCell align="right" sx={{ backgroundColor: '#eef2f8' }}><strong>Seen</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {orphans.map((o, i) => (
                          <TableRow key={o.hash || `orphan-${i}`} hover>
                            <TableCell align="right">{(o.height ?? 0).toLocaleString()}</TableCell>
                            <TableCell>
                              <Link
                                href={explorerUrl(o.hash)}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                              >
                                {shortHash(o.hash)}
                              </Link>
                            </TableCell>
                            <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{o.algo || '—'}</TableCell>
                            <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{o.pool || '—'}</TableCell>
                            <TableCell align="right">{o.branchlen ?? 1}</TableCell>
                            <TableCell align="right">{relTime(o.firstSeen)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
              </Grid>
            </Grid>

            {/* (g) Orphans-per-day history chart (30 days + rolling average) */}
            <Card elevation={3} sx={{ borderRadius: '12px', mb: 3, borderTop: `4px solid ${primaryColor}` }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ShowChartIcon sx={{ color: primaryColor }} />
                    <Typography variant="h5" fontWeight="bold" sx={{ color: primaryColor }}>
                      Orphans per Day (30 days)
                    </Typography>
                  </Box>
                  {Number.isFinite(avgPerDay) && (
                    <Chip
                      label={`Avg ${avgPerDay.toFixed(1)} / day${Number.isFinite(trackedDays) && trackedDays > 0 ? ` · ${trackedDays} day${trackedDays > 1 ? 's' : ''} tracked` : ''}`}
                      sx={{ fontWeight: 700, color: primaryColor, bgcolor: `${primaryColor}15`, border: `1px solid ${primaryColor}40` }}
                    />
                  )}
                </Box>
                <Box sx={{ height: 240, position: 'relative' }}>
                  <canvas ref={chartRef} style={{ width: '100%', height: '100%' }} />
                </Box>
              </CardContent>
            </Card>

            {/* (h) Educational explainer — what tips/orphans are + how DGB makes them */}
            <ChainTipsExplainer accentColor={primaryColor} />
          </>
        )}
      </Container>
    </Box>
  );
};

export default ChainTipsPage;
