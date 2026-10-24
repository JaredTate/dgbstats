import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, LinearProgress } from '@mui/material';
import styles from '../App.module.css';
import { useNetwork } from '../context/NetworkContext';
import { prependUniqueBlock } from '../utils/blocks';
import { openNetworkSocket } from '../utils/networkSocket';

/**
 * BIP9 activation threshold (70% of miners must signal support)
 */
const ACTIVATION_THRESHOLD = 70;

/**
 * Number of blocks in a DigiByte activation window (approximately 1 week)
 */
const ACTIVATION_WINDOW = 40320;

/**
 * Color mapping for different Taproot activation states
 */
const STATE_COLORS = {
  active: '#4caf50',    // Green - Taproot is active
  locked_in: '#2196f3', // Blue - Taproot locked in, will activate
  started: '#0066cc',   // Dark blue - Signaling period started
  defined: '#757575'    // Gray - Initial/default state
};

/**
 * Get color for a specific Taproot activation state
 * @param {string} status - The activation status (active, locked_in, started, defined)
 * @returns {string} Hex color code for the status
 */
const getStateColor = (status) => {
  return STATE_COLORS[status] || STATE_COLORS.defined;
};

/**
 * Readable labels for BIP9 states
 */
const STATE_LABELS = {
  defined: 'Defined',
  started: 'Started',
  locked_in: 'Locked In',
  active: 'Active',
  failed: 'Failed'
};

/**
 * Normalize a deployment entry (buried or bip9) into the fields the page shows.
 * A buried deployment has no `bip9` block, only `active` and `height`.
 * Fields the data does not provide stay undefined so their rows are hidden.
 * @param {Object|null} taproot - Deployment entry from getdeploymentinfo / softforks
 * @returns {{status?: string, activationHeight?: number, minActivationHeight?: number, since?: number}}
 */
export const getTaprootView = (taproot) => {
  const bip9 = taproot?.bip9;
  const status = bip9?.status || (taproot?.active ? 'active' : undefined);
  const activationHeight = Number.isFinite(taproot?.height)
    ? taproot.height
    : (status === 'active' && Number.isFinite(bip9?.since) ? bip9.since : undefined);
  return {
    status,
    activationHeight,
    minActivationHeight: Number.isFinite(bip9?.min_activation_height) ? bip9.min_activation_height : undefined,
    // For an active deployment `since` equals the activation height, so only show it before activation
    since: status !== 'active' && Number.isFinite(bip9?.since) && bip9.since > 0 ? bip9.since : undefined
  };
};

/**
 * Header section component showing main Taproot activation question
 * @returns {JSX.Element} Page title component
 */
const HeaderSection = () => (
  <Typography 
    variant="h4" 
    component="h4" 
    align="center" 
    sx={{ 
      paddingTop: '10px',
      color: '#002456',
      fontWeight: 'bold'
    }} 
    gutterBottom
  >
    Taproot Activation Status
  </Typography>
);

/**
 * Card showing current Taproot activation status (YES/NO)
 * @param {Object} props - Component props
 * @param {boolean} props.isActive - Whether Taproot is currently active
 * @returns {JSX.Element} Activation status card
 */
const ActivationStatusCard = ({ isActive, loaded }) => (
  <Paper className={styles.paper} sx={{ flex: 1, textAlign: 'center' }}>
    <Typography variant="h5" gutterBottom sx={{ color: '#002456', fontSize: '1.5rem' }}>
      Is Taproot Active?
    </Typography>
    <Typography variant="h3" sx={{ 
      color: !loaded ? '#757575' : isActive ? '#4caf50' : '#ff0000',
      fontSize: '2.5rem'
    }}>
      {!loaded ? '…' : isActive ? 'YES' : 'NO'}
    </Typography>
  </Paper>
);

/**
 * Card explaining that Taproot is active and miner signaling has ended
 * Miners stopped signaling bit 2 at lock-in, so a live "recent support"
 * percentage no longer measures anything meaningful post-activation.
 * @returns {JSX.Element} Static Taproot activation summary card
 */
const RecentSupportCard = ({ view }) => (
  <Paper className={styles.paper} sx={{ flex: 1, textAlign: 'center' }}>
    <Typography variant="h5" gutterBottom sx={{ color: '#002456', fontSize: '1.5rem' }}>
      Recent Taproot Support
    </Typography>
    <Typography variant="body1" sx={{ fontSize: '1.1rem', mt: 2 }}>
      {view.status === 'active'
        ? `Taproot has been active${view.activationHeight !== undefined ? ` since block ${view.activationHeight.toLocaleString()}` : ''} — miner signaling ended at lock-in.`
        : 'Taproot is not active yet.'}
    </Typography>
  </Paper>
);

/**
 * Card showing detailed activation information and current status
 * @param {Object} props - Component props
 * @param {Object} props.taprootStatus - Complete Taproot status object
 * @returns {JSX.Element} Activation details card
 */
const ActivationDetailsCard = ({ view }) => {
  const rows = [
    ['Status', view.status && (STATE_LABELS[view.status] || view.status)],
    ['Activation Height', view.activationHeight?.toLocaleString()],
    ['Minimum Activation Height', view.minActivationHeight?.toLocaleString()],
    ['In This State Since Block', view.since?.toLocaleString()]
  ].filter(([, value]) => value !== undefined && value !== '');

  return (
    <Paper className={styles.paper} sx={{ flex: 2 }}>
      <Typography variant="h5" gutterBottom align="center" sx={{ color: '#002456', fontSize: '1.5rem' }}>
        Activation Details
      </Typography>
      <Box sx={{ width: '80%', margin: '0 auto' }}>
        <Typography data-testid="taproot-details" variant="body1" paragraph sx={{ textAlign: 'left', fontSize: '1.2rem' }}>
          {rows.map(([label, value], i) => (
            <React.Fragment key={label}>
              {i > 0 && <br />}
              <strong>{label}:</strong> {value}
            </React.Fragment>
          ))}
        </Typography>
      </Box>
    </Paper>
  );
};

/**
 * Progress visualization showing current activation state and progress
 * @param {Object} props - Component props
 * @param {Object} props.taprootStatus - Complete Taproot status object
 * @param {number} props.progress - Current activation progress percentage
 * @param {string} props.statusMessage - Optional celebration message
 * @param {number} props.activationBlock - Block number when Taproot will activate (if locked in)
 * @returns {JSX.Element} Progress visualization component
 */
const ProgressSection = ({ taprootStatus, status, progress, statusMessage, activationBlock }) => (
  <Paper className={styles.paper} sx={{ mb: 3 }}>
    <Typography variant="h5" gutterBottom align="center" sx={{ color: '#002456', fontSize: '1.5rem' }}>
      Current State
    </Typography>
    <Box data-testid="taproot-stages" sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', mb: 3 }}>
      {['defined', 'started', 'locked_in', 'active'].map((state, index) => (
        <Box
          key={state}
          sx={{
            display: 'flex',
            alignItems: 'center',
            opacity: status === state ? 1 : 0.5,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: getStateColor(status === state ? state : 'default'),
              fontWeight: status === state ? 'bold' : 'normal',
            }}
          >
            {state}
          </Typography>
          {index < 3 && (
            <Typography variant="h6" sx={{ mx: 1 }}>
              →
            </Typography>
          )}
        </Box>
      ))}
    </Box>
    
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
      <Typography variant="h6" sx={{ color: '#002456', fontSize: '1.3rem' }}>
        Activation Progress
      </Typography>
      {statusMessage && (
        <Typography 
          variant="h6" 
          sx={{ 
            color: '#4caf50',
            fontWeight: 'bold',
            fontSize: '1.3rem',
            ml: 2
          }}
        >
          {statusMessage}
        </Typography>
      )}
    </Box>

    <Box sx={{ width: '80%', margin: '0 auto', position: 'relative' }}>
      <LinearProgress 
        variant="determinate" 
        value={progress} 
        sx={{ 
          height: 20, 
          borderRadius: 2,
          backgroundColor: '#e0e0e0',
          '& .MuiLinearProgress-bar': {
            backgroundColor: getStateColor(status)
          }
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          left: '70%',
          top: 0,
          bottom: 0,
          width: '2px',
          backgroundColor: 'red',
          zIndex: 1,
          height: '20px'
        }}
      />
      <Typography variant="body1" align="center" sx={{ mt: 1, fontSize: '1.2rem' }}>
        Progress: {progress.toFixed(2)}% (Need 70% for activation)
      </Typography>
      {status === 'locked_in' && activationBlock && (
        <Typography 
          variant="body1" 
          align="center" 
          sx={{ 
            mt: 2, 
            fontSize: '1.5rem',
            fontWeight: 800
          }}
        >
          <span style={{ color: '#2196f3' }}>Taproot will activate at block: </span>
          <span style={{ color: '#4caf50', fontWeight: 800 }}>{activationBlock}</span>
        </Typography>
      )}
      {taprootStatus.bip9?.statistics && (
        <Typography variant="body1" align="left" sx={{ mt: 1, fontSize: '1.2rem' }}>
          Supporting Blocks: {taprootStatus.bip9.statistics.count} out of {taprootStatus.bip9.statistics.period} blocks
          <br />
          Blocks Elapsed: {taprootStatus.bip9.statistics.elapsed}
          <br />
          Threshold Required: {taprootStatus.bip9.statistics.threshold}
          <br />
          Activation Possible: <strong style={{ 
            color: taprootStatus.bip9.statistics.possible ? '#4caf50' : '#ff0000' 
          }}>
            {taprootStatus.bip9.statistics.possible ? 'Yes' : 'No'}
          </strong>
        </Typography>
      )}
    </Box>
  </Paper>
);

/**
 * Educational section explaining the BIP9 soft fork process
 * @returns {JSX.Element} BIP9 explanation component
 */
const BIP9ExplanationSection = () => (
  <Paper className={styles.paper} sx={{ mb: 3 }}>
    <Typography variant="h5" gutterBottom align="center" sx={{ color: '#002456', fontSize: '1.5rem' }}>
      BIP 9 Soft Fork Process
    </Typography>
    <Box sx={{ width: '80%', margin: '0 auto' }}>
      <Typography variant="body1" paragraph sx={{ color: '#002456', textAlign: 'left', fontSize: '1.2rem' }}>
        BIP 9 is a mechanism used by DigiByte to activate soft forks through miner signaling. The process involves several states:
      </Typography>
      <Typography variant="body1" component="ul" sx={{ color: '#002456', textAlign: 'left', fontSize: '1.2rem' }}>
        <li><strong>DEFINED</strong> - Initial state before the start time is reached</li>
        <li><strong>STARTED</strong> - Miners begin signaling readiness for the upgrade</li>
        <li><strong>LOCKED_IN</strong> - Achieved when 70% of blocks (28,224 of 40,320) signal support within a signaling window</li>
        <li><strong>ACTIVE</strong> - The soft fork is fully activated and new rules are enforced</li>
      </Typography>
    </Box>
  </Paper>
);

/**
 * Technical parameters section showing activation window details
 * @param {Object} props - Component props
 * @param {Object} props.taprootStatus - Complete Taproot status object
 * @returns {JSX.Element} Technical parameters component
 */
const TechnicalParametersSection = ({ taprootStatus, view }) => (
  <Paper className={styles.paper}>
    <Typography variant="h5" gutterBottom align="center" sx={{ color: '#002456', fontSize: '1.5rem' }}>
      DigiByte Taproot Activation Parameters
    </Typography>
    <Box sx={{ width: '80%', margin: '0 auto' }}>
      <Typography variant="body1" paragraph sx={{ textAlign: 'left', fontSize: '1.2rem' }}>
        <strong>Activation Window:</strong> {ACTIVATION_WINDOW.toLocaleString()} blocks (approximately 1 week)
        <br />
        <strong>Required Threshold:</strong> {Math.floor(ACTIVATION_WINDOW * 0.7).toLocaleString()} blocks (70% of activation window)
        <br />
        {view.status === 'active' ? (
          <>
            <strong>Current Progress:</strong> Signaling complete — Taproot is active
            {view.activationHeight !== undefined && ` (activated at block ${view.activationHeight.toLocaleString()})`}
          </>
        ) : (
          <>
            <strong>Current Progress:</strong> {taprootStatus.bip9?.statistics?.elapsed} blocks into current window
            <br />
            <strong>Supporting Blocks:</strong> {taprootStatus.bip9?.statistics?.count} blocks signaling support
          </>
        )}
      </Typography>
    </Box>
  </Paper>
);

/**
 * TaprootPage component - DigiByte Taproot activation status tracker
 * 
 * This page displays real-time information about DigiByte's Taproot soft fork activation
 * using the BIP9 signaling mechanism. It shows current activation progress, recent block
 * support, and detailed technical information about the activation process.
 * 
 * Features:
 * - Real-time WebSocket updates for activation status
 * - Progress visualization with threshold indicators
 * - Recent block analysis for current support levels
 * - Educational content about BIP9 activation process
 * - Technical parameter display
 * 
 * @component
 * @returns {JSX.Element} Complete Taproot activation page
 */
const TaprootPage = () => {
  const { wsBaseUrl, isTestnet } = useNetwork();

  // Taproot activation status from blockchain
  // Empty until the first initialData message arrives
  const [taprootStatus, setTaprootStatus] = useState({});
  const view = getTaprootView(taprootStatus);
  const loaded = view.status !== undefined;
  
  // Recent blocks for support percentage calculation
  const [recentBlocks, setRecentBlocks] = useState([]);

  /**
   * Calculate current activation progress percentage
   * @returns {number} Progress percentage (0-100)
   */
  const calculateProgress = () => {
    console.log('Taproot Status:', taprootStatus);
    
    // Active (including buried deployments with no bip9 block) shows 100%
    if (taprootStatus?.active) return 100;

    // Handle null/undefined case
    if (!taprootStatus?.bip9) return 0;
    
    // Active states should show 100%
    if (taprootStatus.bip9.status === 'active' || taprootStatus.bip9.status === 'locked_in') {
      return 100;
    }
    
    // For started state, calculate from statistics if available
    if (taprootStatus.bip9.status === 'started') {
      const stats = taprootStatus.bip9.statistics;
      if (stats && stats.period > 0) {
        const progress = (stats.count / stats.period) * 100;
        console.log('Calculated Progress:', progress);
        return progress;
      }
    }
    
    return 0;
  };

  /**
   * Calculate the block number when Taproot will activate (if locked in)
   * @returns {number|null} Activation block number or null if not locked in
   */
  const getActivationBlock = () => {
    if (taprootStatus.bip9?.status === 'locked_in' && taprootStatus.bip9?.since) {
      return taprootStatus.bip9.since + ACTIVATION_WINDOW;
    }
    return null;
  };

  /**
   * Get celebration message based on current activation status
   * @returns {string|null} Status message or null if no celebration warranted
   */
  const getStatusMessage = () => {
    if (taprootStatus.active || taprootStatus.bip9?.status === 'active') {
      return "Yay! Taproot Active";
    }
    if (taprootStatus.bip9?.status === 'locked_in') {
      return "Yay! Taproot Locked In";
    }
    if (taprootStatus.bip9?.status === 'started' && calculateProgress() >= ACTIVATION_THRESHOLD) {
      return "Yay! 70% Support";
    }
    return null;
  };

  /**
   * WebSocket connection effect for real-time Taproot status updates
   * Handles initial blockchain data and real-time block updates
   */
  useEffect(() => {
    const socket = openNetworkSocket(wsBaseUrl);

    /**
     * WebSocket connection opened successfully
     * Ready to receive Taproot activation data
     */
    socket.onopen = () => {
      console.log('WebSocket connection established for Taproot page');
    };

    /**
     * Handle incoming WebSocket messages with blockchain data
     * @param {MessageEvent} event - WebSocket message event
     */
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Received message:', message);

        if (message.type === 'initialData') {
        /**
         * Process initial blockchain data including Taproot status.
         * Current nodes report it in getdeploymentinfo; older nodes put it
         * in getblockchaininfo.softforks.
         */
        const taproot = message.data?.deploymentInfo?.deployments?.taproot
          || message.data?.blockchainInfo?.softforks?.taproot;
        if (taproot) setTaprootStatus(taproot);
      } else if (message.type === 'recentBlocks') {
        /**
         * Process initial block data for support calculation
         * Keeps last 240 blocks (approximately 1 hour) for analysis
         */
        console.log('Received recent blocks:', message.data);
        setRecentBlocks(message.data.slice(-240));
      } else if (message.type === 'newBlock') {
        /**
         * Handle real-time new block updates
         * Maintains rolling window of last 240 blocks
         */
        console.log('Received new block:', message.data);
        setRecentBlocks(prevBlocks => prependUniqueBlock(prevBlocks, message.data, 240));
      }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    /**
     * Cleanup function to close WebSocket connection
     * Prevents memory leaks when component unmounts
     */
    return () => socket.close();
  }, [wsBaseUrl]);

  // Calculate derived values
  const progress = calculateProgress();
  const statusMessage = getStatusMessage();
  const activationBlock = getActivationBlock();

  return (
    <Container maxWidth="lg" className={styles.container}>
      <HeaderSection />

      <Box
        data-testid="taproot-cards"
        sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 0, md: 2 }, mb: 3 }}
      >
        <ActivationStatusCard isActive={view.status === 'active'} loaded={loaded} />
        <RecentSupportCard view={view} />
        <ActivationDetailsCard view={view} />
      </Box>

      <ProgressSection 
        taprootStatus={taprootStatus}
        status={view.status}
        progress={progress}
        statusMessage={statusMessage}
        activationBlock={activationBlock}
      />

      <BIP9ExplanationSection />

      <TechnicalParametersSection taprootStatus={taprootStatus} view={view} />
    </Container>
  );
};

export default TaprootPage;
