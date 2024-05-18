import React, { useState, useEffect, useRef } from 'react';
import { Container, Typography, Grid, Paper, Box, Divider } from '@mui/material';
import styles from '../App.module.css';
import config from '../config';

const algoNames = ['SHA256D', 'Scrypt', 'Skein', 'Qubit', 'Odo'];

const HashratePage = () => {
  const [hashrates, setHashrates] = useState(
    algoNames.reduce((acc, algo) => ({ ...acc, [algo]: 0 }), {})
  );
  const [averageBlockTimes, setAverageBlockTimes] = useState(
    algoNames.reduce((acc, algo) => ({ ...acc, [algo]: 0 }), {})
  );
  const [totalBlocksByAlgo, setTotalBlocksByAlgo] = useState(
    algoNames.reduce((acc, algo) => ({ ...acc, [algo]: 0 }), {})
  );
  const [networkAverageBlockTime, setNetworkAverageBlockTime] = useState(0);
  const [totalBlocksInLastHour, setTotalBlocksInLastHour] = useState(0);
  const [totalHashrate, setTotalHashrate] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
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
        calculateHashratesAndBlockTimes();
        setIsLoading(false);
      } else if (message.type === 'newBlock') {
        console.log('Received new block:', message.data);
        blocksRef.current.unshift(message.data);
        blocksRef.current = blocksRef.current.slice(0, 240);
        calculateHashratesAndBlockTimes();
      }
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      socket.close();
    };
  }, []);

  const calculateHashratesAndBlockTimes = () => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const hourBlocks = blocksRef.current.filter(
      (block) => block.timestamp * 1000 >= oneHourAgo
    );

    const updatedHashrates = algoNames.reduce((acc, algo) => {
      const algoBlocks = hourBlocks.filter((block) => block.algo === algo);
      const blocksPerHour = algoBlocks.length;
      const avgDifficulty =
        algoBlocks.reduce((sum, block) => sum + block.difficulty, 0) / blocksPerHour;

      const hashrate = (blocksPerHour / 48) * avgDifficulty * Math.pow(2, 32) / 75;

      return { ...acc, [algo]: hashrate };
    }, {});

    setHashrates(updatedHashrates);

    const total = Object.values(updatedHashrates).reduce((sum, rate) => sum + rate, 0);
    setTotalHashrate(total);

    const totalBlocksInHour = hourBlocks.length;
    setTotalBlocksInLastHour(totalBlocksInHour);

    const networkAverageBlockTime = 60 * 60 / totalBlocksInHour;
    setNetworkAverageBlockTime(networkAverageBlockTime);

    const updatedAverageBlockTimes = algoNames.reduce((acc, algo) => {
      const algoBlocks = hourBlocks.filter((block) => block.algo === algo);
      const algoBlocksInHour = algoBlocks.length;
      const algoAverageBlockTime = 60 * 60 / algoBlocksInHour;

      return { ...acc, [algo]: algoAverageBlockTime };
    }, {});

    setAverageBlockTimes(updatedAverageBlockTimes);

    const updatedTotalBlocksByAlgo = algoNames.reduce((acc, algo) => {
      const algoBlocks = hourBlocks.filter((block) => block.algo === algo);
      return { ...acc, [algo]: algoBlocks.length };
    }, {});

    setTotalBlocksByAlgo(updatedTotalBlocksByAlgo);
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

  const formatBlockTime = (blockTime) => {
    if (blockTime === 0) return 'N/A';
    const minutes = Math.floor(blockTime / 60);
    const seconds = blockTime % 60;
    return `${minutes} min ${seconds.toFixed(0)} s`;
  };

  const formatTotalBlocks = (totalBlocks) => {
    return totalBlocks.toLocaleString();
  };

  return (
    <Container maxWidth="lg" className={styles.container}>
      <Typography variant="h4" component="h4" align="center" fontWeight="bold" gutterBottom sx={{ paddingTop: '10px' }}>
        DigiByte Hashrate By Algo Last Hour
      </Typography>
      <Typography variant="body1" component="p" align="center" gutterBottom>
        This page displays the real-time hashrate, average block time & total blocks found for each DGB mining algorithm based on the blocks mined over the last hour.
        <br />
        Hashrate represents the total computational power being used to mine, process & secure transactions on the DigiByte blockchain.
      </Typography>
      {isLoading ? (
        <Typography variant="body1" align="center" color="textSecondary" paragraph>
          Loading hashrate data...
        </Typography>
      ) : (
        <>
          <Grid container spacing={2}>
            {algoNames.map((algo) => (
              <Grid item xs={12} md={6} lg={4} key={algo}>
                <Paper className={styles.paper}>
                  <Typography variant="h1" className={styles.centerText}>
                    {algo} Hashrate
                  </Typography>
                  <Typography variant="h2" className={`${styles.centerText} ${styles.boldText}`}>
                    {formatHashrate(hashrates[algo])}
                  </Typography>
                  <Typography variant="body1" className={styles.paragraph}>
                    The current hashrate for the {algo} algorithm.
                  </Typography>
                  <Divider style={{ margin: '16px 0' }} />
                  <Typography variant="h1" className={styles.centerText}>
                    Total {algo} Blocks
                  </Typography>
                  <Typography variant="h2" className={`${styles.centerText} ${styles.boldText}`}>
                    {formatTotalBlocks(totalBlocksByAlgo[algo])}
                  </Typography>
                  <Typography variant="body1" className={styles.paragraph}>
                    The total {algo} blocks found in the last 60 minutes.
                  </Typography>
                  <Divider style={{ margin: '16px 0' }} />
                  <Typography variant="h1" className={styles.centerText}>
                    Avg. {algo} Block Time
                  </Typography>
                  <Typography variant="h2" className={`${styles.centerText} ${styles.boldText}`}>
                    {formatBlockTime(averageBlockTimes[algo])}
                  </Typography>
                  <Typography variant="body1" className={styles.paragraph}>
                    The average block time for {algo} over the last 60 minutes.
                  </Typography>
                </Paper>
              </Grid>
            ))}
            <Grid item xs={12} md={6} lg={4}>
              <Paper className={styles.paper} style={{ backgroundColor: 'black' }}>
                <Typography variant="h1" className={styles.centerText} style={{ color: 'white' }}>
                  Total Hashrate
                </Typography>
                <Typography variant="h2" className={`${styles.centerText} ${styles.boldText}`} style={{ color: 'white' }}>
                  {formatHashrate(totalHashrate)}
                </Typography>
                <Typography variant="body1" className={styles.paragraph} style={{ color: 'white' }}>
                  The combined hashrate of all 5 DGB mining algorithms.
                </Typography>
                <Divider style={{ margin: '16px 0', backgroundColor: 'white' }} />
                <Typography variant="h1" className={styles.centerText} style={{ color: 'white' }}>
                  Avg. Network Block Time
                </Typography>
                <Typography variant="h2" className={`${styles.centerText} ${styles.boldText}`} style={{ color: 'white' }}>
                  {formatBlockTime(networkAverageBlockTime)}
                </Typography>
                <Typography variant="body1" className={styles.paragraph} style={{ color: 'white' }}>
                  Average block time for the entire chain over the last 60 minutes.
                </Typography>
                <Divider style={{ margin: '16px 0', backgroundColor: 'white' }} />
                <Typography variant="h1" className={styles.centerText} style={{ color: 'white' }}>
                  Total Blocks in Last Hour
                </Typography>
                <Typography variant="h2" className={`${styles.centerText} ${styles.boldText}`} style={{ color: 'white' }}>
                  {formatTotalBlocks(totalBlocksInLastHour)}
                </Typography>
                <Typography variant="body1" className={styles.paragraph} style={{ color: 'white' }}>
                  The total number of blocks found in the last 60 minutes.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
          <Box mt={4}>
            <Typography variant="h5" align="center" gutterBottom>
              <strong>How Hashrates are Calculated</strong>
            </Typography>
            <Typography variant="body1" align="center" paragraph>
              The hashrate for each DigiByte algorithm is calculated using the following formula:
            </Typography>
            <Typography variant="h5" align="center" paragraph>
              <strong>Hashrate (per algo) = [(blocks solved over last hour / 48) * difficulty * 2^32] / 75</strong>
            </Typography>
            <Typography variant="h6" align="center" paragraph>
              Here's what each part of the formula represents:
            </Typography>
            <Typography variant="body1" align="left" paragraph>
              <strong>Blocks solved over last hour:</strong> The number of blocks solved by the algorithm in the last 60 minutes.
            </Typography>
            <Typography variant="body1" align="left" paragraph>
              <strong>48:</strong> There are 48 slots for blocks to be solved in one hour, given the target block time of 75 seconds per block.
            </Typography>
            <Typography variant="body1" align="left" paragraph>
              <strong>Difficulty * 2^32:</strong> The average difficulty of the blocks mined by the algorithm, multiplied by 2^32. This represents the average amount of work (hashes) needed to solve a block.
            </Typography>
            <Typography variant="body1" align="left" paragraph>
              <strong>75:</strong> Since hashpower is measured in hashes per second, and there are 75 seconds in a 1 minute and 15-second block (15 seconds * 5 algorithms = 75 seconds), we divide by 75 to get the hashrate in H/s.
            </Typography>
            <Typography variant="body1" align="center" paragraph>
              The calculated hashrates for each algorithm are then summed up to obtain the total network hashrate.
            </Typography>
          </Box>
        </>
      )}
      <Typography variant="h5" align="center" gutterBottom>
        <strong>Hashrate units:</strong>
      </Typography>
      <Typography variant="body1" align="center" paragraph>
        H/s - Hashes per second
        <br />
        KH/s - Kilohashes per second (Thousands of Hashes)
        <br />
        MH/s - Megahashes per second (Millions of Hashes)
        <br />
        GH/s - Gigahashes per second (Billions of Hashes)
        <br />
        TH/s - Terahashes per second (Trillions of Hashes)
        <br />
        PH/s - Petahashes per second (Quadrillions of Hashes)
        <br />
        EH/s - Exahashes per second (Quintillions of Hashes)
      </Typography>
    </Container>
  );
};

export default HashratePage;