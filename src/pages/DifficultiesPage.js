import React, { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-luxon';
import { LineController } from 'chart.js';
import {
  Typography, Container, Box, Card, CardContent,
  Divider, Grid, useTheme, useMediaQuery, Chip
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useNetwork } from '../context/NetworkContext';

Chart.register(...registerables);
Chart.register(LineController);

/**
 * Array of DigiByte's five mining algorithm names
 * Each algorithm has independent difficulty adjustment via DigiShield
 */
const algoNames = ['SHA256D', 'Scrypt', 'Skein', 'Qubit', 'Odo'];

/**
 * Color mapping for each mining algorithm for consistent UI styling
 * Used in charts, cards, and visual indicators throughout the page
 */
const algoColors = {
  'SHA256D': '#4caf50', // Green - Most secure/established
  'Scrypt': '#2196f3', // Blue - Memory-hard algorithm
  'Skein': '#ff9800', // Orange - SHA-3 finalist
  'Qubit': '#9c27b0', // Purple - Lightweight algorithm
  'Odo': '#f44336', // Red - ASIC-resistant algorithm
};

/**
 * Hero section component for the DifficultiesPage
 * Displays title, description, and explanation of DigiShield technology
 * @param {Object} props - Component props
 * @param {boolean} props.isTestnet - Whether the current network is testnet
 * @param {Object} props.networkTheme - Theme colors for the current network
 * @returns {JSX.Element} Hero section with title and DigiShield explanation
 */
const HeroSection = ({ isTestnet, networkTheme }) => (
  <Card
    elevation={2}
    sx={{
      backgroundColor: '#f2f4f8',
      borderRadius: '12px',
      mb: 4,
      overflow: 'hidden',
      backgroundImage: 'linear-gradient(135deg, #f8f9fa 0%, #e8eef7 100%)',
      border: `1px solid ${isTestnet ? 'rgba(230, 81, 0, 0.2)' : 'rgba(0, 35, 82, 0.1)'}`
    }}
  >
    <CardContent sx={{ py: 4, textAlign: 'center' }}>
      {isTestnet && (
        <Chip
          label="TESTNET"
          sx={{
            mb: 2,
            bgcolor: networkTheme?.primary || '#e65100',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '0.85rem'
          }}
        />
      )}
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
        <TrendingUpIcon sx={{ fontSize: '2.5rem', color: networkTheme?.primary || '#002352', mr: 2 }} />
        <Typography
          variant="h2"
          component="h1"
          fontWeight="800"
          sx={{
            color: networkTheme?.primary || '#002352',
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
);

/**
 * Loading state component displayed while difficulty data is being fetched
 * @returns {JSX.Element} Loading card with spinner message
 */
const LoadingCard = () => (
  <Card elevation={3} sx={{ p: 4, borderRadius: '8px', textAlign: 'center' }}>
    <Typography variant="h5" sx={{ color: '#555' }}>
      Loading difficulty data...
    </Typography>
  </Card>
);

/**
 * Individual algorithm difficulty card component
 * Displays algorithm name, latest difficulty value, and real-time chart
 * @param {Object} props - Component props
 * @param {string} props.algo - Algorithm name (e.g., 'SHA256D', 'Scrypt')
 * @param {number} props.index - Array index for chart reference management
 * @param {Array} props.difficulties - Array of difficulty values for this algorithm
 * @param {Function} props.getLatestDifficulty - Function to get latest difficulty value
 * @param {Function} props.setChartRef - Function to set chart canvas reference
 * @returns {JSX.Element} Algorithm difficulty card with chart
 */
const AlgorithmCard = ({ algo, index, difficulties, getLatestDifficulty, setChartRef }) => (
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
            ref={(el) => setChartRef(index, el)}
            style={{ width: '100%', height: '100%' }}
          />
        </Box>
        
        <Typography variant="body2" sx={{ mt: 2, textAlign: 'center', color: '#666', fontSize: '0.85rem' }}>
          Showing difficulty changes over the last {difficulties?.length || 0} blocks
        </Typography>
      </CardContent>
    </Card>
  </Grid>
);

/**
 * Educational section about DigiShield difficulty adjustment algorithm
 * Explains the benefits and technical details of DigiByte's innovation
 * @returns {JSX.Element} Information card about DigiShield technology
 */
const DigiShieldInfoSection = () => (
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
);

/**
 * DifficultiesPage component - Real-time DigiByte algorithm difficulty tracking
 *
 * This page displays real-time difficulty charts for all five DigiByte mining algorithms:
 * SHA256D, Scrypt, Skein, Qubit, and Odo. Each algorithm uses DigiShield technology
 * for independent, real-time difficulty adjustment.
 *
 * Features:
 * - WebSocket connection for real-time difficulty updates
 * - Chart.js line charts showing difficulty trends over recent blocks
 * - Individual cards for each algorithm with color-coded styling
 * - Educational content about DigiShield technology
 * - Responsive design for mobile and desktop viewing
 * - Network-aware data fetching (mainnet/testnet support)
 *
 * @component
 * @param {Object} props - Component props
 * @param {Object} [props.difficultiesData] - Pre-loaded difficulties data (optional)
 * @returns {JSX.Element} Complete difficulties page with real-time charts
 */
const DifficultiesPage = ({ difficultiesData }) => {
  // Get theme for responsive design
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Network context for network-aware data fetching
  const { getApiUrl, isTestnet, wsBaseUrl, theme: networkTheme } = useNetwork();

  // Chart management references
  const chartRefs = useRef([]);
  const chartInstances = useRef([]);

  // State for algorithm difficulty data - initialized with empty arrays for each algorithm
  const [difficulties, setDifficulties] = useState(
    algoNames.reduce((acc, algo) => ({ ...acc, [algo]: [] }), {})
  );

  // Local state for fetched difficulties when prop is not provided
  const [localDifficulties, setLocalDifficulties] = useState(null);

  // Loading state management
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Fetch difficulties data when prop is not provided (e.g., for testnet)
   */
  useEffect(() => {
    if (!difficultiesData) {
      const fetchData = async () => {
        try {
          const response = await fetch(getApiUrl('/getblockchaininfo'));
          const data = await response.json();
          setLocalDifficulties(data.difficulties);
        } catch (error) {
          console.error('Error fetching difficulties:', error);
        }
      };
      fetchData();
    }
  }, [difficultiesData, getApiUrl]);

  // Use the prop if provided, otherwise use local state
  const currentDifficulties = difficultiesData || localDifficulties;

  /**
   * WebSocket connection effect for real-time difficulty updates
   * Handles initial data load and real-time block updates
   *
   * Message types handled:
   * - 'recentBlocks': Initial load of last 240 blocks with difficulty data
   * - 'newBlock': Real-time updates when new blocks are mined
   */
  useEffect(() => {
    const socket = new WebSocket(wsBaseUrl);

    /**
     * WebSocket connection opened successfully
     * Ready to receive difficulty data for all algorithms
     */
    socket.onopen = () => {
      console.log('WebSocket connection established for difficulties page');
    };

    /**
     * Handle incoming WebSocket messages with difficulty data
     * @param {MessageEvent} event - WebSocket message event
     */
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'recentBlocks') {
        /**
         * Process initial difficulty data for all algorithms
         * Filters blocks by algorithm and extracts difficulty values
         * Each algorithm gets its own array of recent difficulty values
         */
        const updatedDifficulties = algoNames.reduce((acc, algo) => {
          const algoDifficulties = message.data
            .filter((block) => block.algo === algo)
            .map((block) => block.difficulty);
          return { ...acc, [algo]: algoDifficulties };
        }, {});
        setDifficulties(updatedDifficulties);
        setIsLoading(false);
      } else if (message.type === 'newBlock') {
        /**
         * Handle real-time new block updates
         * Appends new difficulty value to the appropriate algorithm array
         * Triggers chart updates automatically via useEffect dependency
         */
        setDifficulties((prevDifficulties) => ({
          ...prevDifficulties,
          [message.data.algo]: [...prevDifficulties[message.data.algo], message.data.difficulty],
        }));
      }
    };

    /**
     * Handle WebSocket connection closure
     * Could implement reconnection logic here if needed
     */
    socket.onclose = () => {
      console.log('WebSocket connection closed - difficulties page');
    };

    /**
     * Cleanup function to properly close WebSocket connection
     * Prevents memory leaks when component unmounts
     */
    return () => {
      socket.close();
    };
  }, [wsBaseUrl]);

  /**
   * Chart rendering and updating effect
   * Creates/updates Chart.js line charts for each algorithm's difficulty data
   * Manages chart lifecycle and prevents "Canvas already in use" errors
   */
  useEffect(() => {
    if (isLoading) return;
    
    // Track chart instances created in this effect for proper cleanup
    const localChartInstances = [];
    
    algoNames.forEach((algo, index) => {
      const ctx = chartRefs.current[index]?.getContext('2d');
      if (!ctx) return;
      
      /**
       * Create gradient background for chart fill
       * Uses algorithm's brand color with transparency gradient
       */
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, `${algoColors[algo]}33`); // 20% opacity at top
      gradient.addColorStop(1, `${algoColors[algo]}05`); // 2% opacity at bottom

      /**
       * Destroy previous chart instance to prevent memory leaks
       * Critical for preventing "Canvas already in use" errors
       */
      if (chartInstances.current[index]) {
        chartInstances.current[index].destroy();
      }

      /**
       * Create new Chart.js line chart instance for this algorithm
       * Displays difficulty values over recent blocks with smooth line
       */
      const chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          // X-axis labels: block numbers starting from 1
          labels: difficulties[algo].map((_, i) => i + 1),
          datasets: [
            {
              label: `${algo} Difficulty`,
              data: difficulties[algo],
              backgroundColor: gradient,
              borderColor: algoColors[algo],
              borderWidth: 2,
              fill: true, // Fill area under line with gradient
              tension: 0.4, // Smooth curve
              pointRadius: 0, // Hide points normally
              pointHoverRadius: 4, // Show points on hover
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
            mode: 'index' // Show tooltip for nearest X position
          },
          plugins: {
            legend: {
              display: false, // Hide legend (title is shown above chart)
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
                /**
                 * Custom tooltip title showing block number
                 * @param {Array} tooltipItems - Chart.js tooltip items
                 * @returns {string} Formatted tooltip title
                 */
                title: function(tooltipItems) {
                  return `Block #${tooltipItems[0].label}`;
                },
                /**
                 * Custom tooltip label showing difficulty with 8 decimal precision
                 * @param {Object} context - Chart.js tooltip context
                 * @returns {string} Formatted difficulty value
                 */
                label: function(context) {
                  return `Difficulty: ${context.raw.toFixed(8)}`;
                },
              },
            },
          },
          scales: {
            x: {
              display: false, // Hide X-axis (block numbers)
            },
            y: {
              beginAtZero: false, // Start Y-axis from minimum data value
              grid: {
                color: 'rgba(0, 0, 0, 0.05)',
                drawBorder: false,
              },
              ticks: {
                color: '#888',
                font: {
                  size: 10,
                },
                /**
                 * Format Y-axis tick labels (difficulty values)
                 * Shows values >= 1000 as "1.2K" format for readability
                 * @param {number} value - Raw tick value
                 * @returns {string} Formatted tick label
                 */
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
      
      // Store chart instance for future cleanup and updates
      chartInstances.current[index] = chartInstance;
      localChartInstances.push(chartInstance);
    });
    
    /**
     * Cleanup function to destroy all chart instances
     * Prevents memory leaks and "Canvas already in use" errors
     * Called when component unmounts or dependencies change
     */
    return () => {
      localChartInstances.forEach((instance) => {
        if (instance) {
          instance.destroy();
        }
      });
    };
  }, [difficulties, isLoading]);

  /**
   * Get the most recent difficulty value for a specific algorithm
   * @param {string} algo - Algorithm name (e.g., 'SHA256D', 'Scrypt')
   * @returns {string} Latest difficulty formatted to 8 decimal places, or 'N/A' if no data
   */
  const getLatestDifficulty = (algo) => {
    const diffArray = difficulties[algo];
    if (!diffArray || diffArray.length === 0) return 'N/A';
    return diffArray[diffArray.length - 1].toFixed(8);
  };

  /**
   * Helper function to set chart canvas reference
   * @param {number} index - Algorithm index in the array
   * @param {HTMLCanvasElement} element - Canvas element reference
   */
  const setChartRef = (index, element) => {
    chartRefs.current[index] = element;
  };

  return (
    <Box 
      sx={{ 
        py: 4, 
        backgroundImage: 'linear-gradient(to bottom, #f8f9fa, #ffffff)',
        minHeight: '100vh'
      }}
    >
      <Container maxWidth="lg">
        <HeroSection isTestnet={isTestnet} networkTheme={networkTheme} />

        {isLoading ? (
          <LoadingCard />
        ) : (
          <Grid container spacing={3}>
            {algoNames.map((algo, index) => (
              <AlgorithmCard
                key={algo}
                algo={algo}
                index={index}
                difficulties={difficulties[algo]}
                getLatestDifficulty={getLatestDifficulty}
                setChartRef={setChartRef}
              />
            ))}
            
            <DigiShieldInfoSection />
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default DifficultiesPage;