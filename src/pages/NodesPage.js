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

  // Convert TopoJSON to GeoJSON
  const worldData = useMemo(() => feature(world, world.objects.countries), []);

  // Filter out invalid lat/lon
  const validNodes = useMemo(
    () => nodesData.filter(node => node.lat !== 0 && node.lon !== 0),
    [nodesData]
  );

  // Compute nodes by country
  const nodesByCountry = useMemo(() => {
    if (!nodesData || nodesData.length === 0) return {};
    return nodesData.reduce((acc, node) => {
      if (node.country) {
        acc[node.country] = (acc[node.country] || 0) + 1;
      }
      return acc;
    }, {});
  }, [nodesData]);

  // Responsive sizing
  const containerWidth = Math.min(useWidth(), 1200);
  const containerHeight = containerWidth * 0.55;

  /**
   * We define our bounding box to:
   *   - go from -55 (S) to +65 (N) in latitude,
   *   - cover full -180 to 180 in longitude.
   * This should clip out everything above ~Fairbanks, Alaska latitude.
   */
  const boundingBox = useMemo(
    () => ({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-180, -55], // SW corner
          [ 180, -55], // SE corner
          [ 180,  65], // NE corner
          [-180,  65], // NW corner
          [-180, -55], // close polygon
        ]]
      }
    }),
    []
  );

  // Create a Mercator projection and fit it to the bounding box
  const projection = useMemo(() => {
    const p = geoMercator();
    // Fit our bounding box to [width, height]
    p.fitExtent(
      [
        [0, 0],
        [containerWidth, containerHeight]
      ],
      boundingBox
    );
    // Clip anything outside that bounding box
    p.clipExtent([
      [0, 0],
      [containerWidth, containerHeight]
    ]);
    return p;
  }, [boundingBox, containerWidth, containerHeight]);

  const pathGenerator = useMemo(() => geoPath().projection(projection), [projection]);

  return (
    <div className="page-container">
      <Typography variant="h4" align="center" fontWeight="bold" gutterBottom>
        DigiByte Nodes
      </Typography>
      <Typography variant="body1" align="center" gutterBottom>
        This page displays unique nodes seen in the peers.dat file of the DigiHash mining pool
        wallet since the wallet node was setup on May 8th, 2024.
        <br />
        A blockchain node is simply a computer running the DGB core wallet. The data from peers.dat
        is parsed to display unique node IP's only.
      </Typography>

      {!loading && (
        <>
          <h2 className="centered-text">
            Unique Nodes: {nodesData.length} (Mapped: {validNodes.length})
          </h2>
          <div className="map-container">
            <svg width={containerWidth} height={containerHeight}>
              <rect width={containerWidth} height={containerHeight} fill="#f3f3f3" />
              <Graticule graticule={geoGraticule10} stroke="#DDD" />

              {worldData.features.map((feat, i) => (
                <path
                  key={`country-${i}`}
                  d={pathGenerator(feat)}
                  fill="#ccc"
                  stroke="#999"
                  strokeWidth={0.5}
                />
              ))}

              {validNodes.map((node, i) => {
                const coords = projection([node.lon, node.lat]);
                if (!coords) return null;
                const [x, y] = coords;
                if (isNaN(x) || isNaN(y)) return null;
                return (
                  <g key={`node-${i}`} transform={`translate(${x - 8}, ${y - 8})`}>
                    <image href={digibyteIcon} width={16} height={16} />
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="nodes-by-country">
            <h3>Nodes by Country</h3>
            <ul>
              {Object.entries(nodesByCountry)
                .filter(([country]) => country !== 'Unknown')
                .sort(([, a], [, b]) => b - a)
                .map(([country, count]) => (
                  <li key={country}>
                    {country}: {count}
                  </li>
                ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default NodesPage;
