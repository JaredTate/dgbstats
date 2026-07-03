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
  const isMainnetPre = network?.isMainnetPre || false;
  const networkTheme = network?.theme || { gradient: 'linear-gradient(135deg, #002352 0%, #0066cc 100%)' };
  const basePath = network?.basePath || '';
  const networkBadge = isTestnet ? 'TESTNET' : isMainnetPre ? 'MAINNET-PRE' : null;
  const networkHomePath = basePath || '/';

  const withBase = (path) => {
    if (path === '/') return networkHomePath;
    return `${basePath}${path}`;
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Primary navigation items (internal site links)
  const primaryMenuItems = isMainnetPre ? [
    { text: 'Activation', path: withBase('/activation') },
    { text: 'Oracles', path: withBase('/oracles') },
    { text: 'DD Stats', path: withBase('/ddstats') },
  ] : isTestnet ? [
    { text: 'Home', path: withBase('/') },
    { text: 'Blocks', path: withBase('/blocks') },
    { text: 'Txs', path: withBase('/txs') },
    { text: 'Supply', path: withBase('/supply') },
    { text: 'Algos', path: withBase('/algos') },
    { text: 'Difficulties', path: withBase('/difficulties') },
    { text: 'Hashrate', path: withBase('/hashrate') },
    { text: 'Nodes', path: withBase('/nodes') },
    { text: 'Pool Upgrades', path: withBase('/pool-upgrades') },
    { text: 'Activation', path: withBase('/activation') },
    { text: 'Oracles', path: withBase('/oracles') },
    { text: 'DD Stats', path: withBase('/ddstats') },
    { text: 'DigiDollar', path: withBase('/digidollar') },
  ] : [
    { text: 'Home', path: '/' },
    { text: 'Blocks', path: '/blocks' },
    { text: 'Txs', path: '/txs' },
    { text: 'Supply', path: '/supply' },
    { text: 'Algos', path: '/algos' },
    { text: 'Difficulties', path: '/difficulties' },
    { text: 'Hashrate', path: '/hashrate' },
    { text: 'Pools', path: '/pools' },
    { text: 'Pool Upgrades', path: '/pool-upgrades' },
    { text: 'Nodes', path: '/nodes' },
    { text: 'Downloads', path: '/downloads' },
    { text: 'Roadmap', path: '/roadmap' },
    { text: 'DigiDollar', path: '/digidollar' },
    { text: 'Activation', path: '/activation' },
    { text: 'Oracles', path: '/oracles' },
    { text: 'DD Stats', path: '/ddstats' },
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
        {networkBadge && (
          <Chip
            label={networkBadge}
            size="small"
            sx={{
              bgcolor: network?.theme?.secondary || '#4caf50',
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
        {[
          { text: 'Mainnet', path: '/', active: network?.isMainnet },
          { text: 'Testnet', path: '/testnet', active: isTestnet }
        ].map((item) => (
          <ListItem
            button
            component={RouterLink}
            to={item.path}
            key={item.text}
            sx={{
              bgcolor: item.active ? 'rgba(0, 102, 204, 0.12)' : 'transparent',
              '&:hover': { bgcolor: 'rgba(0, 102, 204, 0.18)' }
            }}
          >
            <ListItemText
              primary={item.text}
              sx={{ textAlign: 'center', fontWeight: item.active ? 'bold' : 'normal' }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Primary Navigation Bar */}
      <AppBar
        position="sticky"
        sx={{
          background: isTestnet || isMainnetPre ? networkTheme.gradient : '#0066cc',
          boxShadow: 'none'
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ minHeight: { xs: 56, md: 64 } }}>
            {/* Logo and title */}
            <Box
              component={RouterLink}
              to={networkHomePath}
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
              {networkBadge && (
                <Chip
                  label={networkBadge}
                  size="small"
                  sx={{
                    bgcolor: network?.theme?.secondary || '#4caf50',
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
              {[
                { text: 'Mainnet', path: '/', active: network?.isMainnet, color: '#0066cc' },
                { text: 'Testnet', path: '/testnet', active: isTestnet, color: '#4caf50' }
              ].map((item) => (
                <Button
                  key={item.text}
                  component={RouterLink}
                  to={item.path}
                  size="small"
                  sx={{
                    color: 'white',
                    fontSize: '0.78rem',
                    textTransform: 'none',
                    fontWeight: item.active ? 'bold' : 500,
                    py: 0.5,
                    px: 1.25,
                    ml: 0.5,
                    bgcolor: item.active ? item.color : 'rgba(255,255,255,0.12)',
                    border: `1px solid ${item.active ? item.color : 'rgba(255,255,255,0.24)'}`,
                    '&:hover': {
                      backgroundColor: item.active ? item.color : 'rgba(255,255,255,0.2)'
                    }
                  }}
                >
                  {item.text}
                </Button>
              ))}
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Header;
