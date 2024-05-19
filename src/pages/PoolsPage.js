import React, { useState, useEffect, useRef } from 'react';
import { Container, Typography, List, ListItem, ListItemText, Box } from '@mui/material';
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

    const addressCounts = {};
    blocks.forEach((block) => {
      const address = block.minedTo;
      if (address) {
        addressCounts[address] = (addressCounts[address] || 0) + 1;
      }
    });

    const data = Object.entries(addressCounts).map(([address, count]) => ({
      address,
      count,
    }));

    const singleBlockAddresses = data.filter((item) => item.count === 1);
    const multipleBlockAddresses = data.filter((item) => item.count > 1);

    const pieChartData = [
      ...multipleBlockAddresses.map((item) => ({
        address: item.address.substring(0, 5),
        count: item.count,
      })),
      {
        address: 'Addresses With 1 Block',
        count: blocks.length - sortedAddresses.reduce((sum, item) => sum + item.count, 0),
    
      },
    ];

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

    chart.selectAll('path').data(pie(pieChartData)).enter().append('path').attr('d', arc).attr('fill', (d) => colorScale(d.data.address));

    const totalBlocks = blocks.length;

    chart
      .selectAll('text')
      .data(pie(pieChartData))
      .enter()
      .append('text')
      .attr('transform', (d) => `translate(${labelArc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('fill', 'white')
      .html((d) => {
        const percentage = ((d.data.count / totalBlocks) * 100).toFixed(1);
        return `${d.data.address}<tspan x="0" dy="1.2em">${percentage}%</tspan>`;
      });
  }, [blocks, svgRef]);

  const sortedAddresses = Object.entries(
    blocks.reduce((acc, block) => {
      const address = block.minedTo;
      const poolIdentifier = block.poolIdentifier;
      if (address) {
        if (!acc[address]) {
          acc[address] = { count: 0, poolIdentifier: poolIdentifier };
        }
        acc[address].count += 1;
      }
      return acc;
    }, {})
  )
    .sort((a, b) => b[1].count - a[1].count)
    .map(([address, data], index) => ({ address, count: data.count, poolIdentifier: data.poolIdentifier, rank: index + 1 }))
    .filter((item) => item.count > 1);

  const singleBlockAddressCount = blocks.length - sortedAddresses.reduce((sum, item) => sum + item.count, 0);

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
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <svg ref={svgRef} width="500" height="500" style={{ display: 'block' }}></svg>
        <List style={{ width: '50%' }}>
          {sortedAddresses.map((item) => (
            <ListItem key={item.address}>
              <ListItemText
                primary={
                  <>
                    <Box component="span" fontWeight="bold">
                      {item.rank}.{' '}
                    </Box>
                    {item.address} ({item.count} blocks)
                  </>
                }
                secondary={item.poolIdentifier}
              />
            </ListItem>
          ))}
          <ListItem>
            <ListItemText primary={`Other Addresses with only 1 block: ${singleBlockAddressCount}`} />
          </ListItem>
        </List>
      </div>
      {loading ? (
        <Typography variant="h4" align="center">
          Loading...
        </Typography>
      ) : (
        <Typography variant="h4" align="center" sx={{ paddingTop: '10px' }}>
          Recent blocks: {blocks.length}
        </Typography>
      )}
    </Container>
  );
};

export default PoolsPage;