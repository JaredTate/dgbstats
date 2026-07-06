# DigiByte Stats - AI Agent Documentation

## Project Overview

DigiByte Stats is a comprehensive React-based web application that provides real-time statistics, visualizations, and analytics for the DigiByte blockchain. The application connects to a DigiByte node via RPC and WebSocket connections to deliver live blockchain data through an intuitive, responsive interface.

## Architecture

### Technology Stack
- **Frontend**: React 17.0.2 with Material-UI (MUI) v5
- **Routing**: React Router v6 (nested layout routes per network)
- **Data Visualization**: D3.js v7, @visx/geo, Chart.js v4
- **Real-time Communication**: WebSocket for live blockchain updates (per-page connections)
- **Testing**: Vitest (unit/integration), Playwright (E2E)
- **Build Tool**: Create React App 5.0.1

### Key Dependencies
- `@mui/material`, `@mui/icons-material`, `@mui/lab`, `@mui/x-data-grid`: UI component libraries
- `d3` & `d3-geo` & `@visx/geo`: Advanced data visualizations and geographic maps
- `chart.js` & `react-chartjs-2` & `chartjs-adapter-luxon`: Time series and statistical charts
- `axios`: HTTP client for API requests
- `world-atlas`, `us-atlas`, `topojson-client`, `geoip-lite`: Geographic data for node visualization

## Application Pages

The application has **19 page components**. `App.js` registers **18 mainnet routes** (under `MainnetLayout`) and **16 testnet routes** (under `TestnetLayout`). Of the 19 pages: **15 render on both networks**, **3 are mainnet-only** (Pools, Downloads, Roadmap), and **1 is testnet-only** (Wallet Convert).

### Pages on Both Networks (mainnet path shown; testnet is prefixed with `/testnet`)

### 1. **HomePage** (`/`)
Main dashboard displaying key DigiByte statistics: block height, supply, hashrate, difficulties, softfork status, latest version, and recent blocks. Title switches to "DigiByte Testnet Blockchain Statistics" on testnet. (WebSocket `initialData`.)

### 2. **BlocksPage** (`/blocks`)
Real-time block explorer: latest ~240 blocks (paginated 20/page), mining algorithm, block reward/size, and miner/pool identification. (WebSocket `recentBlocks`/`newBlock`.)

### 3. **ChainTipsPage** (`/tips`) — *"Chain Tips & Orphans"*
Live fork monitoring: fork-risk status strip, KPI tiles (active height, competing tips, orphans in 24h, deepest branch), an SVG live **fork-tree map** (`ForkTreeMap`), current chain-tips table, recent-orphans table, a 30-day orphans-per-day chart, and an educational explainer (`ChainTipsExplainer`). (WebSocket `recentBlocks`/`newBlock`/`chainTips`/`forkAlert`.)

### 4. **TxsPage** (`/txs`)
Transaction analytics: mempool monitoring, recent confirmed transactions, fee statistics, and volume charts. (WebSocket `mempool`/`recentTransactions`/`newTransaction`/`transactionConfirmed`/`confirmedTransaction`/`removedTransaction`.)

### 5. **AlgosPage** (`/algos`)
Mining algorithm distribution across the five DigiByte algorithms (SHA256D, Scrypt, Skein, Qubit, Odocrypt) with a proportional chart driven by the live block feed.

### 6. **HashratePage** (`/hashrate`)
Per-algorithm network hashrate calculations and charts derived from difficulty data.

### 7. **DifficultiesPage** (`/difficulties`)
Real-time per-algorithm difficulty charts (Chart.js) for the five algorithms, including DigiShield context.

### 8. **PoolUpgradeTrackerPage** (`/pool-upgrades`)
Per-pool software-upgrade tracker. Detects two BIP9 deployment signals in block versions over the last ~240 blocks: **DigiDollar** (bit 23 → node on v9.26.x) and **Algolock** (bit 0 → v9.26.2+, rejects the retired Groestl algorithm), with SHA256D version-rolling detection (`ddRaw` vs `ddClean`), a Groestl enforcement-backstop panel, and an expandable per-pool per-algorithm breakdown. (WebSocket blocks + REST `getdeploymentinfo`/`getblockchaininfo`.)

### 9. **NodesPage** (`/nodes`)
Geographic node distribution: interactive world map of unique nodes seen in the DigiHash mining pool wallet's `peers.dat`, plus an addrman summary, "Nodes Seen (24h)" version breakdown, and node count by country. (WebSocket `geoData`/`nodeVersions24h`.)

### 10. **SupplyPage** (`/supply`)
Supply economics: circulating vs. 21 billion DGB max supply, supply per capita, emission/inflation metrics, and a projection chart. Consumes `txOutsetInfo` on mainnet.

### 11. **TaprootPage** (`/taproot`)
Taproot activation monitoring (BIP9). Taproot is active/buried, so it shows YES with a static note. The route exists on both networks but has **no header nav link**.

### 12. **DigiDollarPage** (`/digidollar`)
DigiDollar stablecoin explainer: use cases, benefits, collateral tier system, and implementation details, plus the reusable `IntegrationGuides` card.

### 13. **DDActivationPage** (`/activation`)
BIP9 soft-fork activation tracker for DigiDollar (bit 23) and the Algolock/Groestl-removal deployment (bit 0): status cards, DEFINED→STARTED→LOCKED_IN→ACTIVE stage flow, signaling progress bar with threshold marker, BIP9 explainer, and technical parameters. (WebSocket `ddDeploymentData` + REST `getdeploymentinfo`, 30s poll.)

### 14. **OraclesPage** (`/oracles`)
DigiDollar oracle price-feed network monitor: DGB/USD price via BIP-340 Schnorr signature consensus, latest-bundle signer count, last update height, 24-hour price range/volatility, and per-oracle reporting status. (WebSocket `oracleData`/`ddDeploymentData`.) **Available on both networks.**

### 15. **DDStatsPage** (`/ddstats`)
DigiDollar network-health dashboard: system health %, total collateral locked (DGB), total DD supply, oracle price, DCA/ERR tier status, active positions, and a collateralization bar. (WebSocket `ddStatsData`/`ddDeploymentData`.) **Available on both networks.**

### Mainnet-Only Pages

### 16. **PoolsPage** (`/pools`)
Mining pool distribution: interactive D3.js donut chart of pool market share, multi-block and single-block miners, updating live as blocks are mined.

### 17. **DownloadsPage** (`/downloads`)
DigiByte Core download statistics from GitHub releases, broken down by version and platform (Windows, Mac, Linux). (Uses `api.github.com/repos/digibyte-core/digibyte/releases`.)

### 18. **RoadmapPage** (`/roadmap`)
Development roadmap (2025–2029) with phased priorities and upcoming features. (WebSocket `roadmapUpdate`; sends an outbound `subscribeRoadmap` message.)

### Testnet-Only Page

### 19. **WalletConvertPage** (`/testnet/convert`)
Client-side Oracle wallet migration tool:
- Patches SQLite `application_id` bytes (offset 68–71, big-endian `pchMessageStart`) to migrate `wallet.dat` between DigiByte networks
- 100% browser-side processing — no server upload, safe for wallets with private keys
- Drag & drop file selection with automatic network detection
- Supports mainnet, testnet19/20/21/23/24/25, testnet26, and regtest; the default migration target is **testnet26 (`0xFEC6B9E7`)**
- Download converted `wallet.dat` and backup (`.bak`)
- Includes step-by-step migration instructions and a `walletcrosschain=1` reminder
- This is the **only** testnet-exclusive page

## Design System

### Theme Configuration
```javascript
Mainnet Primary:   #002352 (DigiByte Blue)   Accent: #0066cc
Testnet Primary:   #2e7d32 (Forest Green)     Accent: #4caf50
Background: Linear gradients (per-network)
Card Elevation: Consistent shadow patterns
Border Radius: 8px (buttons), 8–12px (cards)
```
> The global MUI theme is created in `src/index.js`; `App.js` wraps all routes in a second (blue) theme used by mainnet pages, and `TestnetLayout` applies its own green theme.

### Component Patterns
1. **Hero Sections**: Each page starts with a hero card containing title and description
2. **Stat Cards / KPI Tiles**: Reusable metric display components with consistent styling
3. **Loading States**: Circular progress indicators with "Loading..." text
4. **Error Boundaries**: Graceful error handling with fallback UI
5. **Responsive Grids**: Mobile-first design with breakpoint-specific layouts (nav collapses below `lg`)

### Data Flow
1. **WebSocket Connection**: Established on component mount for real-time updates (per page)
2. **API Calls**: RESTful endpoints for initial data loading (via `NetworkContext.getApiUrl`)
3. **State Management**: React hooks (useState, useEffect, useMemo)
4. **Performance Optimization**: Memoization for expensive computations

## Development Guidelines

### Code Standards
- **Components**: Functional components with hooks only (no class components)
- **Styling**: MUI sx prop for component-specific styles, CSS modules for global styles
- **Data Fetching**: Async/await pattern with proper error handling
- **Testing**: 95% coverage threshold (statements/branches/functions/lines)
- **Comments**: JSDoc comments for major components and functions

### File Structure
```
src/
├── pages/           # Page components (19 pages)
├── components/      # Reusable components (9: Header, Footer, Layouts, Fork*, IntegrationGuides, ...)
├── context/         # React Context providers (NetworkContext)
├── hooks/           # Custom hooks (useNetworkData.js with 5 hooks)
├── utils.js         # Utility functions (formatNumber, numberWithCommas, useWidth)
├── tests/           # Test suites (29 unit/integration files)
│   ├── unit/       # Component/page/context unit tests
│   │   ├── pages/  # Page-specific tests (18)
│   │   ├── components/ # Component tests (4)
│   │   └── context/ # Context tests (1)
│   ├── integration/ # Integration tests (2)
│   ├── mocks/      # MSW handlers and mock data
│   └── utils/      # Test utilities
├── config.js        # Legacy configuration (dev/prod URLs)
└── App.js          # Main application component with routing
```

### WebSocket Protocol
Messages follow this structure:
```javascript
{ type: 'initialData' | 'recentBlocks' | 'newBlock' | ..., data: { ... } }
```

**Inbound message types (17)**: `initialData`, `recentBlocks`, `newBlock`, `geoData`, `nodeVersions24h`, `mempool`, `recentTransactions`, `newTransaction`, `transactionConfirmed`, `confirmedTransaction`, `removedTransaction`, `chainTips`, `forkAlert`, `ddDeploymentData`, `ddStatsData`, `oracleData`, `roadmapUpdate`.

**Outbound message types (1)**: `subscribeRoadmap` (sent by RoadmapPage on socket open).

### API Endpoints
Constructed via `NetworkContext.getApiUrl(path)` → `${apiBaseUrl}/api${apiPrefix}${path}` (testnet prefixes with `/testnet`):
- `/api/getblockchaininfo` — Blockchain statistics and difficulties
- `/api/getchaintxstats` — Transaction statistics
- `/api/gettxoutsetinfo` — UTXO set / supply data
- `/api/getblockreward` — Current block reward
- `/api/getdeploymentinfo` — BIP9 deployment stats (DigiDollar, Algolock)
- `/api/visitstats` — Page-view analytics (Footer)
- External: `https://api.github.com/repos/digibyte-core/digibyte/releases` (DownloadsPage)

## Testing Strategy

### Unit Testing (Vitest)
- Component rendering tests
- User interaction simulation
- State management verification
- Utility function testing
- 29 unit/integration test files, ~637 test cases

### E2E Testing (Playwright)
- Cross-browser testing across 8 projects (Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari, Mobile Safari Legacy, Microsoft Edge, Google Chrome)
- Mobile responsiveness, performance metrics, accessibility (axe-playwright)
- 21 spec files, ~229 test cases

### Test Commands
```bash
npm test              # Watch mode
npm run test:run      # Single run
npm run test:coverage # Coverage report
npm run test:e2e      # E2E tests
npm run test:all      # All tests
```

## Performance Considerations

### Optimization Techniques
1. **React.memo**: Prevent unnecessary re-renders (ForkTreeMap, ChainTipsExplainer, stat cards)
2. **useMemo/useCallback**: Memoize expensive operations
3. **WebSocket Throttling**: Batch updates to prevent UI blocking
4. **Bounded Arrays**: Maximum array sizes enforced (~240 blocks)
5. **Chart Optimization**: Simplified rendering for mobile devices; `useWidth()` for responsive SVG

### Mobile Optimizations
- Responsive SVG sizing for D3.js / hand-rolled SVG charts
- Touch-friendly interaction zones
- Reduced data points on mobile charts
- Nav collapses to a drawer below the `lg` breakpoint

## Deployment Notes

### Configuration
Two configuration surfaces exist:

1. **`src/config.js`** (legacy, hardcoded to development) — consumed by `App.js`, `Footer.js`, `PoolsPage.js`, `RoadmapPage.js`, `DDActivationPage.js`, `PoolUpgradeTrackerPage.js`:
```javascript
const config = {
  development: { apiBaseUrl: 'http://localhost:5001', wsBaseUrl: 'ws://localhost:5002' },
  production:  { apiBaseUrl: 'https://digibyte.io',   wsBaseUrl: 'wss://digibyte.io/ws' }
};
const env = 'development'; // Currently hardcoded
export default config[env];
```

2. **`src/context/NetworkContext.js`** (authoritative, `REACT_APP_*`-overridable):
- Mainnet WebSocket: `ws://localhost:5002`
- Testnet WebSocket: `ws://localhost:5003`
- Shared REST API: `http://localhost:5001`

### Default Ports
- `PORT`: Frontend server port (default: 3005)
- Backend API: port 5001
- Mainnet WebSocket: port 5002
- Testnet WebSocket: port 5003

### Build Process
```bash
npm run build         # Production build
```

### Server Requirements
- Node.js 14.x or higher (tested with 21.7.2)
- DigiByte node with RPC enabled
- Backend server (dgbstats-server) running

## Common Tasks for AI Agents

### Adding a New Page
1. Create component in `src/pages/`
2. Add route(s) in `App.js` (mainnet under `MainnetLayout`, testnet under `TestnetLayout`)
3. Follow existing page structure (Hero → Content → Stats)
4. Add nav item in `Header.js` (mind the per-network `primaryMenuItems` lists)
5. Add tests in `src/tests/unit/pages/`
6. Add the route(s) to `public/sitemap.xml`

### Modifying Charts
1. Check if using D3.js, @visx, hand-rolled SVG, or Chart.js
2. Maintain responsive sizing logic (`useWidth()`)
3. Test on mobile viewports
4. Ensure loading states work

### Updating Real-time Data
1. Check WebSocket message types (17 inbound, see above)
2. Update message handlers
3. Test with mock WebSocket data (`MockWebSocket` in `testUtils.js`)
4. Verify state updates correctly

### Working with Tests
1. Run existing tests before changes
2. Update tests for modified code
3. Add new tests for new features
4. Maintain the 95% coverage threshold

## Important Notes

- **Network Support**: Application supports mainnet (`/`) and testnet (`/testnet/*`) with separate WebSocket connections and theming.
- **Both-Network Pages**: Oracles, DD Stats, and DD Activation now render on **both** mainnet and testnet (they were formerly testnet-only).
- **Testnet-Only Feature**: WalletConvertPage (`/testnet/convert`) is the **only** testnet-exclusive page.
- **Mainnet-Only Features**: PoolsPage, DownloadsPage, and RoadmapPage are not available on testnet.
- **Unlinked Route**: TaprootPage (`/taproot`) exists on both networks but has no header nav link.
- **TAP Route / Taproot Status**: Taproot soft fork has been activated and buried. References to signaling have been removed from the UI.
- **DigiDollar Status**: DigiDollar shipped in DigiByte Core v9.26.x; the app tracks BIP9 activation, oracle feeds, and network stats.
- **Mobile First**: Always test on mobile viewports first
- **Accessibility**: Maintain WCAG 2.1 AA compliance
- **Performance**: Keep Lighthouse scores above 90
- **Browser Support**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Sitemap**: `public/sitemap.xml` lists all current mainnet and testnet routes; keep it in sync when adding pages.
