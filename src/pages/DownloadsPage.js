import React, { useState, useEffect } from 'react';
import { 
  Typography, Box, Container, Button, Card, CardContent, 
  Divider, useTheme, useMediaQuery, Grid, Paper, Chip,
  CircularProgress, Avatar
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/CloudDownload';
import GitHubIcon from '@mui/icons-material/GitHub';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import ComputerIcon from '@mui/icons-material/Computer';
import CheckIcon from '@mui/icons-material/Check';
import UpdateIcon from '@mui/icons-material/Update';

/**
 * DownloadsPage Component - DigiByte Core Wallet Download Statistics
 * 
 * This page provides comprehensive information about DigiByte Core wallet downloads including:
 * - Real-time download statistics from GitHub releases API
 * - Platform-specific download counts and links
 * - Release history with version information
 * - Educational content about different wallet options
 * 
 * Data is fetched from the official DigiByte Core GitHub repository releases API
 * to provide accurate download counts and release information.
 */
const DownloadsPage = () => {
  // State management for GitHub releases data
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Responsive design hooks
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  /**
   * Fetch GitHub releases data from DigiByte Core repository
   * Retrieves release information including download counts and assets
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch releases from official DigiByte Core GitHub repository
        const response = await fetch('https://api.github.com/repos/digibyte-core/digibyte/releases');
        const data = await response.json();
        setReleases(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching GitHub releases data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /**
   * Format numbers with commas for better readability
   * 
   * @param {number} number - Number to format
   * @returns {string} - Formatted number with commas
   */
  const numberWithCommas = (number) => {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  /**
   * Calculate total downloads across all releases and assets
   * Aggregates download counts from all GitHub release assets
   */
  const totalDownloads = releases.reduce((acc, release) => {
    return acc + release.assets.reduce((a, asset) => a + asset.download_count, 0);
  }, 0);

  /**
   * Determine platform based on asset filename
   * Uses filename patterns to categorize downloads by operating system
   * 
   * @param {string} assetName - Asset filename from GitHub release
   * @returns {string} - Platform category
   */
  const getPlatform = (assetName) => {
    const lowerName = assetName.toLowerCase();

    // Platform detection based on common filename patterns
    // Check for macOS/Darwin first (before ARM check since macOS can have ARM)
    if (lowerName.includes('darwin') || lowerName.includes('apple') || lowerName.includes('osx') || lowerName.includes('mac') || lowerName.includes('.dmg')) {
      return 'macOS';
    } else if (lowerName.includes('win') || lowerName.includes('windows') || lowerName.includes('.exe')) {
      return 'Windows';
    } else if (lowerName.includes('linux') || lowerName.includes('.deb')) {
      return 'Linux';
    } else if (lowerName.includes('arm') || lowerName.includes('raspberry')) {
      return 'ARM / Raspberry Pi';
    } else if (lowerName.includes('android')) {
      return 'Android';
    } else {
      return 'Other';
    }
  };

  /**
   * Get appropriate icon for each platform
   * Returns Material-UI icon component based on platform type
   * 
   * @param {string} platform - Platform name
   * @returns {React.Element} - Material-UI icon component
   */
  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'Windows':
      case 'macOS':
      case 'Linux':
        return <ComputerIcon />;
      case 'ARM / Raspberry Pi':
        return <GitHubIcon />;
      case 'Android':
        return <PhoneAndroidIcon />;
      default:
        return <DownloadIcon />;
    }
  };

  /**
   * Get brand color for each platform
   * Returns appropriate color scheme for platform identification
   * 
   * @param {string} platform - Platform name
   * @returns {string} - Hex color code
   */
  const getPlatformColor = (platform) => {
    switch (platform) {
      case 'Windows':
        return '#0078d7'; // Windows blue
      case 'macOS':
        return '#5f5f5f'; // Apple gray
      case 'Linux':
        return '#f57c00'; // Ubuntu orange
      case 'ARM / Raspberry Pi':
        return '#bc1142'; // Raspberry Pi red
      case 'Android':
        return '#3ddc84'; // Android green
      default:
        return '#0066cc'; // Default DigiByte blue
    }
  };

  /**
   * HeroSection - Page header with title and description
   */
  const HeroSection = () => (
    <Card
      elevation={2}
      sx={{
        backgroundColor: '#f2f4f8',
        borderRadius: '12px',
        mb: 4,
        overflow: 'hidden',
        backgroundImage: 'linear-gradient(135deg, #f8f9fa 0%, #e8eef7 100%)',
        border: '1px solid rgba(0, 35, 82, 0.1)'
      }}
    >
      <CardContent sx={{ py: 4, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
          <DownloadIcon sx={{ fontSize: '2.5rem', color: '#002352', mr: 2 }} />
          <Typography 
            variant="h2" 
            component="h1" 
            fontWeight="800" 
            sx={{ 
              color: '#002352',
              letterSpacing: '0.5px',
              fontSize: { xs: '1.8rem', sm: '2.3rem', md: '2.8rem' }
            }}
          >
            DigiByte Core Wallet Downloads
          </Typography>
        </Box>
        
        <Divider sx={{ maxWidth: '150px', mx: 'auto', mb: 3, borderColor: '#0066cc', borderWidth: 2 }} />
        
        <Typography 
          variant="subtitle1" 
          component="p" 
          sx={{ 
            maxWidth: '800px', 
            mx: 'auto', 
            mb: 3,
            color: '#555',
            fontSize: '1.1rem'
          }}
        >
          One way to estimate network size is total amount of DGB core wallets downloaded from GitHub. <br></br> 
          <br></br> A core wallet is an application that lets you securely store, send, & receive DigiByte's while also maintaining a full copy of the blockchain, helping to keep the network decentralized and secure.
        </Typography>
      </CardContent>
    </Card>
  );

  /**
   * DownloadButtonSection - Call-to-action for downloading latest release
   */
  const DownloadButtonSection = () => (
    <Card
      elevation={3}
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: '12px',
        mb: 4,
        textAlign: 'center',
        backgroundImage: 'linear-gradient(135deg, #e8eef7 0%, #f2f4f8 100%)',
      }}
    >
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, color: '#002352' }}>
        Get the Official DigiByte Core Wallet
      </Typography>
      
      <Button 
        variant="contained" 
        color="primary" 
        size="large"
        href="https://github.com/DigiByte-Core/digibyte/releases"
        target="_blank"
        rel="noopener noreferrer"
        startIcon={<GitHubIcon />}
        sx={{
          fontWeight: 'bold',
          px: 4,
          py: 1.5,
          borderRadius: 2,
          fontSize: '1.1rem',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          backgroundColor: '#002352',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 12px rgba(0,0,0,0.25)',
            backgroundColor: '#0066cc',
          },
          transition: 'all 0.2s ease-in-out'
        }}
      >
        Download Latest Release on GitHub
      </Button>
      
      {/* Total downloads counter */}
      <Box sx={{ 
        mt: 3, 
        p: 2, 
        backgroundColor: 'rgba(0, 102, 204, 0.1)', 
        borderRadius: '8px',
        display: 'inline-block'
      }}>
        <Typography variant="h4" fontWeight="bold" sx={{ color: '#002352' }}>
          {loading ? (
            <CircularProgress size={24} sx={{ color: '#0066cc', mr: 1 }} />
          ) : (
            <>
              {numberWithCommas(totalDownloads)} <Typography component="span" variant="h6" color="#666">Total Downloads</Typography>
            </>
          )}
        </Typography>
      </Box>
    </Card>
  );

  /**
   * ReleaseCard - Individual release information display
   * Shows version info, download counts, and platform-specific assets
   * 
   * @param {Object} props - Component props
   * @param {Object} props.release - GitHub release object
   * @param {number} props.index - Release index (0 = latest)
   */
  const ReleaseCard = ({ release, index }) => {
    const releaseDownloads = release.assets.reduce((a, asset) => a + asset.download_count, 0);
    const isLatest = index === 0;
    
    // Group assets by platform for organized display
    const platformAssets = {};
    release.assets.forEach(asset => {
      const platform = getPlatform(asset.name);
      if (!platformAssets[platform]) {
        platformAssets[platform] = [];
      }
      platformAssets[platform].push(asset);
    });
    
    return (
      <Paper
        key={release.id}
        elevation={1}
        sx={{
          mb: 4,
          borderRadius: '8px',
          overflow: 'hidden',
          border: isLatest ? '2px solid #0066cc' : '1px solid #e0e0e0'
        }}
      >
        {/* Release header with version and download count */}
        <Box sx={{ 
          backgroundColor: isLatest ? '#0066cc' : '#002352',
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <UpdateIcon sx={{ color: 'white', mr: 1 }} />
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
              {release.name}
            </Typography>
            {isLatest && (
              <Chip 
                icon={<CheckIcon />}
                label="Latest"
                size="small"
                sx={{ 
                  ml: 2, 
                  backgroundColor: 'white', 
                  color: '#0066cc',
                  fontWeight: 'bold'
                }} 
              />
            )}
          </Box>
          
          <Typography variant="body1" sx={{ color: 'white', fontWeight: 'medium' }}>
            {numberWithCommas(releaseDownloads)} Downloads
          </Typography>
        </Box>
        
        {/* Platform-specific assets grid */}
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2}>
            {Object.keys(platformAssets).map(platform => (
              <Grid item xs={12} sm={6} md={4} key={`${release.id}-${platform}`}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 1.5,
                    borderLeft: `4px solid ${getPlatformColor(platform)}`,
                    height: '100%'
                  }}
                >
                  {/* Platform header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        backgroundColor: getPlatformColor(platform),
                        mr: 1
                      }}
                    >
                      {getPlatformIcon(platform)}
                    </Avatar>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {platform}
                    </Typography>
                  </Box>
                  
                  {/* Individual asset download links */}
                  {platformAssets[platform].map(asset => (
                    <Box key={asset.id} sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" noWrap sx={{ maxWidth: isMobile ? '120px' : '180px' }}>
                        {asset.name}
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        href={asset.browser_download_url}
                        target="_blank"
                        startIcon={<DownloadIcon sx={{ fontSize: '1rem' }} />}
                        sx={{ 
                          ml: 1, 
                          fontSize: '0.7rem',
                          color: getPlatformColor(platform),
                          borderColor: getPlatformColor(platform),
                          '&:hover': {
                            borderColor: getPlatformColor(platform),
                            backgroundColor: `${getPlatformColor(platform)}10`
                          }
                        }}
                      >
                        {numberWithCommas(asset.download_count)}
                      </Button>
                    </Box>
                  ))}
                </Paper>
              </Grid>
            ))}
          </Grid>
          
          {/* Release notes section */}
          {release.body && (
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #eee' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Release Notes:
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line', color: '#555' }}>
                {release.body.length > 300 
                  ? `${release.body.substring(0, 300)}...` 
                  : release.body
                }
              </Typography>
              {release.body.length > 300 && (
                <Button 
                  href={release.html_url} 
                  target="_blank"
                  size="small"
                  sx={{ mt: 1 }}
                >
                  Read More
                </Button>
              )}
            </Box>
          )}
        </Box>
      </Paper>
    );
  };

  /**
   * ReleasesSection - Complete release history display
   */
  const ReleasesSection = () => (
    <Card
      elevation={3}
      sx={{
        borderRadius: '12px',
        mb: 4,
        overflow: 'hidden'
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, textAlign: 'center', color: '#002352' }}>
          Release History & Statistics
        </Typography>
        
        {loading ? (
          <Box sx={{ py: 5, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
            <CircularProgress size={60} sx={{ color: '#0066cc', mb: 3 }} />
            <Typography variant="h6" sx={{ color: '#555' }}>
              Loading releases data...
            </Typography>
          </Box>
        ) : (
          <Box>
            {releases.map((release, index) => (
              <ReleaseCard key={release.id} release={release} index={index} />
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );

  /**
   * InfoSection - Educational content about DigiByte wallets
   */
  const InfoSection = () => (
    <Card
      elevation={2}
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: '12px',
        mb: 4,
        backgroundColor: '#f2f4f8',
        backgroundImage: 'linear-gradient(135deg, #f8f9fa 0%, #e8eef7 100%)',
        border: '1px solid rgba(0, 35, 82, 0.1)'
      }}
    >
      <CardContent>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, textAlign: 'center', color: '#002352' }}>
          About DigiByte Wallets
        </Typography>
        
        <Divider sx={{ maxWidth: '100px', mx: 'auto', mb: 3 }} />
        
        <Grid container spacing={3}>
          {/* Core wallet information */}
          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                Core Wallet
              </Typography>
              <Typography variant="body2" paragraph>
                The DigiByte Core wallet is the full node implementation that downloads and verifies the entire blockchain.
                It provides maximum security and helps support network decentralization.
              </Typography>
              <Typography variant="body2" paragraph>
                Core wallet users can participate in voting for network upgrades and run DigiAssets nodes.
              </Typography>
            </Box>
          </Grid>
          
          {/* Alternative wallet options */}
          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                Other Wallet Options
              </Typography>
              <Typography variant="body2" paragraph>
                For more lightweight solutions, you can try DigiByte mobile wallets available on iOS and Android,
                or use one of the various supported hardware wallets like Ledger, Trezor, or KeepKey.
              </Typography>
              <Typography variant="body2">
                Visit the <a href="https://digibyte.org/en-us/#download" target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc' }}>official DigiByte website</a> for 
                more information about all wallet options.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  // Main component render
  return (
    <Box 
      sx={{ 
        py: 4, 
        backgroundImage: 'linear-gradient(to bottom, #f8f9fa, #ffffff)',
        minHeight: '100vh'
      }}
    >
      <Container maxWidth="lg">
        {/* Page header with title and description */}
        <HeroSection />

        {/* Download button and total statistics */}
        <DownloadButtonSection />

        {/* Complete release history with download statistics */}
        <ReleasesSection />
        
        {/* Educational information about wallet types */}
        <InfoSection />
      </Container>
    </Box>
  );
};

export default DownloadsPage;