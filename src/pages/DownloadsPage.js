import React, { useState, useEffect } from 'react';
import { Typography, Box, Container } from '@mui/material';
import styles from '../App.module.css';

const DownloadsPage = () => {
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://api.github.com/repos/digibyte-core/digibyte/releases');
        const data = await response.json();
        setReleases(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const numberWithCommas = (number) => {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  const totalDownloads = releases.reduce((acc, release) => {
    return acc + release.assets.reduce((a, asset) => a + asset.download_count, 0);
  }, 0);

  return (
    <Container maxWidth="lg" className={styles.container}>
      <Typography variant="h4" component="h4" align="center" fontWeight="bold" gutterBottom sx={{ paddingTop: '10px' }}>
        DigiByte Core Wallet Downloads
      </Typography>
      <Typography variant="body1" component="p" align="center" className={styles.description}>
        One useful metric for estimating total blockchain network size is to look at the total amount of core wallets downloaded from GitHub.
      </Typography>
      <Typography variant="h5" className={styles.totalDownloads} style={{ textAlign: 'center' }}>
        Total Github Release Downloads: <strong>{numberWithCommas(totalDownloads)}</strong>
      </Typography>
      <Box className={styles.nodesList}>
        {loading ? (
          <Typography variant="h5" className={styles.loading}>
            Loading...
          </Typography>
        ) : (
          releases.map((release) => {
            const releaseDownloads = release.assets.reduce((a, asset) => a + asset.download_count, 0);
            return (
              <Box key={release.id} className={styles.release}>
                <Typography variant="h5" className={styles.releaseVersion} style={{ backgroundColor: '#0066cc', padding: '10px', textAlign: 'center', color: 'white', fontSize: '24px' }}>
  {release.name} - <strong>{numberWithCommas(releaseDownloads)}</strong> downloads
</Typography>

                {release.assets.map((asset, index) => (
                  <Typography key={asset.id} variant="body1" className={styles.assetInfo} style={{ textAlign: 'center', paddingBottom: index === release.assets.length - 1 ? '20px' : '0' }}>
                    {asset.name}: <strong>{numberWithCommas(asset.download_count)}</strong> downloads
                  </Typography>
                ))}
              </Box>
            );
          })
        )}
      </Box>
    </Container>
  );
};

export default DownloadsPage;
