import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, LinearProgress } from '@mui/material';
import styles from '../App.module.css';
import { useNetwork } from '../context/NetworkContext';

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
const ActivationStatusCard = ({ isActive }) => (
  <Paper className={styles.paper} sx={{ flex: 1, textAlign: 'center' }}>
    <Typography variant="h5" gutterBottom sx={{ color: '#002456', fontSize: '1.5rem' }}>
      Is Taproot Active?
    </Typography>
    <Typography variant="h3" sx={{ 
      color: isActive ? '#4caf50' : '#ff0000',
      fontSize: '2.5rem'
    }}>
      {isActive ? 'YES' : 'NO'}
    </Typography>
  </Paper>
);

/**
 * Card showing recent Taproot support percentage from last hour of blocks
 * @param {Object} props - Component props
 * @param {Array} props.recentBlocks - Array of recent blocks with Taproot signaling data
 * @param {number} props.supportPercentage - Calculated support percentage
 * @returns {JSX.Element} Recent support statistics card
 */
const RecentSupportCard = ({ recentBlocks, supportPercentage }) => {
  const supportingBlocks = recentBlocks.filter(block => block.taprootSignaling).length;
  
  return (
    <Paper className={styles.paper} sx={{ flex: 1, textAlign: 'center' }}>
      <Typography variant="h5" gutterBottom sx={{ color: '#002456', fontSize: '1.5rem' }}>
        Recent Taproot Support
      </Typography>
      <Typography variant="h3" sx={{ 
        color: '#4caf50',
        fontSize: '2.5rem',
        fontWeight: 'bold'
      }}>
        {supportPercentage.toFixed(1)}%
      </Typography>
      <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>
        Blocks supporting Taproot last 1 hour
      </Typography>
      <Typography variant="body2" sx={{ fontSize: '0.9rem', mt: 1, color: '#666' }}>
        ({recentBlocks.length} blocks analyzed)
      </Typography>
      <Typography variant="body2" sx={{ fontSize: '0.9rem', color: '#666' }}>
        ({supportingBlocks}/{recentBlocks.length} supporting blocks)
      </Typography>
    </Paper>
  );
};

/**
 * Card showing detailed activation information and current status
 * @param {Object} props - Component props
 * @param {Object} props.taprootStatus - Complete Taproot status object
 * @returns {JSX.Element} Activation details card
 */
const ActivationDetailsCard = ({ taprootStatus }) => (
  <Paper className={styles.paper} sx={{ flex: 2 }}>
    <Typography variant="h5" gutterBottom align="center" sx={{ color: '#002456', fontSize: '1.5rem' }}>
      Activation Details
    </Typography>
    <Box sx={{ width: '80%', margin: '0 auto' }}>
      <Typography variant="body1" paragraph sx={{ textAlign: 'left', fontSize: '1.2rem' }}>
        <strong>Status:</strong> {taprootStatus.bip9?.status || 'Unknown'}
        <br />
        <strong>Activation Height:</strong> {taprootStatus.height}
        <br />
        <strong>Minimum Activation Height:</strong> {taprootStatus.bip9?.min_activation_height}
        <br />
        <strong>Active Since Block:</strong> {taprootStatus.bip9?.since || 'N/A'}
      </Typography>
    </Box>
  </Paper>
);

/**
 * Progress visualization showing current activation state and progress
 * @param {Object} props - Component props
 * @param {Object} props.taprootStatus - Complete Taproot status object
 * @param {number} props.progress - Current activation progress percentage
 * @param {string} props.statusMessage - Optional celebration message
 * @param {number} props.activationBlock - Block number when Taproot will activate (if locked in)
 * @returns {JSX.Element} Progress visualization component
 */
const ProgressSection = ({ taprootStatus, progress, statusMessage, activationBlock }) => (
  <Paper className={styles.paper} sx={{ mb: 3 }}>
    <Typography variant="h5" gutterBottom align="center" sx={{ color: '#002456', fontSize: '1.5rem' }}>
      Current State
    </Typography>
    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
      {['defined', 'started', 'locked_in', 'active'].map((state, index) => (
        <Box
          key={state}
          sx={{
            display: 'flex',
            alignItems: 'center',
            opacity: taprootStatus.bip9?.status === state ? 1 : 0.5,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: getStateColor(taprootStatus.bip9?.status === state ? state : 'default'),
              fontWeight: taprootStatus.bip9?.status === state ? 'bold' : 'normal',
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
    
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
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
            backgroundColor: taprootStatus.bip9?.status === 'locked_in' ? '#2196f3' : 
              taprootStatus.bip9?.status === 'started' ? '#0066cc' : 
              getStateColor(taprootStatus.bip9?.status || 'defined')
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
      {taprootStatus.bip9?.status === 'locked_in' && activationBlock && (
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
        <li><strong>LOCKED_IN</strong> - Achieved when 70% of blocks signal support within a difficulty period</li>
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
const TechnicalParametersSection = ({ taprootStatus }) => (
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
        <strong>Current Progress:</strong> {taprootStatus.elapsed} blocks into current window
        <br />
        <strong>Supporting Blocks:</strong> {taprootStatus.count} blocks signaling support
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
  const [taprootStatus, setTaprootStatus] = useState({
    type: 'bip9',
    bip9: {
      status: '',
      bit: 0,
      start_time: 0,
      timeout: 0,
      since: 0,
      statistics: {
        period: 0,
        threshold: 0,
        elapsed: 0,
        count: 0,
        possible: true
      },
      min_activation_height: 0
    }
  });
  
  // Recent blocks for support percentage calculation
  const [recentBlocks, setRecentBlocks] = useState([]);

  /**
   * Calculate current activation progress percentage
   * @returns {number} Progress percentage (0-100)
   */
  const calculateProgress = () => {
    console.log('Taproot Status:', taprootStatus);
    
    // Handle null/undefined case
    if (!taprootStatus?.bip9) return 0;
    
    // Active states should show 100%
    if (taprootStatus.active || taprootStatus.bip9.status === 'active' || taprootStatus.bip9.status === 'locked_in') {
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
   * Calculate recent Taproot support percentage from last hour of blocks
   * @returns {number} Support percentage from recent blocks (0-100)
   */
  const calculateRecentSupport = () => {
    if (!recentBlocks || recentBlocks.length === 0) return 0;
    
    const supportingBlocks = recentBlocks.filter(block => block.taprootSignaling).length;
    const percentage = (supportingBlocks / recentBlocks.length) * 100;
    
    console.log(`Supporting blocks: ${supportingBlocks}/${recentBlocks.length} = ${percentage}%`);
    return percentage;
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
    const socket = new WebSocket(wsBaseUrl);

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
         * Process initial blockchain data including Taproot status
         * Extracts Taproot soft fork information from blockchain info
         */
        const taproot = message.data.blockchainInfo.softforks.taproot;
        setTaprootStatus(taproot);
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
        setRecentBlocks(prevBlocks => {
          const updatedBlocks = [message.data, ...prevBlocks];
          return updatedBlocks.slice(0, 240);
        });
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
  const recentSupport = calculateRecentSupport();
  const statusMessage = getStatusMessage();
  const activationBlock = getActivationBlock();

  return (
    <Container maxWidth="lg" className={styles.container}>
      <HeaderSection />

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <ActivationStatusCard isActive={taprootStatus.active} />
        <RecentSupportCard 
          recentBlocks={recentBlocks} 
          supportPercentage={recentSupport} 
        />
        <ActivationDetailsCard taprootStatus={taprootStatus} />
      </Box>

      <ProgressSection 
        taprootStatus={taprootStatus}
        progress={progress}
        statusMessage={statusMessage}
        activationBlock={activationBlock}
      />

      <BIP9ExplanationSection />

      <TechnicalParametersSection taprootStatus={taprootStatus} />
    </Container>
  );
};

export default TaprootPage;
