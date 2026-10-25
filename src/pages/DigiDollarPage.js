import React from 'react';
import {
  Container, Typography, Box, Card, CardContent, Grid,
  Divider, Chip, Button, List, ListItem, ListItemIcon,
  ListItemText, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Alert
} from '@mui/material';
import {
  Timeline, TimelineItem, TimelineSeparator,
  TimelineConnector, TimelineContent, TimelineDot, TimelineOppositeContent
} from '@mui/lab';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';
import CodeIcon from '@mui/icons-material/Code';
import GroupIcon from '@mui/icons-material/Group';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ConstructionIcon from '@mui/icons-material/Construction';
import LaunchIcon from '@mui/icons-material/Launch';
import DescriptionIcon from '@mui/icons-material/Description';
import SendIcon from '@mui/icons-material/Send';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ListAltIcon from '@mui/icons-material/ListAlt';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import IntegrationGuides from '../components/IntegrationGuides';
import { CORE_RELEASE } from '../coreRelease';

/**
 * DigiDollarPage Component - Explainer for the DigiDollar Decentralized Stablecoin
 *
 * Plain, factual explainer for the DigiDollar stablecoin on the DigiByte blockchain:
 * how it works, its risks, collateral math and implementation details. Keep the copy
 * free of price or investment language (see the 'No investment or price language' tests).
 */
const DigiDollarPage = () => {

  // Collateral requirements data (10-tier system)
  const collateralData = [
    { period: '1 hour', ratio: '1000%', dgbFor100: '1000 DGB', undercollateralized: '90% drop' },
    { period: '30 days', ratio: '500%', dgbFor100: '500 DGB', undercollateralized: '80% drop' },
    { period: '3 months', ratio: '400%', dgbFor100: '400 DGB', undercollateralized: '75% drop' },
    { period: '6 months', ratio: '350%', dgbFor100: '350 DGB', undercollateralized: '71.4% drop' },
    { period: '1 year', ratio: '300%', dgbFor100: '300 DGB', undercollateralized: '66.7% drop' },
    { period: '2 years', ratio: '275%', dgbFor100: '275 DGB', undercollateralized: '63.6% drop' },
    { period: '3 years', ratio: '250%', dgbFor100: '250 DGB', undercollateralized: '60% drop' },
    { period: '5 years', ratio: '225%', dgbFor100: '225 DGB', undercollateralized: '55.6% drop' },
    { period: '7 years', ratio: '212%', dgbFor100: '212 DGB', undercollateralized: '52.8% drop' },
    { period: '10 years', ratio: '200%', dgbFor100: '200 DGB', undercollateralized: '50% drop' },
  ];

  // Hero Section
  const HeroSection = () => (
    <Card
      elevation={2}
      sx={{
        backgroundColor: '#f2f4f8',
        borderRadius: '12px',
        mb: 4,
        overflow: 'hidden',
        backgroundImage: 'linear-gradient(135deg, #f8f9fa 0%, #e8eef7 100%)',
        border: '1px solid rgba(0, 35, 82, 0.1)'
      }}
    >
      <CardContent sx={{ py: 4, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
          <AttachMoneyIcon sx={{ fontSize: '3rem', color: '#002352', mr: 2 }} />
          <Typography
            variant="h2"
            component="h1"
            fontWeight="800"
            sx={{
              color: '#002352',
              letterSpacing: '0.5px',
              fontSize: { xs: '1.8rem', sm: '2.3rem', md: '2.8rem' }
            }}
          >
            DigiDollar
          </Typography>
        </Box>

        <Typography
          variant="h5"
          sx={{
            color: '#0066cc',
            mb: 2,
            fontWeight: 600
          }}
        >
          Decentralized USD Stablecoin on DigiByte
        </Typography>

        <Divider sx={{ maxWidth: '150px', mx: 'auto', mb: 3, borderColor: '#0066cc', borderWidth: 2 }} />

        <Typography
          variant="subtitle1"
          sx={{
            maxWidth: '800px',
            mx: 'auto',
            mb: 2,
            color: '#555',
            fontSize: '1.1rem'
          }}
        >
          A time-locked UTXO stablecoin built into DigiByte Core, designed to track the US dollar.
          You create it by locking your own DGB in your own wallet. No company issues it.
        </Typography>

        <Typography
          variant="subtitle2"
          sx={{
            maxWidth: '700px',
            mx: 'auto',
            mb: 3,
            color: '#0066cc',
            fontSize: '1rem',
            fontWeight: 600
          }}
        >
          DGB is the collateral • Everything happens in the DigiByte Core wallet •
          You keep your private keys
        </Typography>

        <Alert
          severity="success"
          sx={{
            maxWidth: '700px',
            mx: 'auto',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            '& .MuiAlert-icon': { color: '#4caf50' }
          }}
        >
          <Typography variant="body2">
            <strong>Status:</strong> Active on mainnet since block 23,869,440 (July 17, 2026), first released in
            DigiByte v9.26.2.
            Current release: <strong>{CORE_RELEASE}</strong>. On mainnet and testnet26, 7 of the 35 oracles must
            sign each price, using MuSig2 (the 7 oracle signatures are combined into one).{' '}
            <strong>Network upgrade:</strong> before mainnet block 24,490,000, run minimum v9.26.6, recommended{' '}
            {CORE_RELEASE} (Thaw Day: the block where new DigiDollar rules start, expected around November 1, 2026).
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );

  // Disclaimer Section (shown right below the hero)
  const DisclaimerSection = () => (
    <Alert
      severity="warning"
      icon={<WarningAmberIcon />}
      sx={{ mb: 4, borderRadius: '12px', '& .MuiAlert-message': { width: '100%' } }}
    >
      <Typography variant="h6" component="h2" fontWeight="bold" sx={{ mb: 1 }}>
        Experimental software. Please read.
      </Typography>
      <Typography variant="body2">
        DigiDollar is new, open-source software. It may have bugs. It depends on an oracle network for prices
        and on DigiByte network rules, which change through upgrades. You can lose money. Locked DGB cannot be
        unlocked before its lock ends, even if the DGB price falls. A DigiDollar is designed to track $1 USD,
        but its market price is not guaranteed. This page explains how the software works. It is not financial,
        investment, legal or tax advice, and it makes no promise of profit or returns. DigiByte has no company
        behind it, and nobody is selling DigiDollar or DGB on this page.
      </Typography>
    </Alert>
  );

  // Risks Section
  const risks = [
    ['Software risk.', 'DigiDollar is experimental. Bugs can cause loss or locked funds.'],
    ['Lock risk.', 'You cannot unlock early. To unlock, you must burn the full DigiDollar amount in one transaction. If you lose your keys or your DigiDollars, the DGB stays locked.'],
    ['Price risk.', "The DGB price can fall. A DigiDollar's market price can differ from $1."],
    ['Oracle risk.', 'Prices come from a 7-of-35 oracle network using 6 price sources. Wrong or missing prices can pause minting.'],
    ['Pauses and adjustments.', 'Sharp DGB price moves can pause minting. When system health is low, the Dynamic Collateral Adjustment (DCA) raises the collateral needed to mint, and the Emergency Redemption Ratio (ERR) raises the DigiDollars needed to redeem.'],
    ['Network upgrades.', `Rules change at mainnet block 24,490,000 (Thaw Day, expected around November 1, 2026). Node operators and miners must upgrade before then: minimum v9.26.6, recommended ${CORE_RELEASE}.`],
    ['Tax and legal.', 'Rules differ by country and may be unclear. Ask a qualified professional.'],
  ];

  const RisksSection = () => (
    <Card elevation={3} sx={{ p: 3, mb: 4, borderRadius: '12px', borderTop: '4px solid #ed6c02' }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 2, color: '#002352' }}>
        Risks
      </Typography>
      <List dense>
        {risks.map(([label, text]) => (
          <ListItem key={label} sx={{ alignItems: 'flex-start', pl: 0 }}>
            <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}><WarningAmberIcon sx={{ color: '#ed6c02' }} /></ListItemIcon>
            <ListItemText primary={<><strong>{label}</strong> {text}</>} />
          </ListItem>
        ))}
      </List>
    </Card>
  );

  // What is DigiDollar Section
  const WhatIsSection = () => (
    <Card elevation={3} sx={{ p: 3, mb: 4, borderRadius: '12px' }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3, color: '#002352' }}>
        What is DigiDollar?
      </Typography>

      {/* Collateral facts */}
      <Alert
        severity="info"
        sx={{
          mb: 3,
          backgroundColor: 'rgba(0, 35, 82, 0.05)',
          borderLeft: '4px solid #002352',
          '& .MuiAlert-icon': { color: '#002352' }
        }}
      >
        <Typography variant="body1">
          <strong>Collateral: DGB.</strong> DigiByte has a fixed maximum supply of 21 billion DGB
          and 15-second blocks.
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              backgroundColor: 'rgba(0, 102, 204, 0.05)',
              borderRadius: '8px',
              height: '100%'
            }}
          >
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#0066cc' }}>
              Simple Explanation
            </Typography>
            <Typography variant="body1" paragraph>
              DigiDollar is a stablecoin designed to track $1 USD. You create it by locking DGB
              as collateral. The DGB you lock is worth 2 to 10 times the DigiDollars you create,
              depending on how long you lock it.
            </Typography>
            <Typography variant="body1" paragraph>
              Unlike stablecoins backed by bank accounts, DigiDollar is backed by DGB locked
              on the DigiByte blockchain. No company or bank issues it.
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, color: '#002352' }}>
              Everything happens in your DigiByte Core wallet, and you keep your private keys.
              DigiDollar does rely on the oracle network for the DGB/USD price.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              backgroundColor: 'rgba(0, 35, 82, 0.05)',
              borderRadius: '8px',
              height: '100%'
            }}
          >
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#002352' }}>
              Key Features
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><CheckCircleIcon sx={{ color: '#4caf50' }} /></ListItemIcon>
                <ListItemText primary="Time-locked UTXO stablecoin built into DigiByte Core" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircleIcon sx={{ color: '#4caf50' }} /></ListItemIcon>
                <ListItemText primary="Designed to track $1 USD (market price not guaranteed)" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircleIcon sx={{ color: '#4caf50' }} /></ListItemIcon>
                <ListItemText primary="You keep your private keys in DigiByte Core wallet" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircleIcon sx={{ color: '#4caf50' }} /></ListItemIcon>
                <ListItemText primary="Backed by DGB locked on-chain" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircleIcon sx={{ color: '#4caf50' }} /></ListItemIcon>
                <ListItemText primary="15-second blocks. Fees paid in DGB (minimum 0.1 DGB per DigiDollar transaction)" />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Card>
  );

  // How It Works Section
  const HowItWorksSection = () => (
    <Card elevation={3} sx={{ p: 3, mb: 4, borderRadius: '12px' }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3, color: '#002352' }}>
        How It Works
      </Typography>

      {/* Core Idea - Simple Analogy */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          backgroundColor: 'rgba(0, 102, 204, 0.05)',
          borderLeft: '4px solid #0066cc',
          borderRadius: '8px'
        }}
      >
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, color: '#002352' }}>
          Core Idea: The Silver Safe Analogy
        </Typography>

        <Typography variant="body1" paragraph>
          <strong>Imagine DGB is silver.</strong> You lock $1,000 of silver in a time-locked safe
          in your own basement.
        </Typography>

        <Typography variant="body1" paragraph>
          The safe lets you take out $500 to spend. <strong>The silver stays yours</strong>, in your
          own safe, but you cannot open the safe until the timer ends.
        </Typography>

        <Typography variant="body1" paragraph>
          To open it, you put the $500 back and get back the same amount of silver you locked,
          whatever its price is then.
        </Typography>

        <Box sx={{ mt: 3, p: 2, backgroundColor: 'white', borderRadius: '8px' }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#0066cc' }}>
            DigiDollar works the same way:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><CheckCircleIcon sx={{ color: '#4caf50', fontSize: '1.2rem' }} /></ListItemIcon>
              <ListItemText primary="Lock DGB in YOUR wallet (never leaves your control)" />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircleIcon sx={{ color: '#4caf50', fontSize: '1.2rem' }} /></ListItemIcon>
              <ListItemText primary="You ALWAYS keep control of your private keys" />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircleIcon sx={{ color: '#4caf50', fontSize: '1.2rem' }} /></ListItemIcon>
              <ListItemText primary="Get DigiDollars to spend today" />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircleIcon sx={{ color: '#4caf50', fontSize: '1.2rem' }} /></ListItemIcon>
              <ListItemText primary="When the lock ends, burn the full DigiDollar amount → get back the DGB you locked" />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircleIcon sx={{ color: '#4caf50', fontSize: '1.2rem' }} /></ListItemIcon>
              <ListItemText primary="You cannot unlock early" />
            </ListItem>
          </List>
        </Box>
      </Paper>

      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, color: '#002352' }}>
        The Technical Process
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper
            elevation={1}
            sx={{
              p: 3,
              textAlign: 'center',
              backgroundColor: '#f8f9fa',
              height: '100%'
            }}
          >
            <LockIcon sx={{ fontSize: '3rem', color: '#0066cc', mb: 2 }} />
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              1. Lock DGB Collateral
            </Typography>
            <Typography variant="body2">
              Users lock DigiByte as collateral in a time-locked P2TR output.
              The amount depends on the lock period (200%-1000% of DigiDollar value,
              with shorter locks requiring more collateral).
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper
            elevation={1}
            sx={{
              p: 3,
              textAlign: 'center',
              backgroundColor: '#f8f9fa',
              height: '100%'
            }}
          >
            <AttachMoneyIcon sx={{ fontSize: '3rem', color: '#4caf50', mb: 2 }} />
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              2. Mint DigiDollars
            </Typography>
            <Typography variant="body2">
              DigiDollars are minted based on the locked DGB and the DGB/USD price from the
              oracle network. Each mint is at least $100 and at most $100,000.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper
            elevation={1}
            sx={{
              p: 3,
              textAlign: 'center',
              backgroundColor: '#f8f9fa',
              height: '100%'
            }}
          >
            <SwapHorizIcon sx={{ fontSize: '3rem', color: '#ff9800', mb: 2 }} />
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              3. Use & Redeem
            </Typography>
            <Typography variant="body2">
              Use DigiDollars for stable transactions. After the lock period expires,
              burn the required DigiDollars to unlock your full DGB collateral.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Card>
  );

  // Collateral Requirements Section
  const CollateralSection = () => (
    <Card elevation={3} sx={{ p: 3, mb: 4, borderRadius: '12px' }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3, color: '#002352' }}>
        Collateral Requirements
      </Typography>

      <Typography variant="body1" paragraph>
        Longer locks need less collateral. These are the protocol's fixed ratios, not price predictions:
      </Typography>

      <TableContainer component={Paper} elevation={0} role="region" aria-label="Collateral requirements" tabIndex={0} sx={{ backgroundColor: '#f8f9fa' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#002352' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Lock Period</TableCell>
              <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Collateral Ratio</TableCell>
              <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Undercollateralized After</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>DGB for $100</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {collateralData.map((row, index) => (
              <TableRow
                key={index}
                sx={{
                  '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 35, 82, 0.02)' },
                  ...(row.testOnly && { backgroundColor: 'rgba(255, 152, 0, 0.1)' })
                }}
              >
                <TableCell>
                  {row.period}
                  {row.testOnly && (
                    <Chip label="TEST" size="small" sx={{ ml: 1, fontSize: '0.6rem', height: '16px', backgroundColor: '#ff9800', color: 'white' }} />
                  )}
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={row.ratio}
                    size="small"
                    sx={{
                      backgroundColor: row.testOnly ? '#fff3e0' : (index < 5 ? '#ffebee' : '#e8f5e9'),
                      color: row.testOnly ? '#e65100' : (index < 5 ? '#c62828' : '#2e7d32'),
                      fontWeight: 'bold'
                    }}
                  />
                </TableCell>
                <TableCell align="center">{row.undercollateralized}</TableCell>
                <TableCell align="right">{row.dgbFor100}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>Note:</strong> 10-tier collateral system ranging from 1000% (1 hour) to 200% (10 years).
          The 1-hour tier is canonical on all networks (mainnet, testnet, and regtest) and locks real
          collateral until expiry. Mint validation enforces the canonical tier window declared in the
          mint OP_RETURN; under-locked or custom durations are rejected. The "Undercollateralized After"
          column shows how much DGB price can drop before a position becomes undercollateralized.
        </Typography>
      </Alert>
    </Card>
  );

  // Possible Uses Section
  const uses = [
    { icon: <AttachMoneyIcon sx={{ mr: 1, color: '#0066cc' }} />, title: 'Payments Priced in Dollars', text: 'Pay and get paid in a dollar-priced stablecoin on the DigiByte blockchain.' },
    { icon: <SendIcon sx={{ mr: 1, color: '#002352' }} />, title: 'Sending Money Across Borders', text: 'Send dollar-priced value to anyone with a DigiByte wallet. Fees are paid in DGB.' },
    { icon: <StorefrontIcon sx={{ mr: 1, color: '#4caf50' }} />, title: 'Merchant Checkout in Dollars', text: 'Merchants can price goods in dollars and accept DigiDollar.' },
    { icon: <PublicIcon sx={{ mr: 1, color: '#9c27b0' }} />, title: 'More Ideas', text: 'See the community discussion of possible uses (link below).' },
  ];

  const UseCasesSection = () => (
    <Card elevation={3} sx={{ p: 3, mb: 4, borderRadius: '12px' }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3, color: '#002352' }}>
        Possible Uses
      </Typography>

      <Grid container spacing={2}>
        {uses.map((u) => (
          <Grid item xs={12} md={6} key={u.title}>
            <Paper elevation={0} sx={{ p: 2, backgroundColor: 'rgba(0, 102, 204, 0.05)', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                {u.icon}
                <Typography variant="h6" fontWeight="bold">{u.title}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">{u.text}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Card>
  );

  // Technical Implementation Section
  const TechnicalSection = () => (
    <Card elevation={3} sx={{ p: 3, mb: 4, borderRadius: '12px' }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3, color: '#002352' }}>
        Technical Implementation
      </Typography>

      <Alert
        severity="success"
        sx={{
          mb: 3,
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          '& .MuiAlert-icon': { color: '#4caf50' }
        }}
      >
        <Typography variant="body2">
          <strong>Architecture:</strong> DigiDollar is a time-locked UTXO stablecoin built into
          DigiByte Core and uses DigiByte's UTXO (Unspent Transaction Output) model. All steps happen
          in the DigiByte Core wallet, and you keep your private keys.
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#0066cc' }}>
            Core Technologies
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon><CodeIcon sx={{ color: '#002352' }} /></ListItemIcon>
              <ListItemText
                primary="Taproot Integration"
                secondary="Enhanced privacy using P2TR outputs and Schnorr signatures"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><SecurityIcon sx={{ color: '#002352' }} /></ListItemIcon>
              <ListItemText
                primary="Decentralized Oracles"
                secondary="Live on mainnet and testnet26: 7-of-35 MuSig2 quorum. The signed price bundle (format v0x03) is in each block's coinbase."
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><SpeedIcon sx={{ color: '#002352' }} /></ListItemIcon>
              <ListItemText
                primary="MAST Implementation"
                secondary="Efficient script execution with Merkleized Alternative Script Trees"
              />
            </ListItem>
          </List>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#0066cc' }}>
            Key Features
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon><CheckCircleIcon sx={{ color: '#4caf50' }} /></ListItemIcon>
              <ListItemText primary="No forced liquidations. Your DGB stays locked until the lock ends, even if the DGB price falls." />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircleIcon sx={{ color: '#4caf50' }} /></ListItemIcon>
              <ListItemText primary="Native blockchain integration (no side chains)" />
            </ListItem>
          </List>
        </Grid>
      </Grid>
    </Card>
  );

  // Technical Implementation Details Section
  const TechnicalDetailsSection = () => (
    <Card elevation={3} sx={{ p: 3, mb: 4, borderRadius: '12px' }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3, color: '#002352' }}>
        Technical Implementation Details
      </Typography>

      <Typography variant="body1" paragraph>
        DigiDollar uses Bitcoin Script opcodes and DigiByte's own rules to create a decentralized
        stablecoin system that relies on an oracle network for price:
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              backgroundColor: 'rgba(0, 102, 204, 0.05)',
              borderRadius: '8px'
            }}
          >
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#0066cc' }}>
              Time Lock Mechanism
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><CodeIcon sx={{ color: '#002352' }} /></ListItemIcon>
                <ListItemText
                  primary="OP_CHECKLOCKTIMEVERIFY (CLTV)"
                  secondary="Enforces time-based collateral lock periods (1 hour to 10 years)"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><LockIcon sx={{ color: '#002352' }} /></ListItemIcon>
                <ListItemText
                  primary="nLockTime"
                  secondary="Prevents transactions from being mined until specified block height"
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              backgroundColor: 'rgba(0, 35, 82, 0.05)',
              borderRadius: '8px'
            }}
          >
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#002352' }}>
              Core Script Functions
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><SecurityIcon sx={{ color: '#0066cc' }} /></ListItemIcon>
                <ListItemText
                  primary="Oracle Validation"
                  secondary="Live on mainnet and testnet26: 7-of-35 MuSig2 quorum. The signed price bundle (format v0x03) is in each block's coinbase."
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><SecurityIcon sx={{ color: '#0066cc' }} /></ListItemIcon>
                <ListItemText
                  primary="Taproot Script Paths"
                  secondary="Multiple redemption conditions in a single P2TR output"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><SecurityIcon sx={{ color: '#0066cc' }} /></ListItemIcon>
                <ListItemText
                  primary="MAST Trees"
                  secondary="Merkleized scripts for privacy and efficiency"
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>

      <Paper
        elevation={1}
        sx={{
          p: 3,
          mt: 3,
          backgroundColor: '#f8f9fa',
          borderLeft: '4px solid #0066cc'
        }}
      >
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#002352' }}>
          How It Works - Simple Technical Flow
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" color="#0066cc" gutterBottom>
                1. Minting Process
              </Typography>
              <Typography variant="body2">
                The user creates a P2TR output with DGB collateral and a CLTV time lock.
                The price comes from the oracle bundle in the block's coinbase. Validation
                checks the collateral ratio and mints the DigiDollars.
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" color="#2e7d32" gutterBottom>
                2. Oracle Verification
              </Typography>
              <Typography variant="body2">
                35 oracle slots (0-34) with a 7-of-35 MuSig2 quorum on mainnet and testnet26.
                Six active exchange APIs (Binance, KuCoin, Gate.io, HTX,
                Crypto.com, CoinGecko) feed oracle signatures using MuSig2 aggregate signing (v0x03).
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" color="#b45309" gutterBottom>
                3. Redemption Process
              </Typography>
              <Typography variant="body2">
                After time lock expires (verified by CLTV), user can redeem
                DigiDollars to unlock DGB. Script burns DigiDollars and releases
                collateral to user's address.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Design:</strong> DigiDollar uses DigiByte's built-in script rules instead of a separate
          smart-contract platform. It has no custodian. It still carries software, oracle and network-upgrade
          risks (see Risks).
        </Typography>
      </Alert>
    </Card>
  );

  // Four-Layer Protection System Section
  const ProtectionSystemSection = () => (
    <Card elevation={3} sx={{ p: 3, mb: 4, borderRadius: '12px' }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3, color: '#002352' }}>
        How the System Handles Price Drops
      </Typography>

      <Alert
        severity="warning"
        sx={{
          mb: 3,
          backgroundColor: 'rgba(255, 152, 0, 0.1)',
          '& .MuiAlert-icon': { color: '#ff9800' }
        }}
      >
        <Typography variant="body2">
          <strong>The Time-Lock Challenge:</strong> Since collateral is cryptographically time-locked,
          there are NO forced liquidations or margin calls. Positions must ride out the full term
          regardless of market conditions. This requires a unique protection approach.
        </Typography>
      </Alert>

      <Grid container spacing={2}>
        {/* Layer 1 */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={1}
            sx={{
              p: 3,
              height: '100%',
              backgroundColor: '#f8f9fa',
              borderTop: '4px solid #002352'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold" color="#002352">
                1️⃣ Higher Collateral Requirements
              </Typography>
              <Chip label="First Defense" size="small" sx={{ ml: 'auto', backgroundColor: '#e3f2fd' }} />
            </Box>
            <Typography variant="body2" paragraph>
              With the 1000%→200% scale, DGB can fall 90% (1-hour tier) down to 50% (10-year tier)
              before a position is under-collateralized.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Example:</strong> With 1000% collateral, DGB can drop 90% before undercollateralization.
            </Typography>
          </Paper>
        </Grid>

        {/* Layer 2 */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={1}
            sx={{
              p: 3,
              height: '100%',
              backgroundColor: '#f8f9fa',
              borderTop: '4px solid #0066cc'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold" color="#0066cc">
                2️⃣ Dynamic Collateral Adjustment
              </Typography>
              <Chip label="Second Defense" size="small" sx={{ ml: 'auto', backgroundColor: '#e3f2fd' }} />
            </Box>
            <Typography variant="body2" paragraph>
              As system health changes, collateral requirements automatically adjust:
            </Typography>
            <List dense sx={{ pl: 0 }}>
              <ListItem sx={{ pl: 0, py: 0 }}>
                <Typography variant="caption">
                  • ≥150%: Normal (1.0x multiplier)
                </Typography>
              </ListItem>
              <ListItem sx={{ pl: 0, py: 0 }}>
                <Typography variant="caption">
                  • 120-149%: +25% collateral (1.25x)
                </Typography>
              </ListItem>
              <ListItem sx={{ pl: 0, py: 0 }}>
                <Typography variant="caption">
                  • 110-119%: +50% collateral (1.5x)
                </Typography>
              </ListItem>
              <ListItem sx={{ pl: 0, py: 0 }}>
                <Typography variant="caption">
                  • &lt;110%: +100% collateral (2.0x)
                </Typography>
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Layer 3 */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={1}
            sx={{
              p: 3,
              height: '100%',
              backgroundColor: '#f8f9fa',
              borderTop: '4px solid #ff9800'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold" color="#b45309">
                3️⃣ Emergency Redemption Ratio
              </Typography>
              <Chip label="Third Defense" size="small" sx={{ ml: 'auto', backgroundColor: '#fff3e0' }} />
            </Box>
            <Typography variant="body2" paragraph>
              If the system drops below 100% collateralized, ERR kicks in: redemptions require <strong>more DD to burn</strong>,
              and the collateral returned is not reduced.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>ERR Tiers:</strong> 95-100% → burn 105.3% DD | 90-95% → burn 111.1% DD | 85-90% → burn 117.6% DD | &lt;85% → burn 125% DD
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Example: At 80% system health, burn 125 DD to redeem a 100 DD position and unlock its collateral
            </Typography>
          </Paper>
        </Grid>

        {/* Layer 4 */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={1}
            sx={{
              p: 3,
              height: '100%',
              backgroundColor: '#f8f9fa',
              borderTop: '4px solid #4caf50'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold" color="#2e7d32">
                4️⃣ Volatility Pause
              </Typography>
              <Chip label="Fourth Defense" size="small" sx={{ ml: 'auto', backgroundColor: '#e8f5e9' }} />
            </Box>
            <Typography variant="body2" paragraph>
              Sharp DGB price moves pause new minting. From mainnet block 24,490,000 (Thaw Day), a mint
              is paused when the oracle price differs by 20% or more from the recent on-chain reference price.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Effect:</strong> No new DigiDollars are created during a sharp move. Sending and redeeming continue.
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Real-Time Monitoring Box */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mt: 3,
          backgroundColor: 'rgba(0, 35, 82, 0.05)',
          borderLeft: '4px solid #002352'
        }}
      >
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#002352' }}>
          🔍 Real-Time System Monitoring
        </Typography>
        <Typography variant="body2" paragraph>
          The system tracks health metrics so anyone can see its state:
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <List dense sx={{ pl: 0 }}>
              <ListItem sx={{ pl: 0, py: 0 }}>
                <Typography variant="body2">• Total DGB locked per tier</Typography>
              </ListItem>
              <ListItem sx={{ pl: 0, py: 0 }}>
                <Typography variant="body2">• Total DigiDollars minted</Typography>
              </ListItem>
            </List>
          </Grid>
          <Grid item xs={12} sm={6}>
            <List dense sx={{ pl: 0 }}>
              <ListItem sx={{ pl: 0, py: 0 }}>
                <Typography variant="body2">• Per-tier collateral ratios</Typography>
              </ListItem>
              <ListItem sx={{ pl: 0, py: 0 }}>
                <Typography variant="body2">• Aggregate system health</Typography>
              </ListItem>
            </List>
          </Grid>
        </Grid>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Accessible via RPC command: <code style={{ backgroundColor: '#f5f5f5', padding: '2px 4px', borderRadius: '3px' }}>getdigidollarstats</code>
        </Typography>
      </Paper>

      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Keep in mind:</strong> These layers reduce risk. They do not remove it. If DGB falls far enough,
          positions can become under-collateralized.
        </Typography>
      </Alert>
    </Card>
  );

  // Roadmap Section
  const RoadmapSection = () => (
    <Card elevation={3} sx={{ p: 3, mb: 4, borderRadius: '12px' }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3, color: '#002352' }}>
        Development Roadmap
      </Typography>

      <Grid container spacing={3}>
        {/* Implementation Specs Card */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              borderRadius: '12px',
              border: '2px solid #ff9800',
              backgroundColor: 'rgba(255, 152, 0, 0.05)'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" fontWeight="bold" color="#002352">
                DigiDollar Implementation Specs
              </Typography>
              <Chip
                label={`SHIPPED — ${CORE_RELEASE}`}
                size="small"
                sx={{
                  backgroundColor: '#2e7d32',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              All milestones complete — shipped in v9.26.2, current release {CORE_RELEASE}
            </Typography>

            <Box role="region" aria-label="DigiDollar milestones" tabIndex={0} sx={{ mb: 3, maxHeight: '400px', overflowY: 'auto' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircleIcon sx={{ color: '#4caf50', mr: 1, fontSize: '1.2rem' }} />
                <Typography variant="body2">
                  <strong>DD/TD/RD Address System</strong> - Complete
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircleIcon sx={{ color: '#4caf50', mr: 1, fontSize: '1.2rem' }} />
                <Typography variant="body2">
                  <strong>10-Tier Collateral System</strong> - Complete
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircleIcon sx={{ color: '#4caf50', mr: 1, fontSize: '1.2rem' }} />
                <Typography variant="body2">
                  <strong>Minting Process (Fully Refactored)</strong> - Complete
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircleIcon sx={{ color: '#4caf50', mr: 1, fontSize: '1.2rem' }} />
                <Typography variant="body2">
                  <strong>Send/Receive DigiDollars</strong> - Complete
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircleIcon sx={{ color: '#4caf50', mr: 1, fontSize: '1.2rem' }} />
                <Typography variant="body2">
                  <strong>Complete Wallet UI (7 Tabs)</strong> - Complete
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircleIcon sx={{ color: '#4caf50', mr: 1, fontSize: '1.2rem' }} />
                <Typography variant="body2">
                  <strong>Network-Wide UTXO Tracking</strong> - Complete
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircleIcon sx={{ color: '#4caf50', mr: 1, fontSize: '1.2rem' }} />
                <Typography variant="body2">
                  <strong>Redemption System</strong> - Complete
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircleIcon sx={{ color: '#4caf50', mr: 1, fontSize: '1.2rem' }} />
                <Typography variant="body2">
                  <strong>DCA/ERR/Volatility Protection</strong> - Complete
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircleIcon sx={{ color: '#4caf50', mr: 1, fontSize: '1.2rem' }} />
                <Typography variant="body2">
                  <strong>Oracle System</strong> - 7-of-35 MuSig2 quorum, live on mainnet and testnet26
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircleIcon sx={{ color: '#4caf50', mr: 1, fontSize: '1.2rem' }} />
                <Typography variant="body2">
                  <strong>MuSig2 Oracle Validation (7-of-35 active roster)</strong> - Complete
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircleIcon sx={{ color: '#4caf50', mr: 1, fontSize: '1.2rem' }} />
                <Typography variant="body2">
                  <strong>Mainnet Release (v9.26.2) + Pruned-Node Support (v9.26.4)</strong> - Complete
                </Typography>
              </Box>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              11/11 milestones completed • shipped on mainnet
            </Typography>

            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="caption">
                <strong>ACTIVE:</strong> DigiDollar activated on mainnet at block 23,869,440 (July 17, 2026).
              </Typography>
            </Alert>
          </Paper>
        </Grid>

        {/* v9.26 Release Card */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              borderRadius: '12px',
              border: '2px solid #002352',
              backgroundColor: 'rgba(0, 35, 82, 0.02)'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" fontWeight="bold" color="#002352">
                DigiByte v9.26.2 DigiDollar Release
              </Typography>
              <Chip
                label="MAINNET RELEASED"
                size="small"
                sx={{
                  backgroundColor: '#2e7d32',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Oracle System - 35 active oracle slots (0-34), 7-signature MuSig2 quorum (BIP-327 over BIP-340 Schnorr)
            </Typography>

            <List dense aria-label="Release features" tabIndex={0} sx={{ pl: 0, maxHeight: '400px', overflowY: 'auto' }}>
              <ListItem sx={{ pl: 0 }}>
                <ListItemIcon><CheckCircleIcon sx={{ color: '#4caf50', fontSize: '1.2rem' }} /></ListItemIcon>
                <ListItemText
                  primary="OP_ORACLE opcode (0xbf) Integration"
                  secondary="Complete - MuSig2 oracle bundle (v0x03, about 86 bytes)"
                />
              </ListItem>
              <ListItem sx={{ pl: 0 }}>
                <ListItemIcon><CheckCircleIcon sx={{ color: '#4caf50', fontSize: '1.2rem' }} /></ListItemIcon>
                <ListItemText
                  primary="Six Active Exchange API Integration"
                  secondary="Complete - Binance, KuCoin, Gate.io, HTX, Crypto.com, CoinGecko"
                />
              </ListItem>
              <ListItem sx={{ pl: 0 }}>
                <ListItemIcon><CheckCircleIcon sx={{ color: '#4caf50', fontSize: '1.2rem' }} /></ListItemIcon>
                <ListItemText
                  primary="P2P Message Handling"
                  secondary="Complete - ORACLEPRICE, MuSig2 nonce/context/partial-sig, GETORACLES"
                />
              </ListItem>
              <ListItem sx={{ pl: 0 }}>
                <ListItemIcon><CheckCircleIcon sx={{ color: '#4caf50', fontSize: '1.2rem' }} /></ListItemIcon>
                <ListItemText
                  primary="Testnet/Regtest Block Validation"
                  secondary="Complete - Activation heights: Testnet26 600; regtest active from block 0"
                />
              </ListItem>
              <ListItem sx={{ pl: 0 }}>
                <ListItemIcon><CheckCircleIcon sx={{ color: '#4caf50', fontSize: '1.2rem' }} /></ListItemIcon>
                <ListItemText
                  primary="Schnorr Signatures (BIP-340)"
                  secondary="Complete - Price cache with ConnectBlock/DisconnectBlock"
                />
              </ListItem>
              <ListItem sx={{ pl: 0 }}>
                <ListItemIcon><CheckCircleIcon sx={{ color: '#4caf50', fontSize: '1.2rem' }} /></ListItemIcon>
                <ListItemText
                  primary="Oracle Consensus (7-signature MuSig2)"
                  secondary="Active on mainnet and testnet26 - 35 oracle slots (0-34), 7 signatures required"
                />
              </ListItem>
              <ListItem sx={{ pl: 0 }}>
                <ListItemIcon><CheckCircleIcon sx={{ color: '#4caf50', fontSize: '1.2rem' }} /></ListItemIcon>
                <ListItemText
                  primary="DigiDollar Activated on Testnet"
                  secondary="Complete - v9.26.0-RC44, testnet26 with oracle price feeds"
                />
              </ListItem>
              <ListItem sx={{ pl: 0 }}>
                <ListItemIcon><CheckCircleIcon sx={{ color: '#4caf50', fontSize: '1.2rem' }} /></ListItemIcon>
                <ListItemText
                  primary="DigiByte v9.26.2 Mainnet Release"
                  secondary="Complete - Released June 29, 2026; DigiDollar active on mainnet since block 23,869,440 (July 17, 2026)"
                />
              </ListItem>
            </List>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              8/8 milestones completed • Mainnet v9.26.2 released June 29, 2026
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Alert severity="success" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Current Status:</strong> DigiDollar is active on mainnet since block 23,869,440 and on testnet26.
          Both use a 7-of-35 MuSig2 oracle quorum. Next network upgrade: Thaw Day at mainnet block 24,490,000
          (minimum v9.26.6, recommended {CORE_RELEASE}). For complete details and all other upgrades, see the full{' '}
          <a href="/roadmap" style={{ color: '#0066cc', fontWeight: 'bold' }}>
            DigiByte Roadmap
          </a>.
        </Typography>
      </Alert>
    </Card>
  );

  // Resources Section
  const ResourcesSection = () => (
    <Card
      elevation={2}
      sx={{
        backgroundColor: '#f2f4f8',
        borderRadius: '12px',
        mb: 4,
        backgroundImage: 'linear-gradient(135deg, #f8f9fa 0%, #e8eef7 100%)',
        border: '1px solid rgba(0, 35, 82, 0.1)'
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 3, color: '#002352', textAlign: 'center' }}>
          Learn More
        </Typography>

        <Grid container spacing={2} justifyContent="center">
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<DescriptionIcon />}
              endIcon={<LaunchIcon />}
              sx={{
                py: 1.5,
                backgroundColor: '#002352',
                '&:hover': { backgroundColor: '#001c41' }
              }}
              href="https://github.com/orgs/DigiByte-Core/discussions/319"
              target="_blank"
              rel="noopener noreferrer"
            >
              White Paper
            </Button>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<CodeIcon />}
              endIcon={<LaunchIcon />}
              sx={{
                py: 1.5,
                backgroundColor: '#0066cc',
                '&:hover': { backgroundColor: '#0052a3' }
              }}
              href="https://github.com/orgs/DigiByte-Core/discussions/324"
              target="_blank"
              rel="noopener noreferrer"
            >
              Tech Specs
            </Button>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<ListAltIcon />}
              endIcon={<LaunchIcon />}
              sx={{
                py: 1.5,
                backgroundColor: '#4caf50',
                '&:hover': { backgroundColor: '#45a049' }
              }}
              href="https://github.com/orgs/DigiByte-Core/discussions/325"
              target="_blank"
              rel="noopener noreferrer"
            >
              50 Use Cases
            </Button>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<GroupIcon />}
              sx={{
                py: 1.5,
                borderColor: '#002352',
                color: '#002352',
                '&:hover': {
                  borderColor: '#001c41',
                  backgroundColor: 'rgba(0, 35, 82, 0.05)'
                }
              }}
              href="https://github.com/orgs/DigiByte-Core/discussions"
              target="_blank"
              rel="noopener noreferrer"
            >
              Join Discussion
            </Button>
          </Grid>
        </Grid>

        <Typography
          variant="body2"
          sx={{
            textAlign: 'center',
            mt: 3,
            color: '#666',
            fontStyle: 'italic'
          }}
        >
          DigiDollar is experimental, open-source software. Read the docs and the risks before you use it.
          Nothing on this page is financial, investment, legal or tax advice.
        </Typography>
      </CardContent>
    </Card>
  );

  // Main render
  return (
    <Box
      sx={{
        py: 4,
        backgroundImage: 'linear-gradient(to bottom, #f8f9fa, #ffffff)',
        minHeight: '100vh'
      }}
    >
      <Container maxWidth="lg">
        <HeroSection />
        <DisclaimerSection />
        <WhatIsSection />
        <HowItWorksSection />
        <RisksSection />
        <CollateralSection />
        <TechnicalSection />
        <TechnicalDetailsSection />
        <ProtectionSystemSection />
        <RoadmapSection />
        <UseCasesSection />
        <IntegrationGuides />
        <ResourcesSection />
      </Container>
    </Box>
  );
};

export default DigiDollarPage;
