import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, act } from '@testing-library/react';
import DDStatsPage from '../../../pages/DDStatsPage';
import { renderWithProviders, createWebSocketMock, waitForAsync } from '../../utils/testUtils';

// Mock data for WebSocket responses
// Backend sends: { type: 'ddStatsData', data: { stats, oraclePrice } }
const mockDDStats = {
  health_percentage: 852,
  health_status: 'healthy',
  total_collateral_dgb: 14762213.45,
  total_dd_supply: 1043006, // in cents ($10,430.06)
  oracle_price_micro_usd: 6029,
  oracle_price_cents: 1,
  is_emergency: false,
  active_positions: 47,
  dca_tier: {
    min_collateral: 150,
    max_collateral: 999999,
    multiplier: 1.0,
    status: 'healthy'
  },
  err_tier: {
    ratio: 1.0,
    burn_multiplier: 1.0,
    description: 'Normal (1.0x burn)'
  }
};

const mockOraclePrice = {
  price_micro_usd: 50000,
  price_usd: 0.05,
  oracle_count: 5,
  status: 'active',
  last_update_height: 2000,
  is_stale: false
};

const mockEmergencyStats = {
  ...mockDDStats,
  health_percentage: 85,
  health_status: 'emergency',
  is_emergency: true,
  dca_tier: {
    min_collateral: 0,
    max_collateral: 99,
    multiplier: 2.0,
    status: 'emergency'
  },
  err_tier: {
    ratio: 0.85,
    burn_multiplier: 1.25,
    description: '<85%: 1.25x DD burn (max)'
  }
};

// Combined message that backend sends via WebSocket
const mockDDStatsMessage = {
  type: 'ddStatsData',
  data: {
    stats: mockDDStats,
    oraclePrice: mockOraclePrice
  }
};

// Helper to send DD stats data via WebSocket
function sendDDStatsData(ws, overrides = {}) {
  const data = {
    ...mockDDStatsMessage.data,
    ...overrides
  };
  ws.receiveMessage({ type: 'ddStatsData', data });
}

describe('DDStatsPage', () => {
  let wsSetup;
  let mockWebSocket;
  let webSocketInstances;

  beforeEach(() => {
    wsSetup = createWebSocketMock();
    mockWebSocket = wsSetup.MockWebSocket;
    webSocketInstances = wsSetup.instances;
    global.WebSocket = mockWebSocket;
  });

  afterEach(() => {
    webSocketInstances.forEach(ws => ws.close());
    wsSetup.clearInstances();
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the hero section with title and description', async () => {
      renderWithProviders(<DDStatsPage />, { network: 'testnet' });

      expect(screen.getByText('DigiDollar Testnet Stats')).toBeInTheDocument();
      expect(screen.getByText('Real-Time Network Health & Statistics')).toBeInTheDocument();
      expect(screen.getByText('Monitor DD Supply, Locked DGB, DCA & ERR Levels')).toBeInTheDocument();
    });

    it('should render the network status card header', async () => {
      renderWithProviders(<DDStatsPage />, { network: 'testnet' });

      expect(screen.getByText('Network DigiDollar Status')).toBeInTheDocument();
    });

    it('should render the DCA card', async () => {
      renderWithProviders(<DDStatsPage />, { network: 'testnet' });

      expect(screen.getByText('Dynamic Collateral Adjustment (DCA)')).toBeInTheDocument();
      expect(screen.getByText(/DCA automatically adjusts collateral requirements/)).toBeInTheDocument();
    });

    it('should render the ERR card', async () => {
      renderWithProviders(<DDStatsPage />, { network: 'testnet' });

      expect(screen.getByText('Emergency Redemption Ratio (ERR)')).toBeInTheDocument();
      expect(screen.getByText(/ERR increases DD burn requirements/)).toBeInTheDocument();
    });

    it('should render the quick stats grid', async () => {
      renderWithProviders(<DDStatsPage />, { network: 'testnet' });

      expect(screen.getByText('Total DD Supply')).toBeInTheDocument();
      expect(screen.getByText('DGB Locked')).toBeInTheDocument();
      expect(screen.getByText('Collateral Ratio')).toBeInTheDocument();
      expect(screen.getByText('Active Oracles')).toBeInTheDocument();
    });

    it('should render the system health explainer', async () => {
      renderWithProviders(<DDStatsPage />, { network: 'testnet' });

      expect(screen.getByText('How System Health Works')).toBeInTheDocument();
      const collateralizationTexts = screen.getAllByText(/Network Collateralization/);
      expect(collateralizationTexts.length).toBeGreaterThan(0);
      expect(screen.getByText('Health Thresholds:')).toBeInTheDocument();
    });
  });

  describe('WebSocket Connection', () => {
    it('should establish WebSocket connection on mount', async () => {
      renderWithProviders(<DDStatsPage />, { network: 'testnet' });

      await waitForAsync();

      expect(mockWebSocket).toHaveBeenCalledWith('ws://localhost:5003');
      expect(webSocketInstances.length).toBe(1);
      expect(webSocketInstances[0].readyState).toBe(WebSocket.OPEN);
    });

    it('should close WebSocket connection on unmount', async () => {
      const { unmount } = renderWithProviders(<DDStatsPage />, { network: 'testnet' });

      await waitForAsync();
      const ws = webSocketInstances[0];

      unmount();

      expect(ws.readyState).toBe(WebSocket.CLOSED);
    });

    it('should update data on subsequent ddStatsData messages', async () => {
      renderWithProviders(<DDStatsPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      // Send initial data
      sendDDStatsData(ws);

      await waitFor(() => {
        const healthTexts = screen.getAllByText(/852%/);
        expect(healthTexts.length).toBeGreaterThan(0);
      });

      // Send updated data with different health
      sendDDStatsData(ws, {
        stats: { ...mockDDStats, health_percentage: 900 }
      });

      await waitFor(() => {
        const healthTexts = screen.getAllByText(/900%/);
        expect(healthTexts.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Data Display', () => {
    it('should display fetched health percentage', async () => {
      renderWithProviders(<DDStatsPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDDStatsData(ws);

      await waitFor(() => {
        const healthTexts = screen.getAllByText(/852%/);
        expect(healthTexts.length).toBeGreaterThan(0);
      });
    });

    it('should display fetched oracle price', async () => {
      renderWithProviders(<DDStatsPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDDStatsData(ws);

      await waitFor(() => {
        const priceLabels = screen.getAllByText(/DGB\/USD Price/);
        expect(priceLabels.length).toBeGreaterThan(0);
        const priceText = screen.getAllByText(/\$0\.00/);
        expect(priceText.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('should show error message when WebSocket fails', async () => {
      renderWithProviders(<DDStatsPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      ws.triggerError(new Error('Connection failed'));

      await waitFor(() => {
        expect(screen.getByText(/Unable to connect to DigiDollar stats feed/)).toBeInTheDocument();
      });
    });

    it('should fall back to default state when WebSocket errors', async () => {
      renderWithProviders(<DDStatsPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      ws.triggerError(new Error('Connection failed'));

      await waitFor(() => {
        expect(screen.getByText('DigiDollar Testnet Stats')).toBeInTheDocument();
      });
    });
  });

  describe('DCA Tiers', () => {
    it('should display current DCA tier status', async () => {
      renderWithProviders(<DDStatsPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDDStatsData(ws);

      await waitFor(() => {
        expect(screen.getByText(/Current Tier: HEALTHY/)).toBeInTheDocument();
      });
    });

    it('should display DCA multiplier', async () => {
      renderWithProviders(<DDStatsPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDDStatsData(ws);

      await waitFor(() => {
        const multiplierTexts = screen.getAllByText(/1\.0x/);
        expect(multiplierTexts.length).toBeGreaterThan(0);
      });
    });

    it('should display all DCA tier chips', async () => {
      renderWithProviders(<DDStatsPage />, { network: 'testnet' });

      expect(screen.getByText(/≥150%: 1.0x/)).toBeInTheDocument();
      expect(screen.getByText(/120-149%: 1.2x/)).toBeInTheDocument();
      expect(screen.getByText(/100-119%: 1.5x/)).toBeInTheDocument();
      expect(screen.getByText(/<100%: 2.0x/)).toBeInTheDocument();
    });
  });

  describe('ERR Status', () => {
    it('should show ERR as inactive when system is healthy', async () => {
      renderWithProviders(<DDStatsPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDDStatsData(ws);

      await waitFor(() => {
        expect(screen.getByText(/Status: INACTIVE/)).toBeInTheDocument();
        expect(screen.getByText(/System healthy\. Normal redemption ratios apply\./)).toBeInTheDocument();
      });
    });

    it('should show ERR as active during emergency', async () => {
      renderWithProviders(<DDStatsPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDDStatsData(ws, {
        stats: mockEmergencyStats
      });

      await waitFor(() => {
        expect(screen.getByText(/Status: ACTIVE/)).toBeInTheDocument();
        expect(screen.getByText(/ERR is active\. New minting blocked/)).toBeInTheDocument();
      });
    });
  });

  describe('Network Status', () => {
    it('should display HEALTHY status chip when healthy', async () => {
      renderWithProviders(<DDStatsPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDDStatsData(ws);

      await waitFor(() => {
        const healthyChips = screen.getAllByText('HEALTHY');
        expect(healthyChips.length).toBeGreaterThan(0);
      });
    });

    it('should display EMERGENCY status chip during emergency', async () => {
      renderWithProviders(<DDStatsPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDDStatsData(ws, {
        stats: mockEmergencyStats
      });

      await waitFor(() => {
        const emergencyChips = screen.getAllByText('EMERGENCY');
        expect(emergencyChips.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Supply and Collateral Display', () => {
    it('should display formatted DD supply', async () => {
      renderWithProviders(<DDStatsPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDDStatsData(ws);

      await waitFor(() => {
        const ddSupplyTexts = screen.getAllByText('$10,430.06 DD');
        expect(ddSupplyTexts.length).toBeGreaterThan(0);
      });
    });

    it('should display formatted DGB locked', async () => {
      renderWithProviders(<DDStatsPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDDStatsData(ws);

      await waitFor(() => {
        expect(screen.getByText('14,762,213.45 DGB')).toBeInTheDocument();
      });
    });

    it('should display collateralization progress bar', async () => {
      renderWithProviders(<DDStatsPage />, { network: 'testnet' });

      const collateralizationTexts = screen.getAllByText(/Network Collateralization/);
      expect(collateralizationTexts.length).toBeGreaterThan(0);
      expect(screen.getByText(/Minimum required: 100%/)).toBeInTheDocument();
    });
  });

  describe('Health Thresholds Explainer', () => {
    it('should display all health threshold levels', async () => {
      renderWithProviders(<DDStatsPage />, { network: 'testnet' });

      const healthy150 = screen.getAllByText(/≥150%/);
      expect(healthy150.length).toBeGreaterThan(0);
      expect(screen.getByText(/- Healthy: Normal operations/)).toBeInTheDocument();
      const warning120 = screen.getAllByText(/120-149%/);
      expect(warning120.length).toBeGreaterThan(0);
      const critical100 = screen.getAllByText(/100-119%/);
      expect(critical100.length).toBeGreaterThan(0);
      const emergency = screen.getAllByText(/<100%/);
      expect(emergency.length).toBeGreaterThan(0);
    });

    it('should show health calculation formula', async () => {
      renderWithProviders(<DDStatsPage />, { network: 'testnet' });

      expect(screen.getByText(/Health % = \(Total DGB Locked × DGB Price\) \/ Total DD Supply × 100/)).toBeInTheDocument();
    });
  });

  describe('Network Context', () => {
    it('should apply testnet styling', async () => {
      renderWithProviders(<DDStatsPage />, { network: 'testnet' });

      expect(screen.getByText('DigiDollar Testnet Stats')).toBeInTheDocument();
    });
  });

  describe('Oracle Count', () => {
    it('should display active oracle count', async () => {
      renderWithProviders(<DDStatsPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDDStatsData(ws);

      await waitFor(() => {
        const oracleCountElements = screen.getAllByText(/[45]/);
        expect(oracleCountElements.length).toBeGreaterThan(0);
      });
    });
  });
});
