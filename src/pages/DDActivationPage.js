import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Container, Typography, Box, Paper, LinearProgress, Card, CardContent,
  Divider, Grid, Chip, Alert, CircularProgress
} from '@mui/material';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import LockIcon from '@mui/icons-material/Lock';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useNetwork } from '../context/NetworkContext';
import IntegrationGuides from '../components/IntegrationGuides';
import ActivationCelebration from '../components/ActivationCelebration';
import config from '../config';
import {
  lockInActivationHeight,
  blocksRemaining,
  splitDuration,
  formatEta as fmtEta,
} from '../utils/activation';

/**
 * Color mapping for BIP9 activation states
 */
const STATE_COLORS = {
  active: '#4caf50',
  locked_in: '#2196f3',
  started: '#ff9800',
  defined: '#757575',
  failed: '#f44336'
};

/**
 * Icon mapping for BIP9 activation states
 */
const STATE_ICONS = {
  defined: <HourglassTopIcon />,
  started: <PlayArrowIcon />,
  locked_in: <LockIcon />,
  active: <CheckCircleIcon />,
  failed: <ErrorOutlineIcon />
};

// DigiByte targets one block every 15 seconds across all five algorithms.
const BLOCK_SPACING_SECONDS = 15;

/**
 * Live countdown to the LOCKED_IN -> ACTIVE transition. Seeds from the block gap
 * (blocksLeft * ~15s) and ticks down once per second, re-syncing whenever a new
 * block shrinks the gap. The block count is authoritative; the clock is only a
 * smooth visual estimate between blocks.
 */
function ActivationCountdown({
  activationHeight,
  currentHeight,
  blocksLeft,
  windowStartBlock,
  periodBlocks,
  primaryColor,
  secondaryColor,
  activated = false,
}) {
  // Once ACTIVE the countdown pins to zero permanently.
  const effectiveBlocksLeft = activated ? 0 : blocksLeft;
  const [secondsLeft, setSecondsLeft] = useState(() => (effectiveBlocksLeft || 0) * BLOCK_SPACING_SECONDS);

  // Re-seed the clock whenever the block gap changes (new block mined).
  useEffect(() => {
    setSecondsLeft((effectiveBlocksLeft || 0) * BLOCK_SPACING_SECONDS);
  }, [effectiveBlocksLeft]);

  // Tick down between blocks.
  useEffect(() => {
    if (!effectiveBlocksLeft) return undefined;
    const id = setInterval(() => {
      setSecondsLeft((s) => (s > 1 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [effectiveBlocksLeft]);

  const { days, hours, minutes, seconds } = splitDuration(secondsLeft);
  const tiles = [
    { value: days, label: 'Days' },
    { value: hours, label: 'Hours' },
    { value: minutes, label: 'Minutes' },
    { value: seconds, label: 'Seconds' },
  ];

  const windowProgress = activated
    ? 100
    : (periodBlocks > 0 && windowStartBlock != null && currentHeight > 0
      ? Math.min(100, Math.max(0, ((currentHeight - windowStartBlock) / periodBlocks) * 100))
      : 0);

  return (
    <Card elevation={4} sx={{ mb: 4, borderRadius: '12px', overflow: 'hidden' }}>
      <Box
        sx={{
          backgroundImage: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
          color: '#fff',
          px: { xs: 2, sm: 4 },
          py: { xs: 3, sm: 4 },
          textAlign: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
          {activated ? <CheckCircleIcon sx={{ fontSize: '1.4rem' }} /> : <LockIcon sx={{ fontSize: '1.4rem' }} />}
          <Typography variant="overline" sx={{ letterSpacing: '2px', fontWeight: 700, fontSize: '0.85rem' }}>
            {activated ? 'Countdown Complete — DigiDollar Is Live' : 'Locked In — Activates In'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 1, sm: 2 } }}>
          {tiles.map((tile) => (
            <Box
              key={tile.label}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.14)',
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: '12px',
                px: { xs: 1.25, sm: 2.5 },
                py: { xs: 1.25, sm: 2 },
                minWidth: { xs: 62, sm: 92 },
              }}
            >
              <Typography
                sx={{
                  fontWeight: 800,
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1,
                  fontSize: { xs: '1.9rem', sm: '3rem' },
                }}
              >
                {String(tile.value).padStart(2, '0')}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.85, letterSpacing: '1px', textTransform: 'uppercase' }}>
                {tile.label}
              </Typography>
            </Box>
          ))}
        </Box>

        <Typography variant="body2" sx={{ mt: 2.5, opacity: 0.95 }}>
          {activated ? (
            <>
              🎉 Activated at block{' '}
              <strong>{activationHeight != null ? activationHeight.toLocaleString() : '…'}</strong> 🎉
            </>
          ) : (
            <>
              Activates at block{' '}
              <strong>{activationHeight != null ? activationHeight.toLocaleString() : '…'}</strong>
              {blocksLeft != null && (
                <> &nbsp;·&nbsp; {blocksLeft.toLocaleString()} blocks to go &nbsp;·&nbsp; ~15s per block</>
              )}
            </>
          )}
        </Typography>
      </Box>

      <Box sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
          <Typography variant="caption" color="text.secondary">Progress through the final window</Typography>
          <Typography variant="caption" color="text.secondary">{Math.round(windowProgress)}%</Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={windowProgress}
          sx={{ height: 8, borderRadius: 4, '& .MuiLinearProgress-bar': { backgroundColor: activated ? STATE_COLORS.active : STATE_COLORS.locked_in } }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.25, textAlign: 'center' }}>
          {activated
            ? 'DigiDollar is live — minting, sending, and redeeming are fully functional.'
            : 'Activation is guaranteed. It happens automatically at the next BIP9 retarget boundary — the estimate assumes DigiByte’s 15-second block target.'}
        </Typography>
      </Box>
    </Card>
  );
}

/**
 * DDActivationPage - DigiDollar BIP9 Activation Status Tracker
 *
 * Tracks the BIP9 soft fork activation lifecycle for DigiDollar through
 * BIP9 states: DEFINED -> STARTED -> LOCKED_IN -> ACTIVE, plus FAILED.
 * Receives real-time data via WebSocket from getdigidollardeploymentinfo RPC.
 */
const DDActivationPage = () => {
  const network = useNetwork();
  const { wsBaseUrl, theme: networkTheme, digiDollarLabel, displayName, apiPrefix } = network;
  const params = network.activation;
  const primaryColor = networkTheme.primary;
  const secondaryColor = networkTheme.secondary;

  const [deploymentInfo, setDeploymentInfo] = useState(() => ({
    enabled: false,
    status: 'defined',
    bit: params.bit,
    start_time: 0,
    timeout: 0,
    min_activation_height: params.minActivationHeight,
    signaling_blocks: 0,
    threshold: params.threshold,
    period_blocks: params.activationWindow,
    progress_percent: 0
  }));

  const [currentHeight, setCurrentHeight] = useState(0);
  // Recent blocks (WS recentBlocks + newBlock) for oracle-bundle adoption
  const [observedBlocks, setObservedBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  // Authoritative BIP9 deployment object from the node's getdeploymentinfo RPC
  // (statistics: period/threshold/elapsed/count/possible). The WebSocket
  // ddDeploymentData message remains the fallback for older servers.
  const [officialDD, setOfficialDD] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let receivedDeploymentData = false;
    let fallbackTimer;

    const finishLoading = () => {
      if (isMounted) {
        setLoading(false);
      }
    };

    const socket = new WebSocket(wsBaseUrl);

    socket.onopen = () => {
      console.log('WebSocket connected for DD Activation page');
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === 'ddDeploymentData') {
          receivedDeploymentData = true;
          clearTimeout(fallbackTimer);
          setDeploymentInfo(message.data);
          finishLoading();
        }

        if (message.type === 'initialData') {
          if (message.data.blockchainInfo) {
            setCurrentHeight(message.data.blockchainInfo.blocks);
          }
        }

        if (message.type === 'recentBlocks' && Array.isArray(message.data)) {
          // Full block objects feed the Oracle Bundle Adoption section
          setObservedBlocks(message.data.filter((b) => b && b.hash));
        }

        if (message.type === 'newBlock') {
          setCurrentHeight(prev => Math.max(prev, message.data.height || prev + 1));
          const block = message.data;
          if (block && block.hash) {
            setObservedBlocks(prev => (
              prev.some(b => b.hash === block.hash) ? prev : [block, ...prev].slice(0, 240)
            ));
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    socket.onerror = () => {
      finishLoading();
    };

    socket.onclose = () => {
      if (!receivedDeploymentData) {
        finishLoading();
      }
    };

    fallbackTimer = setTimeout(() => {
      if (!receivedDeploymentData) {
        finishLoading();
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
      socket.close();
    };
  }, [wsBaseUrl]);

  const fetchOfficial = useCallback(async () => {
    try {
      const base = `${config.apiBaseUrl}/api${apiPrefix || ''}`;
      const res = await fetch(`${base}/getdeploymentinfo`);
      if (res.ok) {
        const dep = await res.json();
        setOfficialDD(dep?.deployments?.digidollar || null);
        if (dep?.height) setCurrentHeight((prev) => Math.max(prev, dep.height));
        setLoading(false);
      }
    } catch (err) {
      console.error('DDActivation getdeploymentinfo error:', err);
    }
  }, [apiPrefix]);

  useEffect(() => {
    fetchOfficial();
    const id = setInterval(fetchOfficial, 30000);
    return () => clearInterval(id);
  }, [fetchOfficial]);

  // Prefer the official deployment object; fall back to the WS message shape.
  const ddStats = officialDD?.bip9?.statistics;
  const status = (officialDD ? (officialDD.active ? 'active' : officialDD.bip9?.status) : null)
    || deploymentInfo.status || 'defined';
  const isActive = status === 'active' || deploymentInfo.enabled || !!officialDD?.active;
  const signalingBlocks = ddStats?.count ?? deploymentInfo.signaling_blocks ?? 0;
  const periodBlocks = ddStats?.period || deploymentInfo.period_blocks || params.activationWindow;
  const thresholdBlocks = ddStats?.threshold || params.thresholdBlocks;
  const elapsedBlocks = ddStats?.elapsed ?? null;
  const lockInPossible = ddStats?.possible;
  const progress = periodBlocks > 0 ? (signalingBlocks / periodBlocks) * 100 : 0;

  const blocksIntoWindow = currentHeight > 0 ? currentHeight % periodBlocks : 0;
  const currentWindow = currentHeight > 0 ? Math.floor(currentHeight / periodBlocks) : 0;
  const windowStartBlock = currentWindow * periodBlocks;
  const windowEndBlock = windowStartBlock + periodBlocks - 1;
  const nextWindowStart = currentHeight > 0 ? windowEndBlock + 1 : null;
  const nextWindowBlocks = nextWindowStart ? Math.max(0, nextWindowStart - currentHeight) : null;

  // LOCKED_IN activation target. Per versionbits.cpp, a locked-in deployment
  // activates at the first retarget boundary after lock-in (since + period),
  // never before min_activation_height — NOT at min_activation_height itself
  // (which on mainnet was passed long ago). See utils/activation.js.
  const minActivationHeight = officialDD?.bip9?.min_activation_height
    ?? deploymentInfo.min_activation_height
    ?? params.minActivationHeight;
  const activationHeight = status === 'locked_in'
    ? lockInActivationHeight({
        currentHeight,
        period: periodBlocks,
        minActivationHeight,
        since: officialDD?.bip9?.since,
      })
    : null;
  const activationBlocksLeft = activationHeight != null && currentHeight > 0
    ? blocksRemaining(activationHeight, currentHeight)
    : null;

  // Height at which the deployment actually went ACTIVE (bip9.since reports
  // the height the current state began; WS activation_height is the fallback).
  const activatedAtHeight = officialDD?.bip9?.since
    ?? deploymentInfo.activation_height
    ?? null;

  // ---- Activation celebration (confetti / fireworks / balloons / rocket) --
  // DigiDollar is ACTIVE: the show fires for EVERY visitor, once per page
  // load, whenever the deployment reports active (or a LOCKED_IN countdown
  // sits at zero). `?celebrate=1` forces it regardless of chain state.
  const [celebrate, setCelebrate] = useState(false);
  const celebratedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const q = new URLSearchParams(window.location.search);
    if ((q.has('celebrate') || q.has('confetti')) && !celebratedRef.current) {
      celebratedRef.current = true;
      setCelebrate(true);
    }
  }, []);

  useEffect(() => {
    const reachedActive = status === 'active';
    const countdownHitZero = status === 'locked_in' && activationBlocksLeft === 0;
    if (!celebratedRef.current && (reachedActive || countdownHitZero)) {
      celebratedRef.current = true;
      setCelebrate(true);
    }
  }, [status, activationBlocksLeft]);

  // ---- DigiDollar Bundle adoption (who is actually mining DD blocks) ------
  // Both BIP9 deployments are ACTIVE, so version-bit signalling has ended —
  // version bits prove nothing any more. Two provable states per pool:
  //   publishing — mined ≥1 block carrying a DigiDollar Bundle (fully
  //                upgraded node + live oracle session; nothing to do)
  //   none       — no bundles in the window → reach out to confirm the
  //                upgrade + digidollar-oracle GBT configuration
  const oracleAdoption = useMemo(() => {
    if (!observedBlocks.length) return null;
    const total = observedBlocks.length;
    const bundleBlocks = observedBlocks.filter(b => b.hasOracleBundle);
    const byPool = new Map();
    observedBlocks.forEach((b) => {
      const id = (b.poolIdentifier || '').trim();
      const key = id && id.toLowerCase() !== 'unknown' ? id : (b.minerAddress || b.minedTo || 'Unknown');
      if (!byPool.has(key)) {
        byPool.set(key, { pool: key, blocks: 0, bundles: 0, lastSigners: null });
      }
      const p = byPool.get(key);
      p.blocks += 1;
      if (b.hasOracleBundle) {
        p.bundles += 1;
        if (b.oracleSignerCount != null && p.lastSigners == null) p.lastSigners = b.oracleSignerCount;
      }
    });
    const pools = Array.from(byPool.values())
      .map(p => ({ ...p, status: p.bundles > 0 ? 'publishing' : 'none' }))
      .sort((a, b) => b.bundles - a.bundles || b.blocks - a.blocks);
    const latestBundle = bundleBlocks.reduce((max, b) => (!max || b.height > max.height ? b : max), null);
    return {
      total,
      bundleCount: bundleBlocks.length,
      pct: (bundleBlocks.length / total) * 100,
      pools,
      publishingCount: pools.filter(p => p.status === 'publishing').length,
      latestBundle,
    };
  }, [observedBlocks]);

  const stages = [
    { key: 'defined', label: 'DEFINED', blocks: params.stages.defined, description: 'Code exists but is dormant' },
    { key: 'started', label: 'STARTED', blocks: params.stages.started, description: `Miners signal support (bit ${params.bit})` },
    { key: 'locked_in', label: 'LOCKED_IN', blocks: params.stages.locked_in, description: 'Activation guaranteed' },
    { key: 'active', label: 'ACTIVE', blocks: params.stages.active, description: 'DigiDollar is live!' },
    { key: 'failed', label: 'FAILED', blocks: params.stages.failed, description: 'Timeout reached without threshold' }
  ];

  const stateOrder = ['defined', 'started', 'locked_in', 'active', 'failed'];
  const currentStateIndex = stateOrder.indexOf(status);

  // Hero Section
  const HeroSection = () => (
    <Card
      elevation={2}
      sx={{
        borderRadius: '12px',
        mb: 4,
        overflow: 'hidden',
        backgroundImage: `linear-gradient(135deg, ${primaryColor}12 0%, ${secondaryColor}24 100%)`,
        border: `1px solid ${primaryColor}26`
      }}
    >
      <CardContent sx={{ py: 4, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
          <RocketLaunchIcon sx={{ fontSize: '3rem', color: primaryColor, mr: 2 }} />
          <Typography
            variant="h2"
            component="h1"
            fontWeight="800"
            sx={{
              color: primaryColor,
              letterSpacing: '0.5px',
              fontSize: { xs: '1.8rem', sm: '2.3rem', md: '2.8rem' }
            }}
          >
            DigiDollar {digiDollarLabel} Activation
          </Typography>
        </Box>

        <Typography
          variant="h5"
          sx={{ color: secondaryColor, mb: 2, fontWeight: 600 }}
        >
          BIP9 Soft Fork Activation Tracker
        </Typography>

        <Divider sx={{ maxWidth: '150px', mx: 'auto', mb: 2, borderColor: secondaryColor, borderWidth: 2 }} />

        <Typography variant="body1" sx={{ maxWidth: '800px', mx: 'auto', color: '#555' }}>
          Track the activation progress of DigiDollar through the BIP9 miner signaling process.
          {' '}{params.description}
        </Typography>
      </CardContent>
    </Card>
  );

  // Status Cards Row
  const StatusCards = () => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {/* Is DigiDollar Active? */}
      <Grid item xs={12} md={4}>
        <Card
          elevation={3}
          sx={{
            height: '100%',
            borderRadius: '12px',
            borderTop: `4px solid ${isActive ? '#4caf50' : '#ff9800'}`
          }}
        >
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" sx={{ color: primaryColor, mb: 2 }}>
              Is DigiDollar Active?
            </Typography>
            <Typography
              variant="h2"
              sx={{ color: isActive ? '#4caf50' : '#ff0000', fontWeight: 'bold' }}
            >
              {isActive ? 'YES' : 'NO'}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Current Stage */}
      <Grid item xs={12} md={4}>
        <Card
          elevation={3}
          sx={{
            height: '100%',
            borderRadius: '12px',
            borderTop: `4px solid ${STATE_COLORS[status] || '#757575'}`
          }}
        >
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" sx={{ color: primaryColor, mb: 2 }}>
              Current Stage
            </Typography>
            <Chip
              icon={STATE_ICONS[status]}
              label={status.toUpperCase().replace('_', ' ')}
              sx={{
                fontSize: '1.2rem',
                py: 3,
                px: 2,
                backgroundColor: STATE_COLORS[status] || '#757575',
                color: 'white',
                fontWeight: 'bold',
                '& .MuiChip-icon': { color: 'white' }
              }}
            />
          </CardContent>
        </Card>
      </Grid>

      {/* Block Progress */}
      <Grid item xs={12} md={4}>
        <Card
          elevation={3}
          sx={{
            height: '100%',
            borderRadius: '12px',
            borderTop: `4px solid ${secondaryColor}`
          }}
        >
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" sx={{ color: primaryColor, mb: 2 }}>
              Current Block
            </Typography>
            <Typography
              variant="h3"
              sx={{ color: primaryColor, fontWeight: 'bold' }}
            >
              {currentHeight > 0 ? currentHeight.toLocaleString() : '...'}
            </Typography>
            {currentHeight > 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Window: {windowStartBlock}–{windowEndBlock} ({blocksIntoWindow}/{params.activationWindow})
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // BIP9 state flow visualization
  const StageFlow = () => (
    <Card elevation={3} sx={{ p: 3, mb: 4, borderRadius: '12px' }}>
      <Typography
        variant="h5"
        fontWeight="bold"
        sx={{ mb: 3, textAlign: 'center', color: primaryColor }}
      >
        Activation Progress
      </Typography>

      <Grid container spacing={2}>
        {stages.map((stage) => {
          const isCurrentStage = stage.key === status;
          const isPastStage = stateOrder.indexOf(stage.key) < currentStateIndex;
          const stageColor = STATE_COLORS[stage.key];

          return (
            <Grid item xs={12} sm={6} md={2.4} key={stage.key}>
              <Paper
                elevation={isCurrentStage ? 4 : 1}
                sx={{
                  p: 2,
                  textAlign: 'center',
                  height: '100%',
                  borderRadius: '12px',
                  border: isCurrentStage ? `3px solid ${stageColor}` : '1px solid #e0e0e0',
                  backgroundColor: isCurrentStage ? `${stageColor}15` : isPastStage ? '#f5f5f5' : 'white',
                  opacity: isPastStage && !isCurrentStage ? 0.7 : 1,
                  transition: 'all 0.3s ease'
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    mx: 'auto',
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isCurrentStage || isPastStage ? stageColor : '#e0e0e0',
                    color: 'white'
                  }}
                >
                  {isPastStage ? <CheckCircleIcon /> : STATE_ICONS[stage.key]}
                </Box>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{ color: isCurrentStage ? stageColor : '#333' }}
                >
                  {stage.label}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', color: '#666', mb: 1 }}>
                  {/^\d/.test(String(stage.blocks)) ? `Blocks ${stage.blocks}` : stage.blocks}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stage.description}
                </Typography>
                {isCurrentStage && (
                  <Chip
                    label="← Current"
                    size="small"
                    sx={{ mt: 1, backgroundColor: stageColor, color: 'white' }}
                  />
                )}
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* Progress bar for STARTED state */}
      {status === 'started' && (
        <Box sx={{ mt: 4, px: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body1" fontWeight="bold">
              Signaling Progress
            </Typography>
            <Typography
              variant="body1"
              fontWeight="bold"
              sx={{ color: progress >= params.activationThreshold ? '#4caf50' : '#ff9800' }}
            >
              {progress.toFixed(1)}%
            </Typography>
          </Box>
          <Box sx={{ position: 'relative' }}>
            <LinearProgress
              variant="determinate"
              value={Math.min(progress, 100)}
              sx={{
                height: 24,
                borderRadius: '12px',
                backgroundColor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: progress >= params.activationThreshold ? '#4caf50' : '#ff9800',
                  borderRadius: '12px'
                }
              }}
            />
            {/* Threshold marker */}
            <Box
              sx={{
                position: 'absolute',
                left: `${params.activationThreshold}%`,
                top: -4,
                bottom: -4,
                width: '2px',
                backgroundColor: '#f44336',
                zIndex: 1
              }}
            />
            <Typography
              variant="caption"
              sx={{
                position: 'absolute',
                left: `${params.activationThreshold}%`,
                top: -20,
                transform: 'translateX(-50%)',
                color: '#f44336',
                fontWeight: 'bold'
              }}
            >
              {params.activationThreshold}%
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {signalingBlocks.toLocaleString()} / {periodBlocks.toLocaleString()} blocks signaling
              {elapsedBlocks != null ? ` (${elapsedBlocks.toLocaleString()} elapsed in window)` : ''}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Need {thresholdBlocks.toLocaleString()} for lock-in
            </Typography>
          </Box>
        </Box>
      )}

      {/* Lock-in mathematically out of reach for the current window */}
      {status === 'started' && lockInPossible === false && nextWindowStart && (
        <Alert severity="warning" sx={{ mt: 3 }}>
          <Typography variant="body1">
            <strong>Lock-in is no longer possible in this window.</strong>{' '}
            {signalingBlocks.toLocaleString()} of {(elapsedBlocks ?? 0).toLocaleString()} elapsed blocks
            have signalled — even if every remaining block signals, the{' '}
            {thresholdBlocks.toLocaleString()}-block threshold is out of reach. The count resets at
            block <strong>{nextWindowStart.toLocaleString()}</strong>{' '}
            ({nextWindowBlocks?.toLocaleString()} blocks, {fmtEta(nextWindowBlocks)}).
          </Typography>
        </Alert>
      )}

      {/* Locked in message */}
      {status === 'locked_in' && (
        <Alert severity="info" sx={{ mt: 3 }} icon={<LockIcon />}>
          <Typography variant="body1">
            <strong>DigiDollar activation is locked in!</strong> It will activate at block {activationHeight != null ? activationHeight.toLocaleString() : '…'}
            {activationBlocksLeft != null && ` (${activationBlocksLeft.toLocaleString()} blocks remaining, ${fmtEta(activationBlocksLeft)}).`}
            {activationHeight != null && activationHeight !== minActivationHeight && (
              <> Block {minActivationHeight.toLocaleString()} is only the earliest permitted height; activation lands on the next BIP9 retarget boundary.</>
            )}
          </Typography>
        </Alert>
      )}

      {/* Active message */}
      {status === 'active' && (
        <Alert severity="success" sx={{ mt: 3 }} icon={<CheckCircleIcon />}>
          <Typography variant="body1">
            <strong>DigiDollar is active!</strong> Minting, sending, and redeeming are fully functional.
            {deploymentInfo.activation_height && ` Activated at block ${deploymentInfo.activation_height.toLocaleString()}.`}
          </Typography>
        </Alert>
      )}
    </Card>
  );

  // DigiDollar Bundle Adoption — which pools are mining DigiDollar blocks
  // with signed price bundles attached, and which still need outreach.
  const OracleAdoptionSection = () => {
    if (!oracleAdoption) return null;
    const STATUS_CHIP = {
      publishing: { label: 'Publishing', sx: { backgroundColor: '#e8f5e9', color: '#2e7d32', fontWeight: 'bold', border: '1px solid rgba(46, 125, 50, 0.35)', '& .MuiChip-icon': { color: '#2e7d32' } }, icon: <CheckCircleIcon sx={{ fontSize: '1rem' }} /> },
      none: { label: 'No bundles', sx: { backgroundColor: '#ffebee', color: '#c62828', fontWeight: 'medium' } },
    };
    return (
      <Card elevation={3} sx={{ p: 3, mb: 4, borderRadius: '12px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ color: primaryColor }}>
            DigiDollar Bundle Adoption
          </Typography>
          <Chip
            icon={<CheckCircleIcon sx={{ fontSize: '1rem' }} />}
            label={`${oracleAdoption.publishingCount} pool${oracleAdoption.publishingCount === 1 ? '' : 's'} publishing`}
            size="small"
            sx={{ backgroundColor: '#e8f5e9', color: '#2e7d32', fontWeight: 'bold', '& .MuiChip-icon': { color: '#2e7d32' } }}
          />
        </Box>
        <Typography variant="body2" sx={{ mb: 2, color: '#555' }}>
          A block carrying a <strong>DigiDollar Bundle</strong> (the OP_RETURN OP_ORACLE coinbase
          output with the MuSig2-signed DGB/USD price) is definitive proof its pool runs a fully
          upgraded node with a live oracle session. Pools below without bundles are the outreach
          list — they either need the v9.26.x upgrade or an oracle-enabled configuration.
        </Typography>

        <Grid container spacing={3} sx={{ mb: 2 }}>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="#777">Bundle coverage</Typography>
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#2e7d32' }}>
              {oracleAdoption.pct.toFixed(1)}%
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="#777">Blocks observed</Typography>
            <Typography variant="h6" fontWeight="bold">
              {oracleAdoption.bundleCount} of {oracleAdoption.total} blocks
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="#777">Latest bundle height</Typography>
            <Typography variant="h6" fontWeight="bold">
              {oracleAdoption.latestBundle ? oracleAdoption.latestBundle.height.toLocaleString() : '—'}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="#777">Latest bundle price</Typography>
            <Typography variant="h6" fontWeight="bold">
              {oracleAdoption.latestBundle?.oraclePriceUsd != null
                ? `$${oracleAdoption.latestBundle.oraclePriceUsd.toFixed(6)}`
                : '—'}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 2 }} />

        {oracleAdoption.pools.map((pool) => {
          const chip = STATUS_CHIP[pool.status];
          return (
            <Box
              key={pool.pool}
              sx={{
                display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1,
                py: 1, px: 1.5, mb: 0.75, borderRadius: '8px',
                backgroundColor: pool.status === 'publishing' ? 'rgba(46, 125, 50, 0.07)' : '#fafafa',
                border: pool.status === 'publishing' ? '1px solid rgba(46, 125, 50, 0.35)' : '1px solid #eee',
              }}
            >
              <Typography variant="body1" fontWeight="bold" sx={{ mr: 1 }}>
                {pool.pool}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {pool.bundles}/{pool.blocks} bundle blocks
                {pool.lastSigners != null ? ` · ${pool.lastSigners} signers` : ''}
              </Typography>
              <Chip label={chip.label} icon={chip.icon} size="small" sx={{ ml: 'auto', ...chip.sx }} />
            </Box>
          );
        })}
      </Card>
    );
  };

  // BIP9 Explanation Section
  const BIP9Explanation = () => (
    <Card elevation={3} sx={{ p: 3, mb: 4, borderRadius: '12px' }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, color: primaryColor }}>
        How DigiDollar Activates &mdash; BIP9 Explained
      </Typography>

      <Typography variant="body1" sx={{ mb: 2 }}>
        DigiByte uses <strong>BIP9 miner signaling</strong> to activate DigiDollar. This is the same proven system
        used for soft fork upgrades. Miners vote by setting bit {params.bit} in their block headers.
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2, backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
              The 5 BIP9 States:
            </Typography>
            <Box component="ol" sx={{ pl: 2, m: 0 }}>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                <strong>DEFINED</strong> &mdash; DigiDollar code exists but is dormant. Nothing happens yet.
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                <strong>STARTED</strong> &mdash; Miners can begin signaling support by setting bit {params.bit} in block headers.
                Think of it like miners voting &ldquo;yes&rdquo; for DigiDollar.
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                <strong>LOCKED_IN</strong> &mdash; At least {params.thresholdBlocks.toLocaleString()} of {params.activationWindow.toLocaleString()} blocks ({params.activationThreshold}%) signaled support.
                Activation is guaranteed. No going back.
              </Typography>
              <Typography component="li" variant="body2">
                <strong>ACTIVE</strong> &mdash; DigiDollar is live! Minting, sending, redeeming &mdash; everything unlocks.
              </Typography>
              <Typography component="li" variant="body2">
                <strong>FAILED</strong> &mdash; Timeout was reached before enough signaling blocks appeared.
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2, backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
              Why Does This Matter?
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {params.explainer}
            </Typography>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
              Monitor via CLI:
            </Typography>
            <Paper sx={{ p: 1.5, backgroundColor: '#1e1e1e', borderRadius: '4px' }}>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#4caf50', fontSize: '0.85rem' }}>
                {network.cliDeploymentCommand}
              </Typography>
            </Paper>
          </Paper>
        </Grid>
      </Grid>
    </Card>
  );

  // Technical Parameters Section
  const TechnicalParameters = () => (
    <Card elevation={3} sx={{ p: 3, borderRadius: '12px' }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, color: primaryColor }}>
        {displayName} Activation Parameters
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2, backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
              BIP9 Configuration
            </Typography>
            {[
              { label: 'Signaling Bit', value: params.bit },
              { label: 'Activation Window', value: `${params.activationWindow.toLocaleString()} blocks` },
              { label: 'Required Threshold', value: `${params.thresholdBlocks.toLocaleString()} blocks (${params.activationThreshold}%)` },
              { label: params.minActivationLabel, value: params.minActivationHeight.toLocaleString() },
            ].map(({ label, value }) => (
              <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">{label}:</Typography>
                <Typography variant="body2" fontWeight="bold">{value}</Typography>
              </Box>
            ))}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2, backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
              Current Status
            </Typography>
            {[
              { label: 'Status', value: status.toUpperCase().replace('_', ' ') },
              { label: 'Current Block', value: currentHeight > 0 ? currentHeight.toLocaleString() : 'Loading...' },
              // Signalling-era live stats only make sense before ACTIVE; once
              // active, show when it happened instead.
              ...(isActive
                ? [{ label: 'Activated At Block', value: activatedAtHeight != null ? activatedAtHeight.toLocaleString() : '—' }]
                : [
                  { label: 'Window Progress', value: currentHeight > 0 ? `${blocksIntoWindow.toLocaleString()} / ${periodBlocks.toLocaleString()}` : 'Loading...' },
                  { label: 'Signaling Blocks', value: signalingBlocks != null ? signalingBlocks.toLocaleString() : '--' },
                  { label: 'Lock-in Possible This Window', value: lockInPossible == null ? '--' : (lockInPossible ? 'Yes' : 'No') },
                ]),
            ].map(({ label, value }) => (
              <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">{label}:</Typography>
                <Typography variant="body2" fontWeight="bold">{value}</Typography>
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Card>
  );

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ActivationCelebration run={celebrate} onDone={() => setCelebrate(false)} />
        <HeroSection />
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CircularProgress size={40} sx={{ color: primaryColor }} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading activation data...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <ActivationCelebration run={celebrate} onDone={() => setCelebrate(false)} />
      <HeroSection />
      <StatusCards />
      {(status === 'active' || (status === 'locked_in' && currentHeight > 0 && activationHeight != null)) && (
        <ActivationCountdown
          activated={status === 'active'}
          activationHeight={status === 'active' ? activatedAtHeight : activationHeight}
          currentHeight={currentHeight}
          blocksLeft={status === 'active' ? 0 : activationBlocksLeft}
          windowStartBlock={windowStartBlock}
          periodBlocks={periodBlocks}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
        />
      )}
      <StageFlow />
      <OracleAdoptionSection />
      <BIP9Explanation />
      <TechnicalParameters />
      <IntegrationGuides />
    </Container>
  );
};

export default DDActivationPage;
