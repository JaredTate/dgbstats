import React, { useRef, useEffect, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-luxon';
import { Typography } from '@mui/material';
import config from '../config';

Chart.register(...registerables);

const SupplyPage = ({ worldPopulation }) => {
  const chartRef = useRef(null);
  const [txOutsetInfo, setTxOutsetInfo] = useState(null);
  const [txOutsetInfoLoading, setTxOutsetInfoLoading] = useState(true);

  useEffect(() => {
    const socket = new WebSocket(config.wsBaseUrl);

    socket.onopen = () => {
      console.log('WebSocket connection established');
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('Received message from server:', message);

      if (message.type === 'initialData') {
        setTxOutsetInfo(message.data.txOutsetInfo);
        setTxOutsetInfoLoading(false);
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
    if (!txOutsetInfo || !chartRef.current) return;
  
    const currentSupply = txOutsetInfo.total_amount;
    const totalSupply = 21000000000; // Max supply
    const remainingSupply = totalSupply - currentSupply;
    const endDate = new Date('2035-01-01');
  
    const ctx = chartRef.current.getContext('2d');
    const chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [new Date('2014-01-10'), new Date(), endDate],
        datasets: [
          {
            label: 'Current DGB Supply',
            data: [0, currentSupply, currentSupply], // end current supply at current amount
            borderColor: '#0066cc',
            backgroundColor: '#0066cc',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          },
          {
            label: 'DGB Yet To Be Mined',
            data: [null, currentSupply, totalSupply], // start remaining supply at current amount
            borderColor: '#002352',
            backgroundColor: '#002352',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          }
        ],
      },
      options: {
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'year',
            },
            title: {
              display: true,
              text: 'Year',
            },
          },
          y: {
            title: {
              display: true,
              text: 'DGB Supply (in Billions)',
            },
            ticks: {
              callback: (value) => `${(value / 1000000000).toFixed(2)} B`,
            },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function (context) {
                let label = context.dataset.label;
                let value = (context.raw / 1000000000).toFixed(2) + ' B';
                return `${label}: ${value}`;
              },
            },
          },
        },
      },
    });
  
    return () => {
      chartInstance.destroy();
    };
  }, [txOutsetInfo]);
  
  if (txOutsetInfoLoading) {
    return <Typography variant="body1">Loading supply data...</Typography>;
  }

  if (!txOutsetInfo) {
    return <Typography variant="body1">No supply data available.</Typography>;
  }

  const currentSupply = txOutsetInfo.total_amount;
  const remainingSupply = 21000000000 - currentSupply;

  return (
    <div>
      <div style={{ textAlign: 'center' }}>
        <Typography variant="h4" component="h4" align="center" fontWeight="bold" gutterBottom sx={{ paddingTop: '10px' }}>
          DigiByte Supply
        </Typography>
        <Typography variant="h5" component="p" align="center" gutterBottom>
          Current DGB Supply: {(currentSupply / 1000000000).toFixed(2)} Billion DGB
        </Typography>
        <Typography variant="h5" component="p" align="center" gutterBottom>
          Remaining DGB To Mine: {(remainingSupply / 1000000000).toFixed(2)} Billion DGB
        </Typography>
        <Typography variant="body1" component="p" align="center" gutterBottom>
          There will only ever be 21 Billion DGB mined in 21 years. The last DGB will be mined in the year 2035.
        </Typography>
      </div>
      <div style={{ width: '100%', height: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
  <div style={{ width: '80%', height: '100%' }}>
    <canvas ref={chartRef} />
  </div>
</div>
      <div style={{ textAlign: 'center' }}>
        <Typography variant="body1" component="p" align="center" gutterBottom>
          There is currently only <strong>{(currentSupply / worldPopulation).toFixed(2)}</strong> DGB for each person on planet Earth.
          <br />
          World Population: {worldPopulation.toLocaleString()}
        </Typography>
      </div>
    </div>
  );
};

export default SupplyPage;
