import React, { createContext, useContext, useMemo } from 'react';

const NetworkContext = createContext(null);

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';

const NETWORK_CONFIG = {
  mainnet: {
    name: 'mainnet',
    displayName: 'Mainnet',
    digiDollarLabel: 'Mainnet',
    apiBaseUrl: API_BASE_URL,
    wsBaseUrl: process.env.REACT_APP_WS_BASE_URL || 'ws://localhost:5002',
    basePath: '',
    apiPrefix: '',
    theme: {
      primary: '#002352',
      secondary: '#0066cc',
      gradient: 'linear-gradient(135deg, #002352 0%, #0066cc 100%)'
    },
    activation: {
      activationThreshold: 70,
      activationWindow: 40320,
      thresholdBlocks: 28224,
      minActivationHeight: 23627520,
      minActivationLabel: 'Earliest Activation Height',
      bit: 23,
      stages: {
        defined: 'Pre-signal',
        started: 'Signaling window',
        locked_in: 'Threshold met',
        active: 'Activated',
        failed: 'Timed out'
      },
      description: 'Mainnet activation follows normal DigiByte BIP9 signaling windows.',
      explainer: 'BIP9 ensures network consensus before activating new features. By requiring 70% miner support, the upgrade proceeds only when the network is ready.'
    },
    digiDollarRelease: {
      version: 'v9.26.4',
      network: 'mainnet',
      p2pPort: '12024',
      activationSummary: 'BIP9 bit 23 — needs 28,224 of 40,320 blocks (70%) signaling; min activation height 23,627,520 already passed',
      oracleTotalSlots: 35,
      activeOracleSlots: 35,
      oracleThreshold: 7
    },
    oracle: {
      totalSlots: 35,
      activeSlots: 35,
      threshold: 7,
      releaseLabel: 'Mainnet',
      rosterLabel: 'mainnet roster',
      operatorSlotLabel: 'assigned mainnet oracle slot',
      phaseSummary: '7 of 35 signatures required | 35-slot reserved roster | MuSig2 aggregate signing (v0x03)'
    },
    cliDeploymentCommand: 'digibyte-cli getdigidollardeploymentinfo'
  },
  testnet: {
    name: 'testnet',
    displayName: 'Testnet',
    digiDollarLabel: 'Testnet',
    apiBaseUrl: API_BASE_URL,
    wsBaseUrl: process.env.REACT_APP_TESTNET_WS_BASE_URL || 'ws://localhost:5003',
    basePath: '/testnet',
    apiPrefix: '/testnet',
    theme: {
      primary: '#2e7d32',
      secondary: '#4caf50',
      gradient: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)'
    },
    activation: {
      activationThreshold: 70,
      activationWindow: 200,
      thresholdBlocks: 140,
      minActivationHeight: 600,
      minActivationLabel: 'Min Activation Height',
      bit: 23,
      stages: {
        defined: '0-199',
        started: '200-399',
        locked_in: '400-599',
        active: '600+',
        failed: 'Timeout'
      },
      description: 'This testnet deployment uses accelerated parameters for testing.',
      explainer: 'This testnet deployment tests the full activation lifecycle with accelerated parameters. On mainnet, the timeline is longer but the mechanism is identical.'
    },
    digiDollarRelease: {
      version: 'v9.26.4',
      network: 'testnet26',
      p2pPort: '12033',
      activationSummary: 'block 600 activation',
      oracleTotalSlots: 35,
      activeOracleSlots: 35,
      oracleThreshold: 7
    },
    oracle: {
      totalSlots: 35,
      activeSlots: 35,
      threshold: 7,
      releaseLabel: 'Testnet26',
      rosterLabel: 'testnet roster',
      operatorSlotLabel: 'assigned testnet26 oracle slot',
      phaseSummary: '7 of 35 signatures required | 35-slot reserved roster | 35 testnet roster oracles | MuSig2 aggregate signing (v0x03)'
    },
    cliDeploymentCommand: 'digibyte-cli -testnet getdigidollardeploymentinfo'
  }
};

function joinNetworkPath(basePath, endpoint) {
  if (!endpoint || endpoint === '/') return basePath || '/';
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${basePath || ''}${normalizedEndpoint}`;
}

export const getNetworkConfig = (network = 'mainnet') => {
  return NETWORK_CONFIG[network] || NETWORK_CONFIG.mainnet;
};

export const NetworkProvider = ({ children, network = 'mainnet' }) => {
  const config = getNetworkConfig(network);

  const value = useMemo(() => ({
    ...config,
    isTestnet: config.name === 'testnet',
    isMainnet: config.name === 'mainnet',
    getApiUrl: (endpoint) => {
      const prefix = config.apiPrefix || '';
      return `${config.apiBaseUrl}/api${prefix}${endpoint}`;
    },
    getNetworkPath: (endpoint) => joinNetworkPath(config.basePath, endpoint)
  }), [config]);

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
