import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, Typography, Box, Card, CardContent, 
  Divider, useTheme, useMediaQuery 
} from '@mui/material';
import PieChartIcon from '@mui/icons-material/PieChart';
import * as d3 from 'd3';
import config from '../config';

const AlgosPage = () => {
  // State variables
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const svgRef = useRef();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // WebSocket connection
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
            const validBlocks = message.data.filter(block => block && block.algo);
            
            if (validBlocks.length > 0) {
              setBlocks(validBlocks);
            } else {
              console.error('No valid blocks in received data');
            }
            setLoading(false);
          } else if (message.type === 'newBlock' && message.data) {
            console.log('New block received:', message.data);
            if (message.data.algo) {
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
          { algo: 'sha256d', height: 1 },
          { algo: 'sha256d', height: 2 },
          { algo: 'scrypt', height: 3 },
          { algo: 'skein', height: 4 },
          { algo: 'qubit', height: 5 },
          { algo: 'odocrypt', height: 6 }
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

  // Map algorithm names to colors for consistent styling
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

  // Update the pie chart whenever the blocks state changes
  useEffect(() => {
    // Debug log to track rendering
    console.log('Chart useEffect running, blocks:', blocks.length);
    
    if (blocks.length === 0 || !svgRef.current) {
      console.log('No blocks or SVG ref, skipping chart render');
      return;
    }
    
    try {
      // Count the number of blocks for each algorithm
      const algoCounts = {};
      blocks.forEach(block => {
        if (block && block.algo) {
          algoCounts[block.algo] = (algoCounts[block.algo] || 0) + 1;
        }
      });
      console.log('Algorithm counts:', algoCounts);
      
      const data = Object.entries(algoCounts).map(([algo, count]) => ({ algo, count }));
      console.log('Pie chart data:', data);
      
      if (data.length === 0) {
        console.log('No valid data for chart');
        return;
      }
      
      // Simplified chart dimensions
      const width = isMobile ? 300 : 500;
      const height = isMobile ? 300 : 500;
      const radius = Math.min(width, height) / 2;
      
      // Clear and set up SVG
      const svg = d3.select(svgRef.current);
      svg.attr('width', width)
         .attr('height', height);
      svg.selectAll('*').remove();
      
      // Create chart group
      const chart = svg.append('g')
        .attr('transform', `translate(${width / 2},${height / 2})`);
      
      // Simple pie and arc functions
      const pie = d3.pie()
        .value(d => d.count)
        .sort(null);
      
      const arc = d3.arc()
        .innerRadius(radius * 0.3)
        .outerRadius(radius * 0.8);
      
      const labelArc = d3.arc()
        .innerRadius(radius * 0.6)
        .outerRadius(radius * 0.6);
      
      // Create pie slices
      chart.selectAll('path')
        .data(pie(data))
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', d => getAlgoColor(d.data.algo))
        .attr('stroke', 'white')
        .attr('stroke-width', 2);
      
      const totalBlocks = blocks.length;
      
      // Add labels
      chart.selectAll('text')
        .data(pie(data))
        .enter()
        .append('text')
        .attr('transform', d => `translate(${labelArc.centroid(d)})`)
        .attr('text-anchor', 'middle')
        .attr('font-size', isMobile ? '12px' : '16px')
        .attr('fill', 'white')
        .attr('font-weight', 'bold')
        .html(d => {
          const percentage = ((d.data.count / totalBlocks) * 100).toFixed(1);
          return `${d.data.algo}<tspan x="0" dy="1.2em">${percentage}%</tspan>`;
        });
      
      // Add center text
      chart.append('text')
        .attr('text-anchor', 'middle')
        .attr('font-size', isMobile ? '14px' : '18px')
        .attr('font-weight', 'bold')
        .text(`${totalBlocks} Blocks`);
      
      console.log('Chart rendered successfully');
    } catch (error) {
      console.error('Error rendering chart:', error);
    }
  }, [blocks, isMobile]);

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
              <PieChartIcon sx={{ fontSize: '2.5rem', color: '#002352', mr: 2 }} />
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
                Realtime DigiByte Blocks By Algo
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
              This page preloads the last 240 DGB blocks (1 hour) & will keep incrementing in realtime as blocks are mined.
              DGB has 5 independent mining algorithms & each should mine roughly 20% of all blocks.
            </Typography>
          </CardContent>
        </Card>

        <Card
          elevation={3}
          sx={{
            p: { xs: 2, md: 3 },
            borderRadius: '12px',
            mb: 4,
            textAlign: 'center'
          }}
        >
          {loading ? (
            <Box sx={{ py: 10, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Typography variant="h5" sx={{ color: '#555' }}>
                Loading block data...
              </Typography>
            </Box>
          ) : (
            <>
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
                Mining Algorithm Distribution
              </Typography>
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
              <Typography variant="body1" sx={{ mt: 2, color: '#666' }}>
                Distribution of blocks mined by each algorithm over the last hour ({blocks.length} blocks).
              </Typography>
            </>
          )}
        </Card>

        <Card
          elevation={3}
          sx={{
            p: { xs: 2, md: 3 },
            borderRadius: '12px',
            mb: 4
          }}
        >
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, textAlign: 'center' }}>
            About DigiByte's MultiAlgo Mining
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            DigiByte employs a unique multi-algorithm approach to mining, which helps distribute the hashing power more fairly 
            and increases security by preventing any single mining algorithm from dominating the network.
          </Typography>
          <Typography variant="body1">
            The five mining algorithms used by DigiByte are:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2, mb: 2 }}>
            {['SHA256d', 'Scrypt', 'Skein', 'Qubit', 'Odocrypt'].map((algo, index) => (
              <Box 
                key={index} 
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  p: 1,
                  borderLeft: `4px solid ${getAlgoColor(algo.toLowerCase())}`,
                  bgcolor: 'rgba(0, 0, 0, 0.03)',
                  borderRadius: '4px',
                }}
              >
                <Typography variant="body1" sx={{ fontWeight: 'bold', flex: 1 }}>
                  {algo}
                </Typography>
                <Typography variant="body2" sx={{ color: '#666', flex: 3 }}>
                  {algo === 'Odocrypt' ? 
                    'A unique DigiByte algorithm that changes itself every 10 days to prevent ASIC dominance' : 
                    `Used in ${algo === 'SHA256d' ? 'Bitcoin' : algo === 'Scrypt' ? 'Litecoin' : 'various cryptocurrencies'}`}
                </Typography>
              </Box>
            ))}
          </Box>
          <Typography variant="body1" sx={{ mt: 2 }}>
            This multi-algorithm approach contributes to DigiByte's enhanced security and decentralization, making it more resilient against potential attacks.
          </Typography>
        </Card>
      </Container>
    </Box>
  );
};

export default AlgosPage;