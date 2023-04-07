import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Link } from 'react-router-dom';
import { Container, Typography, Box, Grid, Paper } from '@mui/material';
import styles from './App.module.css';

const formatNumber = (num) => {
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
};

const App = () => {
  const [blockchainInfo, setBlockchainInfo] = useState(null);
  const [chainTxStats, setChainTxStats] = useState(null);
  const [txOutsetInfo, setTxOutsetInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const [blockchainInfoLoading, setBlockchainInfoLoading] = useState(true);
  const [chainTxStatsLoading, setChainTxStatsLoading] = useState(true);
  const [txOutsetInfoLoading, setTxOutsetInfoLoading] = useState(true);

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

      console.log("blockchainInfo", data1);
      console.log("chainTxStats", data2);
      console.log("txOutsetInfo", data3);
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
    <Router>
      <div className={styles.app}>
        <header className={styles.header}>
          <Typography variant="h4" component="div" className={styles.headerTitle}>
            DigiByte Stats
          </Typography>
          <nav className={styles.nav}>
            <Link to="/" className={styles.headerLink}>
              Home
            </Link>
            <a href="https://digibyte.org" target="_blank" rel="noopener noreferrer" className={styles.headerLink}>
              DigiByte.org
            </a>
          </nav>
        </header>

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
                        {numberWithCommas(txOutsetInfo.total_amount.toFixed(2))} DGB
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
                        {numberWithCommas((21000000000 - txOutsetInfo.total_amount).toFixed(2))} DGB
                      </Typography>
                    )
                  )}
                  <Typography variant="body1" className={styles.paragraph}>
                    Total amount of DGB yet to be mined before DigiByte hits its 21 billion max supply.
                  </Typography>
                </Paper>
              </Grid>



              <Grid item xs={12} md={6} lg={4}>
                <Paper className={styles.paper}>
                  <Typography variant="h1" className={styles.centerText}>
                    Current Block Reward
                  </Typography>
                  <Typography variant="h2" className={`${styles.centerText} ${styles.boldText}`}>
                    v8.22.0-rc1
                  </Typography>
                  <Typography variant="body1" className={styles.paragraph}>
                    Total amount of DGB created with each new block right now.
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


        <footer className={styles.footer}>
          <div className={styles.footerLinks}>
            <a href="https://github.com/DigiByte-Core/digibyte" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>
              DigiByte Github
            </a>
            <a href="https://digiexplorer.info/" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>
              DigiExplorer
            </a>
            <a href="https://digibyte.org" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>
              DigiByte.org
            </a>
          </div>
          <hr className={styles.divider} />
          <Typography variant="body1" component="p" className={styles.footerText}>
            © 2023 Jared Tate
          </Typography>
        </footer>
      </div>
    </Router>
  );
};

export default App;