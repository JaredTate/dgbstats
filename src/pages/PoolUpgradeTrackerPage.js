import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Container, Typography, Box, Card, CardContent, Divider, Grid,
  LinearProgress, Table, TableContainer, TableHead, TableBody, TableRow, TableCell,
  Paper, Chip, CircularProgress, Alert
} from '@mui/material';
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import { useNetwork } from '../context/NetworkContext';
import config from '../config';

// The v9.26.2 "algolock" soft fork (rejects retired Groestl / unknown algorithms)
// signals on BIP9 version bit 0 and is enforced unconditionally at a backstop height.
// Miners running v9.26.2 advertise readiness by setting bit 0 in mined blocks.
const ALGOLOCK_BIT = 0;
const VERSIONBITS_TOP_MASK = 0xe0000000;
const VERSIONBITS_TOP_BITS = 0x20000000;

// Per-network activation backstop height for the algolock deployment.
const ACTIVATION_HEIGHT = {
  mainnet: 23808000,
  testnet: null,      // not scheduled on testnet yet
  'mainnet-pre': null,
};

function signalsAlgolock(version) {
  if (typeof version !== 'number') return false;
  return (version & VERSIONBITS_TOP_MASK) === VERSIONBITS_TOP_BITS &&
         (version & (1 << ALGOLOCK_BIT)) !== 0;
}

function poolKey(block) {
  const id = (block.poolIdentifier || '').trim();
  if (id && id.toLowerCase() !== 'unknown') return id;
  return block.minerAddress || block.minedTo || 'Unknown';
}

const PoolUpgradeTrackerPage = () => {
  const network = useNetwork();
  const { wsBaseUrl, theme: networkTheme, apiPrefix, name: networkName } = network;
  const primaryColor = networkTheme.primary;
  const secondaryColor = networkTheme.secondary;

  const [blocks, setBlocks] = useState([]);
  const [currentHeight, setCurrentHeight] = useState(0);
  const [deployment, setDeployment] = useState(null);
  const [loading, setLoading] = useState(true);

  const activationHeight = ACTIVATION_HEIGHT[networkName] ?? null;

  // Live block feed over WebSocket (same channel the Pools/Blocks pages use).
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
        }
      } catch (err) {
        console.error('PoolUpgradeTracker WS parse error:', err);
      }
    };
    socket.onerror = () => setLoading(false);
    return () => socket.close();
  }, [wsBaseUrl]);

  // Authoritative BIP9 algolock stats + current height (polled).
  const fetchOfficial = useCallback(async () => {
    try {
      const base = `${config.apiBaseUrl}/api${apiPrefix || ''}`;
      const [depRes, chainRes] = await Promise.all([
        fetch(`${base}/getdeploymentinfo`),
        fetch(`${base}/getblockchaininfo`),
      ]);
      if (depRes.ok) {
        const dep = await depRes.json();
        setDeployment(dep?.deployments?.algolock || null);
      }
      if (chainRes.ok) {
        const chain = await chainRes.json();
        if (chain?.blocks) setCurrentHeight((prev) => Math.max(prev, chain.blocks));
      }
    } catch (err) {
      console.error('PoolUpgradeTracker fetch error:', err);
    }
  }, [apiPrefix]);

  useEffect(() => {
    fetchOfficial();
    const id = setInterval(fetchOfficial, 30000);
    return () => clearInterval(id);
  }, [fetchOfficial]);

  // Aggregate per-pool signalling from the recent-block window.
  const { pools, totalBlocks, signalingBlocks, overallPct } = useMemo(() => {
    const map = new Map();
    let total = 0;
    let signaling = 0;
    for (const b of blocks) {
      total += 1;
      const sig = signalsAlgolock(b.version);
      if (sig) signaling += 1;
      const key = poolKey(b);
      if (!map.has(key)) {
        map.set(key, { key, name: key, total: 0, signaling: 0, latestHeight: -1, latestSignals: false, algos: new Set() });
      }
      const p = map.get(key);
      p.total += 1;
      if (sig) p.signaling += 1;
      if (b.algo) p.algos.add(b.algo);
      if ((b.height || 0) > p.latestHeight) {
        p.latestHeight = b.height || 0;
        p.latestSignals = sig;
      }
    }
    const list = Array.from(map.values()).map((p) => ({
      ...p,
      pct: p.total ? Math.round((p.signaling / p.total) * 100) : 0,
      status: p.latestSignals ? 'upgraded' : (p.signaling > 0 ? 'partial' : 'pending'),
      algos: Array.from(p.algos),
    }));
    list.sort((a, b) => b.total - a.total);
    return {
      pools: list,
      totalBlocks: total,
      signalingBlocks: signaling,
      overallPct: total ? Math.round((signaling / total) * 100) : 0,
    };
  }, [blocks]);

  const blocksRemaining = activationHeight && currentHeight
    ? Math.max(0, activationHeight - currentHeight) : null;
  const etaHours = blocksRemaining != null ? (blocksRemaining * 15) / 3600 : null;
  const etaText = etaHours == null ? '—'
    : etaHours >= 24 ? `~${(etaHours / 24).toFixed(1)} days` : `~${etaHours.toFixed(1)} hours`;

  const officialStatus = deployment?.bip9?.status || deployment?.status;
  const stats = deployment?.bip9?.statistics;
  const officialPct = stats && stats.period ? Math.round((stats.count / stats.period) * 100) : null;

  const statusChip = (status) => {
    if (status === 'upgraded') return <Chip icon={<CheckCircleIcon />} label="Upgraded (v9.26.2)" sx={{ backgroundColor: '#4caf50', color: 'white', fontWeight: 'bold' }} size="small" />;
    if (status === 'partial') return <Chip label="Partial" sx={{ backgroundColor: '#ff9800', color: 'white', fontWeight: 'bold' }} size="small" />;
    return <Chip icon={<HourglassTopIcon />} label="Not upgraded" sx={{ backgroundColor: '#9e9e9e', color: 'white', fontWeight: 'bold' }} size="small" />;
  };

  return (
    <Box sx={{ py: 4, backgroundImage: 'linear-gradient(to bottom, #f8f9fa, #ffffff)', minHeight: '100vh' }}>
      <Container maxWidth="lg">
        {/* Hero */}
        <Card elevation={2} sx={{ backgroundColor: '#f2f4f8', borderRadius: '12px', mb: 4 }}>
          <CardContent sx={{ py: 4, textAlign: 'center' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
              <SystemUpdateAltIcon sx={{ fontSize: '2.5rem', color: primaryColor, mr: 2 }} />
              <Typography variant="h3" component="h1" fontWeight="800" color={primaryColor}>
                Pool Upgrade Tracker
              </Typography>
            </Box>
            <Divider sx={{ maxWidth: '150px', mx: 'auto', mb: 3, borderColor: secondaryColor, borderWidth: 2 }} />
            <Typography variant="subtitle1" sx={{ maxWidth: 760, mx: 'auto' }}>
              Live readiness for the <strong>v9.26.2</strong> consensus fix that rejects the retired
              Groestl algorithm. Miners running v9.26.2 signal on BIP9 bit&nbsp;0 (<code>algolock</code>).
              This page shows which pools have upgraded, measured from recently mined blocks.
            </Typography>
          </CardContent>
        </Card>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : (
          <>
            {/* Overall readiness */}
            <Card elevation={3} sx={{ p: 3, borderRadius: '12px', mb: 4 }}>
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 1, color: primaryColor }}>
                Overall Network Readiness
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, color: '#555' }}>
                {signalingBlocks} of {totalBlocks} recent blocks signal v9.26.2
                {officialPct != null && officialStatus ? ` · official BIP9 window: ${officialPct}% (${officialStatus})` : ''}
              </Typography>
              <Box sx={{ position: 'relative', mb: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(overallPct, 100)}
                  sx={{
                    height: 28, borderRadius: '12px', backgroundColor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: overallPct >= 70 ? '#4caf50' : '#ff9800',
                      borderRadius: '12px',
                    },
                  }}
                />
                {/* 70% safety marker */}
                <Box sx={{ position: 'absolute', top: 0, left: '70%', height: 28, borderLeft: '2px dashed #002352' }} />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6" fontWeight="bold" color={overallPct >= 70 ? '#2e7d32' : '#e65100'}>
                  {overallPct}% of recent hashpower upgraded
                </Typography>
                <Typography variant="body2" sx={{ color: '#555' }}>70% safe-majority marker</Typography>
              </Box>
            </Card>

            {/* Activation countdown */}
            <Card elevation={3} sx={{ p: 3, borderRadius: '12px', mb: 4 }}>
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, color: primaryColor }}>
                Enforcement Activation
              </Typography>
              {activationHeight ? (
                <Grid container spacing={3}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="#777">Activation height</Typography>
                    <Typography variant="h6" fontWeight="bold">{activationHeight.toLocaleString()}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="#777">Current height</Typography>
                    <Typography variant="h6" fontWeight="bold">{currentHeight ? currentHeight.toLocaleString() : '—'}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="#777">Blocks remaining</Typography>
                    <Typography variant="h6" fontWeight="bold">{blocksRemaining != null ? blocksRemaining.toLocaleString() : '—'}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="#777">Est. time (15s blocks)</Typography>
                    <Typography variant="h6" fontWeight="bold">{etaText}</Typography>
                  </Grid>
                </Grid>
              ) : (
                <Alert severity="info">Algolock enforcement is not scheduled on this network.</Alert>
              )}
              <Typography variant="body2" sx={{ mt: 2, color: '#555' }}>
                At the activation height, blocks using the retired Groestl algorithm (or any unknown
                algorithm) are rejected. Existing blocks are grandfathered. All pools must upgrade to
                v9.26.2 before this height to stay on the canonical chain.
              </Typography>
            </Card>

            {/* Per-pool table */}
            <Card elevation={3} sx={{ borderRadius: '12px' }}>
              <CardContent>
                <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, color: primaryColor }}>
                  Pools (last {totalBlocks} blocks)
                </Typography>
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
                  <Table>
                    <TableHead sx={{ backgroundColor: `${primaryColor}12` }}>
                      <TableRow>
                        <TableCell><strong>Pool / Miner</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell align="right"><strong>Signaling</strong></TableCell>
                        <TableCell align="right"><strong>Blocks</strong></TableCell>
                        <TableCell align="right"><strong>Last block</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pools.map((p) => (
                        <TableRow key={p.key} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                          <TableCell sx={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <span title={p.name}>{p.name}</span>
                          </TableCell>
                          <TableCell>{statusChip(p.status)}</TableCell>
                          <TableCell align="right">{p.signaling}/{p.total} ({p.pct}%)</TableCell>
                          <TableCell align="right">{p.total}</TableCell>
                          <TableCell align="right">{p.latestHeight >= 0 ? p.latestHeight.toLocaleString() : '—'}</TableCell>
                        </TableRow>
                      ))}
                      {pools.length === 0 && (
                        <TableRow><TableCell colSpan={5} align="center">No recent blocks available.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Typography variant="caption" sx={{ display: 'block', mt: 2, color: '#888' }}>
                  Status is based on each pool's most recent block. "Partial" means some but not the
                  latest block signaled — typical of a multi-node pool mid-rollout. Pools are identified
                  by coinbase tag or payout address from recently mined blocks.
                </Typography>
              </CardContent>
            </Card>
          </>
        )}
      </Container>
    </Box>
  );
};

export default PoolUpgradeTrackerPage;
