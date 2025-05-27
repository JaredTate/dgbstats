import { useState, useEffect, useMemo } from 'react';
import { 
  Typography, Container, Box, Card, CardContent, 
  Divider, Grid, useTheme, Paper,
  CircularProgress, Chip, Avatar
} from '@mui/material';
import { Graticule } from '@visx/geo';
import './NodesPage.css';
import digibyteIcon from './digibyte256.png';
import { geoMercator, geoPath, geoGraticule10 } from 'd3-geo';
import { feature } from 'topojson-client';
import { useWidth } from '../utils';
import world from '../countries-110m.json';
import config from '../config';
import RouterIcon from '@mui/icons-material/Router';
import PublicIcon from '@mui/icons-material/Public';
import FlagIcon from '@mui/icons-material/Flag';
import LocationOnIcon from '@mui/icons-material/LocationOn';

/**
 * Custom hook for fetching node geolocation data via WebSocket
 * Manages real-time connection to retrieve DigiByte network node information
 * 
 * @returns {Object} - Contains nodesData array and loading state
 */
const useFetchData = () => {
  const [nodesData, setNodesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const socket = new WebSocket(config.wsBaseUrl);

    // WebSocket connection handlers
    socket.onopen = () => console.log('WebSocket connection established');
    
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        // Handle geographic data messages from server
        if (message.type === 'geoData') {
          setNodesData(message.data || []);
          setLoading(false);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        setLoading(false);
      }
    };

    // Set loading state on connection issues
    socket.onclose = () => setLoading(true);
    socket.onerror = () => setLoading(true);

    // Cleanup WebSocket connection
    return () => socket.readyState === WebSocket.OPEN && socket.close();
  }, []);

  return { nodesData, loading };
};

/**
 * NodesPage Component - Geographic visualization of DigiByte network nodes
 * 
 * This page displays a world map showing the global distribution of DigiByte nodes
 * based on data from the DigiHash mining pool's peers.dat file. Features include:
 * - Interactive world map with node locations
 * - Statistics summary cards
 * - Country-wise node distribution by continent
 * - Educational information about blockchain nodes
 */
const NodesPage = () => {
  const { nodesData, loading } = useFetchData();
  const theme = useTheme();

  // Convert TopoJSON world data to GeoJSON for D3 rendering
  const worldData = useMemo(() => feature(world, world.objects.countries), []);

  // Filter out nodes with invalid coordinates (0,0 indicates unknown location)
  const validNodes = useMemo(
    () => nodesData.filter(node => node.lat !== 0 && node.lon !== 0),
    [nodesData]
  );

  // Aggregate nodes by country for statistics display
  const nodesByCountry = useMemo(() => {
    if (!nodesData || nodesData.length === 0) return {};
    return nodesData.reduce((acc, node) => {
      if (node.country) {
        acc[node.country] = (acc[node.country] || 0) + 1;
      }
      return acc;
    }, {});
  }, [nodesData]);

  // Calculate responsive container dimensions for the map
  const containerWidth = Math.min(useWidth(), 1200);
  const containerHeight = containerWidth * 0.55;

  /**
   * Define geographic bounding box for map projection
   * Limits display to latitudes between -55° and +65° to exclude extreme polar regions
   * while maintaining good visibility of populated areas with nodes
   */
  const boundingBox = useMemo(
    () => ({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-180, -55], // Southwest corner
          [ 180, -55], // Southeast corner
          [ 180,  65], // Northeast corner
          [-180,  65], // Northwest corner
          [-180, -55], // Close polygon
        ]]
      }
    }),
    []
  );

  /**
   * Create Mercator projection fitted to the bounding box
   * Provides optimal viewing of node distribution while maintaining geographic accuracy
   */
  const projection = useMemo(() => {
    const p = geoMercator();
    // Fit bounding box to container dimensions
    p.fitExtent(
      [
        [0, 0],
        [containerWidth, containerHeight]
      ],
      boundingBox
    );
    // Clip anything outside the visible area
    p.clipExtent([
      [0, 0],
      [containerWidth, containerHeight]
    ]);
    return p;
  }, [boundingBox, containerWidth, containerHeight]);

  // Create path generator for rendering geographic features
  const pathGenerator = useMemo(() => geoPath().projection(projection), [projection]);

  /**
   * Group countries by continent for organized display
   * Uses predefined continent mappings for better user experience
   */
  const groupedCountries = useMemo(() => {
    const entries = Object.entries(nodesByCountry)
      .filter(([country]) => country !== 'Unknown')
      .sort(([, a], [, b]) => b - a);

    /**
     * Determine continent for a given country
     * Note: This is a simplified mapping and may not be 100% geographically accurate
     * but provides good organization for the user interface
     */
    const getContinent = (country) => {
      const continentMappings = {
        'North America': ['United States', 'Canada', 'Mexico', 'Panama', 'Costa Rica', 'Cuba', 'Dominican Republic', 'Guatemala', 'Haiti', 'Honduras', 'Jamaica', 'Nicaragua', 'Puerto Rico', 'Trinidad and Tobago'],
        'Europe': ['Germany', 'United Kingdom', 'France', 'Netherlands', 'Switzerland', 'Russia', 'Italy', 'Spain', 'Sweden', 'Poland', 'Belgium', 'Austria', 'Norway', 'Denmark', 'Finland', 'Ireland', 'Portugal', 'Greece', 'Czech Republic', 'Romania', 'Hungary', 'Ukraine', 'Bulgaria', 'Serbia', 'Croatia', 'Slovakia', 'Lithuania', 'Latvia', 'Estonia', 'Slovenia', 'Luxembourg', 'Malta', 'Iceland', 'Cyprus'],
        'Asia': ['China', 'Japan', 'India', 'South Korea', 'Taiwan', 'Hong Kong', 'Singapore', 'Malaysia', 'Thailand', 'Indonesia', 'Philippines', 'Vietnam', 'Israel', 'Turkey', 'United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Kazakhstan'],
        'Oceania': ['Australia', 'New Zealand', 'Papua New Guinea', 'Fiji'],
        'South America': ['Brazil', 'Argentina', 'Colombia', 'Chile', 'Peru', 'Venezuela', 'Ecuador', 'Uruguay', 'Paraguay', 'Bolivia'],
        'Africa': ['South Africa', 'Egypt', 'Nigeria', 'Morocco', 'Kenya', 'Ghana', 'Tanzania', 'Tunisia', 'Ethiopia', 'Uganda', 'Algeria']
      };
      
      for (const [continent, countries] of Object.entries(continentMappings)) {
        if (countries.includes(country)) return continent;
      }
      return 'Other';
    };

    // Group countries by their respective continents
    return entries.reduce((acc, [country, count]) => {
      const continent = getContinent(country);
      if (!acc[continent]) acc[continent] = [];
      acc[continent].push({ country, count });
      return acc;
    }, {});
  }, [nodesByCountry]);

  /**
   * Get color coding for different continents
   * Provides visual distinction in the UI for better user experience
   */
  const getContinentColor = (continent) => {
    const colorMap = {
      'North America': '#4caf50', // Green
      'Europe': '#2196f3',        // Blue
      'Asia': '#ff9800',          // Orange
      'Oceania': '#9c27b0',       // Purple
      'South America': '#f44336', // Red
      'Africa': '#795548',        // Brown
      'Other': '#607d8b'          // Blue Grey
    };
    return colorMap[continent] || colorMap['Other'];
  };

  /**
   * HeroSection - Page header with title and description
   * Provides context about the node data source and limitations
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
        border: '1px solid rgba(0, 35, 82, 0.1)',
        transition: 'transform 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
        }
      }}
    >
      <CardContent sx={{ py: 4, textAlign: 'center' }}>
        {/* Page title with animated icon */}
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
          <RouterIcon sx={{ 
            fontSize: { xs: '2rem', sm: '2.3rem', md: '2.5rem' }, 
            color: '#002352', 
            mr: 2,
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%': { transform: 'scale(1)', opacity: 1 },
              '50%': { transform: 'scale(1.05)', opacity: 0.8 },
              '100%': { transform: 'scale(1)', opacity: 1 }
            }
          }} />
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
            DigiByte Blockchain Nodes
          </Typography>
        </Box>
        
        <Divider sx={{ maxWidth: '150px', mx: 'auto', mb: 3, borderColor: '#0066cc', borderWidth: 2 }} />
        
        {/* Data source explanation */}
        <Typography 
          variant="subtitle1" 
          component="p" 
          sx={{ 
            maxWidth: '800px', 
            mx: 'auto', 
            mb: 2,
            color: '#555',
            fontSize: '1.1rem'
          }}
        >
          This page displays unique nodes seen in the peers.dat file of the DigiHash mining pool
          wallet since the wallet node was setup on May 8th, 2024.
        </Typography>
        
        {/* Important disclaimers about the data */}
        <Typography 
          variant="body2" 
          component="p" 
          sx={{ 
            maxWidth: '800px', 
            mx: 'auto',
            color: '#666',
          }}
        >
          A blockchain node is a computer running the DGB core wallet. Not all nodes shown should be considered active as they could be shut down now, or might be the same node behind a changing VPN or dynamic IP. Mapping decentralization through node count is challenging, and this represents one perspective.
        </Typography>
      </CardContent>
    </Card>
  );

  /**
   * StatsCard - Individual statistic display component
   * Reusable component for showing key metrics with icons and descriptions
   */
  const StatsCard = ({ title, value, description, icon, color, gradient }) => (
    <Grid item xs={12} sm={6} md={4}>
      <Paper elevation={2} sx={{ 
        p: 2, 
        borderRadius: '8px', 
        height: '100%',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
          transform: 'translateY(-3px)'
        },
        backgroundImage: gradient
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Avatar sx={{ 
            bgcolor: color, 
            mr: 2,
            boxShadow: `0 4px 8px ${color}50`
          }}>
            {icon}
          </Avatar>
          <Typography variant="h6" fontWeight="bold" sx={{ color: '#002352' }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h3" fontWeight="bold" sx={{ 
          color: '#002352', 
          textAlign: 'center', 
          my: 2,
          textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
        }}>
          {value}
        </Typography>
        <Typography variant="body2" sx={{ color: '#666', textAlign: 'center' }}>
          {description}
        </Typography>
      </Paper>
    </Grid>
  );

  /**
   * StatsSection - Summary statistics about the node network
   * Displays total nodes, mapped locations, and country count
   */
  const StatsSection = () => (
    <Card 
      elevation={3} 
      sx={{
        mb: 4,
        borderRadius: '12px',
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
        },
        borderTop: '4px solid #0066cc',
        overflow: 'hidden'
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 3 }, textAlign: 'center' }}>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, color: '#002352' }}>
          Node Statistics
        </Typography>
        
        <Divider sx={{ maxWidth: '80px', mx: 'auto', mb: 3, borderColor: '#0066cc', borderWidth: 1 }} />
        
        {loading ? (
          <Box sx={{ py: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
            <CircularProgress size={40} sx={{ 
              color: '#0066cc', 
              mb: 2,
              animation: 'spin 1.5s linear infinite',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' }
              }
            }} />
            <Typography variant="h6" sx={{ color: '#555' }}>
              Loading node data...
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3} justifyContent="center">
            <StatsCard 
              title="Total Nodes Seen"
              value={nodesData.length}
              description="Unique node IPs identified"
              icon={<RouterIcon />}
              color="#0066cc"
              gradient="linear-gradient(135deg, #ffffff 0%, #f5f9ff 100%)"
            />
            <StatsCard 
              title="Mapped Active Regions"
              value={validNodes.length}
              description="Unique geographic node locations"
              icon={<LocationOnIcon />}
              color="#4caf50"
              gradient="linear-gradient(135deg, #ffffff 0%, #f1f9f2 100%)"
            />
            <StatsCard 
              title="Total Countries"
              value={Object.keys(nodesByCountry).filter(country => country !== 'Unknown').length}
              description="Nations with active DigiByte nodes"
              icon={<FlagIcon />}
              color="#ff9800"
              gradient="linear-gradient(135deg, #ffffff 0%, #fff9f0 100%)"
            />
          </Grid>
        )}
      </CardContent>
    </Card>
  );

  /**
   * WorldMapSection - Interactive world map showing node distribution
   * Uses D3.js with Mercator projection to display geographic node locations
   */
  const WorldMapSection = () => (
    <Card 
      elevation={3} 
      sx={{
        mb: 4,
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
        },
        borderTop: '4px solid #0066cc'
      }}
    >
      <CardContent sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        {/* Section header */}
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
          <PublicIcon sx={{ 
            fontSize: '1.8rem', 
            color: '#0066cc',
            mr: 1,
            animation: 'rotate 10s linear infinite',
            '@keyframes rotate': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' }
            }
          }} />
          <Typography 
            variant="h5" 
            fontWeight="bold" 
            sx={{ 
              color: '#002352',
              letterSpacing: '0.5px'
            }}
          >
            Global Node Distribution
          </Typography>
        </Box>
        
        <Divider sx={{ maxWidth: '120px', mx: 'auto', mb: 3, borderColor: '#0066cc', borderWidth: 1 }} />
        
        {/* SVG map container */}
        <Box 
          className="map-container" 
          sx={{ 
            border: '1px solid rgba(0,0,0,0.1)', 
            borderRadius: '12px', 
            overflow: 'hidden', 
            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)',
            bgcolor: '#f7f9fc',
            p: 1,
            backgroundImage: 'radial-gradient(circle at center, #f9fbff 0%, #f0f5fd 100%)'
          }}
        >
          <svg 
            width={containerWidth} 
            height={containerHeight}
            style={{ display: 'block' }}
          >
            {/* Map background */}
            <rect width={containerWidth} height={containerHeight} fill="#f7f9fc" fillOpacity={0.8} />
            
            {/* Geographic grid lines */}
            <Graticule graticule={geoGraticule10} stroke="#DDD" />

            {/* Country boundaries */}
            {worldData.features.map((feat, i) => (
              <path
                key={`country-${i}`}
                d={pathGenerator(feat)}
                fill="#e0e0e0"
                stroke="#bdbdbd"
                strokeWidth={0.5}
                style={{
                  transition: 'fill 0.3s ease',
                  ':hover': { fill: '#c9c9c9' }
                }}
              />
            ))}

            {/* Node location markers */}
            {validNodes.map((node, i) => {
              const coords = projection([node.lon, node.lat]);
              if (!coords) return null;
              const [x, y] = coords;
              if (isNaN(x) || isNaN(y)) return null;
              return (
                <g key={`node-${i}`} transform={`translate(${x - 8}, ${y - 8})`}>
                  <image 
                    href={digibyteIcon} 
                    width={16} 
                    height={16} 
                    style={{ 
                      filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.3))',
                      animation: 'pulse 2s infinite',
                    }}
                  />
                </g>
              );
            })}
          </svg>
        </Box>
        
        {/* Map legend */}
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2 }}>
          <Box 
            component="span"
            sx={{ 
              display: 'inline-flex', 
              alignItems: 'center',
              bgcolor: 'rgba(0, 102, 204, 0.1)',
              borderRadius: '50px',
              px: 2,
              py: 0.5
            }}
          >
            <img 
              src={digibyteIcon} 
              alt="DigiByte" 
              style={{ width: '14px', height: '14px', marginRight: '6px' }} 
            />
            <Typography variant="body2" sx={{ color: '#0066cc', fontWeight: 'medium' }}>
              Each icon represents a node's geographic location based on IP data
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  /**
   * NetworkInfoSection - Educational content about DigiByte nodes
   * Provides context and information for users wanting to learn more
   */
  const NetworkInfoSection = () => (
    <Card
      elevation={2}
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: '12px',
        mb: 4,
        backgroundColor: '#f2f4f8',
        backgroundImage: 'linear-gradient(135deg, #f8f9fa 0%, #e8eef7 100%)',
        border: '1px solid rgba(0, 35, 82, 0.1)',
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
        }
      }}
    >
      <CardContent>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, textAlign: 'center', color: '#002352' }}>
          About DigiByte Blockchain Network Nodes
        </Typography>
        
        <Divider sx={{ maxWidth: '100px', mx: 'auto', mb: 3 }} />
        
        {/* Educational content about nodes */}
        <Typography variant="body1" paragraph>
          Nodes are a critical component of the DigiByte network's infrastructure. Each node maintains a copy of the blockchain, 
          validates transactions, and helps relay information across the network.
        </Typography>
        
        <Typography variant="body1" paragraph>
          Running a node contributes to the decentralization and security of DigiByte. The more nodes 
          distributed around the world, the more resilient and censorship-resistant the network becomes.
        </Typography>
        
        <Typography variant="body1" paragraph>
          This data represents nodes seen in the peers.dat file from the DigiHash mining pool wallet, 
          providing one perspective on the global distribution of the DigiByte network. The actual number 
          of nodes worldwide is likely higher than shown here.
        </Typography>
        
        {/* Call to action for running nodes */}
        <Typography variant="body1">
          Want to contribute to the network? Consider running your own DigiByte Core node by downloading 
          the <a href="https://github.com/DigiByte-Core/digibyte/releases" target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc' }}>latest wallet</a>.
        </Typography>
      </CardContent>
    </Card>
  );

  /**
   * CountriesListSection - Organized display of nodes by geographic region
   * Groups countries by continent with color coding for better visualization
   */
  const CountriesListSection = () => (
    <Card 
      elevation={3} 
      sx={{
        mb: 4,
        borderRadius: '12px',
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
        },
        borderTop: '4px solid #0066cc',
        overflow: 'hidden'
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        {/* Section header */}
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
          <FlagIcon sx={{ fontSize: '1.8rem', color: '#0066cc', mr: 1 }} />
          <Typography 
            variant="h5" 
            fontWeight="bold" 
            sx={{ color: '#002352', letterSpacing: '0.5px' }}
          >
            Nodes by Geographic Region
          </Typography>
        </Box>
        
        <Divider sx={{ maxWidth: '120px', mx: 'auto', mb: 3, borderColor: '#0066cc', borderWidth: 1 }} />
        
        {/* Continent-based country groupings */}
        <Grid container spacing={3}>
          {Object.keys(groupedCountries).sort().map((continent, index) => (
            <Grid item xs={12} sm={6} md={4} key={continent}>
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 2, 
                  height: '100%',
                  borderTop: `4px solid ${getContinentColor(continent)}`,
                  borderRadius: '8px',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 15px rgba(0,0,0,0.1)'
                  },
                  animation: 'fadeIn 0.5s ease-in-out',
                  animationDelay: `${index * 0.1}s`,
                  '@keyframes fadeIn': {
                    '0%': { opacity: 0, transform: 'translateY(10px)' },
                    '100%': { opacity: 1, transform: 'translateY(0)' }
                  }
                }}
              >
                {/* Continent header with total count */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 2, 
                  pb: 1, 
                  borderBottom: `1px solid ${getContinentColor(continent)}40`
                }}>
                  <Avatar 
                    sx={{ 
                      backgroundColor: `${getContinentColor(continent)}30`, 
                      color: getContinentColor(continent),
                      width: 32,
                      height: 32,
                      fontSize: '0.9rem',
                      mr: 1
                    }}
                  >
                    {groupedCountries[continent].reduce((acc, { count }) => acc + count, 0)}
                  </Avatar>
                  <Typography variant="h6" fontWeight="bold" sx={{ 
                    color: getContinentColor(continent),
                    textShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}>
                    {continent}
                  </Typography>
                </Box>
                
                {/* Individual country listings */}
                {groupedCountries[continent].map(({ country, count }) => (
                  <Box 
                    key={country} 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      mb: 1,
                      py: 0.5,
                      px: 1,
                      borderRadius: '4px',
                      '&:hover': {
                        backgroundColor: `${getContinentColor(continent)}10`
                      }
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {country}
                    </Typography>
                    <Chip 
                      label={count} 
                      size="small" 
                      sx={{ 
                        fontWeight: 'bold',
                        bgcolor: `${getContinentColor(continent)}20`,
                        color: getContinentColor(continent),
                        minWidth: '36px'
                      }} 
                    />
                  </Box>
                ))}
              </Paper>
            </Grid>
          ))}
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

        {/* Statistics summary cards */}
        <StatsSection />

        {/* Interactive world map (only shown when data is loaded) */}
        {!loading && <WorldMapSection />}

        {/* Educational information about nodes */}
        <NetworkInfoSection />
        
        {/* Country listings by continent (only shown when data is loaded) */}
        {!loading && <CountriesListSection />}
      </Container>
    </Box>
  );
};

export default NodesPage;