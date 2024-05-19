import React, { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-luxon';
import { LineController } from 'chart.js';
import { Typography } from '@mui/material';
import config from '../config';

Chart.register(...registerables);
Chart.register(LineController);

const algoNames = ['SHA256D', 'Scrypt', 'Skein', 'Qubit', 'Odo'];

const DifficultiesPage = () => {
  // Refs for storing chart references and instances
  const chartRefs = useRef([]);
  const chartInstances = useRef([]);

  // State for storing difficulties data
  const [difficulties, setDifficulties] = useState(
    algoNames.reduce((acc, algo) => ({ ...acc, [algo]: [] }), {})
  );

  // WebSocket connection and event handling
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
        // Update the difficulties state with the recent blocks data
        const updatedDifficulties = algoNames.reduce((acc, algo) => {
          const algoDifficulties = message.data
            .filter((block) => block.algo === algo)
            .map((block) => block.difficulty);
          return { ...acc, [algo]: algoDifficulties };
        }, {});
        setDifficulties(updatedDifficulties);
      } else if (message.type === 'newBlock') {
        console.log('Received new block:', message.data);
        // Update the difficulties state with the new block data
        setDifficulties((prevDifficulties) => ({
          ...prevDifficulties,
          [message.data.algo]: [...prevDifficulties[message.data.algo], message.data.difficulty],
        }));
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

  // Chart rendering and updating
  useEffect(() => {
    algoNames.forEach((algo, index) => {
      const ctx = chartRefs.current[index].getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, 'rgba(0, 102, 204, 1)');
      gradient.addColorStop(1, 'rgba(0, 102, 204, 0)');

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
                borderColor: 'rgba(0, 102, 204, 1)',
                borderWidth: 1,
                pointBackgroundColor: 'rgba(0, 102, 204, 1)',
                pointBorderColor: 'rgba(0, 102, 204, 1)',
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

      // Update the chart with the difficulties data
      chartInstance.data.labels = difficulties[algo].map((_, i) => i + 1);
      chartInstance.data.datasets[0].data = difficulties[algo];
      chartInstance.update();
    });
  }, [difficulties]);

  // Render the component
  return (
    <div>
      <div style={{ textAlign: 'center' }}>
        <Typography variant="h4" component="h4" align="center" fontWeight="bold" gutterBottom sx={{ paddingTop: '10px' }}>
          Realtime DGB Algo Difficulty
        </Typography>
        <Typography variant="h7" component="p" align="center" gutterBottom sx={{ paddingBottom: '10px' }}>
          This page preloads the difficulty of the last 240 DGB blocks (1 hour) & will keep incrementing as long as you leave it open as blocks are mined in realtime.
          <br />  DigiByte uses independent, realtime difficulty adjustment for each algo known as <strong>DigiShield</strong> or <strong>MultiShield</strong> to further decentralize & secure the blockchain.
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
            <div style={{ textAlign: 'center' }}>Latest Block Difficulty: {difficulties[algo]?.[difficulties[algo].length - 1] || 'N/A'}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DifficultiesPage;