import React from 'react';
import { Card, Box, Typography, Button, Chip } from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import LaunchIcon from '@mui/icons-material/Launch';

const GUIDE_URL = 'https://github.com/DigiByte-Core/digibyte/blob/develop/DIGIDOLLAR_MINING_INTEGRATION_GUIDE.md';

// Inline monospace styling for the key technical terms. overflowWrap 'anywhere'
// lets long tokens (e.g. default_oracle_commitment) break on narrow screens
// instead of forcing horizontal overflow.
const code = {
  fontFamily: 'monospace',
  fontSize: '0.85em',
  backgroundColor: 'rgba(46, 125, 50, 0.10)',
  color: '#256628',
  padding: '1px 5px',
  borderRadius: '4px',
  overflowWrap: 'anywhere',
};

/**
 * MiningGuideCallout — a prominent call-to-action pointing mining pool
 * operators at the DigiDollar Mining Integration Guide. Shown at the top of the
 * Pools and Pool Upgrade Tracker pages so operators can see exactly how to make
 * their getblocktemplate request support DigiDollar (request the
 * `digidollar-oracle` rule and preserve `default_oracle_commitment`).
 *
 * Responsive: content + button stack full-width on mobile, sit side by side on
 * desktop.
 */
export default function MiningGuideCallout() {
  return (
    <Card
      elevation={3}
      sx={{
        mb: 4,
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid rgba(46, 125, 50, 0.35)',
        backgroundImage: 'linear-gradient(135deg, rgba(46,125,50,0.10) 0%, rgba(46,125,50,0.03) 60%, transparent 100%)',
      }}
    >
      <Box
        sx={{
          p: { xs: 2.5, sm: 3 },
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          gap: { xs: 2, md: 3 },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              flexShrink: 0,
              width: 52,
              height: 52,
              borderRadius: '12px',
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#e8f5e9',
              color: '#2e7d32',
            }}
          >
            <MenuBookIcon sx={{ fontSize: '1.8rem' }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Chip
              label="MINING POOL OPERATORS"
              size="small"
              sx={{ mb: 1, backgroundColor: '#e8f5e9', color: '#2e7d32', fontWeight: 'bold', letterSpacing: '0.5px' }}
            />
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#002352', lineHeight: 1.25 }}>
              Add DigiDollar support to your pool
            </Typography>
            <Typography variant="body2" sx={{ color: '#555', mt: 0.75, lineHeight: 1.6 }}>
              Request the <Box component="code" sx={code}>digidollar-oracle</Box> rule in your{' '}
              <Box component="code" sx={code}>getblocktemplate</Box> call and preserve the{' '}
              <Box component="code" sx={code}>default_oracle_commitment</Box> in the coinbase. The
              guide has the exact steps and code examples.
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          href={GUIDE_URL}
          target="_blank"
          rel="noopener noreferrer"
          endIcon={<LaunchIcon />}
          sx={{
            flexShrink: 0,
            alignSelf: { xs: 'stretch', md: 'center' },
            backgroundColor: '#2e7d32',
            '&:hover': { backgroundColor: '#256628' },
            fontWeight: 'bold',
            fontSize: '1rem',
            textTransform: 'none',
            borderRadius: '10px',
            px: { xs: 2, md: 3 },
            py: 1.25,
            width: { xs: '100%', md: 'auto' },
            boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)',
          }}
        >
          Read the Mining Integration Guide
        </Button>
      </Box>
    </Card>
  );
}
