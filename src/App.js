import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import DifficultiesPage from './DifficultiesPage';
import { Container, Typography, Box, Grid, Paper } from '@mui/material';
import styles from './App.module.css';

const formatNumber = (num) => {
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
};

const App = () => {
  const [blockchainInfo, setBlockchainInfo] = useState(null);
  const [chainTxStats, setChainTxStats] = useState(null);
  const [txOutsetInfo, setTxOutsetInfo] = useState(null);
  const [blockReward, setBlockReward] = useState(null);
  const [loading, setLoading] = useState(true);
  const [blockchainInfoLoading, setBlockchainInfoLoading] = useState(true);
  const [chainTxStatsLoading, setChainTxStatsLoading] = useState(true);
  const [txOutsetInfoLoading, setTxOutsetInfoLoading] = useState(true);
  const [lastBlockReward, setLastBlockReward] = useState(null);
  const fetchData = async () => {
    try {
      setBlockchainInfoLoading(true);
      const response1 = await fetch('http://localhost:5001/api/getblockchaininfo');
      const data1 = await response1.json();
      setBlockchainInfo(data1);
      setBlockchainInfoLoading(false);

      setChainTxStatsLoading(true);
      const response2 = await fetch('http://localhost:5001/api/getchaintxstats');
      const data2 = await response2.json();
      setChainTxStats(data2);
      setChainTxStatsLoading(false);

      setTxOutsetInfoLoading(true);
      const response3 = await fetch('http://localhost:5001/api/gettxoutsetinfo');
      const data3 = await response3.json();
      setTxOutsetInfo(data3);
      setTxOutsetInfoLoading(false);

      const response4 = await fetch('http://localhost:5001/api/getblockreward');
      const data4 = await response4.json();
      setBlockReward(parseFloat(data4.blockReward.blockreward));
      
      console.log("blockchainInfo", data1);
      console.log("chainTxStats", data2);
      console.log("txOutsetInfo", data3);
      console.log("data4.blockReward:", data4.blockReward);

    } catch (error) {
      console.error('Error fetching data:', error);
      setBlockchainInfoLoading(false);
      setChainTxStatsLoading(false);
      setTxOutsetInfoLoading(false);
    }
  };


  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <BrowserRouter>
      <div className={styles.app}>
        <header className={styles.header}>
          <Typography variant="h4" component="div" className={styles.headerTitle}>
            DigiByte Stats
          </Typography>
          <nav className={styles.nav}>
            <Link to="/" className={styles.headerLink}>
              Home
            </Link>
            <Link to="/difficulties" className={styles.headerLink}>
              Difficulties
            </Link>
            <a href="https://digibyte.org" target="_blank" rel="noopener noreferrer" className={styles.headerLink}>
              DigiByte.org
            </a>
          </nav>
        </header>
        <Routes>
          <Route
            index
            path="/"
            element={
              <>
                <main>
                  <Container maxWidth="lg" className={styles.container}>
                    <Typography variant="h2" component="h2" className={styles.title}>
                      DigiByte Blockchain Statistics
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
                            The mining reward amount for the most recent block.
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
                            Current Version
                          </Typography>
                          <Typography variant="h2" className={`${styles.centerText} ${styles.boldText}`}>
                            v8.22.0-rc1
                          </Typography>
                          <Typography variant="body1" className={styles.paragraph}>
                            Current stable DGB core version.
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
              </>
            }
          />
          <Route
            path="/difficulties"
            element={<DifficultiesPage difficultiesData={blockchainInfo?.difficulties} />}
          />
        </Routes>
        <footer className={styles.footer}>
          <Container maxWidth="lg">
            <Typography variant="body1" className={styles.footerText}>
              DigiByte Blockchain Statistics &copy; 2023 Jared Tate. All Rights Reserved.
            </Typography>
          </Container>
        </footer>
      </div>
    </BrowserRouter>
  );
};

export default App;
