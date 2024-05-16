import { useState, useEffect, useMemo } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Graticule } from '@visx/geo';
import axios from 'axios';
import './NodesPage.css';
import digibyteIcon from './digibyte256.png';

import { geoMercator, geoPath, geoGraticule10 } from 'd3-geo';
import { feature } from 'topojson-client';
import { useWidth } from '../utils';
import world from '../countries-110m.json';




const useFetchData = () => {
  const [nodesData, setNodesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5001/api/getpeerinfo');
        const data = response.data;
        console.log('Received node data:', data);
        setNodesData((prevNodes) => {
          const newNodes = data.filter((node) => !prevNodes.some((prevNode) => prevNode.addr === node.addr));
          return [...prevNodes, ...newNodes];
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching node data:', error);
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return { nodesData, loading };
};


const NodesPage = () => {
  const { nodesData, loading } = useFetchData();

  const uniqueNodes = nodesData.filter((v, i, a) => a.findIndex(t => t.addr === v.addr) === i);
  console.log("Unique nodes with lat and lon: ", uniqueNodes);

  const nodesByVersion = uniqueNodes.reduce((acc, node, index) => {
    const version = node.subver.replace(/[\[\]\/"]/g, '');
    if (!acc[version]) {
      acc[version] = { id: index, version, count: 0 };
    }
    acc[version].count += 1;
    return acc;
  }, {});


  const versionData = Object.values(nodesByVersion);
  const columns = [
    { field: 'version', headerName: 'DigiByte Core Version', width: 250 },
    { field: 'count', headerName: 'Node Count', width: 150 },
  ];

  const nodesByCountry = useMemo(() => {
    return uniqueNodes.reduce((acc, node) => {
      if (node.country) {
        acc[node.country] = (acc[node.country] || 0) + 1;
      }
      return acc;
    }, {});
  }, [uniqueNodes]);

  const width = useWidth();
  const height = 800;

  const projection = geoMercator()
    .scale(width / 9) // Reduce the scale to show more of the world
    .translate([width / 2, height / 2.8]); // Adjust the translation to center the map

  // ...

  return (
    <div className="page-container">
      <h1 className="centered-text"> Active DGB Nodes (Currently Connected To Server Node)</h1>
      {!loading && (
        <>
          <h2 className="centered-text">Nodes Seen Recently: {uniqueNodes.length}</h2>
          <div className="grid-container">
            <DataGrid className="centered-text data-grid" rows={versionData} columns={columns} autoHeight />
            {/* Add a new div for the nodes by country list */}
            <div className="nodes-by-country">
              <h3>Nodes by Country</h3>
              <ul>
                {Object.entries(nodesByCountry).map(([country, count]) => (
                  <li key={country}>
                    {country}: {count}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <svg width={width} height={height}>
            <rect width={width} height={height} fill="#f3f3f3" />
            <Graticule graticule={() => geoGraticule10()} stroke="#000" />
  
            {feature(world, world.objects.land).features.map((d, i) => (
              <path key={i} d={geoPath().projection(projection)(d)} fill="#ccc" stroke="#000" strokeWidth={0.5} />
            ))}
            {uniqueNodes.map((node, i) => {
              const [x, y] = projection([node.lon, node.lat]);
              if (isNaN(x) || isNaN(y)) {
                return null;
              }
              return (
                <g key={`node-${i}`}>
                  <image
                    href={digibyteIcon} // Use the imported variable here
                    x={x - 8}
                    y={y - 8}
                    width={16}
                    height={16}
                  />
                  <text x={x} y={y + 20} textAnchor="middle" fontSize={10}>
                    {(node.city || 'Unknown') + ', ' + (node.country || '')}
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