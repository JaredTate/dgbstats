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
// BOTH BIP9 deployments (DigiDollar bit 23 and Algolock bit 0) are ACTIVE,
// so version-bit signalling has ended network-wide — version bits prove
// nothing any more. The chain offers exactly one provable positive, per the
// mining integration guide:
//   1. PUBLISHING — the pool's blocks carry a DigiDollar Bundle (the v0x03
//      OP_RETURN OP_ORACLE coinbase output with the MuSig2-signed DGB/USD
//      price). Definitive proof the pool runs an upgraded node, requests the
//      `digidollar-oracle` GBT rule, and preserves
//      `default_oracle_commitment` in its coinbase. Only these blocks can
//      confirm DD mint/redeem transactions.
//   2. NO BUNDLES — nothing provable: the pool either needs the v9.26
//      upgrade or the GBT change; confirm which directly.

function poolKey(block) {
  const id = (block.poolIdentifier || '').trim();
  if (id && id.toLowerCase() !== 'unknown') return id;
  return block.minerAddress || block.minedTo || 'Unknown';
}

const GREEN = '#2e7d32';
const GREEN_BG = '#e8f5e9';

const PoolUpgradeTrackerPage = () => {
  const network = useNetwork();
  const { wsBaseUrl, theme: networkTheme, apiPrefix } = network;
  const primaryColor = networkTheme.primary;
  const secondaryColor = networkTheme.secondary;

  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({}); // pool key -> bool

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
          setLoading(false);
        }
      } catch (err) {
        console.error('PoolUpgradeTracker WS parse error:', err);
      }
    };
    socket.onerror = () => setLoading(false);
    return () => socket.close();
  }, [wsBaseUrl]);

  // Keep the REST poll for chain context (harmless, may be used later).
  const fetchOfficial = useCallback(async () => {
    try {
      const base = `${config.apiBaseUrl}/api${apiPrefix || ''}`;
      await fetch(`${base}/getblockchaininfo`);
    } catch (err) {
      // context only — the block feed drives everything on this page
    }
  }, [apiPrefix]);

  useEffect(() => {
    fetchOfficial();
    const id = setInterval(fetchOfficial, 30000);
    return () => clearInterval(id);
  }, [fetchOfficial]);

  // Aggregate DigiDollar Bundle production per pool.
  const {
    pools, totalBlocks, bundleCount, bundlePct,
    publishingPools, noBundlePools,
  } = useMemo(() => {
    const map = new Map();
    let total = 0, bundles = 0;
    for (const b of blocks) {
      total += 1;
      const hasBundle = !!b.hasOracleBundle;
      if (hasBundle) bundles += 1;
      const key = poolKey(b);
      if (!map.has(key)) {
        map.set(key, {
          key, name: key, total: 0, bundles: 0,
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
      // per-algorithm breakdown (the drill-down)
      const algo = b.algo || 'unknown';
      if (!p.algos.has(algo)) {
        p.algos.set(algo, { algo, n: 0, bundles: 0 });
      }
      const a = p.algos.get(algo);
      a.n += 1;
      if (hasBundle) a.bundles += 1;
      if ((b.height || 0) > p.latestHeight) p.latestHeight = b.height || 0;
    }
    const list = Array.from(map.values()).map((p) => ({
      ...p,
      status: p.bundles > 0 ? 'publishing' : 'none',
      bundlePct: p.total ? Math.round((p.bundles / p.total) * 100) : 0,
      algoBreakdown: Array.from(p.algos.values()).sort((x, y) => y.n - x.n),
      algoList: Array.from(p.algos.keys()),
    }));
    // Publishing pools first; big pools first within each bucket.
    list.sort((a, b) => (a.status === b.status ? b.total - a.total : (a.status === 'publishing' ? -1 : 1)));
    return {
      pools: list,
      totalBlocks: total,
      bundleCount: bundles,
      bundlePct: total ? Math.round((bundles / total) * 100) : 0,
      publishingPools: list.filter((p) => p.status === 'publishing').length,
      noBundlePools: list.filter((p) => p.status === 'none').length,
    };
  }, [blocks]);

  const statusChip = (status) => {
    if (status === 'publishing') {
      return (
        <Chip icon={<CheckCircleIcon />} label="Publishing DigiDollar Bundles" size="small"
          sx={{ backgroundColor: GREEN_BG, color: GREEN, fontWeight: 'bold', border: `1px solid ${GREEN}55`, '& .MuiChip-icon': { color: GREEN } }} />
      );
    }
    // Signalling has ended — the chain can only prove "no bundles".
    return (
      <Chip label="No bundles" size="small"
        sx={{ backgroundColor: '#ffebee', color: '#c62828', fontWeight: 'bold' }} />
    );
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
            <Typography variant="subtitle1" sx={{ maxWidth: 820, mx: 'auto' }}>
              <strong>DigiDollar is ACTIVE</strong> — this page tracks the last{' '}
              <strong>{totalBlocks || 240}</strong> blocks for the thing that matters now:{' '}
              which pools attach <strong style={{ color: GREEN }}>DigiDollar Bundles</strong>{' '}
              (signed DGB/USD price data) to their blocks, proving they can mine DigiDollar
              mint/redeem transactions.
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
            {/* Bucket KPIs — signalling has ended, so there are exactly two
                provable states: publishing bundles, or not. */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6}>
                <Card elevation={3} sx={{ p: 3, borderRadius: '12px', textAlign: 'center', borderTop: `4px solid ${GREEN}`, backgroundColor: publishingPools > 0 ? 'rgba(46, 125, 50, 0.04)' : undefined, height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <CheckCircleIcon sx={{ color: GREEN, fontSize: '2rem' }} />
                    <Typography variant="h3" fontWeight="800" sx={{ color: GREEN }}>{publishingPools}</Typography>
                  </Box>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ color: GREEN }}>Publishing DigiDollar Bundles</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Blocks carry signed price data — fully DigiDollar-ready
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card elevation={3} sx={{ p: 3, borderRadius: '12px', textAlign: 'center', borderTop: '4px solid #c62828', height: '100%' }}>
                  <Typography variant="h3" fontWeight="800" sx={{ color: '#c62828' }}>{noBundlePools}</Typography>
                  <Typography variant="subtitle1" fontWeight="bold">No bundles</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Nothing provable on-chain — reach out to confirm their v9.26 upgrade and GBT config
                  </Typography>
                </Card>
              </Grid>
            </Grid>

            {/* Coverage */}
            <Card elevation={3} sx={{ p: 3, borderRadius: '12px', mb: 4 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5, color: primaryColor }}>
                DigiDollar Bundle coverage
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, color: '#555' }}>
                {bundleCount} of {totalBlocks} recent blocks carry a DigiDollar Bundle. Only these
                blocks can confirm DigiDollar mint/redeem transactions.
              </Typography>
              <Box sx={{ position: 'relative', mb: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(bundlePct, 100)}
                  sx={{
                    height: 24, borderRadius: '12px', backgroundColor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': { backgroundColor: GREEN, borderRadius: '12px' },
                  }}
                />
              </Box>
              <Typography variant="h6" fontWeight="bold" sx={{ color: GREEN }}>
                {bundlePct}% bundle coverage
              </Typography>
              <Alert severity="info" sx={{ mt: 2 }}>
                Even a fully integrated pool mines bundle-less blocks when no fresh signed price is
                ready — coverage measures readiness, and 100% is not expected. A pool with{' '}
                <strong>zero</strong> bundles across many blocks is the signal to act on: its stack must
                request the <code>digidollar-oracle</code> GBT rule and preserve{' '}
                <code>default_oracle_commitment</code> as a zero-value coinbase output.
              </Alert>
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
                        <TableCell align="center"><strong>DigiDollar Bundles</strong></TableCell>
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
                              backgroundColor: p.status === 'publishing' ? 'rgba(46, 125, 50, 0.07)' : undefined,
                              borderLeft: p.status === 'publishing' ? `4px solid ${GREEN}` : '4px solid transparent',
                              '& > *': { borderBottom: expanded[p.key] ? 'unset' : undefined },
                            }}
                          >
                            <TableCell>
                              <IconButton size="small" aria-label="expand row">
                                {expanded[p.key] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                              </IconButton>
                            </TableCell>
                            <TableCell sx={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              <span title={p.algoList.length ? `${p.name} — ${p.algoList.join(', ')}` : p.name}
                                style={p.status === 'publishing' ? { fontWeight: 700 } : undefined}>
                                {p.name}
                              </span>
                            </TableCell>
                            <TableCell align="center">{statusChip(p.status)}</TableCell>
                            <TableCell align="center">
                              <span title={p.bundles > 0
                                ? `Latest bundle at block ${p.lastBundleHeight.toLocaleString()}${p.lastSigners != null ? ` · ${p.lastSigners} signers` : ''}${p.lastPriceUsd != null ? ` · $${p.lastPriceUsd.toFixed(6)}` : ''}`
                                : 'No DigiDollar Bundles in the window'}>
                                <Typography component="span" variant="body2" fontWeight={p.bundles > 0 ? 'bold' : 'normal'}
                                  sx={{ color: p.bundles > 0 ? GREEN : '#999' }}>
                                  {p.bundles}/{p.total} ({p.bundlePct}%)
                                </Typography>
                              </span>
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
                                        <TableCell align="right"><strong>DigiDollar Bundles</strong></TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {p.algoBreakdown.map((a) => (
                                        <TableRow key={a.algo}>
                                          <TableCell>{a.algo}</TableCell>
                                          <TableCell align="right">{a.n}</TableCell>
                                          <TableCell align="right" sx={{ color: a.bundles ? GREEN : '#999', fontWeight: a.bundles ? 'bold' : 'normal' }}>
                                            {a.bundles}/{a.n}
                                          </TableCell>
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
                        <TableRow><TableCell colSpan={6} align="center">No recent blocks available.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Typography variant="caption" sx={{ display: 'block', mt: 2, color: '#888' }}>
                  <strong style={{ color: GREEN }}>Publishing DigiDollar Bundles</strong> is definitive
                  proof of full DigiDollar integration.
                  <strong> No bundles</strong> means nothing provable in the window — BIP9 signalling
                  has ended network-wide, so this includes both non-upgraded pools and upgraded pools
                  that aren&apos;t publishing. Either way the fix is the same conversation: v9.26, the{' '}
                  <code>digidollar-oracle</code> rule in getblocktemplate, and{' '}
                  <code>default_oracle_commitment</code> preserved as a zero-value coinbase output.
                  Pools are identified by coinbase tag or payout address.
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
