import React, { useEffect, useRef, useState } from 'react';
import {
  Box, ButtonBase, Drawer, GlobalStyles, IconButton, List, ListItemButton,
  ListItemIcon, ListItemText, Typography, useMediaQuery, useTheme
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CloseIcon from '@mui/icons-material/Close';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { HOME_ICON, HOME_TAB } from '../navigation';

export const BOTTOM_BAR_HEIGHT = 64;

/** Backdrop taps this soon after opening are the 2nd tap of a double-tap. */
export const IGNORE_BACKDROP_MS = 300;

const tabSx = (active, color) => ({
  flex: 1,
  minWidth: 0,
  height: BOTTOM_BAR_HEIGHT,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '2px',
  color: active ? color : '#5f6b7a',
  fontWeight: active ? 700 : 500,
  textDecoration: 'none',
  '& svg': { fontSize: 26 },
  '&:focus-visible': { outline: `2px solid ${color}`, outlineOffset: -4, borderRadius: '10px' },
});

const TabLabel = ({ children }) => (
  <Typography component="span" sx={{ fontSize: '0.72rem', lineHeight: 1.1, fontWeight: 'inherit', whiteSpace: 'nowrap' }}>
    {children}
  </Typography>
);

/**
 * Phone navigation: a fixed bottom tab bar (Home + the four groups), like a
 * native app. A group tab slides up a sheet that lists its pages with a plain
 * one-line description. Hidden from 900px up, where the top bar menus take over.
 */
const BottomNav = ({ groups, homePath, activeTab, color }) => {
  const [openId, setOpenId] = useState(null);
  const openedAt = useRef(0);
  const location = useLocation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const openGroup = groups.find((g) => g.id === openId);
  const close = () => setOpenId(null);
  const open = (id) => {
    openedAt.current = Date.now();
    setOpenId(id);
  };
  // A double-tap on a tab: the 2nd tap lands on the backdrop. Ignore it.
  const handleClose = (event, reason) => {
    if (reason === 'backdropClick' && Date.now() - openedAt.current < IGNORE_BACKDROP_MS) return;
    close();
  };

  // Close the sheet on any navigation, including browser Back / Forward.
  useEffect(() => {
    setOpenId(null);
  }, [location.key, location.pathname]);

  // Close it when the screen widens past the phone layout (bar is hidden).
  useEffect(() => {
    if (isDesktop) setOpenId(null);
  }, [isDesktop]);
  const HomeIcon = HOME_ICON;

  return (
    <>
      <GlobalStyles styles={{
        '@media (max-width: 899.95px)': {
          body: { paddingBottom: `calc(${BOTTOM_BAR_HEIGHT}px + env(safe-area-inset-bottom, 0px))` },
        },
      }} />
      <Box
        component="nav"
        aria-label="Bottom navigation"
        sx={{
          display: { xs: 'flex', md: 'none' },
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: (theme) => theme.zIndex.appBar + 1,
          bgcolor: '#ffffff',
          borderTop: '1px solid rgba(0, 35, 82, 0.12)',
          boxShadow: '0 -4px 16px rgba(0, 35, 82, 0.08)',
          pb: 'env(safe-area-inset-bottom, 0px)',
          pl: 'env(safe-area-inset-left, 0px)',
          pr: 'env(safe-area-inset-right, 0px)',
        }}
      >
        <ButtonBase
          component={RouterLink}
          to={homePath}
          aria-current={activeTab === HOME_TAB ? 'page' : undefined}
          sx={tabSx(activeTab === HOME_TAB, color)}
        >
          <HomeIcon aria-hidden="true" />
          <TabLabel>Home</TabLabel>
        </ButtonBase>
        {groups.map((group) => {
          const Icon = group.icon;
          const active = activeTab === group.id;
          return (
            <ButtonBase
              key={group.id}
              onClick={() => open(group.id)}
              aria-haspopup="dialog"
              aria-expanded={openId === group.id}
              aria-current={active ? 'true' : undefined}
              sx={tabSx(active || openId === group.id, color)}
            >
              <Icon aria-hidden="true" />
              <TabLabel>{group.label}</TabLabel>
            </ButtonBase>
          );
        })}
      </Box>

      <Drawer
        anchor="bottom"
        open={Boolean(openGroup)}
        onClose={handleClose}
        PaperProps={{
          role: 'dialog',
          'aria-modal': true,
          'aria-labelledby': 'bottom-sheet-title',
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '80vh',
            pb: 'calc(8px + env(safe-area-inset-bottom, 0px))',
          },
        }}
      >
        {openGroup && (
          <Box sx={{ px: 1, pt: 1 }}>
            <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.18)', mx: 'auto', mb: 1 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', px: 1.5, pb: 0.5 }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography id="bottom-sheet-title" variant="h6" component="h2" fontWeight="bold" sx={{ color }}>
                  {openGroup.label}
                </Typography>
                <Typography variant="body2" color="text.secondary">{openGroup.description}</Typography>
              </Box>
              <IconButton onClick={close} aria-label="Close" size="large">
                <CloseIcon />
              </IconButton>
            </Box>
            <List sx={{ pt: 0 }}>
              {openGroup.items.map((item) => {
                const Icon = item.icon;
                const linkProps = item.external
                  ? { component: 'a', href: item.path, target: '_blank', rel: 'noopener noreferrer' }
                  : { component: RouterLink, to: item.path };
                return (
                  <ListItemButton
                    key={item.label}
                    {...linkProps}
                    onClick={close}
                    sx={{ borderRadius: '12px', minHeight: 60, py: 1 }}
                  >
                    <ListItemIcon sx={{ minWidth: 44, color }}>
                      <Icon />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      secondary={item.description}
                      primaryTypographyProps={{ fontWeight: 600, fontSize: '1rem', color: '#1a2433' }}
                      secondaryTypographyProps={{ fontSize: '0.85rem' }}
                    />
                    {item.external
                      ? <OpenInNewIcon sx={{ color: 'text.secondary', fontSize: 18 }} aria-label="opens in a new tab" />
                      : <ChevronRightIcon sx={{ color: 'text.secondary' }} aria-hidden="true" />}
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        )}
      </Drawer>
    </>
  );
};

export default BottomNav;
