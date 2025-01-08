import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AppBar, Toolbar, Typography, IconButton, Menu, MenuItem, Box, useMediaQuery } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useTheme } from '@mui/material/styles';

const Header = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const pages = [
    { name: 'Home', path: '/' },
    { name: 'Blocks', path: '/blocks' },
    { name: 'Supply', path: '/supply' },
    { name: 'Algos', path: '/algos' },
    { name: 'Difficulties', path: '/difficulties' },
    { name: 'Hashrate', path: '/hashrate' },
    { name: 'Pools', path: '/pools' },
    { name: 'Nodes', path: '/nodes' },
    { name: 'Downloads', path: '/downloads' },
    { name: 'Taproot', path: '/taproot' }  // Add this line
  ];

  return (
    <AppBar position="static" sx={{ backgroundColor: '#0066cc' }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          DigiByte Stats
        </Typography>
        {!isMobile && (
          <Box sx={{ display: 'flex' }}> {/* Desktop links */}
            {pages.map((page) => (
              <NavLink key={page.name} to={page.path} style={{ color: 'white', marginRight: '1rem', textDecoration: 'none' }}>
                {page.name}
              </NavLink>
            ))}
            <a href="https://digihash.digibyte.io/" target="_blank" rel="noopener noreferrer" style={{ color: 'white', marginRight: '1rem', textDecoration: 'none' }}>
              DigiHash
            </a>
            <a href="https://digibyte.org" target="_blank" rel="noopener noreferrer" style={{ color: 'white', marginRight: '1rem', textDecoration: 'none' }}>
              DigiByte.org
            </a>
          </Box>
        )}
        {isMobile && (
          <div>
            <IconButton
              size="large"
              aria-label="open menu"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenuOpen}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                style: {
                  backgroundColor: '#0066cc',
                  color: 'white',
                },
              }}
            >
              {pages.map((page) => (
                <MenuItem key={page.name} onClick={handleMenuClose} component={NavLink} to={page.path}>
                  {page.name}
                </MenuItem>
              ))}
              <MenuItem onClick={handleMenuClose}>
                <a href="https://digihash.digibyte.io/" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                  DigiHash
                </a>
              </MenuItem>
              <MenuItem onClick={handleMenuClose}>
                <a href="https://digibyte.org" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                  DigiByte.org
                </a>
              </MenuItem>
            </Menu>
          </div>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;