import React from 'react';
import { NavLink } from 'react-router-dom';
import { Typography } from '@mui/material';
import styles from '../App.module.css';

const Header = () => {
  return (
    <header className={styles.header}>
      <Typography variant="h4" component="div" className={styles.headerTitle}>
        DigiByte Stats
      </Typography>
      <nav className={styles.nav}>
        <NavLink exact to="/" activeClassName={styles.activeLink} className={styles.headerLink}>
          Home
        </NavLink>
        <NavLink to="/blocks" activeClassName={styles.activeLink} className={styles.headerLink}>
          Blocks
        </NavLink>
        <NavLink to="/algos" activeClassName={styles.activeLink} className={styles.headerLink}>
          Algos
        </NavLink>
        <NavLink to="/difficulties" activeClassName={styles.activeLink} className={styles.headerLink}>
          Difficulties
        </NavLink>
        <NavLink to="/downloads" activeClassName={styles.activeLink} className={styles.headerLink}>
          Downloads
        </NavLink>
        <NavLink to="/nodes" activeClassName={styles.activeLink} className={styles.headerLink}>
          Nodes
        </NavLink>
        <a href="https://digihash.digibyte.io/" target="_blank" rel="noopener noreferrer" className={styles.headerLink}>
          DigiHash
        </a>
        <a href="https://digibyte.org" target="_blank" rel="noopener noreferrer" className={styles.headerLink}>
          DigiByte.org
        </a>
      </nav>
    </header>
  );
};

export default Header;
