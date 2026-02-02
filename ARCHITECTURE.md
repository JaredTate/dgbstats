# DigiByte Stats - Technical Architecture

## Executive Summary

DigiByte Stats is a **real-time blockchain analytics platform** providing comprehensive statistics, visualizations, and network monitoring for the DigiByte blockchain. The platform delivers:

- **Real-Time Block Explorer**: Live block updates with algorithm identification and mining pool detection
- **Network Monitoring**: Geographic visualization of 1,000+ peer nodes worldwide
- **Mining Analytics**: Multi-algorithm hashrate tracking, difficulty charts, and pool distribution
- **Supply Economics**: Circulating supply tracking with emission projections through 2035
- **Future Roadmap**: DigiDollar stablecoin blueprint and development timeline

## System Overview

DigiByte Stats is a **modern React web application** powered by real-time WebSocket connections to a Node.js backend that interfaces directly with a DigiByte full node via RPC.

```
                    DigiByte Stats Architecture
                    ═══════════════════════════

    User Browser → React SPA → WebSocket → Node.js Backend → DigiByte Node
         ↓              ↓           ↓              ↓              ↓
    Responsive UI   MUI Theme   Real-time    REST API      RPC Commands
    D3.js/Chart.js  React Router  Updates     Express      Blockchain Data
```

## Network Support (Mainnet/Testnet)

DigiByte Stats supports both mainnet and testnet networks with separate routing, theming, and data sources.

### Dual Network Architecture

| Network | Route Pattern | Backend | Description |
|---------|---------------|---------|-------------|
| **Mainnet** | `/` | Production servers | Live DigiByte blockchain data |
| **Testnet** | `/testnet/*` | Testnet servers | DigiByte testnet blockchain data |

### NetworkContext

The application uses React Context to manage network-specific configuration.

**Location**: `src/context/NetworkContext.js`

**Usage**:
```javascript
import { useNetwork } from '../context/NetworkContext';

const MyComponent = () => {
  const { wsBaseUrl, getApiUrl, isTestnet, isMainnet, theme } = useNetwork();

  // Use network-specific URLs
  const apiUrl = getApiUrl('/api/getblockchaininfo');

  // Conditional rendering based on network
  if (isTestnet) {
    return <TestnetBanner />;
  }
};
```

**Hook Return Values**:
| Property | Type | Description |
|----------|------|-------------|
| `wsBaseUrl` | `string` | WebSocket base URL for the current network |
| `getApiUrl(path)` | `function` | Returns full API URL for the given path |
| `isTestnet` | `boolean` | `true` if currently on testnet routes |
| `isMainnet` | `boolean` | `true` if currently on mainnet routes |
| `theme` | `object` | MUI theme object with network-specific colors |

### Theme Differences

Each network has distinct visual styling to help users identify which network they're viewing:

| Network | Primary Color | Accent | Visual Indicator |
|---------|---------------|--------|------------------|
| **Mainnet** | `#002352` (DigiByte Blue) | `#0066cc` | Standard blue theme |
| **Testnet** | `#2e7d32` (Forest Green) | `#4caf50` | Green theme with "TESTNET" indicators |

### Layout Components

Network-specific layouts wrap page content with appropriate headers, footers, and navigation:

```
src/components/
├── MainnetLayout.js    # Mainnet wrapper with blue theme
└── TestnetLayout.js    # Testnet wrapper with orange theme
```

**MainnetLayout.js**:
- Full navigation menu (all 14 items)
- Blue themed Header and Footer
- Standard DigiByte branding

**TestnetLayout.js**:
- Reduced navigation menu (no Pools, Downloads, Roadmap)
- Green themed Header and Footer
- "TESTNET" visual indicators
- Testnet-specific branding

### Network Data Hook

For components that need network-aware data fetching:

**Location**: `src/hooks/useNetworkData.js`

```javascript
import { useNetworkData } from '../hooks/useNetworkData';

const MyComponent = () => {
  const { data, loading, error, refetch } = useNetworkData('/api/endpoint');
  // Automatically uses correct network URLs
};
```

## Active File & Folder Structure

### Directory Organization
```
dgbstats/                          # Root directory
│
├── Entry Points & Configuration
│   ├── public/
│   │   ├── index.html             # HTML entry point
│   │   ├── logo.png               # DigiByte logo
│   │   ├── favicon.ico            # Site favicon
│   │   └── manifest.json          # PWA manifest
│   ├── package.json               # Dependencies & scripts
│   ├── vitest.config.js           # Vitest test configuration
│   ├── playwright.config.js       # E2E test configuration
│   └── CLAUDE.md                  # AI agent documentation
│
├── src/                           # Source code directory
│   ├── index.js                   # React entry point + MUI theme
│   ├── App.js                     # Root component with routing
│   ├── config.js                  # API/WebSocket URL configuration
│   ├── utils.js                   # Utility functions
│   │
│   ├── pages/                     # Page Components (13 pages)
│   │   ├── HomePage.js            # Main dashboard
│   │   ├── BlocksPage.js          # Block explorer
│   │   ├── TxsPage.js             # Transaction analytics
│   │   ├── PoolsPage.js           # Mining pool distribution
│   │   ├── AlgosPage.js           # Algorithm statistics
│   │   ├── HashratePage.js        # Network hashrate
│   │   ├── DifficultiesPage.js    # Difficulty tracking
│   │   ├── NodesPage.js           # Geographic node map
│   │   ├── SupplyPage.js          # Supply economics
│   │   ├── TaprootPage.js         # Taproot activation status
│   │   ├── DownloadsPage.js       # Core wallet downloads
│   │   ├── RoadmapPage.js         # Development roadmap
│   │   └── DigiDollarPage.js      # DigiDollar explainer
│   │
│   ├── context/                   # React Context Providers
│   │   └── NetworkContext.js      # Network (mainnet/testnet) context
│   │
│   ├── hooks/                     # Custom React Hooks
│   │   └── useNetworkData.js      # Network-aware data fetching hook
│   │
│   ├── components/                # Reusable Components
│   │   ├── Header.js              # Navigation bar
│   │   ├── Footer.js              # Site footer with stats
│   │   ├── XIcon.js               # X (Twitter) icon
│   │   ├── MainnetLayout.js       # Mainnet layout wrapper
│   │   └── TestnetLayout.js       # Testnet layout wrapper
│   │
│   ├── tests/                     # Test suites
│   │   ├── setup.js               # Vitest setup (MSW, mocks)
│   │   ├── mocks/                 # Mock data and handlers
│   │   │   ├── handlers.js        # MSW request handlers
│   │   │   ├── mockData.js        # Mock API responses
│   │   │   └── server.js          # MSW server setup
│   │   ├── utils/
│   │   │   └── testUtils.js       # Custom render + WebSocket mock
│   │   ├── unit/
│   │   │   └── pages/             # Page component tests (12 files)
│   │   ├── integration/           # Integration tests
│   │   └── pages/                 # Additional page tests
│   │
│   ├── Styles
│   │   ├── index.css              # Global styles
│   │   ├── App.css                # App layout styles
│   │   ├── App.module.css         # CSS modules
│   │   ├── NodesPage.css          # Node map styles
│   │   └── PoolsPage.css          # Pool chart styles
│   │
│   ├── setupTests.js              # Canvas/Observer mocks
│   ├── reportWebVitals.js         # Performance monitoring
│   └── countries-110m.json        # World map geospatial data
│
├── e2e/                           # Playwright E2E tests (20+ specs)
│   ├── homepage.spec.js
│   ├── blocks.spec.js
│   ├── pools.spec.js
│   ├── nodes.spec.js
│   ├── supply.spec.js
│   ├── navigation.spec.js
│   ├── accessibility.spec.js
│   ├── mobile.spec.js
│   ├── performance.spec.js
│   └── [browser-specific specs]
│
├── scripts/                       # Build/utility scripts
├── build/                         # Production build output
└── node_modules/                  # NPM dependencies
```

## Core Architecture Components

### 1. Frontend Application (`src/`)

**Purpose**: Single-page React application providing the user interface

**Key Technologies**:
- **React 17.0.2**: Component-based UI framework
- **React Router 6.10.0**: Client-side routing
- **Material-UI (MUI) 5.11.15**: Component library with theming
- **D3.js 7.8.4**: Advanced data visualizations
- **Chart.js 4.2.1**: Time series and statistical charts

**Architecture Pattern**: Functional components with hooks for state and side effects

### 2. Page Components (`src/pages/`)

The application consists of 13 pages organized by functionality:

#### Core Analytics Pages
| Page | Route | Purpose |
|------|-------|---------|
| **HomePage** | `/` | Main dashboard with blockchain stats, supply, softforks |
| **BlocksPage** | `/blocks` | Real-time block explorer with pagination |
| **TxsPage** | `/txs` | Transaction analytics and mempool monitoring |
| **PoolsPage** | `/pools` | Mining pool distribution with D3.js donut chart |
| **AlgosPage** | `/algos` | Algorithm distribution visualization |
| **HashratePage** | `/hashrate` | Per-algorithm hashrate calculations |
| **DifficultiesPage** | `/difficulties` | Real-time difficulty charts (5 algorithms) |

#### Network & Supply Pages
| Page | Route | Purpose |
|------|-------|---------|
| **NodesPage** | `/nodes` | Interactive world map with node geolocation |
| **SupplyPage** | `/supply` | Supply economics with projection chart |
| **TaprootPage** | `/taproot` | BIP9 Taproot activation monitoring |

#### Information Pages
| Page | Route | Purpose |
|------|-------|---------|
| **DownloadsPage** | `/downloads` | GitHub releases and download stats |
| **RoadmapPage** | `/roadmap` | Development timeline with phases |
| **DigiDollarPage** | `/digidollar` | Stablecoin concept and collateral info |

### 3. Component Architecture (`src/components/`)

Components are organized for reusability:

```
components/
├── Header.js          # Sticky AppBar with navigation
│   ├── Logo and title
│   ├── Desktop navigation (14 menu items)
│   └── Mobile drawer with hamburger menu
│
├── Footer.js          # Three-column footer
│   ├── Logo and description
│   ├── Visit statistics (via API)
│   └── DGB donation address
│
└── XIcon.js           # Custom X (Twitter) SVG icon
```

### 4. Data Management Layer

#### WebSocket Communication
All real-time data flows through a single WebSocket connection:

```javascript
// Message Types Received from Server
{
  type: 'initialData',      // Blockchain info, tx stats, supply, block reward, deploymentInfo
  type: 'recentBlocks',     // Array of latest 240 blocks
  type: 'newBlock',         // Single new block notification
  type: 'geoData',          // Geographic peer node locations
  type: 'mempool',          // Mempool stats and transactions
  type: 'recentTransactions', // Confirmed transaction cache
  type: 'transactionConfirmed' // Transaction moved to block
}
```

#### API Endpoints Used
| Endpoint | Page(s) | Purpose |
|----------|---------|---------|
| `/api/getblockchaininfo` | HomePage | Blockchain state and difficulties |
| `/api/getchaintxstats` | HomePage | Transaction statistics |
| `/api/gettxoutsetinfo` | SupplyPage | UTXO set and supply data |
| `/api/getblockreward` | HomePage | Current block reward |
| `/api/visitstats` | Footer | Page view analytics |
| GitHub Releases API | DownloadsPage | Wallet download counts |

### 5. State Management Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Component State (useState)                │
│         Local UI state, pagination, loading, filters         │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                  WebSocket Real-time State                   │
│           Blocks, transactions, network data, supply         │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│               App-Level Props (from App.js)                  │
│        blockchainInfo, chainTxStats, txOutsetInfo           │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                   Backend WebSocket Server                   │
│              DigiByte Node via RPC + Caching                │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Architecture

### Standard Page Load Flow
```
1. User navigates to page
   ↓
2. React Router renders page component
   ↓
3. useEffect establishes WebSocket connection
   ↓
4. Server sends initial data (recentBlocks, initialData, geoData)
   ↓
5. Component state updated, UI renders
   ↓
6. Real-time updates via WebSocket messages
   ↓
7. State updates trigger re-renders
```

### Real-time Block Update Flow
```
DigiByte Node (new block)
       ↓
Backend blocknotify webhook
       ↓
Process block, update caches
       ↓
WebSocket broadcast (type: 'newBlock')
       ↓
React components receive message
       ↓
Prepend to state arrays
       ↓
UI re-renders with new block
```

## Pages Architecture & Navigation Flow

### Site Hierarchy Flowchart

```
DigiByte Stats - Site Navigation Structure
═══════════════════════════════════════════

🏠 Home Page (/)
│
├── 📊 Block Explorer
│   └── Blocks (/blocks) ─────────────── Real-time block list
│       └── Links to DigiExplorer
│
├── 💱 Transaction Analytics
│   └── Transactions (/txs) ──────────── Mempool & confirmed txs
│       └── Fee analysis, search, filter
│
├── ⛏️ Mining Analytics
│   ├── Pools (/pools) ───────────────── D3.js donut chart
│   │   └── Multi-block & solo miners
│   │
│   ├── Algorithms (/algos) ──────────── Algorithm distribution
│   │   └── SHA256D, Scrypt, Skein, Qubit, Odocrypt
│   │
│   ├── Hashrate (/hashrate) ─────────── Per-algo hashrate stats
│   │   └── Block times, network hashrate
│   │
│   └── Difficulties (/difficulties) ─── Chart.js line charts
│       └── Real-time difficulty tracking
│
├── 🌍 Network
│   └── Nodes (/nodes) ───────────────── D3-geo world map
│       └── Geographic peer distribution
│
├── 💰 Economics
│   └── Supply (/supply) ─────────────── Supply curve chart
│       └── Circulating, remaining, per capita
│
├── 🔧 Technical
│   └── Taproot (/taproot) ───────────── Activation status
│       └── BIP9 signaling progress
│
├── 📥 Downloads
│   └── Downloads (/downloads) ───────── GitHub releases
│       └── Platform-specific stats
│
└── 🗺️ Future
    ├── Roadmap (/roadmap) ───────────── Development timeline
    │   └── DigiDollar phases
    │
    └── DigiDollar (/digidollar) ─────── Stablecoin explainer
        └── Collateral requirements
```

### Navigation Flow Patterns

#### Primary User Journey
```
Homepage → Mining Stats → Block Explorer → Supply Info
    ↓           ↓              ↓              ↓
  Stats    Pools/Algos   Real-time Blocks   Economics
```

#### Mining Analysis Journey
```
Algorithms → Hashrate → Difficulties → Pools
    ↓           ↓            ↓           ↓
Pie Chart  Per-Algo Stats  Charts    Distribution
```

### Mobile vs Desktop Navigation

#### Desktop Navigation (Mainnet)
```
Header AppBar:
├── Home
├── Blocks
├── Txs
├── Supply
├── Algos
├── Difficulties
├── Hashrate
├── Pools
├── Nodes
├── Downloads
├── Roadmap
├── DigiDollar
├── DigiHash (external)
└── DigiByte.org (external)
```

#### Desktop Navigation (Testnet)
```
Header AppBar (Reduced):
├── Home
├── Blocks
├── Txs
├── Supply
├── Algos
├── Difficulties
├── Hashrate
├── Nodes
├── Taproot
├── DigiHash (external)
└── DigiByte.org (external)

Note: Pools, Downloads, and Roadmap are not available on testnet
```

#### Mobile Navigation (Drawer)
```
Hamburger Menu → Drawer slides in
├── [Same items as corresponding desktop navigation]
├── Mainnet: Full 14-item menu
├── Testnet: Reduced menu (no Pools, Downloads, Roadmap)
└── Closes on selection
```

## Technology Stack

### Frontend Technologies
```yaml
Core Framework:
  - React: 17.0.2
  - React Router: 6.10.0
  - Create React App: 5.0.1

UI Components:
  - Material-UI: 5.11.15
  - MUI Icons: 5.11.11
  - MUI Lab: 5.0.0-alpha (Timeline)
  - Emotion: CSS-in-JS styling

Data Visualization:
  - D3.js: 7.8.4 (pie charts, geo maps)
  - D3-Geo: 3.1.0 (map projections)
  - Chart.js: 4.2.1 (line charts)
  - react-chartjs-2: 5.2.0
  - chartjs-adapter-luxon: 1.3.1
  - Visx: 3.x (graticule)

Geospatial:
  - topojson-client: 3.1.0
  - world-atlas: 2.0.2
  - us-atlas: 3.0.1
  - geoip-lite: 1.4.7

Utilities:
  - axios: 1.3.5 (HTTP client)
  - date-fns: 4.1.0 (date formatting)
  - luxon: 3.3.0 (DateTime handling)

Testing:
  - Vitest: 1.6.1 (unit/integration)
  - Playwright: 1.52.0 (E2E)
  - Testing Library: React + Jest-DOM
  - MSW: 2.8.4 (API mocking)
```

### Design System

#### Theme Configuration
```javascript
// Primary Theme (App.js)
const theme = createTheme({
  palette: {
    primary: {
      main: '#002352',     // DigiByte Blue
      light: '#0066cc',    // Light Blue
      dark: '#001c41'
    },
    secondary: {
      main: '#0066cc',     // Light Blue
      light: '#4395ff',
      dark: '#003b99'
    }
  },
  components: {
    MuiButton: { borderRadius: 8, textTransform: 'none' },
    MuiCard: { borderRadius: 8, boxShadow: '0 4px 8px rgba(0,0,0,0.05)' }
  }
});

// Algorithm Colors
const ALGO_COLORS = {
  'SHA256D': '#4caf50',   // Green
  'Scrypt':  '#2196f3',   // Blue
  'Skein':   '#ff9800',   // Orange
  'Qubit':   '#9c27b0',   // Purple
  'Odo':     '#f44336'    // Red
};
```

#### Component Patterns
1. **Hero Sections**: Each page starts with gradient card + title + description
2. **Stat Cards**: Memoized metric displays with icons and formatted values
3. **Loading States**: Centered CircularProgress with "Loading..." text
4. **Responsive Grids**: Mobile-first with MUI breakpoints (xs, sm, md, lg)
5. **Chart Containers**: Responsive sizing with ref-based cleanup

## Performance Architecture

### Optimization Strategies

#### Memoization
```javascript
// Expensive calculations cached with useMemo
const sortedPools = useMemo(() => {
  return blocks.reduce((acc, block) => {
    // Pool aggregation logic
  }, []).sort((a, b) => b.count - a.count);
}, [blocks]);

// Component memoization
const StatCard = memo(({ title, value, icon }) => (
  <Card>...</Card>
));
```

#### Real-time Update Handling
- New blocks prepended to arrays (O(1))
- Maximum array sizes enforced (240 blocks)
- Chart instances cleaned up on unmount
- WebSocket reconnection on close

#### Bundle Optimization
- Code splitting ready (React.lazy available)
- Tree shaking via CRA webpack config
- Production builds minified
- Static assets served from CDN

### Performance Targets
```
Target Metrics:
├── First Contentful Paint: < 1.5s
├── Time to Interactive: < 3.5s
├── Lighthouse Performance: > 90
├── Chart render time: < 100ms
└── WebSocket latency: < 50ms
```

## Testing Architecture

### Test Stack
```
Testing Pyramid:
├── Unit Tests (60%)       # Page and component tests
├── Integration (20%)      # Cross-component interactions
└── E2E Tests (20%)       # Full user journeys
```

### Test Configuration

#### Vitest Setup (`vitest.config.js`)
```javascript
{
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.js', './src/setupTests.js'],
    coverage: {
      provider: 'v8',
      thresholds: { lines: 95, functions: 95, branches: 95 }
    }
  }
}
```

#### Playwright Configuration
```javascript
{
  testDir: './e2e',
  baseURL: 'http://localhost:3005',
  projects: [
    { name: 'chromium' },
    { name: 'firefox' },
    { name: 'webkit' },
    { name: 'Mobile Chrome' },
    { name: 'Mobile Safari' },
    { name: 'Microsoft Edge' }
  ]
}
```

### Mock Infrastructure
- **MSW Handlers**: Mock all API endpoints
- **WebSocket Mock**: Custom class for testing real-time features
- **Canvas Mock**: Chart.js rendering in jsdom
- **Observer Mocks**: ResizeObserver, IntersectionObserver

### Test Commands
```bash
npm test              # Vitest watch mode
npm run test:run      # Single run
npm run test:coverage # Coverage report (95% threshold)
npm run test:e2e      # Playwright E2E tests
npm run test:all      # All tests (unit + E2E)
```

## Deployment Architecture

### Build Process
```bash
# Development
npm start             # Start dev server (port 3005)

# Production
npm run build         # Create optimized build in /build
```

### Environment Configuration
```javascript
// config.js
export default {
  development: {
    apiBaseUrl: 'http://localhost:5001',
    wsBaseUrl: 'ws://localhost:5002'
  },
  production: {
    apiBaseUrl: 'https://digibyte.io',
    wsBaseUrl: 'wss://digibyte.io/ws'
  }
}
```

### Deployment Requirements
- Node.js 14.x or higher (tested with 21.7.2)
- Backend server (dgbstats-server) running
- DigiByte node with RPC enabled
- Static file hosting (Nginx, CDN)

## Design Patterns

### Component Patterns
1. **Functional Components**: Hooks-only (no class components)
2. **Custom Hooks**: `useWidth()` for responsive design
3. **Render Props**: Chart configurations passed as props
4. **Compound Components**: StatCard with icon variants

### Data Patterns
1. **Observer Pattern**: WebSocket subscriptions for real-time updates
2. **Memoization Pattern**: useMemo/useCallback for expensive operations
3. **Fallback Pattern**: Default data while loading, dummy data on timeout
4. **Cleanup Pattern**: useEffect cleanup for WebSocket and chart instances

## Architecture Summary

### Key Statistics
- **Pages**: 13 total (analytics, network, economics, information)
- **Components**: 5 reusable (Header, Footer, XIcon, MainnetLayout, TestnetLayout)
- **Context Providers**: 1 (NetworkContext)
- **Custom Hooks**: 5 (in useNetworkData.js)
- **Utilities**: 3 functions (formatNumber, numberWithCommas, useWidth)
- **Unit/Integration Tests**: 18 test files (314 tests)
- **E2E Tests**: 21 spec files (1,112 tests across 7 browsers)
- **Dependencies**: 35+ production packages
- **Technologies**: React 17, MUI 5, D3.js 7, Chart.js 4

### Network Support
- **Mainnet**: Full production network at `/` routes (port 5002 WebSocket)
- **Testnet**: Development network at `/testnet/*` routes (port 5003 WebSocket)
- **Network Switching**: Easy toggle via header navigation

### Critical Features
- **Multi-Algorithm Support**: 5 mining algorithms with color coding
- **Real-Time Updates**: WebSocket for live blockchain data
- **Geographic Visualization**: D3-geo world map with 1,000+ nodes
- **Supply Tracking**: 21 billion DGB max with emission projections
- **Mobile-First**: Responsive design tested on 7+ browser configurations
- **Softfork Status**: Uses getdeploymentinfo RPC for activation status

### SEO Implementation
- Open Graph meta tags for social sharing
- Twitter Card integration with large images
- JSON-LD structured data for search engines
- XML sitemap covering all 21 pages (mainnet + testnet)
- robots.txt with AI crawler support (GPTBot, Claude-Web)

### Performance Highlights
- 95% test coverage requirement
- Sub-second chart rendering
- Automatic WebSocket reconnection
- Memoized expensive calculations
- Code splitting ready

---

*Architecture Document v1.1*
*Last Updated: 2026-02-02*
*DigiByte Stats - Real-Time Blockchain Analytics*
