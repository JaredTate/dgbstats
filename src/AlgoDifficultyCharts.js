import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const AlgoDifficultyCharts = ({ difficultiesData = {} }) => { // Provide a default value for difficultiesData
  const chartRefs = useRef([]);


  const createChart = (algoName, algoData) => {
    const ctx = chartRefs.current[algoName];
    if (ctx) {
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: algoData.map((item) => item.timestamp),
          datasets: [
            {
              label: `${algoName} Difficulty`,
              data: algoData.map((item) => item.difficulty),
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
            },
          ],
        },
        options: {
          scales: {
            x: { type: 'time' },
          },
        },
      });
    }
  };

  useEffect(() => {
    for (const algoName in difficultiesData) {
      createChart(algoName, difficultiesData[algoName]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="AlgoDifficultyCharts">
      {Object.keys(difficultiesData).map((algoName) => (
        <div key={algoName}>
          <h2>{algoName}</h2>
          <canvas ref={(el) => (chartRefs.current[algoName] = el)}></canvas>
        </div>
      ))}
    </div>
  );
};

export default AlgoDifficultyCharts;
