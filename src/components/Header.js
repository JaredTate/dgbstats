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

  return (
    <AppBar position="static" sx={{ backgroundColor: '#0066cc' }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          DigiByte Stats
        </Typography>
        {!isMobile && (
          <Box sx={{ display: 'flex' }}> {/* Desktop links */}
            <NavLink to="/" style={{ color: 'white', marginRight: '1rem', textDecoration: 'none' }}>
              Home
            </NavLink>
            <NavLink to="/blocks" style={{ color: 'white', marginRight: '1rem', textDecoration: 'none' }}>
              Blocks
            </NavLink>
            <NavLink to="/algos" style={{ color: 'white', marginRight: '1rem', textDecoration: 'none' }}>
              Algos
            </NavLink>
            <NavLink to="/difficulties" style={{ color: 'white', marginRight: '1rem', textDecoration: 'none' }}>
              Difficulty
            </NavLink>
            <NavLink to="/hashrate" style={{ color: 'white', marginRight: '1rem', textDecoration: 'none' }}>
              Hashrate
            </NavLink>
            <NavLink to="/downloads" style={{ color: 'white', marginRight: '1rem', textDecoration: 'none' }}>
              Downloads
            </NavLink>
            <NavLink to="/nodes" style={{ color: 'white', marginRight: '1rem', textDecoration: 'none' }}>
              Nodes
            </NavLink>
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
              <MenuItem onClick={handleMenuClose} component={NavLink} to="/">
                Home
              </MenuItem>
              <MenuItem onClick={handleMenuClose} component={NavLink} to="/blocks">
                Blocks
              </MenuItem>
              <MenuItem onClick={handleMenuClose} component={NavLink} to="/algos">
                Algos
              </MenuItem>
              <MenuItem onClick={handleMenuClose} component={NavLink} to="/difficulties">
                Difficulty
              </MenuItem>
              <MenuItem onClick={handleMenuClose} component={NavLink} to="/hashrate">
                Hashrate
              </MenuItem>
              <MenuItem onClick={handleMenuClose} component={NavLink} to="/downloads">
                Downloads
              </MenuItem>
              <MenuItem onClick={handleMenuClose} component={NavLink} to="/nodes">
                Nodes
              </MenuItem>
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