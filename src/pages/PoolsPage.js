import React, { useState, useEffect, useRef } from 'react';
import { Container, Typography, List, ListItem, ListItemText } from '@mui/material';
import * as d3 from 'd3';
import config from '../config';

const PoolsPage = () => {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const svgRef = useRef();

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

  useEffect(() => {
    if (blocks.length === 0) return;

    const poolCounts = {};
    blocks.forEach((block) => {
      const poolIdentifier = block.poolIdentifier;
      poolCounts[poolIdentifier] = (poolCounts[poolIdentifier] || 0) + 1;
    });

    const data = Object.entries(poolCounts).map(([poolIdentifier, count]) => ({
      poolIdentifier,
      count,
    }));

    const svg = d3.select(svgRef.current),
      width = 500,
      height = 500,
      radius = Math.min(width, height) / 2;

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    const pie = d3.pie().value((d) => d.count).sort(null);
    const arc = d3.arc().innerRadius(0).outerRadius(radius);
    const labelArc = d3.arc().innerRadius(radius * 0.6).outerRadius(radius * 0.6);

    svg.selectAll('g').remove();

    const chart = svg.append('g').attr('transform', `translate(${width / 2},${height / 2})`);

    chart.selectAll('path').data(pie(data)).enter().append('path').attr('d', arc).attr('fill', (d) => colorScale(d.data.poolIdentifier));

    const totalBlocks = blocks.length;

    chart
      .selectAll('text')
      .data(pie(data))
      .enter()
      .append('text')
      .attr('transform', (d) => `translate(${labelArc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('fill', 'white')
      .html((d) => {
        const percentage = ((d.data.count / totalBlocks) * 100).toFixed(1);
        return `${d.data.poolIdentifier}<tspan x="0" dy="1.2em">${percentage}%</tspan>`;
      });
  }, [blocks, svgRef]);

  const sortedPools = Object.entries(
    blocks.reduce((acc, block) => {
      const poolIdentifier = block.poolIdentifier;
      acc[poolIdentifier] = (acc[poolIdentifier] || 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .map(([poolIdentifier, count]) => ({ poolIdentifier, count }));

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h4" align="center" fontWeight="bold" gutterBottom sx={{ paddingTop: '10px' }}>
        Realtime DGB Blocks By Pool
      </Typography>
      <Typography variant="h7" component="p" align="center" gutterBottom sx={{ paddingBottom: '10px' }}>
        This page preloads the last 240 DGB blocks (1 hour) & will keep incrementing in realtime as blocks are mined.
        <br />
        The pie chart shows the breakdown of blocks mined to each address, and the list displays the addresses sorted by the number of blocks mined.
      </Typography>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <svg ref={svgRef} width="500" height="500" style={{ display: 'block' }}></svg>
        <List style={{ width: '50%' }}>
          {sortedPools.map((pool, index) => (
            <ListItem key={index}>
              <ListItemText primary={`${pool.poolIdentifier} (${pool.count} blocks)`} />
            </ListItem>
          ))}
        </List>
      </div>
      {loading ? (
        <Typography variant="h4" align="center">Loading...</Typography>
      ) : (
        <Typography variant="h4" align="center" sx={{ paddingTop: '10px' }}>Recent blocks: {blocks.length}</Typography>
      )}
    </Container>
  );
};

export default PoolsPage;