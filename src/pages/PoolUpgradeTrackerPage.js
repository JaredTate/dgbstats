import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Container, Typography, Box, Card, CardContent, Divider, Grid,
  LinearProgress, Table, TableContainer, TableHead, TableBody, TableRow, TableCell,
  Paper, Chip, CircularProgress, Alert, Collapse, IconButton
} from '@mui/material';
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useNetwork } from '../context/NetworkContext';
import config from '../config';

// ---------------------------------------------------------------------------
// Signal detection
// ---------------------------------------------------------------------------
// DigiByte block versions pack the mining algo into bits 8-11 and the base
// version into the low byte; BIP9 deployment signals occupy the remaining bits.
// We track two deployments in the rolling window:
//   * DigiDollar (bit 23) — the node is running v9.26.x. LIVE now.
//   * Algolock   (bit 0)  — the node is running v9.26.2+ and will reject the
//     retired Groestl algorithm. Appears once the algolock BIP9 window starts.
// Bit 23 sits INSIDE the BIP310/BIP320 ASIC version-rolling window (bits 13-28,
// mask 0x1fffe000), so on version-rolled SHA256D blocks it is a coin flip:
//   * ddRaw   — the raw bit, exactly what BIP9 consensus counts for activation
//               (versionbits Condition() ignores rolling), so a rolled block
//               that carries bit 23 IS counted by the network and counted here.
//   * ddClean — bit 23 on a non-rolled version: hard proof the pool's node is
//               v9.26.x. Absence of ddClean on a rolling pool proves nothing.
// Bit 0 sits OUTSIDE the roll window, so once its window opens it is the
// definitive upgrade indicator for every pool, including SHA256D.
// DigiByte's consensus top-mask is 0xF0000000 (versionbits.h) — stricter than
// Bitcoin's 0xE0000000: a block with rolled bit 28 set signals NOTHING.
const TOP_MASK = 0xf0000000;
const TOP_BITS = 0x20000000;
const STRUCTURAL_MASK = TOP_BITS | 0x00000f00 | 0x000000ff; // top marker + algo nibble + base-version byte
const BIT_ALGOLOCK = 1 << 0;     // 0x00000001
const BIT_DIGIDOLLAR = 1 << 23;  // 0x00800000

function classifyVersion(version) {
  const none = { top: false, ddRaw: false, ddClean: false, algolock: false, rolled: false };
  if (typeof version !== 'number' || !Number.isFinite(version)) return none;
  const top = (version & TOP_MASK) === TOP_BITS;
  // Rolled detection uses the looser 001x shape: a rolled block whose bit 28
  // landed on 1 fails the consensus top-mask (signals nothing) but is still a
  // version-rolled block and must show up as one.
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
// algolockSignaling / versionRolled on every block, like taprootSignaling);
// fall back to classifying the raw version locally for older servers.
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

// Per-network BIP9 window (fallback if live deployment stats are unavailable).
const DEFAULT_PERIOD = { mainnet: 40320, testnet: 200, 'mainnet-pre': 40320 };

// Groestl unconditional-rejection backstop height (enforcement floor, independent of signalling).
const ACTIVATION_HEIGHT = { mainnet: 23808000, testnet: null, 'mainnet-pre': null };

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
  const [ddDeployment, setDdDeployment] = useState(null);
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

  // Authoritative BIP9 stats (digidollar + algolock) and current height (polled).
  const fetchOfficial = useCallback(async () => {
    try {
      const base = `${config.apiBaseUrl}/api${apiPrefix || ''}`;
      const [depRes, chainRes] = await Promise.all([
        fetch(`${base}/getdeploymentinfo`),
        fetch(`${base}/getblockchaininfo`),
      ]);
      if (depRes.ok) {
        const dep = await depRes.json();
        setDdDeployment(dep?.deployments?.digidollar || null);
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

  // Aggregate both signals per pool (with a per-algorithm drill-down) over the window.
  const {
    pools, totalBlocks, ddRawCount, ddCleanCount, alCount, ddRawPct, alPct, rolledCount,
  } = useMemo(() => {
    const map = new Map();
    let total = 0, ddRaw = 0, ddClean = 0, al = 0, rolled = 0;
    for (const b of blocks) {
      total += 1;
      const c = classifyBlock(b);
      if (c.ddRaw) ddRaw += 1;
      if (c.ddClean) ddClean += 1;
      if (c.algolock) al += 1;
      if (c.rolled) rolled += 1;
      const key = poolKey(b);
      if (!map.has(key)) {
        map.set(key, {
          key, name: key, total: 0, ddRaw: 0, ddClean: 0, al: 0, rolled: 0,
          latestHeight: -1, latest: null, latestAlgo: '',
          latestCleanHeight: -1, latestClean: null, algos: new Map(),
        });
      }
      const p = map.get(key);
      p.total += 1;
      if (c.ddRaw) p.ddRaw += 1;
      if (c.ddClean) p.ddClean += 1;
      if (c.algolock) p.al += 1;
      if (c.rolled) p.rolled += 1;
      // per-algorithm breakdown (the drill-down)
      const algo = b.algo || 'unknown';
      if (!p.algos.has(algo)) {
        p.algos.set(algo, { algo, n: 0, ddRaw: 0, ddClean: 0, al: 0, rolled: 0, sampleVersion: b.version, sampleHeight: b.height || 0 });
      }
      const a = p.algos.get(algo);
      a.n += 1;
      if (c.ddRaw) a.ddRaw += 1;
      if (c.ddClean) a.ddClean += 1;
      if (c.algolock) a.al += 1;
      if (c.rolled) a.rolled += 1;
      if ((b.height || 0) > a.sampleHeight) { a.sampleHeight = b.height || 0; a.sampleVersion = b.version; }
      if ((b.height || 0) > p.latestHeight) { p.latestHeight = b.height || 0; p.latest = c; p.latestAlgo = algo; }
      if (!c.rolled && (b.height || 0) > p.latestCleanHeight) { p.latestCleanHeight = b.height || 0; p.latestClean = c; }
    }
    const list = Array.from(map.values()).map((p) => {
      // Upgrade inference:
      //  * any bit-0 signal, or bit 23 on the pool's most recent clean block => upgraded
      //  * clean signals exist but the newest clean block lacks one => partial (mixed backend)
      //  * clean blocks exist and NONE signal => not upgraded (clean absence is real evidence)
      //  * only version-rolled blocks => coin-flip territory, EXCEPT a consistent run:
      //    >=4 rolled blocks all carrying bit 23 means the pool's stack preserves the bit
      //    through rolling (2^-n odds of chance) => upgraded; all missing it => not upgraded.
      let ddState;
      if (p.al > 0 || p.latestClean?.ddClean) ddState = 'upgraded';
      else if (p.ddClean > 0) ddState = 'partial';
      else if (p.latestClean) ddState = 'none';
      else if (p.rolled > 0 && p.total >= 4 && p.ddRaw === p.total) ddState = 'upgraded';
      else if (p.rolled > 0 && p.total >= 4 && p.ddRaw === 0) ddState = 'none';
      else ddState = p.rolled > 0 ? 'rolling' : 'none';
      return {
        ...p,
        ddPct: p.total ? Math.round((p.ddRaw / p.total) * 100) : 0,
        alPct: p.total ? Math.round((p.al / p.total) * 100) : 0,
        ddState,
        alState: p.latest?.algolock ? 'ready' : (p.al > 0 ? 'partial' : 'none'),
        algoBreakdown: Array.from(p.algos.values()).sort((x, y) => y.n - x.n),
        algoList: Array.from(p.algos.keys()),
      };
    });
    list.sort((a, b) => b.total - a.total);
    return {
      pools: list,
      totalBlocks: total,
      ddRawCount: ddRaw,
      ddCleanCount: ddClean,
      alCount: al,
      rolledCount: rolled,
      ddRawPct: total ? Math.round((ddRaw / total) * 100) : 0,
      alPct: total ? Math.round((al / total) * 100) : 0,
    };
  }, [blocks]);

  // --- BIP9 window boundaries (shared by the DigiDollar reset and algolock opening) ---
  const period = ddDeployment?.bip9?.statistics?.period || DEFAULT_PERIOD[networkName] || 40320;
  const nextWindowStart = currentHeight ? (Math.floor(currentHeight / period) + 1) * period : null;
  const nextWindowBlocks = nextWindowStart ? Math.max(0, nextWindowStart - currentHeight) : null;

  // --- Algolock signalling window (bit 0 only appears once the BIP9 window starts) ---
  const algolockStatus = algolockDeployment?.bip9?.status;
  const algolockLive = ['started', 'locked_in', 'active'].includes(algolockStatus);
  const nextAlgolockWindow = !algolockLive ? nextWindowStart : null;
  const algolockWindowBlocks = nextAlgolockWindow ? nextWindowBlocks : null;

  // --- Groestl enforcement backstop (unconditional rejection height) ---
  const backstopBlocks = activationHeight && currentHeight ? Math.max(0, activationHeight - currentHeight) : null;

  // --- Official BIP9 window context ---
  const ddStats = ddDeployment?.bip9?.statistics;
  const ddThreshold = ddStats?.threshold || (ddStats?.period ? Math.round(ddStats.period * 0.7) : null);
  const alStats = algolockDeployment?.bip9?.statistics;
  const alOfficialPct = alStats && alStats.period ? Math.round((alStats.count / alStats.period) * 100) : null;

  const ddChip = (state) => {
    if (state === 'upgraded') return <Chip icon={<CheckCircleIcon />} label="v9.26.x" sx={{ backgroundColor: '#4caf50', color: 'white', fontWeight: 'bold' }} size="small" />;
    if (state === 'partial') return <Chip label="Partial" sx={{ backgroundColor: '#ff9800', color: 'white', fontWeight: 'bold' }} size="small" />;
    if (state === 'rolling') return <Chip label="Rolling — bit 23 n/a" sx={{ backgroundColor: '#607d8b', color: 'white', fontWeight: 'bold' }} size="small" />;
    return <Chip icon={<HourglassTopIcon />} label="No" sx={{ backgroundColor: '#9e9e9e', color: 'white', fontWeight: 'bold' }} size="small" />;
  };
  const alChip = (state) => {
    if (state === 'ready') return <Chip icon={<CheckCircleIcon />} label="v9.26.2" sx={{ backgroundColor: '#2e7d32', color: 'white', fontWeight: 'bold' }} size="small" />;
    if (state === 'partial') return <Chip label="Partial" sx={{ backgroundColor: '#ff9800', color: 'white', fontWeight: 'bold' }} size="small" />;
    return <Chip label="—" sx={{ backgroundColor: '#e0e0e0', color: '#555' }} size="small" />;
  };

  const ReadinessBar = ({ pct }) => (
    <Box sx={{ position: 'relative', mb: 1 }}>
      <LinearProgress
        variant="determinate"
        value={Math.min(pct, 100)}
        sx={{
          height: 24, borderRadius: '12px', backgroundColor: '#e0e0e0',
          '& .MuiLinearProgress-bar': { backgroundColor: pct >= 70 ? '#4caf50' : '#ff9800', borderRadius: '12px' },
        }}
      />
      <Box sx={{ position: 'absolute', top: 0, left: '70%', height: 24, borderLeft: '2px dashed #002352' }} />
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
              Live pool readiness across the last <strong>{totalBlocks || 240}</strong> blocks, tracking two
              BIP9 signals: <strong>DigiDollar</strong> (bit&nbsp;23 — a node running <strong>v9.26.x</strong>,
              live now) and <strong>Algolock</strong> (bit&nbsp;0 — <strong>v9.26.2+</strong>, which rejects the
              retired Groestl algorithm). Bit&nbsp;23 lies inside the SHA256D ASIC version-rolling window, so
              rolled blocks are called out separately. Click any pool for its per-algorithm breakdown.
            </Typography>
          </CardContent>
        </Card>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : (
          <>
            {/* Overall readiness — two signals side by side */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={6}>
                <Card elevation={3} sx={{ p: 3, borderRadius: '12px', height: '100%' }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5, color: primaryColor }}>
                    DigiDollar — BIP9 signalling (bit&nbsp;23)
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, color: '#555' }}>
                    {ddRawCount} of {totalBlocks} recent blocks carry bit&nbsp;23 — the raw count BIP9
                    consensus uses. {ddCleanCount} are clean (non-rolled) proof of v9.26.x;{' '}
                    {rolledCount} are version-rolled SHA256D blocks where bit&nbsp;23 is a coin flip.
                  </Typography>
                  <ReadinessBar pct={ddRawPct} />
                  <Typography variant="h6" fontWeight="bold" color={ddRawPct >= 70 ? '#2e7d32' : '#e65100'}>
                    {ddRawPct}% of recent blocks signalling (70% needed)
                  </Typography>
                  {ddStats && (
                    <Alert severity={ddStats.possible === false ? 'warning' : 'info'} sx={{ mt: 2 }}>
                      Official window: <strong>{(ddStats.count ?? 0).toLocaleString()}</strong> of{' '}
                      <strong>{(ddStats.elapsed ?? 0).toLocaleString()}</strong> elapsed blocks signalled —
                      lock-in needs <strong>{(ddThreshold ?? 0).toLocaleString()}</strong> of{' '}
                      {(ddStats.period ?? 0).toLocaleString()} ({ddDeployment?.bip9?.status}).
                      {ddStats.possible === false && nextWindowStart ? (
                        <>
                          {' '}Lock-in is <strong>no longer possible in this window</strong> — the count
                          resets at block <strong>{nextWindowStart.toLocaleString()}</strong>{' '}
                          ({fmtEta(nextWindowBlocks)}).
                        </>
                      ) : null}
                    </Alert>
                  )}
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card elevation={3} sx={{ p: 3, borderRadius: '12px', height: '100%' }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5, color: primaryColor }}>
                    Algolock — v9.26.2+ (rejects Groestl)
                  </Typography>
                  {algolockLive ? (
                    <>
                      <Typography variant="body2" sx={{ mb: 2, color: '#555' }}>
                        {alCount} of {totalBlocks} recent blocks signal algolock (bit&nbsp;0)
                        {alOfficialPct != null ? ` · official window ${alOfficialPct}% (${algolockStatus})` : ''}.
                        Bit&nbsp;0 sits outside the ASIC version-rolling window, so it is reliable for
                        every pool — including version-rolling SHA256D pools where bit&nbsp;23 is noise.
                      </Typography>
                      <ReadinessBar pct={alPct} />
                      <Typography variant="h6" fontWeight="bold" color={alPct >= 70 ? '#2e7d32' : '#e65100'}>
                        {alPct}% of recent hashpower on v9.26.2+
                      </Typography>
                    </>
                  ) : (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      Algolock BIP9 signalling has not opened yet (status:{' '}
                      <strong>{algolockStatus || 'defined'}</strong>). Bit&nbsp;0 is not set by any miner
                      until the window starts
                      {nextAlgolockWindow ? (
                        <> at block <strong>{nextAlgolockWindow.toLocaleString()}</strong>{' '}
                          (~{algolockWindowBlocks?.toLocaleString()} blocks, {fmtEta(algolockWindowBlocks)})</>
                      ) : null}
                      . Once it opens, bit&nbsp;0 becomes the definitive "running v9.26.x" indicator:
                      unlike bit&nbsp;23 it sits <strong>outside</strong> the ASIC version-rolling window
                      (BIP320 bits 13–28), so SHA256D pools signal it deterministically.
                    </Alert>
                  )}
                </Card>
              </Grid>
            </Grid>

            {/* Groestl enforcement backstop */}
            <Card elevation={3} sx={{ p: 3, borderRadius: '12px', mb: 4 }}>
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, color: primaryColor }}>
                Groestl Enforcement Backstop
              </Typography>
              {activationHeight ? (
                <Grid container spacing={3}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="#777">Backstop height</Typography>
                    <Typography variant="h6" fontWeight="bold">{activationHeight.toLocaleString()}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="#777">Current height</Typography>
                    <Typography variant="h6" fontWeight="bold">{currentHeight ? currentHeight.toLocaleString() : '—'}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="#777">Blocks remaining</Typography>
                    <Typography variant="h6" fontWeight="bold">{backstopBlocks != null ? backstopBlocks.toLocaleString() : '—'}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="#777">Est. time (15s blocks)</Typography>
                    <Typography variant="h6" fontWeight="bold">{fmtEta(backstopBlocks)}</Typography>
                  </Grid>
                </Grid>
              ) : (
                <Alert severity="info">Algolock enforcement is not scheduled on this network.</Alert>
              )}
              <Typography variant="body2" sx={{ mt: 2, color: '#555' }}>
                At the backstop height, blocks using the retired Groestl algorithm (or any unknown algorithm)
                are rejected unconditionally — regardless of BIP9 signalling. Pools should be on v9.26.2 before
                this height to stay on the canonical chain.
              </Typography>
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
                        <TableCell align="center"><strong>DigiDollar (v9.26.x)</strong></TableCell>
                        <TableCell align="center"><strong>Algolock (v9.26.2+)</strong></TableCell>
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
                            sx={{ cursor: 'pointer', '& > *': { borderBottom: expanded[p.key] ? 'unset' : undefined } }}
                          >
                            <TableCell>
                              <IconButton size="small" aria-label="expand row">
                                {expanded[p.key] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                              </IconButton>
                            </TableCell>
                            <TableCell sx={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              <span title={p.algoList.length ? `${p.name} — ${p.algoList.join(', ')}` : p.name}>{p.name}</span>
                            </TableCell>
                            <TableCell align="center">
                              <span title={`${p.ddRaw}/${p.total} blocks carry bit 23 (${p.ddClean} clean, ${p.rolled} version-rolled) · latest block: ${p.latestAlgo || '—'}`}>
                                {ddChip(p.ddState)}{' '}
                                <Typography component="span" variant="caption" color="#666">{p.ddRaw}/{p.total} ({p.ddPct}%)</Typography>
                              </span>
                            </TableCell>
                            <TableCell align="center">
                              {alChip(p.alState)}{' '}
                              <Typography component="span" variant="caption" color="#666">{p.al}/{p.total} ({p.alPct}%)</Typography>
                            </TableCell>
                            <TableCell align="right">{p.total}</TableCell>
                            <TableCell align="right">{p.latestHeight >= 0 ? p.latestHeight.toLocaleString() : '—'}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ py: 0, borderBottom: expanded[p.key] ? undefined : 'none' }} colSpan={6}>
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
                                        <TableCell align="right"><strong>Bit 23 (raw)</strong></TableCell>
                                        <TableCell align="right"><strong>Bit 23 (clean)</strong></TableCell>
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
                                          <TableCell align="right" sx={{ color: a.ddRaw ? '#2e7d32' : '#999', fontWeight: a.ddRaw ? 'bold' : 'normal' }}>
                                            {a.ddRaw}/{a.n}
                                          </TableCell>
                                          <TableCell align="right" sx={{ color: a.ddClean ? '#2e7d32' : '#999', fontWeight: a.ddClean ? 'bold' : 'normal' }}>
                                            {a.ddClean}/{a.n}
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
                                    "Raw" is what BIP9 consensus counts; "clean" excludes version-rolled SHA256D
                                    blocks, where bit&nbsp;23 is a coin flip and proves nothing about the pool's
                                    node. A pool signalling on some algorithms but not others runs a mixed
                                    backend — upgrade the nodes behind the non-signalling algorithms (especially
                                    Groestl, which is rejected outright at the backstop height).
                                  </Typography>
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      ))}
                      {pools.length === 0 && (
                        <TableRow><TableCell colSpan={6} align="center">No recent blocks available.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Typography variant="caption" sx={{ display: 'block', mt: 2, color: '#888' }}>
                  Counts show the raw bit&nbsp;23 — exactly what BIP9 consensus counts toward activation.
                  Upgrade status is inferred from clean (non-rolled) blocks and bit&nbsp;0: "Partial" means
                  some but not the newest clean block signalled (a multi-node pool mid-rollout — click to see
                  which algos); "Rolling — bit&nbsp;23 n/a" means every block from this pool is version-rolled
                  SHA256D (ASICBoost, {rolledCount} of the last {totalBlocks} blocks network-wide), where
                  bit&nbsp;23 is a coin flip that can neither prove nor disprove an upgrade — bit&nbsp;0
                  resolves these pools once algolock signalling opens. Pools are identified by coinbase tag or
                  payout address.
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
