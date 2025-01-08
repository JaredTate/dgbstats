import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { formatNumber, numberWithCommas } from './utils';
import styles from './App.module.css';
import HomePage from './pages/HomePage';
import DifficultiesPage from './pages/DifficultiesPage';
import BlocksPage from './pages/BlocksPage';
import AlgosPage from './pages/AlgosPage';
import PoolsPage from './pages/PoolsPage';
import SupplyPage from './pages/SupplyPage';
import DownloadsPage from './pages/DownloadsPage';
import NodesPage from './pages/NodesPage';
import Header from './components/Header';
import Footer from './components/Footer';
import config from './config';
import HashratePage from './pages/HashratePage';
import TaprootPage from './pages/TaprootPage';

const App = () => {
  const [blockchainInfo, setBlockchainInfo] = useState(null);
  const [chainTxStats, setChainTxStats] = useState(null);
  const [txOutsetInfo, setTxOutsetInfo] = useState(null);
  const [blockReward, setBlockReward] = useState(null);
  const worldPopulation = 8100000000; // Assuming a world population of 8.1 billion

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response1 = await fetch(`${config.apiBaseUrl}/api/getblockchaininfo`);
        const data1 = await response1.json();
        setBlockchainInfo(data1);

        const response2 = await fetch(`${config.apiBaseUrl}/api/getchaintxstats`);
        const data2 = await response2.json();
        setChainTxStats(data2);

        const response3 = await fetch(`${config.apiBaseUrl}/api/gettxoutsetinfo`);
        const data3 = await response3.json();
        setTxOutsetInfo(data3);

        const response4 = await fetch(`${config.apiBaseUrl}/api/getblockreward`);
        const data4 = await response4.json();
        setBlockReward(parseFloat(data4.blockReward.blockreward));
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

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
                />
              }
            />
            <Route path="/blocks" element={<BlocksPage />} />
            <Route path="/downloads" element={<DownloadsPage />} />
            <Route path="/nodes" element={<NodesPage />} />
            <Route path="/pools" element={<PoolsPage />} />
            <Route
              path="/supply"
              element={<SupplyPage txOutsetInfo={txOutsetInfo} worldPopulation={worldPopulation} />}
            />
            <Route path="/algos" element={<AlgosPage />} />
            <Route
              path="/difficulties"
              element={<DifficultiesPage difficultiesData={blockchainInfo?.difficulties} />}
            />
            <Route
              path="/hashrate"
              element={<HashratePage difficultiesData={blockchainInfo?.difficulties} />}
            />
            <Route path="/taproot" element={<TaprootPage />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;