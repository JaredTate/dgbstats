import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Box, Grid, Card, CardContent,
  Divider, Chip, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Alert, Button, LinearProgress,
  Tooltip, IconButton, Link, CircularProgress
} from '@mui/material';
import SensorsIcon from '@mui/icons-material/Sensors';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import UpdateIcon from '@mui/icons-material/Update';
import SecurityIcon from '@mui/icons-material/Security';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import GitHubIcon from '@mui/icons-material/GitHub';
import DescriptionIcon from '@mui/icons-material/Description';
import KeyIcon from '@mui/icons-material/Key';
import SendIcon from '@mui/icons-material/Send';
import VerifiedIcon from '@mui/icons-material/Verified';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNetwork } from '../context/NetworkContext';
import config from '../config';

// Default mock data for fallback when API is unavailable
const DEFAULT_ORACLE_PRICE = {
  price_micro_usd: 50000,
  price_usd: 0.05,
  oracle_count: 5,
  status: 'active',
  last_update_height: 2000,
  is_stale: false,
  '24h_high': 5,
  '24h_low': 5,
  volatility: 2.5
};

// Default oracle data matching getalloracleprices format
const DEFAULT_ORACLES = [
  { oracle_id: 0, name: 'Jared', pubkey: '03e1dce189a530c1fb39dcd9282cf5f9de0e4eb257344be9fd94ce27c06005e8c7', endpoint: 'oracle1.digibyte.io:12030', price_micro_usd: 50000, price_usd: 0.05, timestamp: 0, signature_valid: true, status: 'reporting' },
  { oracle_id: 1, name: 'Green Candle', pubkey: '033dfb7a36ab40fa6fbc69b4b499eaa17bfa1958aa89ec248efc24b4c18694f990', endpoint: 'oracle2.digibyte.io:12030', price_micro_usd: 50000, price_usd: 0.05, timestamp: 0, signature_valid: true, status: 'reporting' },
  { oracle_id: 2, name: 'Bastian', pubkey: '03172755a320cec96c981d46c86d79a03578d73406a25e89d8edc616a8f361cb5c', endpoint: 'oracle3.digibyte.io:12030', price_micro_usd: 0, price_usd: 0, timestamp: 0, signature_valid: false, status: 'no_data' },
  { oracle_id: 3, name: 'DanGB', pubkey: '03546c07ee9d21640c4b4e96e6954bd49c3ab5bcf36c6a512603ebf75f8609da0c', endpoint: 'oracle4.digibyte.io:12030', price_micro_usd: 50000, price_usd: 0.05, timestamp: 0, signature_valid: true, status: 'reporting' },
  { oracle_id: 4, name: 'Shenger', pubkey: '039cef021f841794c1afc4e84d678f3c70dbe3a972330b2b6329852898443deb4f', endpoint: 'oracle5.digibyte.io:12030', price_micro_usd: 50000, price_usd: 0.05, timestamp: 0, signature_valid: true, status: 'reporting' },
  { oracle_id: 5, name: 'Ycagel', pubkey: '0285016758856ed27388501a54031fa3a678df705bf811fb8bc9abd2d7cfb6d9f7', endpoint: 'oracle6.digibyte.io:12030', price_micro_usd: 50000, price_usd: 0.05, timestamp: 0, signature_valid: true, status: 'reporting' },
  { oracle_id: 6, name: 'Aussie', pubkey: '02ec2122bab83d1199350d5bd3e5e88b305da873211b1876edd5170fbe9c7f962e', endpoint: 'oracle7.digibyte.io:12030', price_micro_usd: 0, price_usd: 0, timestamp: 0, signature_valid: false, status: 'no_data' },
];

/**
 * OraclesPage Component - DigiDollar Oracle Network Status (Testnet Only)
 *
 * Displays real-time information about the decentralized oracle network
 * that provides DGB/USD price feeds for the DigiDollar system.
 */
const OraclesPage = () => {
  const { theme: networkTheme, isTestnet } = useNetwork();

  // State for oracle data
  const [oraclePrice, setOraclePrice] = useState(DEFAULT_ORACLE_PRICE);
  const [oracles, setOracles] = useState(DEFAULT_ORACLES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch oracle data from API
  const fetchOracleData = useCallback(async () => {
    try {
      setError(null);

      // Fetch oracle price and detailed oracle data in parallel
      const [priceResponse, allOraclePricesResponse, oraclesConfigResponse] = await Promise.all([
        fetch(`${config.apiBaseUrl}/api/testnet/getoracleprice`),
        fetch(`${config.apiBaseUrl}/api/testnet/getalloracleprices`),
        fetch(`${config.apiBaseUrl}/api/testnet/getoracles`)
      ]);

      if (!priceResponse.ok || !allOraclePricesResponse.ok) {
        throw new Error('Failed to fetch oracle data from API');
      }

      const priceData = await priceResponse.json();
      const allOraclePricesData = await allOraclePricesResponse.json();
      const oraclesConfigData = oraclesConfigResponse.ok ? await oraclesConfigResponse.json() : [];

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

      // Merge oracle data from getalloracleprices (live status) with getoracles (pubkeys)
      const mappedOracles = (allOraclePricesData.oracles || []).map(oracle => {
        // Find matching config data to get pubkey
        const configData = oraclesConfigData.find(o => o.oracle_id === oracle.oracle_id) || {};
        return {
          oracle_id: oracle.oracle_id,
          name: oracle.name,
          pubkey: configData.pubkey || '',
          endpoint: oracle.endpoint,
          price_micro_usd: oracle.price_micro_usd || 0,
          price_usd: oracle.price_usd || 0,
          timestamp: oracle.timestamp || 0,
          deviation_pct: oracle.deviation_pct || 0,
          signature_valid: oracle.signature_valid,
          status: oracle.status || 'no_data',
          is_running: oracle.status === 'reporting'
        };
      });

      setOracles(mappedOracles);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      console.error('Error fetching oracle data:', err);
      setError('Unable to fetch live oracle data. Showing cached/mock data.');
      setLoading(false);
      // Keep existing data as fallback
    }
  }, []);

  // Initial data fetch and refresh interval
  useEffect(() => {
    fetchOracleData();

    // Refresh every 30 seconds
    const interval = setInterval(fetchOracleData, 30000);

    return () => clearInterval(interval);
  }, [fetchOracleData]);

  // Format price from micro-USD to display format
  const formatPrice = (microUsd) => {
    if (!microUsd || microUsd === 0) return '--';
    return '$' + (microUsd / 1000000).toFixed(6);
  };

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
      {/* Error Alert */}
      {error && (
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
          <Tooltip title="Refresh data">
            <IconButton
              onClick={fetchOracleData}
              disabled={loading}
              size="small"
              sx={{ color: isTestnet ? '#2e7d32' : '#002352' }}
            >
              {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Tooltip title="Consensus price from oracle network - median of all active oracle price feeds with outlier filtering" arrow placement="top">
            <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#f5f5f5', borderRadius: '8px', cursor: 'help' }}>
              <Typography variant="body2" color="text.secondary">DGB/USD Price</Typography>
              <Typography variant="h3" fontWeight="bold" sx={{ color: isTestnet ? '#2e7d32' : '#002352' }}>
                {formatPrice(oraclePrice.price_micro_usd)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {oraclePrice.price_micro_usd.toLocaleString()} micro-USD
              </Typography>
            </Box>
          </Tooltip>
        </Grid>
        <Grid item xs={12} md={4}>
          <Tooltip title="Number of oracles contributing to network price consensus. Requires 4-of-7 for consensus on testnet" arrow placement="top">
            <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#f5f5f5', borderRadius: '8px', cursor: 'help' }}>
              <Typography variant="body2" color="text.secondary">Network Oracles</Typography>
              <Typography variant="h3" fontWeight="bold" sx={{ color: isTestnet ? '#2e7d32' : '#002352' }}>
                {oraclePrice.oracle_count || 0} / 7
              </Typography>
              <Chip
                label={oraclePrice.oracle_count >= 4 ? 'consensus' : 'no consensus'}
                color={oraclePrice.oracle_count >= 4 ? 'success' : 'warning'}
                size="small"
                sx={{ mt: 1 }}
              />
            </Box>
          </Tooltip>
        </Grid>
        <Grid item xs={12} md={4}>
          <Tooltip title="Block height when the oracle price was last updated. Price becomes stale after 20 blocks without update" arrow placement="top">
            <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#f5f5f5', borderRadius: '8px', cursor: 'help' }}>
              <Typography variant="body2" color="text.secondary">Last Update</Typography>
              <Typography variant="h4" fontWeight="bold" sx={{ color: isTestnet ? '#2e7d32' : '#002352' }}>
                Block {oraclePrice.last_update_height?.toLocaleString()}
              </Typography>
              <Chip
                label={oraclePrice.is_stale ? 'Stale' : 'Fresh'}
                color={oraclePrice.is_stale ? 'error' : 'success'}
                size="small"
                sx={{ mt: 1 }}
              />
            </Box>
          </Tooltip>
        </Grid>
      </Grid>

      {isTestnet && (
        <Box sx={{ mt: 2, p: 1.5, backgroundColor: 'rgba(46, 125, 50, 0.08)', borderRadius: '8px', textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Phase Two:</strong> 4-of-7 oracle consensus | Mainnet: 8-of-15 threshold signatures
          </Typography>
        </Box>
      )}
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
    const reportingCount = oracles.filter(o => o.status === 'reporting').length;

    return (
      <Card elevation={3} sx={{ p: 3, mb: 4, borderRadius: '12px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <SecurityIcon sx={{ fontSize: '2rem', color: isTestnet ? '#2e7d32' : '#002352', mr: 1 }} />
          <Typography variant="h5" fontWeight="bold" sx={{ color: isTestnet ? '#2e7d32' : '#002352' }}>
            Testnet Oracle Network
          </Typography>
          <Chip
            label={`${reportingCount} / ${oracles.length} Reporting`}
            color={reportingCount >= 4 ? 'success' : 'warning'}
            size="small"
            sx={{ ml: 2 }}
          />
        </Box>

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
                          href={`https://github.com/DigiByte-Core/digibyte/blob/feature/digidollar-v1/src/kernel/chainparams.cpp#L${1070 + oracle.oracle_id}`}
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
                    {oracle.signature_valid ? (
                      <Tooltip title="Signature cryptographically valid">
                        <CheckCircleIcon sx={{ color: '#4caf50' }} />
                      </Tooltip>
                    ) : (
                      <Tooltip title="No valid signature (oracle not reporting)">
                        <ErrorIcon sx={{ color: '#9e9e9e' }} />
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Price Format:</strong> Oracle prices use micro-USD format where 1,000,000 = $1.00.
            This ensures exact arithmetic with no floating-point errors. Consensus requires 4-of-7 oracles on testnet.
          </Typography>
        </Box>
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
              <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>4-of-7 oracle consensus</Typography>
              <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>10 oracle slots (IDs 0-9)</Typography>
              <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>Price updates every 15 seconds</Typography>
              <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>Compact 22-byte storage per block</Typography>
              <Typography component="li" variant="body2">BIP-340 Schnorr signatures</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
              Phase Two (Mainnet)
            </Typography>
            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>8-of-15 Schnorr threshold signatures</Typography>
              <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>30 oracle slots (IDs 0-29)</Typography>
              <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>15 active oracles per epoch</Typography>
              <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>Epoch rotation for decentralization</Typography>
              <Typography component="li" variant="body2">Slashing for misbehavior</Typography>
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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <HeroSection />
      <CurrentPriceCard />
      <OracleListSection />
      <WhatAreOraclesSection />
      <BecomeOracleSection />
      <TechnicalSection />
    </Container>
  );
};

export default OraclesPage;
