import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Container, Typography, List, ListItem, ListItemText, Box, 
  Card, CardContent, Divider, useTheme, useMediaQuery,
  Paper, Chip, CircularProgress, Pagination
} from '@mui/material';
import PoolIcon from '@mui/icons-material/LocationCity';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import * as d3 from 'd3';
import config from '../config';

const PoolsPage = () => {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const svgRef = useRef();
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 25;
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Move the data processing useMemo before the chart effect
  const { sortedAddresses, singleBlockAddresses } = useMemo(() => {
    if (!blocks.length) return { sortedAddresses: [], singleBlockAddresses: [] };

    // Track all multi-block addresses
    const multiAddresses = new Set();
    const addressCounts = {};

    // First pass: count blocks per address
    blocks.forEach(block => {
      const address = block.minerAddress || block.minedTo;
      if (!address) return;
      addressCounts[address] = (addressCounts[address] || 0) + 1;
      if (addressCounts[address] > 1) {
        multiAddresses.add(address);
      }
    });

    // Process multiple block miners
    const multipleMiners = Array.from(multiAddresses)
      .map(address => {
        const blockData = blocks.find(b => (b.minerAddress || b.minedTo) === address);
        return {
          address,
          count: addressCounts[address],
          poolIdentifier: blockData.poolIdentifier || 'Unknown',
          taprootSignaling: blockData.taprootSignaling
        };
      })
      .sort((a, b) => b.count - a.count)
      .map((data, index) => ({ ...data, rank: index + 1 }));

    // Get single block miners (most recent first)
    const singleMiners = [...blocks]
      // Sort so the newest (highest block height) is first
      .sort((a, b) => b.height - a.height)
      .filter(block => {
        const address = block.minerAddress || block.minedTo;
        return address && !multiAddresses.has(address);
      })
      .slice(0, 20)
      .map((block, index) => ({
        address: block.minerAddress || block.minedTo,
        count: 1,
        poolIdentifier: block.poolIdentifier || 'Unknown',
        timestamp: block.timestamp,
        taprootSignaling: block.taprootSignaling,
        height: block.height,
        rank: index + 1
      }));

    return {
      sortedAddresses: multipleMiners,
      singleBlockAddresses: singleMiners
    };
  }, [blocks]);

  // WebSocket connection effect
  useEffect(() => {
    console.log(`Connecting to WebSocket at: ${config.wsBaseUrl}`);
    let socket;
    
    try {
      socket = new WebSocket(config.wsBaseUrl);
      
      socket.onopen = () => {
        console.log('WebSocket connection established successfully');
      };
      
      socket.onerror = (error) => {
        console.error('WebSocket connection error:', error);
        setLoading(false); // Stop showing loading indicator if connection fails
      };
      
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('WebSocket message received:', message);
          
          if (message.type === 'recentBlocks' && Array.isArray(message.data)) {
            console.log('Setting blocks data, count:', message.data.length);
            
            // Validate each block has the required data
            const validBlocks = message.data.filter(block => block && (block.minerAddress || block.minedTo));
            
            if (validBlocks.length > 0) {
              setBlocks(validBlocks);
            } else {
              console.error('No valid blocks in received data');
            }
            setLoading(false);
          } else if (message.type === 'newBlock' && message.data) {
            console.log('New block received:', message.data);
            if (message.data.minerAddress || message.data.minedTo) {
              setBlocks((prevBlocks) => [message.data, ...prevBlocks]);
            }
          }
        } catch (err) {
          console.error('Error processing WebSocket message:', err);
        }
      };
      
      socket.onclose = (event) => {
        console.log('WebSocket connection closed', event.code, event.reason);
      };
    } catch (err) {
      console.error('Error creating WebSocket connection:', err);
      setLoading(false);
    }
    
    // For testing purposes, if the WebSocket connection isn't working,
    // let's create some dummy data after 2 seconds
    const timer = setTimeout(() => {
      if (loading) {
        console.log('Creating fallback test data as WebSocket connection might have failed');
        const dummyBlocks = [
          { minerAddress: 'DBxgT5CiVZD1VnT7eoJ2nRiPXoKYwQ9QZe', poolIdentifier: 'Pool A', algo: 'sha256d', height: 1 },
          { minerAddress: 'DBxgT5CiVZD1VnT7eoJ2nRiPXoKYwQ9QZe', poolIdentifier: 'Pool A', algo: 'sha256d', height: 2 },
          { minerAddress: 'DAZsPUx62tQJ9BySDffwRZ9MV1a7CYoMqJ', poolIdentifier: 'Pool B', algo: 'scrypt', height: 3 },
          { minedTo: 'DTz96gvwijeYKLpWBFoUCKpHVvzJZH5uoC', poolIdentifier: 'Pool C', algo: 'skein', height: 4 },
          { minedTo: 'DAgMQJKykuV2MqXkiMszh5xY5ECMjYXKLM', poolIdentifier: 'Pool D', algo: 'qubit', height: 5 },
          { minedTo: 'D7pKtbMzjZej7RaHpGK4hpgCwjMTcLNfMQ', poolIdentifier: 'Pool E', algo: 'odocrypt', height: 6 }
        ];
        setBlocks(dummyBlocks);
        setLoading(false);
      }
    }, 2000);
    
    return () => {
      clearTimeout(timer);
      if (socket) {
        socket.close();
      }
    };
  }, [loading]);

  // Update pie chart effect
  useEffect(() => {
    console.log('Pools chart useEffect running, blocks:', blocks.length);
    
    if (!blocks.length || !sortedAddresses.length || !svgRef.current) {
      console.log('No blocks, sorted addresses, or SVG ref, skipping chart render');
      return;
    }
    
    try {
      // Calculate total blocks for percentage
      const totalBlocks = blocks.length;
      console.log('Total blocks for chart:', totalBlocks);
      
      // Group data by percentage share - simplified for performance
      const pieChartData = { main: [] };
      const otherCount = { count: 0 };
      
      sortedAddresses.forEach(item => {
        const percentage = (item.count / totalBlocks) * 100;
        if (percentage >= 5) {
          // Keep items with >= 5% share as individual slices
          pieChartData.main.push({
            blocks: `${item.count} Blocks`,
            count: item.count,
            pool: item.poolIdentifier,
            algo: blocks.find(b => (b.minerAddress || b.minedTo) === item.address)?.algo || 'Unknown'
          });
        } else {
          // Accumulate items with < 5% share
          otherCount.count += item.count;
        }
      });

      // Add other slice if there are small shares
      if (otherCount.count > 0) {
        pieChartData.main.push({
          blocks: 'Other',
          count: otherCount.count,
          pool: 'Various',
          algo: 'Mixed'
        });
      }

      // Add single miners slice
      const singleMinersCount = blocks.length - sortedAddresses.reduce((sum, item) => sum + item.count, 0);
      if (singleMinersCount > 0) {
        pieChartData.main.push({
          blocks: '1 Block Miners',
          count: singleMinersCount,
          pool: 'Various',
          algo: 'Mixed'
        });
      }
      
      console.log('Pie chart data prepared:', pieChartData.main);

      // Simplified dimensions
      const width = isMobile ? 300 : 500;
      const height = isMobile ? 300 : 500;
      const radius = Math.min(width, height) / 2;

      // Clear and setup SVG
      const svg = d3.select(svgRef.current);
      svg.attr('width', width)
         .attr('height', height);
      svg.selectAll('*').remove();
      
      const chart = svg
        .append('g')
        .attr('transform', `translate(${width / 2},${height / 2})`);

      // Custom color palette
      const customColors = [
        '#0066cc', '#4caf50', '#2196f3', '#ff9800', '#9c27b0', 
        '#f44336', '#00bcd4', '#ff5722', '#673ab7', '#3f51b5'
      ];
      
      const colorScale = d3.scaleOrdinal(customColors);
      const pie = d3.pie().value(d => d.count).sort(null);
      
      // Create a donut chart for modern look
      const arc = d3.arc()
        .innerRadius(radius * 0.4)
        .outerRadius(radius * 0.8);
        
      const labelArc = d3.arc()
        .innerRadius(radius * 0.6)
        .outerRadius(radius * 0.6);

      // Add paths (pie slices) - without shadow for better performance
      chart.selectAll('path')
        .data(pie(pieChartData.main))
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', d => colorScale(d.data.blocks))
        .attr('stroke', 'white')
        .attr('stroke-width', 2);
        // Removed shadow filter for better performance

      // Add text labels - simplified for performance
      chart.selectAll('text')
        .data(pie(pieChartData.main))
        .enter()
        .append('text')
        .attr('transform', d => `translate(${labelArc.centroid(d)})`)
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .attr('font-size', isMobile ? '10px' : '12px')
        .attr('font-weight', 'bold')
        .attr('pointer-events', 'none') // Improves performance
        .each(function(d) {
          const text = d3.select(this);
          const percentage = ((d.data.count / blocks.length) * 100).toFixed(1);
          
          text.append('tspan')
            .attr('x', 0)
            .attr('dy', '-1.2em')
            .text(d.data.blocks);

          text.append('tspan')
            .attr('x', 0)
            .attr('dy', '1.2em')
            .text(`${percentage}%`);

          text.append('tspan')
            .attr('x', 0)
            .attr('dy', '1.2em')
            .text(d.data.pool);

          text.append('tspan')
            .attr('x', 0)
            .attr('dy', '1.2em')
            .text(d.data.algo);
        });

      // Add center text
      chart.append('text')
        .attr('text-anchor', 'middle')
        .attr('font-size', isMobile ? '14px' : '18px')
        .attr('font-weight', 'bold')
        .attr('fill', '#002352')
        .text(`${blocks.length} Total Blocks`);
        
      console.log('Pools chart rendered successfully');
    } catch (error) {
      console.error('Error rendering pools chart:', error);
    }
  }, [blocks, sortedAddresses, isMobile]);

  // Calculate displayed items for current page
  const getPageItems = (items) => {
    const startIndex = currentPage * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  };

  const totalPages = Math.ceil((sortedAddresses.length + singleBlockAddresses.length) / itemsPerPage);

  // Page navigation handlers
  const handlePageChange = (event, value) => {
    setCurrentPage(value - 1);
  };

  // Format address for display (shortening if needed)
  const formatAddress = (address) => {
    if (isMobile && address.length > 20) {
      return `${address.substring(0, 10)}...${address.substring(address.length - 10)}`;
    }
    return address;
  };

  return (
    <Box 
      sx={{ 
        py: 4, 
        backgroundImage: 'linear-gradient(to bottom, #f8f9fa, #ffffff)',
        minHeight: '100vh'
      }}
    >
      <Container maxWidth="lg">
        {/* Header Card */}
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
              <PoolIcon sx={{ fontSize: '2.5rem', color: '#002352', mr: 2 }} />
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
                DigiByte Mining Pools
              </Typography>
            </Box>
            
            <Divider sx={{ maxWidth: '150px', mx: 'auto', mb: 3, borderColor: '#0066cc', borderWidth: 2 }} />
            
            <Typography 
              variant="subtitle1" 
              component="p" 
              sx={{ 
                maxWidth: '800px', 
                mx: 'auto', 
                mb: 3,
                color: '#555',
                fontSize: '1.1rem'
              }}
            >
              This page preloads the last 240 DGB blocks (1 hour) & updates in realtime as blocks are mined.
              The distribution shows which mining pools are currently active on the DigiByte network.
            </Typography>
          </CardContent>
        </Card>

        {/* Pie Chart Card */}
        <Card
          elevation={3}
          sx={{
            p: { xs: 2, md: 3 },
            borderRadius: '12px',
            mb: 4,
            textAlign: 'center'
          }}
        >
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, color: '#002352' }}>
            Mining Pool Distribution
          </Typography>
          
          {loading ? (
            <Box sx={{ py: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
              <CircularProgress size={60} sx={{ color: '#0066cc', mb: 3 }} />
              <Typography variant="h6" sx={{ color: '#555' }}>
                Loading block data...
              </Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                width: '100%',
                height: 'auto',
                my: 2
              }}>
                <svg 
                  ref={svgRef} 
                  width={isMobile ? 300 : 500}
                  height={isMobile ? 300 : 500}
                  style={{ 
                    display: 'block',
                    margin: 'auto'
                  }}
                ></svg>
              </Box>
              <Typography variant="body1" sx={{ mt: 2, color: '#666', fontStyle: 'italic' }}>
                Distribution of blocks by mining pool over the last hour.
              </Typography>
            </>
          )}
        </Card>

        {/* Mining Pool List Card */}
        <Card
          elevation={3}
          sx={{
            borderRadius: '12px',
            mb: 4,
            overflow: 'hidden'
          }}
        >
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, color: '#002352', textAlign: 'center' }}>
              Recent Mining Pools
            </Typography>

            {loading ? (
              <Box sx={{ py: 5, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={40} sx={{ color: '#0066cc' }} />
              </Box>
            ) : (
              <>
                {/* Multi-Block Miners Section */}
                <Paper elevation={0} sx={{ mb: 4, p: 2, backgroundColor: 'rgba(0, 102, 204, 0.05)', borderRadius: '8px' }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, textAlign: 'center', color: '#0066cc' }}>
                    Multi-Block Miners
                  </Typography>
                  
                  <List sx={{ width: '100%' }}>
                    {getPageItems(sortedAddresses).map((item) => (
                      <ListItem 
                        key={item.address} 
                        sx={{ 
                          py: 1.5,
                          px: 2,
                          mb: 1,
                          backgroundColor: 'white',
                          borderRadius: '8px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          '&:hover': {
                            backgroundColor: '#f9f9f9'
                          }
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                              <Chip 
                                label={`#${item.rank}`} 
                                size="small" 
                                sx={{ 
                                  fontWeight: 'bold', 
                                  backgroundColor: '#002352', 
                                  color: 'white',
                                  minWidth: '40px'
                                }} 
                              />
                              <Typography 
                                variant="body1" 
                                sx={{ 
                                  fontWeight: 'medium', 
                                  wordBreak: 'break-all',
                                  ...(isMobile && { fontSize: '0.85rem' })
                                }}
                              >
                                {formatAddress(item.address)}
                              </Typography>
                              
                              <Chip 
                                label={`${item.count} blocks`} 
                                size="small" 
                                sx={{ 
                                  backgroundColor: '#e8eef7',
                                  fontWeight: 'bold',
                                  ml: 'auto'
                                }} 
                              />
                              
                              <Chip
                                icon={item.taprootSignaling ? 
                                  <CheckCircleIcon sx={{ fontSize: '1rem' }} /> : 
                                  <CancelIcon sx={{ fontSize: '1rem' }} />
                                }
                                label="Taproot"
                                size="small"
                                sx={{ 
                                  backgroundColor: item.taprootSignaling ? '#e8f5e9' : '#ffebee',
                                  color: item.taprootSignaling ? '#2e7d32' : '#c62828',
                                  fontWeight: 'medium',
                                  ...(isMobile && { display: 'none' })
                                }}
                              />
                            </Box>
                          }
                          secondary={
                            <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center' }}>
                              <Typography variant="body2" color="text.secondary">
                                Pool: {item.poolIdentifier || 'Unknown'}
                              </Typography>
                              
                              {isMobile && (
                                <Chip
                                  icon={item.taprootSignaling ? 
                                    <CheckCircleIcon sx={{ fontSize: '0.75rem' }} /> : 
                                    <CancelIcon sx={{ fontSize: '0.75rem' }} />
                                  }
                                  label="Taproot"
                                  size="small"
                                  sx={{ 
                                    ml: 'auto',
                                    height: '24px',
                                    fontSize: '0.7rem',
                                    backgroundColor: item.taprootSignaling ? '#e8f5e9' : '#ffebee',
                                    color: item.taprootSignaling ? '#2e7d32' : '#c62828'
                                  }}
                                />
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
                
                {/* Single Block Miners Section */}
                <Paper elevation={0} sx={{ p: 2, backgroundColor: 'rgba(0, 35, 82, 0.05)', borderRadius: '8px' }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, textAlign: 'center', color: '#002352' }}>
                    Single Block Miners
                  </Typography>
                  
                  <List sx={{ width: '100%' }}>
                    {getPageItems(singleBlockAddresses).map((item) => (
                      <ListItem 
                        key={`${item.address}-${item.height}`} 
                        sx={{ 
                          py: 1.5,
                          px: 2,
                          mb: 1,
                          backgroundColor: 'white',
                          borderRadius: '8px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          '&:hover': {
                            backgroundColor: '#f9f9f9'
                          }
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                              <Chip 
                                label={`#${item.rank}`} 
                                size="small" 
                                sx={{ 
                                  fontWeight: 'bold', 
                                  backgroundColor: '#002352', 
                                  color: 'white',
                                  minWidth: '40px'
                                }} 
                              />
                              <Typography 
                                variant="body1" 
                                sx={{ 
                                  fontWeight: 'medium', 
                                  wordBreak: 'break-all',
                                  ...(isMobile && { fontSize: '0.85rem' })
                                }}
                              >
                                {formatAddress(item.address)}
                              </Typography>
                              
                              <Chip
                                icon={item.taprootSignaling ? 
                                  <CheckCircleIcon sx={{ fontSize: '1rem' }} /> : 
                                  <CancelIcon sx={{ fontSize: '1rem' }} />
                                }
                                label="Taproot"
                                size="small"
                                sx={{ 
                                  backgroundColor: item.taprootSignaling ? '#e8f5e9' : '#ffebee',
                                  color: item.taprootSignaling ? '#2e7d32' : '#c62828',
                                  ml: 'auto',
                                  fontWeight: 'medium',
                                  ...(isMobile && { display: 'none' })
                                }}
                              />
                            </Box>
                          }
                          secondary={
                            <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center' }}>
                              <Typography variant="body2" color="text.secondary">
                                Pool: {item.poolIdentifier || 'Unknown'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                                Block: {item.height}
                              </Typography>
                              
                              {isMobile && (
                                <Chip
                                  icon={item.taprootSignaling ? 
                                    <CheckCircleIcon sx={{ fontSize: '0.75rem' }} /> : 
                                    <CancelIcon sx={{ fontSize: '0.75rem' }} />
                                  }
                                  label="Taproot"
                                  size="small"
                                  sx={{ 
                                    ml: 'auto',
                                    height: '24px',
                                    fontSize: '0.7rem',
                                    backgroundColor: item.taprootSignaling ? '#e8f5e9' : '#ffebee',
                                    color: item.taprootSignaling ? '#2e7d32' : '#c62828'
                                  }}
                                />
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>

                {/* Pagination */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination 
                    count={totalPages} 
                    page={currentPage + 1}
                    onChange={handlePageChange}
                    color="primary"
                    size={isMobile ? "small" : "medium"}
                    showFirstButton
                    showLastButton
                  />
                </Box>
              </>
            )}
          </CardContent>
        </Card>

        {/* Stats Summary Card */}
        <Card 
          elevation={2}
          sx={{
            backgroundColor: '#f2f4f8',
            borderRadius: '12px',
            mb: 4,
            backgroundImage: 'linear-gradient(135deg, #f8f9fa 0%, #e8eef7 100%)',
            border: '1px solid rgba(0, 35, 82, 0.1)'
          }}
        >
          <CardContent sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight="bold" color="#002352">
              Total Blocks Analyzed: {blocks.length}
            </Typography>
            <Typography variant="body1" color="#666" sx={{ mt: 1 }}>
              Data refreshes in real-time as new blocks are mined on the DigiByte network
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default PoolsPage;