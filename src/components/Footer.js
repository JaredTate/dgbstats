import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Grid, Box, IconButton, 
  Divider, Stack
} from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import XIcon from './XIcon';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import BarChartIcon from '@mui/icons-material/BarChart';
import axios from 'axios';
import config from '../config';

const Footer = () => {
  const [visitStats, setVisitStats] = useState({
    visitsLast30Days: 0,
    totalVisits: 0,
    uniqueVisitors: 0,
  });

  useEffect(() => {
    const fetchVisitStats = async () => {
      try {
        const response = await axios.get(`${config.apiBaseUrl}/api/visitstats`);
        console.log('Fetched visit stats:', response.data);
        setVisitStats(response.data);
      } catch (error) {
        console.error('Error fetching visit stats:', error);
      }
    };

    // Fetch visit stats initially
    fetchVisitStats();

    // Set up an interval to fetch visit stats every 60 seconds
    const interval = setInterval(fetchVisitStats, 60000);

    // Clean up the interval on component unmount
    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <Box 
      component="footer" 
      sx={{ 
        backgroundColor: '#002352',
        color: 'white',
        py: 4,
        mt: 'auto'
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box 
                component="img"
                src="/logo.png"
                alt="DigiByte Logo"
                sx={{ height: 40, mr: 1 }}
              />
              <Typography variant="h6" fontWeight="bold">
                DigiByte Stats
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Providing real-time statistics for the DigiByte blockchain since 2024
            </Typography>
            <Stack direction="row" spacing={1}>
              <IconButton 
                href="https://github.com/JaredTate/dgbstats" 
                target="_blank"
                sx={{ color: 'white', '&:hover': { color: '#0066cc' } }}
                aria-label="GitHub"
              >
                <GitHubIcon />
              </IconButton>
              <IconButton 
                href="https://x.com/DGBDevs" 
                target="_blank"
                sx={{ color: 'white', '&:hover': { color: '#0066cc' } }}
                aria-label="X (formerly Twitter)"
              >
                <XIcon />
              </IconButton>
            </Stack>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Site Statistics
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <BarChartIcon sx={{ mr: 1 }} />
              <Typography variant="body2">
                Pageviews Last 30 Days: {visitStats.visitsLast30Days.toLocaleString()}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <BarChartIcon sx={{ mr: 1 }} />
              <Typography variant="body2">
                Total Pageviews: {visitStats.totalVisits.toLocaleString()}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Support This Site
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <MonetizationOnIcon sx={{ mr: 1 }} />
              <Box>
                <Typography variant="body2" fontWeight="bold">
                  Donate DGB:
                </Typography>
                <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                  dgb1qf6rxawqk6chveffxqstdpvr428yekf73hz4sjt
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }} />
        
        <Typography variant="body2" align="center">
          DigiByte Blockchain Statistics &copy; {new Date().getFullYear()} Jared Tate. All Rights Reserved.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;