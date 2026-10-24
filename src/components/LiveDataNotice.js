import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { isLiveFeedDown, subscribeLiveStatus } from '../utils/networkSocket';
import { BOTTOM_BAR_HEIGHT } from './BottomNav';

/** Wait this long before telling the user (short blips stay silent). */
export const LIVE_NOTICE_DELAY_MS = 4000;

/**
 * A small, calm pill shown while the page's live feed is down. The page
 * socket reconnects by itself (see utils/networkSocket); this only tells
 * the user the numbers are paused. Mounted once in each layout.
 */
const LiveDataNotice = () => {
  const [down, setDown] = useState(isLiveFeedDown);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setDown(isLiveFeedDown());
    return subscribeLiveStatus(setDown);
  }, []);

  useEffect(() => {
    if (!down) {
      setVisible(false);
      return undefined;
    }
    const timer = setTimeout(() => setVisible(true), LIVE_NOTICE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [down]);

  if (!visible) return null;

  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: {
          xs: `calc(${BOTTOM_BAR_HEIGHT + 12}px + env(safe-area-inset-bottom, 0px))`,
          md: 16,
        },
        zIndex: (theme) => theme.zIndex.appBar,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        maxWidth: 'calc(100vw - 32px)',
        px: 2,
        py: 1,
        borderRadius: 999,
        bgcolor: 'rgba(33, 43, 54, 0.92)',
        color: '#ffffff',
        fontSize: '0.875rem',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
        pointerEvents: 'none',
      }}
    >
      <Box component="span" aria-hidden="true" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#ffb74d', flexShrink: 0 }} />
      <span>Live data paused – reconnecting…</span>
    </Box>
  );
};

export default LiveDataNotice;
