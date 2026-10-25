import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container, Typography, Box, Grid, Card, CardContent, CardActionArea,
  Divider, Avatar, Link
} from '@mui/material';
import BlockIcon from '@mui/icons-material/ViewCompact';
import TransactionIcon from '@mui/icons-material/Sync';
import StorageIcon from '@mui/icons-material/Storage';
import TokenIcon from '@mui/icons-material/Token';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import RewardIcon from '@mui/icons-material/EmojiEvents';
import SpeedIcon from '@mui/icons-material/Speed';
import UpdateIcon from '@mui/icons-material/Update';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { useNetwork } from '../context/NetworkContext';
import { openNetworkSocket } from '../utils/networkSocket';
import { CORE_RELEASE } from '../coreRelease';

const TESTNET_RELEASE = {
  version: CORE_RELEASE,
  network: 'testnet26',
  p2pPort: '12033',
  rpcPort: '14026',
  activationHeight: '600',
  oracleConsensus: '7 of 35',
  activeOracleSlots: '35 testnet roster oracles',
  mainnetActivationFloor: '23,627,520'
};

const getDifficultyValue = (difficulties, key, fallbackKey = null) => {
  if (!difficulties) return undefined;
  return difficulties[key] ?? (fallbackKey ? difficulties[fallbackKey] : undefined);
};

const formatDifficultyValue = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 'N/A';

  return numeric.toLocaleString(undefined, {
    maximumFractionDigits: 8
  });
};

const GITHUB_RELEASES_URL = 'https://github.com/DigiByte-Core/digibyte/releases';
const MAINNET_ACCENT = '#0066cc';

/** Return a finite number, or null for anything else (null, NaN, objects, junk strings). */
const toFiniteNumber = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }
  return null;
};

/** Format a live value safely: "N/A" when it is not a usable number. */
const formatLive = (value, format) => {
  const numeric = toFiniteNumber(value);
  if (numeric === null) return 'N/A';
  try {
    return format(numeric);
  } catch {
    return 'N/A';
  }
};

const isObject = (value) => typeof value === 'object' && value !== null;

/** "See latest blocks" -> "see latest blocks" (keeps "DigiByte", "GitHub" etc. as written). */


const cardHoverSx = {
  height: '100%',
  transition: 'transform 0.3s, box-shadow 0.3s',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
  },
  borderRadius: '8px'
};

/** Text for screen readers only (same as MUI's visuallyHidden). */
const visuallyHidden = {
  border: 0, clip: 'rect(0 0 0 0)', height: '1px', margin: '-1px', overflow: 'hidden',
  padding: 0, position: 'absolute', whiteSpace: 'nowrap', width: '1px'
};

/**
 * TileLink - makes a whole home card one link ("every tile is a door").
 *
 * The card is a single <a>: an internal route (`to`, via React Router) or an
 * external page (`href`, opens in a new tab). A visible action line at the
 * bottom says where it goes. The accessible name is the card's visible text
 * (title, value, description, action), so it always matches what people see
 * (axe label-content-name-mismatch). Nothing inside is interactive.
 *
 * @param {string} action - Footer text, e.g. "See latest blocks"
 * @param {string} [to] - Internal route (already network-prefixed)
 * @param {string} [href] - External URL (opens in a new tab)
 * @param {string} accent - Network accent color for the action line and focus ring
 * @param {object} [sx] - Extra Card styles (border color, background)
 */
const TileLink = ({ action, to, href, accent, sx, children }) => {
  const isExternal = Boolean(href);
  const linkProps = isExternal
    ? { component: 'a', href, target: '_blank', rel: 'noopener noreferrer' }
    : { component: RouterLink, to };

  return (
    <Card elevation={3} sx={{ ...cardHoverSx, ...sx }}>
      <CardActionArea
        {...linkProps}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'flex-start',
          color: 'inherit',
          textDecoration: 'none',
          '&.Mui-focusVisible': {
            outline: `3px solid ${accent}`,
            outlineOffset: '-3px'
          },
          '&:hover .home-tile-action, &.Mui-focusVisible .home-tile-action': {
            backgroundColor: accent,
            color: '#ffffff'
          }
        }}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          {children}
        </CardContent>
        <Box sx={{ px: 2, pb: 2 }}>
          <Box
            component="span"
            className="home-tile-action"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              px: 1.5,
              py: 0.75,
              border: `2px solid ${accent}`,
              borderRadius: '8px',
              color: accent,
              fontWeight: 700,
              fontSize: '0.95rem',
              lineHeight: 1.4,
              transition: 'background-color 0.2s, color 0.2s'
            }}
          >
            {action} <span aria-hidden="true">→</span>
            {isExternal && <Box component="span" sx={visuallyHidden}> (opens in a new tab)</Box>}
          </Box>
        </Box>
      </CardActionArea>
    </Card>
  );
};

/** Card header: title on the left, colored icon on the right. */
const TileHeader = ({ title, icon, color }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
    <Typography variant="h6" fontWeight="bold" color="text.primary">
      {title}
    </Typography>
    <Avatar sx={{ bgcolor: color }}>
      {icon}
    </Avatar>
  </Box>
);

/**
 * StatCard - one blockchain statistic, as a link to its detail page.
 *
 * @param {string} title - Card title
 * @param {string|number} value - Main statistical value to display
 * @param {React.Element} icon - Material-UI icon component
 * @param {string} description - Explanatory text for the statistic
 * @param {boolean} loading - Loading state indicator
 * @param {string} color - Theme color for the card accent
 * @param {object} link - { to | href, action, accent } for TileLink
 */
const StatCard = ({ title, value, icon, description, loading, color = '#0066cc', link }) => (
  <TileLink title={title} {...link} sx={{ borderTop: `4px solid ${color}` }}>
    <TileHeader title={title} icon={icon} color={color} />
    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, overflowWrap: 'anywhere' }}>
      {loading ? 'Loading...' : value}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {description}
    </Typography>
  </TileLink>
);

const DIFFICULTY_ROWS = [
  { label: 'SHA256d', key: 'sha256d' },
  { label: 'Scrypt', key: 'scrypt' },
  { label: 'Skein', key: 'skein' },
  { label: 'Qubit', key: 'qubit' },
  { label: 'Odo', key: 'odo', fallbackKey: 'odocrypt' }
];

/**
 * AlgorithmDifficultiesCard - current difficulty for each of the 5 mining
 * algorithms, as a link to the difficulty charts.
 */
const AlgorithmDifficultiesCard = ({ blockchainInfo, link }) => {
  const difficulties = isObject(blockchainInfo) && isObject(blockchainInfo.difficulties)
    ? blockchainInfo.difficulties
    : null;

  return (
    <TileLink title="Algo Difficulties" {...link} sx={{ borderTop: '4px solid #7b1fa2' }}>
      <TileHeader title="Algo Difficulties" icon={<SpeedIcon />} color="#7b1fa2" />

      {difficulties ? (
        DIFFICULTY_ROWS.map(({ label, key, fallbackKey }) => (
          <Typography key={key} variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <span>{label}:</span>{' '}
            <span style={{ overflowWrap: 'anywhere', textAlign: 'right', minWidth: 0 }}>
              {formatDifficultyValue(getDifficultyValue(difficulties, key, fallbackKey))}
            </span>
          </Typography>
        ))
      ) : (
        <Typography variant="h5">Loading...</Typography>
      )}

      <Divider sx={{ my: 1 }} />

      <Typography variant="body2" color="text.secondary">
        The current mining difficulties for each of the 5 DigiByte mining algorithms.
      </Typography>
    </TileLink>
  );
};

/** Status text and color for one deployment from getdeploymentinfo. */
const getDeploymentStatus = (value) => {
  if (isObject(value) && value.active === true) {
    return { text: value.type === 'buried' ? 'buried' : 'active', color: 'success.main' };
  }
  if (isObject(value) && value.active === false) {
    const status = isObject(value.bip9) ? value.bip9.status : undefined;
    return { text: typeof status === 'string' && status ? status : 'inactive', color: 'warning.main' };
  }
  return { text: 'unknown', color: 'text.secondary' };
};

/**
 * SoftforksCard - active softforks from getdeploymentinfo, as a link to the
 * network upgrade tracker. The rows are plain text (the card is the only link).
 */
const SoftforksCard = ({ deploymentInfo, blockchainInfo, link }) => {
  const rawDeployments = isObject(deploymentInfo) ? deploymentInfo.deployments : null;
  const deployments = isObject(rawDeployments) && Object.keys(rawDeployments).length > 0
    ? rawDeployments
    : null;

  return (
    <TileLink title="Active Softforks" {...link} sx={{ borderTop: '4px solid #3949ab' }}>
      <TileHeader title="Active Softforks" icon={<DoneAllIcon />} color="#3949ab" />

      {deployments ? (
        <Box>
          {Object.entries(deployments).map(([key, value]) => {
            const status = getDeploymentStatus(value);
            return (
              <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" fontWeight="bold">
                  {key}:
                </Typography>
                <Typography variant="body2" sx={{ color: status.color }}>
                  {status.text}
                </Typography>
              </Box>
            );
          })}
        </Box>
      ) : deploymentInfo === null && blockchainInfo ? (
        <Typography variant="body2" color="text.secondary">
          Loading deployment data...
        </Typography>
      ) : (
        <Typography variant="h5">Loading...</Typography>
      )}

      <Divider sx={{ my: 1 }} />

      <Typography variant="body2" color="text.secondary">
        Active on-chain softforks (rule upgrades). "buried" means the upgrade is permanent and built into the software.
      </Typography>
    </TileLink>
  );
};

/** Testnet-only card with the current testnet26 release facts, as a link to DigiDollar. */
const TestnetReleaseCard = ({ networkTheme, link }) => (
  <Grid item xs={12}>
    <TileLink
      title="Testnet26 DigiDollar Status"
      {...link}
      sx={{
        height: 'auto',
        borderTop: `4px solid ${networkTheme.primary}`,
        backgroundColor: 'rgba(46, 125, 50, 0.04)'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" sx={{ color: networkTheme.primary }}>
            Testnet26 DigiDollar Status
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Current {TESTNET_RELEASE.network} network where DigiDollar has been active since block 600. DigiDollar shipped on mainnet in v9.26.2 and has been active on mainnet since block 23,869,440 (July 17, 2026).
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="caption" sx={{ px: 1.25, py: 0.5, borderRadius: '8px', backgroundColor: networkTheme.primary, color: 'white', fontWeight: 'bold' }}>
            {TESTNET_RELEASE.version}
          </Typography>
          <Typography variant="caption" sx={{ px: 1.25, py: 0.5, borderRadius: '8px', backgroundColor: '#ffffff', border: `1px solid ${networkTheme.primary}`, color: networkTheme.primary, fontWeight: 'bold' }}>
            {TESTNET_RELEASE.oracleConsensus} oracle consensus
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={2}>
        {[
          { label: 'Testnet', value: TESTNET_RELEASE.network },
          { label: 'P2P Port', value: TESTNET_RELEASE.p2pPort },
          { label: 'RPC Port', value: TESTNET_RELEASE.rpcPort },
          { label: 'DD Activation', value: `Block ${TESTNET_RELEASE.activationHeight}` },
          { label: 'Oracle Roster', value: '35-slot roster, 7-of-35 quorum' },
          { label: 'Mainnet Min Activation Height (passed)', value: `Block ${TESTNET_RELEASE.mainnetActivationFloor}` }
        ].map(({ label, value }) => (
          <Grid item xs={12} sm={6} md={4} key={label}>
            <Box sx={{ p: 1.5, borderRadius: '8px', backgroundColor: '#ffffff', border: '1px solid rgba(46, 125, 50, 0.16)' }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {label}
              </Typography>
              <Typography variant="body1" fontWeight="bold" sx={{ color: networkTheme.primary }}>
                {value}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </TileLink>
  </Grid>
);

/**
 * HomePage Component - Main dashboard displaying DigiByte blockchain statistics
 * 
 * This is the main landing page that shows real-time blockchain data including:
 * - Block count, transactions, and blockchain size
 * - Circulating supply and mining rewards
 * - Algorithm difficulties and active softforks
 * 
 * Data is received via WebSocket connection for real-time updates
 */
const HomePage = ({ numberWithCommas, formatNumber }) => {
  // State management for blockchain data
  const [blockchainInfo, setBlockchainInfo] = useState(null);
  const [chainTxStats, setChainTxStats] = useState(null);
  const [txOutsetInfo, setTxOutsetInfo] = useState(null);
  const [blockReward, setBlockReward] = useState(null);
  const [deploymentInfo, setDeploymentInfo] = useState(null);
  const [txOutsetInfoLoading, setTxOutsetInfoLoading] = useState(true);

  // Network context for network-aware data fetching
  const { wsBaseUrl, isTestnet, theme: networkTheme, getNetworkPath } = useNetwork();

  // Where each tile goes. Testnet paths get the /testnet prefix.
  const accent = isTestnet ? networkTheme.primary : MAINNET_ACCENT;
  const toPage = (path, action) => ({ to: getNetworkPath(path), action, accent });
  const versionLink = isTestnet
    ? { href: GITHUB_RELEASES_URL, action: 'Get it on GitHub', accent }
    : toPage('/downloads', 'Download DigiByte Core');

  // Live values, safe against missing or malformed data.
  const totalAmount = isObject(txOutsetInfo) ? txOutsetInfo.total_amount : undefined;
  const sizeOnDisk = isObject(blockchainInfo) ? toFiniteNumber(blockchainInfo.size_on_disk) : null;

  /**
   * WebSocket connection setup for real-time data updates
   * Establishes connection on component mount and handles incoming data
   */
  useEffect(() => {
    const socket = openNetworkSocket(wsBaseUrl);

    // WebSocket event handlers
    socket.onopen = () => {
      console.log('WebSocket connection established');
    };

    socket.onmessage = (event) => {
      let message;
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }
      console.log('Received message from server:', message);

      // Handle initial data payload from server (ignore malformed payloads)
      if (isObject(message) && message.type === 'initialData' && isObject(message.data)) {
        const { data } = message;
        setBlockchainInfo(data.blockchainInfo);
        setChainTxStats(data.chainTxStats);
        setTxOutsetInfo(data.txOutsetInfo);
        setBlockReward(data.blockReward);
        setDeploymentInfo(data.deploymentInfo);
        setTxOutsetInfoLoading(false);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    // Cleanup WebSocket connection on component unmount
    return () => {
      socket.close();
    };
  }, [wsBaseUrl]);

  /**
   * HeroSection - Top banner with main title and description
   * Provides introduction to the DigiByte blockchain and website purpose
   */
  const HeroSection = () => (
    <Card
      elevation={2}
      sx={{
        backgroundColor: '#f2f4f8',
        borderRadius: '12px',
        mb: 5,
        overflow: 'hidden',
        backgroundImage: 'linear-gradient(135deg, #f8f9fa 0%, #e8eef7 100%)',
        border: `1px solid ${isTestnet ? `${networkTheme.primary}33` : 'rgba(0, 35, 82, 0.1)'}`
      }}
    >
      <CardContent sx={{ py: 4, textAlign: 'center' }}>
        {/* Main title with icon */}
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
          <Typography
            variant="h2"
            component="h1"
            fontWeight="800"
            sx={{
              color: networkTheme.primary,
              letterSpacing: '0.5px',
              fontSize: { xs: '1.8rem', sm: '2.3rem', md: '2.8rem' }
            }}
          >
            DigiByte {isTestnet ? 'Testnet ' : ''}Blockchain Statistics
          </Typography>
        </Box>
        
        <Divider sx={{ maxWidth: '150px', mx: 'auto', mb: 3, borderColor: networkTheme.secondary, borderWidth: 2 }} />
        
        {/* Website description */}
        <Typography 
          variant="subtitle1" 
          component="p" 
          sx={{ 
            maxWidth: '800px', 
            mx: 'auto', 
            mb: 3,
            color: '#555',
            fontSize: '1.1rem'
          }}
        >
          This is a free & open source website to find real time data & information about DigiByte blockchain pulled directly from the blockchain via digibyted.
        </Typography>
        
        {isTestnet ? (
          /* Testnet intro: what testnet is and what the green color means */
          <Box
            data-testid="testnet-intro"
            sx={{
              maxWidth: '800px',
              mx: 'auto',
              p: 2,
              borderRadius: 2,
              bgcolor: `${networkTheme.primary}12`,
              border: `1px solid ${networkTheme.primary}40`,
              color: '#2d3a2e',
              lineHeight: 1.6,
            }}
          >
            <Typography variant="body1" component="p" sx={{ lineHeight: 1.6 }}>
              <strong>You are on testnet.</strong> Testnet is a separate DigiByte network for testing.
              Its coins have no value. Green colors mean testnet; the real DigiByte network (mainnet) is blue.
            </Typography>
            <Link
              component={RouterLink}
              to="/"
              sx={{ display: 'inline-block', mt: 1, fontWeight: 600, color: networkTheme.primary }}
            >
              Go to mainnet →
            </Link>
          </Box>
        ) : (
          /* DigiByte blockchain description */
          <Typography 
            variant="body1" 
            component="p" 
            sx={{ 
              maxWidth: '800px', 
              mx: 'auto',
              color: '#444',
              lineHeight: 1.6
            }}
          >
            The DigiByte blockchain launched on January 10th, 2014. There is <strong>NO </strong> 
            company, centralized group, mass premine, entity or person who controls DGB. 
            DGB is a truly decentralized combination of speed, security & innovation.
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  // Main component render
  return (
    <Box 
      sx={{ 
        py: 4, 
        backgroundImage: 'linear-gradient(to bottom, #f8f9fa, #ffffff)',
        minHeight: '100vh'
      }}
    >
      <Container maxWidth="lg">
        {/* Hero section with main title and description */}
        <HeroSection />

        {/* Statistics grid layout: every tile is a link to its detail page */}
        <Grid container spacing={3}>
          {/* Basic blockchain statistics */}
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Total Blocks"
              value={blockchainInfo ? formatLive(blockchainInfo.blocks, formatNumber) : "Loading..."}
              icon={<BlockIcon />}
              description={isTestnet
                ? "Total blocks on testnet since this test network started."
                : "Total blocks in the DigiByte blockchain since the chain was started on Jan 10th, 2014."}
              loading={!blockchainInfo}
              link={toPage('/blocks', 'See latest blocks')}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Total Transactions"
              value={chainTxStats ? formatLive(chainTxStats.txcount, formatNumber) : "Loading..."}
              icon={<TransactionIcon />}
              description={isTestnet
                ? "Total transactions sent on testnet since this test network started."
                : "Total Transactions sent on the DigiByte blockchain since launch on Jan 10th, 2014."}
              loading={!chainTxStats}
              color="#1e88e5"
              link={toPage('/txs', 'View transactions')}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Total Size"
              value={blockchainInfo ? (sizeOnDisk === null ? 'N/A' : `${(sizeOnDisk / (1024 * 1024 * 1024)).toFixed(2)} GB`) : "Loading..."}
              icon={<StorageIcon />}
              description={isTestnet
                ? "Total size in GB needed to store the whole testnet blockchain."
                : "Total size in GB needed to store the entire DGB blockchain going back to Jan 10th, 2014."}
              loading={!blockchainInfo}
              color="#43a047"
              link={toPage('/nodes', 'See the nodes that store it')}
            />
          </Grid>

          {/* Supply and mining statistics */}
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Current Circulating Supply"
              value={txOutsetInfo ? formatLive(totalAmount, (n) => `${numberWithCommas(n.toFixed(2))} DGB`) : "Loading..."}
              icon={<TokenIcon />}
              description={isTestnet
                ? "Testnet coins in circulation, from all UTXOs as of the latest block. Testnet coins have no value."
                : "Current circulating supply calculated from all UTXO's as of the latest block."}
              loading={txOutsetInfoLoading}
              color="#0066cc"
              link={toPage('/supply', 'Explore supply')}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Remaining Supply To Be Mined"
              value={txOutsetInfo ? formatLive(totalAmount, (n) => `${numberWithCommas((21000000000 - n).toFixed(2))} DGB`) : "Loading..."}
              icon={<HourglassEmptyIcon />}
              description={isTestnet
                ? "Testnet coins still to be mined. Testnet coins have no value."
                : "Remaining DGB to be mined until the maximum supply of 21 billion DGB is reached."}
              loading={txOutsetInfoLoading}
              color="#fb8c00"
              link={toPage('/supply', 'See the supply schedule')}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Last Block Reward"
              value={blockReward !== null && blockReward !== undefined ? formatLive(blockReward, (n) => `${n.toFixed(8)} DGB`) : "Loading..."}
              icon={<RewardIcon />}
              description={isTestnet
                ? "The mining reward for the most recent testnet block."
                : "The DigiByte mining reward amount for the most recent block on the blockchain."}
              loading={blockReward === null || blockReward === undefined}
              color="#e53935"
              link={toPage('/blocks', 'See recent blocks')}
            />
          </Grid>

          {/* Advanced blockchain information */}
          <Grid item xs={12} sm={6} md={4}>
            <AlgorithmDifficultiesCard
              blockchainInfo={blockchainInfo}
              link={toPage('/difficulties', 'View difficulty charts')}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Latest Version"
              value={isTestnet ? TESTNET_RELEASE.version : `${CORE_RELEASE} DigiDollar`}
              icon={<UpdateIcon />}
              description="Latest DGB core version."
              loading={false}
              color="#009688"
              link={versionLink}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <SoftforksCard
              deploymentInfo={deploymentInfo}
              blockchainInfo={blockchainInfo}
              link={toPage('/pool-upgrades', 'See network upgrades')}
            />
          </Grid>

          {isTestnet && (
            <TestnetReleaseCard
              networkTheme={networkTheme}
              link={toPage('/digidollar', 'Learn about DigiDollar')}
            />
          )}
        </Grid>
      </Container>
    </Box>
  );
};

export default HomePage;
