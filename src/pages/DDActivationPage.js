import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Paper, LinearProgress, Card, CardContent,
  Divider, Grid, Chip, Alert, CircularProgress
} from '@mui/material';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import LockIcon from '@mui/icons-material/Lock';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useNetwork } from '../context/NetworkContext';

/**
 * BIP9 activation parameters for DigiDollar on each network
 */
const TESTNET_PARAMS = {
  activationThreshold: 70,
  activationWindow: 200,
  thresholdBlocks: 140,
  minActivationHeight: 600,
  bit: 23
};

const MAINNET_PARAMS = {
  activationThreshold: 70,
  activationWindow: 40320,
  thresholdBlocks: 28224,
  minActivationHeight: 22014720,
  bit: 23
};

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
  active: <CheckCircleIcon />
};

/**
 * DDActivationPage - DigiDollar BIP9 Activation Status Tracker
 *
 * Tracks the BIP9 soft fork activation lifecycle for DigiDollar through
 * all 4 stages: DEFINED -> STARTED -> LOCKED_IN -> ACTIVE.
 * Receives real-time data via WebSocket from getdigidollardeploymentinfo RPC.
 */
const DDActivationPage = () => {
  const { wsBaseUrl, isTestnet } = useNetwork();
  const params = isTestnet ? TESTNET_PARAMS : MAINNET_PARAMS;

  const [deploymentInfo, setDeploymentInfo] = useState({
    enabled: false,
    status: 'defined',
    bit: 23,
    start_time: 0,
    timeout: 0,
    min_activation_height: 0,
    signaling_blocks: 0,
    threshold: 0,
    period_blocks: 0,
    progress_percent: 0
  });

  const [currentHeight, setCurrentHeight] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const socket = new WebSocket(wsBaseUrl);

    socket.onopen = () => {
      console.log('WebSocket connected for DD Activation page');
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === 'ddDeploymentData') {
          setDeploymentInfo(message.data);
          setLoading(false);
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

    return () => socket.close();
  }, [wsBaseUrl]);

  const status = deploymentInfo.status || 'defined';
  const isActive = status === 'active' || deploymentInfo.enabled;
  const signalingBlocks = deploymentInfo.signaling_blocks || 0;
  const periodBlocks = deploymentInfo.period_blocks || params.activationWindow;
  const progress = periodBlocks > 0 ? (signalingBlocks / periodBlocks) * 100 : 0;

  const blocksIntoWindow = currentHeight > 0 ? currentHeight % params.activationWindow : 0;
  const currentWindow = currentHeight > 0 ? Math.floor(currentHeight / params.activationWindow) : 0;
  const windowStartBlock = currentWindow * params.activationWindow;
  const windowEndBlock = windowStartBlock + params.activationWindow - 1;

  const stages = [
    { key: 'defined', label: 'DEFINED', blocks: isTestnet ? '0–199' : 'Pre-signal', description: 'Code exists but is dormant' },
    { key: 'started', label: 'STARTED', blocks: isTestnet ? '200–399' : 'Signaling open', description: 'Miners signal support (bit 23)' },
    { key: 'locked_in', label: 'LOCKED_IN', blocks: isTestnet ? '400–599' : 'Threshold met', description: 'Activation guaranteed' },
    { key: 'active', label: 'ACTIVE', blocks: isTestnet ? '600+' : 'Activated', description: 'DigiDollar is live!' }
  ];

  const stateOrder = ['defined', 'started', 'locked_in', 'active'];
  const currentStateIndex = stateOrder.indexOf(status);

  // Hero Section
  const HeroSection = () => (
    <Card
      elevation={2}
      sx={{
        borderRadius: '12px',
        mb: 4,
        overflow: 'hidden',
        backgroundImage: isTestnet
          ? 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)'
          : 'linear-gradient(135deg, #f8f9fa 0%, #e8eef7 100%)',
        border: `1px solid ${isTestnet ? 'rgba(46, 125, 50, 0.2)' : 'rgba(0, 35, 82, 0.1)'}`
      }}
    >
      <CardContent sx={{ py: 4, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
          <RocketLaunchIcon sx={{ fontSize: '3rem', color: isTestnet ? '#2e7d32' : '#002352', mr: 2 }} />
          <Typography
            variant="h2"
            component="h1"
            fontWeight="800"
            sx={{
              color: isTestnet ? '#2e7d32' : '#002352',
              letterSpacing: '0.5px',
              fontSize: { xs: '1.8rem', sm: '2.3rem', md: '2.8rem' }
            }}
          >
            DigiDollar {isTestnet ? 'Testnet ' : ''}Activation
          </Typography>
        </Box>

        <Typography
          variant="h5"
          sx={{ color: isTestnet ? '#4caf50' : '#0066cc', mb: 2, fontWeight: 600 }}
        >
          BIP9 Soft Fork Activation Tracker
        </Typography>

        <Divider sx={{ maxWidth: '150px', mx: 'auto', mb: 2, borderColor: isTestnet ? '#4caf50' : '#0066cc', borderWidth: 2 }} />

        <Typography variant="body1" sx={{ maxWidth: '800px', mx: 'auto', color: '#555' }}>
          Track the activation progress of DigiDollar through the BIP9 miner signaling process.
          {isTestnet ? ' This testnet deployment uses accelerated parameters for testing.' : ''}
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
            <Typography variant="h6" sx={{ color: isTestnet ? '#2e7d32' : '#002352', mb: 2 }}>
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
            <Typography variant="h6" sx={{ color: isTestnet ? '#2e7d32' : '#002352', mb: 2 }}>
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
            borderTop: `4px solid ${isTestnet ? '#4caf50' : '#0066cc'}`
          }}
        >
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" sx={{ color: isTestnet ? '#2e7d32' : '#002352', mb: 2 }}>
              Current Block
            </Typography>
            <Typography
              variant="h3"
              sx={{ color: isTestnet ? '#2e7d32' : '#002352', fontWeight: 'bold' }}
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

  // 4-Stage Flow Visualization
  const StageFlow = () => (
    <Card elevation={3} sx={{ p: 3, mb: 4, borderRadius: '12px' }}>
      <Typography
        variant="h5"
        fontWeight="bold"
        sx={{ mb: 3, textAlign: 'center', color: isTestnet ? '#2e7d32' : '#002352' }}
      >
        Activation Progress
      </Typography>

      <Grid container spacing={2}>
        {stages.map((stage) => {
          const isCurrentStage = stage.key === status;
          const isPastStage = stateOrder.indexOf(stage.key) < currentStateIndex;
          const stageColor = STATE_COLORS[stage.key];

          return (
            <Grid item xs={12} sm={6} md={3} key={stage.key}>
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
                  Blocks {stage.blocks}
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
              sx={{ color: progress >= 70 ? '#4caf50' : '#ff9800' }}
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
                  backgroundColor: progress >= 70 ? '#4caf50' : '#ff9800',
                  borderRadius: '12px'
                }
              }}
            />
            {/* 70% threshold marker */}
            <Box
              sx={{
                position: 'absolute',
                left: '70%',
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
                left: '70%',
                top: -20,
                transform: 'translateX(-50%)',
                color: '#f44336',
                fontWeight: 'bold'
              }}
            >
              70%
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {deploymentInfo.signaling_blocks || 0} / {deploymentInfo.period_blocks || params.activationWindow} blocks signaling
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Need {params.thresholdBlocks} for lock-in
            </Typography>
          </Box>
        </Box>
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

  // BIP9 Explanation Section
  const BIP9Explanation = () => (
    <Card elevation={3} sx={{ p: 3, mb: 4, borderRadius: '12px' }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, color: isTestnet ? '#2e7d32' : '#002352' }}>
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
              The 4 Stages:
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
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2, backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
              Why Does This Matter?
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {isTestnet
                ? 'This testnet deployment tests the full activation lifecycle with accelerated parameters (200-block windows instead of 40,320). On mainnet, the timeline is longer but the mechanism is identical.'
                : 'BIP9 ensures network consensus before activating new features. By requiring 70% miner support, the upgrade proceeds only when the network is ready.'}
            </Typography>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
              Monitor via CLI:
            </Typography>
            <Paper sx={{ p: 1.5, backgroundColor: '#1e1e1e', borderRadius: '4px' }}>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#4caf50', fontSize: '0.85rem' }}>
                digibyte-cli {isTestnet ? '-testnet ' : ''}getdigidollardeploymentinfo
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
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, color: isTestnet ? '#2e7d32' : '#002352' }}>
        {isTestnet ? 'Testnet' : 'Mainnet'} Activation Parameters
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
              { label: 'Min Activation Height', value: params.minActivationHeight.toLocaleString() },
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
              { label: 'Window Progress', value: currentHeight > 0 ? `${blocksIntoWindow} / ${params.activationWindow}` : 'Loading...' },
              { label: 'Signaling Blocks', value: deploymentInfo.signaling_blocks != null ? String(deploymentInfo.signaling_blocks) : '--' },
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
          <CircularProgress size={40} sx={{ color: isTestnet ? '#2e7d32' : '#002352' }} />
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
      <BIP9Explanation />
      <TechnicalParameters />
    </Container>
  );
};

export default DDActivationPage;
