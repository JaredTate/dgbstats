import React, { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-luxon';
import { LineController } from 'chart.js';
import { Typography } from '@mui/material';
import config from './config';

Chart.register(...registerables);
Chart.register(LineController);

const algoNames = ['SHA256D', 'Scrypt', 'Skein', 'Qubit', 'Odo'];

const DifficultiesPage = () => {
  // Refs for storing chart references and instances
  const chartRefs = useRef([]);
  const chartInstances = useRef([]);

  // State for storing difficulties data
  const [difficulties, setDifficulties] = useState(
    algoNames.reduce((acc, algo) => ({ ...acc, [algo]: null }), {})
  );

  // WebSocket connection and event handling
  useEffect(() => {
    const socket = new WebSocket(config.wsBaseUrl);

    // Event handler for WebSocket connection open
    socket.onopen = () => {
      console.log('WebSocket connection established');
    };

    // Event handler for receiving block data from the server
    socket.onmessage = (event) => {
      const newBlock = JSON.parse(event.data);
      setDifficulties((prevDifficulties) => ({
        ...prevDifficulties,
        [newBlock.algo]: newBlock.difficulty,
      }));
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

  // Chart rendering and updating
  useEffect(() => {
    algoNames.forEach((algo, index) => {
      const ctx = chartRefs.current[index].getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, 'rgba(250,174,50,1)');
      gradient.addColorStop(1, 'rgba(250,174,50,0)');

      let chartInstance = chartInstances.current[index];

      // Create a new chart instance if it doesn't exist
      if (!chartInstance) {
        chartInstance = new Chart(ctx, {
          type: 'line',
          data: {
            labels: [],
            datasets: [
              {
                label: 'Difficulty',
                data: [],
                backgroundColor: gradient,
                borderColor: 'rgba(250,174,50,1)',
                borderWidth: 1,
              },
            ],
          },
          options: {
            scales: {
              yAxes: [
                {
                  ticks: {
                    beginAtZero: true,
                  },
                },
              ],
            },
          },
        });
        chartInstances.current[index] = chartInstance;
      }

      // Update the chart with new difficulty data if available
      if (difficulties[algo] !== null) {
        chartInstance.data.labels.push(algo);
        chartInstance.data.datasets[0].data.push(difficulties[algo]);
        chartInstance.update();
      }
    });
  }, [difficulties]);

  // Render the component
  return (
    <div>
      <div style={{ textAlign: 'center' }}>
        <Typography variant="h2" component="h2" align="center" fontWeight="bold" gutterBottom sx={{ paddingTop: '10px' }}>
          Recent DGB Algo Difficulties
        </Typography>
        <Typography variant="h6" component="p" align="center" gutterBottom sx={{ paddingBottom: '10px' }}>
          Wait for blocks to be mined to show realtime algo difficulties.
          This page will keep incrementing as long as you leave it open.
        </Typography>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem' }}>
        {algoNames.map((algo, index) => (
          <div key={index} style={{ flexBasis: 'calc(33.33% - 1rem)', marginBottom: '3rem' }}>
            <div style={{ textAlign: 'center', fontWeight: 'bold' }}>{algo}</div>
            <canvas
              ref={(el) => {
                if (!chartRefs.current[index]) {
                  chartRefs.current[index] = el;
                }
              }}
              style={{ maxWidth: '100%', height: '400px', margin: '0 auto' }}
            />
            <div style={{ textAlign: 'center' }}>Current Diff: {difficulties[algo] || 'N/A'}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DifficultiesPage;