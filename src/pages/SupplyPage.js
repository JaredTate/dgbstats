import React, { useRef, useEffect, useState, memo } from 'react';
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
import config from '../config';

// Register Chart.js components once outside the component
Chart.register(...registerables);

// Default supply data to show immediately
const DEFAULT_SUPPLY_DATA = {
  total_amount: 15700000000, // Approximate current supply as of May 2025
  height: 18500000,          // Estimated current height
  bestblock: "00000000000000000000000000000000",
  txouts: 20000000,
  bogosize: 1500000000
};

// Memoized stat card component to prevent unnecessary re-renders
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
      
      <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: color }}>
        {value}
      </Typography>
      
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
      
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </CardContent>
  </Card>
));

// Helper function to convert hex color to RGB for transparent backgrounds
function hexToRgb(hex) {
  // Remove the # if present
  hex = hex.replace('#', '');
  
  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `${r}, ${g}, ${b}`;
}

const SupplyPage = ({ worldPopulation }) => {
  const chartRef = useRef(null);
  // Initialize with default data to prevent null checks
  const [txOutsetInfo, setTxOutsetInfo] = useState(DEFAULT_SUPPLY_DATA);

  useEffect(() => {
    console.log(`Connecting to WebSocket at: ${config.wsBaseUrl}`);
    let socket;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 3;
    const reconnectDelay = 2000; // 2 seconds
    
    // Start with default data to render chart immediately
    // This is an estimated/cached value that will be updated with real data
    const defaultSupplyData = {
      total_amount: 15700000000, // Approximate current supply as of May 2025
      height: 18500000,          // Estimated current height
      bestblock: "00000000000000000000000000000000",
      txouts: 20000000,
      bogosize: 1500000000
    };
    
    // Show chart immediately with default data
    setTxOutsetInfo(defaultSupplyData);
    
    // Function to initialize WebSocket connection
    const connectWebSocket = () => {
      try {
        // Close existing socket if it exists
        if (socket) {
          socket.close();
        }
        
        socket = new WebSocket(config.wsBaseUrl);
        
        socket.onopen = () => {
          console.log('Supply WebSocket connection established successfully');
          reconnectAttempts = 0; // Reset reconnect counter on successful connection
        };
        
        socket.onerror = (error) => {
          console.error('Supply WebSocket connection error:', error);
          // We already have default data so chart is visible
        };
        
        socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            
            if (message.type === 'initialData' && message.data.txOutsetInfo) {
              // Update with real data once received
              console.log('Updating supply data with real values');
              setTxOutsetInfo(message.data.txOutsetInfo);
            }
          } catch (err) {
            console.error('Error processing supply WebSocket message:', err);
            // Chart already displayed with default data
          }
        };
        
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

    return () => {
      if (socket) {
        // Use 1000 code for normal closure
        socket.close(1000, "Component unmounted");
      }
    };
  }, []);

  // Create and cache chart configuration for better performance
  // Create a simplified chart configuration for better performance
  const createChartConfig = (currentSupply) => {
    const totalSupply = 21000000000;
    const today = new Date();
    const start = new Date('2014-01-10');
    const end = new Date('2035-07-01');
    
    // Define reusable styles to reduce object creation overhead
    const transparentGridColor = 'rgba(0, 0, 0, 0.05)';
    const dgbBlueColor = '#0066cc';
    const dgbDarkColor = '#002352';
    
    // Ultra-simplified chart config for maximum performance
    return {
      type: 'line',
      data: {
        labels: [start, today, end],
        datasets: [
          // Minimize dataset properties to bare essentials only
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
          {
            label: 'Max DGB Supply',
            data: [{x: start, y: totalSupply}, {x: end, y: totalSupply}],
            borderColor: '#000',
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false,
          },
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
        // Critical performance settings
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        normalized: true,
        spanGaps: true,
        
        // Simplified interaction model
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        },
        
        // Simplified elements config
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
        
        // Simplified scales
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
        
        // Minimal plugin settings
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
              label: (context) => `${context.dataset.label}: ${(context.raw / 1000000000).toFixed(2)} B`
            }
          }
        },
        
        // Performance optimization
        devicePixelRatio: 1
      }
    };
  };
  
  // Add ref for chart instance
  const chartInstanceRef = useRef(null);
  
  // Simplified chart rendering approach with direct cleanup
  useEffect(() => {
    if (!chartRef.current) return;
    
    // Always proceed with chart rendering, even with default data
    const currentSupply = txOutsetInfo ? txOutsetInfo.total_amount : 15700000000;
    console.log('Rendering supply chart with data:', currentSupply);
    
    const canvasElement = chartRef.current;
    
    // IMPORTANT: Clean up any existing charts before proceeding
    // First, destroy our own reference if it exists
    if (chartInstanceRef.current) {
      console.log('Destroying existing chart instance');
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }
    
    // Also clear any Chart.js global registry instances for this canvas
    // This is critical to avoid "Canvas is already in use" errors
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
    
    // Get a fresh context after cleanup
    const ctx = canvasElement.getContext('2d', { willReadFrequently: true });
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // Create the most basic config possible for immediate rendering
    const config = createChartConfig(currentSupply);
    
    // Force reset of Chart.js global state before creating a new chart
    // This is the most effective way to avoid "Canvas already in use" errors
    try {
      // Backup Chart defaults
      const chartDefaultsBackup = { ...Chart.defaults };
      
      // Reset Chart.js instance registry
      if (Chart.instances) {
        Object.keys(Chart.instances).forEach((key) => {
          delete Chart.instances[key];
        });
      }
      
      // Create new chart with clean registry
      console.log('Creating new chart with clean registry');
      chartInstanceRef.current = new Chart(ctx, config);
      
      // Restore defaults if needed
      Chart.defaults = chartDefaultsBackup;
    } catch (err) {
      console.error('Error creating chart:', err);
      
      // Last resort fallback - absolute minimum chart configuration
      try {
        const totalSupply = 21000000000;
        const today = new Date();
        const start = new Date('2014-01-10');
        const end = new Date('2035-07-01');
        
        console.warn('Attempting fallback minimal chart');
        // Create a minimal chart with just essential data
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
        
        // Create chart with minimal config
        chartInstanceRef.current = new Chart(ctx, minimalConfig);
      } catch (finalError) {
        console.error('Final attempt to create chart failed');
      }
    }
    
    // Cleanup function will destroy the chart when component updates or unmounts
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [txOutsetInfo]); // Only re-render when txOutsetInfo changes
  
  // No need for a separate unmount cleanup - handled in the main effect

  // Don't show loading state anymore since we have default data to show immediately
  // This ensures the chart container is always rendered

  // Safely access values with null checks to prevent errors
  const totalSupply = 21000000000;
  const currentSupply = txOutsetInfo ? txOutsetInfo.total_amount : 15700000000;
  const remainingSupply = totalSupply - currentSupply;
  const currentSupplyPercentage = ((currentSupply / totalSupply) * 100).toFixed(1);
  const remainingSupplyPercentage = ((remainingSupply / totalSupply) * 100).toFixed(1);
  const dgbPerPerson = worldPopulation ? (currentSupply / worldPopulation).toFixed(2) : "2.00";

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

        {/* Supply Statistics Cards */}
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

        {/* Additional Information Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Per Person Stats */}
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
          
          {/* Mining End Date */}
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

        {/* Chart Card */}
        <Card 
          elevation={3}
          sx={{
            p: { xs: 2, md: 3 },
            borderRadius: '12px',
            mb: 4,
            // Make sure card doesn't cause unnecessary layout shifts
            overflow: 'hidden'
          }}
        >
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, textAlign: 'center' }}>
            DigiByte Supply Distribution Timeline
          </Typography>
          <Box 
            sx={{ 
              height: { xs: '350px', md: '450px' }, 
              position: 'relative',
              // Add width constraints for better rendering performance
              width: '100%',
              // Reserve space for canvas to avoid layout shifts
              minHeight: '300px'
            }}
          >
            <canvas 
              ref={chartRef} 
              style={{ 
                // Hardware acceleration for better performance
                transform: 'translateZ(0)',
                // Ensure proper rendering across devices
                maxWidth: '100%',
                height: '100%'
              }}
            />
          </Box>
          <Typography variant="body2" sx={{ mt: 2, textAlign: 'center', color: '#666' }}>
            This chart shows the historical and projected supply distribution of DigiByte from launch in 2014 until the mining completion in 2035.
          </Typography>
        </Card>
      </Container>
    </Box>
  );
};

export default SupplyPage;
