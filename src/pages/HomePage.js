import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Grid, Card, CardContent, 
  Divider, Avatar
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
import config from '../config';

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
  const [txOutsetInfoLoading, setTxOutsetInfoLoading] = useState(true);

  /**
   * WebSocket connection setup for real-time data updates
   * Establishes connection on component mount and handles incoming data
   */
  useEffect(() => {
    const socket = new WebSocket(config.wsBaseUrl);

    // WebSocket event handlers
    socket.onopen = () => {
      console.log('WebSocket connection established');
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('Received message from server:', message);

      // Handle initial data payload from server
      if (message.type === 'initialData') {
        setBlockchainInfo(message.data.blockchainInfo);
        setChainTxStats(message.data.chainTxStats);
        setTxOutsetInfo(message.data.txOutsetInfo);
        setBlockReward(message.data.blockReward);
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
  }, []);

  /**
   * Reusable StatCard component for displaying blockchain statistics
   * 
   * @param {string} title - Card title
   * @param {string|number} value - Main statistical value to display
   * @param {React.Element} icon - Material-UI icon component
   * @param {string} description - Explanatory text for the statistic
   * @param {boolean} loading - Loading state indicator
   * @param {string} color - Theme color for the card accent
   */
  const StatCard = ({ title, value, icon, description, loading, color = '#0066cc' }) => (
    <Card 
      elevation={3} 
      sx={{
        height: '100%',
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
        },
        borderTop: `4px solid ${color}`,
        borderRadius: '8px'
      }}
    >
      <CardContent>
        {/* Card header with title and icon */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold" color="text.primary">
            {title}
          </Typography>
          <Avatar sx={{ bgcolor: color }}>
            {icon}
          </Avatar>
        </Box>
        
        {/* Main value display with loading state */}
        {loading ? (
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            Loading...
          </Typography>
        ) : (
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            {value}
          </Typography>
        )}
        
        {/* Descriptive text */}
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </CardContent>
    </Card>
  );

  /**
   * AlgorithmDifficultiesCard - Specialized card for displaying mining algorithm difficulties
   * Shows current difficulty values for all 5 DigiByte mining algorithms
   */
  const AlgorithmDifficultiesCard = () => (
    <Card 
      elevation={3} 
      sx={{
        height: '100%',
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
        },
        borderTop: '4px solid #7b1fa2',
        borderRadius: '8px'
      }}
    >
      <CardContent>
        {/* Card header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold" color="text.primary">
            Algo Difficulties
          </Typography>
          <Avatar sx={{ bgcolor: '#7b1fa2' }}>
            <SpeedIcon />
          </Avatar>
        </Box>
        
        {/* Algorithm difficulty list */}
        {blockchainInfo && blockchainInfo.difficulties ? (
          <>
            <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <span>SHA256d:</span> <span>{parseInt(blockchainInfo.difficulties.sha256d).toLocaleString()}</span>
            </Typography>
            <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <span>Scrypt:</span> <span>{parseInt(blockchainInfo.difficulties.scrypt).toLocaleString()}</span>
            </Typography>
            <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <span>Skein:</span> <span>{parseInt(blockchainInfo.difficulties.skein).toLocaleString()}</span>
            </Typography>
            <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <span>Qubit:</span> <span>{parseInt(blockchainInfo.difficulties.qubit).toLocaleString()}</span>
            </Typography>
            <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <span>Odo:</span> <span>{parseInt(blockchainInfo.difficulties.odo).toLocaleString()}</span>
            </Typography>
          </>
        ) : (
          <Typography variant="h5">Loading...</Typography>
        )}
        
        <Divider sx={{ my: 1 }} />
        
        <Typography variant="body2" color="text.secondary">
          The current mining difficulties for each of the 5 DigiByte mining algorithms.
        </Typography>
      </CardContent>
    </Card>
  );

  /**
   * SoftforksCard - Specialized card for displaying active blockchain softforks
   * Shows all currently active softforks and their implementation status
   */
  const SoftforksCard = () => (
    <Card 
      elevation={3} 
      sx={{
        height: '100%',
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
        },
        borderTop: '4px solid #3949ab',
        borderRadius: '8px'
      }}
    >
      <CardContent>
        {/* Card header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold" color="text.primary">
            Active Softforks
          </Typography>
          <Avatar sx={{ bgcolor: '#3949ab' }}>
            <DoneAllIcon />
          </Avatar>
        </Box>
        
        {/* Softforks list */}
        {blockchainInfo && blockchainInfo.softforks ? (
          <Box>
            {Object.entries(blockchainInfo.softforks).map(([key, value]) => (
              <Box 
                key={key} 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  mb: 0.5
                }}
              >
                <Typography variant="body2" fontWeight="bold">
                  {key}:
                </Typography>
                <Typography variant="body2">
                  {value.type}
                </Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography variant="h5">Loading...</Typography>
        )}
        
        <Divider sx={{ my: 1 }} />
        
        <Typography variant="body2" color="text.secondary">
          Active on chain softforks.
        </Typography>
      </CardContent>
    </Card>
  );

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
        border: '1px solid rgba(0, 35, 82, 0.1)'
      }}
    >
      <CardContent sx={{ py: 4, textAlign: 'center' }}>
        {/* Main title with icon */}
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
          <StorageIcon sx={{ fontSize: '2.5rem', color: '#002352', mr: 2 }} />
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
            DigiByte Blockchain Statistics
          </Typography>
        </Box>
        
        <Divider sx={{ maxWidth: '150px', mx: 'auto', mb: 3, borderColor: '#0066cc', borderWidth: 2 }} />
        
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
        
        {/* DigiByte blockchain description */}
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
          The DigiByte blockchain was launched on January 10th, 2014. There is <strong>NO </strong> 
          company, centralized group, mass premine, entity or individual who controls DGB. 
          DGB is truly decentralized and is the best combination of speed, security & decentralization 
          you will see in any blockchain in the world today.
        </Typography>
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

        {/* Statistics grid layout */}
        <Grid container spacing={3}>
          {/* Basic blockchain statistics */}
          <Grid item xs={12} sm={6} md={4}>
            <StatCard 
              title="Total Blocks" 
              value={blockchainInfo ? formatNumber(blockchainInfo.blocks) : "Loading..."}
              icon={<BlockIcon />}
              description="Total blocks in the DigiByte blockchain since the chain was started on Jan 10th, 2014."
              loading={!blockchainInfo}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <StatCard 
              title="Total Transactions" 
              value={chainTxStats ? formatNumber(chainTxStats.txcount) : "Loading..."}
              icon={<TransactionIcon />}
              description="Total Transactions sent on the DigiByte blockchain since launch on Jan 10th, 2014."
              loading={!chainTxStats}
              color="#1e88e5"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <StatCard 
              title="Total Size" 
              value={blockchainInfo ? `${(blockchainInfo.size_on_disk / (1024 * 1024 * 1024)).toFixed(2)} GB` : "Loading..."}
              icon={<StorageIcon />}
              description="Total size in GB needed to store the entire DGB blockchain going back to Jan 10th, 2014."
              loading={!blockchainInfo}
              color="#43a047"
            />
          </Grid>
          
          {/* Supply and mining statistics */}
          <Grid item xs={12} sm={6} md={4}>
            <StatCard 
              title="Current Circulating Supply" 
              value={txOutsetInfo ? `${numberWithCommas(txOutsetInfo.total_amount.toFixed(2))} DGB` : "Loading..."}
              icon={<TokenIcon />}
              description="Current circulating supply calculated from all UTXO's as of the latest block."
              loading={txOutsetInfoLoading}
              color="#0066cc"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <StatCard 
              title="Remaining Supply To Be Mined" 
              value={txOutsetInfo ? `${numberWithCommas((21000000000 - txOutsetInfo.total_amount).toFixed(2))} DGB` : "Loading..."}
              icon={<HourglassEmptyIcon />}
              description="Remaining DGB to be mined until the maximum supply of 21 billion DGB is reached."
              loading={txOutsetInfoLoading}
              color="#fb8c00"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <StatCard 
              title="Last Block Reward" 
              value={blockReward !== null && blockReward !== undefined ? `${blockReward.toFixed(8)} DGB` : "Loading..."}
              icon={<RewardIcon />}
              description="The DigiByte mining reward amount for the most recent block on the blockchain."
              loading={blockReward === null || blockReward === undefined}
              color="#e53935"
            />
          </Grid>
          
          {/* Advanced blockchain information */}
          <Grid item xs={12} sm={6} md={4}>
            <AlgorithmDifficultiesCard />
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <StatCard 
              title="Latest Version" 
              value="v8.26.1"
              icon={<UpdateIcon />}
              description="Latest DGB core version."
              loading={false}
              color="#009688"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <SoftforksCard />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default HomePage;