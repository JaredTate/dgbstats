import { useState, useEffect, useMemo } from 'react';
import { Typography } from '@mui/material';
import { Graticule } from '@visx/geo';
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

    socket.onopen = () => console.log('WebSocket connection established');

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'geoData') {
          console.log('Received geo data:', message.data);
          setNodesData(message.data || []);
          setLoading(false);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        setLoading(false);
      }
    };

    socket.onclose = () => setLoading(true);
    socket.onerror = () => setLoading(true);

    return () => socket.readyState === WebSocket.OPEN && socket.close();
  }, []);

  return { nodesData, loading };
};

const NodesPage = () => {
  const { nodesData, loading } = useFetchData();
  const width = useWidth();
  const height = 800;

  const validNodes = useMemo(() => 
    nodesData.filter(node => node.lat !== 0 && node.lon !== 0),
    [nodesData]
  );

  const nodesByCountry = useMemo(() => {
    if (!nodesData || nodesData.length === 0) return {};
    return nodesData.reduce((acc, node) => {
      if (node.country) {
        acc[node.country] = (acc[node.country] || 0) + 1;
      }
      return acc;
    }, {});
  }, [nodesData]);

  const projection = geoMercator()
    .scale(width / 9)
    .translate([width / 2, height / 2])
    .center([0, 0]);

  return (
    <div className="page-container">
      <Typography variant="h4" component="h4" align="center" fontWeight="bold" gutterBottom sx={{ paddingTop: '10px' }}>
        DigiByte Nodes
      </Typography>
      <Typography variant="h7" component="p" align="center" gutterBottom sx={{ paddingBottom: '10px' }}>
        This page displays unique nodes seen in the peers.dat file of the DigiHash mining pool wallet since the wallet node was setup on May 8th, 2024.
        <br />  A blockchain node is simply a computer running the DGB core wallet. The data from peers.dat is parsed to display unique node IP's only.
      </Typography>
      {!loading && (
        <>
          <h2 className="centered-text">
            Unique Nodes: {nodesData.length} (Mapped: {validNodes.length})
          </h2>
          
          <svg width={width} height={height}>
            <rect width={width} height={height} fill="#f3f3f3" />
            <Graticule graticule={geoGraticule10} stroke="#DDD" />
            {feature(world, world.objects.countries).features.map((d, i) => (
              <path
                key={i}
                d={geoPath().projection(projection)(d)}
                fill="#ccc"
                stroke="#999"
                strokeWidth={0.5}
              />
            ))}
            {validNodes.map((node, i) => {
              const [x, y] = projection([node.lon, node.lat]);
              if (isNaN(x) || isNaN(y)) return null;
              return (
                <g key={`node-${i}`} transform={`translate(${x - 8},${y - 8})`}>
                  <image href={digibyteIcon} width={16} height={16} />
                </g>
              );
            })}
          </svg>

          <div className="nodes-by-country">
            <h3>Nodes by Country</h3>
            <ul>
              {Object.entries(nodesByCountry)
                .filter(([country]) => country !== 'Unknown')
                .sort(([,a], [,b]) => b - a)
                .map(([country, count]) => (
                  <li key={country}>{country}: {count}</li>
                ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default NodesPage;