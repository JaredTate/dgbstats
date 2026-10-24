import React, { useState } from 'react';
import {
  AppBar, Toolbar, Typography, Box, Button, Container, Chip,
  Menu, MenuItem, ListItemIcon, ListItemText, Divider
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useNetwork } from '../context/NetworkContext';
import { getNavGroups, findActiveTab, HOME_TAB } from '../navigation';
import BottomNav from './BottomNav';

const navButtonSx = (active) => ({
  color: 'white',
  px: 1.5,
  py: 0.75,
  fontSize: '0.95rem',
  textTransform: 'none',
  fontWeight: active ? 700 : 500,
  whiteSpace: 'nowrap',
  borderRadius: '8px',
  backgroundColor: active ? 'rgba(255, 255, 255, 0.16)' : 'transparent',
  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.22)' },
  '&:focus-visible': { outline: '2px solid white', outlineOffset: 2 },
});

/** Mainnet / Testnet switch, shown in the top bar on every screen size. */
const NetworkSwitch = ({ isTestnet }) => (
  <Box
    role="group"
    aria-label="Network"
    sx={{ display: 'flex', flexShrink: 0, p: '3px', borderRadius: '10px', bgcolor: 'rgba(0, 0, 0, 0.18)' }}
  >
    {[
      { text: 'Mainnet', path: '/', active: !isTestnet, color: '#0066cc' },
      { text: 'Testnet', path: '/testnet', active: isTestnet, color: '#2e7d32' },
    ].map((item) => (
      <Box
        key={item.text}
        component={RouterLink}
        to={item.path}
        aria-current={item.active ? 'true' : undefined}
        sx={{
          px: { xs: 1, sm: 1.5 },
          py: 0.5,
          borderRadius: '8px',
          fontSize: { xs: '0.78rem', sm: '0.85rem' },
          fontWeight: item.active ? 700 : 500,
          textDecoration: 'none',
          color: item.active ? item.color : 'white',
          bgcolor: item.active ? '#ffffff' : 'transparent',
          '&:hover': { bgcolor: item.active ? '#ffffff' : 'rgba(255, 255, 255, 0.15)' },
          '&:focus-visible': { outline: '2px solid white', outlineOffset: 1 },
        }}
      >
        {item.text}
      </Box>
    ))}
  </Box>
);

/**
 * Site header. Desktop (900px+): one bar with Home and four group menus
 * (Blockchain, Mining, DigiDollar, More). Phones: a slim top bar plus a
 * bottom tab bar (BottomNav). Both read the same config in navigation.js.
 */
const Header = () => {
  const network = useNetwork();
  const location = useLocation();
  const [menu, setMenu] = useState({ id: null, anchor: null });
  const isTestnet = network?.isTestnet || false;
  const basePath = network?.basePath || '';
  const homePath = basePath || '/';
  const gradient = network?.theme?.gradient || 'linear-gradient(135deg, #002352 0%, #0066cc 100%)';
  const accent = isTestnet ? '#2e7d32' : '#0066cc';
  const groups = getNavGroups(isTestnet);
  const activeTab = findActiveTab(location.pathname, basePath);
  const closeMenu = () => setMenu({ id: null, anchor: null });

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="sticky" sx={{ background: gradient, boxShadow: 'none' }}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ minHeight: { xs: 56, md: 64 }, gap: 1 }}>
            {/* Logo and title */}
            <Box
              component={RouterLink}
              to={homePath}
              aria-label="DigiByte Stats home"
              sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'white', flexShrink: 0, minWidth: 0, mr: { md: 2 } }}
            >
              <Box component="img" src="/logo.png" alt="DigiByte Logo" sx={{ height: { xs: 30, md: 36 }, mr: 1 }} />
              <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', fontSize: { xs: '1.05rem', md: '1.2rem' } }}>
                DigiByte Stats
              </Typography>
              {isTestnet && (
                <Chip
                  label="TESTNET"
                  size="small"
                  sx={{ display: { xs: 'none', sm: 'inline-flex' }, bgcolor: network?.theme?.secondary || '#4caf50', color: 'white', fontWeight: 'bold', ml: 1, height: 24 }}
                />
              )}
            </Box>

            {/* Desktop menus */}
            <Box
              component="nav"
              aria-label="Primary navigation"
              sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5, flexGrow: 1 }}
            >
              <Button
                component={RouterLink}
                to={homePath}
                aria-current={activeTab === HOME_TAB ? 'page' : undefined}
                sx={navButtonSx(activeTab === HOME_TAB)}
              >
                Home
              </Button>
              {groups.map((group) => {
                const open = menu.id === group.id;
                const active = activeTab === group.id;
                return (
                  <React.Fragment key={group.id}>
                    <Button
                      id={`nav-${group.id}-button`}
                      aria-haspopup="true"
                      aria-expanded={open ? 'true' : 'false'}
                      aria-controls={open ? `nav-${group.id}-menu` : undefined}
                      aria-current={active ? 'true' : undefined}
                      endIcon={<KeyboardArrowDownIcon sx={{ transition: 'transform .15s', transform: open ? 'rotate(180deg)' : 'none' }} />}
                      onClick={(e) => setMenu({ id: group.id, anchor: e.currentTarget })}
                      sx={navButtonSx(active)}
                    >
                      {group.label}
                    </Button>
                    <Menu
                      id={`nav-${group.id}-menu`}
                      anchorEl={menu.anchor}
                      open={open}
                      onClose={closeMenu}
                      MenuListProps={{ 'aria-labelledby': `nav-${group.id}-button`, sx: { py: 1 } }}
                      PaperProps={{ sx: { borderRadius: '12px', minWidth: 300, mt: 0.5 } }}
                    >
                      {group.items.map((item, i) => {
                        const Icon = item.icon;
                        const firstExternal = item.external && !group.items[i - 1]?.external;
                        const linkProps = item.external
                          ? { component: 'a', href: item.path, target: '_blank', rel: 'noopener noreferrer' }
                          : { component: RouterLink, to: item.path };
                        return [
                          firstExternal && i > 0 && <Divider key={`${item.label}-divider`} sx={{ my: 0.5 }} />,
                          firstExternal && (
                            <Typography key={`${item.label}-heading`} variant="caption" color="text.secondary" sx={{ display: 'block', px: 2, pt: 0.5, pb: 0.25, fontWeight: 600 }}>
                              Other DigiByte sites
                            </Typography>
                          ),
                          <MenuItem
                            key={item.label}
                            {...linkProps}
                            onClick={closeMenu}
                            selected={!item.external && location.pathname === item.path}
                            sx={{ py: 1, px: 2, borderRadius: '8px', mx: 1, alignItems: 'flex-start' }}
                          >
                            <ListItemIcon sx={{ color: accent, mt: 0.25 }}><Icon fontSize="small" /></ListItemIcon>
                            <ListItemText
                              primary={item.label}
                              secondary={item.description}
                              primaryTypographyProps={{ fontWeight: 600 }}
                              secondaryTypographyProps={{ fontSize: '0.8rem' }}
                            />
                            {item.external && <OpenInNewIcon sx={{ fontSize: 14, color: 'text.secondary', ml: 1, mt: 0.5 }} aria-label="opens in a new tab" />}
                          </MenuItem>,
                        ];
                      })}
                    </Menu>
                  </React.Fragment>
                );
              })}
            </Box>

            <Box sx={{ ml: 'auto' }}>
              <NetworkSwitch isTestnet={isTestnet} />
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <BottomNav groups={groups} homePath={homePath} activeTab={activeTab} color={accent} />
    </Box>
  );
};

export default Header;
