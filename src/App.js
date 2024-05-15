import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Container, Typography, Box, Grid, Paper } from '@mui/material';
import { formatNumber, numberWithCommas } from './utils';
import styles from './App.module.css';
import HomePage from './pages/HomePage';
import DifficultiesPage from './pages/DifficultiesPage';
import BlocksPage from './pages/BlocksPage';
import AlgosPage from './pages/AlgosPage';
import DownloadsPage from './pages/DownloadsPage';
import NodesPage from './pages/NodesPage';
import Header from './components/Header';
import Footer from './components/Footer';

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
      const response1 = await fetch('http://digibyte.io/api/getblockchaininfo');
      const data1 = await response1.json();
      setBlockchainInfo(data1);
      setBlockchainInfoLoading(false);

      setChainTxStatsLoading(true);
      const response2 = await fetch('http://digibyte.io/api/getchaintxstats');
      const data2 = await response2.json();
      setChainTxStats(data2);
      setChainTxStatsLoading(false);

      setTxOutsetInfoLoading(true);
      const response3 = await fetch('http://digibyte.io/api/gettxoutsetinfo');
      const data3 = await response3.json();
      setTxOutsetInfo(data3);
      setTxOutsetInfoLoading(false);

      const response4 = await fetch('http://digibyte.io/api/getblockreward');
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
        <Header />
        <div className={styles.contentContainer}>
          <Routes>
            <Route
              index
              path="/"
              element={
                <HomePage
                  blockchainInfo={blockchainInfo}
                  chainTxStats={chainTxStats}
                  txOutsetInfo={txOutsetInfo}
                  blockReward={blockReward}
                  numberWithCommas={numberWithCommas}
                  formatNumber={formatNumber}
                  txOutsetInfoLoading={txOutsetInfoLoading}
                />
              }
            />
            <Route path="/blocks" element={<BlocksPage />} />
            <Route path="/downloads" element={<DownloadsPage />} />
            <Route path="/nodes" element={<NodesPage />} />
            <Route path="/algos" element={<AlgosPage />} />
            <Route
              path="/difficulties"
              element={<DifficultiesPage difficultiesData={blockchainInfo?.difficulties} />}
            />
          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;