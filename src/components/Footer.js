import React from 'react';
import styles from '../App.module.css';
import { Container, Typography } from '@mui/material';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <Container maxWidth="lg">
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