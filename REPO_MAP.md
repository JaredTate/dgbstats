# REPO_MAP.md

Repository map for `~/Code/dgbstats`.

Snapshot of the source tree: 19 page components, 9 shared components, 1 context,
1 hooks module, and the supporting test/config files. Regenerate/refresh when files
are added or their exports change.

## Root Config Files
### package.json
- Project manifest (npm scripts/dependencies)
- Top-level keys: `main`, `name`, `version`, `private`, `dependencies`, `scripts`, `eslintConfig`, `browserslist`, `devDependencies`
- Scripts: `start` (PORT=3005), `build`, `test`/`test:run`/`test:ui`/`test:watch`/`test:coverage` (Vitest), `test:e2e`/`test:e2e:ui` (Playwright), `test:all`, `test:clean`, `test:all:clean`, `posttest`, `posttest:e2e`, `eject`

### playwright.config.js
- Playwright E2E test runner configuration
- Default export: `defineConfig`
- 8 browser projects: chromium, firefox, webkit, Mobile Chrome, Mobile Safari, Mobile Safari Legacy, Microsoft Edge (channel msedge), Google Chrome (channel chrome)
- Imports libraries: `@playwright/test`

### vitest.config.js
- Vitest test runner configuration (jsdom env, globals, 95% coverage thresholds, v8 provider)
- Default export: `defineConfig`
- Imports libraries: `vitest/config`, `@vitejs/plugin-react`, `path`

### vitest.config.simple.js
- Minimal Vitest configuration
- Default export: `defineConfig`
- Imports libraries: `vitest/config`, `@vitejs/plugin-react`, `path`

## Source Files (`src/`)
### src/App.css
- CSS selectors/classes: `.App`, `.App-logo`, `.App-header`, `.App-link`

### src/App.js
- Default export: `App`
- Named export: `parseBlockRewardResponse` (const)
- Defines: `App`, `theme` (MUI createTheme, primary #002352)
- Polls REST `getblockchaininfo`/`getchaintxstats`/`gettxoutsetinfo`/`getblockreward` every 30s
- Declares 18 mainnet routes under `MainnetLayout` and 16 testnet routes under `TestnetLayout`
- Imports local modules: `./utils`, `./config`, `./App.module.css`, all 19 `./pages/*`, `./components/MainnetLayout`, `./components/TestnetLayout`; libraries: `react`, `react-router-dom`, `@mui/material`

### src/App.module.css
- CSS selectors/classes: `.container`, `.app`, `.contentContainer`, `.header`, `.title`, `.main`, `.gridContainer`, `.paper`, `.boxHeading`, `.boxText`, `.boldText`, `.centerText` ...

### src/App.test.js
- Automated test file (Vitest/Testing Library)
- Imports local modules: `./App`; libraries: `vitest`, `@testing-library/react`, `@mui/material/styles`

### src/components/ChainTipsExplainer.js
- Default export: `React.memo(ChainTipsExplainer)`
- Defines: `StatusChip`, `ChainTipsExplainer`
- Presentational collapsible explainer for the `/tips` page (accepts `accentColor`); no network I/O
- Imports libraries: `react`, `@mui/material`, `@mui/icons-material/ExpandMore`, `@mui/icons-material/AccountTree`, `@mui/icons-material/CallSplit` ...

### src/components/Footer.js
- Default export: `Footer`
- Defines: `Footer`
- Fetches visit stats from `${config.apiBaseUrl}/api/visitstats` (60s poll)
- Imports local modules: `./XIcon`, `../config`; libraries: `react`, `@mui/material`, `@mui/icons-material/GitHub`, `@mui/icons-material/MonetizationOn`, `@mui/icons-material/BarChart`, `axios`

### src/components/ForkAlertBanner.js
- Default export: `ForkAlertBanner`
- Defines: `ForkAlertBanner`
- Site-wide fork-risk banner; opens its own WebSocket and listens for `forkAlert` messages; links to `${basePath}/tips`
- Imports local modules: `../context/NetworkContext`; libraries: `react`, `@mui/material`, `react-router-dom`

### src/components/ForkTreeMap.js
- Default export: `React.memo(ForkTreeMap)`
- Defines: `ForkTreeMap` (+ `STATUS_COLORS`, `ALGO_COLORS`)
- Hand-rolled responsive SVG map of the main chain spine and competing fork tips
- Imports local modules: `../utils` (`useWidth`); libraries: `react`, `@mui/material`

### src/components/Header.js
- Default export: `Header`
- Defines: `Header`
- Network-aware nav (distinct mainnet / testnet menus), external-resource links, mobile drawer, Mainnet/Testnet switch
- Imports local modules: `../context/NetworkContext`; libraries: `react`, `@mui/material`, `@mui/icons-material/Menu`, `@mui/icons-material/GitHub`, `@mui/icons-material/OpenInNew`, `react-router-dom`

### src/components/IntegrationGuides.js
- Default export: `IntegrationGuides`
- Defines: `IntegrationGuides`
- Reusable DigiDollar wallet/exchange integration + reference-doc link card (used on DigiDollarPage, OraclesPage, DDStatsPage, DDActivationPage)
- Imports libraries: `react`, `@mui/material`, `@mui/icons-material/AccountBalanceWallet`, `@mui/icons-material/CurrencyExchange`, `@mui/icons-material/Launch`, `@mui/icons-material/IntegrationInstructions`

### src/components/MainnetLayout.js
- Default export: `MainnetLayout`
- Defines: `MainnetLayout`
- Wraps mainnet routes: `NetworkProvider network="mainnet"` + Header + ForkAlertBanner + Outlet + Footer (no local ThemeProvider; inherits App.js/index.js theme)
- Imports local modules: `../context/NetworkContext`, `./Header`, `./Footer`, `./ForkAlertBanner`, `../App.module.css`; libraries: `react`, `react-router-dom`

### src/components/TestnetLayout.js
- Default export: `TestnetLayout`
- Defines: `TestnetLayout`, `testnetTheme` (green createTheme)
- Wraps testnet routes: `NetworkProvider network="testnet"` + local green ThemeProvider + Header + ForkAlertBanner + Outlet + Footer
- Imports local modules: `../context/NetworkContext`, `./Header`, `./Footer`, `./ForkAlertBanner`; libraries: `react`, `react-router-dom`, `@mui/material`

### src/components/XIcon.js
- Default export: `XIcon`
- Defines: `XIcon` (custom X/Twitter SvgIcon)
- Imports libraries: `react`, `@mui/material`

### src/config.js
- Default export: `config` (development profile)
- Legacy config: `development` { apiBaseUrl 5001, wsBaseUrl 5002 } / `production` { digibyte.io } with `const env = 'development'` hardcoded
- Consumed by `App.js`, `Footer.js`, `PoolsPage.js`, `RoadmapPage.js`, `DDActivationPage.js`, `PoolUpgradeTrackerPage.js`; app-wide network URLs otherwise come from `NetworkContext`

### src/context/NetworkContext.js
- Default export: `NetworkContext`
- Named export: `getNetworkConfig` (const), `NetworkProvider` (const), `useNetwork` (const)
- Defines 2 network configs: `mainnet` (ws 5002), `testnet` (ws 5003). `useNetwork()` returns the spread config plus `isMainnet`/`isTestnet`, `getApiUrl(endpoint)` and `getNetworkPath(endpoint)`
- Imports libraries: `react`

### src/countries-110m.json
- Top-level keys: `type`, `objects`, `arcs`, `bbox`, `transform` (TopoJSON world map)

### src/hooks/useNetworkData.js
- Named export: `useBlockchainInfo`, `useChainTxStats`, `useTxOutsetInfo`, `useBlockReward`, `useNetworkWebSocket` (all const)
- Default export: object bundling the 5 hooks
- Imports local modules: `../context/NetworkContext`; libraries: `react`

### src/index.css
- CSS file with global/element selectors

### src/index.js
- React 17 entry point (`ReactDOM.render` + `React.StrictMode`); sets a global MUI theme (primary #0066CC, secondary #002352, dark background)
- Imports local modules: `./App`, `./reportWebVitals`, `./index.css`; libraries: `react`, `react-dom`, `@mui/material/styles`

### src/logo.svg
- CRA default logo asset (unused by app UI)

### src/pages/AlgosPage.js
- Default export: `AlgosPage`
- Defines: `getAlgoColor`, `HeroSection`, `MultiAlgoInfoSection`, `AlgosPage`
- Imports local modules: `../context/NetworkContext`; libraries: `react`, `@mui/icons-material/PieChart`, `d3`

### src/pages/BlocksPage.js
- Default export: `BlocksPage`
- Defines: `HeroSection`, `LoadingCard`, `getAlgoColor`, `formatNumber`, `BlockCard`, `PaginationControls`, `BlocksPage`
- Imports local modules: `../context/NetworkContext`; libraries: `react`, `@mui/material`, `@mui/icons-material/*`

### src/pages/ChainTipsPage.js
- Default export: `ChainTipsPage`
- Named export: `buildOrphanBuckets` (const), `buildDailySeries` (const)
- Defines: `KpiTile`, `ChainTipsPage`
- `/tips` "Chain Tips & Orphans": fork-tree map, chain-tips + orphans tables, 30-day orphans chart. WebSocket `recentBlocks`/`newBlock`/`chainTips`/`forkAlert`
- Imports local modules: `../context/NetworkContext`, `../components/ForkTreeMap`, `../components/ChainTipsExplainer`; libraries: `react`, `chart.js`, `@mui/icons-material/AccountTree`, `@mui/icons-material/CallSplit` ...

### src/pages/DDActivationPage.js
- Default export: `DDActivationPage`
- Defines: `DDActivationPage`
- `/activation` BIP9 activation tracker for DigiDollar (bit 23) + Algolock/Groestl removal (bit 0). WebSocket `ddDeploymentData` + REST `getdeploymentinfo` (30s poll)
- Imports local modules: `../context/NetworkContext`, `../components/IntegrationGuides`, `../config`; libraries: `react`, `@mui/icons-material/RocketLaunch`, `@mui/icons-material/CheckCircle` ...

### src/pages/DDStatsPage.js
- Default export: `DDStatsPage`
- Defines: `DDStatsPage`
- `/ddstats` DigiDollar network health dashboard. WebSocket `ddStatsData`/`ddDeploymentData`
- Imports local modules: `../context/NetworkContext`, `../components/IntegrationGuides`; libraries: `react`, `react-router-dom`, `@mui/icons-material/Lock`, `@mui/icons-material/HealthAndSafety` ...

### src/pages/DifficultiesPage.js
- Default export: `DifficultiesPage`
- Defines: `HeroSection`, `LoadingCard`, `AlgorithmCard`, `DigiShieldInfoSection`, `DifficultiesPage`
- Imports local modules: `../context/NetworkContext`; libraries: `react`, `chart.js`, `@mui/icons-material/TrendingUp`

### src/pages/DigiDollarPage.js
- Default export: `DigiDollarPage`
- Defines: `DigiDollarPage`
- Imports local modules: `../components/IntegrationGuides`; libraries: `react`, `@mui/icons-material/AccountBalance`, `@mui/icons-material/Security`, `@mui/icons-material/Speed`, `@mui/icons-material/Public` ...

### src/pages/DownloadsPage.js (mainnet only)
- Default export: `DownloadsPage`
- Defines: `DownloadsPage`
- Fetches `https://api.github.com/repos/digibyte-core/digibyte/releases`
- Imports libraries: `react`, `@mui/icons-material/CloudDownload`, `@mui/icons-material/GitHub`, `@mui/icons-material/Computer` ...

### src/pages/HashratePage.js
- Default export: `HashratePage`
- Defines: `HashratePage`
- Imports local modules: `../context/NetworkContext`; libraries: `react`, `@mui/icons-material/Speed`, `@mui/icons-material/Timer`, `@mui/icons-material/Language`

### src/pages/HomePage.js
- Default export: `HomePage`
- Defines: `HomePage` (+ `StatCard`)
- WebSocket `initialData`; renders core blockchain stat cards + softfork status
- Imports local modules: `../context/NetworkContext`; libraries: `react`, `@mui/icons-material/ViewCompact`, `@mui/icons-material/Storage`, `@mui/icons-material/Token` ...

### src/pages/NodesPage.css
- CSS selectors/classes: `.page-container`, `.centered-text`, `.MuiDataGrid-columnHeaderTitle`, `.grid-container`, `.zoom-controls`, `.nodes-by-country`, `.map-container`

### src/pages/NodesPage.js
- Default export: `NodesPage`
- Defines: `useFetchData`, `NodesPage`
- WebSocket `geoData` + `nodeVersions24h`; world map + addrman + country/version distribution
- Imports local modules: `./digibyte256.png`, `../utils`, `../countries-110m.json`, `../context/NetworkContext`; libraries: `react`, `@visx/geo`, `d3-geo`, `d3-zoom`, `d3-selection` ...

### src/pages/OraclesPage.js (both networks)
- Default export: `OraclesPage`
- Defines: `OraclesPage`
- WebSocket `oracleData` (+ `ddDeploymentData`); DGB/USD Schnorr-consensus price feeds
- Imports local modules: `../context/NetworkContext`, `../components/IntegrationGuides`; libraries: `react`, `react-router-dom`, `@mui/icons-material/Sensors`, `@mui/icons-material/CloudDone` ...

### src/pages/PoolsPage.css
- CSS selectors/classes: `.pie-chart-container`

### src/pages/PoolsPage.js (mainnet only)
- Default export: `PoolsPage`
- Defines: `PoolsPage`
- D3.js donut chart of mining-pool market share
- Imports local modules: `../config`; libraries: `react`, `@mui/icons-material/LocationCity`, `d3`

### src/pages/PoolUpgradeTrackerPage.js
- Default export: `PoolUpgradeTrackerPage`
- Defines: `PoolUpgradeTrackerPage`
- `/pool-upgrades` per-pool BIP9 signal tracker (DigiDollar bit 23, Algolock bit 0) with SHA256D version-rolling detection. WebSocket blocks + REST `getdeploymentinfo`/`getblockchaininfo`
- Imports local modules: `../context/NetworkContext`, `../config`; libraries: `react`, `@mui/icons-material/SystemUpdateAlt`, `@mui/icons-material/CheckCircle` ...

### src/pages/RoadmapPage.js (mainnet only)
- Default export: `RoadmapPage`
- Defines: `RoadmapPage`
- WebSocket `roadmapUpdate`; sends outbound `subscribeRoadmap`
- Imports local modules: `../config`; libraries: `react`, `@mui/icons-material/ExpandMore`, `@mui/icons-material/CheckCircle` ...

### src/pages/SupplyPage.js
- Default export: `SupplyPage`
- Defines: `hexToRgb`, `SupplyPage`
- Imports local modules: `../context/NetworkContext`; libraries: `react`, `chart.js`, `@mui/icons-material/Token`, `@mui/icons-material/People` ...

### src/pages/TaprootPage.js
- Default export: `TaprootPage`
- Defines: `getStateColor`, `HeaderSection`, `ActivationStatusCard`, `RecentSupportCard`, `ActivationDetailsCard`, `ProgressSection`, `BIP9ExplanationSection`, `TechnicalParametersSection`, `TaprootPage`
- Route exists on both networks but is not linked from the header nav
- Imports local modules: `../App.module.css`, `../context/NetworkContext`; libraries: `react`, `@mui/material`

### src/pages/TxsPage.js
- Default export: `TxsPage`
- Defines: `HeroSection`, `LoadingCard`, `EmptyState`, `getPriorityColor`, `getConfirmationColor`, `formatNumber`, `formatDGB`, `formatRelativeTime`, `calculateTotalValue`, `FeeDistributionChart` (+ more)
- WebSocket `mempool`/`recentTransactions`/`newTransaction`/`transactionConfirmed`/`confirmedTransaction`/`removedTransaction`
- Imports local modules: `../context/NetworkContext`; libraries: `react`, `@mui/icons-material/AccountBalanceWallet`, `@mui/icons-material/Speed` ...

### src/pages/WalletConvertPage.js (testnet only)
- Default export: `WalletConvertPage`
- Named export: `APPLICATION_IDS`, `CURRENT_TESTNET` (const); `isSqliteFile`, `readApplicationId`, `detectNetwork`, `patchApplicationId` (functions)
- Defines: `WalletConvertPage`
- 100% client-side wallet.dat `application_id` patcher (bytes 68–71). Default target `testnet26` (0xFEC6B9E7)
- Imports libraries: `react`, `@mui/material`, `@mui/icons-material/SwapHoriz`, `@mui/icons-material/Security`, `@mui/icons-material/UploadFile` ...

### src/pages/digibyte256.png
- 256px DigiByte logo used as the NodesPage map marker

### src/reportWebVitals.js
- Default export: `reportWebVitals`

### src/setupTests.js
- Canvas/Observer mocks for jsdom
- Imports libraries: `vitest`

### src/utils.js
- Named export: `formatNumber`, `numberWithCommas`, `useWidth` (all const)
- Imports libraries: `react`

## Test Files (`src/tests/`)
### src/tests/setup.js
- Vitest setup (MSW server, chart mocks); defines `createMockChartInstance`
- Imports local modules: `./mocks/server`; libraries: `@testing-library/react`, `vitest`

### src/tests/mocks/handlers.js
- Named export: `handlers` (const) — MSW request handlers
- Imports local modules: `./mockData`; libraries: `msw`

### src/tests/mocks/mockData.js
- Named export: `mockApiResponses` (const), `generateWebSocketMessage` (const)

### src/tests/mocks/server.js
- MSW server setup

### src/tests/utils/testUtils.js
- Named export: `renderWithProviders` (function), `MockWebSocket` (class), `createWebSocketMock`, `waitForAsync`, `mockChartJs`, `mockD3Selection`, `mockLocalStorage`, `generateMockNode`, `generateMockBlock`, `generateMockMiner`; re-exports Testing Library
- Imports local modules: `../../context/NetworkContext`; libraries: `react`, `@testing-library/react`, `react-router-dom`, `@mui/material/styles`, `vitest`

### Unit tests — `src/tests/unit/`
- `AppDataGuards.test.js`
- `components/ChainTipsExplainer.test.js`, `components/ForkAlertBanner.test.js`, `components/ForkTreeMap.test.js`, `components/Header.test.js`
- `context/NetworkContext.test.js`
- `pages/AlgosPage.test.js`, `pages/BlocksPage.test.js`, `pages/ChainTipsPage.test.js`, `pages/DDActivationPage.test.js`, `pages/DDStatsPage.test.js`, `pages/DifficultiesPage.test.js`, `pages/DigiDollarPage.test.js`, `pages/DownloadsPage.test.js`, `pages/HashratePage.test.js`, `pages/HomePage.test.js`, `pages/NodesPage.test.js`, `pages/OracleCopyGuards.test.js`, `pages/OraclesPage.test.js`, `pages/PoolsPage.test.js`, `pages/PoolUpgradeTrackerPage.test.js`, `pages/RoadmapPage.test.js`, `pages/SupplyPage.test.js`, `pages/TxsPage.test.js`

### Integration tests — `src/tests/integration/`
- `App.integration.test.js`
- `pages/PageIntegration.test.js`

### Other test files
- `src/tests/pages/RoadmapPage.test.js`
- `src/tests/WalletConverter.test.js`
- `src/App.test.js`

Totals: 29 unit/integration test files (~637 test cases) + 21 Playwright e2e specs (~229 cases).

## E2E Tests (`e2e/`)
21 `*.spec.js` files: `accessibility`, `blocks`, `browser-compatibility`, `browser-issue-detector`,
`cross-browser-fixes`, `downloads`, `edge-chromium-fixes`, `firefox-specific`, `homepage`,
`mobile-debug`, `mobile`, `mobile-webkit`, `navigation`, `nodes-enhanced-debug`, `nodes-enhanced`,
`nodes`, `performance`, `pools`, `roadmap`, `supply`, `webkit-safari-fixes`. Plus `test-helpers.js`,
`utils/`, `README.md`, `TIMEOUT_OPTIMIZATIONS.md`.

## Public Assets (`public/`)
- `index.html`, `manifest.json`, `favicon.ico`, `logo.png`, `logo192.png`, `logo512.png`
- `og-image.png`, `og-images/` (`og-image.png`, `og-blocks.png`, `og-nodes.png`, `og-supply.png`)
- `robots.txt` (allows major + AI crawlers)
- `sitemap.xml` — lists all current mainnet and testnet routes (including `/tips`, `/pool-upgrades`, `/taproot`, `/testnet/convert`); no retired pre-launch rehearsal URLs
