import React, { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-luxon';
import { LineController } from 'chart.js';
import { 
  Typography, Container, Box, Card, CardContent, 
  Divider, Grid, useTheme, useMediaQuery 
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import config from '../config';

Chart.register(...registerables);
Chart.register(LineController);

const algoNames = ['SHA256D', 'Scrypt', 'Skein', 'Qubit', 'Odo'];

// Map algorithm names to their brand colors for consistent styling
const algoColors = {
  'SHA256D': '#4caf50', // Green
  'Scrypt': '#2196f3', // Blue
  'Skein': '#ff9800', // Orange
  'Qubit': '#9c27b0', // Purple
  'Odo': '#f44336', // Red
};

const DifficultiesPage = () => {
  // Get theme and check if on mobile
  const theme = useTheme();
  // Using theme for styling but not explicitly tracking mobile state
  useMediaQuery(theme.breakpoints.down('sm')); // keeping for potential future use
  
  // Refs for storing chart references and instances
  const chartRefs = useRef([]);
  const chartInstances = useRef([]);

  // State for storing difficulties data
  const [difficulties, setDifficulties] = useState(
    algoNames.reduce((acc, algo) => ({ ...acc, [algo]: [] }), {})
  );
  
  // State to track loading status
  const [isLoading, setIsLoading] = useState(true);

  // WebSocket connection and event handling
  useEffect(() => {
    const socket = new WebSocket(config.wsBaseUrl);

    // Event handler for WebSocket connection open
    socket.onopen = () => {
      console.log('WebSocket connection established');
    };

    // Event handler for receiving messages from the server
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'recentBlocks') {
        // Update the difficulties state with the recent blocks data
        const updatedDifficulties = algoNames.reduce((acc, algo) => {
          const algoDifficulties = message.data
            .filter((block) => block.algo === algo)
            .map((block) => block.difficulty);
          return { ...acc, [algo]: algoDifficulties };
        }, {});
        setDifficulties(updatedDifficulties);
        setIsLoading(false);
      } else if (message.type === 'newBlock') {
        // Update the difficulties state with the new block data
        setDifficulties((prevDifficulties) => ({
          ...prevDifficulties,
          [message.data.algo]: [...prevDifficulties[message.data.algo], message.data.difficulty],
        }));
      }
    };

    // Event handler for WebSocket connection close
    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    // Cleanup function to close the WebSocket connection when the component unmounts
    return () => {
      socket.close();
    };
  }, []);

  // Chart rendering and updating
  useEffect(() => {
    if (isLoading) return;
    
    // Create an array to track charts created in this effect
    const localChartInstances = [];
    
    algoNames.forEach((algo, index) => {
      const ctx = chartRefs.current[index]?.getContext('2d');
      if (!ctx) return;
      
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, `${algoColors[algo]}33`); // With transparency
      gradient.addColorStop(1, `${algoColors[algo]}05`); // More transparent at the bottom

      // Destroy previous chart if it exists
      if (chartInstances.current[index]) {
        chartInstances.current[index].destroy();
      }

      // Create a new chart instance
      const chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: difficulties[algo].map((_, i) => i + 1),
          datasets: [
            {
              label: `${algo} Difficulty`,
              data: difficulties[algo],
              backgroundColor: gradient,
              borderColor: algoColors[algo],
              borderWidth: 2,
              fill: true,
              tension: 0.4,
              pointRadius: 0,
              pointHoverRadius: 4,
              pointHoverBackgroundColor: algoColors[algo],
              pointHoverBorderColor: '#fff',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            intersect: false,
            mode: 'index'
          },
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              titleColor: '#333',
              bodyColor: '#333',
              borderColor: '#ddd',
              borderWidth: 1,
              padding: 10,
              displayColors: false,
              callbacks: {
                title: function(tooltipItems) {
                  return `Block #${tooltipItems[0].label}`;
                },
                label: function(context) {
                  return `Difficulty: ${context.raw.toFixed(8)}`;
                },
              },
            },
          },
          scales: {
            x: {
              display: false,
            },
            y: {
              beginAtZero: false,
              grid: {
                color: 'rgba(0, 0, 0, 0.05)',
                drawBorder: false,
              },
              ticks: {
                color: '#888',
                font: {
                  size: 10,
                },
                callback: function(value) {
                  if (value >= 1000) {
                    return (value / 1000).toFixed(1) + 'K';
                  }
                  return value;
                }
              }
            }
          },
          animations: {
            radius: {
              duration: 400,
              easing: 'linear',
            }
          },
        },
      });
      
      // Store in local array and in ref
      chartInstances.current[index] = chartInstance;
      localChartInstances.push(chartInstance);
    });
    
    // Cleanup function to destroy all chart instances created in this effect
    return () => {
      localChartInstances.forEach((instance) => {
        if (instance) {
          instance.destroy();
        }
      });
    };
  }, [difficulties, isLoading]);

  // Function to get the latest difficulty for an algo
  const getLatestDifficulty = (algo) => {
    const diffArray = difficulties[algo];
    if (!diffArray || diffArray.length === 0) return 'N/A';
    return diffArray[diffArray.length - 1].toFixed(8);
  };

  // Render the component
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
              <TrendingUpIcon sx={{ fontSize: '2.5rem', color: '#002352', mr: 2 }} />
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
                Realtime DGB Algo Difficulty
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
              This page preloads the difficulty of the last 240 DGB blocks (1 hour) & will keep incrementing in realtime as blocks are mined.
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
              DigiByte uses independent, realtime difficulty adjustment for each algo known as <strong>DigiShield</strong> or <strong>MultiShield</strong> to further decentralize & secure the blockchain.
            </Typography>
          </CardContent>
        </Card>

        {isLoading ? (
          <Card elevation={3} sx={{ p: 4, borderRadius: '8px', textAlign: 'center' }}>
            <Typography variant="h5" sx={{ color: '#555' }}>
              Loading difficulty data...
            </Typography>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {algoNames.map((algo, index) => (
              <Grid item xs={12} sm={6} md={4} key={algo}>
                <Card 
                  elevation={3} 
                  sx={{
                    height: '100%',
                    borderTop: `4px solid ${algoColors[algo]}`,
                    borderRadius: '8px',
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                    }
                  }}
                >
                  <CardContent>
                    <Typography variant="h5" fontWeight="bold" sx={{ mb: 1, color: algoColors[algo], textAlign: 'center' }}>
                      {algo}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ mb: 2, textAlign: 'center', color: '#666' }}>
                      Latest Difficulty: <strong>{getLatestDifficulty(algo)}</strong>
                    </Typography>
                    
                    <Box sx={{ height: 200, position: 'relative' }}>
                      <canvas
                        ref={(el) => {
                          chartRefs.current[index] = el;
                        }}
                        style={{ width: '100%', height: '100%' }}
                      />
                    </Box>
                    
                    <Typography variant="body2" sx={{ mt: 2, textAlign: 'center', color: '#666', fontSize: '0.85rem' }}>
                      Showing difficulty changes over the last {difficulties[algo]?.length || 0} blocks
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            
            <Grid item xs={12}>
              <Card 
                elevation={3}
                sx={{
                  mt: 2,
                  borderRadius: '8px',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ textAlign: 'center', color: '#002352' }}>
                    About DigiShield Difficulty Adjustment
                  </Typography>
                  
                  <Divider sx={{ maxWidth: '100px', mx: 'auto', my: 2 }} />
                  
                  <Typography variant="body1" paragraph>
                    <strong>DigiShield</strong> is DigiByte's innovative difficulty adjustment algorithm that recalibrates mining difficulty in real-time with every block. 
                    This technology was developed to protect the DigiByte blockchain from sudden increases or decreases in hashrate.
                  </Typography>
                  
                  <Typography variant="body1" paragraph>
                    Unlike Bitcoin's difficulty adjustment which occurs every 2016 blocks (approximately every two weeks), DigiShield
                    responds to network changes immediately, providing several benefits:
                  </Typography>
                  
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ pl: 2, borderLeft: '3px solid #0066cc', mb: 2 }}>
                        <Typography variant="body1" fontWeight="bold">Protection Against Mining Attacks</Typography>
                        <Typography variant="body2">Prevents "hash-and-run" attacks where large amounts of hashpower briefly mine a cryptocurrency then leave.</Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ pl: 2, borderLeft: '3px solid #0066cc', mb: 2 }}>
                        <Typography variant="body1" fontWeight="bold">Stability in Block Times</Typography>
                        <Typography variant="body2">Maintains consistent block times even when mining power fluctuates dramatically.</Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ pl: 2, borderLeft: '3px solid #0066cc', mb: 2 }}>
                        <Typography variant="body1" fontWeight="bold">Multiple Algorithm Support</Typography>
                        <Typography variant="body2">Allows each of DigiByte's five mining algorithms to have their difficulty adjusted independently.</Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ pl: 2, borderLeft: '3px solid #0066cc', mb: 2 }}>
                        <Typography variant="body1" fontWeight="bold">Industry Innovation</Typography>
                        <Typography variant="body2">DigiShield was so effective that versions of it have been adopted by many other cryptocurrencies.</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default DifficultiesPage;