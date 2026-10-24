import React from 'react';
import { Outlet } from 'react-router-dom';
import { NetworkProvider } from '../context/NetworkContext';
import Header from './Header';
import Footer from './Footer';
import ForkAlertBanner from './ForkAlertBanner';
import usePageSeo from '../seo/usePageSeo';
import styles from '../App.module.css';

const MainnetLayout = () => {
  usePageSeo();
  return (
    <NetworkProvider network="mainnet">
      <div className={styles.app}>
        <Header />
        <ForkAlertBanner />
        <div className={styles.contentContainer}>
          <Outlet />
        </div>
        <Footer />
      </div>
    </NetworkProvider>
  );
};

export default MainnetLayout;
