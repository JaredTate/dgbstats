import React, { useRef, useEffect, useState } from 'react';
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

Chart.register(...registerables);

const SupplyPage = ({ worldPopulation }) => {
  const chartRef = useRef(null);
  const [txOutsetInfo, setTxOutsetInfo] = useState(null);
  const [txOutsetInfoLoading, setTxOutsetInfoLoading] = useState(true);

  useEffect(() => {
    const socket = new WebSocket(config.wsBaseUrl);

    socket.onopen = () => {
      console.log('WebSocket connection established');
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'initialData') {
        setTxOutsetInfo(message.data.txOutsetInfo);
        setTxOutsetInfoLoading(false);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    if (!txOutsetInfo || !chartRef.current) return;

    const currentSupply = txOutsetInfo.total_amount;
    const totalSupply = 21000000000;
    const today = new Date();
    const start = new Date('2014-01-10');
    const end = new Date('2035-07-01');

    const ctx = chartRef.current.getContext('2d');
    
    // Apply custom chart styling exactly as the original
    const chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [start, today, end],
        datasets: [
          {
            label: 'DGB Supply History',
            data: [0, currentSupply, currentSupply],
            borderColor: '#0066cc',
            backgroundColor: '#0066cc',
            borderWidth: 2,
            fill: true,
            tension: 0.0,
            pointRadius: 2,
            pointBackgroundColor: '#0066cc',
          },
          {
            label: 'Current DGB Supply',
            data: [currentSupply, currentSupply],
            borderColor: '#0066cc',
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false,
          },
          {
            label: 'Max DGB Supply',
            data: [{x: start, y: totalSupply}, {x: end, y: totalSupply}],
            borderColor: '#000',
            borderWidth: 3,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false,
          },
          {
            label: 'DGB Yet To Be Mined',
            data: [{x: today, y: currentSupply}, {x: end, y: totalSupply}],
            borderColor: '#002352',
            backgroundColor: '#002352',
            borderWidth: 2,
            fill: true,
            tension: 0.0,
            pointRadius: 0,
          }
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'year',
              displayFormats: {
                year: 'yyyy'
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
            title: {
              display: true,
              text: 'Year',
              color: '#555',
              font: {
                size: 14,
                weight: 'bold'
              },
            },
          },
          y: {
            title: {
              display: true,
              text: 'DGB Supply (in Billions)',
              color: '#555',
              font: {
                size: 14,
                weight: 'bold'
              },
            },
            ticks: {
              callback: (value) => `${(value / 1000000000).toFixed(2)} B`,
              color: '#666',
            },
            suggestedMax: totalSupply,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            titleColor: '#333',
            bodyColor: '#333',
            borderColor: '#ddd',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            bodyFont: {
              size: 13
            },
            titleFont: {
              size: 14,
              weight: 'bold'
            },
            callbacks: {
              label: function (context) {
                let label = context.dataset.label;
                let value = (context.raw / 1000000000).toFixed(2) + ' B';
                return `${label}: ${value}`;
              },
            },
          },
        },
      },
    });

    return () => {
      chartInstance.destroy();
    };
  }, [txOutsetInfo]);

  if (txOutsetInfoLoading) {
    return (
      <Box sx={{ 
        minHeight: '70vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        bgcolor: '#f8f9fa' 
      }}>
        <Typography variant="h5" sx={{ color: '#555' }}>
          Loading supply data...
        </Typography>
      </Box>
    );
  }

  if (!txOutsetInfo) {
    return (
      <Box sx={{ 
        minHeight: '70vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        bgcolor: '#f8f9fa' 
      }}>
        <Typography variant="h5" sx={{ color: '#555' }}>
          No supply data available.
        </Typography>
      </Box>
    );
  }

  const currentSupply = txOutsetInfo.total_amount;
  const totalSupply = 21000000000;
  const remainingSupply = totalSupply - currentSupply;
  const currentSupplyPercentage = ((currentSupply / totalSupply) * 100).toFixed(1);
  const remainingSupplyPercentage = ((remainingSupply / totalSupply) * 100).toFixed(1);
  const dgbPerPerson = (currentSupply / worldPopulation).toFixed(2);

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
            <Card 
              elevation={3} 
              sx={{
                height: '100%',
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                },
                borderTop: '4px solid #0066cc',
                borderRadius: '8px'
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold" color="text.primary">
                    Current Circulating Supply
                  </Typography>
                  <Box sx={{ 
                    bgcolor: '#0066cc',
                    borderRadius: '50%',
                    width: 40,
                    height: 40,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <TokenIcon sx={{ color: 'white' }} />
                  </Box>
                </Box>
                
                <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: '#0066cc' }}>
                  {(currentSupply / 1000000000).toFixed(2)} Billion DGB
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Chip 
                    label={`${currentSupplyPercentage}%`} 
                    sx={{ 
                      bgcolor: 'rgba(0, 102, 204, 0.1)',
                      color: '#0066cc',
                      fontWeight: 'bold',
                      fontSize: '1.2rem',
                      height: '36px',
                      px: 1.5
                    }} 
                  />
                  <Typography variant="body1" sx={{ ml: 1 }}>
                    of the maximum supply
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  The current circulating supply calculated from all UTXO's as of the latest block.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Remaining Supply Card */}
          <Grid item xs={12} md={6}>
            <Card 
              elevation={3} 
              sx={{
                height: '100%',
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                },
                borderTop: '4px solid #fb8c00',
                borderRadius: '8px'
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold" color="text.primary">
                    Remaining Supply To Be Mined
                  </Typography>
                  <Box sx={{ 
                    bgcolor: '#fb8c00',
                    borderRadius: '50%',
                    width: 40,
                    height: 40,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <HourglassEmptyIcon sx={{ color: 'white' }} />
                  </Box>
                </Box>
                
                <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: '#fb8c00' }}>
                  {(remainingSupply / 1000000000).toFixed(2)} Billion DGB
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Chip 
                    label={`${remainingSupplyPercentage}%`} 
                    sx={{ 
                      bgcolor: 'rgba(251, 140, 0, 0.1)',
                      color: '#fb8c00',
                      fontWeight: 'bold',
                      fontSize: '1.2rem',
                      height: '36px',
                      px: 1.5
                    }} 
                  />
                  <Typography variant="body1" sx={{ ml: 1 }}>
                    of the maximum supply
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  Remaining DGB to be mined until the maximum supply of 21 billion DGB is reached in 2035.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Additional Information Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Per Person Stats */}
          <Grid item xs={12} md={6}>
            <Card 
              elevation={3} 
              sx={{
                height: '100%',
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                },
                borderTop: '4px solid #43a047',
                borderRadius: '8px'
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold" color="text.primary">
                    DGB Per Person
                  </Typography>
                  <Box sx={{ 
                    bgcolor: '#43a047',
                    borderRadius: '50%',
                    width: 40,
                    height: 40,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <PeopleIcon sx={{ color: 'white' }} />
                  </Box>
                </Box>
                
                <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: '#43a047' }}>
                  {dgbPerPerson} DGB
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Chip 
                    label={`${worldPopulation.toLocaleString()}`}
                    sx={{ 
                      bgcolor: 'rgba(67, 160, 71, 0.1)',
                      color: '#43a047',
                      fontWeight: 'bold',
                      fontSize: '1.2rem',
                      height: '36px',
                      px: 1.5
                    }} 
                  />
                  <Typography variant="body1" sx={{ ml: 1 }}>
                    World Population
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  The amount of DigiByte available per person on Earth if evenly distributed based on current supply.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Mining End Date */}
          <Grid item xs={12} md={6}>
            <Card 
              elevation={3} 
              sx={{
                height: '100%',
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                },
                borderTop: '4px solid #9c27b0',
                borderRadius: '8px'
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold" color="text.primary">
                    Mining End Date
                  </Typography>
                  <Box sx={{ 
                    bgcolor: '#9c27b0',
                    borderRadius: '50%',
                    width: 40,
                    height: 40,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <CalendarTodayIcon sx={{ color: 'white' }} />
                  </Box>
                </Box>
                
                <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: '#9c27b0' }}>
                  2035
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Chip 
                    label="21 Years Total" 
                    sx={{ 
                      bgcolor: 'rgba(156, 39, 176, 0.1)',
                      color: '#9c27b0',
                      fontWeight: 'bold',
                      fontSize: '1.2rem',
                      height: '36px',
                      px: 1.5
                    }} 
                  />
                  <Typography variant="body1" sx={{ ml: 1 }}>
                    Mining Duration
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  DigiByte follows a 21 year mining schedule which will be completed in the year 2035.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Chart Card */}
        <Card 
          elevation={3}
          sx={{
            p: { xs: 2, md: 3 },
            borderRadius: '12px',
            mb: 4
          }}
        >
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, textAlign: 'center' }}>
            DigiByte Supply Distribution Timeline
          </Typography>
          <Box sx={{ height: { xs: '350px', md: '450px' }, position: 'relative' }}>
            <canvas ref={chartRef} />
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
