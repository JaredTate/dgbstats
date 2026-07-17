import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Container, Typography, Box, Card, CardContent, Divider, Grid,
  LinearProgress, Table, TableContainer, TableHead, TableBody, TableRow, TableCell,
  Paper, Chip, CircularProgress, Alert, Collapse, IconButton
} from '@mui/material';
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useNetwork } from '../context/NetworkContext';
import config from '../config';

// ---------------------------------------------------------------------------
// Post-activation pool readiness
// ---------------------------------------------------------------------------
// DigiDollar is ACTIVE, so BIP9 bit-23 signaling is over. What matters now,
// per DIGIDOLLAR_MINING_INTEGRATION_GUIDE.md:
//   1. PUBLISHING — the pool's blocks carry a v0x03 oracle price bundle
//      (OP_RETURN OP_ORACLE coinbase output). Definitive proof the pool runs
//      an upgraded node, requests the `digidollar-oracle` GBT rule, and
//      preserves `default_oracle_commitment` in its coinbase. These blocks
//      can confirm DD mint/redeem transactions.
//   2. UPGRADED, NOT PUBLISHING — v9.26 evidence exists (algolock bit 0,
//      which sits OUTSIDE the ASIC version-rolling window, or a historical
//      clean bit-23 signal) but no bundles: the pool needs to request the
//      `digidollar-oracle` GBT rule and copy `default_oracle_commitment`
//      into the coinbase (or its stratum stack is dropping it).
//   3. NOT UPGRADED — no v9.26 evidence at all: needs the Core upgrade.
const TOP_MASK = 0xf0000000;
const TOP_BITS = 0x20000000;
const STRUCTURAL_MASK = TOP_BITS | 0x00000f00 | 0x000000ff; // top marker + algo nibble + base-version byte
const BIT_ALGOLOCK = 1 << 0;     // 0x00000001
const BIT_DIGIDOLLAR = 1 << 23;  // 0x00800000

function classifyVersion(version) {
  const none = { top: false, ddRaw: false, ddClean: false, algolock: false, rolled: false };
  if (typeof version !== 'number' || !Number.isFinite(version)) return none;
  const top = (version & TOP_MASK) === TOP_BITS;
  const bip9Era = (version & 0xe0000000) === TOP_BITS;
  if (!bip9Era) return none;
  const rolled = (version & ~STRUCTURAL_MASK & ~BIT_DIGIDOLLAR) !== 0;
  const ddRaw = top && (version & BIT_DIGIDOLLAR) !== 0;
  return {
    top,
    ddRaw,
    ddClean: ddRaw && !rolled,
    algolock: top && (version & BIT_ALGOLOCK) !== 0,
    rolled,
  };
}

// Prefer the server-computed flags (dgbstats-server ships digidollarSignaling /
// algolockSignaling / versionRolled / hasOracleBundle on every block); fall
// back to classifying the raw version locally for older servers.
function classifyBlock(b) {
  if (b && typeof b.digidollarSignaling === 'boolean') {
    const rolled = !!b.versionRolled;
    return {
      top: true,
      ddRaw: b.digidollarSignaling,
      ddClean: b.digidollarSignaling && !rolled,
      algolock: !!b.algolockSignaling,
      rolled,
    };
  }
  return classifyVersion(b && b.version);
}

// Groestl unconditional-rejection backstop height (enforcement floor).
const ACTIVATION_HEIGHT = { mainnet: 23808000, testnet: null };

function poolKey(block) {
  const id = (block.poolIdentifier || '').trim();
  if (id && id.toLowerCase() !== 'unknown') return id;
  return block.minerAddress || block.minedTo || 'Unknown';
}

function fmtEta(blocks) {
  if (blocks == null) return '—';
  const hours = (blocks * 15) / 3600;
  if (hours >= 24) return `~${(hours / 24).toFixed(1)} days`;
  return `~${hours.toFixed(1)} hours`;
}

function hex8(v) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '—';
  return '0x' + (v >>> 0).toString(16).padStart(8, '0');
}

function isGroestl(algo) {
  return typeof algo === 'string' && algo.toLowerCase().includes('groestl');
}

const PoolUpgradeTrackerPage = () => {
  const network = useNetwork();
  const { wsBaseUrl, theme: networkTheme, apiPrefix, name: networkName } = network;
  const primaryColor = networkTheme.primary;
  const secondaryColor = networkTheme.secondary;

  const [blocks, setBlocks] = useState([]);
  const [currentHeight, setCurrentHeight] = useState(0);
  const [algolockDeployment, setAlgolockDeployment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({}); // pool key -> bool

  const activationHeight = ACTIVATION_HEIGHT[networkName] ?? null;

  const toggle = useCallback((key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

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

  // Authoritative deployment stats (algolock) and current height (polled).
  const fetchOfficial = useCallback(async () => {
    try {
      const base = `${config.apiBaseUrl}/api${apiPrefix || ''}`;
      const [depRes, chainRes] = await Promise.all([
        fetch(`${base}/getdeploymentinfo`),
        fetch(`${base}/getblockchaininfo`),
      ]);
      if (depRes.ok) {
        const dep = await depRes.json();
        setAlgolockDeployment(dep?.deployments?.algolock || null);
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

  // Aggregate oracle-bundle production + upgrade evidence per pool.
  const {
    pools, totalBlocks, bundleCount, bundlePct, alCount, alPct,
    publishingPools, upgradedPools, notUpgradedPools,
  } = useMemo(() => {
    const map = new Map();
    let total = 0, bundles = 0, al = 0;
    for (const b of blocks) {
      total += 1;
      const c = classifyBlock(b);
      const hasBundle = !!b.hasOracleBundle;
      if (hasBundle) bundles += 1;
      if (c.algolock) al += 1;
      const key = poolKey(b);
      if (!map.has(key)) {
        map.set(key, {
          key, name: key, total: 0, bundles: 0, al: 0, ddClean: 0, rolled: 0,
          lastSigners: null, lastBundleHeight: -1, lastPriceUsd: null,
          latestHeight: -1, algos: new Map(),
        });
      }
      const p = map.get(key);
      p.total += 1;
      if (hasBundle) {
        p.bundles += 1;
        if ((b.height || 0) > p.lastBundleHeight) {
          p.lastBundleHeight = b.height || 0;
          p.lastSigners = b.oracleSignerCount ?? null;
          p.lastPriceUsd = b.oraclePriceUsd ?? null;
        }
      }
      if (c.algolock) p.al += 1;
      if (c.ddClean) p.ddClean += 1;
      if (c.rolled) p.rolled += 1;
      // per-algorithm breakdown (the drill-down)
      const algo = b.algo || 'unknown';
      if (!p.algos.has(algo)) {
        p.algos.set(algo, { algo, n: 0, bundles: 0, al: 0, rolled: 0, sampleVersion: b.version, sampleHeight: b.height || 0 });
      }
      const a = p.algos.get(algo);
      a.n += 1;
      if (hasBundle) a.bundles += 1;
      if (c.algolock) a.al += 1;
      if (c.rolled) a.rolled += 1;
      if ((b.height || 0) > a.sampleHeight) { a.sampleHeight = b.height || 0; a.sampleVersion = b.version; }
      if ((b.height || 0) > p.latestHeight) p.latestHeight = b.height || 0;
    }
    const list = Array.from(map.values()).map((p) => {
      // Bucket per the integration contract:
      //   bundles > 0                          -> publishing (proof)
      //   algolock or clean bit-23 evidence    -> upgraded (needs GBT fix)
      //   nothing                              -> none (needs Core upgrade)
      const status = p.bundles > 0 ? 'publishing' : (p.al > 0 || p.ddClean > 0 ? 'upgraded' : 'none');
      return {
        ...p,
        status,
        bundlePct: p.total ? Math.round((p.bundles / p.total) * 100) : 0,
        alPct: p.total ? Math.round((p.al / p.total) * 100) : 0,
        algoBreakdown: Array.from(p.algos.values()).sort((x, y) => y.n - x.n),
        algoList: Array.from(p.algos.keys()),
      };
    });
    // Publishing pools first, then upgraded, then the outreach list; big pools first within each.
    const order = { publishing: 0, upgraded: 1, none: 2 };
    list.sort((a, b) => order[a.status] - order[b.status] || b.total - a.total);
    return {
      pools: list,
      totalBlocks: total,
      bundleCount: bundles,
      bundlePct: total ? Math.round((bundles / total) * 100) : 0,
      alCount: al,
      alPct: total ? Math.round((al / total) * 100) : 0,
      publishingPools: list.filter((p) => p.status === 'publishing').length,
      upgradedPools: list.filter((p) => p.status === 'upgraded').length,
      notUpgradedPools: list.filter((p) => p.status === 'none').length,
    };
  }, [blocks]);

  // --- Algolock deployment context (bit 0 is the reliable v9.26 indicator) ---
  const algolockStatus = algolockDeployment?.bip9?.status || (algolockDeployment?.active ? 'active' : null);
  const algolockLive = ['started', 'locked_in', 'active'].includes(algolockStatus);

  // --- Groestl retirement (unconditional rejection height) ---
  const backstopBlocks = activationHeight && currentHeight ? Math.max(0, activationHeight - currentHeight) : null;
  const backstopPending = !!(activationHeight && currentHeight > 0 && currentHeight < activationHeight);

  const statusChip = (status) => {
    if (status === 'publishing') {
      return (
        <Chip icon={<CheckCircleIcon />} label="Publishing bundles" size="small"
          sx={{ backgroundColor: 'rgba(255, 179, 0, 0.18)', color: '#9a6a00', fontWeight: 'bold', '& .MuiChip-icon': { color: '#b8860b' } }} />
      );
    }
    if (status === 'upgraded') {
      return (
        <Chip label="Upgraded — not publishing" size="small"
          sx={{ backgroundColor: '#fff3e0', color: '#e65100', fontWeight: 'bold' }} />
      );
    }
    return (
      <Chip label="Not upgraded" size="small"
        sx={{ backgroundColor: '#ffebee', color: '#c62828', fontWeight: 'bold' }} />
    );
  };

  const ReadinessBar = ({ pct, color = '#b8860b' }) => (
    <Box sx={{ position: 'relative', mb: 1 }}>
      <LinearProgress
        variant="determinate"
        value={Math.min(pct, 100)}
        sx={{
          height: 24, borderRadius: '12px', backgroundColor: '#e0e0e0',
          '& .MuiLinearProgress-bar': { backgroundColor: color, borderRadius: '12px' },
        }}
      />
    </Box>
  );

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
            <Typography variant="subtitle1" sx={{ maxWidth: 820, mx: 'auto' }}>
              <strong>DigiDollar is ACTIVE</strong> — signalling is over. This page tracks the last{' '}
              <strong>{totalBlocks || 240}</strong> blocks for the thing that matters now:{' '}
              which pools attach <strong>oracle price bundles</strong> to their coinbase, proving they can
              mine DigiDollar mint/redeem blocks.
            </Typography>
            <Typography variant="body2" sx={{ maxWidth: 820, mx: 'auto', mt: 1.5, color: '#555' }}>
              A bundle-carrying block proves the whole pipeline: an upgraded v9.26 node, a
              getblocktemplate request with the <code>digidollar-oracle</code> rule, and a coinbase that
              preserves <code>default_oracle_commitment</code>. Pools without bundles either need that
              GBT change (if already upgraded) or the Core upgrade itself. Click any pool for its
              per-algorithm breakdown.
            </Typography>
          </CardContent>
        </Card>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : (
          <>
            {/* Bucket KPIs */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={4}>
                <Card elevation={3} sx={{ p: 3, borderRadius: '12px', textAlign: 'center', borderTop: '4px solid #b8860b', height: '100%' }}>
                  <Typography variant="h3" fontWeight="800" sx={{ color: '#9a6a00' }}>{publishingPools}</Typography>
                  <Typography variant="subtitle1" fontWeight="bold">Publishing pools</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Mining blocks with oracle bundles — fully DigiDollar-ready
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card elevation={3} sx={{ p: 3, borderRadius: '12px', textAlign: 'center', borderTop: '4px solid #e65100', height: '100%' }}>
                  <Typography variant="h3" fontWeight="800" sx={{ color: '#e65100' }}>{upgradedPools}</Typography>
                  <Typography variant="subtitle1" fontWeight="bold">Upgraded, not publishing</Typography>
                  <Typography variant="body2" color="text.secondary">
                    On v9.26 but their blocks never include a bundle — reach out about the GBT rule
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card elevation={3} sx={{ p: 3, borderRadius: '12px', textAlign: 'center', borderTop: '4px solid #c62828', height: '100%' }}>
                  <Typography variant="h3" fontWeight="800" sx={{ color: '#c62828' }}>{notUpgradedPools}</Typography>
                  <Typography variant="subtitle1" fontWeight="bold">Not upgraded yet</Typography>
                  <Typography variant="body2" color="text.secondary">
                    No v9.26 evidence — reach out about the Core upgrade first
                  </Typography>
                </Card>
              </Grid>
            </Grid>

            {/* Coverage cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={6}>
                <Card elevation={3} sx={{ p: 3, borderRadius: '12px', height: '100%' }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5, color: primaryColor }}>
                    Oracle bundle production
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, color: '#555' }}>
                    {bundleCount} of {totalBlocks} recent blocks carry an oracle price bundle
                    (v0x03 OP_RETURN OP_ORACLE coinbase output). Only these blocks can confirm
                    DigiDollar mint/redeem transactions.
                  </Typography>
                  <ReadinessBar pct={bundlePct} />
                  <Typography variant="h6" fontWeight="bold" sx={{ color: '#9a6a00' }}>
                    {bundlePct}% bundle coverage
                  </Typography>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Even a fully integrated pool mines bundle-less blocks when no fresh MuSig2
                    bundle is ready — coverage measures readiness, and 100% is not expected.
                    A pool with <strong>zero</strong> bundles across many blocks is the signal to act on:
                    its stack must request the <code>digidollar-oracle</code> GBT rule and preserve{' '}
                    <code>default_oracle_commitment</code> as a zero-value coinbase output.
                  </Alert>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card elevation={3} sx={{ p: 3, borderRadius: '12px', height: '100%' }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5, color: primaryColor }}>
                    v9.26 adoption — Algolock (bit&nbsp;0)
                  </Typography>
                  {algolockLive || alCount > 0 ? (
                    <>
                      <Typography variant="body2" sx={{ mb: 2, color: '#555' }}>
                        {alCount} of {totalBlocks} recent blocks signal algolock (bit&nbsp;0), the
                        reliable "this node runs v9.26.2+" indicator — it sits outside the ASIC
                        version-rolling window, so it is deterministic for every pool including
                        SHA256D.
                      </Typography>
                      <ReadinessBar pct={alPct} color={alPct >= 70 ? '#4caf50' : '#ff9800'} />
                      <Typography variant="h6" fontWeight="bold" color={alPct >= 70 ? '#2e7d32' : '#e65100'}>
                        {alPct}% of recent hashpower on v9.26.2+
                      </Typography>
                    </>
                  ) : (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      Algolock signalling data is not available (status:{' '}
                      <strong>{algolockStatus || 'unknown'}</strong>). Upgrade evidence falls back to
                      historical clean bit-23 signals and, above all, oracle bundle production.
                    </Alert>
                  )}
                </Card>
              </Grid>
            </Grid>

            {/* Groestl retirement (algolock enforcement height) */}
            <Card elevation={3} sx={{ p: 3, borderRadius: '12px', mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Typography variant="h5" fontWeight="bold" sx={{ color: primaryColor }}>
                  Groestl Retirement
                </Typography>
                {activationHeight && !backstopPending && (
                  <Chip icon={<CheckCircleIcon />} label="Height reached — enforced"
                    sx={{ backgroundColor: '#2e7d32', color: 'white', fontWeight: 'bold' }} size="small" />
                )}
              </Box>
              {activationHeight ? (
                <Grid container spacing={3}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="#777">Enforcement height</Typography>
                    <Typography variant="h6" fontWeight="bold">{activationHeight.toLocaleString()}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="#777">Current height</Typography>
                    <Typography variant="h6" fontWeight="bold">{currentHeight ? currentHeight.toLocaleString() : '—'}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="#777">Status</Typography>
                    <Typography variant="h6" fontWeight="bold" color={backstopPending ? '#e65100' : '#2e7d32'}>
                      {backstopPending ? `${backstopBlocks.toLocaleString()} blocks to go` : 'Reached'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="#777">{backstopPending ? 'Est. time (15s blocks)' : 'Groestl blocks'}</Typography>
                    <Typography variant="h6" fontWeight="bold" color={backstopPending ? undefined : '#2e7d32'}>
                      {backstopPending ? fmtEta(backstopBlocks) : 'Rejected'}
                    </Typography>
                  </Grid>
                </Grid>
              ) : (
                <Alert severity="info">Algolock enforcement is not scheduled on this network.</Alert>
              )}
            </Card>

            {/* Per-pool table with drill-down */}
            <Card elevation={3} sx={{ borderRadius: '12px' }}>
              <CardContent>
                <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, color: primaryColor }}>
                  Pools (last {totalBlocks} blocks)
                </Typography>
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: `${primaryColor}12` }}>
                      <TableRow>
                        <TableCell sx={{ width: 40 }} />
                        <TableCell><strong>Pool / Miner</strong></TableCell>
                        <TableCell align="center"><strong>Status</strong></TableCell>
                        <TableCell align="center"><strong>Oracle bundles</strong></TableCell>
                        <TableCell align="center"><strong>Algolock (bit 0)</strong></TableCell>
                        <TableCell align="right"><strong>Blocks</strong></TableCell>
                        <TableCell align="right"><strong>Last block</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pools.map((p) => (
                        <React.Fragment key={p.key}>
                          <TableRow
                            hover
                            onClick={() => toggle(p.key)}
                            sx={{
                              cursor: 'pointer',
                              backgroundColor: p.status === 'publishing' ? 'rgba(255, 215, 0, 0.06)' : undefined,
                              '& > *': { borderBottom: expanded[p.key] ? 'unset' : undefined },
                            }}
                          >
                            <TableCell>
                              <IconButton size="small" aria-label="expand row">
                                {expanded[p.key] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                              </IconButton>
                            </TableCell>
                            <TableCell sx={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              <span title={p.algoList.length ? `${p.name} — ${p.algoList.join(', ')}` : p.name}>{p.name}</span>
                            </TableCell>
                            <TableCell align="center">{statusChip(p.status)}</TableCell>
                            <TableCell align="center">
                              <span title={p.bundles > 0
                                ? `Latest bundle at block ${p.lastBundleHeight.toLocaleString()}${p.lastSigners != null ? ` · ${p.lastSigners} signers` : ''}${p.lastPriceUsd != null ? ` · $${p.lastPriceUsd.toFixed(6)}` : ''}`
                                : 'No oracle bundles in the window'}>
                                <Typography component="span" variant="body2" fontWeight={p.bundles > 0 ? 'bold' : 'normal'}
                                  sx={{ color: p.bundles > 0 ? '#9a6a00' : '#999' }}>
                                  {p.bundles}/{p.total} ({p.bundlePct}%)
                                </Typography>
                              </span>
                            </TableCell>
                            <TableCell align="center">
                              <Typography component="span" variant="caption" color="#666">{p.al}/{p.total} ({p.alPct}%)</Typography>
                            </TableCell>
                            <TableCell align="right">{p.total}</TableCell>
                            <TableCell align="right">{p.latestHeight >= 0 ? p.latestHeight.toLocaleString() : '—'}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ py: 0, borderBottom: expanded[p.key] ? undefined : 'none' }} colSpan={7}>
                              <Collapse in={!!expanded[p.key]} timeout="auto" unmountOnExit>
                                <Box sx={{ my: 2, mx: 1 }}>
                                  <Typography variant="subtitle2" sx={{ mb: 1, color: primaryColor }}>
                                    Algorithm breakdown — {p.name}
                                  </Typography>
                                  <Table size="small" sx={{ backgroundColor: '#fafafa', borderRadius: 1 }}>
                                    <TableHead>
                                      <TableRow>
                                        <TableCell><strong>Algorithm</strong></TableCell>
                                        <TableCell align="right"><strong>Blocks</strong></TableCell>
                                        <TableCell align="right"><strong>Oracle bundles</strong></TableCell>
                                        <TableCell align="right"><strong>Algolock (bit 0)</strong></TableCell>
                                        <TableCell align="right"><strong>Version-rolled</strong></TableCell>
                                        <TableCell><strong>Latest version</strong></TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {p.algoBreakdown.map((a) => (
                                        <TableRow key={a.algo} sx={{ backgroundColor: isGroestl(a.algo) ? '#fff3e0' : undefined }}>
                                          <TableCell>
                                            {a.algo}
                                            {isGroestl(a.algo) && (
                                              <Chip label="rejected at backstop" size="small"
                                                sx={{ ml: 1, backgroundColor: '#e65100', color: 'white', height: 18, fontSize: '0.65rem' }} />
                                            )}
                                          </TableCell>
                                          <TableCell align="right">{a.n}</TableCell>
                                          <TableCell align="right" sx={{ color: a.bundles ? '#9a6a00' : '#999', fontWeight: a.bundles ? 'bold' : 'normal' }}>
                                            {a.bundles}/{a.n}
                                          </TableCell>
                                          <TableCell align="right" sx={{ color: a.al ? '#2e7d32' : '#999', fontWeight: a.al ? 'bold' : 'normal' }}>
                                            {a.al}/{a.n}
                                          </TableCell>
                                          <TableCell align="right" sx={{ color: a.rolled ? '#e65100' : '#999' }}>{a.rolled}</TableCell>
                                          <TableCell><code style={{ fontSize: '0.8rem' }}>{hex8(a.sampleVersion)}</code></TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                  <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#888' }}>
                                    A pool publishing bundles on some algorithms but not others runs a mixed
                                    backend — the daemons behind the bundle-less algorithms need the{' '}
                                    <code>digidollar-oracle</code> GBT rule or the v9.26 upgrade.
                                  </Typography>
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      ))}
                      {pools.length === 0 && (
                        <TableRow><TableCell colSpan={7} align="center">No recent blocks available.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Typography variant="caption" sx={{ display: 'block', mt: 2, color: '#888' }}>
                  <strong>Publishing bundles</strong> is definitive proof of full DigiDollar integration.
                  <strong> Upgraded — not publishing</strong> means the node is v9.26 (algolock bit&nbsp;0 or a
                  historical clean bit-23 signal) but its blocks never carry a bundle — the pool must request
                  the <code>digidollar-oracle</code> rule in getblocktemplate and copy{' '}
                  <code>default_oracle_commitment</code> into the coinbase as a zero-value output.
                  <strong> Not upgraded</strong> means no v9.26 evidence in the window. Pools are identified by
                  coinbase tag or payout address.
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
