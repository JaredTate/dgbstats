import React from 'react';
import { Outlet } from 'react-router-dom';
import { NetworkProvider } from '../context/NetworkContext';
import Header from './Header';
import Footer from './Footer';
import ForkAlertBanner from './ForkAlertBanner';
import LiveDataNotice from './LiveDataNotice';
import CanonicalRedirect from './CanonicalRedirect';
import usePageSeo from '../seo/usePageSeo';
import styles from '../App.module.css';

const MainnetLayout = () => {
  usePageSeo();
  return (
    <NetworkProvider network="mainnet">
      <div className={styles.app}>
        <CanonicalRedirect />
        <Header />
        <ForkAlertBanner />
        <main className={styles.contentContainer}>
          <Outlet />
        </main>
        <Footer />
        <LiveDataNotice />
      </div>
    </NetworkProvider>
  );
};

export default MainnetLayout;
