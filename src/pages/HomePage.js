import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Grid, Paper } from '@mui/material';
import styles from '../App.module.css';
import config from '../config';

const HomePage = ({ numberWithCommas, formatNumber }) => {
  const [blockchainInfo, setBlockchainInfo] = useState(null);
  const [chainTxStats, setChainTxStats] = useState(null);
  const [txOutsetInfo, setTxOutsetInfo] = useState(null);
  const [blockReward, setBlockReward] = useState(null);
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
        setBlockchainInfo(message.data.blockchainInfo);
        setChainTxStats(message.data.chainTxStats);
        setTxOutsetInfo(message.data.txOutsetInfo);
        setBlockReward(message.data.blockReward);
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

  return (
    <main>
      <Container maxWidth="lg" className={styles.container}>
        <Typography variant="h4" component="h4" align="center" fontWeight="bold" gutterBottom sx={{ paddingTop: '10px' }}>
          DigiByte Blockchain Statistics
        </Typography>
        <Typography variant="body1" component="p" align="center" gutterBottom>
          This is a free & open source website to find real time data & information about DigiByte blockchain pulled directly from the chain via digibyted.

          <br />  <br />The DigiByte blockchain was launched on January 10th, 2014. There is <strong>NO </strong> company, centralized group, mass premine, entity or individual who controls DGB. 
          DGB is truly decentralized and is the best combination of speed, security & decentralization you will see in any blockchain in the world today.

          <br /> <br />DGB is a layer 1 UTXO based blockchain with 15 second blocks and 5 independent mining algorithms. DGB has pioneered several innovations since 2014.
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6} lg={4}>
            <Paper className={styles.paper}>
              <Typography variant="h1" className={styles.centerText}>
                Total Blocks
              </Typography>
              {blockchainInfo && (
                <Typography variant="h2" className={`${styles.centerText} ${styles.boldText}`}>
                  {formatNumber(blockchainInfo.blocks)}
                </Typography>
              )}
              <Typography variant="body1" className={styles.paragraph}>
                Total blocks in the DigiByte blockchain since the chain was started on Jan 10th, 2014.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <Paper className={styles.paper}>
              <Typography variant="h1" className={styles.centerText}>
                Total Transactions
              </Typography>
              {chainTxStats && (
                <Typography variant="h2" className={`${styles.centerText} ${styles.boldText}`}>
                  {formatNumber(chainTxStats.txcount)}
                </Typography>
              )}
              <Typography variant="body1" className={styles.paragraph}>
                Total Transactions sent on the DigiByte blockchain since launch on Jan 10th, 2014.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <Paper className={styles.paper}>
              <Typography variant="h1" className={styles.centerText}>
                Total Size
              </Typography>
              {blockchainInfo && (
                <Typography variant="h2" className={`${styles.centerText} ${styles.boldText}`}>
                  {(blockchainInfo.size_on_disk / (1024 * 1024 * 1024)).toFixed(2)} GB
                </Typography>
              )}
              <Typography variant="body1" className={styles.paragraph}>
                Total size in GB needed to store the entire DGB blockchain going back to Jan 10th, 2014.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <Paper className={styles.paper}>
              <Typography variant="h1" className={styles.centerText}>
                Current Circulating Supply
              </Typography>
              {txOutsetInfoLoading ? (
                <Typography variant="h2" className={`${styles.centerText} ${styles.boldText}`}>
                  Loading...
                </Typography>
              ) : (
                txOutsetInfo && (
                  <Typography variant="h2" className={`${styles.centerText} ${styles.boldText}`}>
                    {txOutsetInfo && numberWithCommas(txOutsetInfo.total_amount.toFixed(2))} DGB
                  </Typography>
                )
              )}
              <Typography variant="body1" className={styles.paragraph}>
                Current circulating supply calculated from all UTXO's as of the latest block.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <Paper className={styles.paper}>
              <Typography variant="h1" className={styles.centerText}>
                Remaining Supply To Be Mined
              </Typography>
              {txOutsetInfoLoading ? (
                <Typography variant="h2" className={`${styles.centerText} ${styles.boldText}`}>
                  Loading...
                </Typography>
              ) : (
                txOutsetInfo && (
                  <Typography variant="h2" className={`${styles.centerText} ${styles.boldText}`}>
                    {txOutsetInfo && numberWithCommas((21000000000 - txOutsetInfo.total_amount).toFixed(2))} DGB
                  </Typography>
                )
              )}
              <Typography variant="body1" className={styles.paragraph}>
                Remaining DGB to be mined until the maximum supply of 21 billion DGB is reached.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <Paper className={styles.paper}>
              <Typography variant="h1" className={styles.centerText}>
                Last Block Reward
              </Typography>
              {blockReward === null || blockReward === undefined ? (
                <Typography variant="h2" className={`${styles.centerText} ${styles.boldText}`}>
                  Loading...
                </Typography>
              ) : (
                <Typography variant="h2" className={`${styles.centerText} ${styles.boldText}`}>
                  {blockReward.toFixed(8)} DGB
                </Typography>
              )}
              <Typography variant="body1" className={styles.paragraph}>
                The DigiByte mining reward amount for the most recent block on the blockchain.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <Paper className={styles.paper}>
              <Typography variant="h1" className={styles.centerText}>
                Algo Difficulties
              </Typography>
              {blockchainInfo && blockchainInfo.difficulties && (
                <>
                  <Box component="p" className={`${styles.boxText} ${styles.boldText}`}>
                    SHA256d Diff: {parseInt(blockchainInfo.difficulties.sha256d).toLocaleString()}
                  </Box>
                  <Box component="p" className={`${styles.boxText} ${styles.boldText}`}>
                    Scrypt Diff: {parseInt(blockchainInfo.difficulties.scrypt).toLocaleString()}
                  </Box>
                  <Box component="p" className={`${styles.boxText} ${styles.boldText}`}>
                    Skein Diff: {parseInt(blockchainInfo.difficulties.skein).toLocaleString()}
                  </Box>
                  <Box component="p" className={`${styles.boxText} ${styles.boldText}`}>
                    Qubit Diff: {parseInt(blockchainInfo.difficulties.qubit).toLocaleString()}
                  </Box>
                  <Box component="p" className={`${styles.boxText} ${styles.boldText}`}>
                    Odo Difficulty: {parseInt(blockchainInfo.difficulties.odo).toLocaleString()}
                  </Box>
                  <Typography variant="body1" className={styles.paragraph}>
                    The current mining difficulties for each of the 5 DigiByte mining algorithms.
                  </Typography>
                </>
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <Paper className={styles.paper}>
              <Typography variant="h1" className={styles.centerText}>
                Latest Version
              </Typography>
              <Typography variant="h2" className={`${styles.centerText} ${styles.boldText}`}>
                v8.22.0-RC4
              </Typography>
              <Typography variant="body1" className={styles.paragraph}>
                Latest DGB core version.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <Paper className={styles.paper}>
              <Typography variant="h1" className={styles.centerText}>
                Active Softforks
              </Typography>
              {blockchainInfo && (
                <Box>
                  {Object.entries(blockchainInfo.softforks).map(([key, value]) => (
                    <Typography key={key} variant="h2" className={`${styles.centerText} ${styles.boldText}`}>
                      {key}: {value.type}
                    </Typography>
                  ))}
                </Box>
              )}
              <Typography variant="body1" className={styles.paragraph}>
                Active on chain softforks.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </main>
  );
};

export default HomePage;