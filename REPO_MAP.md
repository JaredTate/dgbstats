# REPO_MAP.md

Repository map for `~/Code/dgbstats`.

## Root Config Files
### package.json
- Project manifest (npm scripts/dependencies)
- Top-level keys: `main`, `name`, `version`, `private`, `dependencies`, `scripts`, `eslintConfig`, `browserslist`, `devDependencies`

### playwright.config.js
- Playwright E2E test runner configuration
- Default export: `defineConfig`
- Imports libraries: `@playwright/test`

### vitest.config.js
- Vitest test runner configuration
- Default export: `defineConfig`
- Imports libraries: `vitest/config`, `@vitejs/plugin-react`, `path`

### vitest.config.simple.js
- Vitest test runner configuration
- Default export: `defineConfig`
- Imports libraries: `vitest/config`, `@vitejs/plugin-react`, `path`

## Source Files (`src/`)
### src/App.css
- CSS selectors/classes: `.App`, `.App-logo`, `.App-header`, `.App-link`

### src/App.js
- Default export: `App`
- Defines: `App`
- Imports local modules: `./utils`, `./App.module.css`, `./pages/HomePage`, `./pages/DifficultiesPage`, `./pages/BlocksPage` ...; libraries: `react`, `react-router-dom`, `@mui/material`

### src/App.module.css
- CSS selectors/classes: `.container`, `.app`, `.contentContainer`, `.header`, `.title`, `.main`, `.gridContainer`, `.paper`, `.boxHeading`, `.boxText`, `.boldText`, `.centerText` ...

### src/App.test.js
- Automated test file (Vitest/Testing Library)
- Imports local modules: `./App`; libraries: `vitest`, `@testing-library/react`, `@mui/material/styles`

### src/components/Footer.js
- Default export: `Footer`
- Defines: `Footer`
- Imports local modules: `./XIcon`, `../config`; libraries: `react`, `@mui/icons-material/GitHub`, `@mui/icons-material/MonetizationOn`, `@mui/icons-material/BarChart`, `axios`

### src/components/Header.js
- Default export: `Header`
- Defines: `Header`
- Imports local modules: `../context/NetworkContext`; libraries: `react`, `@mui/icons-material/Menu`, `@mui/icons-material/GitHub`, `@mui/icons-material/OpenInNew`, `react-router-dom`

### src/components/IntegrationGuides.js
- Default export: `IntegrationGuides`
- Defines: `IntegrationGuides`
- Imports libraries: `react`, `@mui/icons-material/AccountBalanceWallet`, `@mui/icons-material/CurrencyExchange`, `@mui/icons-material/Launch`, `@mui/icons-material/IntegrationInstructions`

### src/components/MainnetLayout.js
- Default export: `MainnetLayout`
- Defines: `MainnetLayout`
- Imports local modules: `../context/NetworkContext`, `./Header`, `./Footer`, `../App.module.css`; libraries: `react`, `react-router-dom`

### src/components/TestnetLayout.js
- Default export: `TestnetLayout`
- Defines: `TestnetLayout`
- Imports local modules: `../context/NetworkContext`, `./Header`, `./Footer`; libraries: `react`, `react-router-dom`, `@mui/material`

### src/components/XIcon.js
- Default export: `XIcon`
- Defines: `XIcon`
- Imports libraries: `react`, `@mui/material`

### src/config.js
- Default export: `config`

### src/context/NetworkContext.js
- Default export: `NetworkContext`
- Named export: `NetworkProvider` (const)
- Named export: `useNetwork` (const)
- Imports libraries: `react`

### src/countries-110m.json
- Top-level keys: `type`, `objects`, `arcs`, `bbox`, `transform`

### src/hooks/useNetworkData.js
- Named export: `useBlockchainInfo` (const)
- Named export: `useChainTxStats` (const)
- Named export: `useTxOutsetInfo` (const)
- Named export: `useBlockReward` (const)
- Named export: `useNetworkWebSocket` (const)
- Imports local modules: `../context/NetworkContext`; libraries: `react`

### src/index.css
- CSS file with global/element selectors

### src/index.js
- Imports local modules: `./App`, `./reportWebVitals`; libraries: `react`, `react-dom`, `@mui/material/styles`

### src/pages/AlgosPage.js
- Default export: `AlgosPage`
- Defines: `getAlgoColor`, `HeroSection`, `MultiAlgoInfoSection`, `AlgosPage`
- Imports local modules: `../context/NetworkContext`; libraries: `react`, `@mui/icons-material/PieChart`, `d3`

### src/pages/BlocksPage.js
- Default export: `BlocksPage`
- Defines: `HeroSection`, `LoadingCard`, `getAlgoColor`, `formatNumber`, `BlockCard`, `PaginationControls`, `BlocksPage`
- Imports local modules: `../context/NetworkContext`; libraries: `react`, `@mui/icons-material/ViewCompact`, `@mui/icons-material/ArrowForwardIos`, `@mui/icons-material/ArrowBackIosNew`, `@mui/icons-material/Speed` ...

### src/pages/DDActivationPage.js
- Default export: `DDActivationPage`
- Defines: `DDActivationPage`
- Imports local modules: `../context/NetworkContext`, `../components/IntegrationGuides`; libraries: `react`, `@mui/icons-material/RocketLaunch`, `@mui/icons-material/CheckCircle`, `@mui/icons-material/HourglassTop`, `@mui/icons-material/Lock` ...

### src/pages/DDStatsPage.js
- Default export: `DDStatsPage`
- Defines: `DDStatsPage`
- Imports local modules: `../context/NetworkContext`, `../components/IntegrationGuides`; libraries: `react`, `@mui/icons-material/AttachMoney`, `@mui/icons-material/Lock`, `@mui/icons-material/TrendingUp`, `@mui/icons-material/HealthAndSafety` ...

### src/pages/DifficultiesPage.js
- Default export: `DifficultiesPage`
- Defines: `HeroSection`, `LoadingCard`, `AlgorithmCard`, `DigiShieldInfoSection`, `DifficultiesPage`
- Imports local modules: `../context/NetworkContext`; libraries: `react`, `chart.js`, `chart.js`, `@mui/icons-material/TrendingUp`

### src/pages/DigiDollarPage.js
- Default export: `DigiDollarPage`
- Defines: `DigiDollarPage`
- Imports local modules: `../components/IntegrationGuides`; libraries: `react`, `@mui/icons-material/AccountBalance`, `@mui/icons-material/Security`, `@mui/icons-material/Speed`, `@mui/icons-material/Public` ...

### src/pages/DownloadsPage.js
- Default export: `DownloadsPage`
- Defines: `DownloadsPage`
- Imports libraries: `react`, `@mui/icons-material/CloudDownload`, `@mui/icons-material/GitHub`, `@mui/icons-material/PhoneAndroid`, `@mui/icons-material/Computer` ...

### src/pages/HashratePage.js
- Default export: `HashratePage`
- Defines: `HashratePage`
- Imports local modules: `../context/NetworkContext`; libraries: `react`, `@mui/icons-material/Speed`, `@mui/icons-material/Timer`, `@mui/icons-material/Language`

### src/pages/HomePage.js
- Default export: `HomePage`
- Defines: `HomePage`
- Imports local modules: `../context/NetworkContext`; libraries: `react`, `@mui/icons-material/ViewCompact`, `@mui/icons-material/Sync`, `@mui/icons-material/Storage`, `@mui/icons-material/Token` ...

### src/pages/NodesPage.css
- CSS selectors/classes: `.page-container`, `.centered-text`, `.MuiDataGrid-columnHeaderTitle`, `.grid-container`, `.zoom-controls`, `.nodes-by-country`, `.map-container`

### src/pages/NodesPage.js
- Default export: `NodesPage`
- Defines: `useFetchData`, `NodesPage`
- Imports local modules: `./digibyte256.png`, `../utils`, `../countries-110m.json`, `../context/NetworkContext`; libraries: `react`, `@visx/geo`, `d3-geo`, `d3-zoom`, `d3-selection` ...

### src/pages/OraclesPage.js
- Default export: `OraclesPage`
- Defines: `OraclesPage`
- Imports local modules: `../context/NetworkContext`, `../components/IntegrationGuides`; libraries: `react`, `@mui/icons-material/Sensors`, `@mui/icons-material/CloudDone`, `@mui/icons-material/CloudOff`, `@mui/icons-material/AttachMoney` ...

### src/pages/PoolsPage.css
- CSS selectors/classes: `.pie-chart-container`

### src/pages/PoolsPage.js
- Default export: `PoolsPage`
- Defines: `PoolsPage`
- Imports local modules: `../config`; libraries: `react`, `@mui/icons-material/LocationCity`, `d3`

### src/pages/RoadmapPage.js
- Default export: `RoadmapPage`
- Defines: `RoadmapPage`
- Imports local modules: `../config`; libraries: `react`, `@mui/icons-material/ExpandMore`, `@mui/icons-material/ExpandLess`, `@mui/icons-material/CheckCircle`, `@mui/icons-material/RadioButtonUnchecked` ...

### src/pages/SupplyPage.js
- Default export: `SupplyPage`
- Defines: `hexToRgb`, `SupplyPage`
- Imports local modules: `../context/NetworkContext`; libraries: `react`, `chart.js`, `@mui/icons-material/Token`, `@mui/icons-material/HourglassEmpty`, `@mui/icons-material/People` ...

### src/pages/TaprootPage.js
- Default export: `TaprootPage`
- Defines: `getStateColor`, `HeaderSection`, `ActivationStatusCard`, `RecentSupportCard`, `ActivationDetailsCard`, `ProgressSection`, `BIP9ExplanationSection`, `TechnicalParametersSection`, `TaprootPage`
- Imports local modules: `../App.module.css`, `../context/NetworkContext`; libraries: `react`, `@mui/material`

### src/pages/TxsPage.js
- Default export: `TxsPage`
- Defines: `HeroSection`, `LoadingCard`, `EmptyState`, `getPriorityColor`, `getConfirmationColor`, `formatNumber`, `formatDGB`, `formatRelativeTime`, `calculateTotalValue`, `FeeDistributionChart` (+7 more)
- Imports local modules: `../context/NetworkContext`; libraries: `react`, `@mui/icons-material/AccountBalanceWallet`, `@mui/icons-material/ArrowForwardIos`, `@mui/icons-material/ArrowBackIosNew`, `@mui/icons-material/Speed` ...

### src/reportWebVitals.js
- Default export: `reportWebVitals`

### src/setupTests.js
- Imports libraries: `vitest`

### src/tests/.claude/settings.local.json
- Top-level keys: `enableAllProjectMcpServers`, `permissions`

### src/tests/integration/App.integration.test.js
- Automated test file (Vitest/Testing Library)
- Defines: `renderApp`
- Imports local modules: `../../App`, `../utils/testUtils`, `../mocks/mockData`; libraries: `vitest`, `@testing-library/react`

### src/tests/integration/pages/PageIntegration.test.js
- Automated test file (Vitest/Testing Library)
- Imports local modules: `../../utils/testUtils`, `../../mocks/mockData`, `../../../pages/HomePage`, `../../../pages/NodesPage`, `../../../pages/PoolsPage` ...; libraries: `vitest`, `@testing-library/react`

### src/tests/mocks/handlers.js
- Automated test file (Vitest/Testing Library)
- Named export: `handlers` (const)
- Imports local modules: `./mockData`; libraries: `msw`

### src/tests/mocks/mockData.js
- Automated test file (Vitest/Testing Library)
- Named export: `mockApiResponses` (const)
- Named export: `generateWebSocketMessage` (const)

### src/tests/pages/RoadmapPage.test.js
- Automated test file (Vitest/Testing Library)
- Imports local modules: `../utils/testUtils`, `../../pages/RoadmapPage`; libraries: `react`, `vitest`, `@testing-library/react`

### src/tests/setup.js
- Automated test file (Vitest/Testing Library)
- Defines: `createMockChartInstance`
- Imports local modules: `./mocks/server`; libraries: `@testing-library/react`, `vitest`

### src/tests/unit/components/Header.test.js
- Automated test file (Vitest/Testing Library)
- Imports local modules: `../../utils/testUtils`, `../../../components/Header`; libraries: `vitest`, `@testing-library/react`

### src/tests/unit/context/NetworkContext.test.js
- Automated test file (Vitest/Testing Library)
- Defines: `TestComponent`
- Imports local modules: `../../../context/NetworkContext`; libraries: `vitest`, `@testing-library/react`

### src/tests/unit/pages/AlgosPage.test.js
- Automated test file (Vitest/Testing Library)
- Imports local modules: `../../../pages/AlgosPage`, `../../utils/testUtils`; libraries: `vitest`, `@testing-library/react`, `d3`

### src/tests/unit/pages/BlocksPage.test.js
- Automated test file (Vitest/Testing Library)
- Imports local modules: `../../../pages/BlocksPage`, `../../utils/testUtils`, `../../mocks/mockData`; libraries: `vitest`, `@testing-library/react`

### src/tests/unit/pages/DDActivationPage.test.js
- Automated test file (Vitest/Testing Library)
- Defines: `sendDeploymentData`, `sendInitialData`
- Imports local modules: `../../../pages/DDActivationPage`, `../../utils/testUtils`; libraries: `vitest`, `@testing-library/react`

### src/tests/unit/pages/DDStatsPage.test.js
- Automated test file (Vitest/Testing Library)
- Defines: `sendDDStatsData`
- Imports local modules: `../../../pages/DDStatsPage`, `../../utils/testUtils`; libraries: `vitest`, `@testing-library/react`

### src/tests/unit/pages/DifficultiesPage.test.js
- Automated test file (Vitest/Testing Library)
- Imports local modules: `../../../pages/DifficultiesPage`, `../../utils/testUtils`; libraries: `vitest`, `vitest`, `@testing-library/react`

### src/tests/unit/pages/DigiDollarPage.test.js
- Automated test file (Vitest/Testing Library)
- Imports local modules: `../../../pages/DigiDollarPage`, `../../utils/testUtils`; libraries: `vitest`, `@testing-library/react`

### src/tests/unit/pages/DownloadsPage.test.js
- Automated test file (Vitest/Testing Library)
- Imports local modules: `../../../pages/DownloadsPage`, `../../utils/testUtils`, `../../mocks/mockData`; libraries: `vitest`, `@testing-library/react`

### src/tests/unit/pages/HashratePage.test.js
- Automated test file (Vitest/Testing Library)
- Imports local modules: `../../../pages/HashratePage`, `../../utils/testUtils`, `../../mocks/mockData`; libraries: `vitest`, `@testing-library/react`

### src/tests/unit/pages/HomePage.test.js
- Automated test file (Vitest/Testing Library)
- Imports local modules: `../../utils/testUtils`, `../../../pages/HomePage`; libraries: `vitest`, `@testing-library/react`

### src/tests/unit/pages/NodesPage.test.js
- Automated test file (Vitest/Testing Library)
- Imports local modules: `../../../pages/NodesPage`, `../../utils/testUtils`, `../../mocks/mockData`; libraries: `vitest`, `@testing-library/react`

### src/tests/unit/pages/OraclesPage.test.js
- Automated test file (Vitest/Testing Library)
- Defines: `sendOracleData`
- Imports local modules: `../../../pages/OraclesPage`, `../../utils/testUtils`; libraries: `vitest`, `@testing-library/react`

### src/tests/unit/pages/PoolsPage.test.js
- Automated test file (Vitest/Testing Library)
- Imports local modules: `../../../pages/PoolsPage`, `../../utils/testUtils`, `../../mocks/mockData`; libraries: `vitest`, `@testing-library/react`, `d3`

### src/tests/unit/pages/SupplyPage.test.js
- Automated test file (Vitest/Testing Library)
- Imports local modules: `../../../pages/SupplyPage`, `../../utils/testUtils`, `../../mocks/mockData`; libraries: `vitest`, `@testing-library/react`

### src/tests/unit/pages/TxsPage.test.js
- Automated test file (Vitest/Testing Library)
- Imports local modules: `../../../pages/TxsPage`, `../../utils/testUtils`; libraries: `vitest`, `@testing-library/react`

### src/tests/utils/testUtils.js
- Automated test file (Vitest/Testing Library)
- Named export: `renderWithProviders` (function)
- Named export: `MockWebSocket` (class)
- Named export: `createWebSocketMock` (function)
- Named export: `waitForAsync` (const)
- Named export: `mockChartJs` (function)
- Named export: `mockD3Selection` (function)
- Named export: `mockLocalStorage` (function)
- Named export: `generateMockNode` (const)
- Named export: `generateMockBlock` (const)
- Named export: `generateMockMiner` (const)
- Includes re-export statement(s)
- Imports local modules: `../../context/NetworkContext`; libraries: `react`, `@testing-library/react`, `react-router-dom`, `@mui/material/styles`, `vitest`

### src/utils.js
- Named export: `formatNumber` (const)
- Named export: `numberWithCommas` (const)
- Named export: `useWidth` (const)
- Imports libraries: `react`
