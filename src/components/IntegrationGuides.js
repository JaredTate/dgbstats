import React from 'react';
import {
  Card, CardContent, Typography, Box, Grid, Button, Paper
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import LaunchIcon from '@mui/icons-material/Launch';
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions';

const DOC_BASE = 'https://github.com/DigiByte-Core/digibyte/blob/feature/digidollar-v1/';
const WALLET_GUIDE_URL = `${DOC_BASE}DIGIDOLLAR_WALLET_INTEGRATION.md`;
const EXCHANGE_GUIDE_URL = `${DOC_BASE}DIGIDOLLAR_EXCHANGE_INTEGRATION.md`;

// Core DigiDollar reference docs (in the DigiByte repo root). Code-aligned with v9.26.4.
const DIGIDOLLAR_DOCS = [
  { label: 'DigiDollar Explainer', file: 'DIGIDOLLAR_EXPLAINER.md' },
  { label: 'DigiDollar Architecture', file: 'DIGIDOLLAR_ARCHITECTURE.md' },
  { label: 'Oracle Explainer', file: 'DIGIDOLLAR_ORACLE_EXPLAINER.md' },
  { label: 'Oracle Architecture', file: 'DIGIDOLLAR_ORACLE_ARCHITECTURE.md' },
  { label: 'BIP9 Activation Explainer', file: 'DIGIDOLLAR_ACTIVATION_EXPLAINER.md' },
  { label: 'Mining Integration Guide', file: 'DIGIDOLLAR_MINING_INTEGRATION_GUIDE.md' },
];

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

      {/* Documentation & specifications */}
      <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid rgba(0, 35, 82, 0.12)' }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 1, color: '#002352' }}>
          Documentation &amp; Specifications
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, color: '#555' }}>
          The complete, code-aligned DigiDollar reference docs (DigiByte Core v9.26.4). Start with the
          DigiDollar Explainer for a plain-language overview, then dive into the architecture, oracle,
          and activation specifications.
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
          {DIGIDOLLAR_DOCS.map((doc) => (
            <Button
              key={doc.file}
              variant="outlined"
              size="small"
              endIcon={<LaunchIcon sx={{ fontSize: '0.9rem' }} />}
              href={`${DOC_BASE}${doc.file}`}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                borderColor: 'rgba(0, 102, 204, 0.4)',
                color: '#0066cc',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { borderColor: '#0066cc', backgroundColor: 'rgba(0, 102, 204, 0.05)' }
              }}
            >
              {doc.label}
            </Button>
          ))}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export default IntegrationGuides;
