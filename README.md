# DigiByte Blockchain Stats

A comprehensive real-time blockchain statistics dashboard for the DigiByte network. This React-based web application provides detailed analytics, visualizations, and monitoring tools for the DigiByte blockchain.

## Features

### 📊 Real-time Dashboard
- Live blockchain statistics with WebSocket updates
- Current block height, network hashrate, and difficulty
- Supply economics and market capitalization
- Recent blocks and transaction monitoring

### 📈 Analytics Pages

**19 page components** — 18 mainnet routes, 16 testnet routes. 15 pages render on both networks, 3 are mainnet-only, and 1 is testnet-only.

*On both networks:*
1. **Home** - Main dashboard with key metrics and softfork status
2. **Blocks** - Real-time block explorer with mining details
3. **Chain Tips** - Chain tips & orphans: live fork-tree map, orphan tracking, 30-day chart
4. **Transactions** - Mempool + confirmed transaction volume and fee analytics
5. **Algorithms** - Multi-algorithm mining statistics (SHA256D, Scrypt, Skein, Qubit, Odocrypt)
6. **Hashrate** - Network hashrate trends and analysis
7. **Difficulties** - Mining difficulty tracking per algorithm
8. **Pool Upgrades** - Per-pool BIP9 upgrade-signal tracker (DigiDollar bit 23, Algolock bit 0)
9. **Nodes** - Geographic visualization of network nodes (crawled from DigiHash `peers.dat`)
10. **Supply** - Supply economics, emission rate, and distribution metrics
11. **Taproot** - BIP9 Taproot activation status (route only, no nav link)
12. **DigiDollar** - Decentralized stablecoin concept and collateral system
13. **DD Activation** - BIP9 activation tracker for DigiDollar and Algolock
14. **Oracles** - DigiDollar oracle network status and DGB/USD price feeds
15. **DD Stats** - DigiDollar network-wide health & statistics dashboard

*Mainnet only:*
16. **Mining Pools** - Pool distribution analysis with an interactive D3.js donut chart
17. **Downloads** - DigiByte Core wallet download statistics (from GitHub releases)
18. **Roadmap** - Development priorities and upcoming features (2025–2029)

*Testnet only:*
19. **Wallet Convert** - Client-side Oracle `wallet.dat` migration tool (`/testnet/convert`)

### 🌐 Network Support

- **Mainnet**: Full production network with all features
- **Testnet**: Dedicated testnet support at `/testnet/*` routes
- **Network Switching**: Easy toggle between networks via header navigation
- **Separate WebSocket**: Independent real-time connections per network

### 🎨 Modern UI/UX
- Material-UI v5 components with DigiByte branding
- Responsive design optimized for mobile and desktop
- Interactive D3.js and Chart.js visualizations
- Dark theme with gradient backgrounds
- Real-time data updates without page refresh

### 🔍 SEO & Social Sharing
- Comprehensive Open Graph meta tags for social previews
- Twitter Card integration with large image previews
- JSON-LD structured data for search engines
- XML sitemap covering all current mainnet and testnet pages
- robots.txt optimized for search engines and AI crawlers

## Prerequisites

- **Node.js** v14.x or higher (tested with v21.7.2)
- **DigiByte Node** with RPC enabled ([digibyte-core](https://github.com/digibyte-core/digibyte))
- **dgbstats-server** backend ([repository](https://github.com/JaredTate/dgbstats-server))

## Installation

### 1. Install Node.js (macOS with Homebrew)

```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew update
brew install node

# Verify installation
node -v
npm -v

# Optional: Install specific Node version
sudo npm install -g n
sudo n install 21.7.2
sudo n use 21.7.2
```

### 2. Clone Repositories

```bash
# Clone frontend and backend
git clone https://github.com/JaredTate/dgbstats.git
git clone https://github.com/JaredTate/dgbstats-server.git

# Install dependencies
cd dgbstats
npm install
```

## Configuration

### 1. DigiByte Node Setup

Edit your `digibyte.conf` file:

```ini
# RPC Configuration
rpcuser=your_username
rpcpassword=your_password
server=1
txindex=1
debug=1

# Performance Settings
rpcworkqueue=64
rpcthreads=8
maxconnections=128

# Network Settings
dandelion=0

# Block Notifications (optional)
blocknotify=/path/to/dgbstats-server/blocknotify.sh %s
```

### 2. Backend Server Configuration

Update credentials in `dgbstats-server/server.js`:

```javascript
const rpcUser = 'your_username';
const rpcPassword = 'your_password';
const rpcUrl = 'http://127.0.0.1:14022';
```

### 3. Frontend Configuration

The frontend configuration is in `src/config.js` (currently hardcoded to development):

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

Network-specific configuration (mainnet/testnet) is managed by `src/context/NetworkContext.js`:
- Mainnet WebSocket: port 5002
- Testnet WebSocket: port 5003

## Running the Application

### Start Backend Server

```bash
cd dgbstats-server
sudo npm start
# Server runs on port 5001 (API) and 5002 (WebSocket)
```

### Start Frontend Application

```bash
cd dgbstats
npm start
# Application opens at http://localhost:3005
```

## Development

### Project Structure

```
dgbstats/
├── src/
│   ├── pages/          # Page components (19 pages)
│   ├── components/     # Reusable components (9: Header, Footer, Layouts, Fork*, IntegrationGuides)
│   ├── context/        # React Context providers (NetworkContext)
│   ├── hooks/          # Custom hooks (5 hooks in useNetworkData.js)
│   ├── tests/          # Test suites (unit, integration, mocks)
│   ├── config.js       # API configuration
│   ├── utils.js        # Utility functions
│   └── App.js          # Main application with routing
├── public/
│   ├── og-images/      # Open Graph preview images
│   ├── sitemap.xml     # XML sitemap
│   ├── robots.txt      # Crawler rules
│   └── index.html      # HTML template with meta tags
├── e2e/                # Playwright E2E tests (21 specs)
└── package.json        # Dependencies
```

### Available Scripts

```bash
npm start              # Start development server
npm run build          # Create production build
npm test               # Run tests in watch mode
npm run test:run       # Run tests once
npm run test:coverage  # Generate coverage report
npm run test:e2e       # Run end-to-end tests
npm run test:all       # Run all test suites
```

## Testing

### Comprehensive Test Coverage

The project targets a **95% coverage threshold** with:

- **~637 Unit/Integration Tests** across 29 files - Component and function testing (Vitest)
- **~229 E2E Tests** across 21 specs - Cross-browser integration testing (Playwright)
- **8 Browser Projects** - Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari, Mobile Safari Legacy, Microsoft Edge, Google Chrome

### Test Features

- ✅ WebSocket mocking for real-time data
- ✅ D3.js and Chart.js visualization testing
- ✅ WCAG accessibility compliance
- ✅ Performance benchmarking
- ✅ Mobile responsiveness testing
- ✅ Cross-browser compatibility

### Running Tests

```bash
# Unit & Integration Tests (Vitest)
npm test                 # Watch mode
npm run test:run         # Single run
npm run test:coverage    # Coverage report
npm run test:ui          # Vitest UI

# End-to-End Tests (Playwright)
npm run test:e2e         # All browsers
npm run test:e2e:ui      # Playwright UI

# Combined Testing
npm run test:all         # All tests
npm run test:all:clean   # Tests + cleanup
```

## Performance

### Optimization Features

- **React.memo** for component memoization
- **useMemo/useCallback** for expensive operations
- **WebSocket batching** for real-time updates
- **Virtual scrolling** for large datasets
- **Responsive charts** with mobile optimizations
- **Code splitting** for faster initial load

### Lighthouse Scores

- Performance: 90+
- Accessibility: 95+
- Best Practices: 100
- SEO: 90+

## Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)
- Mobile Chrome
- Mobile Safari

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code patterns and styling
- Maintain 95%+ test coverage
- Test on mobile and desktop viewports
- Ensure WCAG 2.1 AA accessibility compliance
- Update documentation for new features

## Recent Updates

- **Chain Tips & Orphans Page**: New `/tips` page with a live fork-tree map, orphan tracking, a 30-day orphan chart, and a site-wide fork-risk banner (`ForkAlertBanner`)
- **Pool Upgrade Tracker**: New `/pool-upgrades` page tracking per-pool BIP9 signals (DigiDollar bit 23, Algolock bit 0) with SHA256D version-rolling detection
- **DigiDollar Suite on Both Networks**: Oracles, DD Stats, and the new DD Activation tracker now run on both mainnet and testnet (DigiDollar shipped in DigiByte Core v9.26.x)
- **Wallet Convert Tool**: Client-side `/testnet/convert` page for migrating Oracle `wallet.dat` files between networks (default target testnet26)
- **Nodes Page Overhaul**: Peers crawled from the DigiHash pool wallet's `peers.dat`, "Nodes Seen (24h)", country leaderboard, and addrman tile
- **Deployment Info**: Uses `getdeploymentinfo` RPC for softfork status (replaces the deprecated `softforks` field)
- **Full Testnet Support**: Dedicated WebSocket, routing, theming, and peer tracking
- **TAP Route / Taproot**: Successfully activated and buried - signaling UI removed
- **Enhanced Testing**: 29 unit/integration files + 21 E2E specs across 8 browser projects

## Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Comprehensive AI agent documentation
- **[Testing Guide](./src/tests/README.md)** - Detailed testing documentation
- **[API Documentation](https://github.com/JaredTate/dgbstats-server)** - Backend API reference

## License

This project is open-source and available under the [MIT License](https://opensource.org/licenses/MIT).

## Support

For issues, feature requests, or questions:
- Open an issue on [GitHub](https://github.com/JaredTate/dgbstats/issues)
- Contact the development team

## Credits

Developed by the DigiByte community for real-time blockchain analytics and monitoring.