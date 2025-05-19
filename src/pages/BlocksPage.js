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
import config from '../config';

const BlocksPage = () => {
  // State variables
  const [blocks, setBlocks] = useState([]);
  const [displayedBlocks, setDisplayedBlocks] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // WebSocket connection
  useEffect(() => {
    const socket = new WebSocket(config.wsBaseUrl);

    socket.onopen = () => {
      console.log('WebSocket connection established');
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'recentBlocks') {
        setBlocks(message.data);
        setLoading(false);
      } else if (message.type === 'newBlock') {
        setBlocks((prevBlocks) => [message.data, ...prevBlocks]);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      socket.close();
    };
  }, []);

  // Update the displayed blocks based on the current page
  useEffect(() => {
    const startIndex = currentPage * 20;
    const endIndex = startIndex + 20;
    setDisplayedBlocks(blocks.slice(startIndex, endIndex));
  }, [blocks, currentPage]);

  // Event handler for previous page button click
  const handlePrevPage = () => {
    setCurrentPage((prevPage) => prevPage - 1);
  };

  // Event handler for next page button click
  const handleNextPage = () => {
    setCurrentPage((prevPage) => prevPage + 1);
  };

  // Format number with commas
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Get algorithm color
  const getAlgoColor = (algo) => {
    const algoColors = {
      'sha256d': '#4caf50',
      'scrypt': '#2196f3',
      'skein': '#ff9800',
      'qubit': '#9c27b0',
      'odo': '#f44336',
      'odocrypt': '#f44336',
    };
    return algoColors[algo.toLowerCase()] || '#0066cc';
  };

  // Handle pagination change
  const handlePageChange = (event, value) => {
    setCurrentPage(value - 1);
  };

  // Render the component
  return (
    <Box 
      sx={{ 
        py: 4, 
        backgroundImage: 'linear-gradient(to bottom, #f8f9fa, #ffffff)',
        minHeight: '100vh'
      }}
    >
      <Container maxWidth="lg">
        <Card
          elevation={2}
          sx={{
            backgroundColor: '#f2f4f8',
            borderRadius: '12px',
            mb: 4,
            overflow: 'hidden',
            backgroundImage: 'linear-gradient(135deg, #f8f9fa 0%, #e8eef7 100%)',
            border: '1px solid rgba(0, 35, 82, 0.1)'
          }}
        >
          <CardContent sx={{ py: 4, textAlign: 'center' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
              <BlockIcon sx={{ fontSize: '2.5rem', color: '#002352', mr: 2 }} />
              <Typography 
                variant="h2" 
                component="h1" 
                fontWeight="800" 
                sx={{ 
                  color: '#002352',
                  letterSpacing: '0.5px',
                  fontSize: { xs: '1.8rem', sm: '2.3rem', md: '2.8rem' }
                }}
              >
                Realtime DigiByte Blocks
              </Typography>
            </Box>
            
            <Divider sx={{ maxWidth: '150px', mx: 'auto', mb: 3, borderColor: '#0066cc', borderWidth: 2 }} />
            
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

        {loading ? (
          <Card elevation={3} sx={{ p: 4, textAlign: 'center', borderRadius: '12px' }}>
            <Typography variant="h5">Loading...</Typography>
          </Card>
        ) : (
          <>
            <Grid container spacing={2}>
              {displayedBlocks.map((block, index) => (
                <Grid item xs={12} key={index}>
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
              ))}
            </Grid>

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
                onClick={handlePrevPage} 
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
                  count={Math.ceil(blocks.length / 20)} 
                  page={currentPage + 1} 
                  onChange={handlePageChange}
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
                onClick={handleNextPage} 
                disabled={currentPage === Math.floor(blocks.length / 20)}
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
          </>
        )}
      </Container>
    </Box>
  );
};

export default BlocksPage;