import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NetworkProvider, useNetwork } from '../../../context/NetworkContext';

// Test component that uses the useNetwork hook
const TestComponent = () => {
  const network = useNetwork();
  return (
    <div>
      <span data-testid="name">{network.name}</span>
      <span data-testid="displayName">{network.displayName}</span>
      <span data-testid="apiBaseUrl">{network.apiBaseUrl}</span>
      <span data-testid="wsBaseUrl">{network.wsBaseUrl}</span>
      <span data-testid="basePath">{network.basePath}</span>
      <span data-testid="apiPrefix">{network.apiPrefix}</span>
      <span data-testid="isTestnet">{network.isTestnet ? 'true' : 'false'}</span>
      <span data-testid="isMainnet">{network.isMainnet ? 'true' : 'false'}</span>
      <span data-testid="primaryColor">{network.theme.primary}</span>
      <span data-testid="getApiUrl">{network.getApiUrl('/test')}</span>
    </div>
  );
};

describe('NetworkContext', () => {
  describe('Mainnet Configuration', () => {
    it('should provide correct mainnet configuration values', () => {
      render(
        <NetworkProvider network="mainnet">
          <TestComponent />
        </NetworkProvider>
      );

      expect(screen.getByTestId('name')).toHaveTextContent('mainnet');
      expect(screen.getByTestId('displayName')).toHaveTextContent('Mainnet');
      expect(screen.getByTestId('apiBaseUrl')).toHaveTextContent('http://localhost:5001');
      expect(screen.getByTestId('wsBaseUrl')).toHaveTextContent('ws://localhost:5002');
      expect(screen.getByTestId('basePath')).toHaveTextContent('');
      expect(screen.getByTestId('apiPrefix')).toHaveTextContent('');
      expect(screen.getByTestId('isTestnet')).toHaveTextContent('false');
      expect(screen.getByTestId('isMainnet')).toHaveTextContent('true');
    });

    it('should use mainnet theme colors', () => {
      render(
        <NetworkProvider network="mainnet">
          <TestComponent />
        </NetworkProvider>
      );

      expect(screen.getByTestId('primaryColor')).toHaveTextContent('#002352');
    });

    it('should default to mainnet when no network is specified', () => {
      render(
        <NetworkProvider>
          <TestComponent />
        </NetworkProvider>
      );

      expect(screen.getByTestId('name')).toHaveTextContent('mainnet');
      expect(screen.getByTestId('isMainnet')).toHaveTextContent('true');
      expect(screen.getByTestId('isTestnet')).toHaveTextContent('false');
    });
  });

  describe('Testnet Configuration', () => {
    it('should provide correct testnet configuration values', () => {
      render(
        <NetworkProvider network="testnet">
          <TestComponent />
        </NetworkProvider>
      );

      expect(screen.getByTestId('name')).toHaveTextContent('testnet');
      expect(screen.getByTestId('displayName')).toHaveTextContent('Testnet');
      expect(screen.getByTestId('apiBaseUrl')).toHaveTextContent('http://localhost:5001');
      expect(screen.getByTestId('wsBaseUrl')).toHaveTextContent('ws://localhost:5003');
      expect(screen.getByTestId('basePath')).toHaveTextContent('/testnet');
      expect(screen.getByTestId('apiPrefix')).toHaveTextContent('/testnet');
      expect(screen.getByTestId('isTestnet')).toHaveTextContent('true');
      expect(screen.getByTestId('isMainnet')).toHaveTextContent('false');
    });

    it('should use testnet theme colors', () => {
      render(
        <NetworkProvider network="testnet">
          <TestComponent />
        </NetworkProvider>
      );

      expect(screen.getByTestId('primaryColor')).toHaveTextContent('#2e7d32');
    });
  });

  describe('getApiUrl Helper', () => {
    it('should return correct API URL for mainnet', () => {
      render(
        <NetworkProvider network="mainnet">
          <TestComponent />
        </NetworkProvider>
      );

      // Mainnet: http://localhost:5001/api/test (no prefix)
      expect(screen.getByTestId('getApiUrl')).toHaveTextContent('http://localhost:5001/api/test');
    });

    it('should return correct API URL for testnet', () => {
      render(
        <NetworkProvider network="testnet">
          <TestComponent />
        </NetworkProvider>
      );

      // Testnet: http://localhost:5001/api/testnet/test (with /testnet prefix)
      expect(screen.getByTestId('getApiUrl')).toHaveTextContent('http://localhost:5001/api/testnet/test');
    });
  });

  describe('useNetwork Hook', () => {
    it('should throw error when used outside NetworkProvider', () => {
      // Suppress console.error for this test since we expect an error
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useNetwork must be used within NetworkProvider');

      consoleErrorSpy.mockRestore();
    });

    it('should return the network context values', () => {
      render(
        <NetworkProvider network="mainnet">
          <TestComponent />
        </NetworkProvider>
      );

      // Verify all expected properties are present
      expect(screen.getByTestId('name')).toBeInTheDocument();
      expect(screen.getByTestId('displayName')).toBeInTheDocument();
      expect(screen.getByTestId('apiBaseUrl')).toBeInTheDocument();
      expect(screen.getByTestId('wsBaseUrl')).toBeInTheDocument();
      expect(screen.getByTestId('basePath')).toBeInTheDocument();
      expect(screen.getByTestId('apiPrefix')).toBeInTheDocument();
      expect(screen.getByTestId('isTestnet')).toBeInTheDocument();
      expect(screen.getByTestId('isMainnet')).toBeInTheDocument();
      expect(screen.getByTestId('primaryColor')).toBeInTheDocument();
      expect(screen.getByTestId('getApiUrl')).toBeInTheDocument();
    });
  });

  describe('Context Value Memoization', () => {
    it('should provide consistent values across re-renders', () => {
      const { rerender } = render(
        <NetworkProvider network="testnet">
          <TestComponent />
        </NetworkProvider>
      );

      const initialApiUrl = screen.getByTestId('getApiUrl').textContent;

      // Re-render with same props
      rerender(
        <NetworkProvider network="testnet">
          <TestComponent />
        </NetworkProvider>
      );

      // Values should remain consistent
      expect(screen.getByTestId('getApiUrl')).toHaveTextContent(initialApiUrl);
      expect(screen.getByTestId('name')).toHaveTextContent('testnet');
    });
  });
});
