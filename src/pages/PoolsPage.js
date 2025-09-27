import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Container, Typography, List, ListItem, ListItemText, Box,
  Card, CardContent, Divider, useTheme, useMediaQuery,
  Paper, Chip, CircularProgress, Pagination
} from '@mui/material';
import PoolIcon from '@mui/icons-material/LocationCity';
import * as d3 from 'd3';
import config from '../config';

/**
 * PoolsPage Component - Mining Pool Distribution Analysis
 * 
 * This page provides comprehensive analysis of DigiByte mining pool distribution including:
 * - Real-time pie chart visualization of pool market share
 * - Detailed listings of multi-block and single-block miners
 * - Pagination for large datasets
 * 
 * Data source: Last 240 blocks (approximately 1 hour) via WebSocket
 */
const PoolsPage = () => {
  // State management for mining pool data
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  
  // Chart and pagination configuration
  const svgRef = useRef();
  const itemsPerPage = 25;
  
  // Responsive design hooks
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  /**
   * Process blocks data to categorize miners and calculate statistics
   * Separates multi-block miners (pools) from single-block miners (individuals)
   * 
   * @returns {Object} - Contains sortedAddresses (multi-block) and singleBlockAddresses arrays
   */
  const { sortedAddresses, singleBlockAddresses } = useMemo(() => {
    if (!blocks.length) return { sortedAddresses: [], singleBlockAddresses: [] };

    // Track mining addresses and their block counts
    const multiAddresses = new Set();
    const addressCounts = {};

    // First pass: count blocks per mining address
    blocks.forEach(block => {
      const address = block.minerAddress || block.minedTo;
      if (!address) return;
      addressCounts[address] = (addressCounts[address] || 0) + 1;
      if (addressCounts[address] > 1) {
        multiAddresses.add(address);
      }
    });

    // Process multi-block miners (likely pools or large solo miners)
    const multipleMiners = Array.from(multiAddresses)
      .map(address => {
        const blockData = blocks.find(b => (b.minerAddress || b.minedTo) === address);
        return {
          address,
          count: addressCounts[address],
          poolIdentifier: blockData.poolIdentifier || 'Unknown'
        };
      })
      .sort((a, b) => b.count - a.count) // Sort by block count descending
      .map((data, index) => ({ ...data, rank: index + 1 }));

    // Process single-block miners (sorted by most recent first)
    const singleMiners = [...blocks]
      .sort((a, b) => b.height - a.height) // Sort by block height (newest first)
      .filter(block => {
        const address = block.minerAddress || block.minedTo;
        return address && !multiAddresses.has(address);
      })
      .slice(0, 20) // Limit to 20 most recent single-block miners
      .map((block, index) => ({
        address: block.minerAddress || block.minedTo,
        count: 1,
        poolIdentifier: block.poolIdentifier || 'Unknown',
        timestamp: block.timestamp,
        height: block.height,
        rank: index + 1
      }));

    return {
      sortedAddresses: multipleMiners,
      singleBlockAddresses: singleMiners
    };
  }, [blocks]);

  /**
   * WebSocket connection management for real-time block data
   * Handles initial data load and real-time updates as new blocks are mined
   */
  useEffect(() => {
    console.log(`Connecting to WebSocket at: ${config.wsBaseUrl}`);
    let socket;
    
    try {
      socket = new WebSocket(config.wsBaseUrl);
      
      // Connection established
      socket.onopen = () => {
        console.log('WebSocket connection established successfully');
      };
      
      // Connection error handling
      socket.onerror = (error) => {
        console.error('WebSocket connection error:', error);
        setLoading(false);
      };
      
      // Message handling for block data
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('WebSocket message received:', message);
          
          // Handle initial batch of recent blocks
          if (message.type === 'recentBlocks' && Array.isArray(message.data)) {
            console.log('Setting blocks data, count:', message.data.length);
            
            // Validate blocks have required mining address data
            const validBlocks = message.data.filter(block => block && (block.minerAddress || block.minedTo));
            
            if (validBlocks.length > 0) {
              setBlocks(validBlocks);
            } else {
              console.error('No valid blocks in received data');
            }
            setLoading(false);
          } 
          // Handle new blocks mined in real-time
          else if (message.type === 'newBlock' && message.data) {
            console.log('New block received:', message.data);
            if (message.data.minerAddress || message.data.minedTo) {
              setBlocks((prevBlocks) => [message.data, ...prevBlocks]);
            }
          }
        } catch (err) {
          console.error('Error processing WebSocket message:', err);
        }
      };
      
      // Connection closed
      socket.onclose = (event) => {
        console.log('WebSocket connection closed', event.code, event.reason);
      };
    } catch (err) {
      console.error('Error creating WebSocket connection:', err);
      setLoading(false);
    }
    
    // Fallback dummy data for testing/development
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
    
    // Cleanup function
    return () => {
      clearTimeout(timer);
      if (socket) {
        socket.close();
      }
    };
  }, [loading]);

  /**
   * D3.js pie chart rendering for mining pool distribution
   * Creates an interactive donut chart showing market share percentages
   * Optimized for performance with simplified rendering approach
   */
  useEffect(() => {
    console.log('Pools chart useEffect running, blocks:', blocks.length, 'sortedAddresses:', sortedAddresses.length, 'svgRef:', !!svgRef.current);
    
    if (!blocks.length || !sortedAddresses.length || !svgRef.current) {
      console.log('Chart render conditions not met - blocks:', blocks.length, 'sortedAddresses:', sortedAddresses.length, 'svgRef:', !!svgRef.current);
      return;
    }
    
    try {
      const totalBlocks = blocks.length;
      console.log('Total blocks for chart:', totalBlocks);
      
      // Prepare chart data with performance optimization
      const pieChartData = { main: [] };
      const otherCount = { count: 0 };
      
      // Group small pools together for cleaner visualization
      sortedAddresses.forEach(item => {
        const percentage = (item.count / totalBlocks) * 100;
        if (percentage >= 5) {
          // Keep pools with >= 5% share as individual slices
          pieChartData.main.push({
            blocks: `${item.count} Blocks`,
            count: item.count,
            pool: item.poolIdentifier,
            algo: blocks.find(b => (b.minerAddress || b.minedTo) === item.address)?.algo || 'Unknown'
          });
        } else {
          // Accumulate small pools into "Other" category
          otherCount.count += item.count;
        }
      });

      // Add "Other" slice for small pools
      if (otherCount.count > 0) {
        pieChartData.main.push({
          blocks: 'Other',
          count: otherCount.count,
          pool: 'Various',
          algo: 'Mixed'
        });
      }

      // Add single miners category
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

      // Responsive chart dimensions
      const width = isMobile ? 300 : 500;
      const height = isMobile ? 300 : 500;
      const radius = Math.min(width, height) / 2;

      // Setup SVG container
      const svg = d3.select(svgRef.current);
      svg.attr('width', width).attr('height', height);
      svg.selectAll('*').remove(); // Clear previous chart
      
      const chart = svg
        .append('g')
        .attr('transform', `translate(${width / 2},${height / 2})`);

      // Custom color palette for visual distinction
      const customColors = [
        '#0066cc', '#4caf50', '#2196f3', '#ff9800', '#9c27b0', 
        '#f44336', '#00bcd4', '#ff5722', '#673ab7', '#3f51b5'
      ];
      
      const colorScale = d3.scaleOrdinal(customColors);
      const pie = d3.pie().value(d => d.count).sort(null);
      
      // Create donut chart arcs
      const arc = d3.arc()
        .innerRadius(radius * 0.4) // Inner radius for donut effect
        .outerRadius(radius * 0.8);
        
      const labelArc = d3.arc()
        .innerRadius(radius * 0.6)
        .outerRadius(radius * 0.6);

      // Render pie slices
      const paths = chart.selectAll('path')
        .data(pie(pieChartData.main))
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', d => colorScale(d.data.blocks))
        .attr('stroke', 'white')
        .attr('stroke-width', 2);
      
      console.log('Created', paths.size(), 'pie chart paths');

      // Add percentage labels to each slice
      chart.selectAll('text')
        .data(pie(pieChartData.main))
        .enter()
        .append('text')
        .attr('transform', d => `translate(${labelArc.centroid(d)})`)
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .attr('font-size', isMobile ? '10px' : '12px')
        .attr('font-weight', 'bold')
        .attr('pointer-events', 'none') // Performance optimization
        .each(function(d) {
          const text = d3.select(this);
          const percentage = ((d.data.count / blocks.length) * 100).toFixed(1);
          
          // Multi-line labels with block count, percentage, pool, and algorithm
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

      // Center text showing total blocks
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

  /**
   * Pagination helper function
   * Calculates which items to display on the current page
   */
  const getPageItems = (items) => {
    const startIndex = currentPage * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  };

  const totalPages = Math.ceil((sortedAddresses.length + singleBlockAddresses.length) / itemsPerPage);

  /**
   * Handle pagination navigation
   */
  const handlePageChange = (event, value) => {
    setCurrentPage(value - 1);
  };

  /**
   * Format addresses for display (mobile truncation)
   */
  const formatAddress = (address) => {
    if (isMobile && address.length > 20) {
      return `${address.substring(0, 10)}...${address.substring(address.length - 10)}`;
    }
    return address;
  };

  /**
   * HeroSection - Page header with title and description
   */
  const HeroSection = () => (
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
  );

  /**
   * PieChartSection - Interactive chart showing pool distribution
   */
  const PieChartSection = () => (
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
  );

  /**
   * MinerListItem - Reusable component for displaying individual miners
   */
  const MinerListItem = ({ item, isMultiBlock = false }) => (
    <ListItem 
      key={isMultiBlock ? item.address : `${item.address}-${item.height}`}
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
            {/* Rank badge */}
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
            
            {/* Mining address */}
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
            
            {/* Block count (for multi-block miners) */}
            {isMultiBlock && (
              <Chip
                label={`${item.count} blocks`}
                size="small"
                sx={{
                  backgroundColor: '#e8eef7',
                  fontWeight: 'bold',
                  ml: 'auto'
                }}
              />
            )}
          </Box>
        }
        secondary={
          <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Pool: {item.poolIdentifier || 'Unknown'}
            </Typography>
            
            {/* Block height for single-block miners */}
            {!isMultiBlock && (
              <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                Block: {item.height}
              </Typography>
            )}
          </Box>
        }
      />
    </ListItem>
  );

  /**
   * MiningPoolListSection - Detailed listings of miners with pagination
   */
  const MiningPoolListSection = () => (
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
                  <MinerListItem key={item.address} item={item} isMultiBlock={true} />
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
                  <MinerListItem key={`${item.address}-${item.height}`} item={item} isMultiBlock={false} />
                ))}
              </List>
            </Paper>

            {/* Pagination controls */}
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
  );

  /**
   * StatsSummarySection - Summary statistics about analyzed blocks
   */
  const StatsSummarySection = () => (
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
  );

  // Main component render
  return (
    <Box 
      sx={{ 
        py: 4, 
        backgroundImage: 'linear-gradient(to bottom, #f8f9fa, #ffffff)',
        minHeight: '100vh'
      }}
    >
      <Container maxWidth="lg">
        {/* Page header with title and description */}
        <HeroSection />

        {/* Interactive pie chart visualization */}
        <PieChartSection />

        {/* Detailed mining pool listings with pagination */}
        <MiningPoolListSection />

        {/* Summary statistics */}
        <StatsSummarySection />
      </Container>
    </Box>
  );
};

export default PoolsPage;