import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Container, Typography, List, ListItem, ListItemText, Box, Button } from '@mui/material';
import * as d3 from 'd3';
import config from '../config';

const PoolsPage = () => {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const svgRef = useRef();
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 25;

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
    const socket = new WebSocket(config.wsBaseUrl);

    socket.onopen = () => {
      console.log('WebSocket connection established');
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('Received message from server:', message);

      if (message.type === 'recentBlocks') {
        console.log('Received recent blocks:', message.data);
        setBlocks(message.data);
        setLoading(false);
      } else if (message.type === 'newBlock') {
        console.log('Received new block:', message.data);
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

  // Update pie chart effect
  useEffect(() => {
    if (!blocks.length || !sortedAddresses.length) return;

    // Calculate total blocks for percentage
    const totalBlocks = blocks.length;
    
    // Group data by percentage share
    const pieChartData = sortedAddresses.reduce((acc, item) => {
      const percentage = (item.count / totalBlocks) * 100;
      if (percentage >= 5) {
        // Keep items with >= 5% share as individual slices
        acc.main.push({
          blocks: `${item.count} Blocks`,
          count: item.count,
          pool: item.poolIdentifier,
          algo: blocks.find(b => (b.minerAddress || b.minedTo) === item.address)?.algo || 'Unknown'
        });
      } else {
        // Accumulate items with < 5% share
        acc.other.count += item.count;
      }
      return acc;
    }, { main: [], other: { count: 0 } });

    // Add other slice if there are small shares
    if (pieChartData.other.count > 0) {
      pieChartData.main.push({
        blocks: 'Other',
        count: pieChartData.other.count,
        pool: 'Various',
        algo: 'Mixed'
      });
    }

    // Add single miners slice
    const singleMinersCount = blocks.length - sortedAddresses.reduce((sum, item) => sum + item.count, 0);
    pieChartData.main.push({
      blocks: '1 Block Miners',
      count: singleMinersCount,
      pool: 'Various',
      algo: 'Mixed'
    });

    const svg = d3.select(svgRef.current),
      width = 600,    // Increased from 500
      height = 600,   // Increased from 500
      radius = Math.min(width, height) / 2;

    svg.selectAll('*').remove();

    const chart = svg
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    const pie = d3.pie().value(d => d.count).sort(null);
    const arc = d3.arc().innerRadius(0).outerRadius(radius);
    const labelArc = d3.arc()
      .innerRadius(radius * 0.6)
      .outerRadius(radius * 0.6);

    // Add paths (pie slices)
    chart.selectAll('path')
      .data(pie(pieChartData.main))
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', d => colorScale(d.data.blocks));

    // Add text labels
    const labels = chart
      .selectAll('text')
      .data(pie(pieChartData.main))
      .enter()
      .append('text')
      .attr('transform', d => `translate(${labelArc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white');

    // Add multi-line text
    labels.each(function(d) {
      const text = d3.select(this);
      const percentage = ((d.data.count / blocks.length) * 100).toFixed(1);
      
      text.append('tspan')
        .attr('x', 0)
        .attr('dy', '-1.2em')
        .text(d.data.blocks);  // Show blocks count instead of address

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
  }, [blocks, sortedAddresses]);

  // Calculate displayed items for current page
  const getPageItems = (items) => {
    const startIndex = currentPage * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  };

  const totalPages = Math.ceil((sortedAddresses.length + singleBlockAddresses.length) / itemsPerPage);

  const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 0));
  const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages - 1));

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h4" align="center" fontWeight="bold" gutterBottom sx={{ paddingTop: '10px' }}>
        Realtime DGB Blocks Mined By Address
      </Typography>
      <Typography variant="h7" component="p" align="center" gutterBottom sx={{ paddingBottom: '10px' }}>
        This page preloads the last 240 DGB blocks (1 hour) & will keep incrementing in realtime as blocks are mined.
        <br />
        The pie chart shows the breakdown of blocks mined to an address, and the list displays the addresses sorted by the number of blocks mined.
      </Typography>
      
      {/* Move pie chart to top */}
      <div className="pie-chart-container" style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <svg ref={svgRef} width="600" height="600" style={{ margin: '0 auto', display: 'block' }} />
      </div>

      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <List style={{ display: 'inline-block', maxWidth: '800px', width: '100%' }}>
          <ListItem sx={{ justifyContent: 'center' }}>
            <ListItemText 
              primary={<Typography variant="h6">Recent Multi Block Miners - Same Address</Typography>} 
            />
          </ListItem>

          {getPageItems(sortedAddresses).map((item) => (
            <ListItem key={item.address} sx={{ py: 1 }}>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span style={{ fontWeight: 'bold' }}>{item.rank}.</span>
                    <span style={{ wordBreak: 'break-all' }}>{item.address}</span>
                    <span>({item.count} blocks)</span>
                    <Box 
                      component="span" 
                      sx={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        color: item.taprootSignaling ? '#90EE90' : '#FF6B6B',
                        ml: 1
                      }}
                    >
                      <span>Taproot</span>
                      <span style={{ marginLeft: '4px' }}>
                        {item.taprootSignaling ? '✓' : '✗'}
                      </span>
                    </Box>
                  </Box>
                }
                secondary={
                  <Box sx={{ mt: 0.5 }}>
                    Pool: {item.poolIdentifier || 'Unknown'}
                  </Box>
                }
              />
            </ListItem>
          ))}
          
          <ListItem sx={{ mt: 3, mb: 1, justifyContent: 'center' }}>
            <ListItemText 
              primary={<Typography variant="h6">Recent Single Block Miners</Typography>} 
            />
          </ListItem>
          
          {getPageItems(singleBlockAddresses).map((item) => (
            <ListItem key={`${item.address}-${item.height}`} sx={{ py: 1 }}>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span style={{ fontWeight: 'bold' }}>{item.rank}.</span>
                    <span style={{ wordBreak: 'break-all' }}>{item.address}</span>
                    <Box 
                      component="span" 
                      sx={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        color: item.taprootSignaling ? '#90EE90' : '#FF6B6B',
                        ml: 1
                      }}
                    >
                      <span>Taproot</span>
                      <span style={{ marginLeft: '4px' }}>
                        {item.taprootSignaling ? '✓' : '✗'}
                      </span>
                    </Box>
                  </Box>
                }
                secondary={
                  <Box sx={{ mt: 0.5 }}>
                    Pool: {item.poolIdentifier}
                    <span style={{ marginLeft: '8px' }}>
                      Block: {item.height}
                    </span>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
          <Button 
            variant="contained" 
            onClick={handlePrevPage} 
            disabled={currentPage === 0}
          >
            Previous
          </Button>
          <Button
            variant="contained"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages - 1}
          >
            Next
          </Button>
        </Box>
      </div>

      <Typography variant="h4" align="center" sx={{ paddingTop: '10px' }}>
        Recent blocks: {blocks.length}
      </Typography>
    </Container>
  );
};

export default PoolsPage;