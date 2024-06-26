import React, { useState, useEffect, useRef } from 'react';
import { Container, Typography } from '@mui/material';
import * as d3 from 'd3';
import config from '../config';

const BlocksPage = () => {
  // State variables
  const [blocks, setBlocks] = useState([]); // Stores the list of blocks
  const [loading, setLoading] = useState(true); // Indicates if the page is loading
  const svgRef = useRef(); // Reference to the SVG element

  // WebSocket connection
  useEffect(() => {
    const socket = new WebSocket(config.wsBaseUrl);

    // Event handler for WebSocket connection open
    socket.onopen = () => {
      console.log('WebSocket connection established');
    };

    // Event handler for receiving messages from the server
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('Received message from server:', message);

      if (message.type === 'recentBlocks') {
        console.log('Received recent blocks:', message.data);
        // Set the initial recent blocks
        setBlocks(message.data);
        setLoading(false);
      } else if (message.type === 'newBlock') {
        console.log('Received new block:', message.data);
        // Add new block to the beginning of the blocks array
        setBlocks((prevBlocks) => [message.data, ...prevBlocks]);
      }
    };

    // Event handler for WebSocket connection close
    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    // Cleanup function to close the WebSocket connection when the component unmounts
    return () => {
      socket.close();
    };
  }, []);

  // Update the pie chart whenever the blocks state changes
  useEffect(() => {
    if (blocks.length === 0) return; // Don't update the chart if there are no blocks
    
    // Count the number of blocks for each algorithm
    const algoCounts = {};
    blocks.forEach((block) => (algoCounts[block.algo] = (algoCounts[block.algo] || 0) + 1));

    // Prepare the data for the pie chart
    const data = Object.entries(algoCounts).map(([algo, count]) => ({ algo, count }));

    // Set up the pie chart using D3.js
    const svg = d3.select(svgRef.current),
      width = 500,
      height = 500,
      radius = Math.min(width, height) / 2;

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    const pie = d3.pie().value((d) => d.count).sort(null);
    const arc = d3.arc().innerRadius(0).outerRadius(radius);
    const labelArc = d3.arc().innerRadius(radius * 0.6).outerRadius(radius * 0.6);

    svg.selectAll('g').remove(); // Remove any existing chart elements

    const chart = svg.append('g').attr('transform', `translate(${width / 2},${height / 2})`);

    // Create the pie slices
    chart.selectAll('path').data(pie(data)).enter().append('path').attr('d', arc).attr('fill', (d) => colorScale(d.data.algo));

    const totalBlocks = blocks.length;

    // Add labels to the pie slices
    chart
      .selectAll('text')
      .data(pie(data))
      .enter()
      .append('text')
      .attr('transform', (d) => `translate(${labelArc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('font-size', '25px')
      .attr('fill', 'white')
      .html((d) => {
        const percentage = ((d.data.count / totalBlocks) * 100).toFixed(1);
        return `${d.data.algo}<tspan x="0" dy="1.2em">${percentage}%</tspan>`;
      });
  }, [blocks, svgRef]);

  // Render the component
  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h4" align="center" fontWeight="bold" gutterBottom sx={{ paddingTop: '10px' }}>
        Realtime DGB Blocks By Algo
      </Typography>
      <Typography variant="h7" component="p" align="center" gutterBottom sx={{ paddingBottom: '10px' }}> 
        This page preloads the last 240 DGB blocks (1 hour) & will keep incrementing in realtime as blocks are mined.<br /> 
        DGB has 5 independent mining algos & each algo should mine roughly 20% of all blocks. 
        <br /> 240 blocks should be roughly 1 hour of time.
      </Typography>
      <svg ref={svgRef} width="500" height="500" style={{ display: 'block', margin: 'auto' }}></svg>
      {loading ? (
        <Typography variant="h4" align="center">Loading...</Typography>
      ) : (
        <Typography variant="h4" align="center" sx={{ paddingTop: '10px' }}>Recent blocks: {blocks.length}</Typography>
      )}
    </Container>
  );
};

export default BlocksPage;