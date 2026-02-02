import React, { createContext, useContext, useMemo } from 'react';

const NetworkContext = createContext(null);

const NETWORK_CONFIG = {
  mainnet: {
    name: 'mainnet',
    displayName: 'Mainnet',
    apiBaseUrl: 'http://localhost:5001',
    wsBaseUrl: 'ws://localhost:5002',
    basePath: '',
    apiPrefix: '',
    theme: {
      primary: '#002352',
      secondary: '#0066cc',
      gradient: 'linear-gradient(135deg, #002352 0%, #0066cc 100%)'
    }
  },
  testnet: {
    name: 'testnet',
    displayName: 'Testnet',
    apiBaseUrl: 'http://localhost:5001',
    wsBaseUrl: 'ws://localhost:5003',
    basePath: '/testnet',
    apiPrefix: '/testnet',
    theme: {
      primary: '#2e7d32',
      secondary: '#4caf50',
      gradient: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)'
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
