# DigiByte Stats - Technical Architecture

## Executive Summary

DigiByte Stats is a **real-time blockchain analytics platform** providing comprehensive statistics, visualizations, and network monitoring for the DigiByte blockchain. The platform delivers:

- **Real-Time Block Explorer**: Live block updates with algorithm identification and mining pool detection
- **Chain Tips & Fork Monitoring**: Live fork-tree map, orphan tracking, and a site-wide fork-risk banner
- **Network Monitoring**: Geographic visualization of peer nodes worldwide (crawled from the DigiHash pool wallet's `peers.dat`)
- **Mining Analytics**: Multi-algorithm hashrate tracking, difficulty charts, pool distribution, and a per-pool software-upgrade (BIP9 signal) tracker
- **Supply Economics**: Circulating supply tracking with emission projections
- **DigiDollar Tracking**: BIP9 activation status, oracle price-feed monitoring, and network-health stats for the DigiDollar stablecoin (shipped in DigiByte Core v9.26.x)

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

| Network | Route Pattern | WebSocket | Description |
|---------|---------------|-----------|-------------|
| **Mainnet** | `/` | `ws://localhost:5002` | Live DigiByte blockchain data (18 routes) |
| **Testnet** | `/testnet/*` | `ws://localhost:5003` | DigiByte testnet blockchain data (16 routes) |

Both share a single backend REST API on `http://localhost:5001`, with per-network path prefixes (`/api`, `/api/testnet`).

### NetworkContext

The application uses React Context to manage network-specific configuration.

**Location**: `src/context/NetworkContext.js`

**Usage**:
```javascript
import { useNetwork } from '../context/NetworkContext';

const MyComponent = () => {
  const { wsBaseUrl, getApiUrl, isTestnet, isMainnet, theme } = useNetwork();

  // getApiUrl already prepends `/api` + the network prefix — pass the bare endpoint:
  const apiUrl = getApiUrl('/getblockchaininfo');
  //   mainnet     → http://localhost:5001/api/getblockchaininfo
  //   testnet     → http://localhost:5001/api/testnet/getblockchaininfo

  if (isTestnet) {
    return <TestnetBanner />;
  }
};
```

**Key `useNetwork()` return values** (the hook spreads the whole network config plus these helpers):

| Property | Type | Description |
|----------|------|-------------|
| `name` / `displayName` | `string` | `mainnet` / `testnet` |
| `wsBaseUrl` | `string` | WebSocket base URL for the current network |
| `apiBaseUrl` | `string` | REST API base URL (shared: `http://localhost:5001`) |
| `basePath` | `string` | Route prefix (`''`, `/testnet`) |
| `apiPrefix` | `string` | API path prefix (`''`, `/testnet`) |
| `getApiUrl(path)` | `function` | Returns `${apiBaseUrl}/api${apiPrefix}${path}` |
| `getNetworkPath(path)` | `function` | Returns the network-prefixed router path |
| `isMainnet` / `isTestnet` | `boolean` | Current-network flags |
| `theme` | `object` | `{ primary, secondary, gradient }` color tokens (not a full MUI theme) |
| `activation` / `oracle` / `digiDollarRelease` | `object` | Per-network DigiDollar BIP9 activation, oracle roster, and release metadata |
| `cliDeploymentCommand` | `string` | `digibyte-cli` command shown on the activation page |

**Additional exports**: `NetworkProvider` (wrapper), `getNetworkConfig(network)`, and the default `NetworkContext`.

### Theme Differences

Each network has distinct visual styling so users can tell which network they are viewing. The color tokens live in `NetworkContext`; the testnet layout also applies its own MUI `createTheme`.

| Network | Primary | Accent | Visual Indicator |
|---------|---------|--------|------------------|
| **Mainnet** | `#002352` (DigiByte Blue) | `#0066cc` | Standard blue theme |
| **Testnet** | `#2e7d32` (Forest Green) | `#4caf50` | Green theme + "TESTNET" chip |

### Layout Components

Network-specific layouts wrap page content with the appropriate header, footer, fork banner, and theme:

```
src/components/
├── MainnetLayout.js      # network="mainnet"; Header + ForkAlertBanner + Footer (inherits global theme)
└── TestnetLayout.js      # network="testnet"; local green ThemeProvider
```

Both mount the site-wide `<ForkAlertBanner />` between `<Header />` and page content.

### Network Data Hooks

For components that need network-aware data fetching, `src/hooks/useNetworkData.js` exports 5 specialized hooks (plus a default export bundling all five):

| Hook | Returns | Endpoint |
|------|---------|----------|
| `useBlockchainInfo()` | `{ data, loading, error, refetch }` | `/getblockchaininfo` |
| `useChainTxStats()` | `{ data, loading, error }` | `/getchaintxstats` |
| `useTxOutsetInfo()` | `{ data, loading, error }` | `/gettxoutsetinfo` |
| `useBlockReward()` | `{ data, loading, error }` | `/getblockreward` (parsed to a number) |
| `useNetworkWebSocket(onMessage)` | `{ connected }` | Opens a WebSocket to `wsBaseUrl` |

> Note: Most pages open their own `WebSocket(wsBaseUrl)` directly rather than going through `useNetworkWebSocket`; the hooks are the network-aware REST layer.

## Active File & Folder Structure

```
dgbstats/                          # Root directory
│
├── Entry Points & Configuration
│   ├── public/
│   │   ├── index.html             # HTML entry point + SEO meta tags
│   │   ├── logo.png / logo192.png / logo512.png
│   │   ├── favicon.ico            # Site favicon
│   │   ├── manifest.json          # PWA manifest
│   │   ├── robots.txt             # Crawler rules (incl. AI crawlers)
│   │   ├── sitemap.xml            # XML sitemap (all routes)
│   │   └── og-images/             # Open Graph preview images
│   ├── package.json               # Dependencies & scripts
│   ├── vitest.config.js           # Vitest test configuration
│   ├── playwright.config.js       # E2E test configuration (8 projects)
│   ├── CLAUDE.md                  # AI agent documentation
│   ├── ARCHITECTURE.md            # This document
│   └── REPO_MAP.md                # Per-file repository map
│
├── src/                           # Source code directory
│   ├── index.js                   # React 17 entry point + global MUI theme
│   ├── App.js                     # Root component; routing + top-level REST poll
│   ├── config.js                  # Legacy API/WebSocket URL config (dev/prod)
│   ├── utils.js                   # formatNumber, numberWithCommas, useWidth
│   │
│   ├── pages/                     # Page Components (19 pages)
│   │   ├── HomePage.js            # Main dashboard
│   │   ├── BlocksPage.js          # Block explorer
│   │   ├── ChainTipsPage.js       # Chain tips & orphans (/tips)
│   │   ├── TxsPage.js             # Transaction analytics
│   │   ├── PoolsPage.js           # Mining pool distribution (mainnet only)
│   │   ├── PoolUpgradeTrackerPage.js # Per-pool BIP9 upgrade tracker
│   │   ├── AlgosPage.js           # Algorithm statistics
│   │   ├── HashratePage.js        # Network hashrate
│   │   ├── DifficultiesPage.js    # Difficulty tracking
│   │   ├── NodesPage.js           # Geographic node map
│   │   ├── SupplyPage.js          # Supply economics
│   │   ├── TaprootPage.js         # Taproot activation status (unlinked route)
│   │   ├── DownloadsPage.js       # Core wallet downloads (mainnet only)
│   │   ├── RoadmapPage.js         # Development roadmap (mainnet only)
│   │   ├── DigiDollarPage.js      # DigiDollar explainer
│   │   ├── DDActivationPage.js    # DigiDollar BIP9 activation tracker (/activation)
│   │   ├── OraclesPage.js         # Oracle network status (both networks)
│   │   ├── DDStatsPage.js         # DigiDollar stats (both networks)
│   │   └── WalletConvertPage.js   # Oracle wallet migration tool (testnet only)
│   │
│   ├── context/
│   │   └── NetworkContext.js      # Mainnet/testnet config + hooks
│   │
│   ├── hooks/
│   │   └── useNetworkData.js      # 5 network-aware data hooks
│   │
│   ├── components/                # Reusable Components (9)
│   │   ├── Header.js              # Network-aware navigation bar
│   │   ├── Footer.js              # Site footer with visit stats
│   │   ├── XIcon.js               # X (Twitter) icon
│   │   ├── MainnetLayout.js       # Mainnet layout wrapper
│   │   ├── TestnetLayout.js       # Testnet layout wrapper (green theme)
│   │   ├── ForkAlertBanner.js     # Site-wide fork-risk banner
│   │   ├── ForkTreeMap.js         # SVG fork-tree map (Chain Tips page)
│   │   ├── ChainTipsExplainer.js  # Educational section (Chain Tips page)
│   │   └── IntegrationGuides.js   # DigiDollar integration-doc links
│   │
│   ├── tests/                     # Test suites (29 unit/integration files)
│   │   ├── setup.js               # Vitest setup (MSW, mocks)
│   │   ├── mocks/                 # handlers.js, mockData.js, server.js
│   │   ├── utils/testUtils.js     # Custom render + WebSocket mock
│   │   ├── unit/
│   │   │   ├── pages/             # 18 page-component tests
│   │   │   ├── components/        # 4 component tests
│   │   │   ├── context/           # NetworkContext test
│   │   │   └── AppDataGuards.test.js
│   │   ├── integration/           # 2 integration tests
│   │   ├── pages/RoadmapPage.test.js
│   │   └── WalletConverter.test.js
│   │
│   ├── Styles
│   │   ├── index.css / App.css / App.module.css
│   │   ├── pages/NodesPage.css / pages/PoolsPage.css
│   │
│   ├── setupTests.js              # Canvas/Observer mocks
│   ├── reportWebVitals.js         # Performance monitoring
│   └── countries-110m.json        # World map geospatial data (TopoJSON)
│
├── e2e/                           # Playwright E2E tests (21 specs)
├── scripts/                       # clean-test-data.sh
└── build/                         # Production build output
```

## Core Architecture Components

### 1. Frontend Application (`src/`)

**Key Technologies**:
- **React 17.0.2**: Component-based UI framework (`ReactDOM.render` + `StrictMode`)
- **React Router 6.10.0**: Client-side routing (nested layout routes)
- **Material-UI (MUI) 5.11.15**: Component library with theming
- **D3.js 7.8.4** + **@visx/geo**: Donut chart, geo map, graticule
- **Chart.js 4.2.1**: Time-series and statistical charts

**Architecture Pattern**: Functional components with hooks for state and side effects.

### 2. Page Components (`src/pages/`)

**19 page components**. App.js registers **18 mainnet routes** (under `MainnetLayout`) and **16 testnet routes** (under `TestnetLayout`). Of the 19 pages: **15 render on both networks**, **3 are mainnet-only** (Pools, Downloads, Roadmap), and **1 is testnet-only** (Wallet Convert).

#### Core Analytics Pages (both networks)
| Page | Route | Purpose |
|------|-------|---------|
| **HomePage** | `/`, `/testnet` | Dashboard: block height, supply, hashrate, difficulties, softfork status |
| **BlocksPage** | `/blocks` | Real-time block explorer (240 blocks, paginated) |
| **ChainTipsPage** | `/tips` | Chain tips & orphans: fork-tree map, orphan tables, 30-day orphan chart |
| **TxsPage** | `/txs` | Mempool + confirmed transaction analytics and fees |
| **AlgosPage** | `/algos` | Algorithm distribution across the 5 algos |
| **HashratePage** | `/hashrate` | Per-algorithm hashrate calculations |
| **DifficultiesPage** | `/difficulties` | Real-time difficulty charts (Chart.js) |
| **PoolUpgradeTrackerPage** | `/pool-upgrades` | Per-pool BIP9 upgrade signals (DigiDollar bit 23, Algolock bit 0) |

#### Network & Supply Pages (both networks)
| Page | Route | Purpose |
|------|-------|---------|
| **NodesPage** | `/nodes` | World map of unique peers (crawled from DigiHash `peers.dat`) + addrman |
| **SupplyPage** | `/supply` | Supply economics + projection chart |
| **TaprootPage** | `/taproot` | BIP9 Taproot status (active/buried) — route exists, no nav link |

#### DigiDollar Pages (both networks)
| Page | Route | Purpose |
|------|-------|---------|
| **DigiDollarPage** | `/digidollar` | Stablecoin explainer + collateral tiers |
| **DDActivationPage** | `/activation` | BIP9 activation tracker (DigiDollar + Algolock/Groestl removal) |
| **OraclesPage** | `/oracles` | Oracle price-feed network (DGB/USD via Schnorr consensus) |
| **DDStatsPage** | `/ddstats` | Network-wide DigiDollar health, collateral, DD supply |

#### Mainnet-Only Pages
| Page | Route | Purpose |
|------|-------|---------|
| **PoolsPage** | `/pools` | Mining pool distribution (D3.js donut chart) |
| **DownloadsPage** | `/downloads` | GitHub releases and download stats |
| **RoadmapPage** | `/roadmap` | Development timeline (2025–2029) |

#### Testnet-Only Page
| Page | Route | Purpose |
|------|-------|---------|
| **WalletConvertPage** | `/testnet/convert` | Client-side wallet.dat `application_id` patcher for oracle wallet migration |

> **Changed from earlier versions:** OraclesPage, DDStatsPage, and DDActivationPage are now available on **both** networks (previously testnet-only). WalletConvertPage is the **only** testnet-exclusive page.

### 3. Component Architecture (`src/components/`)

**9 reusable components**:

```
components/
├── Header.js              # Sticky AppBar; network-aware nav (17 mainnet / 14 testnet
│                          #   items), 6 external links, Mainnet/Testnet
│                          #   switch, mobile drawer, network badge
├── Footer.js              # 3-column footer: brand + social (GitHub, X), visit stats
│                          #   (/api/visitstats, 60s poll), DGB donation address
├── XIcon.js               # Custom X (Twitter) SVG icon
├── MainnetLayout.js       # Mainnet route layout
├── TestnetLayout.js       # Testnet route layout (green theme)
├── ForkAlertBanner.js     # Site-wide fork banner (own WebSocket, forkAlert messages)
├── ForkTreeMap.js         # Responsive SVG fork-tree map (React.memo)
├── ChainTipsExplainer.js  # Collapsible educational section (React.memo)
└── IntegrationGuides.js   # DigiDollar wallet/exchange integration-doc card
```

### 4. Data Management Layer

#### WebSocket Communication

Each page (and the fork banner) opens its own WebSocket to `wsBaseUrl`. The frontend handles **17 inbound message types** and sends **1 outbound** message:

```javascript
// Inbound (server → client)
initialData            // { blockchainInfo, chainTxStats, txOutsetInfo, blockReward, deploymentInfo }
recentBlocks           // Array of ~240 latest blocks
newBlock               // Single new block
geoData                // Geolocated peer nodes (+ optional addrman summary)
nodeVersions24h        // Node version breakdown (last 24h)
mempool                // { stats, transactions }
recentTransactions     // Confirmed transaction cache
newTransaction         // Single new mempool tx
transactionConfirmed   // Bulk mempool → confirmed on new block
confirmedTransaction   // Single confirmed tx (legacy path)
removedTransaction     // { txid } removed from mempool
chainTips              // { tips, orphans, counts, active } — fork tree state
forkAlert              // { level, reason, branchlen } — drives ForkAlertBanner
ddDeploymentData       // DigiDollar BIP9 deployment info
ddStatsData            // DigiDollar network health/collateral/supply
oracleData             // Oracle roster, DGB/USD prices, signer bundles
roadmapUpdate          // Single roadmap milestone update

// Outbound (client → server)
subscribeRoadmap       // { clientId } — sent by RoadmapPage on socket open
```

#### API Endpoints Used
| Endpoint | Consumers | Purpose |
|----------|-----------|---------|
| `/api/getblockchaininfo` | App.js, `useBlockchainInfo`, Difficulties, Hashrate, PoolUpgrade | Blockchain state, height, difficulties |
| `/api/getchaintxstats` | App.js, `useChainTxStats` | Transaction statistics |
| `/api/gettxoutsetinfo` | App.js, `useTxOutsetInfo`, SupplyPage | UTXO set and supply data |
| `/api/getblockreward` | App.js, `useBlockReward` | Current block reward |
| `/api/getdeploymentinfo` | DDActivationPage, PoolUpgradeTrackerPage (30s poll) | BIP9 deployment stats (digidollar, algolock) |
| `/api/visitstats` | Footer | Page-view analytics |
| GitHub Releases API | DownloadsPage | `api.github.com/repos/digibyte-core/digibyte/releases` |

> API paths are network-prefixed via `getApiUrl` (e.g. testnet → `/api/testnet/getblockchaininfo`). HomePage receives its blockchain data via the `initialData` WebSocket message rather than these REST calls.

### 5. State Management Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Component State (useState)                │
│         Local UI state, pagination, loading, filters         │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                  WebSocket Real-time State                   │
│      Blocks, txs, geo, chain tips, oracle/DD, fork alerts    │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│           NetworkContext (per-network config/theme)          │
│         + App-level REST poll (blockchainInfo, supply)       │
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
1. User navigates → React Router renders the layout + page
2. Layout mounts NetworkProvider (sets network config/theme)
3. Page useEffect opens WebSocket(wsBaseUrl)
4. Server sends initial payloads (initialData / recentBlocks / geoData / …)
5. Component state updates, UI renders
6. Real-time updates via subsequent WebSocket messages
7. State updates trigger re-renders
```

### Real-time Block & Fork Flow
```
DigiByte Node (new block)
       ↓
Backend blocknotify → process block, update caches, run getchaintips
       ↓
WebSocket broadcast: newBlock, chainTips, (forkAlert if fork risk)
       ↓
Pages prepend the block; ChainTipsPage redraws the fork map;
ForkAlertBanner shows/updates on elevated/critical alerts (site-wide)
```

## Pages Architecture & Navigation Flow

### Site Hierarchy

```
DigiByte Stats - Site Navigation Structure
═══════════════════════════════════════════

🏠 Home (/)
│
├── 📊 Blocks (/blocks) ─────────────── Real-time block list
├── 🌿 Tips (/tips) ─────────────────── Chain tips, orphans, fork-tree map
├── 💱 Txs (/txs) ───────────────────── Mempool & confirmed txs
│
├── ⛏️ Mining
│   ├── Algos (/algos) ─────────────── SHA256D, Scrypt, Skein, Qubit, Odocrypt
│   ├── Difficulties (/difficulties) ─ Chart.js difficulty charts
│   ├── Hashrate (/hashrate) ───────── Per-algo hashrate stats
│   ├── Pools (/pools) ─────────────── D3.js donut chart (mainnet only)
│   └── Upgrades (/pool-upgrades) ──── Per-pool BIP9 signal tracker
│
├── 🌍 Nodes (/nodes) ───────────────── D3-geo world map + addrman
├── 💰 Supply (/supply) ─────────────── Supply curve chart
│
├── 💵 DigiDollar
│   ├── DigiDollar (/digidollar) ───── Stablecoin explainer
│   ├── Activation (/activation) ───── BIP9 activation tracker
│   ├── Oracles (/oracles) ─────────── DGB/USD oracle price feeds
│   └── DD Stats (/ddstats) ────────── Network health & collateral
│
├── 📥 Downloads (/downloads) ───────── GitHub releases (mainnet only)
├── 🗺️ Roadmap (/roadmap) ──────────── Development timeline (mainnet only)
│
├── 🔧 Taproot (/taproot) ──────────── Activation status (route only, no nav link)
│
└── 🧪 Testnet-only
    └── Convert (/testnet/convert) ─── Oracle wallet.dat migration tool
```

### Desktop Navigation (Mainnet — 17 items)
```
Home · Blocks · Tips · Txs · Supply · Algos · Difficulties · Hashrate ·
Pools · Upgrades · Nodes · Downloads · Roadmap · DigiDollar · Activation ·
Oracles · DD Stats
```

### Desktop Navigation (Testnet — 14 items)
```
Home · Blocks · Tips · Txs · Supply · Algos · Difficulties · Hashrate ·
Nodes · Upgrades · Activation · Oracles · DD Stats · DigiDollar

Note: Pools, Downloads, and Roadmap are mainnet-only. WalletConvert
(/testnet/convert) and Taproot have routes but no header nav link.
```

### Secondary Bar — External Links (all networks)
```
DigiExplorer · DigiHash · DigiByte.org · GitHub · Digi-ID · DigiScope
+ Mainnet / Testnet network switch buttons
```

### Mobile Navigation (Drawer)
```
Hamburger (below lg breakpoint) → right-side Drawer:
├── Primary menu (same items as the current network's desktop nav)
├── External Resources (6 links)
└── Mainnet / Testnet network switch
```

## Technology Stack

### Frontend Technologies
```yaml
Core Framework:
  - React: 17.0.2
  - React Router: 6.10.0
  - Create React App (react-scripts): 5.0.1

UI Components:
  - @mui/material: 5.11.15
  - @mui/icons-material: 5.11.11
  - @mui/lab: 5.0.0-alpha.173
  - @mui/x-data-grid: 6.2.0
  - @material-ui/data-grid: 4.0.0-alpha.37 (legacy v4 grid)
  - @emotion/react + @emotion/styled: CSS-in-JS

Data Visualization:
  - d3: 7.8.4 (donut chart, geo)
  - d3-geo: 3.1.0
  - @visx/geo, @visx/event, @visx/zoom: 3.x (map + graticule + zoom)
  - chart.js: 4.2.1 + react-chartjs-2: 5.2.0 + chartjs-adapter-luxon: 1.3.1

Geospatial:
  - topojson-client: 3.1.0
  - world-atlas: 2.0.2
  - us-atlas: 3.0.1
  - geoip-lite: 1.4.7

Utilities:
  - axios: 1.3.5
  - date-fns: 4.1.0
  - luxon: 3.3.0
  - web-vitals: 2.1.4
  - cors: 2.8.5

Testing:
  - vitest: 1.6.1 (+ @vitest/coverage-v8, @vitest/ui)
  - @playwright/test: 1.52.0 (+ axe-playwright)
  - @testing-library/react: 12.1.5 (React 17), jest-dom, user-event
  - msw: 2.8.4
  - jsdom / happy-dom / vitest-canvas-mock
```

### Design System

#### Theme Configuration
The **global MUI theme lives in `src/index.js`** (primary `#0066CC`, secondary `#002352`, dark background). `App.js` wraps all routes in a second theme (primary `#002352`, accent `#0066cc`), which is what mainnet pages effectively use. `TestnetLayout` applies its own `createTheme` (green) on top.

```javascript
// App.js theme (applies to mainnet routes)
palette: {
  primary:   { main: '#002352', light: '#0066cc', dark: '#001c41' },
  secondary: { main: '#0066cc', light: '#4395ff', dark: '#003b99' },
}
components: {
  MuiButton: { borderRadius: 8, textTransform: 'none' },
  MuiCard:   { borderRadius: 8, boxShadow: '0 4px 8px rgba(0,0,0,0.05)' },
}

// Algorithm / fork status colors (ForkTreeMap, ChainTipsExplainer, algo charts)
SHA256D #4caf50 · Scrypt #2196f3 · Skein #ff9800 · Qubit #9c27b0 · Odo #f44336
```

#### Component Patterns
1. **Hero Sections**: Each page starts with a gradient card + title + description
2. **Stat Cards**: Memoized metric displays with icons and formatted values
3. **Loading States**: Centered CircularProgress with "Loading…" text
4. **Responsive Grids**: Mobile-first with MUI breakpoints (nav collapses below `lg`)
5. **Chart Containers**: Responsive sizing with ref-based cleanup; `useWidth()` for SVG sizing

## Performance Architecture

### Optimization Strategies
- **Memoization**: `useMemo` for pool/algo aggregation; `React.memo` on `ForkTreeMap`, `ChainTipsExplainer`, and stat cards
- **Real-time handling**: new blocks prepended (O(1)); max array sizes enforced (~240 blocks); chart instances cleaned up on unmount; WebSocket closed on unmount
- **Bundle**: CRA/webpack tree shaking; production builds minified

### Performance Targets
```
First Contentful Paint: < 1.5s
Time to Interactive:    < 3.5s
Lighthouse Performance: > 90
Chart render time:      < 100ms
```

## Testing Architecture

### Test Stack
```
├── Unit/Integration (Vitest):  29 files, ~637 test cases
│     src/tests/unit/pages (18) · unit/components (4) · unit/context (1)
│     · unit/AppDataGuards · integration (2) · WalletConverter · App.test
└── E2E (Playwright):           21 specs, ~229 test cases × 8 browser projects
```

### Vitest (`vitest.config.js`)
```javascript
{
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.js', './src/setupTests.js'],
    coverage: {
      provider: 'v8',
      thresholds: { statements: 95, branches: 95, functions: 95, lines: 95 }
    }
  }
}
```

### Playwright (`playwright.config.js`)
```javascript
{
  testDir: './e2e',
  baseURL: 'http://localhost:3005',
  projects: [
    'chromium', 'firefox', 'webkit',
    'Mobile Chrome', 'Mobile Safari', 'Mobile Safari Legacy',
    'Microsoft Edge' /* channel: msedge */, 'Google Chrome' /* channel: chrome */
  ]
}
```

### Mock Infrastructure
- **MSW Handlers**: mock all REST API endpoints
- **WebSocket Mock**: custom `MockWebSocket` class in `testUtils.js`
- **Canvas Mock**: `vitest-canvas-mock` for Chart.js in jsdom
- **Observer Mocks**: ResizeObserver, IntersectionObserver

### Test Commands
```bash
npm test              # Vitest watch mode
npm run test:run      # Single run
npm run test:coverage # Coverage report (95% threshold)
npm run test:e2e      # Playwright E2E tests
npm run test:all      # Unit + E2E
```

## Deployment Architecture

### Build Process
```bash
npm start             # Dev server (port 3005)
npm run build         # Optimized build in /build
```

### Environment Configuration
Two configuration surfaces exist:

1. **`src/config.js`** (legacy) — hardcoded `const env = 'development'`, consumed by `App.js` (top-level REST poll), `Footer.js`, `PoolsPage.js`, `RoadmapPage.js`, `DDActivationPage.js`, and `PoolUpgradeTrackerPage.js`:
```javascript
const config = {
  development: { apiBaseUrl: 'http://localhost:5001', wsBaseUrl: 'ws://localhost:5002' },
  production:  { apiBaseUrl: 'https://digibyte.io',   wsBaseUrl: 'wss://digibyte.io/ws' }
};
const env = 'development';
export default config[env];
```

2. **`src/context/NetworkContext.js`** (authoritative, per-network, `REACT_APP_*`-overridable):
- REST API: `http://localhost:5001` (shared)
- Mainnet WebSocket: `ws://localhost:5002`
- Testnet WebSocket: `ws://localhost:5003`

### Deployment Requirements
- Node.js 14.x or higher (tested with 21.7.2)
- Backend server (dgbstats-server) running
- DigiByte node with RPC enabled
- Static file hosting (Nginx, CDN)

## Design Patterns

### Component Patterns
1. **Functional Components**: hooks-only (no class components)
2. **Custom Hooks**: `useWidth()` for responsive design; `useNetworkData` hooks for REST
3. **Layout Routes**: React Router nested routes provide per-network Provider/theme
4. **Compound Components**: StatCard / KpiTile with icon variants

### Data Patterns
1. **Observer Pattern**: per-page WebSocket subscriptions for real-time updates
2. **Memoization Pattern**: `useMemo`/`React.memo` for expensive derivations
3. **Fallback Pattern**: default/loading data; graceful empty states
4. **Cleanup Pattern**: `useEffect` cleanup for WebSocket and chart instances

## Architecture Summary

### Key Statistics
- **Pages**: 19 components — 15 on both networks, 3 mainnet-only (Pools, Downloads, Roadmap), 1 testnet-only (WalletConvert); 18 mainnet + 16 testnet routes
- **Components**: 9 (Header, Footer, XIcon, MainnetLayout, TestnetLayout, ForkAlertBanner, ForkTreeMap, ChainTipsExplainer, IntegrationGuides)
- **Context Providers**: 1 (NetworkContext) with 3 network configs
- **Custom Hooks**: 5 in `useNetworkData.js` + `useWidth`
- **Utilities**: 3 (formatNumber, numberWithCommas, useWidth)
- **WebSocket message types**: 17 inbound + 1 outbound
- **REST endpoints**: 6 backend + 1 external (GitHub)
- **Unit/Integration Tests**: 29 files (~637 cases)
- **E2E Tests**: 21 spec files (~229 cases) across 8 browser projects

### Network Support
- **Mainnet**: `/` routes (WebSocket 5002)
- **Testnet**: `/testnet/*` routes (WebSocket 5003)
- **Network Switching**: Mainnet/Testnet toggle in the header

### Critical Features
- **Multi-Algorithm Support**: 5 mining algorithms with color coding
- **Real-Time Updates**: per-page WebSockets for live blockchain data
- **Chain Tips & Forks**: live fork-tree map + site-wide fork-risk banner
- **Geographic Visualization**: D3-geo world map (peers crawled from DigiHash `peers.dat`)
- **DigiDollar**: BIP9 activation tracking, oracle price feeds, network-health stats (shipped in v9.26.x)
- **Supply Tracking**: 21 billion DGB max with emission projections
- **Softfork Status**: uses `getdeploymentinfo` RPC for activation status

### SEO Implementation
- Open Graph + Twitter Card meta tags (`public/index.html`)
- JSON-LD structured data
- `robots.txt` allowing major + AI crawlers (GPTBot, ChatGPT-User, Claude-Web, anthropic-ai, Applebot)
- **`sitemap.xml`** lists all current mainnet and testnet routes (including `/tips`, `/pool-upgrades`, `/taproot`, and `/testnet/convert`). Keep it in sync when adding pages.

---

*Architecture Document v2.0*
*Last Updated: 2026-07-06*
*DigiByte Stats - Real-Time Blockchain Analytics*
