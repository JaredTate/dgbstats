import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Grid, Card, CardContent,
  Divider, Chip, LinearProgress, Paper, Alert, Tooltip,
  IconButton, CircularProgress, Button
} from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import LockIcon from '@mui/icons-material/Lock';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import { Link as RouterLink } from 'react-router-dom';
import { useNetwork } from '../context/NetworkContext';

// Empty initial state - no mock data
const EMPTY_DD_STATS = {
  health_percentage: 0,
  health_status: 'unavailable',
  total_collateral_dgb: 0,
  total_dd_supply: 0,
  oracle_price_micro_usd: 0,
  oracle_price_cents: 0,
  is_emergency: false,
  active_positions: 0,
  dca_tier: {
    min_collateral: 0,
    max_collateral: 0,
    multiplier: 0,
    status: 'unavailable'
  },
  err_tier: {
    ratio: 0,
    burn_multiplier: 0,
    description: 'Not Reporting'
  }
};

/**
 * DDStatsPage Component - DigiDollar Network Statistics (Testnet Only)
 *
 * Displays real-time network-wide DigiDollar statistics including:
 * - Total DD supply and collateral locked
 * - System health and collateralization ratio
 * - DCA and ERR tier status
 * - Oracle price information
 * Receives data via WebSocket push from the backend.
 */
const DDStatsPage = () => {
  const { theme: networkTheme, isTestnet, wsBaseUrl } = useNetwork();

  // State for DD stats - start empty, no mock data
  const [ddStats, setDdStats] = useState(EMPTY_DD_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [oracleCount, setOracleCount] = useState(0); // Track active oracles separately
  const [ddDeploymentStatus, setDdDeploymentStatus] = useState(null);

  // WebSocket connection for real-time DD stats data
  useEffect(() => {
    const socket = new WebSocket(wsBaseUrl);

    socket.onopen = () => {
      console.log('WebSocket connection established for DD stats page');
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'ddDeploymentData') {
          setDdDeploymentStatus(message.data.status);
        }
        if (message.type === 'ddStatsData') {
          const { stats: statsData, oraclePrice: oraclePriceData } = message.data;

          // Map response to expected format
          setDdStats({
            health_percentage: statsData.health_percentage || 0,
            health_status: statsData.health_status || 'unavailable',
            total_collateral_dgb: (statsData.total_collateral_dgb || 0),
            total_dd_supply: statsData.total_dd_supply || 0,
            oracle_price_micro_usd: statsData.oracle_price_micro_usd || 0,
            oracle_price_cents: statsData.oracle_price_cents || 0,
            is_emergency: statsData.is_emergency || false,
            active_positions: statsData.active_positions || 0,
            dca_tier: statsData.dca_tier || EMPTY_DD_STATS.dca_tier,
            err_tier: statsData.err_tier || EMPTY_DD_STATS.err_tier
          });

          // Get network oracle count from oraclePrice
          if (oraclePriceData) {
            setOracleCount(oraclePriceData.oracle_count || 0);
          }

          setLastUpdated(new Date());
          setLoading(false);
          setError(null);
        }
      } catch (err) {
        console.error('Error processing DD stats WebSocket message:', err);
      }
    };

    socket.onerror = () => {
      setError('Unable to connect to DigiDollar stats feed. Network may be unavailable.');
      setLoading(false);
    };

    socket.onclose = (event) => {
      if (event.code !== 1000) {
        console.log('DD stats WebSocket connection closed, code:', event.code);
      }
    };

    return () => socket.close();
  }, [wsBaseUrl]);

  // Format helpers - show "Not Reporting" when no data
  const formatDGB = (amount) => {
    if (!amount || amount === 0) return 'Not Reporting';
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' DGB';
  };

  const formatDD = (cents) => {
    if (!cents || cents === 0) return 'Not Reporting';
    return '$' + (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' DD';
  };

  const formatPrice = (microUsd) => {
    if (!microUsd || microUsd === 0) return 'Not Reporting';
    return '$' + (microUsd / 1000000).toFixed(6);
  };

  // Check if we have valid data
  const hasData = ddStats.health_percentage > 0 || ddStats.total_dd_supply > 0;

  // Get health color based on percentage
  const getHealthColor = (health) => {
    if (health >= 150) return '#4caf50'; // Green - Healthy
    if (health >= 120) return '#ff9800'; // Orange - Warning
    if (health >= 100) return '#f44336'; // Red - Critical
    return '#d32f2f'; // Dark Red - Emergency
  };

  const healthColor = getHealthColor(ddStats.health_percentage);

  // Hero Section - Modeled after wallet interface
  const HeroSection = () => (
    <Card
      elevation={2}
      sx={{
        backgroundColor: '#f2f4f8',
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
          <ShowChartIcon sx={{ fontSize: '3rem', color: isTestnet ? '#2e7d32' : '#002352', mr: 2 }} />
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
            DigiDollar Testnet Stats
          </Typography>
        </Box>

        <Typography
          variant="h5"
          sx={{
            color: isTestnet ? '#4caf50' : '#0066cc',
            mb: 2,
            fontWeight: 600
          }}
        >
          Real-Time Network Health & Statistics
        </Typography>

        <Divider sx={{ maxWidth: '150px', mx: 'auto', mb: 3, borderColor: isTestnet ? '#4caf50' : '#0066cc', borderWidth: 2 }} />

        <Typography
          variant="subtitle1"
          sx={{
            maxWidth: '800px',
            mx: 'auto',
            color: '#555',
            fontSize: '1.1rem'
          }}
        >
          Monitor DD Supply, Locked DGB, DCA & ERR Levels
        </Typography>
      </CardContent>
    </Card>
  );

  // Main Network Status Card - Modeled after wallet screenshot
  const NetworkStatusCard = () => (
    <Card
      elevation={3}
      sx={{
        mb: 4,
        borderRadius: '12px',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          backgroundColor: isTestnet ? '#2e7d32' : '#002352',
          color: 'white',
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <HealthAndSafetyIcon sx={{ mr: 1 }} />
          <Typography variant="h6" fontWeight="bold">
            Network DigiDollar Status
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {lastUpdated && (
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              {lastUpdated.toLocaleTimeString()}
            </Typography>
          )}
          <Chip
            label={ddStats.is_emergency ? 'EMERGENCY' : ddStats.health_status.toUpperCase()}
            sx={{
              backgroundColor: ddStats.is_emergency ? '#f44336' : healthColor,
              color: 'white',
              fontWeight: 'bold'
            }}
          />
        </Box>
      </Box>

      {/* Error Alert - only show when no data is available */}
      {error && !hasData && (
        <Alert severity="warning" sx={{ mx: 2, mt: 2 }}>
          {error}
        </Alert>
      )}

      <CardContent sx={{ p: 3 }}>
        <Grid container spacing={4}>
          {/* Left Column - Key Metrics */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={1}
              sx={{
                p: 2,
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                borderLeft: `4px solid ${isTestnet ? '#2e7d32' : '#0066cc'}`,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-around'
              }}
            >
              <Tooltip title="Current DGB price from oracle network - used to calculate collateral value" arrow placement="top">
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, cursor: 'help' }}>
                  <Chip label="DGB/USD Price:" size="small" sx={{ backgroundColor: '#0066cc', color: 'white', fontWeight: 'bold' }} />
                  <Typography variant="h6" fontWeight="bold" sx={{ color: '#0066cc' }}>
                    {formatPrice(ddStats.oracle_price_micro_usd)}
                  </Typography>
                </Box>
              </Tooltip>
              <Tooltip title="Ratio of total DGB collateral value to DD supply. Above 150% = healthy, below 100% = emergency" arrow placement="top">
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, cursor: 'help' }}>
                  <Chip label="System Health:" size="small" sx={{ backgroundColor: '#2e7d32', color: 'white', fontWeight: 'bold' }} />
                  <Typography variant="h6" fontWeight="bold" sx={{ color: healthColor }}>
                    {ddStats.health_percentage}% {ddStats.health_status.charAt(0).toUpperCase() + ddStats.health_status.slice(1)}
                  </Typography>
                </Box>
              </Tooltip>
              <Tooltip title="Dynamic Collateral Adjustment - multiplier applied to collateral requirements. Increases when system health drops" arrow placement="top">
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, cursor: 'help' }}>
                  <Chip label="DCA Level:" size="small" sx={{ backgroundColor: '#2e7d32', color: 'white', fontWeight: 'bold' }} />
                  <Typography variant="h6" fontWeight="bold" sx={{ color: '#2e7d32' }}>
                    {ddStats.dca_tier.multiplier}x
                  </Typography>
                </Box>
              </Tooltip>
              <Tooltip title="Emergency Redemption Ratio - activates below 100% health, requires burning more DD to redeem DGB collateral" arrow placement="top">
                <Box sx={{ display: 'flex', justifyContent: 'space-between', cursor: 'help' }}>
                  <Chip label="ERR Level:" size="small" sx={{ backgroundColor: ddStats.is_emergency ? '#f44336' : '#2e7d32', color: 'white', fontWeight: 'bold' }} />
                  <Typography variant="h6" fontWeight="bold" sx={{ color: ddStats.is_emergency ? '#f44336' : '#2e7d32' }}>
                    {ddStats.is_emergency ? `${ddStats.err_tier.burn_multiplier}x burn` : 'Inactive'}
                  </Typography>
                </Box>
              </Tooltip>
            </Paper>
          </Grid>

          {/* Right Column - Supply Stats */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
              {/* DD Supply - Green */}
              <Tooltip title="Total DigiDollars minted across all positions on the network" arrow placement="left">
                <Paper
                  elevation={2}
                  sx={{
                    p: 2.5,
                    backgroundColor: isTestnet ? '#1b5e20' : '#002352',
                    color: 'white',
                    borderRadius: '12px',
                    textAlign: 'center',
                    flex: 1,
                    cursor: 'help'
                  }}
                >
                  <Typography variant="overline" sx={{ opacity: 0.9 }}>
                    NETWORK DD SUPPLY
                  </Typography>
                  <Typography variant="h3" fontWeight="bold">
                    {formatDD(ddStats.total_dd_supply)}
                  </Typography>
                </Paper>
              </Tooltip>

              {/* DGB Locked - Blue */}
              <Tooltip title="Total DigiByte locked as collateral backing all DigiDollars" arrow placement="left">
                <Paper
                  elevation={2}
                  sx={{
                    p: 2.5,
                    backgroundColor: '#0066cc',
                    color: 'white',
                    borderRadius: '12px',
                    textAlign: 'center',
                    flex: 1,
                    cursor: 'help'
                  }}
                >
                  <Typography variant="overline" sx={{ opacity: 0.9 }}>
                    NETWORK DGB LOCKED
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {formatDGB(ddStats.total_collateral_dgb)}
                  </Typography>
                </Paper>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>

        {/* Collateralization Bar - Full Width */}
        <Box sx={{ mt: 3, p: 2, backgroundColor: '#f8f9fa', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="h6" fontWeight="bold">
              Network Collateralization
            </Typography>
            <Typography variant="h6" fontWeight="bold" sx={{ color: healthColor }}>
              {ddStats.health_percentage}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(ddStats.health_percentage / 10, 100)} // Cap at 1000% for visual
            sx={{
              height: 24,
              borderRadius: '12px',
              backgroundColor: '#e0e0e0',
              '& .MuiLinearProgress-bar': {
                backgroundColor: healthColor,
                borderRadius: '12px'
              }
            }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
            Minimum required: 100% • Healthy threshold: 150%
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  // Protection Tiers Card
  const ProtectionTiersCard = () => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {/* DCA Card */}
      <Grid item xs={12} md={6}>
        <Card elevation={3} sx={{ height: '100%', borderRadius: '12px', borderTop: `4px solid ${isTestnet ? '#4caf50' : '#0066cc'}` }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SecurityIcon sx={{ fontSize: '2rem', color: isTestnet ? '#2e7d32' : '#002352', mr: 1 }} />
              <Typography variant="h6" fontWeight="bold">
                Dynamic Collateral Adjustment (DCA)
              </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              DCA automatically adjusts collateral requirements based on system health to protect the network.
            </Typography>

            <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                Current Tier: {ddStats.dca_tier.status.toUpperCase()}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">Multiplier:</Typography>
                <Typography variant="body2" fontWeight="bold">{ddStats.dca_tier.multiplier}x</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Health Range:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {ddStats.dca_tier.min_collateral}%+
                </Typography>
              </Box>
            </Paper>

            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" fontWeight="bold">DCA Tiers:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                <Chip label="≥150%: 1.0x" size="small" sx={{ backgroundColor: '#4caf50', color: 'white' }} />
                <Chip label="120-149%: 1.2x" size="small" sx={{ backgroundColor: '#ff9800', color: 'white' }} />
                <Chip label="100-119%: 1.5x" size="small" sx={{ backgroundColor: '#f44336', color: 'white' }} />
                <Chip label="<100%: 2.0x" size="small" sx={{ backgroundColor: '#d32f2f', color: 'white' }} />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* ERR Card */}
      <Grid item xs={12} md={6}>
        <Card elevation={3} sx={{ height: '100%', borderRadius: '12px', borderTop: `4px solid ${ddStats.is_emergency ? '#f44336' : '#9e9e9e'}` }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <WarningIcon sx={{ fontSize: '2rem', color: ddStats.is_emergency ? '#f44336' : '#9e9e9e', mr: 1 }} />
              <Typography variant="h6" fontWeight="bold">
                Emergency Redemption Ratio (ERR)
              </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              ERR increases DD burn requirements when system drops below 100%, creating buying pressure to stabilize.
            </Typography>

            <Paper sx={{ p: 2, backgroundColor: ddStats.is_emergency ? '#ffebee' : '#f5f5f5', borderRadius: '8px' }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                Status: {ddStats.is_emergency ? 'ACTIVE' : 'INACTIVE'}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">ERR Ratio:</Typography>
                <Typography variant="body2" fontWeight="bold">{ddStats.err_tier.ratio}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">DD Burn Multiplier:</Typography>
                <Typography variant="body2" fontWeight="bold">{ddStats.err_tier.burn_multiplier}x</Typography>
              </Box>
            </Paper>

            <Alert
              severity={ddStats.is_emergency ? 'error' : 'success'}
              sx={{ mt: 2 }}
              icon={ddStats.is_emergency ? <ErrorIcon /> : <CheckCircleIcon />}
            >
              {ddStats.is_emergency
                ? 'ERR is active. New minting blocked until health > 100%.'
                : 'System healthy. Normal redemption ratios apply.'}
            </Alert>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Quick Stats Grid
  const QuickStatsGrid = () => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {/* DD Supply - Green */}
      <Grid item xs={6} md={3}>
        <Tooltip title="Total DigiDollars in circulation across the network" arrow>
          <Card elevation={2} sx={{ p: 2, textAlign: 'center', borderRadius: '12px', borderTop: '4px solid #2e7d32', cursor: 'help' }}>
            <AccountBalanceIcon sx={{ fontSize: '2.5rem', color: '#2e7d32', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">Total DD Supply</Typography>
            <Typography variant="h5" fontWeight="bold" sx={{ color: '#2e7d32' }}>{formatDD(ddStats.total_dd_supply)}</Typography>
          </Card>
        </Tooltip>
      </Grid>
      {/* DGB Locked - Blue */}
      <Grid item xs={6} md={3}>
        <Tooltip title="Total DGB locked as collateral backing DigiDollars" arrow>
          <Card elevation={2} sx={{ p: 2, textAlign: 'center', borderRadius: '12px', borderTop: '4px solid #0066cc', cursor: 'help' }}>
            <LockIcon sx={{ fontSize: '2.5rem', color: '#0066cc', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">DGB Locked</Typography>
            <Typography variant="h5" fontWeight="bold" sx={{ color: '#0066cc' }}>{(ddStats.total_collateral_dgb / 1000000).toFixed(2)}M</Typography>
          </Card>
        </Tooltip>
      </Grid>
      {/* Collateral Ratio - Health Color */}
      <Grid item xs={6} md={3}>
        <Tooltip title="System health percentage - collateral value divided by DD supply" arrow>
          <Card elevation={2} sx={{ p: 2, textAlign: 'center', borderRadius: '12px', borderTop: `4px solid ${healthColor}`, cursor: 'help' }}>
            <TrendingUpIcon sx={{ fontSize: '2.5rem', color: healthColor, mb: 1 }} />
            <Typography variant="body2" color="text.secondary">Collateral Ratio</Typography>
            <Typography variant="h5" fontWeight="bold" sx={{ color: healthColor }}>{ddStats.health_percentage}%</Typography>
          </Card>
        </Tooltip>
      </Grid>
      {/* Active Oracles - Green */}
      <Grid item xs={6} md={3}>
        <Tooltip title="Number of oracles currently providing price feeds to the network" arrow>
          <Card elevation={2} sx={{ p: 2, textAlign: 'center', borderRadius: '12px', borderTop: '4px solid #2e7d32', cursor: 'help' }}>
            <SpeedIcon sx={{ fontSize: '2.5rem', color: '#2e7d32', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">Active Oracles</Typography>
            <Typography variant="h5" fontWeight="bold" sx={{ color: '#2e7d32' }}>{oracleCount}</Typography>
          </Card>
        </Tooltip>
      </Grid>
    </Grid>
  );

  // How System Health Works
  const SystemHealthExplainer = () => (
    <Card elevation={3} sx={{ p: 3, borderRadius: '12px' }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, color: isTestnet ? '#2e7d32' : '#002352' }}>
        How System Health Works
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            <strong>Network Collateralization</strong> is calculated as:
          </Typography>
          <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: '8px', mb: 2 }}>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              Health % = (Total DGB Locked × DGB Price) / Total DD Supply × 100
            </Typography>
          </Paper>
          <Typography variant="body2" color="text.secondary">
            The system maintains stability through over-collateralization. At {ddStats.health_percentage}% collateralization,
            DGB would need to drop {Math.max(0, Math.round((1 - 100/ddStats.health_percentage) * 100))}% before the system becomes undercollateralized.
          </Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
            Health Thresholds:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: '#4caf50' }} />
              <Typography variant="body2"><strong>≥150%</strong> - Healthy: Normal operations</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: '#ff9800' }} />
              <Typography variant="body2"><strong>120-149%</strong> - Warning: +20% collateral required</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: '#f44336' }} />
              <Typography variant="body2"><strong>100-119%</strong> - Critical: +50% collateral required</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: '#d32f2f' }} />
              <Typography variant="body2"><strong>&lt;100%</strong> - Emergency: ERR activates, no new mints</Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Card>
  );

  const NotActiveBanner = () => {
    if (!ddDeploymentStatus || ddDeploymentStatus === 'active') return null;
    return (
      <Alert
        severity="info"
        sx={{ mb: 3, borderRadius: '12px' }}
        action={
          <Button color="inherit" size="small" component={RouterLink} to="/testnet/activation">
            Track Activation →
          </Button>
        }
      >
        <Typography variant="body1">
          <strong>DigiDollar is not active yet.</strong> Currently in the <strong>{ddDeploymentStatus.toUpperCase().replace('_', ' ')}</strong> stage of BIP9 activation.
        </Typography>
      </Alert>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <HeroSection />
      <NotActiveBanner />
      <NetworkStatusCard />
      <QuickStatsGrid />
      <ProtectionTiersCard />
      <SystemHealthExplainer />
    </Container>
  );
};

export default DDStatsPage;
