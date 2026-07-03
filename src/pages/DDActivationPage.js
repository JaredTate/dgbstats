import React, { useState, useEffect, useCallback } from 'react';
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
import config from '../config';

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

// Groestl unconditional-rejection backstop (nGroestlDeactivationHeight): from this
// height, retired-algorithm blocks are rejected regardless of BIP9 signalling.
const GROESTL_BACKSTOP = { mainnet: 23808000, testnet: null, 'mainnet-pre': null };

/** Rough ETA from block count at DigiByte's 15s spacing. */
function fmtEta(blocks) {
  if (blocks == null) return '—';
  const hours = (blocks * 15) / 3600;
  if (hours >= 24) return `~${(hours / 24).toFixed(1)} days`;
  return `~${hours.toFixed(1)} hours`;
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
  const { wsBaseUrl, theme: networkTheme, digiDollarLabel, displayName, apiPrefix, name: networkName } = network;
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
  const [loading, setLoading] = useState(true);
  // Authoritative BIP9 deployment objects from the node's getdeploymentinfo RPC
  // (statistics: period/threshold/elapsed/count/possible). The WebSocket
  // ddDeploymentData message remains the fallback for older servers.
  const [officialDD, setOfficialDD] = useState(null);
  const [officialAlgolock, setOfficialAlgolock] = useState(null);

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

        if (message.type === 'newBlock') {
          setCurrentHeight(prev => Math.max(prev, message.data.height || prev + 1));
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
        setOfficialAlgolock(dep?.deployments?.algolock || null);
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

  // Algolock (bit 0) deployment state
  const alStatus = officialAlgolock
    ? (officialAlgolock.active ? 'active' : officialAlgolock.bip9?.status) : null;
  const alStats = officialAlgolock?.bip9?.statistics;
  const algolockLive = ['started', 'locked_in', 'active'].includes(alStatus);
  const groestlBackstop = GROESTL_BACKSTOP[networkName] ?? null;
  const backstopBlocks = groestlBackstop && currentHeight
    ? Math.max(0, groestlBackstop - currentHeight) : null;

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
            <strong>DigiDollar activation is locked in!</strong> It will activate at block {deploymentInfo.min_activation_height || params.minActivationHeight}.
            {currentHeight > 0 && ` (${Math.max(0, (deploymentInfo.min_activation_height || params.minActivationHeight) - currentHeight)} blocks remaining)`}
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

  // Algolock (bit 0) — the second live BIP9 deployment: re-locks the retired
  // Groestl algorithm. Tracked alongside DigiDollar because both ship in v9.26.x.
  const AlgolockSection = () => {
    if (!officialAlgolock && !groestlBackstop) return null;
    return (
      <Card elevation={3} sx={{ p: 3, mb: 4, borderRadius: '12px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ color: primaryColor }}>
            Algolock — Groestl Removal (bit 0)
          </Typography>
          {alStatus && (
            <Chip
              icon={STATE_ICONS[alStatus]}
              label={alStatus.toUpperCase().replace('_', ' ')}
              size="small"
              sx={{
                backgroundColor: STATE_COLORS[alStatus] || '#757575', color: 'white',
                fontWeight: 'bold', '& .MuiChip-icon': { color: 'white' },
              }}
            />
          )}
        </Box>
        <Typography variant="body2" sx={{ mb: 2, color: '#555' }}>
          v9.26.2+ nodes also signal a second deployment: <strong>algolock</strong> (bit&nbsp;0),
          which re-enforces rejection of the retired Groestl mining algorithm. Unlike DigiDollar's
          bit&nbsp;23, bit&nbsp;0 sits <strong>outside</strong> the SHA256D ASIC version-rolling window
          (BIP320 bits 13–28), so it doubles as a reliable "this pool runs v9.26.x" indicator for
          every pool once signalling opens.
        </Typography>

        {!algolockLive ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            Algolock signalling has not opened yet (status:{' '}
            <strong>{alStatus || 'defined'}</strong>). Miners begin setting bit&nbsp;0 when the next
            BIP9 window starts
            {nextWindowStart ? (
              <> at block <strong>{nextWindowStart.toLocaleString()}</strong>{' '}
                ({nextWindowBlocks?.toLocaleString()} blocks, {fmtEta(nextWindowBlocks)})</>
            ) : null}.
          </Alert>
        ) : (
          alStats && (
            <Alert severity={alStatus === 'active' ? 'success' : 'info'} sx={{ mb: 2 }}>
              {(alStats.count ?? 0).toLocaleString()} of {(alStats.elapsed ?? 0).toLocaleString()} elapsed
              blocks signal algolock — lock-in needs{' '}
              {(alStats.threshold ?? Math.round((alStats.period || 0) * 0.7)).toLocaleString()} of{' '}
              {(alStats.period ?? 0).toLocaleString()}.
            </Alert>
          )
        )}

        {groestlBackstop && (
          <>
            <Grid container spacing={3}>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="#777">Backstop height</Typography>
                <Typography variant="h6" fontWeight="bold">{groestlBackstop.toLocaleString()}</Typography>
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
            <Typography variant="body2" sx={{ mt: 2, color: '#555' }}>
              Independent of BIP9 signalling, blocks using the retired Groestl algorithm (or any
              unknown algorithm) are rejected <strong>unconditionally</strong> from the backstop
              height. Groestl blocks mined before then dilute the DigiDollar signalling window,
              since BIP9 counts every block in the window regardless of algorithm.
            </Typography>
          </>
        )}
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
              { label: 'Window Progress', value: currentHeight > 0 ? `${blocksIntoWindow.toLocaleString()} / ${periodBlocks.toLocaleString()}` : 'Loading...' },
              { label: 'Signaling Blocks', value: signalingBlocks != null ? signalingBlocks.toLocaleString() : '--' },
              { label: 'Lock-in Possible This Window', value: lockInPossible == null ? '--' : (lockInPossible ? 'Yes' : 'No') },
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
      <HeroSection />
      <StatusCards />
      <StageFlow />
      <AlgolockSection />
      <BIP9Explanation />
      <TechnicalParameters />
      <IntegrationGuides />
    </Container>
  );
};

export default DDActivationPage;
