# DigiByte Stats - Testnet Interface Implementation Plan

**Created:** 2026-02-02
**Status:** Planning
**Author:** Claude Code

---

## 1. Executive Summary

This document outlines the implementation plan for adding a testnet interface to DigiByte Stats. The goal is to allow users to view testnet blockchain data at `/testnet/*` URLs while reusing existing components and maintaining the mainnet interface at the root path.

### Key Requirements
- **Mainnet**: Current behavior at `digibyte.io/*`
- **Testnet**: New interface at `digibyte.io/testnet/*`
- **Code Reuse**: Same page components, different data sources
- **Visual Distinction**: Different theme color for testnet
- **Simplified Testnet Nav**: Remove Pools, Downloads, DigiHash, DigiByte.org links

---

## 2. URL Structure

### Mainnet (Existing)
```
/                 → HomePage
/blocks           → BlocksPage
/txs              → TxsPage
/supply           → SupplyPage
/algos            → AlgosPage
/difficulties     → DifficultiesPage
/hashrate         → HashratePage
/pools            → PoolsPage
/nodes            → NodesPage
/downloads        → DownloadsPage
/roadmap          → RoadmapPage
/digidollar       → DigiDollarPage
/taproot          → TaprootPage
```

### Testnet (New)
```
/testnet          → HomePage (testnet data)
/testnet/blocks   → BlocksPage (testnet data)
/testnet/txs      → TxsPage (testnet data)
/testnet/supply   → SupplyPage (testnet data)
/testnet/algos    → AlgosPage (testnet data)
/testnet/difficulties → DifficultiesPage (testnet data)
/testnet/hashrate → HashratePage (testnet data)
/testnet/nodes    → NodesPage (testnet data)
/testnet/digidollar → DigiDollarPage
/testnet/taproot  → TaprootPage (testnet data)
```

**Excluded from Testnet:**
- `/testnet/pools` - No mining pools on testnet
- `/testnet/downloads` - Not relevant for testnet
- External links: DigiHash, DigiByte.org

---

## 3. Architecture Overview

### 3.1 High-Level Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │   Mainnet View   │    │   Testnet View   │                   │
│  │   (/ routes)     │    │ (/testnet routes)│                   │
│  │   Blue Theme     │    │   Orange Theme   │                   │
│  └────────┬─────────┘    └────────┬─────────┘                   │
│           │                       │                              │
│           └───────────┬───────────┘                              │
│                       │                                          │
│           ┌───────────▼───────────┐                              │
│           │   NetworkContext      │                              │
│           │   - network type      │                              │
│           │   - API base URL      │                              │
│           │   - WebSocket URL     │                              │
│           └───────────┬───────────┘                              │
│                       │                                          │
└───────────────────────┼──────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Node.js)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Express Server (:5001)                 │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  /api/*          → Mainnet RPC (:14044)                  │   │
│  │  /api/testnet/*  → Testnet RPC (:14022)                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────┐    ┌─────────────────────┐             │
│  │ WebSocket (:5002)   │    │ WebSocket (:5003)   │             │
│  │ Mainnet Updates     │    │ Testnet Updates     │             │
│  └─────────────────────┘    └─────────────────────┘             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                        │                    │
                        ▼                    ▼
┌─────────────────────────────┐  ┌─────────────────────────────┐
│   Mainnet digibyted         │  │   Testnet digibyted         │
│   RPC: 14044                │  │   RPC: 14022                │
│   ZMQ: 28332-28335          │  │   ZMQ: 28336-28339          │
└─────────────────────────────┘  └─────────────────────────────┘
```

### 3.2 Theme Differentiation

| Network | Primary Color | Gradient | Purpose |
|---------|--------------|----------|---------|
| **Mainnet** | `#002352` (DigiByte Blue) | `#002352 → #0066cc` | Production/Stable |
| **Testnet** | `#e65100` (Deep Orange) | `#e65100 → #ff9800` | Development/Test |

The orange color clearly signals "this is a test environment" - a common UX pattern.

---

## 4. Implementation Details

### 4.1 Backend Changes (dgbstats-server)

#### 4.1.1 New Environment Variables

```bash
# Existing (Mainnet)
DGB_RPC_URL=http://127.0.0.1:14044
DGB_RPC_USER=user
DGB_RPC_PASSWORD=password

# New (Testnet)
DGB_TESTNET_RPC_URL=http://127.0.0.1:14022
DGB_TESTNET_RPC_USER=user
DGB_TESTNET_RPC_PASSWORD=password
DGB_TESTNET_WS_PORT=5003
DGB_TESTNET_ZMQ_HASHBLOCK=tcp://127.0.0.1:28338
```

#### 4.1.2 File Changes

**`rpc.js`** - Add testnet RPC configuration:
```javascript
// New testnet RPC config
const TESTNET_RPC_CONFIG = {
  user: process.env.DGB_TESTNET_RPC_USER || 'user',
  password: process.env.DGB_TESTNET_RPC_PASSWORD || 'password',
  url: process.env.DGB_TESTNET_RPC_URL || 'http://127.0.0.1:14022',
  timeout: { default: 30000, heavy: 120000 }
};

// New function for testnet requests
async function sendTestnetRpcRequest(method, params = [], useCache = false) {
  // Same logic as sendRpcRequest but using TESTNET_RPC_CONFIG
}

// Mount testnet routes
router.get('/testnet/getblockchaininfo', async (req, res) => {
  const data = await sendTestnetRpcRequest('getblockchaininfo');
  res.json(data);
});
// ... repeat for all endpoints
```

**`server.js`** - Add testnet WebSocket:
```javascript
const SERVER_CONFIG = {
  port: process.env.PORT || 5001,
  wsPort: 5002,
  testnetWsPort: process.env.DGB_TESTNET_WS_PORT || 5003,
  // ...
};

// Create testnet WebSocket server
const wssTestnet = new WebSocket.Server({ port: SERVER_CONFIG.testnetWsPort });

// Separate data stores for testnet
const testnetRecentBlocks = [];
let testnetInMemoryInitialData = null;
```

#### 4.1.3 API Endpoints Summary

| Mainnet Endpoint | Testnet Endpoint |
|-----------------|------------------|
| `GET /api/getblockchaininfo` | `GET /api/testnet/getblockchaininfo` |
| `GET /api/getblockhash/:height` | `GET /api/testnet/getblockhash/:height` |
| `GET /api/getblock/:hash` | `GET /api/testnet/getblock/:hash` |
| `GET /api/getchaintxstats` | `GET /api/testnet/getchaintxstats` |
| `GET /api/gettxoutsetinfo` | `GET /api/testnet/gettxoutsetinfo` |
| `GET /api/getpeerinfo` | `GET /api/testnet/getpeerinfo` |
| `GET /api/getblockreward` | `GET /api/testnet/getblockreward` |
| `GET /api/getmempoolinfo` | `GET /api/testnet/getmempoolinfo` |
| `GET /api/getrawmempool` | `GET /api/testnet/getrawmempool` |
| `WS ws://localhost:5002` | `WS ws://localhost:5003` |

---

### 4.2 Frontend Changes (dgbstats)

#### 4.2.1 New Files

**`src/context/NetworkContext.js`**
```javascript
import React, { createContext, useContext, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

const NetworkContext = createContext(null);

const NETWORK_CONFIG = {
  mainnet: {
    name: 'mainnet',
    displayName: 'Mainnet',
    apiBaseUrl: 'http://localhost:5001',
    wsBaseUrl: 'ws://localhost:5002',
    basePath: '',
    theme: {
      primary: '#002352',
      secondary: '#0066cc',
      gradient: 'linear-gradient(135deg, #002352 0%, #0066cc 100%)'
    }
  },
  testnet: {
    name: 'testnet',
    displayName: 'Testnet',
    apiBaseUrl: 'http://localhost:5001',  // Same server, different routes
    wsBaseUrl: 'ws://localhost:5003',
    basePath: '/testnet',
    apiPrefix: '/testnet',  // API routes prefixed
    theme: {
      primary: '#e65100',
      secondary: '#ff9800',
      gradient: 'linear-gradient(135deg, #e65100 0%, #ff9800 100%)'
    }
  }
};

export const NetworkProvider = ({ children, network = 'mainnet' }) => {
  const config = NETWORK_CONFIG[network];

  const value = useMemo(() => ({
    ...config,
    isTestnet: network === 'testnet',
    isMainnet: network === 'mainnet',
    getApiUrl: (endpoint) => {
      const prefix = config.apiPrefix || '';
      return `${config.apiBaseUrl}/api${prefix}${endpoint}`;
    }
  }), [config, network]);

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within NetworkProvider');
  }
  return context;
};

export default NetworkContext;
```

**`src/components/TestnetLayout.js`**
```javascript
import React from 'react';
import { Outlet } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { NetworkProvider } from '../context/NetworkContext';
import Header from './Header';
import Footer from './Footer';

const testnetTheme = createTheme({
  palette: {
    primary: {
      main: '#e65100',
      light: '#ff9800',
      dark: '#bf360c',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
      contrastText: '#000000',
    },
  },
  // ... same typography and components as mainnet
});

const TestnetLayout = () => {
  return (
    <NetworkProvider network="testnet">
      <ThemeProvider theme={testnetTheme}>
        <Header />
        <Outlet />
        <Footer />
      </ThemeProvider>
    </NetworkProvider>
  );
};

export default TestnetLayout;
```

#### 4.2.2 Modified Files

**`src/App.js`** - Add testnet routes:
```javascript
import TestnetLayout from './components/TestnetLayout';
import { NetworkProvider } from './context/NetworkContext';

// Wrap mainnet in NetworkProvider
<NetworkProvider network="mainnet">
  <ThemeProvider theme={theme}>
    <BrowserRouter>
      <Routes>
        {/* Mainnet routes (existing) */}
        <Route path="/" element={<MainnetLayout />}>
          <Route index element={<HomePage />} />
          <Route path="blocks" element={<BlocksPage />} />
          {/* ... all existing routes */}
        </Route>

        {/* Testnet routes (new) */}
        <Route path="/testnet" element={<TestnetLayout />}>
          <Route index element={<HomePage />} />
          <Route path="blocks" element={<BlocksPage />} />
          <Route path="txs" element={<TxsPage />} />
          <Route path="supply" element={<SupplyPage />} />
          <Route path="algos" element={<AlgosPage />} />
          <Route path="difficulties" element={<DifficultiesPage />} />
          <Route path="hashrate" element={<HashratePage />} />
          <Route path="nodes" element={<NodesPage />} />
          <Route path="digidollar" element={<DigiDollarPage />} />
          <Route path="taproot" element={<TaprootPage />} />
          {/* Note: pools, downloads, roadmap excluded */}
        </Route>
      </Routes>
    </BrowserRouter>
  </ThemeProvider>
</NetworkProvider>
```

**`src/components/Header.js`** - Network-aware navigation:
```javascript
import { useNetwork } from '../context/NetworkContext';

const Header = () => {
  const { isTestnet, basePath, theme, displayName } = useNetwork();

  // Define menu items based on network
  const menuItems = isTestnet ? [
    { text: 'Home', path: `${basePath}/` },
    { text: 'Blocks', path: `${basePath}/blocks` },
    { text: 'Txs', path: `${basePath}/txs` },
    { text: 'Supply', path: `${basePath}/supply` },
    { text: 'Algos', path: `${basePath}/algos` },
    { text: 'Difficulties', path: `${basePath}/difficulties` },
    { text: 'Hashrate', path: `${basePath}/hashrate` },
    { text: 'Nodes', path: `${basePath}/nodes` },
    { text: 'DigiDollar', path: `${basePath}/digidollar` },
    { text: 'Mainnet', path: '/', highlight: true },  // Switch to mainnet
  ] : [
    // Existing mainnet menu items
    { text: 'Home', path: '/' },
    { text: 'Blocks', path: '/blocks' },
    // ... all existing items
    { text: 'Testnet', path: '/testnet', highlight: true },  // Switch to testnet
  ];

  return (
    <AppBar
      sx={{
        background: theme.gradient,  // Network-specific gradient
        // ...
      }}
    >
      {/* Show network indicator badge for testnet */}
      {isTestnet && (
        <Chip
          label="TESTNET"
          size="small"
          sx={{
            bgcolor: '#ff9800',
            color: 'white',
            fontWeight: 'bold',
            ml: 1
          }}
        />
      )}
      {/* ... rest of header */}
    </AppBar>
  );
};
```

**`src/pages/*.js`** - Update API calls to use network context:
```javascript
// Before (hardcoded config):
import config from '../config';
const response = await fetch(`${config.apiBaseUrl}/api/getblockchaininfo`);

// After (network-aware):
import { useNetwork } from '../context/NetworkContext';
const { getApiUrl, wsBaseUrl } = useNetwork();
const response = await fetch(getApiUrl('/getblockchaininfo'));
const socket = new WebSocket(wsBaseUrl);
```

#### 4.2.3 Custom Hook for Data Fetching

**`src/hooks/useNetworkData.js`**
```javascript
import { useState, useEffect } from 'react';
import { useNetwork } from '../context/NetworkContext';

export const useBlockchainInfo = () => {
  const { getApiUrl } = useNetwork();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(getApiUrl('/getblockchaininfo'));
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [getApiUrl]);

  return { data, loading, error };
};

// Similar hooks for other data types...
```

---

## 5. File Change Summary

### 5.1 Backend (dgbstats-server)

| File | Action | Description |
|------|--------|-------------|
| `rpc.js` | MODIFY | Add testnet RPC config and routes |
| `server.js` | MODIFY | Add testnet WebSocket server |
| `config.js` | MODIFY | Add testnet configuration |
| `.env.example` | CREATE | Document environment variables |

**Estimated Lines Changed:** ~300-400

### 5.2 Frontend (dgbstats)

| File | Action | Description |
|------|--------|-------------|
| `src/context/NetworkContext.js` | CREATE | Network context provider |
| `src/components/TestnetLayout.js` | CREATE | Testnet layout wrapper |
| `src/hooks/useNetworkData.js` | CREATE | Network-aware data hooks |
| `src/App.js` | MODIFY | Add testnet routes |
| `src/components/Header.js` | MODIFY | Network-aware navigation |
| `src/config.js` | MODIFY | Support both networks |
| `src/pages/HomePage.js` | MODIFY | Use network context |
| `src/pages/BlocksPage.js` | MODIFY | Use network context |
| `src/pages/TxsPage.js` | MODIFY | Use network context |
| `src/pages/NodesPage.js` | MODIFY | Use network context |
| `src/pages/DifficultiesPage.js` | MODIFY | Use network context |
| `src/pages/HashratePage.js` | MODIFY | Use network context |
| `src/pages/AlgosPage.js` | MODIFY | Use network context |
| `src/pages/SupplyPage.js` | MODIFY | Use network context |
| `src/pages/TaprootPage.js` | MODIFY | Use network context |

**Estimated Lines Changed:** ~400-500

---

## 6. Implementation Order

### Phase 1: Backend Foundation
1. Add testnet RPC configuration to `rpc.js`
2. Create `sendTestnetRpcRequest` function
3. Add `/api/testnet/*` routes
4. Add testnet WebSocket server
5. Test API endpoints manually

### Phase 2: Frontend Context
1. Create `NetworkContext.js`
2. Create `useNetworkData.js` hooks
3. Update `config.js`

### Phase 3: Frontend Routing
1. Create `TestnetLayout.js`
2. Update `App.js` with testnet routes
3. Update `Header.js` for network awareness

### Phase 4: Page Updates
1. Update each page component to use `useNetwork()`
2. Replace hardcoded API calls with `getApiUrl()`
3. Replace hardcoded WebSocket URLs

### Phase 5: Testing & Polish
1. Test all testnet routes
2. Verify theme switching
3. Test WebSocket connections
4. Mobile responsiveness check

---

## 7. Production Deployment

### 7.1 Server Requirements

```bash
# Two DigiByte daemons running:
digibyted                    # Mainnet (default ports)
digibyted -testnet           # Testnet (testnet ports)

# One dgbstats-server with environment:
DGB_RPC_URL=http://127.0.0.1:14044
DGB_TESTNET_RPC_URL=http://127.0.0.1:14022
```

### 7.2 Nginx Configuration

```nginx
server {
    listen 443 ssl;
    server_name digibyte.io;

    # Frontend (React app)
    location / {
        proxy_pass http://localhost:3005;
    }

    # Mainnet API
    location /api/ {
        proxy_pass http://localhost:5001/api/;
    }

    # Testnet API
    location /api/testnet/ {
        proxy_pass http://localhost:5001/api/testnet/;
    }

    # Mainnet WebSocket
    location /ws {
        proxy_pass http://localhost:5002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Testnet WebSocket
    location /ws/testnet {
        proxy_pass http://localhost:5003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 8. Testing Checklist

### 8.1 Backend Tests
- [ ] `/api/testnet/getblockchaininfo` returns testnet data
- [ ] `/api/testnet/getblockhash/:height` works
- [ ] `/api/testnet/getblock/:hash` works
- [ ] Testnet WebSocket connects and receives updates
- [ ] Mainnet endpoints unaffected

### 8.2 Frontend Tests
- [ ] `/testnet` shows HomePage with testnet data
- [ ] `/testnet/blocks` shows testnet blocks
- [ ] Header shows orange theme on testnet
- [ ] "TESTNET" badge visible
- [ ] Mainnet/Testnet toggle works
- [ ] All testnet nav links work
- [ ] Pools/Downloads NOT in testnet nav
- [ ] Mobile menu works on testnet

### 8.3 Integration Tests
- [ ] Data refreshes correctly on both networks
- [ ] WebSocket reconnection works
- [ ] Theme persists on navigation
- [ ] No mainnet data leaks to testnet view

---

## 9. Future Considerations

1. **URL-based network detection**: Could also support `?network=testnet` query param
2. **Persistent preference**: Remember user's last network choice
3. **Regtest support**: Same pattern could add `/regtest/*` routes
4. **Network status indicator**: Show sync status in header
5. **DigiDollar testnet stats**: Special DigiDollar metrics for testnet

---

## 10. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Testnet node down | Testnet pages fail | Show "Testnet unavailable" message |
| Mixed network data | User confusion | Clear visual distinction (colors, badge) |
| Performance impact | Slower responses | Separate caching for each network |
| Breaking mainnet | Production outage | Test thoroughly before deploy |

---

## Appendix A: Oracle Consensus Note

During testing, we discovered the actual testnet Oracle consensus is **4-of-7** (not 3-of-10 as documented):

```
Oracle: Initialized with 4-of-7 consensus, epoch length 1440 blocks
Oracle: 7 oracle public keys configured
```

This should be reflected in the DigiDollarPage.js documentation.
