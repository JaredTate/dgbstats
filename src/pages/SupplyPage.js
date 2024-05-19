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
    const totalSupply = 21000000000;
    const remainingSupply = totalSupply - currentSupply;

    const ctx = chartRef.current.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, chartRef.current.width, 0);

    // Adjust gradient to match actual data proportions
    const supplyProportion = currentSupply / totalSupply;
    gradient.addColorStop(0, '#0066cc'); // Blue color starts at 0%
    gradient.addColorStop(supplyProportion, '#0066cc'); // Blue color ends at current supply proportion
    gradient.addColorStop(supplyProportion, '#002352'); // Dark blue starts at current supply proportion
    gradient.addColorStop(1, '#002352'); // Dark blue ends at 100%

    const chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [new Date('2015-01-01'), new Date(), new Date('2035-01-01')],
        datasets: [
          {
            label: 'DGB Supply',
            data: [0, currentSupply, totalSupply],
            backgroundColor: gradient,
            borderColor: '#0066cc',
            borderWidth: 2,
            pointRadius: (ctx, { dataIndex }) => (dataIndex === 1 ? 12 : 0),
            pointBackgroundColor: '#0066cc',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            tension: 0.4,
            fill: true,
          },
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
                const labelIndex = context.dataIndex;
                if (labelIndex === 1) {
                  return `Current Supply: ${(context.raw / 1000000000).toFixed(2)} B`;
                } else if (labelIndex === 2) {
                  return `DGB Yet To Be Mined: ${(remainingSupply / 1000000000).toFixed(2)} B`;
                }
                return '';
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
