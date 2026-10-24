import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Container, Typography } from '@mui/material';
import { useNetwork } from '../context/NetworkContext';
import { NOT_FOUND_PAGE } from '../seo/pages';

/**
 * Catch-all page for unknown routes. usePageSeo (in the layout) marks it
 * noindex; on the server nginx serves 404.html with a real 404 status.
 */
const NotFoundPage = () => {
  const { isTestnet } = useNetwork();
  return (
    <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 }, textAlign: 'center' }}>
      <Typography variant="h3" component="h1" fontWeight="800" color="primary" gutterBottom>
        {NOT_FOUND_PAGE.h1}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {NOT_FOUND_PAGE.intro}
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
        {isTestnet && (
          <Button component={RouterLink} to="/testnet" variant="contained">
            Testnet home
          </Button>
        )}
        <Button component={RouterLink} to="/" variant={isTestnet ? 'outlined' : 'contained'}>
          Back to DigiByte Stats
        </Button>
      </Box>
    </Container>
  );
};

export default NotFoundPage;
