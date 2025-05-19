import React, { useState, useEffect } from 'react';
import { 
  AppBar, Toolbar, Typography, Box, IconButton, 
  useMediaQuery, Button, Container, Drawer, List, ListItem, ListItemText,
  Chip
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Link as RouterLink } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import config from '../config';

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [hashrate, setHashrate] = useState(null);

  useEffect(() => {
    const socket = new WebSocket(config.wsBaseUrl);

    socket.onopen = () => {
      console.log('WebSocket connection established in Header');
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'networkHashrate') {
        setHashrate(message.data);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed in Header');
    };

    return () => {
      socket.close();
    };
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Format hashrate to appropriate unit (TH/s, PH/s, etc)
  const formatHashrate = (hashrate) => {
    if (!hashrate) return 'Loading...';
    
    const units = ['H/s', 'KH/s', 'MH/s', 'GH/s', 'TH/s', 'PH/s', 'EH/s'];
    let formattedHashrate = hashrate;
    let unitIndex = 0;
    
    while (formattedHashrate >= 1000 && unitIndex < units.length - 1) {
      formattedHashrate /= 1000;
      unitIndex++;
    }
    
    return `${formattedHashrate.toFixed(2)} ${units[unitIndex]}`;
  };

  const menuItems = [
    { text: 'Home', path: '/' },
    { text: 'Blocks', path: '/blocks' },
    { text: 'Supply', path: '/supply' },
    { text: 'Algos', path: '/algos' },
    { text: 'Difficulties', path: '/difficulties' },
    { text: 'Hashrate', path: '/hashrate' },
    { text: 'Pools', path: '/pools' },
    { text: 'Nodes', path: '/nodes' },
    { text: 'Downloads', path: '/downloads' },
    { text: 'DigiHash', path: 'https://digihash.digibyte.io/', external: true },
    { text: 'DigiByte.org', path: 'https://digibyte.org', external: true },
  ];

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Box sx={{ 
        py: 2, 
        bgcolor: '#002352',
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
      </Box>
      <List>
        {menuItems.map((item) => (
          <ListItem 
            button 
            component={item.external ? 'a' : RouterLink} 
            to={!item.external ? item.path : undefined}
            href={item.external ? item.path : undefined}
            target={item.external ? '_blank' : undefined}
            rel={item.external ? 'noopener noreferrer' : undefined}
            key={item.text}
            sx={{ 
              '&:hover': { 
                bgcolor: '#e3f2fd'
              }
            }}
          >
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <AppBar 
      position="sticky" 
      sx={{ 
        background: 'linear-gradient(135deg, #002352 0%, #0066cc 100%)',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}
    >
      <Container>
        <Toolbar disableGutters>
          <Box 
            component={RouterLink} 
            to="/"
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              textDecoration: 'none', 
              color: 'white' 
            }}
          >
            <Box 
              component="img"
              src="/logo.png"
              alt="DigiByte Logo"
              sx={{ height: 40, mr: 1 }}
            />
            <Typography 
              variant="h6" 
              noWrap 
              component="div"
              sx={{ 
                fontWeight: 'bold',
                flexGrow: { xs: 1, md: 0 }
              }}
            >
              DigiByte Stats
            </Typography>
          </Box>

          {/* Hashrate display */}
          <Box 
            sx={{ 
              ml: 3,
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center' 
            }}
          >
            <Chip
              label={`Network: ${formatHashrate(hashrate)}`}
              sx={{ 
                bgcolor: 'rgba(255, 255, 255, 0.15)', 
                color: 'white', 
                fontWeight: 'bold',
                '& .MuiChip-label': {
                  px: 1
                }
              }}
            />
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* Desktop menu */}
          <Box 
            sx={{ 
              display: { xs: 'none', md: 'flex' }, 
              overflowX: 'auto',
              flexWrap: 'nowrap',
              '&::-webkit-scrollbar': {
                display: 'none'
              },
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
            }}
          >
            {menuItems.map((item) => (
              <Button
                key={item.text}
                component={item.external ? 'a' : RouterLink}
                to={!item.external ? item.path : undefined}
                href={item.external ? item.path : undefined}
                target={item.external ? '_blank' : undefined}
                rel={item.external ? 'noopener noreferrer' : undefined}
                size="small"
                sx={{
                  color: 'white',
                  px: 0.8,
                  py: 0.5,
                  minWidth: 'auto',
                  fontSize: '0.95rem',
                  textTransform: 'none',
                  fontWeight: '500',
                  whiteSpace: 'nowrap',
                  mx: 0.3,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)'
                  },
                  '&.active': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    fontWeight: 'bold'
                  }
                }}
              >
                {item.text}
              </Button>
            ))}
          </Box>

          {/* Mobile menu button */}
          {isMobile && (
            <div>
              <IconButton
                size="large"
                edge="end"
                color="inherit"
                aria-label="menu"
                onClick={handleDrawerToggle}
                sx={{ ml: 2 }}
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
            </div>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;