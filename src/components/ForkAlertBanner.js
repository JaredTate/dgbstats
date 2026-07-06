import React, { useEffect, useState } from 'react';
import { Alert, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useNetwork } from '../context/NetworkContext';

/**
 * ForkAlertBanner — a self-contained, site-wide fork-risk banner.
 *
 * It opens its own WebSocket (the same per-page pattern used across the app),
 * listens for `forkAlert` messages, and renders a full-width MUI Alert with a
 * link to the Chain Tips page. It returns null when there is no active alert
 * (level === 'none'). `elevated` => amber warning; `critical` => red error with
 * a subtle pulse (respecting prefers-reduced-motion). Dismissible, but re-shows
 * when a strictly higher-severity alert arrives.
 *
 * Mounted in all three layouts between <Header/> and page content.
 */

const LEVEL_RANK = { none: 0, elevated: 1, critical: 2 };

const ForkAlertBanner = () => {
  const { wsBaseUrl, basePath } = useNetwork();
  const [alert, setAlert] = useState(null);
  // Severity rank the user has dismissed; -1 means nothing dismissed yet.
  const [dismissedRank, setDismissedRank] = useState(-1);

  const tipsPath = `${basePath || ''}/tips`;

  useEffect(() => {
    const socket = new WebSocket(wsBaseUrl);
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'forkAlert' && message.data) {
          const data = message.data;
          const rank = LEVEL_RANK[data.level] ?? 0;
          setAlert(data);
          // A strictly higher-severity alert clears an earlier dismissal.
          setDismissedRank((prev) => (rank > prev ? -1 : prev));
        }
      } catch (err) {
        console.error('ForkAlertBanner WS parse error:', err);
      }
    };
    return () => socket.close();
  }, [wsBaseUrl]);

  if (!alert) return null;
  const rank = LEVEL_RANK[alert.level] ?? 0;
  if (rank === 0) return null; // level 'none'
  if (rank <= dismissedRank) return null; // dismissed at this (or higher) severity

  const isCritical = alert.level === 'critical';
  const severity = isCritical ? 'error' : 'warning';

  return (
    <Box sx={{ width: '100%' }}>
      <Alert
        severity={severity}
        onClose={() => setDismissedRank(rank)}
        sx={{
          borderRadius: 0,
          alignItems: 'center',
          '& .MuiAlert-message': { width: '100%', overflowWrap: 'anywhere' },
          ...(isCritical && {
            animation: 'fork-alert-pulse 1.4s ease-in-out infinite',
            '@keyframes fork-alert-pulse': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.72 },
            },
            '@media (prefers-reduced-motion: reduce)': {
              animation: 'none',
            },
          }),
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 1,
            justifyContent: 'space-between',
          }}
        >
          <Box component="span">
            <strong>{isCritical ? 'Fork risk: ' : 'Elevated: '}</strong>
            {alert.reason}
            {Number.isFinite(alert.branchlen) && alert.branchlen > 0 && (
              <> {' '}(branch length {alert.branchlen})</>
            )}
          </Box>
          <RouterLink
            to={tipsPath}
            style={{ color: 'inherit', fontWeight: 700, whiteSpace: 'nowrap' }}
          >
            View chain tips →
          </RouterLink>
        </Box>
      </Alert>
    </Box>
  );
};

export default ForkAlertBanner;
