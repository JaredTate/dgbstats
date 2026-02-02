import React, { useRef, useEffect, useState, memo, useCallback } from 'react';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-luxon';
import {
  Typography, Container, Box, Card, CardContent,
  Divider, Grid, Chip
} from '@mui/material';
import TokenIcon from '@mui/icons-material/Token';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PeopleIcon from '@mui/icons-material/People';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { useNetwork } from '../context/NetworkContext';

// Register Chart.js components globally (once outside component)
Chart.register(...registerables);

/**
 * Default supply data for immediate display
 * Provides fallback values to prevent loading states and ensure chart renders immediately
 * These values are approximations that will be updated with real-time data when available
 */
const DEFAULT_SUPPLY_DATA = {
  total_amount: 15700000000, // Approximate current supply as of May 2025
  height: 18500000,          // Estimated current height
  bestblock: "00000000000000000000000000000000",
  txouts: 20000000,
  bogosize: 1500000000
};

/**
 * Helper function to convert hex color to RGB components
 * Used for creating transparent color variations in the UI
 * 
 * @param {string} hex - Hex color code (with or without #)
 * @returns {string} - RGB values as comma-separated string
 */
function hexToRgb(hex) {
  // Remove the # if present
  hex = hex.replace('#', '');
  
  // Parse the hex values to RGB components
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `${r}, ${g}, ${b}`;
}

/**
 * StatCard - Memoized component for displaying supply statistics
 * Prevents unnecessary re-renders for better performance
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Card title
 * @param {string} props.value - Main statistic value
 * @param {string} props.percentage - Percentage value for chip display
 * @param {string} props.percentageLabel - Label for percentage context
 * @param {string} props.description - Explanatory text
 * @param {React.Element} props.icon - Material-UI icon component
 * @param {string} props.color - Theme color for styling
 */
const StatCard = memo(({ title, value, percentage, percentageLabel, description, icon, color }) => (
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
        <Box sx={{ 
          bgcolor: color,
          borderRadius: '50%',
          width: 40,
          height: 40,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {icon}
        </Box>
      </Box>
      
      {/* Main statistic value */}
      <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: color }}>
        {value}
      </Typography>
      
      {/* Percentage chip and label */}
      {percentage && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Chip 
            label={percentage}
            sx={{ 
              bgcolor: `rgba(${hexToRgb(color)}, 0.1)`,
              color: color,
              fontWeight: 'bold',
              fontSize: '1.2rem',
              height: '36px',
              px: 1.5
            }} 
          />
          <Typography variant="body1" sx={{ ml: 1 }}>
            {percentageLabel}
          </Typography>
        </Box>
      )}
      
      {/* Descriptive text */}
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </CardContent>
  </Card>
));

/**
 * SupplyPage Component - DigiByte Supply Statistics and Visualization
 * 
 * This page provides comprehensive information about DigiByte's supply metrics including:
 * - Current circulating supply and remaining supply to be mined
 * - Historical and projected supply timeline visualization
 * - Per-person distribution statistics
 * - Mining schedule and completion timeline
 * 
 * Features real-time data updates via WebSocket with fallback to default values
 * for immediate rendering and better user experience.
 */
const SupplyPage = ({ worldPopulation, txOutsetInfo: propTxOutsetInfo }) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const { getApiUrl, wsBaseUrl, isTestnet } = useNetwork();

  // Initialize with default data to prevent loading states and null checks
  const [txOutsetInfo, setTxOutsetInfo] = useState(DEFAULT_SUPPLY_DATA);
  const [localTxOutsetInfo, setLocalTxOutsetInfo] = useState(null);

  // Memoize getApiUrl to use in useEffect dependencies
  const memoizedGetApiUrl = useCallback(getApiUrl, [getApiUrl]);

  /**
   * Fetch supply data from API when prop is not provided (e.g., for testnet)
   * This ensures the page works independently when not receiving data via props
   */
  useEffect(() => {
    if (!propTxOutsetInfo) {
      const fetchData = async () => {
        try {
          const response = await fetch(memoizedGetApiUrl('/gettxoutsetinfo'));
          const data = await response.json();
          setLocalTxOutsetInfo(data);
        } catch (error) {
          console.error('Error fetching tx outset info:', error);
        }
      };
      fetchData();
    }
  }, [propTxOutsetInfo, memoizedGetApiUrl]);

  // Use the prop if provided, otherwise use local state fetched from API
  const supplyData = propTxOutsetInfo || localTxOutsetInfo;

  /**
   * WebSocket connection management for real-time supply data
   * Implements reconnection logic and graceful fallback to default data
   */
  useEffect(() => {
    console.log(`Connecting to WebSocket at: ${wsBaseUrl}`);
    let socket;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 3;
    const reconnectDelay = 2000; // 2 seconds

    // Start with default data to render chart immediately
    // This ensures the page is functional even if WebSocket fails
    const defaultSupplyData = {
      total_amount: 15700000000, // Approximate current supply as of May 2025
      height: 18500000,          // Estimated current height
      bestblock: "00000000000000000000000000000000",
      txouts: 20000000,
      bogosize: 1500000000
    };

    // Initialize with default data for immediate display
    setTxOutsetInfo(defaultSupplyData);

    /**
     * Initialize WebSocket connection with retry logic
     * Handles connection, error, and reconnection scenarios
     */
    const connectWebSocket = () => {
      try {
        // Close existing socket if it exists
        if (socket) {
          socket.close();
        }

        socket = new WebSocket(wsBaseUrl);
        
        // Connection established successfully
        socket.onopen = () => {
          console.log('Supply WebSocket connection established successfully');
          reconnectAttempts = 0; // Reset reconnect counter on successful connection
        };
        
        // Handle connection errors
        socket.onerror = (error) => {
          console.error('Supply WebSocket connection error:', error);
          // Chart already displays with default data, so no user-facing error
        };
        
        // Process incoming real-time data
        socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            
            // Update with real supply data when received
            if (message.type === 'initialData' && message.data.txOutsetInfo) {
              console.log('Updating supply data with real values');
              setTxOutsetInfo(message.data.txOutsetInfo);
            }
          } catch (err) {
            console.error('Error processing supply WebSocket message:', err);
            // Chart continues displaying with default data
          }
        };
        
        // Handle connection closure with reconnection logic
        socket.onclose = (event) => {
          console.log('Supply WebSocket connection closed', event.code, event.reason);
          
          // Attempt to reconnect if not max attempts reached and not a normal closure
          if (reconnectAttempts < maxReconnectAttempts && event.code !== 1000) {
            console.log(`Attempting to reconnect (${reconnectAttempts + 1}/${maxReconnectAttempts})...`);
            setTimeout(connectWebSocket, reconnectDelay);
            reconnectAttempts++;
          }
        };
      } catch (err) {
        console.error('Error creating supply WebSocket connection:', err);
        // Chart already displayed with default data
      }
    };
    
    // Initial connection attempt
    connectWebSocket();

    // Cleanup function
    return () => {
      if (socket) {
        // Use normal closure code
        socket.close(1000, "Component unmounted");
      }
    };
  }, [wsBaseUrl]);

  /**
   * Create Chart.js configuration for supply timeline visualization
   * Optimized for performance with simplified styling and minimal complexity
   * 
   * @param {number} currentSupply - Current DGB supply amount
   * @returns {Object} - Chart.js configuration object
   */
  const createChartConfig = (currentSupply) => {
    const totalSupply = 21000000000; // Maximum DGB supply
    const today = new Date();
    const start = new Date('2014-01-10'); // DigiByte launch date
    const end = new Date('2035-07-01');   // Estimated mining completion
    
    // Define reusable color constants for consistency
    const transparentGridColor = 'rgba(0, 0, 0, 0.05)';
    const dgbBlueColor = '#0066cc';
    const dgbDarkColor = '#002352';
    
    return {
      type: 'line',
      data: {
        labels: [start, today, end],
        datasets: [
          // Historical and current supply
          {
            label: 'DGB Supply History',
            data: [0, currentSupply, currentSupply],
            borderColor: dgbBlueColor,
            backgroundColor: dgbBlueColor,
            fill: true,
            borderWidth: 2,
            tension: 0.0,
            pointRadius: 1,
          },
          // Maximum supply line (21 billion cap)
          {
            label: 'Max DGB Supply',
            data: [{x: start, y: totalSupply}, {x: end, y: totalSupply}],
            borderColor: '#000',
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false,
          },
          // Future supply projection
          {
            label: 'DGB Yet To Be Mined',
            data: [{x: today, y: currentSupply}, {x: end, y: totalSupply}],
            borderColor: dgbDarkColor,
            backgroundColor: dgbDarkColor,
            borderWidth: 1,
            fill: true,
            pointRadius: 0,
          }
        ],
      },
      options: {
        // Performance optimizations
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        normalized: true,
        spanGaps: true,
        
        // Simplified interaction for better performance
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        },
        
        // Minimal element styling
        elements: {
          line: {
            tension: 0,
            borderWidth: 2,
          },
          point: {
            radius: 0,
            hoverRadius: 3,
          }
        },
        
        // Chart scales configuration
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'year',
              displayFormats: { year: 'yyyy' }
            },
            grid: {
              display: false,
              drawBorder: false,
            },
            title: {
              display: true,
              text: 'Year',
              color: '#555',
            },
            ticks: {
              maxTicksLimit: 5,
              autoSkip: true,
            }
          },
          y: {
            title: {
              display: true,
              text: 'DGB Supply (in Billions)',
              color: '#555',
            },
            ticks: {
              // Format large numbers as billions
              callback: (value) => `${(value / 1000000000).toFixed(1)} B`,
              maxTicksLimit: 6,
            },
            grid: {
              color: transparentGridColor,
              drawBorder: false,
              tickLength: 0,
            },
          },
        },
        
        // Plugin configurations
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              usePointStyle: true,
              boxWidth: 10,
              boxHeight: 10,
              padding: 10,
              font: { size: 11 }
            }
          },
          tooltip: {
            enabled: true,
            backgroundColor: '#fff',
            titleColor: '#333',
            bodyColor: '#333',
            borderColor: '#ddd',
            borderWidth: 1,
            padding: 6,
            callbacks: {
              // Format tooltip values as billions
              label: (context) => `${context.dataset.label}: ${(context.raw / 1000000000).toFixed(2)} B`
            }
          }
        },
        
        // Performance optimization for lower-end devices
        devicePixelRatio: 1
      }
    };
  };
  
  /**
   * Chart rendering and management effect
   * Handles Chart.js instance creation, cleanup, and re-rendering
   * Implements robust error handling and fallback mechanisms
   */
  useEffect(() => {
    if (!chartRef.current) return;

    // Use supplyData which combines prop, local fetch, and WebSocket data
    // Priority: propTxOutsetInfo > localTxOutsetInfo > txOutsetInfo (WebSocket) > DEFAULT_SUPPLY_DATA
    const effectiveSupplyData = supplyData || txOutsetInfo || DEFAULT_SUPPLY_DATA;
    const currentSupply = effectiveSupplyData.total_amount;
    console.log('Rendering supply chart with data:', currentSupply);
    
    const canvasElement = chartRef.current;
    
    // Critical: Clean up any existing charts to prevent "Canvas is already in use" errors
    if (chartInstanceRef.current) {
      console.log('Destroying existing chart instance');
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }
    
    // Also clear Chart.js global registry instances for this canvas
    if (Chart.instances) {
      Object.values(Chart.instances).forEach((instance) => {
        try {
          if (instance.canvas === canvasElement) {
            console.log('Destroying registered Chart instance');
            instance.destroy();
          }
        } catch (err) {
          // Ignore errors during cleanup
        }
      });
    }
    
    // Get fresh context and clear canvas
    const ctx = canvasElement.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // Create chart configuration
    const config = createChartConfig(currentSupply);
    
    // Create new chart with comprehensive error handling
    try {
      console.log('Creating new chart with clean registry');
      chartInstanceRef.current = new Chart(ctx, config);
    } catch (err) {
      console.error('Error creating chart:', err);
      
      // Fallback: Create minimal chart if main configuration fails
      try {
        const totalSupply = 21000000000;
        const today = new Date();
        const start = new Date('2014-01-10');
        const end = new Date('2035-07-01');
        
        console.warn('Attempting fallback minimal chart');
        const minimalConfig = {
          type: 'line',
          data: {
            labels: [start, today, end],
            datasets: [{
              data: [0, currentSupply, totalSupply],
              borderColor: '#0066cc',
              borderWidth: 2,
            }]
          },
          options: {
            animation: false,
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { display: true }, y: { display: true } }
          }
        };
        
        chartInstanceRef.current = new Chart(ctx, minimalConfig);
      } catch (finalError) {
        console.error('Final attempt to create chart failed:', finalError);
      }
    }
    
    // Cleanup function
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [supplyData, txOutsetInfo]); // Re-render when supply data changes

  // Calculate supply statistics with safe defaults
  // Use supplyData which combines prop, local fetch, and WebSocket data
  const effectiveSupplyData = supplyData || txOutsetInfo || DEFAULT_SUPPLY_DATA;
  const totalSupply = 21000000000;
  const currentSupply = effectiveSupplyData.total_amount;
  const remainingSupply = totalSupply - currentSupply;
  const currentSupplyPercentage = ((currentSupply / totalSupply) * 100).toFixed(1);
  const remainingSupplyPercentage = ((remainingSupply / totalSupply) * 100).toFixed(1);
  const dgbPerPerson = worldPopulation ? (currentSupply / worldPopulation).toFixed(2) : "2.00";

  /**
   * HeroSection - Page header with title and description
   */
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
          <TokenIcon sx={{ fontSize: '2.5rem', color: '#002352', mr: 2 }} />
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
            DigiByte Supply Statistics
          </Typography>
        </Box>
        
        <Divider sx={{ maxWidth: '150px', mx: 'auto', mb: 3, borderColor: '#0066cc', borderWidth: 2 }} />
        
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
          DigiByte has a limited supply of 21 billion DGB that will be fully mined by the year 2035.
          The blockchain was launched on January 10th, 2014 with a fair, pre-announced public launch.
        </Typography>
      </CardContent>
    </Card>
  );

  /**
   * SupplyStatisticsSection - Main supply metrics cards
   */
  const SupplyStatisticsSection = () => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {/* Current Supply Card */}
      <Grid item xs={12} md={6}>
        <StatCard
          title="Current Circulating Supply"
          value={`${(currentSupply / 1000000000).toFixed(2)} Billion DGB`}
          percentage={`${currentSupplyPercentage}%`}
          percentageLabel="of the maximum supply"
          description="The current circulating supply calculated from all UTXO's as of the latest block."
          icon={<TokenIcon sx={{ color: 'white' }} />}
          color="#0066cc"
        />
      </Grid>
      
      {/* Remaining Supply Card */}
      <Grid item xs={12} md={6}>
        <StatCard
          title="Remaining Supply To Be Mined"
          value={`${(remainingSupply / 1000000000).toFixed(2)} Billion DGB`}
          percentage={`${remainingSupplyPercentage}%`}
          percentageLabel="of the maximum supply"
          description="Remaining DGB to be mined until the maximum supply of 21 billion DGB is reached in 2035."
          icon={<HourglassEmptyIcon sx={{ color: 'white' }} />}
          color="#fb8c00"
        />
      </Grid>
    </Grid>
  );

  /**
   * AdditionalInfoSection - Secondary statistics and mining information
   */
  const AdditionalInfoSection = () => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {/* Per Person Distribution Stats */}
      <Grid item xs={12} md={6}>
        <StatCard
          title="DGB Per Person"
          value={`${dgbPerPerson} DGB`}
          percentage={worldPopulation ? worldPopulation.toLocaleString() : "8,000,000,000"}
          percentageLabel="World Population"
          description="The amount of DigiByte available per person on Earth if evenly distributed based on current supply."
          icon={<PeopleIcon sx={{ color: 'white' }} />}
          color="#43a047"
        />
      </Grid>
      
      {/* Mining Timeline Information */}
      <Grid item xs={12} md={6}>
        <StatCard
          title="Mining End Date"
          value="2035"
          percentage="21 Years Total"
          percentageLabel="Mining Duration"
          description="DigiByte follows a 21 year mining schedule which will be completed in the year 2035."
          icon={<CalendarTodayIcon sx={{ color: 'white' }} />}
          color="#9c27b0"
        />
      </Grid>
    </Grid>
  );

  /**
   * ChartSection - Supply timeline visualization
   */
  const ChartSection = () => (
    <Card 
      elevation={3}
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: '12px',
        mb: 4,
        overflow: 'hidden'
      }}
    >
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, textAlign: 'center' }}>
        DigiByte Supply Distribution Timeline
      </Typography>
      
      {/* Chart container with optimized styling */}
      <Box 
        sx={{ 
          height: { xs: '350px', md: '450px' }, 
          position: 'relative',
          width: '100%',
          minHeight: '300px' // Reserve space to prevent layout shifts
        }}
      >
        <canvas 
          ref={chartRef} 
          style={{ 
            // Hardware acceleration for better performance
            transform: 'translateZ(0)',
            maxWidth: '100%',
            height: '100%'
          }}
        />
      </Box>
      
      <Typography variant="body2" sx={{ mt: 2, textAlign: 'center', color: '#666' }}>
        This chart shows the historical and projected supply distribution of DigiByte from launch in 2014 until mining completion in 2035.
      </Typography>
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
        {/* Page header with title and description */}
        <HeroSection />

        {/* Main supply statistics cards */}
        <SupplyStatisticsSection />

        {/* Additional information and mining timeline */}
        <AdditionalInfoSection />

        {/* Interactive supply timeline chart */}
        <ChartSection />
      </Container>
    </Box>
  );
};

export default SupplyPage;