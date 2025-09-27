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
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CodeIcon from '@mui/icons-material/Code';
import GroupIcon from '@mui/icons-material/Group';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ConstructionIcon from '@mui/icons-material/Construction';
import LaunchIcon from '@mui/icons-material/Launch';
import DescriptionIcon from '@mui/icons-material/Description';
import BusinessIcon from '@mui/icons-material/Business';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import HomeIcon from '@mui/icons-material/Home';
import SendIcon from '@mui/icons-material/Send';

/**
 * DigiDollarPage Component - Explainer for the DigiDollar Decentralized Stablecoin
 *
 * This page provides comprehensive information about the proposed DigiDollar stablecoin
 * on the DigiByte blockchain, including how it works, use cases, and implementation details.
 */
const DigiDollarPage = () => {

  // Collateral requirements data
  const collateralData = [
    { period: '30 days', ratio: '500%', dgbFor100: '500 DGB', undercollateralized: '80% drop' },
    { period: '3 months', ratio: '400%', dgbFor100: '400 DGB', undercollateralized: '75% drop' },
    { period: '6 months', ratio: '350%', dgbFor100: '350 DGB', undercollateralized: '71.4% drop' },
    { period: '1 year', ratio: '300%', dgbFor100: '300 DGB', undercollateralized: '66.7% drop' },
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
          The world's first truly decentralized stablecoin native on a UTXO blockchain,
          enabling stable value transactions without centralized control.
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
          DGB becomes the strategic reserve asset (21B max, 1.94 per person) • Everything happens inside DigiByte Core wallet •
          You never give up control of your private keys
        </Typography>

        <Alert
          severity="info"
          sx={{
            maxWidth: '600px',
            mx: 'auto',
            backgroundColor: 'rgba(0, 102, 204, 0.1)',
            '& .MuiAlert-icon': { color: '#0066cc' }
          }}
        >
          <Typography variant="body2">
            <strong>Status:</strong> In planning phase - Development will begin following community consensus
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );

  // What is DigiDollar Section
  const WhatIsSection = () => (
    <Card elevation={3} sx={{ p: 3, mb: 4, borderRadius: '12px' }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3, color: '#002352' }}>
        What is DigiDollar?
      </Typography>

      {/* DGB Scarcity Highlight */}
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
          <strong>DGB is a Limited, Finite Strategic Reserve Asset:</strong> With a maximum supply of
          21 billion DGB, there are only <strong style={{ color: '#0066cc', fontSize: '1.1em' }}>1.94 DGB
          per person</strong> on Earth (based on 8.1 billion world population). Combined with DigiByte's
          <strong style={{ color: '#0066cc' }}> 15-second block speed</strong> (40x faster than Bitcoin),
          this extreme scarcity and fast settlement makes DGB ideal as collateral for DigiDollar -
          a truly finite backing for instant, stable currency transactions.
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
              DigiDollar is a proposed stable digital currency that would always equal $1 USD,
              created by locking up DigiByte (DGB) as collateral. DGB would become a
              strategic reserve asset - with only 21 billion max supply (just 1.94 DGB per person
              on Earth), it's a truly finite asset backing the stability of DigiDollars.
            </Typography>
            <Typography variant="body1" paragraph>
              Unlike traditional stablecoins backed by bank accounts, DigiDollar would be
              the world's first truly decentralized stablecoin on a UTXO blockchain.
              No company or bank would control it.
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, color: '#002352' }}>
              Most importantly: Everything would happen directly in your DigiByte Core wallet -
              you would never give up control of your private keys or trust a third party.
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
              Key Benefits
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><CheckCircleIcon sx={{ color: '#4caf50' }} /></ListItemIcon>
                <ListItemText primary="World's first truly decentralized stablecoin on UTXO blockchain" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircleIcon sx={{ color: '#4caf50' }} /></ListItemIcon>
                <ListItemText primary="Always worth $1 USD - stable and predictable" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircleIcon sx={{ color: '#4caf50' }} /></ListItemIcon>
                <ListItemText primary="You keep full control of private keys in Core wallet" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircleIcon sx={{ color: '#4caf50' }} /></ListItemIcon>
                <ListItemText primary="DGB becomes strategic reserve asset" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircleIcon sx={{ color: '#4caf50' }} /></ListItemIcon>
                <ListItemText primary="15-second blocks (40x faster than BTC), $0.01 fees" />
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
          <strong>Imagine DGB is silver</strong> stored in your basement safe. You have $1,000 worth
          of silver but need cash today. Instead of selling your silver (and losing future gains),
          you lock it in a special time-locked safe.
        </Typography>

        <Typography variant="body1" paragraph>
          The safe gives you $500 cash to spend today. <strong>The silver NEVER leaves your possession</strong> -
          it stays in YOUR basement, in YOUR safe. You just can't access it until the timelock expires.
        </Typography>

        <Typography variant="body1" paragraph>
          10 years later, your silver is worth $10,000 (10x gain)! To unlock: Simply return the $500
          to the safe → get your $10,000 silver back. You kept ALL the appreciation.
        </Typography>

        <Box sx={{ mt: 3, p: 2, backgroundColor: 'white', borderRadius: '8px' }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#0066cc' }}>
            That's EXACTLY how DigiDollar works:
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
              <ListItemText primary="When timelock expires, burn DD → get your DGB back" />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircleIcon sx={{ color: '#4caf50', fontSize: '1.2rem' }} /></ListItemIcon>
              <ListItemText primary="Keep ALL the DGB price appreciation" />
            </ListItem>
          </List>
        </Box>
      </Paper>

      {/* Tax Advantage Box */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          backgroundColor: 'rgba(76, 175, 80, 0.05)',
          borderLeft: '4px solid #4caf50',
          borderRadius: '8px'
        }}
      >
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#2e7d32' }}>
          💡 The Tax Advantage: Liquidity Without Selling
        </Typography>

        <Typography variant="body1" paragraph>
          In most jurisdictions, <strong>borrowing against assets is NOT a taxable event</strong>.
          This is exactly what billionaires do - they never sell their stocks, they borrow against them.
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" fontWeight="bold" color="#002352" gutterBottom>
              Traditional Crypto Sale:
            </Typography>
            <Typography variant="body2" color="error">
              ❌ Sell DGB → Pay 20-40% capital gains tax<br />
              ❌ Lose future appreciation<br />
              ❌ Taxable event recorded
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" fontWeight="bold" color="#002352" gutterBottom>
              DigiDollar Method:
            </Typography>
            <Typography variant="body2" color="success.main">
              ✅ Lock DGB → Get DigiDollars<br />
              ✅ No taxable event (in most jurisdictions)<br />
              ✅ Keep ALL future DGB gains<br />
              ✅ Theoretically never need to sell DGB
            </Typography>
          </Grid>
        </Grid>

        <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic', color: '#666' }}>
          * Tax laws vary by jurisdiction. Consult a tax professional for your specific situation.
        </Typography>
      </Paper>

      {/* Economic Incentives Section */}
      <Paper
        elevation={1}
        sx={{
          p: 3,
          mb: 4,
          backgroundColor: '#f8f9fa',
          border: '2px solid #002352',
          borderRadius: '8px'
        }}
      >
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, color: '#002352' }}>
          Economic Incentives: Why This Benefits Everyone
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ height: '100%' }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#0066cc' }}>
                🔒 DGB Becomes More Scarce
              </Typography>

              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  mb: 2,
                  backgroundColor: 'rgba(0, 102, 204, 0.1)',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}
              >
                <Typography variant="h4" fontWeight="bold" color="#002352">
                  1.94 DGB
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Per person on Earth
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  (21B max supply ÷ 8.1B population)
                </Typography>
              </Paper>

              <Typography variant="body1" paragraph>
                With only 21 billion DGB ever to exist, locking DGB for DigiDollars makes an
                already scarce asset even more scarce. This creates natural price support.
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><TrendingUpIcon sx={{ color: '#4caf50' }} /></ListItemIcon>
                  <ListItemText
                    primary="Reduced selling pressure"
                    secondary="Locked DGB can't be panic sold during market volatility"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><TrendingUpIcon sx={{ color: '#4caf50' }} /></ListItemIcon>
                  <ListItemText
                    primary="Supply shock potential"
                    secondary="Significant locking could create supply squeeze"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><TrendingUpIcon sx={{ color: '#4caf50' }} /></ListItemIcon>
                  <ListItemText
                    primary="Benefits all DGB holders"
                    secondary="Even unlocked DGB benefits from reduced circulating supply"
                  />
                </ListItem>
              </List>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ height: '100%' }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#0066cc' }}>
                💰 Personal Financial Benefits
              </Typography>
              <Typography variant="body1" paragraph>
                DigiDollar provides unprecedented financial flexibility for DGB holders,
                enabling sophisticated wealth management strategies.
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><AttachMoneyIcon sx={{ color: '#4caf50' }} /></ListItemIcon>
                  <ListItemText
                    primary="Tax-efficient liquidity"
                    secondary="Access funds without triggering capital gains"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><AttachMoneyIcon sx={{ color: '#4caf50' }} /></ListItemIcon>
                  <ListItemText
                    primary="Keep upside potential"
                    secondary="Maintain full exposure to DGB price appreciation"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><AttachMoneyIcon sx={{ color: '#4caf50' }} /></ListItemIcon>
                  <ListItemText
                    primary="Strategic flexibility"
                    secondary="Lock portions based on liquidity needs"
                  />
                </ListItem>
              </List>
            </Box>
          </Grid>
        </Grid>

        <Alert severity="success" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>The Network Effect:</strong> The more people use DigiDollar, the stronger the DGB ecosystem becomes.
            Locked DGB creates scarcity → drives price → attracts more users → creates more demand for both DGB and DigiDollar.
            It's a positive feedback loop that benefits all participants.
          </Typography>
        </Alert>
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
              Users lock DigiByte as collateral in a smart contract.
              The amount depends on the lock period (150%-400% of DigiDollar value).
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
              DigiDollars are automatically minted based on the locked DGB value
              and current USD exchange rate from decentralized oracles.
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
              Use DigiDollars for stable transactions. Redeem them anytime to
              unlock your DGB collateral after the lock period expires.
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
        DigiDollar uses a sliding collateral scale to prevent attacks while rewarding long-term participants:
      </Typography>

      <TableContainer component={Paper} elevation={0} sx={{ backgroundColor: '#f8f9fa' }}>
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
              <TableRow key={index} sx={{ '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 35, 82, 0.02)' } }}>
                <TableCell>{row.period}</TableCell>
                <TableCell align="center">
                  <Chip
                    label={row.ratio}
                    size="small"
                    sx={{
                      backgroundColor: index < 4 ? '#ffebee' : '#e8f5e9',
                      color: index < 4 ? '#c62828' : '#2e7d32',
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
          <strong>Note:</strong> The updated collateral schedule (500% → 200%, up from 300% → 100%) provides
          enhanced stability. The "Undercollateralized After" column shows how much DGB price can drop before
          position becomes undercollateralized. 5 and 7 year options added for more flexibility.
        </Typography>
      </Alert>
    </Card>
  );

  // Revolutionary Use Cases Section
  const UseCasesSection = () => (
    <Card elevation={3} sx={{ p: 3, mb: 4, borderRadius: '12px' }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3, color: '#002352' }}>
        Revolutionary Use Cases
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2, backgroundColor: 'rgba(0, 102, 204, 0.05)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <BusinessIcon sx={{ mr: 1, color: '#0066cc' }} />
              <Typography variant="h6" fontWeight="bold">Corporate Bonds</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              $140.7 Trillion market - Instant settlement vs 2-3 day traditional clearing
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2, backgroundColor: 'rgba(0, 35, 82, 0.05)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <HomeIcon sx={{ mr: 1, color: '#002352' }} />
              <Typography variant="h6" fontWeight="bold">Real Estate</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              $79.7 Trillion market - Fractional ownership democratizes property investment
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2, backgroundColor: 'rgba(76, 175, 80, 0.05)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <DirectionsCarIcon sx={{ mr: 1, color: '#4caf50' }} />
              <Typography variant="h6" fontWeight="bold">Autonomous Vehicles</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              $13.7 Trillion by 2030 - Self-driving cars manage their own finances
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2, backgroundColor: 'rgba(255, 152, 0, 0.05)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <SendIcon sx={{ mr: 1, color: '#ff9800' }} />
              <Typography variant="h6" fontWeight="bold">Global Remittances</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              $685 Billion market - Reduce costs from 6.3% average to $0.01 flat fee
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2, backgroundColor: 'rgba(233, 30, 99, 0.05)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <LocalHospitalIcon sx={{ mr: 1, color: '#e91e63' }} />
              <Typography variant="h6" fontWeight="bold">Healthcare Payments</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              $550 Billion market - Real-time claim adjudication and transparent pricing
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2, backgroundColor: 'rgba(156, 39, 176, 0.05)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <PublicIcon sx={{ mr: 1, color: '#9c27b0' }} />
              <Typography variant="h6" fontWeight="bold">And 45+ More</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              From supply chain to gaming, DigiDollar enables countless innovations
            </Typography>
          </Paper>
        </Grid>
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
          <strong>Revolutionary Architecture:</strong> DigiDollar would be the world's first truly
          decentralized stablecoin built natively on a UTXO (Unspent Transaction Output) blockchain.
          All operations occur directly in DigiByte Core wallet - users maintain complete control
          of their private keys throughout the entire process.
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
                secondary="15 independent price feeds with 8-of-15 consensus requirement"
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
              <ListItemText primary="No forced liquidations during market volatility" />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircleIcon sx={{ color: '#4caf50' }} /></ListItemIcon>
              <ListItemText primary="All transactions appear identical on-chain (privacy)" />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircleIcon sx={{ color: '#4caf50' }} /></ListItemIcon>
              <ListItemText primary="Batch signature verification for efficiency" />
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
        DigiDollar leverages advanced Bitcoin Script opcodes and DigiByte's unique capabilities to create
        a trustless, decentralized stablecoin system:
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
                  secondary="Enforces time-based collateral lock periods (30 days to 10 years)"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CodeIcon sx={{ color: '#002352' }} /></ListItemIcon>
                <ListItemText
                  primary="OP_CHECKSEQUENCEVERIFY (CSV)"
                  secondary="Enables relative time locks for redemption windows"
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
                  primary="Multi-Sig Oracle Validation"
                  secondary="8-of-15 Schnorr threshold signatures for price consensus"
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
                User creates a P2TR output with DGB collateral, embedding time lock
                (CLTV) and oracle price data. Script validates collateral ratio and
                mints corresponding DigiDollars.
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" color="#4caf50" gutterBottom>
                2. Oracle Verification
              </Typography>
              <Typography variant="body2">
                15 independent oracles sign price data. Script requires 8-of-15
                signatures using Schnorr threshold aggregation, ensuring
                decentralized price consensus.
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" color="#ff9800" gutterBottom>
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
          <strong>Key Innovation:</strong> Unlike Ethereum-based stablecoins that require smart contracts
          and gas fees, DigiDollar uses native UTXO script capabilities for superior security, lower costs,
          and true decentralization. The entire system operates without intermediaries, smart contract risks,
          or custody requirements.
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
                label="IN PROGRESS"
                size="small"
                sx={{
                  backgroundColor: '#ff9800',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Initial Design Phase - 25% Complete
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircleIcon sx={{ color: '#4caf50', mr: 1, fontSize: '1.2rem' }} />
                <Typography variant="body2">
                  <strong>DigiDollar White Paper Release</strong> - May 2025
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircleIcon sx={{ color: '#4caf50', mr: 1, fontSize: '1.2rem' }} />
                <Typography variant="body2">
                  <strong>DigiDollar Technical Blueprint Released</strong> - Jun 2025
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ConstructionIcon sx={{ color: '#666', mr: 1, fontSize: '1.2rem' }} />
                <Typography variant="body2" color="text.secondary">
                  P2TR Contract Structure Design - Oct 2025
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ConstructionIcon sx={{ color: '#666', mr: 1, fontSize: '1.2rem' }} />
                <Typography variant="body2" color="text.secondary">
                  Define Collateral Ratio System - Oct 2025
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ConstructionIcon sx={{ color: '#666', mr: 1, fontSize: '1.2rem' }} />
                <Typography variant="body2" color="text.secondary">
                  DigiDollar Opcodes Specification - Oct 2025
                </Typography>
              </Box>
            </Box>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="caption">
                <strong>NEXT:</strong> P2TR Contract Structure Design
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
                DigiByte v9.26 DigiDollar Release
              </Typography>
              <Chip
                label="PENDING"
                size="small"
                sx={{
                  backgroundColor: '#666',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Development & Implementation - 0% Complete
            </Typography>

            <List dense sx={{ pl: 0 }}>
              <ListItem sx={{ pl: 0 }}>
                <ListItemIcon><CodeIcon sx={{ color: '#666', fontSize: '1.2rem' }} /></ListItemIcon>
                <ListItemText
                  primary="OP_DIGIDOLLAR (0xbb) Implementation"
                  secondary="Oct 2025"
                />
              </ListItem>
              <ListItem sx={{ pl: 0 }}>
                <ListItemIcon><LockIcon sx={{ color: '#666', fontSize: '1.2rem' }} /></ListItemIcon>
                <ListItemText
                  primary="Time-Locked Collateral Mechanism"
                  secondary="Nov 2025"
                />
              </ListItem>
              <ListItem sx={{ pl: 0 }}>
                <ListItemIcon><SwapHorizIcon sx={{ color: '#666', fontSize: '1.2rem' }} /></ListItemIcon>
                <ListItemText
                  primary="Redemption Mechanism"
                  secondary="Nov 2025"
                />
              </ListItem>
              <ListItem sx={{ pl: 0 }}>
                <ListItemIcon><SecurityIcon sx={{ color: '#666', fontSize: '1.2rem' }} /></ListItemIcon>
                <ListItemText
                  primary="Oracle Price Feed Implementation"
                  secondary="Nov 2025"
                />
              </ListItem>
              <ListItem sx={{ pl: 0 }}>
                <ListItemIcon><CodeIcon sx={{ color: '#666', fontSize: '1.2rem' }} /></ListItemIcon>
                <ListItemText
                  primary="MAST Implementation"
                  secondary="Dec 2025"
                />
              </ListItem>
              <ListItem sx={{ pl: 0 }}>
                <ListItemIcon><SpeedIcon sx={{ color: '#666', fontSize: '1.2rem' }} /></ListItemIcon>
                <ListItemText
                  primary="Advanced Features"
                  secondary="Dec 2025"
                />
              </ListItem>
              <ListItem sx={{ pl: 0 }}>
                <ListItemIcon><AccountBalanceIcon sx={{ color: '#666', fontSize: '1.2rem' }} /></ListItemIcon>
                <ListItemText
                  primary="Wallet Enhancement"
                  secondary="Jan 2026"
                />
              </ListItem>
              <ListItem sx={{ pl: 0 }}>
                <ListItemIcon><CheckCircleIcon sx={{ color: '#666', fontSize: '1.2rem' }} /></ListItemIcon>
                <ListItemText
                  primary="Consensus Validation Rules"
                  secondary="Feb 2026"
                />
              </ListItem>
            </List>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              0/10 milestones completed
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Current Status:</strong> DigiDollar Implementation Specs are in progress (25% complete).
          The v9.26 release with full DigiDollar functionality is planned for 2025-2026.
          For complete details and all other upgrades, see the full{' '}
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
              startIcon={<TrendingUpIcon />}
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
          DigiDollar represents a paradigm shift in decentralized finance - the world's first truly
          decentralized stablecoin on a UTXO blockchain where DGB becomes the strategic reserve asset
          and users never surrender control of their private keys.
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
        <WhatIsSection />
        <HowItWorksSection />
        <CollateralSection />
        <TechnicalSection />
        <TechnicalDetailsSection />
        <RoadmapSection />
        <UseCasesSection />
        <ResourcesSection />
      </Container>
    </Box>
  );
};

export default DigiDollarPage;