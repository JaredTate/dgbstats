# DigiByte Stats - AI Agent Documentation

## Project Overview

DigiByte Stats is a comprehensive React-based web application that provides real-time statistics, visualizations, and analytics for the DigiByte blockchain. The application connects to a DigiByte node via RPC and WebSocket connections to deliver live blockchain data through an intuitive, responsive interface.

## Architecture

### Technology Stack
- **Frontend**: React 17.0.2 with Material-UI (MUI) v5
- **Routing**: React Router v6
- **Data Visualization**: D3.js v7, Chart.js v4
- **Real-time Communication**: WebSocket for live blockchain updates
- **Testing**: Vitest (unit/integration), Playwright (E2E)
- **Build Tool**: Create React App 5.0.1

### Key Dependencies
- `@mui/material`: UI component library
- `d3` & `d3-geo`: Advanced data visualizations and geographic maps
- `chart.js` & `react-chartjs-2`: Time series and statistical charts
- `axios`: HTTP client for API requests
- `world-atlas` & `topojson-client`: Geographic data for node visualization

## Application Pages

The application has **15 pages** total: 13 available on mainnet and 12 on testnet (with 2 testnet-exclusive pages).

### Mainnet Pages

### 1. **HomePage** (`/`)
Main dashboard displaying key DigiByte statistics including:
- Current block height and blockchain info
- Network hashrate and difficulty
- Supply statistics and market cap
- Recent blocks and transactions
- Network node count

### 2. **BlocksPage** (`/blocks`)
Real-time block explorer showing:
- Latest blocks with timestamps
- Mining algorithm distribution
- Block rewards and sizes
- Miner addresses and pools

### 3. **PoolsPage** (`/pools`) - Mainnet Only
Mining pool distribution analysis featuring:
- Interactive donut chart of pool market share
- Multi-block and single-block miners
- Pool identification and statistics
- Real-time updates as blocks are mined

### 4. **AlgosPage** (`/algos`)
Mining algorithm statistics displaying:
- Five DigiByte mining algorithms (SHA256, Scrypt, Skein, Qubit, Odocrypt)
- Algorithm-specific hashrates
- Block distribution per algorithm
- Difficulty adjustments

### 5. **HashratePage** (`/hashrate`)
Network hashrate analysis with:
- Total network hashrate charts
- Historical hashrate trends
- Algorithm-specific hashrate breakdown
- Time-based analysis (24h, 7d, 30d)

### 6. **DifficultiesPage** (`/difficulties`)
Mining difficulty tracking:
- Current difficulty levels per algorithm
- Difficulty adjustment history
- Next adjustment predictions
- Historical difficulty charts

### 7. **NodesPage** (`/nodes`)
Geographic node distribution featuring:
- Interactive world map visualization
- Node count by country/region
- Network connectivity statistics
- Node version distribution

### 8. **SupplyPage** (`/supply`)
Supply economics dashboard showing:
- Current circulating supply
- Maximum supply (21 billion DGB)
- Supply per capita calculations
- Emission rate and inflation metrics
- Interactive supply curve chart

### 9. **TxsPage** (`/txs`)
Transaction analytics including:
- Recent transaction list
- Transaction volume charts
- Fee statistics
- Transaction types breakdown

### 10. **TaprootPage** (`/taproot`)
Taproot activation monitoring:
- Current activation status
- Block signaling statistics
- Activation timeline
- Network upgrade progress

### 11. **DownloadsPage** (`/downloads`) - Mainnet Only
DigiByte Core download statistics:
- Download counts by version
- Platform distribution (Windows, Mac, Linux)
- Historical download trends
- Latest release information

### 12. **RoadmapPage** (`/roadmap`) - Mainnet Only
Development roadmap displaying:
- Current development priorities
- Upcoming features and improvements
- Community proposals
- Technical debt items

### 13. **DigiDollarPage** (`/digidollar`)
DigiDollar stablecoin explainer:
- Use cases and benefits
- Collateral tier system
- Implementation details
- How DigiDollar works

### Testnet-Only Pages

### 14. **OraclesPage** (`/testnet/oracles`) - Testnet Only
DigiDollar oracle network monitoring:
- Oracle status and health
- DGB/USD price feeds
- 24-hour price range and volatility
- Oracle configuration details
- Reporting status for each oracle

### 15. **DDStatsPage** (`/testnet/ddstats`) - Testnet Only
DigiDollar network statistics dashboard:
- System health percentage
- Total collateral locked (DGB)
- Total DD supply
- Oracle price information
- ERR tier status
- Active positions count

## Design System

### Theme Configuration
```javascript
Primary Color: #002352 (DigiByte Blue)
Secondary Color: #0066cc (Light Blue)
Background: Linear gradients (#f8f9fa to #ffffff)
Card Elevation: Consistent shadow patterns
Border Radius: 8px (buttons), 12px (cards)
```

### Component Patterns
1. **Hero Sections**: Each page starts with a hero card containing title and description
2. **Stat Cards**: Reusable metric display components with consistent styling
3. **Loading States**: Circular progress indicators with "Loading..." text
4. **Error Boundaries**: Graceful error handling with fallback UI
5. **Responsive Grids**: Mobile-first design with breakpoint-specific layouts

### Data Flow
1. **WebSocket Connection**: Established on component mount for real-time updates
2. **API Calls**: RESTful endpoints for initial data loading
3. **State Management**: React hooks (useState, useEffect, useMemo)
4. **Performance Optimization**: Memoization for expensive computations

## Development Guidelines

### Code Standards
- **Components**: Functional components with hooks only (no class components)
- **Styling**: MUI sx prop for component-specific styles, CSS modules for global styles
- **Data Fetching**: Async/await pattern with proper error handling
- **Testing**: Minimum 95% code coverage requirement
- **Comments**: JSDoc comments for all major components and functions

### File Structure
```
src/
├── pages/           # Page components (15 pages)
├── components/      # Reusable components (Header, Footer, Layouts)
├── context/         # React Context providers (NetworkContext)
├── hooks/           # Custom hooks (useNetworkData.js with 5 hooks)
├── utils.js         # Utility functions (formatNumber, numberWithCommas, useWidth)
├── tests/           # Test suites
│   ├── unit/       # Component unit tests
│   │   ├── pages/  # Page-specific tests
│   │   ├── components/ # Component tests
│   │   └── context/ # Context tests
│   ├── integration/ # Integration tests
│   ├── mocks/      # MSW handlers and mock data
│   └── utils/      # Test utilities
├── config.js        # Configuration (API URLs, WebSocket endpoints)
└── App.js          # Main application component with routing
```

### WebSocket Protocol
Messages follow this structure:
```javascript
{
  type: 'recentBlocks' | 'newBlock' | 'nodeUpdate' | ...,
  data: { ... }
}
```

### API Endpoints
Base URL configured in `config.js`:
- `/api/getblockchaininfo` - Blockchain statistics
- `/api/getchaintxstats` - Transaction statistics
- `/api/getpeerinfo` - Node peer information
- `/api/getblockhash/:height` - Block by height
- `/api/getblock/:hash` - Block details

## Testing Strategy

### Unit Testing (Vitest)
- Component rendering tests
- User interaction simulation
- State management verification
- Utility function testing

### E2E Testing (Playwright)
- Cross-browser testing (Chrome, Firefox, Safari, Edge)
- Mobile responsiveness
- Performance metrics
- Accessibility compliance

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
1. **React.memo**: Prevent unnecessary re-renders
2. **useMemo/useCallback**: Memoize expensive operations
3. **Code Splitting**: Lazy loading for route components
4. **WebSocket Throttling**: Batch updates to prevent UI blocking
5. **Virtual Scrolling**: For large data lists
6. **Chart Optimization**: Simplified rendering for mobile devices

### Mobile Optimizations
- Responsive SVG sizing for D3.js charts
- Touch-friendly interaction zones
- Reduced data points on mobile charts
- Simplified UI elements for small screens

## Deployment Notes

### Configuration
The frontend configuration is in `src/config.js`. Currently hardcoded to development mode:
```javascript
const config = {
  development: {
    apiBaseUrl: 'http://localhost:5001',
    wsBaseUrl: 'ws://localhost:5002'
  },
  production: {
    apiBaseUrl: 'https://digibyte.io',
    wsBaseUrl: 'wss://digibyte.io/ws'
  }
};
const env = 'development'; // Currently hardcoded
export default config[env];
```

Network-specific configuration (mainnet/testnet) is handled by `src/context/NetworkContext.js`:
- Mainnet WebSocket: `ws://localhost:5002`
- Testnet WebSocket: `ws://localhost:5003`

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
2. Add route in `App.js`
3. Follow existing page structure (Hero → Content → Stats)
4. Add tests in `src/tests/unit/pages/`
5. Update navigation in `Header.js`

### Modifying Charts
1. Check if using D3.js or Chart.js
2. Maintain responsive sizing logic
3. Test on mobile viewports
4. Ensure loading states work

### Updating Real-time Data
1. Check WebSocket message types
2. Update message handlers
3. Test with mock WebSocket data
4. Verify state updates correctly

### Working with Tests
1. Run existing tests before changes
2. Update tests for modified code
3. Add new tests for new features
4. Maintain 95%+ coverage

## Important Notes

- **Network Support**: Application supports both mainnet (`/`) and testnet (`/testnet/*`) with separate WebSocket connections and theming
- **Testnet-Only Features**: OraclesPage and DDStatsPage are exclusive to testnet for DigiDollar development
- **Mainnet-Only Features**: PoolsPage, DownloadsPage, and RoadmapPage are not available on testnet
- **TAP Route Status**: TAP route soft fork has been successfully activated and buried. References to TAP route signaling have been removed from the UI.
- **Mobile First**: Always test on mobile viewports first
- **Accessibility**: Maintain WCAG 2.1 AA compliance
- **Performance**: Keep Lighthouse scores above 90
- **Browser Support**: Chrome, Firefox, Safari, Edge (latest 2 versions)