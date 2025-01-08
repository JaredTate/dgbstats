import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, LinearProgress } from '@mui/material';
import styles from '../App.module.css';
import config from '../config';

const TaprootPage = () => {
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

  const calculateProgress = () => {
    // First log the data to debug
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

  const getActivationBlock = () => {
    if (taprootStatus.bip9?.status === 'locked_in' && taprootStatus.bip9?.since) {
      return taprootStatus.bip9.since + 40320; // Add one activation window to the 'since' block
    }
    return null;
  };

  useEffect(() => {
    const socket = new WebSocket(config.wsBaseUrl);

    socket.onopen = () => {
      console.log('WebSocket connection established');
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'initialData') {
        const taproot = message.data.blockchainInfo.softforks.taproot;
        console.log('Received Taproot Data:', taproot);
        setTaprootStatus(taproot);
      }
    };

    return () => socket.close();
  }, []);

  const getStateColor = (status) => {
    switch (status) {
      case 'active':
        return '#4caf50';
      case 'locked_in':
        return '#2196f3';
      case 'started':
        return '#0066cc'; // Changed to match menu bar color
      default:
        return '#757575';
    }
  };

  const getStatusMessage = () => {
    if (taprootStatus.active || taprootStatus.bip9?.status === 'active') {
      return "Yay! Taproot Active";
    }
    if (taprootStatus.bip9?.status === 'locked_in') {
      return "Yay! Taproot Locked In";
    }
    if (taprootStatus.bip9?.status === 'started' && calculateProgress() >= 70) {
      return "Yay! 70% Support";
    }
    return null;
  };

  return (
    <Container maxWidth="lg" className={styles.container}>
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

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Paper className={styles.paper} sx={{ flex: 1, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom sx={{ color: '#002456', fontSize: '1.5rem' }}>
            Is Taproot Active?
          </Typography>
          <Typography variant="h3" sx={{ 
            color: taprootStatus.active ? '#4caf50' : '#ff0000',
            fontSize: '2.5rem'
          }}>
            {taprootStatus.active ? 'YES' : 'NO'}
          </Typography>
        </Paper>

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
      </Box>

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
          {getStatusMessage() && (
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#4caf50',
                fontWeight: 'bold',
                fontSize: '1.3rem',
                ml: 2
              }}
            >
              {getStatusMessage()}
            </Typography>
          )}
        </Box>

        <Box sx={{ width: '80%', margin: '0 auto', position: 'relative' }}>
          <LinearProgress 
            variant="determinate" 
            value={calculateProgress()} 
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
          {/* Threshold indicator line */}
          <Box
            sx={{
              position: 'absolute',
              left: '70%',
              top: 0,
              bottom: 0,
              width: '2px',
              backgroundColor: 'red',
              zIndex: 1,
              height: '20px' // Match progress bar height
            }}
          />
          <Typography variant="body1" align="center" sx={{ mt: 1, fontSize: '1.2rem' }}>
            Progress: {calculateProgress().toFixed(2)}% (Need 70% for activation)
          </Typography>
          {taprootStatus.bip9?.status === 'locked_in' && (
            <Typography 
              variant="body1" 
              align="center" 
              sx={{ 
                mt: 2, 
                fontSize: '1.5rem',
                fontWeight: 800  // Make text bolder
              }}
            >
              <span style={{ color: '#2196f3' }}>Taproot will activate at block: </span>
              <span style={{ color: '#4caf50', fontWeight: 800 }}>{getActivationBlock()}</span>
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

      <Paper className={styles.paper}>
        <Typography variant="h5" gutterBottom align="center" sx={{ color: '#002456', fontSize: '1.5rem' }}>
          DigiByte Taproot Activation Parameters
        </Typography>
        <Box sx={{ width: '80%', margin: '0 auto' }}>
          <Typography variant="body1" paragraph sx={{ textAlign: 'left', fontSize: '1.2rem' }}>
            <strong>Activation Window:</strong> 40,320 blocks (approximately 1 week)
            <br />
            <strong>Required Threshold:</strong> 28,224 blocks (70% of activation window)
            <br />
            <strong>Current Progress:</strong> {taprootStatus.elapsed} blocks into current window
            <br />
            <strong>Supporting Blocks:</strong> {taprootStatus.count} blocks signaling support
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default TaprootPage;
