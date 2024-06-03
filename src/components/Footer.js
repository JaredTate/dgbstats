import React, { useState, useEffect } from 'react';
import styles from '../App.module.css';
import { Container, Typography } from '@mui/material';
import axios from 'axios';
import config from '../config'; // Import the config file

const Footer = () => {
  const [visitStats, setVisitStats] = useState({
    visitsLast30Days: 0,
    totalVisits: 0,
    uniqueVisitors: 0,
  });

  useEffect(() => {
    const fetchVisitStats = async () => {
      try {
        const response = await axios.get(`${config.apiBaseUrl}/api/visitstats`); // Use the apiBaseUrl from the config
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
    <footer className={styles.footer}>
      <Container maxWidth="lg">
        <Typography variant="body1" className={styles.footerText} sx={{ fontSize: '18px', fontWeight: 'bold' }}>
          Total DGB Stats Site Pageviews Last 30 Days: {visitStats.visitsLast30Days.toLocaleString()}
          <br />
          Total DGB Stats Site Pageviews Ever: {visitStats.totalVisits.toLocaleString()}
          <br />
        </Typography>
        <Typography
          variant="body1"
          className={styles.footerText}
          sx={{
            fontSize: '18px',
          }}
        >
          Donate DGB Here To Support This Site: dgb1qf6rxawqk6chveffxqstdpvr428yekf73hz4sjt
          <br />
          DigiByte Blockchain Statistics &copy; 2024 Jared Tate. All Rights Reserved.
        </Typography>
      </Container>
    </footer>
  );
};

export default Footer;