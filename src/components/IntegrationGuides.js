import React from 'react';
import {
  Card, CardContent, Typography, Box, Grid, Button, Paper
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import LaunchIcon from '@mui/icons-material/Launch';
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions';

const WALLET_GUIDE_URL = 'https://github.com/DigiByte-Core/digibyte/blob/feature/digidollar-v1/DIGIDOLLAR_WALLET_INTEGRATION.md';
const EXCHANGE_GUIDE_URL = 'https://github.com/DigiByte-Core/digibyte/blob/feature/digidollar-v1/DIGIDOLLAR_EXCHANGE_INTEGRATION.md';

/**
 * IntegrationGuides - Reusable section linking to DigiDollar integration docs
 *
 * Used on DigiDollarPage, OraclesPage, DDStatsPage, and DDActivationPage
 * to direct wallet/exchange developers to integration documentation.
 */
const IntegrationGuides = () => (
  <Card
    elevation={3}
    sx={{
      borderRadius: '12px',
      mt: 4,
      mb: 4,
      overflow: 'hidden',
      border: '2px solid #0066cc'
    }}
  >
    <Box
      sx={{
        background: 'linear-gradient(135deg, #002352 0%, #0066cc 100%)',
        py: 2,
        px: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5
      }}
    >
      <IntegrationInstructionsIcon sx={{ color: 'white', fontSize: '1.8rem' }} />
      <Typography variant="h5" fontWeight="bold" sx={{ color: 'white' }}>
        DigiDollar Integration Guides
      </Typography>
    </Box>

    <CardContent sx={{ p: 3 }}>
      <Typography variant="body1" sx={{ mb: 3, color: '#555' }}>
        Ready to integrate DigiDollar into your wallet or exchange? These guides cover everything
        you need to get started, including testnet quick start so you can begin integrating right now.
      </Typography>

      <Grid container spacing={3}>
        {/* Wallet Integration */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={1}
            sx={{
              p: 3,
              height: '100%',
              borderRadius: '12px',
              border: '1px solid rgba(0, 102, 204, 0.2)',
              backgroundColor: 'rgba(0, 102, 204, 0.03)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <AccountBalanceWalletIcon sx={{ color: '#0066cc', fontSize: '2rem' }} />
              <Typography variant="h6" fontWeight="bold" color="#002352">
                Wallet Integration
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ mb: 2, color: '#555', flex: 1 }}>
              For wallet providers who already support DigiByte. Covers DD/TD address generation,
              balance tracking, minting with all 10 lock tiers, sending/receiving DD, collateral
              management, redemption, and full RPC reference.
            </Typography>
            <Button
              variant="contained"
              endIcon={<LaunchIcon />}
              href={WALLET_GUIDE_URL}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                backgroundColor: '#002352',
                '&:hover': { backgroundColor: '#001c41' },
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Wallet Integration Guide
            </Button>
          </Paper>
        </Grid>

        {/* Exchange Integration */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={1}
            sx={{
              p: 3,
              height: '100%',
              borderRadius: '12px',
              border: '1px solid rgba(0, 102, 204, 0.2)',
              backgroundColor: 'rgba(0, 35, 82, 0.03)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <CurrencyExchangeIcon sx={{ color: '#0066cc', fontSize: '2rem' }} />
              <Typography variant="h6" fontWeight="bold" color="#002352">
                Exchange Integration
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ mb: 2, color: '#555', flex: 1 }}>
              For exchanges that already support DigiByte. Covers deposit detection, withdrawal
              processing, confirmation thresholds, hot wallet architecture, DGB fee requirements,
              and essential RPCs. Includes common pitfalls like filtering 0-sat DD outputs.
            </Typography>
            <Button
              variant="contained"
              endIcon={<LaunchIcon />}
              href={EXCHANGE_GUIDE_URL}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                backgroundColor: '#0066cc',
                '&:hover': { backgroundColor: '#0052a3' },
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Exchange Integration Guide
            </Button>
          </Paper>
        </Grid>
      </Grid>

      <Typography
        variant="caption"
        sx={{ mt: 2, display: 'block', textAlign: 'center', color: '#999' }}
      >
        Both guides include a testnet quick start — begin integrating on testnet today
      </Typography>
    </CardContent>
  </Card>
);

export default IntegrationGuides;
