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
//   * Algolock   (bit 0)  — the node is running v9.26.2 and will reject the retired
//     Groestl algorithm. Only appears once the algolock BIP9 window is `started`.
// SHA256D ASIC miners version-roll bits 13-28 (BIP320 / ASICBoost) — which INCLUDES
// bit 23 — so bit 23 is trusted only when the rest of the version word is clean.
// Bit 0 sits outside the roll mask, so it is always reliable.
const TOP_MASK = 0xe0000000;
const TOP_BITS = 0x20000000;
const STRUCTURAL_MASK = TOP_BITS | 0x00000f00 | 0x000000ff; // top marker + algo nibble + base-version byte
const BIT_ALGOLOCK = 1 << 0;     // 0x00000001
const BIT_DIGIDOLLAR = 1 << 23;  // 0x00800000
const KNOWN_SIGNAL_BITS = BIT_ALGOLOCK | BIT_DIGIDOLLAR;

function classifyVersion(version) {
  const none = { top: false, digidollar: false, algolock: false, rolled: false };
  if (typeof version !== 'number' || !Number.isFinite(version)) return none;
  const top = (version & TOP_MASK) === TOP_BITS;
  if (!top) return none;
  const residual = version & ~STRUCTURAL_MASK;          // signalling bits only (algo/base stripped)
  const rolled = (residual & ~KNOWN_SIGNAL_BITS) !== 0; // any bit beyond bit0/bit23 => version rolling
  return {
    top: true,
    digidollar: (version & BIT_DIGIDOLLAR) !== 0 && !rolled, // trust bit 23 only on a clean version
    algolock: (version & BIT_ALGOLOCK) !== 0,                // bit 0 is outside the roll mask
    rolled,
  };
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
  const { pools, totalBlocks, ddCount, alCount, ddPct, alPct, rolledCount } = useMemo(() => {
    const map = new Map();
    let total = 0, dd = 0, al = 0, rolled = 0;
    for (const b of blocks) {
      total += 1;
      const c = classifyVersion(b.version);
      if (c.digidollar) dd += 1;
      if (c.algolock) al += 1;
      if (c.rolled) rolled += 1;
      const key = poolKey(b);
      if (!map.has(key)) {
        map.set(key, { key, name: key, total: 0, dd: 0, al: 0, latestHeight: -1, latest: null, latestAlgo: '', algos: new Map() });
      }
      const p = map.get(key);
      p.total += 1;
      if (c.digidollar) p.dd += 1;
      if (c.algolock) p.al += 1;
      // per-algorithm breakdown (the drill-down)
      const algo = b.algo || 'unknown';
      if (!p.algos.has(algo)) {
        p.algos.set(algo, { algo, n: 0, dd: 0, al: 0, rolled: 0, sampleVersion: b.version, sampleHeight: b.height || 0 });
      }
      const a = p.algos.get(algo);
      a.n += 1;
      if (c.digidollar) a.dd += 1;
      if (c.algolock) a.al += 1;
      if (c.rolled) a.rolled += 1;
      if ((b.height || 0) > a.sampleHeight) { a.sampleHeight = b.height || 0; a.sampleVersion = b.version; }
      if ((b.height || 0) > p.latestHeight) { p.latestHeight = b.height || 0; p.latest = c; p.latestAlgo = algo; }
    }
    const list = Array.from(map.values()).map((p) => ({
      ...p,
      ddPct: p.total ? Math.round((p.dd / p.total) * 100) : 0,
      alPct: p.total ? Math.round((p.al / p.total) * 100) : 0,
      ddState: p.latest?.digidollar ? 'upgraded' : (p.dd > 0 ? 'partial' : 'none'),
      alState: p.latest?.algolock ? 'ready' : (p.al > 0 ? 'partial' : 'none'),
      algoBreakdown: Array.from(p.algos.values()).sort((x, y) => y.n - x.n),
      algoList: Array.from(p.algos.keys()),
    }));
    list.sort((a, b) => b.total - a.total);
    return {
      pools: list,
      totalBlocks: total,
      ddCount: dd,
      alCount: al,
      rolledCount: rolled,
      ddPct: total ? Math.round((dd / total) * 100) : 0,
      alPct: total ? Math.round((al / total) * 100) : 0,
    };
  }, [blocks]);

  // --- Algolock signalling window (bit 0 only appears once the BIP9 window starts) ---
  const period = ddDeployment?.bip9?.statistics?.period || DEFAULT_PERIOD[networkName] || 40320;
  const algolockStatus = algolockDeployment?.bip9?.status;
  const algolockLive = ['started', 'locked_in', 'active'].includes(algolockStatus);
  const nextAlgolockWindow = (!algolockLive && currentHeight)
    ? (Math.floor(currentHeight / period) + 1) * period : null;
  const algolockWindowBlocks = nextAlgolockWindow ? Math.max(0, nextAlgolockWindow - currentHeight) : null;

  // --- Groestl enforcement backstop (unconditional rejection height) ---
  const backstopBlocks = activationHeight && currentHeight ? Math.max(0, activationHeight - currentHeight) : null;

  // --- Official BIP9 window context ---
  const ddStats = ddDeployment?.bip9?.statistics;
  const ddOfficialPct = ddStats && ddStats.period ? Math.round((ddStats.count / ddStats.period) * 100) : null;
  const alStats = algolockDeployment?.bip9?.statistics;
  const alOfficialPct = alStats && alStats.period ? Math.round((alStats.count / alStats.period) * 100) : null;

  const ddChip = (state) => {
    if (state === 'upgraded') return <Chip icon={<CheckCircleIcon />} label="v9.26.x" sx={{ backgroundColor: '#4caf50', color: 'white', fontWeight: 'bold' }} size="small" />;
    if (state === 'partial') return <Chip label="Partial" sx={{ backgroundColor: '#ff9800', color: 'white', fontWeight: 'bold' }} size="small" />;
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
              live now) and <strong>Algolock</strong> (bit&nbsp;0 — <strong>v9.26.2</strong>, which rejects the
              retired Groestl algorithm). Click any pool to drill into its per-algorithm breakdown.
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
                    DigiDollar — running v9.26.x
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, color: '#555' }}>
                    {ddCount} of {totalBlocks} recent blocks signal DigiDollar (bit&nbsp;23)
                    {ddOfficialPct != null ? ` · official window ${ddOfficialPct}% (${ddDeployment?.bip9?.status})` : ''}
                  </Typography>
                  <ReadinessBar pct={ddPct} />
                  <Typography variant="h6" fontWeight="bold" color={ddPct >= 70 ? '#2e7d32' : '#e65100'}>
                    {ddPct}% of recent hashpower on v9.26.x
                  </Typography>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card elevation={3} sx={{ p: 3, borderRadius: '12px', height: '100%' }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5, color: primaryColor }}>
                    Algolock — v9.26.2 (rejects Groestl)
                  </Typography>
                  {algolockLive ? (
                    <>
                      <Typography variant="body2" sx={{ mb: 2, color: '#555' }}>
                        {alCount} of {totalBlocks} recent blocks signal algolock (bit&nbsp;0)
                        {alOfficialPct != null ? ` · official window ${alOfficialPct}% (${algolockStatus})` : ''}
                      </Typography>
                      <ReadinessBar pct={alPct} />
                      <Typography variant="h6" fontWeight="bold" color={alPct >= 70 ? '#2e7d32' : '#e65100'}>
                        {alPct}% of recent hashpower on v9.26.2
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
                      . Until then, DigiDollar (bit&nbsp;23) is the live "running v9.26.x" signal.
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
                        <TableCell align="center"><strong>Algolock (v9.26.2)</strong></TableCell>
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
                              <span title={`${p.dd}/${p.total} blocks on v9.26.x · latest block: ${p.latestAlgo || '—'}`}>
                                {ddChip(p.ddState)}{' '}
                                <Typography component="span" variant="caption" color="#666">{p.dd}/{p.total} ({p.ddPct}%)</Typography>
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
                                        <TableCell align="right"><strong>DigiDollar (v9.26.x)</strong></TableCell>
                                        <TableCell align="right"><strong>Algolock (v9.26.2)</strong></TableCell>
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
                                          <TableCell align="right" sx={{ color: a.dd ? '#2e7d32' : '#999', fontWeight: a.dd ? 'bold' : 'normal' }}>
                                            {a.dd}/{a.n}
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
                                    "DigiDollar" counts clean bit-23 blocks (version rolling excluded). A pool
                                    showing v9.26.x on some algos but not others is running a mixed backend —
                                    upgrade the nodes mining the non-signalling algorithms (especially Groestl,
                                    which is rejected at the backstop height).
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
                  Status reflects each pool's most recent block; "Partial" means some but not the latest block
                  signalled (typical of a multi-node / multi-algo pool mid-rollout — click to see which algos).
                  DigiDollar (bit&nbsp;23) is only counted on a clean version — {rolledCount} of the last{' '}
                  {totalBlocks} blocks are version-rolled (SHA256D ASICBoost) and excluded to avoid false
                  positives. Pools are identified by coinbase tag or payout address.
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
