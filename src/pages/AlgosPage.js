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
    if (blocks.length === 0 || !svgRef.current) return;
    
    // Count the number of blocks for each algorithm
    const algoCounts = {};
    blocks.forEach((block) => (algoCounts[block.algo] = (algoCounts[block.algo] || 0) + 1));

    // Prepare the data for the pie chart
    const data = Object.entries(algoCounts).map(([algo, count]) => ({ algo, count }));

    // Responsive dimensions
    const svgWidth = isMobile ? 300 : 500;
    const svgHeight = isMobile ? 300 : 500;
    const width = svgWidth;
    const height = svgHeight;
    const radius = Math.min(width, height) / 2;

    // Set up the pie chart using D3.js
    const svg = d3.select(svgRef.current)
      .attr('width', svgWidth)
      .attr('height', svgHeight);

    // Use our consistent color scheme
    const colorScale = d => getAlgoColor(d.data.algo);
    
    const pie = d3.pie()
      .value((d) => d.count)
      .sort(null);
      
    const arc = d3.arc()
      .innerRadius(radius * 0.3) // Add inner radius for donut chart
      .outerRadius(radius * 0.8);
      
    const labelArc = d3.arc()
      .innerRadius(radius * 0.6)
      .outerRadius(radius * 0.6);

    svg.selectAll('*').remove(); // Remove any existing chart elements

    const chart = svg.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    // Create the pie slices with animation
    chart.selectAll('path')
      .data(pie(data))
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', colorScale)
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0px 3px 3px rgba(0,0,0,0.2))');

    const totalBlocks = blocks.length;

    // Add labels to the pie slices
    chart.selectAll('text')
      .data(pie(data))
      .enter()
      .append('text')
      .attr('transform', (d) => `translate(${labelArc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('font-size', isMobile ? '14px' : '18px')
      .attr('font-weight', 'bold')
      .attr('fill', '#fff')
      .html((d) => {
        const percentage = ((d.data.count / totalBlocks) * 100).toFixed(1);
        return `${d.data.algo}<tspan x="0" dy="1.2em">${percentage}%</tspan>`;
      });

    // Add center text
    chart.append('text')
      .attr('text-anchor', 'middle')
      .attr('font-size', isMobile ? '14px' : '18px')
      .attr('font-weight', 'bold')
      .text(`${totalBlocks} Blocks`);
      
  }, [blocks, svgRef, isMobile]);

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
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                <svg 
                  ref={svgRef} 
                  width={isMobile ? 300 : 500} 
                  height={isMobile ? 300 : 500} 
                  style={{ margin: 'auto' }}
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