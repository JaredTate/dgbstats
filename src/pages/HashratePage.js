import React, { useState, useEffect, useRef } from 'react';
import { Typography } from '@mui/material';
import config from '../config';

const algoNames = ['SHA256D', 'Scrypt', 'Skein', 'Qubit', 'Odo'];

const HashratePage = () => {
  const [hashrates, setHashrates] = useState(
    algoNames.reduce((acc, algo) => ({ ...acc, [algo]: 0 }), {})
  );
  const [totalHashrate, setTotalHashrate] = useState(0);
  const [isFirstHourComplete, setIsFirstHourComplete] = useState(false);
  const blocksRef = useRef([]);

  useEffect(() => {
    const socket = new WebSocket(config.wsBaseUrl);

    socket.onopen = () => {
      console.log('WebSocket connection established');
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('Received message from server:', message);

      if (message.type === 'recentBlocks') {
        console.log('Received recent blocks:', message.data);
        blocksRef.current = message.data;
        calculateHashrates();
      } else if (message.type === 'newBlock') {
        console.log('Received new block:', message.data);
        blocksRef.current.unshift(message.data);
        blocksRef.current = blocksRef.current.slice(0, 240);
        calculateHashrates();
      }
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      socket.close();
    };
  }, []);

  const calculateHashrates = () => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const hourBlocks = blocksRef.current.filter(
      (block) => block.timestamp * 1000 >= oneHourAgo
    );

    const updatedHashrates = algoNames.reduce((acc, algo) => {
      const algoBlocks = hourBlocks.filter((block) => block.algo === algo);
      const blocksPerHour = algoBlocks.length;
      const avgDifficulty =
        algoBlocks.reduce((sum, block) => sum + block.difficulty, 0) / blocksPerHour;

      const hashrate = (blocksPerHour / 48) * avgDifficulty * Math.pow(2, 32) / 900;

      return { ...acc, [algo]: hashrate };
    }, {});

    setHashrates(updatedHashrates);
    setIsFirstHourComplete(hourBlocks.length === 240);

    const total = Object.values(updatedHashrates).reduce((sum, rate) => sum + rate, 0);
    setTotalHashrate(total);
  };

  const formatHashrate = (hashrate) => {
    const units = ['H/s', 'KH/s', 'MH/s', 'GH/s', 'TH/s', 'PH/s', 'EH/s'];
    let index = 0;
    while (hashrate >= 1000 && index < units.length - 1) {
      hashrate /= 1000;
      index++;
    }
    return `${hashrate.toFixed(2)} ${units[index]}`;
  };

  return (
    <div>
      <Typography variant="h4" component="h1" align="center" gutterBottom>
        DigiByte Hashrate
      </Typography>
      <Typography variant="body1" align="center" paragraph>
        The hashrate for each DigiByte algorithm is calculated based on the blocks solved over the last hour.
        With a 15-second block time, the expected number of blocks per hour for each algorithm is 48.
        The formula used to calculate the hashrate is:
      </Typography>
      <Typography variant="body1" align="center" paragraph>
        Hashrate = (blocks solved over last hour / 48) * difficulty * 2^32 / 900
      </Typography>
      {!isFirstHourComplete && (
        <Typography variant="body1" align="center" color="error" paragraph>
          Waiting for the first hour of blocks to be available...
        </Typography>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
        {algoNames.map((algo) => (
          <div key={algo} style={{ margin: '1rem', textAlign: 'center' }}>
            <Typography variant="h6">{algo}</Typography>
            <Typography variant="body1">{formatHashrate(hashrates[algo])}</Typography>
          </div>
        ))}
      </div>
      <Typography variant="h5" align="center" gutterBottom>
        Total DGB Blockchain Hashrate
      </Typography>
      <Typography variant="body1" align="center">
        {formatHashrate(totalHashrate)}
      </Typography>
    </div>
  );
};

export default HashratePage;