import { useState, useEffect, useMemo } from 'react';
import { Container, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Graticule } from '@visx/geo';
import axios from 'axios';
import './NodesPage.css';
import digibyteIcon from './digibyte256.png';
import { geoMercator, geoPath, geoGraticule10 } from 'd3-geo';
import { feature } from 'topojson-client';
import { useWidth } from '../utils';
import world from '../countries-110m.json';
import config from '../config';

const useFetchData = () => {
  const [nodesData, setNodesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const socket = new WebSocket(config.wsBaseUrl);

    socket.onopen = () => {
      console.log('WebSocket connection established');
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'geoData') {
        console.log('Received geo data:', message.data);
        setNodesData(message.data);
        setLoading(false);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      socket.close();
    };
  }, []);

  return { nodesData, loading };
};

const NodesPage = () => {
  const { nodesData, loading } = useFetchData();

  const nodesByCountry = useMemo(() => {
    const countryCount = nodesData.reduce((acc, node) => {
      if (node.country) {
        acc[node.country] = (acc[node.country] || 0) + 1;
      }
      return acc;
    }, {});

    const sortedCountries = Object.entries(countryCount).sort((a, b) => b[1] - a[1]);

    return Object.fromEntries(sortedCountries);
  }, [nodesData]);

  const width = useWidth();
  const height = 800;

  const projection = geoMercator()
    .scale(width / 9)
    .translate([width / 2, height / 2])
    .center([0, 0]);

  return (
    <div className="page-container">
<Typography variant="h4" component="h4" align="center" fontWeight="bold" gutterBottom sx={{ paddingTop: '10px' }}>
  Active DigiByte Nodes
</Typography>
<Typography variant="h7" component="p" align="center" gutterBottom sx={{ paddingBottom: '10px' }}>
  This page displays unique nodes seen in the peers.dat file by the DigiHash pool DigiByte node.
  <br />  The node crawler pulling data from peers.dat is being updated to handle unique nodes.
</Typography>
      {!loading && (
        <>
          <h2 className="centered-text">Unique Nodes Seen In Last Month: {nodesData.length}</h2>
          <svg width={width} height={height}>
            <rect width={width} height={height} fill="#f3f3f3" />
            <Graticule graticule={() => geoGraticule10()} stroke="#000" />
            {feature(world, world.objects.land).features.map((d, i) => (
              <path key={i} d={geoPath().projection(projection)(d)} fill="#ccc" stroke="#000" strokeWidth={0.5} />
            ))}
            {nodesData.map((node, i) => {
              const [x, y] = projection([node.lon, node.lat]);
              if (isNaN(x) || isNaN(y)) {
                return null;
              }
              return (
                <g key={`node-${i}`}>
                  <image href={digibyteIcon} x={x - 8} y={y - 8} width={16} height={16} />
                  <text x={x} y={y + 20} textAnchor="middle" fontSize={10}>
                  </text>
                </g>
              );
            })}
          </svg>
        </>
      )}
    </div>
  );
};

export default NodesPage;