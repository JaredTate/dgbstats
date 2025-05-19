import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, Typography, Grid, Box, Card, CardContent, 
  Divider, useTheme, useMediaQuery, Avatar 
} from '@mui/material';
import SpeedIcon from '@mui/icons-material/Speed';
import TimerIcon from '@mui/icons-material/Timer';
import LanguageIcon from '@mui/icons-material/Language';
import config from '../config';

const algoNames = ['SHA256D', 'Scrypt', 'Skein', 'Qubit', 'Odo'];

// Map algorithm names to their brand colors
const algoColors = {
  'SHA256D': '#4caf50', // Green
  'Scrypt': '#2196f3', // Blue
  'Skein': '#ff9800', // Orange
  'Qubit': '#9c27b0', // Purple
  'Odo': '#f44336', // Red
};

const HashratePage = () => {
  const [hashrates, setHashrates] = useState(
    algoNames.reduce((acc, algo) => ({ ...acc, [algo]: 0 }), {})
  );
  const [averageBlockTimes, setAverageBlockTimes] = useState(
    algoNames.reduce((acc, algo) => ({ ...acc, [algo]: 0 }), {})
  );
  const [totalBlocksByAlgo, setTotalBlocksByAlgo] = useState(
    algoNames.reduce((acc, algo) => ({ ...acc, [algo]: 0 }), {})
  );
  const [networkAverageBlockTime, setNetworkAverageBlockTime] = useState(0);
  const [totalBlocksInLastHour, setTotalBlocksInLastHour] = useState(0);
  const [totalHashrate, setTotalHashrate] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const blocksRef = useRef([]);
  
  // Get theme and check if on mobile
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const socket = new WebSocket(config.wsBaseUrl);

    socket.onopen = () => {
      console.log('WebSocket connection established');
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'recentBlocks') {
        blocksRef.current = message.data;
        calculateHashratesAndBlockTimes();
        setIsLoading(false);
      } else if (message.type === 'newBlock') {
        blocksRef.current.unshift(message.data);
        blocksRef.current = blocksRef.current.slice(0, 240);
        calculateHashratesAndBlockTimes();
      }
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      socket.close();
    };
  }, []);

  // isMobile is used for responsive design in various areas of the component
  
  const calculateHashratesAndBlockTimes = () => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const hourBlocks = blocksRef.current.filter(
      (block) => block.timestamp * 1000 >= oneHourAgo
    );

    const updatedHashrates = algoNames.reduce((acc, algo) => {
      const algoBlocks = hourBlocks.filter((block) => block.algo === algo);
      const blocksPerHour = algoBlocks.length;
      const avgDifficulty =
        algoBlocks.reduce((sum, block) => sum + block.difficulty, 0) / blocksPerHour;

      const hashrate = (blocksPerHour / 48) * avgDifficulty * Math.pow(2, 32) / 75;

      return { ...acc, [algo]: hashrate };
    }, {});

    setHashrates(updatedHashrates);

    const total = Object.values(updatedHashrates).reduce((sum, rate) => sum + rate, 0);
    setTotalHashrate(total);

    const totalBlocksInHour = hourBlocks.length;
    setTotalBlocksInLastHour(totalBlocksInHour);

    const networkAverageBlockTime = 60 * 60 / totalBlocksInHour;
    setNetworkAverageBlockTime(networkAverageBlockTime);

    const updatedAverageBlockTimes = algoNames.reduce((acc, algo) => {
      const algoBlocks = hourBlocks.filter((block) => block.algo === algo);
      const algoBlocksInHour = algoBlocks.length;
      const algoAverageBlockTime = algoBlocksInHour > 0 ? 60 * 60 / algoBlocksInHour : 0;

      return { ...acc, [algo]: algoAverageBlockTime };
    }, {});

    setAverageBlockTimes(updatedAverageBlockTimes);

    const updatedTotalBlocksByAlgo = algoNames.reduce((acc, algo) => {
      const algoBlocks = hourBlocks.filter((block) => block.algo === algo);
      return { ...acc, [algo]: algoBlocks.length };
    }, {});

    setTotalBlocksByAlgo(updatedTotalBlocksByAlgo);
  };

  const formatHashrate = (hashrate) => {
    const units = ['H/s', 'KH/s', 'MH/s', 'GH/s', 'TH/s', 'PH/s', 'EH/s'];
    let index = 0;
    while (hashrate >= 1000 && index < units.length - 1) {
      hashrate /= 1000;
      index++;
    }
    return `${hashrate.toFixed(2)} ${units[index]}`;
  };

  const formatBlockTime = (blockTime) => {
    if (blockTime === 0) return 'N/A';
    const minutes = Math.floor(blockTime / 60);
    const seconds = blockTime % 60;
    return `${minutes}m ${seconds.toFixed(0)}s`;
  };

  const formatTotalBlocks = (totalBlocks) => {
    return totalBlocks.toLocaleString();
  };

  const AlgoCard = ({ algo, hashrate, blockTime, totalBlocks }) => (
    <Card 
      elevation={3} 
      sx={{
        height: '100%',
        borderTop: `4px solid ${algoColors[algo] || '#0066cc'}`,
        borderRadius: '8px',
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, textAlign: 'center', color: algoColors[algo] || '#0066cc' }}>
          {algo} Algorithm
        </Typography>
        
        <Divider sx={{ mb: 2 }} />
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: algoColors[algo] || '#0066cc', mr: 2 }}>
            <SpeedIcon />
          </Avatar>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Hashrate
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {formatHashrate(hashrate)}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: algoColors[algo] || '#0066cc', mr: 2 }}>
            <TimerIcon />
          </Avatar>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Avg Block Time
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {formatBlockTime(blockTime)}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ bgcolor: algoColors[algo] || '#0066cc', mr: 2 }}>
            <LanguageIcon />
          </Avatar>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Blocks Mined (Last Hour)
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {formatTotalBlocks(totalBlocks)}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box 
      sx={{ 
        py: 4, 
        backgroundImage: 'linear-gradient(to bottom, #f8f9fa, #ffffff)',
        minHeight: '100vh'
      }}
    >
      <Container maxWidth="lg">
        {/* Header Card */}
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
              <SpeedIcon sx={{ fontSize: '2.5rem', color: '#002352', mr: 2 }} />
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
                DigiByte Hashrate By Algo
              </Typography>
            </Box>
            
            <Divider sx={{ maxWidth: '150px', mx: 'auto', mb: 3, borderColor: '#0066cc', borderWidth: 2 }} />
            
            <Typography 
              variant="subtitle1" 
              component="p" 
              sx={{ 
                maxWidth: '800px', 
                mx: 'auto', 
                mb: 2,
                color: '#555',
                fontSize: '1.1rem'
              }}
            >
              This page displays the real-time hashrate, average block time & total blocks found for each DGB mining algorithm based on the blocks mined over the last hour.
            </Typography>
            
            <Typography 
              variant="body2" 
              component="p" 
              sx={{ 
                maxWidth: '800px', 
                mx: 'auto',
                color: '#666',
              }}
            >
              Hashrate represents the total computational power being used to mine, process & secure transactions on the DigiByte blockchain.
            </Typography>
          </CardContent>
        </Card>

        {isLoading ? (
          <Card elevation={3} sx={{ p: 4, borderRadius: '8px', textAlign: 'center' }}>
            <Typography variant="h5" sx={{ color: '#555' }}>
              Loading hashrate data...
            </Typography>
          </Card>
        ) : (
          <>
            {/* Network Summary Card */}
            <Card 
              elevation={3}
              sx={{ 
                mb: 4, 
                borderRadius: '8px',
                backgroundImage: 'linear-gradient(135deg, #002352 0%, #004494 100%)',
                color: 'white'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, textAlign: 'center' }}>
                  Network Summary
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h6">Total Network Hashrate</Typography>
                      <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
                        {formatHashrate(totalHashrate)}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h6">Network Avg Block Time</Typography>
                      <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
                        {formatBlockTime(networkAverageBlockTime)}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h6">Blocks Last Hour</Typography>
                      <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
                        {formatTotalBlocks(totalBlocksInLastHour)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Algo Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {algoNames.map((algo) => (
                <Grid item xs={12} sm={6} md={4} key={algo}>
                  <AlgoCard 
                    algo={algo}
                    hashrate={hashrates[algo]}
                    blockTime={averageBlockTimes[algo]}
                    totalBlocks={totalBlocksByAlgo[algo]}
                  />
                </Grid>
              ))}
            </Grid>

            {/* Hashrate Calculation Card */}
            <Card
              elevation={3}
              sx={{
                borderRadius: '8px',
                mb: 4
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ textAlign: 'center', color: '#002352' }}>
                  How Hashrates are Calculated
                </Typography>
                
                <Divider sx={{ maxWidth: '100px', mx: 'auto', my: 2 }} />
                
                <Typography variant="body1" sx={{ mb: 2, textAlign: 'center' }}>
                  The hashrate for each DigiByte algorithm is calculated using the following formula:
                </Typography>
                
                <Box sx={{ 
                  bgcolor: '#f5f5f5', 
                  p: 2, 
                  borderRadius: '8px', 
                  textAlign: 'center',
                  my: 3,
                  fontFamily: 'monospace',
                  fontSize: '1.1rem',
                  fontWeight: 'bold'
                }}>
                  <Typography variant="body1">
                    Hashrate (per algo) = [(blocks solved over last hour / 48) * difficulty * 2^32] / 75
                  </Typography>
                </Box>
                
                <Typography variant="h6" sx={{ mt: 3, mb: 2, color: '#0066cc' }}>
                  Here's what each part of the formula represents:
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ pl: 2, borderLeft: '3px solid #0066cc' }}>
                      <Typography variant="body1" fontWeight="bold">Blocks solved over last hour:</Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>The number of blocks solved by the algorithm in the last 60 minutes.</Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Box sx={{ pl: 2, borderLeft: '3px solid #0066cc' }}>
                      <Typography variant="body1" fontWeight="bold">48:</Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>There are 48 slots for blocks to be solved in one hour, given the target block time of 75 seconds per block.</Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Box sx={{ pl: 2, borderLeft: '3px solid #0066cc' }}>
                      <Typography variant="body1" fontWeight="bold">Difficulty * 2^32:</Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>The average difficulty of the blocks mined by the algorithm, multiplied by 2^32. This represents the average amount of work (hashes) needed to solve a block.</Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Box sx={{ pl: 2, borderLeft: '3px solid #0066cc' }}>
                      <Typography variant="body1" fontWeight="bold">75:</Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>Since hashpower is measured in hashes per second, and there are 75 seconds in a 1 minute and 15-second block (15 seconds * 5 algorithms = 75 seconds), we divide by 75 to get the hashrate in H/s.</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Hashrate Units Card */}
            <Card
              elevation={3}
              sx={{
                borderRadius: '8px',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ textAlign: 'center', color: '#002352' }}>
                  Hashrate Units
                </Typography>
                
                <Divider sx={{ maxWidth: '100px', mx: 'auto', my: 2 }} />
                
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {[
                    { unit: 'H/s', desc: 'Hashes per second' },
                    { unit: 'KH/s', desc: 'Kilohashes per second (Thousands of Hashes)' },
                    { unit: 'MH/s', desc: 'Megahashes per second (Millions of Hashes)' },
                    { unit: 'GH/s', desc: 'Gigahashes per second (Billions of Hashes)' },
                    { unit: 'TH/s', desc: 'Terahashes per second (Trillions of Hashes)' },
                    { unit: 'PH/s', desc: 'Petahashes per second (Quadrillions of Hashes)' },
                    { unit: 'EH/s', desc: 'Exahashes per second (Quintillions of Hashes)' }
                  ].map((item, index) => (
                    <Grid item xs={6} sm={4} md={3} lg={3} key={index}>
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        p: 1,
                        borderRadius: '4px',
                        bgcolor: 'rgba(0, 102, 204, 0.05)',
                        height: '100%'
                      }}>
                        <Typography variant="body1" fontWeight="bold" sx={{ color: '#0066cc' }}>
                          {item.unit}
                        </Typography>
                        <Typography variant="body2">
                          {item.desc}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </>
        )}
      </Container>
    </Box>
  );
};

export default HashratePage;