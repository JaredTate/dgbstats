import React, { useState } from 'react';
import {
  AppBar, Toolbar, Typography, Box, IconButton,
  Button, Container, Drawer, List, ListItem, ListItemText, Chip, Divider
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import GitHubIcon from '@mui/icons-material/GitHub';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Link as RouterLink } from 'react-router-dom';
import { useNetwork } from '../context/NetworkContext';

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const network = useNetwork();
  const isTestnet = network?.isTestnet || false;
  const networkTheme = network?.theme || { gradient: 'linear-gradient(135deg, #002352 0%, #0066cc 100%)' };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Primary navigation items (internal site links)
  const primaryMenuItems = isTestnet ? [
    { text: 'Home', path: '/testnet' },
    { text: 'Blocks', path: '/testnet/blocks' },
    { text: 'Txs', path: '/testnet/txs' },
    { text: 'Supply', path: '/testnet/supply' },
    { text: 'Algos', path: '/testnet/algos' },
    { text: 'Difficulties', path: '/testnet/difficulties' },
    { text: 'Hashrate', path: '/testnet/hashrate' },
    { text: 'Nodes', path: '/testnet/nodes' },
    { text: 'Activation', path: '/testnet/activation' },
    { text: 'Oracles', path: '/testnet/oracles' },
    { text: 'DD Stats', path: '/testnet/ddstats' },
    { text: 'DigiDollar', path: '/testnet/digidollar' },
  ] : [
    { text: 'Home', path: '/' },
    { text: 'Blocks', path: '/blocks' },
    { text: 'Txs', path: '/txs' },
    { text: 'Supply', path: '/supply' },
    { text: 'Algos', path: '/algos' },
    { text: 'Difficulties', path: '/difficulties' },
    { text: 'Hashrate', path: '/hashrate' },
    { text: 'Pools', path: '/pools' },
    { text: 'Nodes', path: '/nodes' },
    { text: 'Downloads', path: '/downloads' },
    { text: 'Roadmap', path: '/roadmap' },
    { text: 'DigiDollar', path: '/digidollar' },
  ];

  // External links
  const externalLinks = [
    { text: 'DigiExplorer', path: 'https://digiexplorer.info/', icon: null },
    { text: 'DigiHash', path: 'https://digihash.digibyte.io/', icon: null },
    { text: 'DigiByte.org', path: 'https://digibyte.org', icon: null },
    { text: 'GitHub', path: 'https://github.com/DigiByte-Core/digibyte', icon: <GitHubIcon sx={{ fontSize: 16, mr: 0.5 }} /> },
    { text: 'Digi-ID', path: 'https://www.digi-id.io/', icon: null },
    { text: 'DigiScope', path: 'https://digiscope.me/', icon: null },
  ];

  // Mobile drawer content
  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center', width: 280 }}>
      {/* Drawer header */}
      <Box sx={{
        py: 2,
        bgcolor: network?.theme?.primary || '#002352',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Box
          component="img"
          src="/logo.png"
          alt="DigiByte Logo"
          sx={{ height: 40, mr: 1 }}
        />
        <Typography variant="h6" fontWeight="bold">
          DigiByte Stats
        </Typography>
        {isTestnet && (
          <Chip
            label="TESTNET"
            size="small"
            sx={{
              bgcolor: '#4caf50',
              color: 'white',
              fontWeight: 'bold',
              ml: 1
            }}
          />
        )}
      </Box>

      {/* Primary navigation */}
      <List>
        {primaryMenuItems.map((item) => (
          <ListItem
            button
            component={RouterLink}
            to={item.path}
            key={item.text}
            sx={{
              '&:hover': { bgcolor: '#e3f2fd' }
            }}
          >
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>

      {/* External links section */}
      <Divider />
      <Typography variant="caption" sx={{ display: 'block', mt: 2, mb: 1, color: 'text.secondary' }}>
        External Resources
      </Typography>
      <List>
        {externalLinks.map((item) => (
          <ListItem
            button
            component="a"
            href={item.path}
            target="_blank"
            rel="noopener noreferrer"
            key={item.text}
            sx={{
              '&:hover': { bgcolor: '#e3f2fd' }
            }}
          >
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {item.icon}
                  {item.text}
                  <OpenInNewIcon sx={{ fontSize: 14, ml: 0.5, color: 'text.secondary' }} />
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>

      {/* Network switch */}
      <Divider />
      <List>
        <ListItem
          button
          component={RouterLink}
          to={isTestnet ? '/' : '/testnet'}
          sx={{
            bgcolor: isTestnet ? 'rgba(0, 35, 82, 0.1)' : 'rgba(46, 125, 50, 0.1)',
            '&:hover': { bgcolor: isTestnet ? 'rgba(0, 35, 82, 0.2)' : 'rgba(46, 125, 50, 0.2)' }
          }}
        >
          <ListItemText
            primary={isTestnet ? '← Switch to Mainnet' : 'Switch to Testnet →'}
            sx={{ textAlign: 'center', fontWeight: 'bold' }}
          />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Primary Navigation Bar */}
      <AppBar
        position="sticky"
        sx={{
          background: isTestnet ? networkTheme.gradient : '#0066cc',
          boxShadow: 'none'
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ minHeight: { xs: 56, md: 64 } }}>
            {/* Logo and title */}
            <Box
              component={RouterLink}
              to={isTestnet ? '/testnet' : '/'}
              sx={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                color: 'white',
                mr: 3
              }}
            >
              <Box
                component="img"
                src="/logo.png"
                alt="DigiByte Logo"
                sx={{ height: 36, mr: 1 }}
              />
              <Typography
                variant="h6"
                noWrap
                component="div"
                sx={{
                  fontWeight: 'bold',
                  fontSize: { xs: '1rem', md: '1.2rem' }
                }}
              >
                DigiByte Stats
              </Typography>
              {isTestnet && (
                <Chip
                  label="TESTNET"
                  size="small"
                  sx={{
                    bgcolor: '#4caf50',
                    color: 'white',
                    fontWeight: 'bold',
                    ml: 1,
                    height: 24
                  }}
                />
              )}
            </Box>

            {/* Desktop primary navigation */}
            <Box
              sx={{
                display: { xs: 'none', lg: 'flex' },
                flexGrow: 1,
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: 0.25
              }}
            >
              {primaryMenuItems.map((item) => (
                <Button
                  key={item.text}
                  component={RouterLink}
                  to={item.path}
                  size="small"
                  sx={{
                    color: 'white',
                    px: 1,
                    py: 0.5,
                    fontSize: '0.85rem',
                    textTransform: 'none',
                    fontWeight: '500',
                    whiteSpace: 'nowrap',
                    minWidth: 'auto',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.15)'
                    }
                  }}
                >
                  {item.text}
                </Button>
              ))}
            </Box>

            {/* Mobile menu button */}
            <Box sx={{ display: { xs: 'flex', lg: 'none' }, ml: 'auto' }}>
              <IconButton
                size="large"
                color="inherit"
                aria-label="menu"
                onClick={handleDrawerToggle}
              >
                <MenuIcon />
              </IconButton>
              <Drawer
                anchor="right"
                open={mobileOpen}
                onClose={handleDrawerToggle}
              >
                {drawer}
              </Drawer>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Secondary Bar - External Links (Desktop only) */}
      <Box
        sx={{
          display: { xs: 'none', lg: 'block' },
          bgcolor: '#002352'
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              py: 0.75
            }}
          >
              {externalLinks.map((item) => (
                <Button
                  key={item.text}
                  component="a"
                  href={item.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                  startIcon={item.icon}
                  endIcon={<OpenInNewIcon sx={{ fontSize: 12 }} />}
                  sx={{
                    color: 'white',
                    fontSize: '0.8rem',
                    textTransform: 'none',
                    py: 0.5,
                    px: 1.5,
                    minWidth: 'auto',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  {item.text}
                </Button>
              ))}

              {/* Divider */}
              <Box sx={{ width: '1px', height: 20, bgcolor: 'rgba(255, 255, 255, 0.3)', mx: 2 }} />

              {/* Network switch */}
              <Button
                component={RouterLink}
                to={isTestnet ? '/' : '/testnet'}
                size="small"
                sx={{
                  color: 'white',
                  fontSize: '0.8rem',
                  textTransform: 'none',
                  fontWeight: 'bold',
                  py: 0.5,
                  px: 2,
                  bgcolor: isTestnet ? '#0066cc' : '#4caf50',
                  border: isTestnet ? '1px solid #0066cc' : '1px solid #4caf50',
                  '&:hover': {
                    backgroundColor: isTestnet ? '#0055aa' : '#388e3c'
                  }
                }}
              >
                {isTestnet ? 'Mainnet →' : 'Testnet →'}
              </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Header;
