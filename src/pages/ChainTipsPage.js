import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Container, Typography, Box, Card, CardContent, Divider, Grid,
  Table, TableContainer, TableHead, TableBody, TableRow, TableCell,
  Paper, Chip, CircularProgress, Link,
} from '@mui/material';
import { Chart, registerables } from 'chart.js';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { useNetwork } from '../context/NetworkContext';
import ForkTreeMap from '../components/ForkTreeMap';

Chart.register(...registerables);

// Status colours shared with the ForkTreeMap legend.
const STATUS_COLORS = {
  active: '#4caf50',
  'valid-fork': '#ff9800',
  'valid-headers': '#ffc107',
  'headers-only': '#9e9e9e',
  invalid: '#f44336',
};

// Fork-risk hero states, keyed by the latest forkAlert level.
const RISK_STATES = {
  none: { text: 'NETWORK HEALTHY', color: '#2e7d32', bg: '#e8f5e9', defaultReason: 'No competing branches near the tip.' },
  elevated: { text: 'ELEVATED — competing branch', color: '#e65100', bg: '#fff3e0', defaultReason: 'A competing branch is being tracked near the chain tip.' },
  critical: { text: 'FORK RISK', color: '#c62828', bg: '#ffebee', defaultReason: 'A deep competing branch has been detected.' },
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

const KpiTile = ({ label, value, color }) => (
  <Grid item xs={6} sm={3}>
    <Card elevation={2} sx={{ borderRadius: '12px', height: '100%' }}>
      <CardContent sx={{ textAlign: 'center', py: 2 }}>
        <Typography variant="body2" sx={{ color: '#777' }}>
          {label}
        </Typography>
        <Typography variant="h6" fontWeight="bold" sx={{ color: color || 'inherit' }}>
          {value}
        </Typography>
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

  const orphanBuckets = useMemo(() => buildOrphanBuckets(orphans), [orphans]);

  // Orphans-per-day bar chart (Chart.js manual lifecycle, mirrors DifficultiesPage).
  useEffect(() => {
    if (loading) return undefined;
    const ctx = chartRef.current?.getContext('2d');
    if (!ctx) return undefined;

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: orphanBuckets.map((b) => b.label),
        datasets: [
          {
            label: 'Orphans',
            data: orphanBuckets.map((b) => b.count),
            backgroundColor: secondaryColor,
            borderRadius: 4,
            maxBarThickness: 48,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } },
          x: { grid: { display: false } },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [loading, orphanBuckets, secondaryColor]);

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
        {/* (a) Hero */}
        <Card elevation={2} sx={{ backgroundColor: '#f2f4f8', borderRadius: '12px', mb: 4 }}>
          <CardContent sx={{ py: 4, textAlign: 'center' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
              <AccountTreeIcon sx={{ fontSize: '2.5rem', color: primaryColor, mr: 2 }} />
              <Typography variant="h3" component="h1" fontWeight="800" color={primaryColor}>
                Chain Tips & Orphans
              </Typography>
            </Box>
            <Divider sx={{ maxWidth: '150px', mx: 'auto', mb: 3, borderColor: secondaryColor, borderWidth: 2 }} />
            <Typography variant="subtitle1" sx={{ maxWidth: 820, mx: 'auto' }}>
              DigiByte's <strong>15s blocks across 5 algos</strong> naturally produce frequent
              single-block stale tips as two miners find a block at nearly the same instant. This page
              maps those competing tips and orphaned blocks <strong>live</strong>, and flags the rare
              case of a real, deeper fork that could put your confirmations at risk.
            </Typography>
          </CardContent>
        </Card>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* (b) Fork-risk status strip */}
            <Card elevation={3} sx={{ borderRadius: '12px', mb: 4, backgroundColor: risk.bg }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h4" fontWeight="900" sx={{ color: risk.color, letterSpacing: '0.5px' }}>
                  {risk.text}
                </Typography>
                <Typography variant="body1" sx={{ mt: 1, color: '#555' }}>
                  {riskReason}
                </Typography>
              </CardContent>
            </Card>

            {/* (c) KPI tiles */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <KpiTile label="Active Height" value={activeHeight ? activeHeight.toLocaleString() : '—'} color={primaryColor} />
              <KpiTile label="Competing Tips" value={competingTips} color="#e65100" />
              <KpiTile label="Orphans (24h)" value={orphans24h} color="#e65100" />
              <KpiTile label="Deepest Branch" value={deepestBranch} color={deepestBranch >= 3 ? '#c62828' : primaryColor} />
            </Grid>

            {/* (d) Centerpiece — live fork-tree map */}
            <Card elevation={3} sx={{ borderRadius: '12px', mb: 4 }}>
              <CardContent>
                <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, color: primaryColor }}>
                  Live Fork-Tree Map
                </Typography>
                <ForkTreeMap
                  blocks={blocks}
                  tips={tips}
                  activeHash={activeHash}
                  accentColor={primaryColor}
                />
              </CardContent>
            </Card>

            {/* (e) Current chain tips table */}
            <Card elevation={3} sx={{ borderRadius: '12px', mb: 4 }}>
              <CardContent>
                <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, color: primaryColor }}>
                  Current Chain Tips
                </Typography>
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

            {/* (f) Recent orphans feed */}
            <Card elevation={3} sx={{ borderRadius: '12px', mb: 4 }}>
              <CardContent>
                <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, color: primaryColor }}>
                  Recent Orphans (last 24h)
                </Typography>
                {orphans.length === 0 ? (
                  <Typography variant="body1" sx={{ color: '#777', textAlign: 'center', py: 3 }}>
                    No orphaned blocks in the last 24 hours.
                  </Typography>
                ) : (
                  <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
                    <Table size="small">
                      <TableHead sx={{ backgroundColor: `${primaryColor}12` }}>
                        <TableRow>
                          <TableCell align="right"><strong>Height</strong></TableCell>
                          <TableCell><strong>Hash</strong></TableCell>
                          <TableCell><strong>Algo</strong></TableCell>
                          <TableCell><strong>Pool</strong></TableCell>
                          <TableCell align="right"><strong>Branch</strong></TableCell>
                          <TableCell align="right"><strong>Seen</strong></TableCell>
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
                            <TableCell>{o.algo || '—'}</TableCell>
                            <TableCell>{o.pool || '—'}</TableCell>
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

            {/* (g) Orphans-per-day chart */}
            <Card elevation={3} sx={{ borderRadius: '12px', mb: 4 }}>
              <CardContent>
                <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, color: primaryColor }}>
                  Orphans per Day (7 days)
                </Typography>
                <Box sx={{ height: 240, position: 'relative' }}>
                  <canvas ref={chartRef} style={{ width: '100%', height: '100%' }} />
                </Box>
              </CardContent>
            </Card>
          </>
        )}
      </Container>
    </Box>
  );
};

export default ChainTipsPage;
