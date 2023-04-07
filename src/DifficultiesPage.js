import React, { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-luxon';
import { LineController } from 'chart.js';
Chart.register(...registerables);
Chart.register(LineController);

const DifficultiesPage = ({ difficultiesData }) => {
  const chartRefs = useRef([]);
  const chartInstances = useRef([]);

  const [difficulties, setDifficulties] = useState([]);

  useEffect(() => {
    if (difficultiesData) {
      const difficultiesArray = Object.entries(difficultiesData).map(([algo, difficulty]) => ({
        algo,
        difficulty,
      }));
      setDifficulties(difficultiesArray);
    }
  }, [difficultiesData]);

  useEffect(() => {
    if (difficulties.length > 0 && chartRefs.current.length > 0) {
      difficulties.forEach((item, index) => {
        const ctx = chartRefs.current[index].getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(250,174,50,1)');
        gradient.addColorStop(1, 'rgba(250,174,50,0)');

        let chartInstance = chartInstances.current[index];
        if (!chartInstance) {
          chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
              labels: [item.algo],
              datasets: [
                {
                  label: 'Difficulty',
                  data: [item.difficulty],
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
        } else {
          chartInstance.data.labels.push(item.algo);
          chartInstance.data.datasets[0].data.push(item.difficulty);
          chartInstance.update();
        }
      });
    }
  }, [difficulties]);

  return (
    <div>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ margin: '20px' }}>DGB Algo Difficulties</h1>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem' }}>
  {difficulties &&
    difficulties.map((item, index) => (
      <div key={index} style={{ flexBasis: 'calc(33.33% - 1rem)', marginBottom: '3rem' }}>
        <div style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.algo}</div>
        <canvas
  ref={(el) => {
    if (!chartRefs.current[index]) {
      chartRefs.current[index] = el;
    }
  }}
  style={{ maxWidth: '100%', height: '400px', margin: '0 auto' }}
/>
        <div style={{ textAlign: 'center' }}>Current Diff: {item.difficulty}</div>
      </div>
    ))}
</div>

    </div>
  );
};

export default DifficultiesPage;
