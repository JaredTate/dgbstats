import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Grid, Card, CardContent,
  Divider, Chip, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Alert, Button, LinearProgress,
  Tooltip, Link, CircularProgress
} from '@mui/material';
import SensorsIcon from '@mui/icons-material/Sensors';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SecurityIcon from '@mui/icons-material/Security';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import GitHubIcon from '@mui/icons-material/GitHub';
import DescriptionIcon from '@mui/icons-material/Description';
import KeyIcon from '@mui/icons-material/Key';
import SendIcon from '@mui/icons-material/Send';
import VerifiedIcon from '@mui/icons-material/Verified';
import { Link as RouterLink } from 'react-router-dom';
import { useNetwork } from '../context/NetworkContext';
import IntegrationGuides from '../components/IntegrationGuides';

// Empty initial state - no mock data
const EMPTY_ORACLE_PRICE = {
  price_micro_usd: 0,
  price_usd: 0,
  oracle_count: 0,
  status: 'unavailable',
  last_update_height: 0,
  is_stale: true,
  '24h_high': 0,
  '24h_low': 0,
  volatility: 0
};

// RC30 active oracle configuration — 9-of-17 consensus
// The getoracles RPC returns 30 legacy entries (vOracleNodes), but only
// IDs 0-16 are active under the 9-of-17 MuSig2 quorum. Filter in the
// data mapping below so the UI never displays stale legacy entries.
const ACTIVE_ORACLE_COUNT = 17;
const MAX_ACTIVE_ORACLE_ID = 16; // IDs 0 through 16
const ORACLE_THRESHOLD = 9;     // consensus requires 9-of-17
const EXPECTED_MUSIG2_CONTEXT_VERSION = 2; // RC38 attempt/evidence-bound context protocol

// Oracle name mapping for cases where daemon returns "Unknown".
// The node's vOracleNodes list uses placeholder keys for IDs 9 and 10;
// their real-world operator names must be supplied here.
const ORACLE_NAMES = {
  7: 'LookInto',        // Oracle 7
  9: 'Ogilvie',         // Oracle 9
  10: 'ChopperBrian',   // Oracle 10
  11: 'hallvardo',      // Oracle 11
  12: 'DaPunzy',        // Oracle 12 — active in RC30
  13: 'DigiByteForce',  // Oracle 13
  14: 'Neel',           // Oracle 14 — active in RC30
  15: 'DigiSwarm',      // Oracle 15 — active in RC30
  16: 'GTO90'           // Oracle 16 — active in RC30
};

const formatAgeSeconds = (seconds) => {
  const value = Number(seconds);
  if (!Number.isFinite(value) || value < 0) return 'unknown';

  const totalSeconds = Math.floor(value);
  if (totalSeconds < 60) return `${totalSeconds}s ago`;

  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s ago`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 24) return `${hours}h ${remainingMinutes}m ago`;

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days}d ${remainingHours}h ago`;
};

const formatTimestampAge = (timestamp) => {
  const value = Number(timestamp);
  if (!Number.isFinite(value) || value <= 0) return 'unknown';
  const nowSeconds = Math.floor(Date.now() / 1000);
  return formatAgeSeconds(Math.max(0, nowSeconds - value));
};

const getHeartbeatChipColor = (status, signatureValid) => {
  if (status === 'fresh' && signatureValid) return 'success';
  if (status === 'stale') return 'warning';
  if (status === 'invalid_signature') return 'error';
  return 'default';
};

/**
 * OraclesPage Component - DigiDollar Oracle Network Status (Testnet Only)
 *
 * Displays real-time information about the decentralized oracle network
 * that provides DGB/USD price feeds for the DigiDollar system.
 * Receives data via WebSocket push from the backend.
 */
const OraclesPage = () => {
  const { isTestnet, wsBaseUrl } = useNetwork();

  // State for oracle data - start empty, no mock data
  const [oraclePrice, setOraclePrice] = useState(EMPTY_ORACLE_PRICE);
  const [oracles, setOracles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [ddDeploymentStatus, setDdDeploymentStatus] = useState(null);

  // WebSocket connection for real-time oracle data
  useEffect(() => {
    const socket = new WebSocket(wsBaseUrl);

    socket.onopen = () => {
      console.log('WebSocket connection established for oracles page');
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'ddDeploymentData') {
          setDdDeploymentStatus(message.data.status);
        }
        if (message.type === 'oracleData') {
          const { price: priceData, allPrices: allOraclePricesData, oracles: oraclesConfigData } = message.data;
          const allOraclePrices = (allOraclePricesData && allOraclePricesData.oracles) || [];

          // Update state with real price data
          setOraclePrice({
            price_micro_usd: priceData.price_micro_usd || 0,
            price_usd: priceData.price_usd || 0,
            oracle_count: priceData.oracle_count || 0,
            status: priceData.status || 'unknown',
            last_update_height: priceData.last_update_height || 0,
            is_stale: priceData.is_stale || false,
            '24h_high': priceData['24h_high'] || 0,
            '24h_low': priceData['24h_low'] || 0,
            volatility: priceData.volatility || 0
          });

          // Use getoracles (config with all oracles) as base, merge price data from getalloracleprices
          const mappedOracles = (oraclesConfigData || []).map(configOracle => {
            const priceOracle = allOraclePrices.find(o => o.oracle_id === configOracle.oracle_id) || {};
            const priceMicroUsd = priceOracle.price_micro_usd ?? configOracle.last_price_micro_usd ?? 0;
            const priceUsd = priceOracle.price_usd ?? configOracle.last_price_usd ?? 0;
            const lastPriceTimestamp = priceOracle.timestamp ?? configOracle.last_update ?? 0;
            const priceStatus = priceOracle.status || configOracle.status || 'no_data';

            return {
              oracle_id: configOracle.oracle_id,
              name: configOracle.name !== 'Unknown' ? configOracle.name : (ORACLE_NAMES[configOracle.oracle_id] || `Oracle ${configOracle.oracle_id}`),
              pubkey: configOracle.pubkey || '',
              endpoint: configOracle.endpoint,
              in_consensus: configOracle.in_consensus !== false,
              selected_for_epoch: Boolean(configOracle.selected_for_epoch),
              is_running_locally: Boolean(configOracle.is_running_locally),
              price_micro_usd: priceMicroUsd,
              price_usd: priceUsd,
              timestamp: lastPriceTimestamp,
              deviation_pct: priceOracle.deviation_pct || 0,
              signature_valid: priceOracle.signature_valid || false,
              price_source: configOracle.price_source || priceOracle.price_source || 'none',
              status: priceStatus,
              is_running: priceStatus === 'reporting',
              heartbeat_status: configOracle.heartbeat_status || 'unknown',
              software_version: configOracle.software_version || '',
              client_version: configOracle.client_version || 0,
              p2p_protocol_version: configOracle.p2p_protocol_version || 0,
              oracle_protocol_version: configOracle.oracle_protocol_version || 0,
              musig2_context_version: configOracle.musig2_context_version || 0,
              heartbeat_timestamp: configOracle.heartbeat_timestamp || 0,
              heartbeat_age_seconds: configOracle.heartbeat_age_seconds ?? -1,
              heartbeat_signature_valid: Boolean(configOracle.heartbeat_signature_valid)
            };
          });

          // RC30: Only show active oracles (IDs 0 through MAX_ACTIVE_ORACLE_ID).
          // The getoracles RPC may still expose legacy vOracleNode entries but consensus
          // uses ACTIVE_ORACLE_COUNT (17). Discard anything beyond that.
          const activeOracles = mappedOracles.filter(o => o.oracle_id <= MAX_ACTIVE_ORACLE_ID);
          setOracles(activeOracles);
          setLastUpdated(new Date());
          setLoading(false);
          setError(null);
        }
      } catch (err) {
        console.error('Error processing oracle WebSocket message:', err);
      }
    };

    socket.onerror = () => {
      setError('Unable to connect to oracle data feed. Network may be unavailable.');
      setLoading(false);
    };

    socket.onclose = (event) => {
      if (event.code !== 1000) {
        console.log('Oracle WebSocket connection closed, code:', event.code);
      }
    };

    return () => socket.close();
  }, [wsBaseUrl]);

  // Format price from micro-USD to display format
  const formatPrice = (microUsd) => {
    if (!microUsd || microUsd === 0) return 'Not Reporting';
    return '$' + (microUsd / 1000000).toFixed(6);
  };

  // Check if we have valid data
  const hasData = oraclePrice.oracle_count > 0 || oracles.length > 0;

  // Count oracles that are actively reporting (consistent across page)
  const reportingCount = oracles.filter(o => o.status === 'reporting').length;
  const freshHeartbeatCount = oracles.filter(o => o.heartbeat_status === 'fresh' && o.heartbeat_signature_valid).length;
  const rc38ContextCount = oracles.filter(o =>
    o.heartbeat_status === 'fresh' &&
    o.heartbeat_signature_valid &&
    o.musig2_context_version >= EXPECTED_MUSIG2_CONTEXT_VERSION
  ).length;
  const selectedCount = oracles.filter(o => o.selected_for_epoch).length;
  const locallyRunningCount = oracles.filter(o => o.is_running_locally).length;
  const consensusReady = reportingCount >= ORACLE_THRESHOLD &&
    freshHeartbeatCount >= ORACLE_THRESHOLD &&
    rc38ContextCount >= ORACLE_THRESHOLD &&
    selectedCount >= ORACLE_THRESHOLD;

  const SitrepMetric = ({ label, value, detail, ok }) => (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        height: '100%',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        backgroundColor: ok ? 'rgba(46, 125, 50, 0.06)' : '#fafafa'
      }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
        {label}
      </Typography>
      <Typography
        variant="h4"
        fontWeight="bold"
        sx={{ color: ok ? '#2e7d32' : '#ed6c02', lineHeight: 1.1 }}
      >
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {detail}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={oracles.length ? Math.min(100, (parseInt(value, 10) / oracles.length) * 100) : 0}
        color={ok ? 'success' : 'warning'}
        sx={{ mt: 1.5, height: 6, borderRadius: 3 }}
      />
    </Paper>
  );

  // Hero Section
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
      <CardContent sx={{ py: 3, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
          <SensorsIcon sx={{ fontSize: '3rem', color: isTestnet ? '#2e7d32' : '#002352', mr: 2 }} />
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
            DigiDollar Testnet Oracles
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
          Decentralized Price Feed Network
        </Typography>

        <Divider sx={{ maxWidth: '150px', mx: 'auto', mb: 2, borderColor: isTestnet ? '#4caf50' : '#0066cc', borderWidth: 2 }} />

        <Typography
          variant="body1"
          sx={{
            maxWidth: '800px',
            mx: 'auto',
            color: '#555'
          }}
        >
          The oracle network provides real-time DGB/USD price feeds to the DigiDollar system using BIP-340 Schnorr signature consensus.
        </Typography>
      </CardContent>
    </Card>
  );

  // Current Price Card
  const CurrentPriceCard = () => (
    <Card elevation={3} sx={{ p: 3, mb: 4, borderRadius: '12px', borderTop: `4px solid ${isTestnet ? '#4caf50' : '#0066cc'}` }}>
      {/* Error Alert - only show when no data is available */}
      {error && !hasData && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AttachMoneyIcon sx={{ fontSize: '2rem', color: isTestnet ? '#2e7d32' : '#002352', mr: 1 }} />
          <Typography variant="h5" fontWeight="bold" sx={{ color: isTestnet ? '#2e7d32' : '#002352' }}>
            Testnet Oracle Price
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {lastUpdated && (
            <Typography variant="caption" color="text.secondary">
              Updated: {lastUpdated.toLocaleTimeString()}
            </Typography>
          )}
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress size={40} sx={{ color: isTestnet ? '#2e7d32' : '#002352' }} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Loading oracle data...</Typography>
        </Box>
      ) : !hasData && ddDeploymentStatus && ddDeploymentStatus !== 'active' ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <HourglassTopIcon sx={{ fontSize: '3rem', color: '#9e9e9e', mb: 1 }} />
          <Typography variant="h6" color="text.secondary">Oracle Network Waiting for Activation</Typography>
          <Typography variant="body2" color="text.secondary">
            DigiDollar is currently in the {ddDeploymentStatus.toUpperCase().replace('_', ' ')} stage, so live oracle price reporting is not available yet.
          </Typography>
        </Box>
      ) : !hasData && error ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CloudOffIcon sx={{ fontSize: '3rem', color: '#9e9e9e', mb: 1 }} />
          <Typography variant="h6" color="text.secondary">Oracle Network Unavailable</Typography>
          <Typography variant="body2" color="text.secondary">Unable to fetch oracle data from the network</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Tooltip title="Consensus price from oracle network - median of all active oracle price feeds with outlier filtering" arrow placement="top">
              <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#f5f5f5', borderRadius: '8px', cursor: 'help', minHeight: 160, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="body2" color="text.secondary">DGB/USD Price</Typography>
                <Typography variant="h3" fontWeight="bold" sx={{ color: oraclePrice.price_micro_usd > 0 ? (isTestnet ? '#2e7d32' : '#002352') : '#9e9e9e' }}>
                  {formatPrice(oraclePrice.price_micro_usd)}
                </Typography>
                {oraclePrice.price_micro_usd > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    {oraclePrice.price_micro_usd.toLocaleString()} micro-USD
                  </Typography>
                )}
              </Box>
            </Tooltip>
          </Grid>
          <Grid item xs={12} md={4}>
            <Tooltip title="Number of oracles contributing to network price consensus. Requires 9-of-17 for consensus on testnet" arrow placement="top">
              <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#f5f5f5', borderRadius: '8px', cursor: 'help', minHeight: 160, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="body2" color="text.secondary">Network Oracles</Typography>
                <Typography variant="h3" fontWeight="bold" sx={{ color: reportingCount > 0 ? (isTestnet ? '#2e7d32' : '#002352') : '#9e9e9e' }}>
                  {reportingCount > 0 ? `${reportingCount}/${oracles.length}` : '--'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {reportingCount > 0 ? 'Online Reporting' : 'Not Reporting'}
                </Typography>
                <Typography variant="body2" fontWeight="bold" sx={{ mt: 1, color: reportingCount >= ORACLE_THRESHOLD ? '#2e7d32' : '#ed6c02' }}>
                  {ORACLE_THRESHOLD}/{oracles.length || ACTIVE_ORACLE_COUNT} needed for consensus
                </Typography>
              </Box>
            </Tooltip>
          </Grid>
          <Grid item xs={12} md={4}>
            <Tooltip title="Block height when the oracle price was last updated. Price becomes stale after 20 blocks without update" arrow placement="top">
              <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#f5f5f5', borderRadius: '8px', cursor: 'help', minHeight: 160, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="body2" color="text.secondary">Last Update</Typography>
                <Typography variant="h4" fontWeight="bold" sx={{ color: oraclePrice.last_update_height > 0 ? (isTestnet ? '#2e7d32' : '#002352') : '#9e9e9e' }}>
                  {oraclePrice.last_update_height > 0 ? `Block ${oraclePrice.last_update_height.toLocaleString()}` : 'No Data'}
                </Typography>
                {oraclePrice.last_update_height > 0 && (
                  <Chip
                    label={oraclePrice.is_stale ? 'Stale' : 'Fresh'}
                    color={oraclePrice.is_stale ? 'error' : 'success'}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                )}
              </Box>
            </Tooltip>
          </Grid>
        </Grid>
      )}

      {isTestnet && (
        <Box sx={{ mt: 2, p: 1.5, backgroundColor: 'rgba(46, 125, 50, 0.08)', borderRadius: '8px', textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Phase Two:</strong> {ORACLE_THRESHOLD}-of-{oracles.length || ACTIVE_ORACLE_COUNT} oracle consensus | MuSig2 aggregate signing (v0x03)
          </Typography>
        </Box>
      )}
    </Card>
  );

  const OracleSitrepSection = () => (
    <Card elevation={3} sx={{ p: 3, mb: 4, borderRadius: '12px', borderTop: `4px solid ${consensusReady ? '#2e7d32' : '#ed6c02'}` }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <VerifiedIcon sx={{ fontSize: '2rem', color: consensusReady ? '#2e7d32' : '#ed6c02', mr: 1 }} />
          <Typography variant="h5" fontWeight="bold" sx={{ color: isTestnet ? '#2e7d32' : '#002352' }}>
            Oracle Operator Sitrep
          </Typography>
        </Box>
        <Chip
          label={consensusReady ? 'consensus ready' : 'below ready threshold'}
          color={consensusReady ? 'success' : 'warning'}
          size="small"
        />
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <SitrepMetric
            label="Price Reporters"
            value={`${reportingCount}/${oracles.length || ACTIVE_ORACLE_COUNT}`}
            detail={`${ORACLE_THRESHOLD} valid price feeds required`}
            ok={reportingCount >= ORACLE_THRESHOLD}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SitrepMetric
            label="Fresh Heartbeats"
            value={`${freshHeartbeatCount}/${oracles.length || ACTIVE_ORACLE_COUNT}`}
            detail="signed operator status, fresh under 30 minutes"
            ok={freshHeartbeatCount >= ORACLE_THRESHOLD}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SitrepMetric
            label="RC38 MuSig2 Context"
            value={`${rc38ContextCount}/${oracles.length || ACTIVE_ORACLE_COUNT}`}
            detail={`MuSig2 context ${EXPECTED_MUSIG2_CONTEXT_VERSION}+ with valid heartbeat`}
            ok={rc38ContextCount >= ORACLE_THRESHOLD}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SitrepMetric
            label="Selected This Epoch"
            value={`${selectedCount}/${oracles.length || ACTIVE_ORACLE_COUNT}`}
            detail={`${locallyRunningCount} local oracle slot${locallyRunningCount === 1 ? '' : 's'} visible`}
            ok={selectedCount >= ORACLE_THRESHOLD}
          />
        </Grid>
      </Grid>
    </Card>
  );

  // What Are Oracles Section
  const WhatAreOraclesSection = () => (
    <Card elevation={3} sx={{ p: 3, mb: 4, borderRadius: '12px' }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, color: isTestnet ? '#2e7d32' : '#002352' }}>
        What Are Oracles?
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              <strong>The Blockchain Blind Spot:</strong> Blockchains are isolated by design - they can't access
              the internet or "see" outside their own network. Without oracles, the blockchain has no idea what
              DGB is worth in USD.
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              <strong>With Oracles:</strong> The blockchain receives verified price feeds from the real world.
              Now it knows: "1,000 DGB = $6.03 USD at block height 1,234,567"
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2, backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
              How It Works:
            </Typography>
            <Box component="ol" sx={{ pl: 2, m: 0 }}>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                Oracles fetch prices from 7 exchanges (Binance, KuCoin, Gate.io, HTX, Crypto.com, CoinGecko, CoinMarketCap)
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                Calculate median price with MAD outlier filtering
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                Sign price data with BIP-340 Schnorr signatures
              </Typography>
              <Typography component="li" variant="body2">
                Broadcast to P2P network - all nodes validate and relay
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Card>
  );

  // Become an Oracle Operator Section
  const BecomeOracleSection = () => (
    <Card elevation={3} sx={{ p: 3, mb: 4, borderRadius: '12px', backgroundColor: '#fafafa' }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, color: isTestnet ? '#2e7d32' : '#002352' }}>
        Become an Oracle Operator
      </Typography>

      <Typography variant="body1" sx={{ mb: 3 }}>
        Help secure the DigiDollar network by running an oracle node. It's a simple 3-step process:
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, textAlign: 'center', height: '100%', borderTop: `4px solid ${isTestnet ? '#4caf50' : '#0066cc'}` }}>
            <KeyIcon sx={{ fontSize: '3rem', color: isTestnet ? '#4caf50' : '#0066cc', mb: 2 }} />
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
              Step 1: Create Oracle Key
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Run <code>createoraclekey</code> in your DigiByte Core wallet to generate a secure keypair.
              The private key stays in your wallet - never leaves.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, textAlign: 'center', height: '100%', borderTop: `4px solid ${isTestnet ? '#4caf50' : '#0066cc'}` }}>
            <SendIcon sx={{ fontSize: '3rem', color: isTestnet ? '#4caf50' : '#0066cc', mb: 2 }} />
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
              Step 2: Submit Public Key
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Send your public key to the DigiByte Core developers via GitHub.
              Only the public key is shared - your private key stays secure.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, textAlign: 'center', height: '100%', borderTop: `4px solid ${isTestnet ? '#4caf50' : '#0066cc'}` }}>
            <CloudDoneIcon sx={{ fontSize: '3rem', color: isTestnet ? '#4caf50' : '#0066cc', mb: 2 }} />
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
              Step 3: Start Oracle
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Once included in a release, run <code>startoracle</code> and your node
              will automatically fetch prices and broadcast to the network.
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<DescriptionIcon />}
          href="https://github.com/DigiByte-Core/digibyte/blob/feature/digidollar-v1/DIGIDOLLAR_ORACLE_SETUP.md"
          target="_blank"
          sx={{
            backgroundColor: isTestnet ? '#2e7d32' : '#002352',
            '&:hover': { backgroundColor: isTestnet ? '#1b5e20' : '#001c41' }
          }}
        >
          Oracle Setup Guide
        </Button>
        <Button
          variant="outlined"
          startIcon={<GitHubIcon />}
          href="https://github.com/DigiByte-Core/digibyte/issues"
          target="_blank"
          sx={{
            borderColor: isTestnet ? '#2e7d32' : '#002352',
            color: isTestnet ? '#2e7d32' : '#002352'
          }}
        >
          Submit Your Key on GitHub
        </Button>
      </Box>
    </Card>
  );

  // Oracle List Table
  const OracleListSection = () => {
    return (
      <Card elevation={3} sx={{ p: 3, mb: 4, borderRadius: '12px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <SecurityIcon sx={{ fontSize: '2rem', color: isTestnet ? '#2e7d32' : '#002352', mr: 1 }} />
          <Typography variant="h5" fontWeight="bold" sx={{ color: isTestnet ? '#2e7d32' : '#002352' }}>
            Testnet Oracle Network
          </Typography>
          {oracles.length > 0 ? (
            <Chip
              label={`${reportingCount} / ${oracles.length} Online Reporting`}
              color={reportingCount >= ORACLE_THRESHOLD ? 'success' : 'warning'}
              size="small"
              sx={{ ml: 2 }}
            />
          ) : (
            <Chip
              label="Not Reporting"
              color="default"
              size="small"
              sx={{ ml: 2 }}
            />
          )}
        </Box>

        {loading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={40} sx={{ color: isTestnet ? '#2e7d32' : '#002352' }} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Loading oracle network...</Typography>
          </Box>
        ) : oracles.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
            <CloudOffIcon sx={{ fontSize: '3rem', color: '#9e9e9e', mb: 1 }} />
            <Typography variant="h6" color="text.secondary">No Oracle Data Available</Typography>
            <Typography variant="body2" color="text.secondary">Unable to fetch oracle network status</Typography>
          </Box>
        ) : (
          <>

        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
          <Table>
            <TableHead sx={{ backgroundColor: isTestnet ? 'rgba(46, 125, 50, 0.1)' : 'rgba(0, 35, 82, 0.05)' }}>
              <TableRow>
                <TableCell>
                  <Tooltip title="Oracle operator name and unique identifier" arrow>
                    <strong style={{ cursor: 'help' }}>Oracle</strong>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip title="Reporting = actively broadcasting prices. No Data = not currently online" arrow>
                    <strong style={{ cursor: 'help' }}>Status</strong>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip title="Current price this oracle is reporting to the network" arrow>
                    <strong style={{ cursor: 'help' }}>Price</strong>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip title="Signed RC38 operator heartbeat and software/protocol versions reported by this oracle" arrow>
                    <strong style={{ cursor: 'help' }}>Heartbeat / Version</strong>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip title="Whether this oracle is selected for the current epoch's MuSig2 signing set" arrow>
                    <strong style={{ cursor: 'help' }}>Epoch Role</strong>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip title="P2P network address where this oracle broadcasts price updates" arrow>
                    <strong style={{ cursor: 'help' }}>Endpoint</strong>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip title="BIP-340 Schnorr public key used to verify this oracle's signatures" arrow>
                    <strong style={{ cursor: 'help' }}>Public Key</strong>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip title="Whether this oracle's price signature is cryptographically valid" arrow>
                    <strong style={{ cursor: 'help' }}>Signature</strong>
                  </Tooltip>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {oracles.map((oracle) => (
                <TableRow
                  key={oracle.oracle_id}
                  sx={{
                    backgroundColor: oracle.status === 'reporting' ? 'transparent' : 'rgba(0,0,0,0.02)',
                    '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' }
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body2" fontWeight="bold" sx={{ color: isTestnet ? '#2e7d32' : '#002352' }}>
                        {oracle.name || `Oracle ${oracle.oracle_id}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {oracle.oracle_id}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {oracle.status === 'reporting' ? (
                        <CloudDoneIcon sx={{ color: '#4caf50' }} />
                      ) : (
                        <CloudOffIcon sx={{ color: '#9e9e9e' }} />
                      )}
                      <Chip
                        label={oracle.status === 'reporting' ? 'reporting' : 'no data'}
                        size="small"
                        color={oracle.status === 'reporting' ? 'success' : 'default'}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      sx={{ color: oracle.status === 'reporting' ? (isTestnet ? '#2e7d32' : '#002352') : '#9e9e9e' }}
                    >
                      {oracle.status === 'reporting' ? formatPrice(oracle.price_micro_usd) : '--'}
                    </Typography>
                    {oracle.deviation_pct != null && oracle.deviation_pct !== 0 && (
                      <Typography variant="caption" color={Math.abs(oracle.deviation_pct) > 5 ? 'error' : 'text.secondary'}>
                        {oracle.deviation_pct > 0 ? '+' : ''}{oracle.deviation_pct.toFixed(2)}%
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {oracle.price_source !== 'none' ? oracle.price_source : 'no price source'} · {formatTimestampAge(oracle.timestamp)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 150 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label={oracle.heartbeat_status || 'unknown'}
                          size="small"
                          color={getHeartbeatChipColor(oracle.heartbeat_status, oracle.heartbeat_signature_valid)}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {formatAgeSeconds(oracle.heartbeat_age_seconds)}
                        </Typography>
                      </Box>
                      <Typography variant="body2" fontWeight="bold" sx={{ color: oracle.software_version ? (isTestnet ? '#2e7d32' : '#002352') : '#9e9e9e' }}>
                        {oracle.software_version || 'No version reported'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        MuSig2 ctx {oracle.musig2_context_version || '--'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Client {oracle.client_version || '--'} · P2P {oracle.p2p_protocol_version || '--'} · Oracle {oracle.oracle_protocol_version || '--'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                      <Chip
                        label={oracle.selected_for_epoch ? 'selected' : 'standby'}
                        size="small"
                        color={oracle.selected_for_epoch ? 'success' : 'default'}
                        variant={oracle.selected_for_epoch ? 'filled' : 'outlined'}
                      />
                      <Chip
                        label={oracle.in_consensus ? 'in consensus' : 'reserve'}
                        size="small"
                        color={oracle.in_consensus ? 'primary' : 'default'}
                        variant="outlined"
                      />
                      {oracle.is_running_locally && (
                        <Chip label="local" size="small" color="info" variant="outlined" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      {oracle.endpoint}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {oracle.pubkey ? (
                      <Tooltip title={`${oracle.pubkey} (Click to view in source code)`}>
                        <Link
                          href={`https://github.com/DigiByte-Core/digibyte/blob/feature/digidollar-v1/src/kernel/chainparams.cpp#L${553 + oracle.oracle_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            maxWidth: '150px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: 'block',
                            textDecoration: 'none',
                            color: isTestnet ? '#2e7d32' : '#002352',
                            '&:hover': {
                              textDecoration: 'underline',
                              color: isTestnet ? '#4caf50' : '#0066cc'
                            }
                          }}
                        >
                          {oracle.pubkey.substring(0, 10)}...{oracle.pubkey.substring(oracle.pubkey.length - 8)}
                        </Link>
                      </Tooltip>
                    ) : (
                      <Typography variant="body2" color="text.secondary">--</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        {oracle.signature_valid ? (
                          <Tooltip title="Price signature cryptographically valid">
                            <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 20 }} />
                          </Tooltip>
                        ) : (
                          <Tooltip title="No valid price signature (oracle not reporting)">
                            <ErrorIcon sx={{ color: '#9e9e9e', fontSize: 20 }} />
                          </Tooltip>
                        )}
                        <Typography variant="caption" color="text.secondary">price</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        {oracle.heartbeat_signature_valid ? (
                          <Tooltip title="Heartbeat signature cryptographically valid">
                            <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 20 }} />
                          </Tooltip>
                        ) : (
                          <Tooltip title="No valid heartbeat signature">
                            <ErrorIcon sx={{ color: '#9e9e9e', fontSize: 20 }} />
                          </Tooltip>
                        )}
                        <Typography variant="caption" color="text.secondary">heartbeat</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Price Format:</strong> Oracle prices use micro-USD format where 1,000,000 = $1.00.
            This ensures exact arithmetic with no floating-point errors. Consensus requires {ORACLE_THRESHOLD}-of-{oracles.length || ACTIVE_ORACLE_COUNT} oracles on testnet.
          </Typography>
        </Box>
        </>
        )}
      </Card>
    );
  };

  // Technical Details Section
  const TechnicalSection = () => (
    <Card elevation={3} sx={{ p: 3, mb: 4, borderRadius: '12px' }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, color: isTestnet ? '#2e7d32' : '#002352' }}>
        Technical Specifications
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
              Phase Two (Testnet)
            </Typography>
            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>9-of-17 oracle consensus</Typography>
              <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>17 oracle slots (IDs 0-16)</Typography>
              <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>MuSig2 aggregate signing (v0x03) with individual fallback (v0x02)</Typography>
              <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>Price updates every 15 seconds</Typography>
              <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>Compact 22-byte storage per block</Typography>
              <Typography component="li" variant="body2">BIP-340 Schnorr signatures</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
              Mainnet (Planned)
            </Typography>
            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>MuSig2 aggregate signing (v0x03)</Typography>
              <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>Expanded oracle network</Typography>
              <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>BIP9 activation for deployment</Typography>
              <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>Same consensus mechanism as testnet</Typography>
              <Typography component="li" variant="body2">Production oracle endpoints</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
          Price Validation Limits:
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip label="Min: $0.0001/DGB (100 micro-USD)" variant="outlined" />
          <Chip label="Max: $100.00/DGB (100M micro-USD)" variant="outlined" />
          <Chip label="Valid for 20 blocks" variant="outlined" />
        </Box>
      </Box>
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
      <CurrentPriceCard />
      <OracleSitrepSection />
      <OracleListSection />
      <WhatAreOraclesSection />
      <BecomeOracleSection />
      <TechnicalSection />
      <IntegrationGuides />
    </Container>
  );
};

export default OraclesPage;
