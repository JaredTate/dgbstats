import React from 'react';
import { Outlet } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { NetworkProvider, getNetworkConfig } from '../context/NetworkContext';
import Header from './Header';
import Footer from './Footer';

const preConfig = getNetworkConfig('mainnet-pre');

const mainnetPreTheme = createTheme({
  palette: {
    primary: {
      main: preConfig.theme.primary,
      light: preConfig.theme.secondary,
      dark: '#003f4c',
      contrastText: '#ffffff',
    },
    secondary: {
      main: preConfig.theme.secondary,
      light: '#48cae4',
      dark: '#007f86',
      contrastText: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 500 },
    h6: { fontWeight: 500 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 4px 8px rgba(0,0,0,0.05)',
        },
      },
    },
  },
});

const MainnetPreLayout = () => {
  return (
    <NetworkProvider network="mainnet-pre">
      <ThemeProvider theme={mainnetPreTheme}>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Header />
          <div style={{ flex: 1 }}>
            <Outlet />
          </div>
          <Footer />
        </div>
      </ThemeProvider>
    </NetworkProvider>
  );
};

export default MainnetPreLayout;
