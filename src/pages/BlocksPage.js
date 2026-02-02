import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Grid, Button, Card, CardContent,
  Box, Divider, Chip, useMediaQuery, useTheme, Pagination
} from '@mui/material';
import BlockIcon from '@mui/icons-material/ViewCompact';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import SpeedIcon from '@mui/icons-material/Speed';
import PoolIcon from '@mui/icons-material/Waves';
import TransactionsIcon from '@mui/icons-material/Sync';
import VerifiedIcon from '@mui/icons-material/Verified';
import { useNetwork } from '../context/NetworkContext';

/**
 * Algorithm color mapping for consistent visual identification
 * Each algorithm has a unique color for UI elements like chips and borders
 */
const ALGO_COLORS = {
  'sha256d': '#4caf50',  // Green - Most established algorithm
  'scrypt': '#2196f3',   // Blue - Memory-hard algorithm
  'skein': '#ff9800',    // Orange - SHA-3 finalist
  'qubit': '#9c27b0',    // Purple - Lightweight algorithm
  'odo': '#f44336',      // Red - ASIC-resistant
  'odocrypt': '#f44336', // Red - ASIC-resistant variant
};

/**
 * Hero section component for the BlocksPage
 * Displays title, description, and real-time block information
 * @param {Object} props - Component props
 * @param {boolean} props.isTestnet - Whether the current network is testnet
 * @param {Object} props.networkTheme - Theme colors for the current network
 * @returns {JSX.Element} Hero section with page title and description
 */
const HeroSection = ({ isTestnet, networkTheme }) => (
  <Card
    elevation={2}
    sx={{
      backgroundColor: '#f2f4f8',
      borderRadius: '12px',
      mb: 4,
      overflow: 'hidden',
      backgroundImage: 'linear-gradient(135deg, #f8f9fa 0%, #e8eef7 100%)',
      border: `1px solid ${isTestnet ? 'rgba(230, 81, 0, 0.2)' : 'rgba(0, 35, 82, 0.1)'}`
    }}
  >
    <CardContent sx={{ py: 4, textAlign: 'center' }}>
      {isTestnet && (
        <Chip
          label="TESTNET"
          sx={{
            mb: 2,
            bgcolor: networkTheme?.primary || '#e65100',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '0.85rem'
          }}
        />
      )}
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
        <BlockIcon sx={{ fontSize: '2.5rem', color: networkTheme?.primary || '#002352', mr: 2 }} />
        <Typography
          variant="h2"
          component="h1"
          fontWeight="800"
          sx={{
            color: networkTheme?.primary || '#002352',
            letterSpacing: '0.5px',
            fontSize: { xs: '1.8rem', sm: '2.3rem', md: '2.8rem' }
          }}
        >
          Realtime DigiByte Blocks
        </Typography>
      </Box>

      <Divider sx={{ maxWidth: '150px', mx: 'auto', mb: 3, borderColor: networkTheme?.secondary || '#0066cc', borderWidth: 2 }} />

      <Typography
        variant="subtitle1"
        component="p"
        sx={{
          maxWidth: '800px',
          mx: 'auto',
          color: '#555',
          fontSize: '1.1rem'
        }}
      >
        This page pre-loads the 20 most recent DGB blocks & will keep incrementing in realtime as long as you leave it open as blocks are mined.
      </Typography>
    </CardContent>
  </Card>
);

/**
 * Loading state component displayed while block data is being fetched
 * @returns {JSX.Element} Loading card with spinner message
 */
const LoadingCard = () => (
  <Card elevation={3} sx={{ p: 4, textAlign: 'center', borderRadius: '12px' }}>
    <Typography variant="h5">Loading...</Typography>
  </Card>
);

/**
 * Get algorithm color from the predefined color mapping
 * @param {string} algo - Algorithm name (case-insensitive)
 * @returns {string} Hex color code for the algorithm
 */
const getAlgoColor = (algo) => {
  return ALGO_COLORS[algo.toLowerCase()] || '#0066cc';
};

/**
 * Format number with thousands separators (commas)
 * @param {number} num - Number to format
 * @returns {string} Formatted number string with commas
 */
const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

/**
 * Individual block card component
 * Displays comprehensive block information including height, hash, algorithm, pool, etc.
 * @param {Object} props - Component props
 * @param {Object} props.block - Block data object
 * @param {number} props.index - Block index for styling alternation
 * @param {boolean} props.isMobile - Whether device is mobile for responsive design
 * @returns {JSX.Element} Block information card with link to block explorer
 */
const BlockCard = ({ block, index, isMobile }) => (
  <Grid item xs={12}>
    <Card 
      component="a"
      href={`https://digiexplorer.info/block/${block.hash}`}
      target="_blank"
      rel="noopener noreferrer"
      elevation={2}
      sx={{
        display: 'block',
        textDecoration: 'none',
        borderRadius: '8px',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
        },
        overflow: 'hidden',
        borderLeft: `5px solid ${getAlgoColor(block.algo)}`,
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2}>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                Height
              </Typography>
              <Typography 
                variant="body1" 
                fontWeight="bold" 
                sx={{ 
                  display: 'inline-block',
                  bgcolor: index % 2 === 0 ? '#002352' : '#0066cc',
                  color: 'white',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: '4px',
                  fontSize: '1.1rem'
                }}
              >
                {formatNumber(block.height)}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                Hash
              </Typography>
              <Typography variant="body2" fontWeight="medium" sx={{ 
                fontFamily: 'monospace',
                bgcolor: 'rgba(0, 0, 0, 0.04)',
                p: 0.5,
                borderRadius: 1,
                fontSize: { xs: '0.7rem', md: '0.8rem' }
              }}>
                {isMobile ? block.hash.substring(0, 10) + '...' : block.hash.substring(0, 16) + '...'}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6} sm={3} md={2}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <SpeedIcon sx={{ fontSize: '1.2rem', mr: 1, color: getAlgoColor(block.algo) }} />
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  Algorithm
                </Typography>
                <Chip 
                  label={block.algo} 
                  size="small" 
                  sx={{ 
                    bgcolor: getAlgoColor(block.algo) + '20',
                    color: getAlgoColor(block.algo),
                    fontWeight: 'medium',
                    fontSize: '0.75rem'
                  }} 
                />
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={6} sm={3} md={2}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PoolIcon sx={{ fontSize: '1.2rem', mr: 1, color: '#0066cc' }} />
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  Pool
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {block.poolIdentifier || 'Unknown'}
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={6} sm={3} md={1.5}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TransactionsIcon sx={{ fontSize: '1.2rem', mr: 1, color: '#0066cc' }} />
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  TX Count
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {block.txCount}
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={6} sm={3} md={1.5}>
            {block.taprootSignaling ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <VerifiedIcon sx={{ fontSize: '1.2rem', mr: 1, color: '#4caf50' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    Status
                  </Typography>
                  <Chip 
                    label="Taproot" 
                    size="small" 
                    sx={{ 
                      bgcolor: 'rgba(76, 175, 80, 0.1)',
                      color: '#4caf50',
                      fontWeight: 'medium',
                      fontSize: '0.75rem'
                    }} 
                  />
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    Status
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    Normal
                  </Typography>
                </Box>
              </Box>
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  </Grid>
);

/**
 * Pagination controls component
 * Handles navigation between pages of blocks with responsive design
 * @param {Object} props - Component props
 * @param {number} props.currentPage - Current page index (0-based)
 * @param {number} props.totalPages - Total number of pages
 * @param {Function} props.onPrevPage - Previous page handler
 * @param {Function} props.onNextPage - Next page handler
 * @param {Function} props.onPageChange - Direct page change handler
 * @param {boolean} props.isMobile - Whether device is mobile
 * @param {boolean} props.isTablet - Whether device is tablet
 * @returns {JSX.Element} Pagination controls with prev/next buttons and page numbers
 */
const PaginationControls = ({ 
  currentPage, 
  totalPages, 
  onPrevPage, 
  onNextPage, 
  onPageChange, 
  isMobile, 
  isTablet 
}) => (
  <Box sx={{ 
    display: 'flex', 
    justifyContent: 'space-between', 
    mt: 4, 
    flexDirection: { xs: 'column', sm: 'row' },
    alignItems: 'center',
    gap: 2
  }}>
    <Button 
      variant="contained" 
      onClick={onPrevPage} 
      disabled={currentPage === 0}
      startIcon={<ArrowBackIosNewIcon />}
      sx={{
        backgroundColor: '#002352',
        '&:hover': {
          backgroundColor: '#001a3e',
        },
        fontWeight: 'medium',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: { xs: '100%', sm: 'auto' },
      }}
    >
      Previous
    </Button>
    
    {!isMobile && !isTablet && (
      <Pagination 
        count={totalPages} 
        page={currentPage + 1} 
        onChange={onPageChange}
        color="primary"
        sx={{
          '& .MuiPaginationItem-root': {
            fontWeight: 'medium',
          },
          '& .Mui-selected': {
            backgroundColor: '#0066cc !important',
            color: 'white',
          }
        }}
      />
    )}
    
    <Button 
      variant="contained" 
      onClick={onNextPage} 
      disabled={currentPage === Math.floor(totalPages - 1)}
      endIcon={<ArrowForwardIosIcon />}
      sx={{
        backgroundColor: '#0066cc',
        '&:hover': {
          backgroundColor: '#0055aa',
        },
        fontWeight: 'medium',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: { xs: '100%', sm: 'auto' },
      }}
    >
      Next
    </Button>
  </Box>
);

/**
 * BlocksPage component - Real-time DigiByte blocks explorer
 * 
 * This page displays a paginated list of recent DigiByte blocks with real-time updates.
 * Each block shows comprehensive information including height, hash, mining algorithm,
 * pool identifier, transaction count, and Taproot signaling status.
 * 
 * Features:
 * - WebSocket connection for real-time block updates
 * - Paginated display (20 blocks per page)
 * - Responsive design for mobile, tablet, and desktop
 * - Direct links to DigiExplorer block details
 * - Color-coded algorithm identification
 * - Taproot signaling status indicators
 * 
 * @component
 * @returns {JSX.Element} Complete blocks page with real-time updates and pagination
 */
const BlocksPage = () => {
  // Network context for network-aware data fetching
  const { wsBaseUrl, isTestnet, theme: networkTheme } = useNetwork();

  // Block data state management
  const [blocks, setBlocks] = useState([]);
  const [displayedBlocks, setDisplayedBlocks] = useState([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);

  // Loading state
  const [loading, setLoading] = useState(true);

  // Responsive design hooks
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  /**
   * WebSocket connection effect for real-time block updates
   * Handles initial data load and real-time new block notifications
   *
   * Message types handled:
   * - 'recentBlocks': Initial load of recent blocks (typically last 20-50 blocks)
   * - 'newBlock': Real-time updates when new blocks are mined
   */
  useEffect(() => {
    const socket = new WebSocket(wsBaseUrl);

    /**
     * WebSocket connection opened successfully
     * Ready to receive block data from the DigiByte network
     */
    socket.onopen = () => {
      console.log('WebSocket connection established for blocks page');
    };

    /**
     * Handle incoming WebSocket messages with block data
     * @param {MessageEvent} event - WebSocket message event
     */
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'recentBlocks') {
        /**
         * Process initial block data load
         * Sets complete blocks list and removes loading state
         */
        setBlocks(message.data);
        setLoading(false);
      } else if (message.type === 'newBlock') {
        /**
         * Handle real-time new block updates
         * Prepends new block to the beginning of the blocks array
         * Automatically triggers pagination recalculation
         */
        setBlocks((prevBlocks) => [message.data, ...prevBlocks]);
      }
    };

    /**
     * Handle WebSocket connection closure
     * Could implement reconnection logic here if needed
     */
    socket.onclose = () => {
      console.log('WebSocket connection closed - blocks page');
    };

    /**
     * Cleanup function to properly close WebSocket connection
     * Prevents memory leaks when component unmounts
     */
    return () => {
      socket.close();
    };
  }, [wsBaseUrl]);

  /**
   * Pagination effect - updates displayed blocks based on current page
   * Shows 20 blocks per page with proper slicing of the blocks array
   */
  useEffect(() => {
    const BLOCKS_PER_PAGE = 20;
    const startIndex = currentPage * BLOCKS_PER_PAGE;
    const endIndex = startIndex + BLOCKS_PER_PAGE;
    setDisplayedBlocks(blocks.slice(startIndex, endIndex));
  }, [blocks, currentPage]);

  /**
   * Navigate to previous page of blocks
   * Decrements current page index with boundary checking handled by UI
   */
  const handlePrevPage = () => {
    setCurrentPage((prevPage) => prevPage - 1);
  };

  /**
   * Navigate to next page of blocks
   * Increments current page index with boundary checking handled by UI
   */
  const handleNextPage = () => {
    setCurrentPage((prevPage) => prevPage + 1);
  };

  /**
   * Handle direct page selection from pagination component
   * @param {Event} event - Pagination click event
   * @param {number} value - Selected page number (1-based)
   */
  const handlePageChange = (event, value) => {
    setCurrentPage(value - 1); // Convert to 0-based indexing
  };

  // Calculate total pages for pagination
  const totalPages = Math.ceil(blocks.length / 20);

  return (
    <Box 
      sx={{ 
        py: 4, 
        backgroundImage: 'linear-gradient(to bottom, #f8f9fa, #ffffff)',
        minHeight: '100vh'
      }}
    >
      <Container maxWidth="lg">
        <HeroSection isTestnet={isTestnet} networkTheme={networkTheme} />

        {loading ? (
          <LoadingCard />
        ) : (
          <>
            <Grid container spacing={2}>
              {displayedBlocks.map((block, index) => (
                <BlockCard
                  key={`${block.hash}-${index}`}
                  block={block}
                  index={index}
                  isMobile={isMobile}
                />
              ))}
            </Grid>

            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPrevPage={handlePrevPage}
              onNextPage={handleNextPage}
              onPageChange={handlePageChange}
              isMobile={isMobile}
              isTablet={isTablet}
            />
          </>
        )}
      </Container>
    </Box>
  );
};

export default BlocksPage;