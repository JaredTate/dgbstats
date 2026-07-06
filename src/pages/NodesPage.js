import { useState, useEffect, useMemo, useRef, memo } from 'react';
import {
  Typography, Container, Box, Card, CardContent,
  Divider, Grid, Paper,
  CircularProgress, Chip, Avatar, LinearProgress
} from '@mui/material';
import { Graticule } from '@visx/geo';
import './NodesPage.css';
import digibyteIcon from './digibyte256.png';
import { geoMercator, geoPath, geoGraticule10 } from 'd3-geo';
import { zoom as d3Zoom, zoomIdentity } from 'd3-zoom';
import { select } from 'd3-selection';
import { feature } from 'topojson-client';
import { useWidth } from '../utils';
import world from '../countries-110m.json';
import usStates from 'us-atlas/states-10m.json';
import { useNetwork } from '../context/NetworkContext';
import RouterIcon from '@mui/icons-material/Router';
import PublicIcon from '@mui/icons-material/Public';
import FlagIcon from '@mui/icons-material/Flag';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import UpdateIcon from '@mui/icons-material/Update';
import StorageIcon from '@mui/icons-material/Storage';

/**
 * Custom hook for fetching node geolocation data via WebSocket
 * Manages real-time connection to retrieve DigiByte network node information
 *
 * Handles two message types:
 * - `geoData`: array of node objects for the map/statistics (drives `loading`)
 * - `nodeVersions24h`: pre-aggregated version breakdown of nodes seen in the
 *   last 24 hours (does NOT drive `loading` — the section owns its empty state
 *   so the page degrades gracefully against servers that never send it)
 *
 * @param {string} wsBaseUrl - WebSocket base URL from network context
 * @returns {Object} - Contains nodesData array, versionData object and loading state
 */
const useFetchData = (wsBaseUrl) => {
  const [nodesData, setNodesData] = useState([]);
  const [versionData, setVersionData] = useState(null);
  const [addrmanInfo, setAddrmanInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const socket = new WebSocket(wsBaseUrl);

    // WebSocket connection handlers
    socket.onopen = () => console.log('WebSocket connection established');

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        // Handle geographic data messages from server
        if (message.type === 'geoData') {
          setNodesData(message.data || []);
          // addrman summary rides along on the geoData message (may be absent)
          setAddrmanInfo(message.addrman || null);
          setLoading(false);
        } else if (message.type === 'nodeVersions24h') {
          // Version breakdown of nodes seen in the last 24 hours
          setVersionData(message.data || null);
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
  }, [wsBaseUrl]);

  return { nodesData, versionData, addrmanInfo, loading };
};

/**
 * Format a millisecond timestamp as a short relative time string
 * (e.g. "just now", "5m ago", "3h ago", "2d ago")
 *
 * @param {number} timestamp - Milliseconds since epoch
 * @returns {string|null} - Relative time string, or null when invalid
 */
const formatRelativeTime = (timestamp) => {
  if (!Number.isFinite(timestamp)) return null;
  const diffMs = Date.now() - timestamp;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

/**
 * Format a numeric percentage with one decimal place (e.g. 87.9 -> "87.9%")
 *
 * @param {number} value - Percentage value
 * @returns {string} - Formatted percentage string
 */
const formatPercent = (value) => `${value.toFixed(1)}%`;

/**
 * Continent color coding and country->continent mapping (module scope so both
 * the continent summary and the top-countries list share one source of truth).
 */
const CONTINENT_COLORS = {
  'North America': '#4caf50',
  'Europe': '#2196f3',
  'Asia': '#ff9800',
  'Oceania': '#9c27b0',
  'South America': '#f44336',
  'Africa': '#795548',
  'Other': '#607d8b'
};

/**
 * ISO 3166-1 alpha-2 country codes grouped by continent. The backend geolocates
 * peers with geoip-lite, which reports these two-letter codes (e.g. "US"), so
 * the mapping is keyed by code, not by full country name.
 */
const CONTINENT_CODES = {
  'North America': 'US CA MX GT BZ SV HN NI CR PA CU DO HT JM PR BS BB TT AG DM GD KN LC VC AI AW BM VG KY CW GL GP MQ MS BL MF PM SX TC VI'.split(' '),
  'Europe': 'GB DE FR NL CH RU IT ES SE PL BE AT NO DK FI IE PT GR CZ RO HU UA BG RS HR SK LT LV EE SI LU MT IS CY AL AD BA BY FO GG GI IM JE LI MC MD ME MK SM VA XK'.split(' '),
  'Asia': 'CN JP IN KR TW HK SG MY TH ID PH VN IL TR AE SA QA KW KZ PK BD LK NP MM KH LA MN GE AM AZ UZ IR IQ JO LB OM BH YE SY AF BT BN MO MV KG TJ TM TL KP PS'.split(' '),
  'Oceania': 'AU NZ PG FJ NC PF WS TO VU SB GU KI MH FM NR NU NF MP PW PN TK TV WF CK AS'.split(' '),
  'South America': 'BR AR CO CL PE VE EC UY PY BO GY SR FK GF'.split(' '),
  'Africa': 'ZA EG NG MA KE GH TZ TN ET UG DZ AO CM CI SN ZW ZM MU RW MZ BW NA LY SD SO MG MW ML BF BJ NE TD GA CG CD MR GN GM SL LR TG CF GQ DJ ER SZ LS BI KM CV ST SC SH RE YT EH SS'.split(' ')
};

// Flat code -> continent lookup, built once at module load.
const ISO_TO_CONTINENT = Object.entries(CONTINENT_CODES).reduce((acc, [continent, codes]) => {
  codes.forEach((code) => { acc[code] = continent; });
  return acc;
}, {});

const getContinentForCountry = (country) => ISO_TO_CONTINENT[country] || 'Other';

const getContinentColor = (continent) => CONTINENT_COLORS[continent] || CONTINENT_COLORS['Other'];

// ISO code -> full English country name (e.g. "US" -> "United States"). Uses the
// built-in Intl.DisplayNames; falls back to the raw value for non-code inputs.
let _regionNames = null;
try {
  _regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
} catch (e) {
  _regionNames = null;
}
const getCountryName = (country) => {
  if (!country || typeof country !== 'string') return country;
  if (!/^[A-Za-z]{2}$/.test(country)) return country; // already a full name
  try {
    const name = _regionNames && _regionNames.of(country.toUpperCase());
    return name && name !== country.toUpperCase() ? name : country;
  } catch (e) {
    return country;
  }
};

const TOP_COUNTRIES_LIMIT = 30;

/**
 * StatTile - Small label/value tile for the 24h section
 * Always 2-up (xs=6): the section lives in a half-width column on desktop
 */
const StatTile = ({ label, value, caption }) => (
  <Grid item xs={6}>
    <Paper
      elevation={2}
      sx={{
        p: 2,
        textAlign: 'center',
        borderRadius: '12px',
        height: '100%',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
          transform: 'translateY(-3px)'
        }
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5" fontWeight="bold" sx={{ color: '#002352' }}>
        {value}
      </Typography>
      {caption && (
        <Typography variant="caption" sx={{ color: '#777' }}>
          {caption}
        </Typography>
      )}
    </Paper>
  </Grid>
);

/**
 * NodesLast24HoursSection - Version breakdown of nodes seen in the last 24 hours
 *
 * Fed by the `nodeVersions24h` WebSocket message. Defined at module scope and
 * memoized so it does not remount on every NodesPage render (unlike the page's
 * legacy inline sections). Owns its awaiting state (`versionData === null`) so
 * the page degrades gracefully against servers that never send the message.
 *
 * Percentages and row ordering are recomputed defensively client-side: server
 * values are used when present/finite, otherwise derived from the raw counts.
 *
 * @param {Object|null} versionData - `data` field of the nodeVersions24h message
 * @param {string} accentColor - Section accent (testnet-aware, from networkTheme)
 */
const NodesLast24HoursSection = memo(({ versionData, accentColor }) => {
  // Defensive client-side derivation: sort desc by count, recompute missing percents
  const stats = useMemo(() => {
    if (!versionData || typeof versionData !== 'object') return null;

    const rawVersions = Array.isArray(versionData.versions) ? versionData.versions : [];
    const countedTotal = rawVersions.reduce(
      (acc, v) => acc + (Number.isFinite(v?.count) ? v.count : 0),
      0
    );
    const total = Number.isFinite(versionData.totalUniqueNodes)
      ? versionData.totalUniqueNodes
      : countedTotal;

    const rows = rawVersions
      .filter((v) => v && typeof v.userAgent === 'string')
      .map((v) => {
        const count = Number.isFinite(v.count) ? v.count : 0;
        const percent = Number.isFinite(v.percent)
          ? v.percent
          : total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
        return { userAgent: v.userAgent, count, percent, isLatest: !!v.isLatest };
      })
      .sort((a, b) => b.count - a.count);

    const latestCount = rows.reduce((acc, r) => acc + (r.isLatest ? r.count : 0), 0);
    const upgradedCount = Number.isFinite(versionData.upgradedCount)
      ? versionData.upgradedCount
      : latestCount;
    const upgradedPercent = Number.isFinite(versionData.upgradedPercent)
      ? versionData.upgradedPercent
      : total > 0 ? Math.round((upgradedCount / total) * 1000) / 10 : 0;

    return {
      total,
      rows,
      latestCount,
      upgradedPercent,
      latestVersion: versionData.latestVersion || null,
      targetSeries: versionData.targetSeries || null,
      windowHours: Number.isFinite(versionData.windowHours) ? versionData.windowHours : 24,
      updatedAgo: formatRelativeTime(versionData.updatedAt)
    };
  }, [versionData]);

  return (
    <Card
      elevation={3}
      data-testid="nodes-24h-section"
      sx={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '12px',
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
        },
        borderTop: `4px solid ${accentColor}`,
        overflow: 'hidden'
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 3 }, display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}>
        {/* Section header */}
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 0.5 }}>
          <UpdateIcon sx={{ fontSize: '1.8rem', color: accentColor, mr: 1 }} />
          <Typography
            variant="h5"
            fontWeight="bold"
            sx={{ color: '#002352', letterSpacing: '0.5px', textAlign: 'center' }}
          >
            Crawler Method
          </Typography>
        </Box>

        {/* Window + freshness caption */}
        <Typography
          variant="caption"
          component="p"
          sx={{ textAlign: 'center', color: '#777', mb: 2 }}
        >
          {stats
            ? `Nodes seen in last ${stats.windowHours} hours${stats.updatedAgo ? ` · updated ${stats.updatedAgo}` : ''}`
            : 'Nodes seen in last 24 hours'}
        </Typography>

        <Divider sx={{ maxWidth: '120px', mx: 'auto', mb: 3, borderColor: accentColor, borderWidth: 1 }} />

        {!stats ? (
          // Awaiting state — intentionally no spinner so it doesn't compete
          // with the page-level loading indicator in the peers.dat panel
          <Typography variant="body2" sx={{ textAlign: 'center', color: '#777', py: 2 }}>
            Collecting node data… version statistics will appear once the server reports them.
          </Typography>
        ) : (
          <>
            {/* Stat tiles */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <StatTile
                label="Nodes Seen (24h)"
                value={stats.total.toLocaleString()}
                caption="crawled + peers of our node"
              />
              <StatTile
                label="On Latest"
                value={stats.latestCount.toLocaleString()}
                caption={stats.latestVersion ? `v${stats.latestVersion}` : null}
              />
              <StatTile
                label="Upgraded"
                value={formatPercent(stats.upgradedPercent)}
                caption={stats.targetSeries ? `v${stats.targetSeries}+ DigiDollar` : null}
              />
              <StatTile label="Versions" value={stats.rows.length.toLocaleString()} />
            </Grid>

            {/* Upgrade progress bar with the 70% DigiDollar-threshold marker */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ position: 'relative' }}>
                <LinearProgress
                  variant="determinate"
                  value={Math.max(0, Math.min(stats.upgradedPercent, 100))}
                  sx={{
                    height: 24,
                    borderRadius: '12px',
                    backgroundColor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: stats.upgradedPercent >= 70 ? '#4caf50' : '#0066cc',
                      borderRadius: '12px'
                    }
                  }}
                />
                <Box
                  title="70% — DigiDollar activation threshold"
                  sx={{
                    position: 'absolute',
                    left: '70%',
                    top: -3,
                    bottom: -3,
                    borderLeft: '2px dashed #002352',
                    opacity: 0.55
                  }}
                />
              </Box>
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                sx={{
                  mt: 1,
                  textAlign: 'center',
                  color: stats.upgradedPercent >= 70 ? '#2e7d32' : '#002352'
                }}
              >
                {`${formatPercent(stats.upgradedPercent)} of nodes upgraded to ${
                  stats.targetSeries ? `v${stats.targetSeries}` : 'the current release'
                } DigiDollar or higher`}
              </Typography>
              <Typography
                variant="caption"
                component="p"
                sx={{ textAlign: 'center', color: '#777' }}
              >
                Rolling last 24 hours · dashed line marks the 70% DigiDollar activation threshold
              </Typography>
            </Box>

            {/* Per-version rows, sorted desc by count. Capped height keeps the
                panel vertically balanced with the peers.dat panel; overflow
                scrolls (long tails of one-off user agents). */}
            {stats.rows.length === 0 ? (
              <Typography variant="body2" sx={{ textAlign: 'center', color: '#777', py: 1 }}>
                No version data reported yet.
              </Typography>
            ) : (
              <Box
                sx={{
                  flexGrow: 1,
                  maxHeight: { xs: 300, md: 340 },
                  overflowY: 'auto',
                  pr: 0.5,
                  '&::-webkit-scrollbar': { width: '6px' },
                  '&::-webkit-scrollbar-thumb': { backgroundColor: '#c5d5ea', borderRadius: '3px' }
                }}>
                {stats.rows.map((row) => (
                  <Box
                    key={row.userAgent}
                    data-testid="version-row"
                    sx={{
                      mb: 1.5,
                      px: 1,
                      py: 0.5,
                      borderRadius: '4px',
                      '&:hover': { backgroundColor: `${accentColor}10` }
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 1,
                        mb: 0.5
                      }}
                    >
                      <Typography
                        variant="body2"
                        title={row.userAgent}
                        sx={{
                          fontFamily: 'monospace',
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          minWidth: 0,
                          flex: 1
                        }}
                      >
                        {row.userAgent}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                        {row.isLatest && (
                          <Chip
                            label="latest"
                            size="small"
                            sx={{
                              mr: 1,
                              height: 18,
                              fontSize: '0.65rem',
                              bgcolor: '#4caf50',
                              color: 'white',
                              fontWeight: 'bold'
                            }}
                          />
                        )}
                        <Chip
                          label={row.count.toLocaleString()}
                          size="small"
                          sx={{
                            fontWeight: 'bold',
                            bgcolor: `${accentColor}20`,
                            color: accentColor,
                            minWidth: '36px'
                          }}
                        />
                        <Typography
                          component="span"
                          variant="caption"
                          sx={{ ml: 1, color: '#666', minWidth: '44px', textAlign: 'right' }}
                        >
                          {formatPercent(row.percent)}
                        </Typography>
                      </Box>
                    </Box>
                    {/* Thin per-row share bar */}
                    <LinearProgress
                      variant="determinate"
                      value={Math.max(0, Math.min(row.percent, 100))}
                      sx={{
                        height: 6,
                        borderRadius: '3px',
                        backgroundColor: '#eceff1',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: row.isLatest ? '#4caf50' : accentColor,
                          borderRadius: '3px'
                        }
                      }}
                    />
                  </Box>
                ))}
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
});

NodesLast24HoursSection.displayName = 'NodesLast24HoursSection';

/**
 * MethodologyNote - "Counting nodes is hard" banner
 *
 * Sits above the two method panels and explains why they disagree: peers.dat
 * is passive gossip (overcounts), the crawler is active handshakes
 * (undercounts non-listening wallets).
 */
const MethodologyNote = memo(() => (
  <Paper
    elevation={0}
    data-testid="methodology-note"
    sx={{
      mb: 3,
      p: { xs: 2, md: 2.5 },
      borderRadius: '12px',
      border: '1px solid #d0e0f5',
      backgroundColor: '#f3f8ff',
      display: 'flex',
      gap: 1.5,
      alignItems: 'flex-start'
    }}
  >
    <PublicIcon sx={{ color: '#0066cc', mt: 0.25, flexShrink: 0 }} />
    <Typography variant="body2" sx={{ color: '#33475b', lineHeight: 1.65 }}>
      <strong>Counting nodes is hard.</strong> A public blockchain has no registry of nodes, so
      no single number is “right” — this page triangulates with two methodologies.{' '}
      <strong>Peers.dat Method</strong> is passive: every unique address our node has learned
      through network gossip, which includes nodes that are offline, unreachable, or the same
      machine behind changing IPs. <strong>Crawler Method</strong> is active: only nodes that
      answered a real P2P handshake within the last 24 hours — verified reachable, but blind to
      non-listening wallets behind firewalls. The true network size lies between the two.
    </Typography>
  </Paper>
));

MethodologyNote.displayName = 'MethodologyNote';

/**
 * PeersDatTile - Icon stat tile for the peers.dat panel (2x2 grid)
 */
const PeersDatTile = ({ label, value, caption, icon, color }) => (
  <Grid item xs={6} sx={{ display: 'flex' }}>
    <Paper
      elevation={2}
      sx={{
        p: 2,
        width: '100%',
        minHeight: { xs: 150, md: 168 },
        textAlign: 'center',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
          transform: 'translateY(-3px)'
        }
      }}
    >
      <Avatar sx={{ bgcolor: color, mx: 'auto', mb: 1, boxShadow: `0 4px 8px ${color}50` }}>
        {icon}
      </Avatar>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h4" fontWeight="bold" sx={{ color: '#002352', my: 0.5 }}>
        {value}
      </Typography>
      {caption && (
        <Typography variant="caption" sx={{ color: '#777' }}>
          {caption}
        </Typography>
      )}
    </Paper>
  </Grid>
);

/**
 * PeersDatPanel - Left column: passive peers.dat discovery statistics
 *
 * 2x2 tile grid; stretches to the height of the crawler panel beside it on
 * desktop (parent grid uses alignItems="stretch").
 */
const PeersDatPanel = memo(({ loading, knownCount, geoCount, countryCount, ipv4Count, ipv6Count, addrman, accentColor }) => (
  <Card
    elevation={3}
    data-testid="peersdat-panel"
    sx={{
      height: '100%',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: '12px',
      transition: 'transform 0.3s, box-shadow 0.3s',
      '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
      },
      borderTop: `4px solid ${accentColor}`,
      overflow: 'hidden'
    }}
  >
    <CardContent sx={{ p: { xs: 2, md: 3 }, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 0.5 }}>
        <RouterIcon sx={{ fontSize: '1.8rem', color: accentColor, mr: 1 }} />
        <Typography
          variant="h5"
          fontWeight="bold"
          sx={{ color: '#002352', letterSpacing: '0.5px', textAlign: 'center' }}
        >
          Peers.dat Method
        </Typography>
      </Box>

      <Typography
        variant="caption"
        component="p"
        sx={{ textAlign: 'center', color: '#777', mb: 2 }}
      >
        Passive discovery · addresses learned from network gossip
      </Typography>

      <Divider sx={{ maxWidth: '120px', mx: 'auto', mb: 3, borderColor: accentColor, borderWidth: 1 }} />

      {loading ? (
        <Box sx={{ py: 3, flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
          <CircularProgress size={40} sx={{ color: accentColor, mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#555' }}>
            Loading node data...
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2} sx={{ flexGrow: 1, alignContent: 'center' }}>
          <PeersDatTile
            label="Known Addresses"
            value={knownCount.toLocaleString()}
            caption="unique IPs in peers.dat"
            icon={<RouterIcon />}
            color="#0066cc"
          />
          <PeersDatTile
            label="Geolocated Nodes"
            value={geoCount.toLocaleString()}
            caption="mappable coordinates"
            icon={<LocationOnIcon />}
            color="#4caf50"
          />
          <PeersDatTile
            label="Countries"
            value={countryCount.toLocaleString()}
            caption="where nodes were seen"
            icon={<FlagIcon />}
            color="#ff9800"
          />
          <PeersDatTile
            label="IPv4 / IPv6"
            value={`${ipv4Count.toLocaleString()} / ${ipv6Count.toLocaleString()}`}
            caption="address families"
            icon={<PublicIcon />}
            color="#9c27b0"
          />
          {addrman && (
            <PeersDatTile
              label="Address Manager"
              value={addrman.total.toLocaleString()}
              caption={`${addrman.new.toLocaleString()} new · ${addrman.tried.toLocaleString()} tried`}
              icon={<StorageIcon />}
              color="#8e24aa"
            />
          )}
        </Grid>
      )}
    </CardContent>
  </Card>
));

PeersDatPanel.displayName = 'PeersDatPanel';

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
  const { wsBaseUrl, getApiUrl, isTestnet, theme: networkTheme } = useNetwork();
  const { nodesData, versionData, addrmanInfo, loading } = useFetchData(wsBaseUrl);

  // Accent for the 24h version section — network-aware like HeroSection
  const versionAccentColor = isTestnet ? (networkTheme?.primary || '#0066cc') : '#0066cc';

  // Convert TopoJSON world data to GeoJSON for D3 rendering
  const worldData = useMemo(() => feature(world, world.objects.countries), []);
  
  // Convert TopoJSON US states data to GeoJSON for D3 rendering
  const usStatesData = useMemo(() => feature(usStates, usStates.objects.states), []);
  
  // Major cities data for labels at higher zoom levels
  const majorCities = useMemo(() => [
    // Major World Capitals (minZoom: 2, importance: 3 = highest)
    { name: 'Washington DC', lat: 38.9072, lon: -77.0369, minZoom: 2, importance: 3 },
    { name: 'London', lat: 51.5074, lon: -0.1278, minZoom: 2, importance: 3 },
    { name: 'Paris', lat: 48.8566, lon: 2.3522, minZoom: 2, importance: 3 },
    { name: 'Berlin', lat: 52.5200, lon: 13.4050, minZoom: 2, importance: 3 },
    { name: 'Moscow', lat: 55.7558, lon: 37.6173, minZoom: 2, importance: 3 },
    { name: 'Beijing', lat: 39.9042, lon: 116.4074, minZoom: 2, importance: 3 },
    { name: 'Tokyo', lat: 35.6762, lon: 139.6503, minZoom: 2, importance: 3 },
    { name: 'New Delhi', lat: 28.6139, lon: 77.2090, minZoom: 2, importance: 3 },
    { name: 'Brasília', lat: -15.8267, lon: -47.9218, minZoom: 2, importance: 3 },
    { name: 'Buenos Aires', lat: -34.6037, lon: -58.3816, minZoom: 2, importance: 3 },
    { name: 'Mexico City', lat: 19.4326, lon: -99.1332, minZoom: 2, importance: 3 },
    { name: 'Cairo', lat: 30.0444, lon: 31.2357, minZoom: 2, importance: 3 },
    { name: 'Pretoria', lat: -25.7479, lon: 28.2293, minZoom: 2, importance: 3 },
    { name: 'Canberra', lat: -35.2809, lon: 149.1300, minZoom: 2, importance: 3 },
    
    // European Capitals (minZoom: 3, importance: 2 = regional capitals)
    { name: 'Madrid', lat: 40.4168, lon: -3.7038, minZoom: 3, importance: 2 },
    { name: 'Rome', lat: 41.9028, lon: 12.4964, minZoom: 3, importance: 2 },
    { name: 'Amsterdam', lat: 52.3676, lon: 4.9041, minZoom: 3, importance: 2 },
    { name: 'Brussels', lat: 50.8503, lon: 4.3517, minZoom: 3, importance: 2 },
    { name: 'Vienna', lat: 48.2082, lon: 16.3738, minZoom: 3, importance: 2 },
    { name: 'Warsaw', lat: 52.2297, lon: 21.0122, minZoom: 3, importance: 2 },
    { name: 'Stockholm', lat: 59.3293, lon: 18.0686, minZoom: 3, importance: 2 },
    { name: 'Copenhagen', lat: 55.6761, lon: 12.5683, minZoom: 3, importance: 2 },
    { name: 'Oslo', lat: 59.9139, lon: 10.7522, minZoom: 3, importance: 2 },
    { name: 'Helsinki', lat: 60.1699, lon: 24.9384, minZoom: 3, importance: 2 },
    { name: 'Athens', lat: 37.9838, lon: 23.7275, minZoom: 3, importance: 2 },
    { name: 'Lisbon', lat: 38.7223, lon: -9.1393, minZoom: 3, importance: 2 },
    { name: 'Dublin', lat: 53.3498, lon: -6.2603, minZoom: 3, importance: 2 },
    { name: 'Prague', lat: 50.0755, lon: 14.4378, minZoom: 3, importance: 2 },
    { name: 'Budapest', lat: 47.4979, lon: 19.0402, minZoom: 3, importance: 2 },
    { name: 'Bucharest', lat: 44.4268, lon: 26.1025, minZoom: 3, importance: 2 },
    { name: 'Sofia', lat: 42.6977, lon: 23.3219, minZoom: 3, importance: 2 },
    { name: 'Belgrade', lat: 44.7866, lon: 20.4489, minZoom: 3, importance: 2 },
    { name: 'Zagreb', lat: 45.8150, lon: 15.9819, minZoom: 3, importance: 2 },
    { name: 'Ljubljana', lat: 46.0569, lon: 14.5058, minZoom: 3, importance: 2 },
    { name: 'Bratislava', lat: 48.1486, lon: 17.1077, minZoom: 3, importance: 2 },
    { name: 'Tallinn', lat: 59.4370, lon: 24.7536, minZoom: 3, importance: 2 },
    { name: 'Riga', lat: 56.9496, lon: 24.1052, minZoom: 3, importance: 2 },
    { name: 'Vilnius', lat: 54.6872, lon: 25.2797, minZoom: 3, importance: 2 },
    { name: 'Kyiv', lat: 50.4501, lon: 30.5234, minZoom: 3, importance: 2 },
    { name: 'Minsk', lat: 53.9006, lon: 27.5590, minZoom: 3, importance: 2 },
    { name: 'Chisinau', lat: 47.0105, lon: 28.8638, minZoom: 3, importance: 2 },
    { name: 'Ankara', lat: 39.9334, lon: 32.8597, minZoom: 3, importance: 2 },
    { name: 'Nicosia', lat: 35.1856, lon: 33.3823, minZoom: 3, importance: 2 },
    { name: 'Valletta', lat: 35.8989, lon: 14.5146, minZoom: 3, importance: 2 },
    { name: 'Luxembourg', lat: 49.6117, lon: 6.1319, minZoom: 3, importance: 2 },
    { name: 'Monaco', lat: 43.7384, lon: 7.4246, minZoom: 3, importance: 2 },
    { name: 'San Marino', lat: 43.9424, lon: 12.4578, minZoom: 3, importance: 2 },
    { name: 'Vatican City', lat: 41.9029, lon: 12.4534, minZoom: 3, importance: 2 },
    { name: 'Andorra la Vella', lat: 42.5063, lon: 1.5218, minZoom: 3, importance: 2 },
    { name: 'Reykjavik', lat: 64.1466, lon: -21.9426, minZoom: 3, importance: 2 },
    { name: 'Bern', lat: 46.9480, lon: 7.4474, minZoom: 3, importance: 2 },
    { name: 'Vaduz', lat: 47.1410, lon: 9.5209, minZoom: 3, importance: 2 },
    { name: 'Sarajevo', lat: 43.8563, lon: 18.4131, minZoom: 3, importance: 2 },
    { name: 'Podgorica', lat: 42.4304, lon: 19.2594, minZoom: 3, importance: 2 },
    { name: 'Skopje', lat: 41.9973, lon: 21.4280, minZoom: 3, importance: 2 },
    { name: 'Tirana', lat: 41.3275, lon: 19.8187, minZoom: 3, importance: 2 },
    
    // Asian Capitals (minZoom: 3, importance: 2 = regional capitals)
    { name: 'Seoul', lat: 37.5665, lon: 126.9780, minZoom: 3, importance: 2 },
    { name: 'Bangkok', lat: 13.7563, lon: 100.5018, minZoom: 3, importance: 2 },
    { name: 'Jakarta', lat: -6.2088, lon: 106.8456, minZoom: 3, importance: 2 },
    { name: 'Manila', lat: 14.5995, lon: 120.9842, minZoom: 3, importance: 2 },
    { name: 'Kuala Lumpur', lat: 3.1390, lon: 101.6869, minZoom: 3, importance: 2 },
    { name: 'Singapore', lat: 1.3521, lon: 103.8198, minZoom: 3, importance: 2 },
    { name: 'Hanoi', lat: 21.0285, lon: 105.8542, minZoom: 3, importance: 2 },
    { name: 'Phnom Penh', lat: 11.5564, lon: 104.9282, minZoom: 3, importance: 2 },
    { name: 'Vientiane', lat: 17.9757, lon: 102.6331, minZoom: 3, importance: 2 },
    { name: 'Yangon', lat: 16.8661, lon: 96.1951, minZoom: 3, importance: 2 },
    { name: 'Dhaka', lat: 23.8103, lon: 90.4125, minZoom: 3, importance: 2 },
    { name: 'Kathmandu', lat: 27.7172, lon: 85.3240, minZoom: 3, importance: 2 },
    { name: 'Thimphu', lat: 27.4728, lon: 89.6393, minZoom: 3, importance: 2 },
    { name: 'Colombo', lat: 6.9271, lon: 79.8612, minZoom: 3, importance: 2 },
    { name: 'Islamabad', lat: 33.6844, lon: 73.0479, minZoom: 3, importance: 2 },
    { name: 'Kabul', lat: 34.5553, lon: 69.2075, minZoom: 3, importance: 2 },
    { name: 'Tehran', lat: 35.6892, lon: 51.3890, minZoom: 3, importance: 2 },
    { name: 'Baghdad', lat: 33.3128, lon: 44.3615, minZoom: 3, importance: 2 },
    { name: 'Riyadh', lat: 24.7136, lon: 46.6753, minZoom: 3, importance: 2 },
    { name: 'Kuwait City', lat: 29.3759, lon: 47.9774, minZoom: 3, importance: 2 },
    { name: 'Doha', lat: 25.2854, lon: 51.5310, minZoom: 3, importance: 2 },
    { name: 'Abu Dhabi', lat: 24.4539, lon: 54.3773, minZoom: 3, importance: 2 },
    { name: 'Muscat', lat: 23.5880, lon: 58.3829, minZoom: 3, importance: 2 },
    { name: 'Sanaa', lat: 15.3694, lon: 44.1910, minZoom: 3, importance: 2 },
    { name: 'Amman', lat: 31.9454, lon: 35.9284, minZoom: 3, importance: 2 },
    { name: 'Damascus', lat: 33.5138, lon: 36.2765, minZoom: 3, importance: 2 },
    { name: 'Beirut', lat: 33.8938, lon: 35.5018, minZoom: 3, importance: 2 },
    { name: 'Jerusalem', lat: 31.7683, lon: 35.2137, minZoom: 3, importance: 2 },
    { name: 'Taipei', lat: 25.0330, lon: 121.5654, minZoom: 3, importance: 2 },
    { name: 'Ulaanbaatar', lat: 47.8864, lon: 106.9057, minZoom: 3, importance: 2 },
    { name: 'Pyongyang', lat: 39.0392, lon: 125.7625, minZoom: 3, importance: 2 },
    { name: 'Tashkent', lat: 41.2995, lon: 69.2401, minZoom: 3, importance: 2 },
    { name: 'Bishkek', lat: 42.8746, lon: 74.5698, minZoom: 3, importance: 2 },
    { name: 'Dushanbe', lat: 38.5358, lon: 68.7791, minZoom: 3, importance: 2 },
    { name: 'Ashgabat', lat: 37.9601, lon: 58.3261, minZoom: 3, importance: 2 },
    { name: 'Nur-Sultan', lat: 51.1605, lon: 71.4704, minZoom: 3, importance: 2 },
    { name: 'Baku', lat: 40.4093, lon: 49.8671, minZoom: 3, importance: 2 },
    { name: 'Yerevan', lat: 40.1792, lon: 44.4991, minZoom: 3, importance: 2 },
    { name: 'Tbilisi', lat: 41.7151, lon: 44.8271, minZoom: 3, importance: 2 },
    { name: 'Malé', lat: 4.1755, lon: 73.5093, minZoom: 3, importance: 2 },
    { name: 'Bandar Seri Begawan', lat: 4.9031, lon: 114.9398, minZoom: 3, importance: 2 },
    { name: 'Dili', lat: -8.5569, lon: 125.5603, minZoom: 3, importance: 2 },
    
    // African Capitals (minZoom: 3, importance: 2 = regional capitals)
    { name: 'Abuja', lat: 9.0765, lon: 7.3986, minZoom: 3, importance: 2 },
    { name: 'Algiers', lat: 36.7372, lon: 3.0863, minZoom: 3, importance: 2 },
    { name: 'Luanda', lat: -8.8390, lon: 13.2894, minZoom: 3, importance: 2 },
    { name: 'Porto-Novo', lat: 6.4969, lon: 2.6289, minZoom: 3, importance: 2 },
    { name: 'Gaborone', lat: -24.6282, lon: 25.9231, minZoom: 3, importance: 2 },
    { name: 'Ouagadougou', lat: 12.3714, lon: -1.5197, minZoom: 3, importance: 2 },
    { name: 'Bujumbura', lat: -3.3731, lon: 29.3589, minZoom: 3, importance: 2 },
    { name: 'Yaoundé', lat: 3.8480, lon: 11.5021, minZoom: 3, importance: 2 },
    { name: 'Praia', lat: 14.9195, lon: -23.5087, minZoom: 3, importance: 2 },
    { name: 'Bangui', lat: 4.3947, lon: 18.5582, minZoom: 3, importance: 2 },
    { name: "N'Djamena", lat: 12.1348, lon: 15.0557, minZoom: 3, importance: 2 },
    { name: 'Moroni', lat: -11.7022, lon: 43.2551, minZoom: 3, importance: 2 },
    { name: 'Brazzaville', lat: -4.2634, lon: 15.2429, minZoom: 3, importance: 2 },
    { name: 'Kinshasa', lat: -4.4419, lon: 15.2663, minZoom: 3, importance: 2 },
    { name: 'Yamoussoukro', lat: 6.8276, lon: -5.2893, minZoom: 3, importance: 2 },
    { name: 'Djibouti', lat: 11.8251, lon: 42.5903, minZoom: 3, importance: 2 },
    { name: 'Malabo', lat: 3.7550, lon: 8.7371, minZoom: 3, importance: 2 },
    { name: 'Asmara', lat: 15.3229, lon: 38.9251, minZoom: 3, importance: 2 },
    { name: 'Addis Ababa', lat: 9.0320, lon: 38.7469, minZoom: 3, importance: 2 },
    { name: 'Libreville', lat: 0.4162, lon: 9.4673, minZoom: 3, importance: 2 },
    { name: 'Banjul', lat: 13.4549, lon: -16.5790, minZoom: 3, importance: 2 },
    { name: 'Accra', lat: 5.6037, lon: -0.1870, minZoom: 3, importance: 2 },
    { name: 'Conakry', lat: 9.6412, lon: -13.5784, minZoom: 3, importance: 2 },
    { name: 'Bissau', lat: 11.8619, lon: -15.5984, minZoom: 3, importance: 2 },
    { name: 'Nairobi', lat: -1.2921, lon: 36.8219, minZoom: 3, importance: 2 },
    { name: 'Maseru', lat: -29.3151, lon: 27.4869, minZoom: 3, importance: 2 },
    { name: 'Monrovia', lat: 6.3106, lon: -10.8048, minZoom: 3, importance: 2 },
    { name: 'Tripoli', lat: 32.8872, lon: 13.1913, minZoom: 3, importance: 2 },
    { name: 'Antananarivo', lat: -18.8792, lon: 47.5079, minZoom: 3, importance: 2 },
    { name: 'Lilongwe', lat: -13.9626, lon: 33.7741, minZoom: 3, importance: 2 },
    { name: 'Bamako', lat: 12.6392, lon: -8.0029, minZoom: 3, importance: 2 },
    { name: 'Nouakchott', lat: 18.0735, lon: -15.9582, minZoom: 3, importance: 2 },
    { name: 'Port Louis', lat: -20.1609, lon: 57.5012, minZoom: 3, importance: 2 },
    { name: 'Rabat', lat: 34.0209, lon: -6.8416, minZoom: 3, importance: 2 },
    { name: 'Maputo', lat: -25.9692, lon: 32.5732, minZoom: 3, importance: 2 },
    { name: 'Windhoek', lat: -22.5594, lon: 17.0832, minZoom: 3, importance: 2 },
    { name: 'Niamey', lat: 13.5127, lon: 2.1126, minZoom: 3, importance: 2 },
    { name: 'Kigali', lat: -1.9441, lon: 30.0619, minZoom: 3, importance: 2 },
    { name: 'São Tomé', lat: 0.3365, lon: 6.7273, minZoom: 3, importance: 2 },
    { name: 'Dakar', lat: 14.7167, lon: -17.4677, minZoom: 3, importance: 2 },
    { name: 'Victoria', lat: -4.6191, lon: 55.4513, minZoom: 3, importance: 2 },
    { name: 'Freetown', lat: 8.4657, lon: -13.2317, minZoom: 3, importance: 2 },
    { name: 'Mogadishu', lat: 2.0469, lon: 45.3182, minZoom: 3, importance: 2 },
    { name: 'Cape Town', lat: -33.9249, lon: 18.4241, minZoom: 3, importance: 2 },
    { name: 'Juba', lat: 4.8517, lon: 31.5825, minZoom: 3, importance: 2 },
    { name: 'Khartoum', lat: 15.5007, lon: 32.5599, minZoom: 3, importance: 2 },
    { name: 'Mbabane', lat: -26.3054, lon: 31.1367, minZoom: 3, importance: 2 },
    { name: 'Dodoma', lat: -6.1722, lon: 35.7395, minZoom: 3, importance: 2 },
    { name: 'Lomé', lat: 6.1375, lon: 1.2123, minZoom: 3, importance: 2 },
    { name: 'Tunis', lat: 36.8065, lon: 10.1815, minZoom: 3, importance: 2 },
    { name: 'Kampala', lat: 0.3476, lon: 32.5825, minZoom: 3, importance: 2 },
    { name: 'Lusaka', lat: -15.3875, lon: 28.3228, minZoom: 3, importance: 2 },
    { name: 'Harare', lat: -17.8252, lon: 31.0335, minZoom: 3, importance: 2 },
    
    // South American Capitals (minZoom: 3, importance: 2 = regional capitals)
    { name: 'Santiago', lat: -33.4489, lon: -70.6693, minZoom: 3, importance: 2 },
    { name: 'Lima', lat: -12.0464, lon: -77.0428, minZoom: 3, importance: 2 },
    { name: 'Bogotá', lat: 4.7110, lon: -74.0721, minZoom: 3, importance: 2 },
    { name: 'Caracas', lat: 10.4806, lon: -66.9036, minZoom: 3, importance: 2 },
    { name: 'Quito', lat: -0.1807, lon: -78.4678, minZoom: 3, importance: 2 },
    { name: 'La Paz', lat: -16.5000, lon: -68.1193, minZoom: 3, importance: 2 },
    { name: 'Asunción', lat: -25.2637, lon: -57.5759, minZoom: 3, importance: 2 },
    { name: 'Montevideo', lat: -34.9011, lon: -56.1645, minZoom: 3, importance: 2 },
    { name: 'Georgetown', lat: 6.8013, lon: -58.1551, minZoom: 3, importance: 2 },
    { name: 'Paramaribo', lat: 5.8520, lon: -55.2038, minZoom: 3, importance: 2 },
    { name: 'Cayenne', lat: 4.9227, lon: -52.3269, minZoom: 3, importance: 2 },
    
    // Oceanian Capitals (minZoom: 3, importance: 2 = regional capitals)
    { name: 'Wellington', lat: -41.2866, lon: 174.7756, minZoom: 3, importance: 2 },
    { name: 'Suva', lat: -18.1416, lon: 178.4415, minZoom: 3, importance: 2 },
    { name: 'Port Moresby', lat: -9.4438, lon: 147.1803, minZoom: 3, importance: 2 },
    { name: 'Honiara', lat: -9.4456, lon: 159.9729, minZoom: 3, importance: 2 },
    { name: 'Port Vila', lat: -17.7333, lon: 168.3273, minZoom: 3, importance: 2 },
    { name: 'Nouméa', lat: -22.2758, lon: 166.4581, minZoom: 3, importance: 2 },
    { name: 'Apia', lat: -13.8333, lon: -171.7667, minZoom: 3, importance: 2 },
    { name: "Nuku'alofa", lat: -21.1393, lon: -175.2026, minZoom: 3, importance: 2 },
    { name: 'Majuro', lat: 7.0897, lon: 171.3803, minZoom: 3, importance: 2 },
    { name: 'Funafuti', lat: -8.5208, lon: 179.1983, minZoom: 3, importance: 2 },
    { name: 'Tarawa', lat: 1.3291, lon: 172.9791, minZoom: 3, importance: 2 },
    { name: 'Yaren', lat: -0.5477, lon: 166.9209, minZoom: 3, importance: 2 },
    { name: 'Palikir', lat: 6.9248, lon: 158.1611, minZoom: 3, importance: 2 },
    { name: 'Ngerulmud', lat: 7.5004, lon: 134.6241, minZoom: 3, importance: 2 },
    
    // Caribbean Capitals (minZoom: 3, importance: 2 = regional capitals)
    { name: 'Havana', lat: 23.1136, lon: -82.3666, minZoom: 3, importance: 2 },
    { name: 'Santo Domingo', lat: 18.4861, lon: -69.9312, minZoom: 3, importance: 2 },
    { name: 'Port-au-Prince', lat: 18.5944, lon: -72.3074, minZoom: 3, importance: 2 },
    { name: 'Kingston', lat: 17.9714, lon: -76.7920, minZoom: 3, importance: 2 },
    { name: 'Nassau', lat: 25.0480, lon: -77.3554, minZoom: 3, importance: 2 },
    { name: 'Bridgetown', lat: 13.0969, lon: -59.6145, minZoom: 3, importance: 2 },
    { name: 'Castries', lat: 14.0101, lon: -60.9874, minZoom: 3, importance: 2 },
    { name: 'Kingstown', lat: 13.1600, lon: -61.2248, minZoom: 3, importance: 2 },
    { name: "St. George's", lat: 12.0540, lon: -61.7486, minZoom: 3, importance: 2 },
    { name: 'Port of Spain', lat: 10.6549, lon: -61.5019, minZoom: 3, importance: 2 },
    { name: "St. John's", lat: 17.1175, lon: -61.8456, minZoom: 3, importance: 2 },
    { name: 'Roseau', lat: 15.3017, lon: -61.3881, minZoom: 3, importance: 2 },
    { name: 'Basseterre', lat: 17.2948, lon: -62.7261, minZoom: 3, importance: 2 },
    
    // US State Capitals (minZoom: 4, importance: 1 = state/provincial capitals)
    { name: 'Montgomery', lat: 32.3792, lon: -86.3077, minZoom: 4, importance: 1 },
    { name: 'Juneau', lat: 58.3019, lon: -134.4197, minZoom: 4, importance: 1 },
    { name: 'Phoenix', lat: 33.4484, lon: -112.0740, minZoom: 4, importance: 1 },
    { name: 'Little Rock', lat: 34.7465, lon: -92.2896, minZoom: 4, importance: 1 },
    { name: 'Sacramento', lat: 38.5816, lon: -121.4944, minZoom: 4, importance: 1 },
    { name: 'Denver', lat: 39.7392, lon: -104.9903, minZoom: 4, importance: 1 },
    { name: 'Hartford', lat: 41.7658, lon: -72.6734, minZoom: 4, importance: 1 },
    { name: 'Dover', lat: 39.1582, lon: -75.5244, minZoom: 4, importance: 1 },
    { name: 'Tallahassee', lat: 30.4383, lon: -84.2807, minZoom: 4, importance: 1 },
    { name: 'Atlanta', lat: 33.7490, lon: -84.3880, minZoom: 4, importance: 1 },
    { name: 'Honolulu', lat: 21.3099, lon: -157.8581, minZoom: 4, importance: 1 },
    { name: 'Boise', lat: 43.6150, lon: -116.2023, minZoom: 4, importance: 1 },
    { name: 'Springfield', lat: 39.7817, lon: -89.6501, minZoom: 4, importance: 1 },
    { name: 'Indianapolis', lat: 39.7684, lon: -86.1581, minZoom: 4, importance: 1 },
    { name: 'Des Moines', lat: 41.5868, lon: -93.6250, minZoom: 4, importance: 1 },
    { name: 'Topeka', lat: 39.0473, lon: -95.6752, minZoom: 4, importance: 1 },
    { name: 'Frankfort', lat: 38.2009, lon: -84.8733, minZoom: 4, importance: 1 },
    { name: 'Baton Rouge', lat: 30.4515, lon: -91.1871, minZoom: 4, importance: 1 },
    { name: 'Augusta', lat: 44.3106, lon: -69.7795, minZoom: 4, importance: 1 },
    { name: 'Annapolis', lat: 38.9784, lon: -76.4922, minZoom: 4, importance: 1 },
    { name: 'Boston', lat: 42.3601, lon: -71.0589, minZoom: 4, importance: 1 },
    { name: 'Lansing', lat: 42.7335, lon: -84.5555, minZoom: 4, importance: 1 },
    { name: 'St. Paul', lat: 44.9537, lon: -93.0900, minZoom: 4, importance: 1 },
    { name: 'Jackson', lat: 32.2988, lon: -90.1848, minZoom: 4, importance: 1 },
    { name: 'Jefferson City', lat: 38.5767, lon: -92.1735, minZoom: 4, importance: 1 },
    { name: 'Helena', lat: 46.5884, lon: -112.0391, minZoom: 4, importance: 1 },
    { name: 'Lincoln', lat: 40.8136, lon: -96.7026, minZoom: 4, importance: 1 },
    { name: 'Carson City', lat: 39.1638, lon: -119.7674, minZoom: 4, importance: 1 },
    { name: 'Concord', lat: 43.2081, lon: -71.5376, minZoom: 4, importance: 1 },
    { name: 'Trenton', lat: 40.2171, lon: -74.7429, minZoom: 4, importance: 1 },
    { name: 'Santa Fe', lat: 35.6870, lon: -105.9378, minZoom: 4, importance: 1 },
    { name: 'Albany', lat: 42.6526, lon: -73.7562, minZoom: 4, importance: 1 },
    { name: 'Raleigh', lat: 35.7796, lon: -78.6382, minZoom: 4, importance: 1 },
    { name: 'Bismarck', lat: 46.8083, lon: -100.7837, minZoom: 4, importance: 1 },
    { name: 'Columbus', lat: 39.9612, lon: -82.9988, minZoom: 4, importance: 1 },
    { name: 'Oklahoma City', lat: 35.4676, lon: -97.5164, minZoom: 4, importance: 1 },
    { name: 'Salem', lat: 44.9429, lon: -123.0351, minZoom: 4, importance: 1 },
    { name: 'Harrisburg', lat: 40.2732, lon: -76.8867, minZoom: 4, importance: 1 },
    { name: 'Providence', lat: 41.8240, lon: -71.4128, minZoom: 4, importance: 1 },
    { name: 'Columbia', lat: 34.0007, lon: -81.0348, minZoom: 4, importance: 1 },
    { name: 'Pierre', lat: 44.3668, lon: -100.3538, minZoom: 4, importance: 1 },
    { name: 'Nashville', lat: 36.1627, lon: -86.7816, minZoom: 4, importance: 1 },
    { name: 'Austin', lat: 30.2672, lon: -97.7431, minZoom: 4, importance: 1 },
    { name: 'Salt Lake City', lat: 40.7608, lon: -111.8910, minZoom: 4, importance: 1 },
    { name: 'Montpelier', lat: 44.2601, lon: -72.5806, minZoom: 4, importance: 1 },
    { name: 'Richmond', lat: 37.5407, lon: -77.4360, minZoom: 4, importance: 1 },
    { name: 'Olympia', lat: 47.0379, lon: -122.9007, minZoom: 4, importance: 1 },
    { name: 'Charleston', lat: 38.3498, lon: -81.6326, minZoom: 4, importance: 1 },
    { name: 'Madison', lat: 43.0731, lon: -89.4012, minZoom: 4, importance: 1 },
    { name: 'Cheyenne', lat: 41.1400, lon: -104.8202, minZoom: 4, importance: 1 },
    
    // Canadian Provincial/Territorial Capitals (minZoom: 4, importance: 1 = state/provincial capitals)
    { name: 'Toronto', lat: 43.6532, lon: -79.3832, minZoom: 3, importance: 1 },
    { name: 'Quebec City', lat: 46.8139, lon: -71.2080, minZoom: 4, importance: 1 },
    { name: 'Edmonton', lat: 53.5461, lon: -113.4938, minZoom: 4, importance: 1 },
    { name: 'Victoria', lat: 48.4284, lon: -123.3656, minZoom: 4, importance: 1 },
    { name: 'Winnipeg', lat: 49.8951, lon: -97.1384, minZoom: 4, importance: 1 },
    { name: 'Halifax', lat: 44.6488, lon: -63.5752, minZoom: 4, importance: 1 },
    { name: 'Fredericton', lat: 45.9636, lon: -66.6431, minZoom: 4, importance: 1 },
    { name: "St. John's", lat: 47.5615, lon: -52.7126, minZoom: 4, importance: 1 },
    { name: 'Charlottetown', lat: 46.2382, lon: -63.1311, minZoom: 4, importance: 1 },
    { name: 'Regina', lat: 50.4452, lon: -104.6189, minZoom: 4, importance: 1 },
    { name: 'Whitehorse', lat: 60.7212, lon: -135.0568, minZoom: 4, importance: 1 },
    { name: 'Yellowknife', lat: 62.4540, lon: -114.3718, minZoom: 4, importance: 1 },
    { name: 'Iqaluit', lat: 63.7467, lon: -68.5170, minZoom: 4, importance: 1 },
    
    // Major Non-Capital Cities (minZoom: 2-3, importance: 2-3 based on city size)
    { name: 'New York', lat: 40.7128, lon: -74.0060, minZoom: 2, importance: 3 },
    { name: 'Los Angeles', lat: 34.0522, lon: -118.2437, minZoom: 2, importance: 3 },
    { name: 'Chicago', lat: 41.8781, lon: -87.6298, minZoom: 3, importance: 2 },
    { name: 'Houston', lat: 29.7604, lon: -95.3698, minZoom: 3, importance: 2 },
    { name: 'Vancouver', lat: 49.2827, lon: -123.1207, minZoom: 3, importance: 2 },
    { name: 'Montreal', lat: 45.5017, lon: -73.5673, minZoom: 3, importance: 2 },
    { name: 'São Paulo', lat: -23.5505, lon: -46.6333, minZoom: 2, importance: 3 },
    { name: 'Rio de Janeiro', lat: -22.9068, lon: -43.1729, minZoom: 3, importance: 2 },
    { name: 'Shanghai', lat: 31.2304, lon: 121.4737, minZoom: 2, importance: 3 },
    { name: 'Mumbai', lat: 19.0760, lon: 72.8777, minZoom: 2, importance: 3 },
    { name: 'Istanbul', lat: 41.0082, lon: 28.9784, minZoom: 3, importance: 2 },
    { name: 'Lagos', lat: 6.5244, lon: 3.3792, minZoom: 3, importance: 2 },
    { name: 'Sydney', lat: -33.8688, lon: 151.2093, minZoom: 2, importance: 3 },
    { name: 'Melbourne', lat: -37.8136, lon: 144.9631, minZoom: 3, importance: 2 },
    { name: 'Dubai', lat: 25.2048, lon: 55.2708, minZoom: 3, importance: 2 },
    { name: 'Hong Kong', lat: 22.3193, lon: 114.1694, minZoom: 3, importance: 2 },
    { name: 'Barcelona', lat: 41.3851, lon: 2.1734, minZoom: 3, importance: 2 },
    { name: 'Munich', lat: 48.1351, lon: 11.5820, minZoom: 3, importance: 2 },
    { name: 'Milan', lat: 45.4642, lon: 9.1900, minZoom: 3, importance: 2 },
    { name: 'St. Petersburg', lat: 59.9311, lon: 30.3609, minZoom: 3, importance: 2 },
    { name: 'Johannesburg', lat: -26.2041, lon: 28.0473, minZoom: 2, importance: 3 },
    { name: 'Casablanca', lat: 33.5731, lon: -7.5898, minZoom: 3, importance: 2 },
    { name: 'Karachi', lat: 24.8607, lon: 67.0011, minZoom: 3, importance: 2 },
    { name: 'Kolkata', lat: 22.5726, lon: 88.3639, minZoom: 3, importance: 2 },
    { name: 'Osaka', lat: 34.6937, lon: 135.5023, minZoom: 3, importance: 2 },
    { name: 'Guadalajara', lat: 20.6597, lon: -103.3496, minZoom: 3, importance: 2 },
    { name: 'Monterrey', lat: 25.6866, lon: -100.3161, minZoom: 3, importance: 2 },
    { name: 'Perth', lat: -31.9505, lon: 115.8605, minZoom: 3, importance: 2 },
    { name: 'Brisbane', lat: -27.4698, lon: 153.0251, minZoom: 3, importance: 2 },
    { name: 'Auckland', lat: -36.8485, lon: 174.7633, minZoom: 3, importance: 2 },
    { name: 'Cape Town', lat: -33.9249, lon: 18.4241, minZoom: 3, importance: 2 },
    { name: 'Tel Aviv', lat: 32.0853, lon: 34.7818, minZoom: 3, importance: 2 },
    { name: 'Frankfurt', lat: 50.1109, lon: 8.6821, minZoom: 3, importance: 2 },
    { name: 'Zurich', lat: 47.3769, lon: 8.5417, minZoom: 3, importance: 2 },
    { name: 'Geneva', lat: 46.2044, lon: 6.1432, minZoom: 3, importance: 2 },
    { name: 'Hamburg', lat: 53.5511, lon: 9.9937, minZoom: 3, importance: 2 },
    { name: 'Manchester', lat: 53.4808, lon: -2.2426, minZoom: 3, importance: 2 },
    { name: 'Birmingham', lat: 52.4862, lon: -1.8904, minZoom: 3, importance: 2 },
    { name: 'Glasgow', lat: 55.8642, lon: -4.2518, minZoom: 3, importance: 2 },
    { name: 'Edinburgh', lat: 55.9533, lon: -3.1883, minZoom: 3, importance: 2 },
    { name: 'Lyon', lat: 45.7640, lon: 4.8357, minZoom: 3, importance: 2 },
    { name: 'Marseille', lat: 43.2965, lon: 5.3698, minZoom: 3, importance: 2 },
    { name: 'Valencia', lat: 39.4699, lon: -0.3763, minZoom: 3, importance: 2 },
    { name: 'Seville', lat: 37.3886, lon: -5.9823, minZoom: 3, importance: 2 },
    { name: 'Porto', lat: 41.1579, lon: -8.6291, minZoom: 3, importance: 2 },
    { name: 'Naples', lat: 40.8518, lon: 14.2681, minZoom: 3, importance: 2 },
    { name: 'Turin', lat: 45.0703, lon: 7.6869, minZoom: 3, importance: 2 },
    { name: 'Kraków', lat: 50.0647, lon: 19.9450, minZoom: 3, importance: 2 },
    { name: 'Rotterdam', lat: 51.9244, lon: 4.4777, minZoom: 3, importance: 2 },
    { name: 'Antwerp', lat: 51.2194, lon: 4.4025, minZoom: 3, importance: 2 },
    { name: 'Copenhagen', lat: 55.6761, lon: 12.5683, minZoom: 3, importance: 2 },
    { name: 'Gothenburg', lat: 57.7089, lon: 11.9746, minZoom: 3, importance: 2 },
    { name: 'Oslo', lat: 59.9139, lon: 10.7522, minZoom: 3, importance: 2 },
    { name: 'Bergen', lat: 60.3913, lon: 5.3221, minZoom: 3, importance: 2 }
  ], []);

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

  // Address-family split for the peers.dat panel
  const ipCounts = useMemo(() => {
    const counts = { v4: 0, v6: 0 };
    for (const node of nodesData) {
      if ((node.ip || '').includes(':')) counts.v6 += 1;
      else counts.v4 += 1;
    }
    return counts;
  }, [nodesData]);

  const countryCount = useMemo(
    () => Object.keys(nodesByCountry).filter(country => country !== 'Unknown').length,
    [nodesByCountry]
  );

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
  // Total node count across all known countries (excludes ungeolocated)
  const totalCountryNodes = useMemo(
    () => Object.entries(nodesByCountry)
      .filter(([country]) => country !== 'Unknown')
      .reduce((acc, [, count]) => acc + count, 0),
    [nodesByCountry]
  );

  const totalCountries = useMemo(
    () => Object.keys(nodesByCountry).filter((country) => country !== 'Unknown').length,
    [nodesByCountry]
  );

  // Top N countries by node count, tagged with continent + share of total
  const topCountries = useMemo(() => {
    const ranked = Object.entries(nodesByCountry)
      .filter(([country]) => country !== 'Unknown')
      .sort(([, a], [, b]) => b - a)
      .slice(0, TOP_COUNTRIES_LIMIT);
    const maxCount = ranked.length ? ranked[0][1] : 0;
    return ranked.map(([country, count]) => ({
      country,
      count,
      continent: getContinentForCountry(country),
      percent: totalCountryNodes > 0 ? (count / totalCountryNodes) * 100 : 0,
      barPct: maxCount > 0 ? (count / maxCount) * 100 : 0
    }));
  }, [nodesByCountry, totalCountryNodes]);

  // Continent totals for the summary strip (sorted desc)
  const continentSummary = useMemo(() => {
    const sums = {};
    for (const [country, count] of Object.entries(nodesByCountry)) {
      if (country === 'Unknown') continue;
      const continent = getContinentForCountry(country);
      sums[continent] = (sums[continent] || 0) + count;
    }
    return Object.entries(sums)
      .sort(([, a], [, b]) => b - a)
      .map(([continent, count]) => ({ continent, count }));
  }, [nodesByCountry]);

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
        border: `1px solid ${isTestnet ? 'rgba(230, 81, 0, 0.2)' : 'rgba(0, 35, 82, 0.1)'}`,
        transition: 'transform 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
        }
      }}
    >
      <CardContent sx={{ py: 4, textAlign: 'center' }}>
        {isTestnet && (
          <Chip
            label="TESTNET"
            sx={{
              mb: 2,
              bgcolor: networkTheme?.primary || '#e65100',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '0.85rem'
            }}
          />
        )}
        {/* Page title with animated icon */}
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
          <RouterIcon sx={{
            fontSize: { xs: '2rem', sm: '2.3rem', md: '2.5rem' },
            color: networkTheme?.primary || '#002352',
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
              color: networkTheme?.primary || '#002352',
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
          wallet since the wallet node was upgraded to a v8.26 pre-release build on Aug 29th, 2025
          (the node now runs DigiByte Core v9.26.4).
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
   * WorldMapSection - Interactive world map showing node distribution
   * Uses D3.js with Mercator projection to display geographic node locations
   */
  const WorldMapSection = () => {
    const svgRef = useRef(null);
    const [currentTransform, setCurrentTransform] = useState(zoomIdentity);
    const [isDragging, setIsDragging] = useState(false);
    const [hoveredCountry, setHoveredCountry] = useState(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    
    // Store the transform in a ref to persist across re-renders
    const transformRef = useRef(zoomIdentity);
    
    // Calculate visible bounds for viewport culling
    const visibleBounds = useMemo(() => {
      const padding = 50; // Extra padding to ensure smooth transitions
      const invertedTopLeft = currentTransform.invert([0 - padding, 0 - padding]);
      const invertedBottomRight = currentTransform.invert([
        containerWidth + padding, 
        containerHeight + padding
      ]);
      
      return {
        minX: invertedTopLeft[0],
        minY: invertedTopLeft[1],
        maxX: invertedBottomRight[0],
        maxY: invertedBottomRight[1]
      };
    }, [currentTransform, containerWidth, containerHeight]);
    
    // Filter visible nodes for performance
    const visibleNodes = useMemo(() => {
      return validNodes.filter(node => {
        const coords = projection([node.lon, node.lat]);
        if (!coords) return false;
        const [x, y] = coords;
        return x >= visibleBounds.minX && 
               x <= visibleBounds.maxX && 
               y >= visibleBounds.minY && 
               y <= visibleBounds.maxY;
      });
    }, [validNodes, projection, visibleBounds]);
    
    // Filter visible cities with collision detection
    const visibleCities = useMemo(() => {
      const filteredCities = majorCities
        .filter(city => currentTransform.k >= city.minZoom)
        .filter(city => {
          const coords = projection([city.lon, city.lat]);
          if (!coords) return false;
          const [x, y] = coords;
          return x >= visibleBounds.minX && 
                 x <= visibleBounds.maxX && 
                 y >= visibleBounds.minY && 
                 y <= visibleBounds.maxY;
        })
        .map(city => {
          const coords = projection([city.lon, city.lat]);
          return { ...city, x: coords[0], y: coords[1] };
        });
      
      // Sort by importance (highest first) and then by name for consistent ordering
      filteredCities.sort((a, b) => {
        const importanceA = a.importance || 2;
        const importanceB = b.importance || 2;
        if (importanceA !== importanceB) {
          return importanceB - importanceA; // Higher importance first
        }
        return a.name.localeCompare(b.name);
      });
      
      // Collision detection - keep only non-overlapping labels
      const nonOverlapping = [];
      const labelPadding = 40; // Minimum distance between labels
      
      for (const city of filteredCities) {
        let hasCollision = false;
        
        // Check collision with already placed cities
        for (const placed of nonOverlapping) {
          const dx = Math.abs(city.x - placed.x);
          const dy = Math.abs(city.y - placed.y);
          
          // Adjust padding based on zoom level - tighter at higher zoom
          const adjustedPadding = labelPadding / Math.sqrt(currentTransform.k);
          
          if (dx < adjustedPadding && dy < adjustedPadding) {
            hasCollision = true;
            break;
          }
        }
        
        if (!hasCollision) {
          nonOverlapping.push(city);
        }
      }
      
      return nonOverlapping;
    }, [majorCities, projection, visibleBounds, currentTransform.k]);
    
    // Initialize zoom behavior
    useEffect(() => {
      if (!svgRef.current) return;
      
      const svg = select(svgRef.current);
      
      // Create zoom behavior with optimized handler
      let animationFrame = null;
      const zoomBehavior = d3Zoom()
        .scaleExtent([1, 8]) // Min zoom 1x, max zoom 8x
        .translateExtent([
          [-containerWidth * 0.5, -containerHeight * 0.5],
          [containerWidth * 1.5, containerHeight * 1.5]
        ])
        .on('start', () => {
          setIsDragging(true);
        })
        .on('zoom', (event) => {
          // Use requestAnimationFrame for smoother performance
          if (animationFrame) {
            cancelAnimationFrame(animationFrame);
          }
          animationFrame = requestAnimationFrame(() => {
            setCurrentTransform(event.transform);
            transformRef.current = event.transform;
          });
        })
        .on('end', () => {
          setIsDragging(false);
        });
      
      // Apply zoom behavior to SVG
      svg.call(zoomBehavior);
      
      // Restore previous zoom transform if it exists
      if (transformRef.current && transformRef.current !== zoomIdentity) {
        svg.call(zoomBehavior.transform, transformRef.current);
      }
      
      // Add zoom controls handlers with memoization
      const handleZoomIn = () => {
        svg.transition().duration(300).call(zoomBehavior.scaleBy, 1.5);
      };
      
      const handleZoomOut = () => {
        svg.transition().duration(300).call(zoomBehavior.scaleBy, 0.75);
      };
      
      const handleResetZoom = () => {
        svg.transition().duration(300).call(zoomBehavior.transform, zoomIdentity);
        transformRef.current = zoomIdentity;
      };
      
      // Attach to window for button access
      window.handleZoomIn = handleZoomIn;
      window.handleZoomOut = handleZoomOut;
      window.handleResetZoom = handleResetZoom;
      
      // Cleanup
      return () => {
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
        }
        delete window.handleZoomIn;
        delete window.handleZoomOut;
        delete window.handleResetZoom;
      };
    }, []);
    
    return (
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
        
        {/* SVG map container with zoom controls */}
        <Box 
          className="map-container" 
          sx={{ 
            border: '1px solid rgba(0,0,0,0.1)', 
            borderRadius: '12px', 
            overflow: 'hidden', 
            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)',
            bgcolor: '#f7f9fc',
            p: 1,
            backgroundImage: 'radial-gradient(circle at center, #f9fbff 0%, #f0f5fd 100%)',
            position: 'relative'
          }}
        >
          {/* Zoom Controls */}
          <Box sx={{ 
            position: 'absolute', 
            top: 10, 
            right: 10, 
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 1
          }}>
            <Paper 
              elevation={2} 
              sx={{ 
                p: 0.5, 
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
                bgcolor: 'rgba(255, 255, 255, 0.9)'
              }}
            >
              <Box
                component="button"
                onClick={() => window.handleZoomIn?.()}
                sx={{
                  border: 'none',
                  bgcolor: 'transparent',
                  cursor: 'pointer',
                  p: 0.5,
                  borderRadius: '4px',
                  '&:hover': { bgcolor: 'action.hover' },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Zoom In"
              >
                <ZoomInIcon sx={{ fontSize: 20, color: 'action.active' }} />
              </Box>
              <Divider />
              <Box
                component="button"
                onClick={() => window.handleResetZoom?.()}
                sx={{
                  border: 'none',
                  bgcolor: 'transparent',
                  cursor: 'pointer',
                  p: 0.5,
                  borderRadius: '4px',
                  '&:hover': { bgcolor: 'action.hover' },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Reset Zoom"
              >
                <RestartAltIcon sx={{ fontSize: 20, color: 'action.active' }} />
              </Box>
              <Divider />
              <Box
                component="button"
                onClick={() => window.handleZoomOut?.()}
                sx={{
                  border: 'none',
                  bgcolor: 'transparent',
                  cursor: 'pointer',
                  p: 0.5,
                  borderRadius: '4px',
                  '&:hover': { bgcolor: 'action.hover' },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Zoom Out"
              >
                <ZoomOutIcon sx={{ fontSize: 20, color: 'action.active' }} />
              </Box>
            </Paper>
          </Box>
          
          <svg 
            ref={svgRef}
            width={containerWidth} 
            height={containerHeight}
            style={{ display: 'block', cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            {/* Map background */}
            <rect width={containerWidth} height={containerHeight} fill="#f7f9fc" fillOpacity={0.8} />
            
            {/* Zoomable content group */}
            <g transform={currentTransform.toString()}>
              {/* Geographic grid lines */}
              <path
                d={pathGenerator(geoGraticule10())}
                fill="none"
                stroke="#DDD"
                strokeWidth={0.5}
                opacity={0.3}
              />

              {/* Country boundaries */}
              {worldData.features.map((feat, i) => {
                const pathData = pathGenerator(feat);
                // Skip if pathGenerator returns invalid data
                if (!pathData || typeof pathData !== 'string') return null;
                
                return (
                  <path
                    key={`country-${i}`}
                    d={pathData}
                    fill="#e0e0e0"
                    stroke="#bdbdbd"
                    strokeWidth={0.5}
                    style={{
                      transition: 'fill 0.3s ease',
                      ':hover': { fill: '#c9c9c9' }
                    }}
                  />
                );
              })}

              {/* US State boundaries - only visible at zoom level >= 3 */}
              {currentTransform.k >= 3 && usStatesData.features.map((state, i) => {
                // Check if state is within visible bounds for performance
                const bounds = pathGenerator.bounds(state);
                if (!bounds) return null;
                
                const [[x1, y1], [x2, y2]] = bounds;
                const stateVisible = 
                  x2 >= visibleBounds.minX && 
                  x1 <= visibleBounds.maxX && 
                  y2 >= visibleBounds.minY && 
                  y1 <= visibleBounds.maxY;
                
                if (!stateVisible) return null;
                
                const statePathData = pathGenerator(state);
                // Skip if pathGenerator returns invalid data
                if (!statePathData || typeof statePathData !== 'string') return null;
                
                return (
                  <path
                    key={`state-${i}`}
                    d={statePathData}
                    fill="none"
                    stroke="#888888"
                    strokeWidth={0.3 / currentTransform.k}
                    strokeDasharray="2,1"
                    opacity={0.6}
                    style={{
                      pointerEvents: 'none'
                    }}
                  />
                );
              })}

              {/* Node location markers (only visible ones for performance) */}
              {visibleNodes.map((node, i) => {
                const coords = projection([node.lon, node.lat]);
                if (!coords) return null;
                const [x, y] = coords;
                if (isNaN(x) || isNaN(y)) return null;
                
                // Keep node icons at constant size regardless of zoom level
                const baseNodeSize = 16;
                const nodeScale = 1 / currentTransform.k;
                const nodeSize = baseNodeSize * nodeScale;
                const offset = nodeSize / 2;
                
                return (
                  <g key={`node-${i}`} transform={`translate(${x - offset}, ${y - offset})`}>
                    <image 
                      href={digibyteIcon} 
                      width={nodeSize} 
                      height={nodeSize} 
                      style={{ 
                        filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.3))',
                        animation: 'pulse 2s infinite',
                      }}
                    />
                  </g>
                );
              })}
              
              {/* City labels that appear at higher zoom levels (only visible ones) */}
              {visibleCities.map((city, i) => {
                  const coords = projection([city.lon, city.lat]);
                  if (!coords) return null;
                  const [x, y] = coords;
                  if (isNaN(x) || isNaN(y)) return null;
                  
                  // Keep city labels at constant size regardless of zoom level
                  const baseFontSize = {
                    1: 12,  // State/provincial capitals
                    2: 14,  // Regional capitals
                    3: 16   // Major world capitals
                  };
                  
                  // Get base size based on importance (default to 2 if not set)
                  const importance = city.importance || 2;
                  const base = baseFontSize[importance] || baseFontSize[2];
                  
                  // Scale inversely with zoom to maintain constant visual size
                  const fontSize = base / currentTransform.k;
                  
                  // Calculate dot size based on importance and scale inversely with zoom
                  const baseDotRadius = importance === 3 ? 3 : importance === 2 ? 2.5 : 2;
                  const dotRadius = baseDotRadius / currentTransform.k;
                  
                  return (
                    <g key={`city-${i}`} transform={`translate(${x}, ${y})`}>
                      {/* City dot */}
                      <circle
                        r={dotRadius}
                        fill="#333"
                        stroke="#fff"
                        strokeWidth={0.5}
                      />
                      {/* City label with background halo */}
                      <text
                        x={dotRadius + 3}
                        y={-2}
                        fontSize={fontSize}
                        fontFamily="Arial, sans-serif"
                        fontWeight={importance === 3 ? "bold" : importance === 2 ? "600" : "normal"}
                        fill="#333"
                        stroke="#fff"
                        strokeWidth={3}
                        strokeLinejoin="round"
                        paintOrder="stroke"
                        style={{ userSelect: 'none' }}
                      >
                        {city.name}
                      </text>
                      {/* Duplicate text for better readability */}
                      <text
                        x={dotRadius + 3}
                        y={-2}
                        fontSize={fontSize}
                        fontFamily="Arial, sans-serif"
                        fontWeight={importance === 3 ? "bold" : importance === 2 ? "600" : "normal"}
                        fill="#333"
                        style={{ userSelect: 'none' }}
                      >
                        {city.name}
                      </text>
                    </g>
                  );
                })}
              
              {/* Country labels that appear at appropriate zoom levels */}
              {currentTransform.k >= 2 && worldData.features.map((feat, i) => {
                const countryName = feat.properties?.name;
                if (!countryName) return null;
                
                // Skip small countries at lower zoom levels
                const countryArea = geoPath().projection(null).area(feat);
                const minAreaForZoom = {
                  2: 5000,  // Only show large countries
                  3: 1000,  // Show medium countries
                  4: 200,   // Show smaller countries
                  5: 50     // Show all countries
                };
                
                const minArea = minAreaForZoom[Math.floor(currentTransform.k)] || 0;
                if (countryArea < minArea) return null;
                
                // Get centroid for label placement
                const centroid = pathGenerator.centroid(feat);
                if (!centroid || isNaN(centroid[0]) || isNaN(centroid[1])) return null;
                
                // Check if country is visible
                const [x, y] = centroid;
                if (x < visibleBounds.minX || x > visibleBounds.maxX ||
                    y < visibleBounds.minY || y > visibleBounds.maxY) return null;
                
                // Calculate font size based on zoom and country importance
                const hasNodes = nodesByCountry[countryName];
                const baseFontSize = hasNodes ? 14 : 12;
                const fontSize = baseFontSize / Math.sqrt(currentTransform.k);
                
                // Special handling for country names that might overlap
                const labelOffsets = {
                  'Russia': { x: 0, y: -30 },
                  'Canada': { x: 0, y: -20 },
                  'United States of America': { x: 0, y: 10 },
                  'China': { x: 0, y: 0 },
                  'Brazil': { x: 0, y: 0 },
                  'Australia': { x: 0, y: 0 },
                  'Kazakhstan': { x: 0, y: 0 },
                  'India': { x: 0, y: 0 }
                };
                
                const offset = labelOffsets[countryName] || { x: 0, y: 0 };
                
                return (
                  <g key={`country-label-${i}`} transform={`translate(${x + offset.x}, ${y + offset.y})`}>
                    {/* Background for better readability */}
                    <text
                      fontSize={fontSize}
                      fontFamily="Arial, sans-serif"
                      fontWeight={hasNodes ? "600" : "normal"}
                      fill="#333"
                      stroke="white"
                      strokeWidth={3}
                      strokeLinejoin="round"
                      paintOrder="stroke"
                      textAnchor="middle"
                      style={{ 
                        userSelect: 'none',
                        pointerEvents: 'none',
                        opacity: currentTransform.k >= 3 ? 0.9 : 0.7
                      }}
                    >
                      {countryName.toUpperCase()}
                    </text>
                    {/* Foreground text */}
                    <text
                      fontSize={fontSize}
                      fontFamily="Arial, sans-serif"
                      fontWeight={hasNodes ? "600" : "normal"}
                      fill="#333"
                      textAnchor="middle"
                      style={{ 
                        userSelect: 'none',
                        pointerEvents: 'none',
                        opacity: currentTransform.k >= 3 ? 0.9 : 0.7
                      }}
                    >
                      {countryName.toUpperCase()}
                    </text>
                    {/* Node count for countries with nodes */}
                    {hasNodes && currentTransform.k >= 3 && (
                      <text
                        fontSize={fontSize * 0.8}
                        fontFamily="Arial, sans-serif"
                        fill="#0066cc"
                        textAnchor="middle"
                        y={fontSize + 2}
                        style={{ 
                          userSelect: 'none',
                          pointerEvents: 'none'
                        }}
                      >
                        ({nodesByCountry[countryName]} nodes)
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
          
          {/* Hover tooltip */}
          {hoveredCountry && (
            <Paper
              elevation={3}
              sx={{
                position: 'absolute',
                left: mousePosition.x + 20,
                top: mousePosition.y - 10,
                zIndex: 20,
                p: 1,
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                color: 'white',
                borderRadius: '4px',
                pointerEvents: 'none',
                whiteSpace: 'nowrap'
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {hoveredCountry}
              </Typography>
              {nodesByCountry[hoveredCountry] && (
                <Typography variant="caption">
                  {nodesByCountry[hoveredCountry]} nodes
                </Typography>
              )}
            </Paper>
          )}
        </Box>
        
        {/* Map legend and instructions */}
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
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
                DigiByte Node
              </Typography>
            </Box>
            <Box 
              component="span"
              sx={{ 
                display: 'inline-flex', 
                alignItems: 'center',
                bgcolor: 'rgba(51, 51, 51, 0.1)',
                borderRadius: '50px',
                px: 2,
                py: 0.5
              }}
            >
              <Box sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                bgcolor: '#333', 
                mr: 1 
              }} />
              <Typography variant="body2" sx={{ color: '#333', fontWeight: 'medium' }}>
                Major City
              </Typography>
            </Box>
          </Box>
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block', 
              textAlign: 'center', 
              mt: 1, 
              color: '#666' 
            }}
          >
            Drag to pan • Scroll to zoom • Cities appear at higher zoom levels • US state boundaries visible at 3x+ zoom
          </Typography>
        </Box>
      </CardContent>
    </Card>
    );
  };

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
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 0.5 }}>
          <FlagIcon sx={{ fontSize: '1.8rem', color: '#0066cc', mr: 1 }} />
          <Typography
            variant="h5"
            fontWeight="bold"
            sx={{ color: '#002352', letterSpacing: '0.5px', textAlign: 'center' }}
          >
            Nodes by Country
          </Typography>
        </Box>

        <Typography
          variant="caption"
          component="p"
          sx={{ textAlign: 'center', color: '#777', mb: 2 }}
        >
          {totalCountries > TOP_COUNTRIES_LIMIT
            ? `Top ${TOP_COUNTRIES_LIMIT} of ${totalCountries} countries with geolocated nodes`
            : `${totalCountries} countries with geolocated nodes`}
        </Typography>

        <Divider sx={{ maxWidth: '120px', mx: 'auto', mb: 3, borderColor: '#0066cc', borderWidth: 1 }} />

        {/* Continent summary strip */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mb: 3 }}>
          {continentSummary.map(({ continent, count }) => (
            <Chip
              key={continent}
              label={`${continent} · ${count.toLocaleString()}`}
              sx={{
                fontWeight: 600,
                color: getContinentColor(continent),
                bgcolor: `${getContinentColor(continent)}15`,
                border: `1px solid ${getContinentColor(continent)}40`
              }}
            />
          ))}
        </Box>

        {/* Top countries leaderboard — two balanced columns on desktop */}
        <Grid container spacing={{ xs: 1, md: 3 }} columnSpacing={{ md: 4 }}>
          {topCountries.map(({ country, count, continent, percent, barPct }, index) => (
            <Grid item xs={12} md={6} key={country}>
              <Box
                data-testid="country-row"
                sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75 }}
              >
                <Typography
                  variant="body2"
                  sx={{ color: '#9aa5b1', fontWeight: 700, width: 26, textAlign: 'right', flexShrink: 0 }}
                >
                  {index + 1}
                </Typography>
                <Box
                  sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: getContinentColor(continent), flexShrink: 0 }}
                  title={continent}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}>
                    <Typography
                      variant="body2"
                      title={getCountryName(country)}
                      sx={{ fontWeight: 600, color: '#002352', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {getCountryName(country)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexShrink: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#002352' }}>
                        {count.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#888', minWidth: 42, textAlign: 'right' }}>
                        {formatPercent(percent)}
                      </Typography>
                    </Box>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.max(2, Math.min(barPct, 100))}
                    sx={{
                      mt: 0.5,
                      height: 5,
                      borderRadius: '3px',
                      backgroundColor: '#eef1f5',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getContinentColor(continent),
                        borderRadius: '3px'
                      }
                    }}
                  />
                </Box>
              </Box>
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

        {/* Why the two panels disagree */}
        <MethodologyNote />

        {/* Two-methodology dashboard: passive peers.dat stats on the left,
            active crawler 24h breakdown on the right; stacks on mobile */}
        <Grid container spacing={3} alignItems="stretch" sx={{ mb: 4 }}>
          <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
            <PeersDatPanel
              loading={loading}
              knownCount={nodesData.length}
              geoCount={validNodes.length}
              countryCount={countryCount}
              ipv4Count={ipCounts.v4}
              ipv6Count={ipCounts.v6}
              addrman={addrmanInfo}
              accentColor={versionAccentColor}
            />
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
            <NodesLast24HoursSection versionData={versionData} accentColor={versionAccentColor} />
          </Grid>
        </Grid>

        {/* Interactive world map (only shown when data is loaded) */}
        {!loading && <WorldMapSection />}

        {/* Country leaderboard (only shown when data is loaded) */}
        {!loading && <CountriesListSection />}

        {/* Educational information about nodes */}
        <NetworkInfoSection />
      </Container>
    </Box>
  );
};

export default NodesPage;