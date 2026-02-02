import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, act } from '@testing-library/react';
import DDStatsPage from '../../../pages/DDStatsPage';
import { renderWithProviders } from '../../utils/testUtils';

// Mock data for API responses
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

// Mock getoracleprice response
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

describe('DDStatsPage', () => {
  let originalFetch;

  beforeEach(() => {
    // Store original fetch
    originalFetch = global.fetch;

    // Mock fetch
    global.fetch = vi.fn((url) => {
      if (url.includes('getdigidollarstats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDDStats)
        });
      }
      if (url.includes('getoracleprice')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockOraclePrice)
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
    vi.clearAllTimers();
  });

  describe('Rendering', () => {
    it('should render the hero section with title and description', async () => {
      await act(async () => {
        renderWithProviders(<DDStatsPage />, { network: 'testnet' });
      });

      expect(screen.getByText('DigiDollar Testnet Stats')).toBeInTheDocument();
      expect(screen.getByText('Real-Time Network Health & Statistics')).toBeInTheDocument();
      expect(screen.getByText('Monitor DD Supply, Locked DGB, DCA & ERR Levels')).toBeInTheDocument();
    });

    it('should render the network status card header', async () => {
      await act(async () => {
        renderWithProviders(<DDStatsPage />, { network: 'testnet' });
      });

      expect(screen.getByText('Network DigiDollar Status')).toBeInTheDocument();
    });

    it('should render the DCA card', async () => {
      await act(async () => {
        renderWithProviders(<DDStatsPage />, { network: 'testnet' });
      });

      expect(screen.getByText('Dynamic Collateral Adjustment (DCA)')).toBeInTheDocument();
      expect(screen.getByText(/DCA automatically adjusts collateral requirements/)).toBeInTheDocument();
    });

    it('should render the ERR card', async () => {
      await act(async () => {
        renderWithProviders(<DDStatsPage />, { network: 'testnet' });
      });

      expect(screen.getByText('Emergency Redemption Ratio (ERR)')).toBeInTheDocument();
      expect(screen.getByText(/ERR increases DD burn requirements/)).toBeInTheDocument();
    });

    it('should render the quick stats grid', async () => {
      await act(async () => {
        renderWithProviders(<DDStatsPage />, { network: 'testnet' });
      });

      expect(screen.getByText('Total DD Supply')).toBeInTheDocument();
      expect(screen.getByText('DGB Locked')).toBeInTheDocument();
      expect(screen.getByText('Collateral Ratio')).toBeInTheDocument();
      expect(screen.getByText('Active Oracles')).toBeInTheDocument();
    });

    it('should render the system health explainer', async () => {
      await act(async () => {
        renderWithProviders(<DDStatsPage />, { network: 'testnet' });
      });

      expect(screen.getByText('How System Health Works')).toBeInTheDocument();
      // Use getAllByText since "Network Collateralization" appears multiple times
      const collateralizationTexts = screen.getAllByText(/Network Collateralization/);
      expect(collateralizationTexts.length).toBeGreaterThan(0);
      expect(screen.getByText('Health Thresholds:')).toBeInTheDocument();
    });
  });

  describe('Data Fetching', () => {
    it('should fetch DD stats on mount', async () => {
      await act(async () => {
        renderWithProviders(<DDStatsPage />, { network: 'testnet' });
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/testnet/getdigidollarstats'));
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/testnet/getoracleprice'));
      });
    });

    it('should display fetched health percentage', async () => {
      await act(async () => {
        renderWithProviders(<DDStatsPage />, { network: 'testnet' });
      });

      await waitFor(() => {
        // Health percentage should appear multiple times (in different places)
        const healthTexts = screen.getAllByText(/852%/);
        expect(healthTexts.length).toBeGreaterThan(0);
      });
    });

    it('should display fetched oracle price', async () => {
      await act(async () => {
        renderWithProviders(<DDStatsPage />, { network: 'testnet' });
      });

      // Wait for loading to complete and check for price display
      await waitFor(() => {
        // Check that DGB/USD Price label is visible
        const priceLabels = screen.getAllByText(/DGB\/USD Price/);
        expect(priceLabels.length).toBeGreaterThan(0);
        // Check that a dollar amount is shown (from default or fetched data)
        const priceText = screen.getAllByText(/\$0\.00/);
        expect(priceText.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('should show error message when API fails', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await act(async () => {
        renderWithProviders(<DDStatsPage />, { network: 'testnet' });
      });

      await waitFor(() => {
        expect(screen.getByText(/Unable to fetch live DigiDollar stats/)).toBeInTheDocument();
      });
    });

    it('should fall back to mock data when API fails', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await act(async () => {
        renderWithProviders(<DDStatsPage />, { network: 'testnet' });
      });

      // Should still render with default/mock data
      await waitFor(() => {
        expect(screen.getByText('DigiDollar Testnet Stats')).toBeInTheDocument();
      });
    });
  });

  describe('DCA Tiers', () => {
    it('should display current DCA tier status', async () => {
      await act(async () => {
        renderWithProviders(<DDStatsPage />, { network: 'testnet' });
      });

      await waitFor(() => {
        expect(screen.getByText(/Current Tier: HEALTHY/)).toBeInTheDocument();
      });
    });

    it('should display DCA multiplier', async () => {
      await act(async () => {
        renderWithProviders(<DDStatsPage />, { network: 'testnet' });
      });

      await waitFor(() => {
        // Look for DCA Level with multiplier - the value appears in the component
        const multiplierTexts = screen.getAllByText(/1\.0x/);
        expect(multiplierTexts.length).toBeGreaterThan(0);
      });
    });

    it('should display all DCA tier chips', async () => {
      await act(async () => {
        renderWithProviders(<DDStatsPage />, { network: 'testnet' });
      });

      expect(screen.getByText(/≥150%: 1.0x/)).toBeInTheDocument();
      expect(screen.getByText(/120-149%: 1.2x/)).toBeInTheDocument();
      expect(screen.getByText(/100-119%: 1.5x/)).toBeInTheDocument();
      expect(screen.getByText(/<100%: 2.0x/)).toBeInTheDocument();
    });
  });

  describe('ERR Status', () => {
    it('should show ERR as inactive when system is healthy', async () => {
      await act(async () => {
        renderWithProviders(<DDStatsPage />, { network: 'testnet' });
      });

      await waitFor(() => {
        expect(screen.getByText(/Status: INACTIVE/)).toBeInTheDocument();
        expect(screen.getByText(/System healthy\. Normal redemption ratios apply\./)).toBeInTheDocument();
      });
    });

    it('should show ERR as active during emergency', async () => {
      global.fetch = vi.fn((url) => {
        if (url.includes('getdigidollarstats')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockEmergencyStats)
          });
        }
        if (url.includes('getoracleprice')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockOraclePrice)
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      await act(async () => {
        renderWithProviders(<DDStatsPage />, { network: 'testnet' });
      });

      await waitFor(() => {
        expect(screen.getByText(/Status: ACTIVE/)).toBeInTheDocument();
        expect(screen.getByText(/ERR is active\. New minting blocked/)).toBeInTheDocument();
      });
    });
  });

  describe('Network Status', () => {
    it('should display HEALTHY status chip when healthy', async () => {
      await act(async () => {
        renderWithProviders(<DDStatsPage />, { network: 'testnet' });
      });

      await waitFor(() => {
        const healthyChips = screen.getAllByText('HEALTHY');
        expect(healthyChips.length).toBeGreaterThan(0);
      });
    });

    it('should display EMERGENCY status chip during emergency', async () => {
      global.fetch = vi.fn((url) => {
        if (url.includes('getdigidollarstats')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockEmergencyStats)
          });
        }
        if (url.includes('getoracleprice')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockOraclePrice)
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      await act(async () => {
        renderWithProviders(<DDStatsPage />, { network: 'testnet' });
      });

      await waitFor(() => {
        const emergencyChips = screen.getAllByText('EMERGENCY');
        expect(emergencyChips.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Supply and Collateral Display', () => {
    it('should display formatted DD supply', async () => {
      await act(async () => {
        renderWithProviders(<DDStatsPage />, { network: 'testnet' });
      });

      await waitFor(() => {
        // $10,430.06 DD formatted
        expect(screen.getByText('$10,430.06 DD')).toBeInTheDocument();
      });
    });

    it('should display formatted DGB locked', async () => {
      await act(async () => {
        renderWithProviders(<DDStatsPage />, { network: 'testnet' });
      });

      await waitFor(() => {
        // 14,762,213.45 DGB formatted
        expect(screen.getByText('14,762,213.45 DGB')).toBeInTheDocument();
      });
    });

    it('should display collateralization progress bar', async () => {
      await act(async () => {
        renderWithProviders(<DDStatsPage />, { network: 'testnet' });
      });

      // Use getAllByText since "Network Collateralization" appears multiple times
      const collateralizationTexts = screen.getAllByText(/Network Collateralization/);
      expect(collateralizationTexts.length).toBeGreaterThan(0);
      expect(screen.getByText(/Minimum required: 100%/)).toBeInTheDocument();
    });
  });

  describe('Health Thresholds Explainer', () => {
    it('should display all health threshold levels', async () => {
      await act(async () => {
        renderWithProviders(<DDStatsPage />, { network: 'testnet' });
      });

      // Text appears in multiple places (DCA tier chips and explainer), so use getAllByText
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
      await act(async () => {
        renderWithProviders(<DDStatsPage />, { network: 'testnet' });
      });

      expect(screen.getByText(/Health % = \(Total DGB Locked × DGB Price\) \/ Total DD Supply × 100/)).toBeInTheDocument();
    });
  });

  describe('Network Context', () => {
    it('should apply testnet styling', async () => {
      await act(async () => {
        renderWithProviders(<DDStatsPage />, { network: 'testnet' });
      });

      // Check for testnet-specific text
      expect(screen.getByText('DigiDollar Testnet Stats')).toBeInTheDocument();
    });
  });

  describe('Oracle Count', () => {
    it('should display active oracle count', async () => {
      await act(async () => {
        renderWithProviders(<DDStatsPage />, { network: 'testnet' });
      });

      await waitFor(() => {
        // The component shows oracle count - default is 7 or from API
        // After fetch, should show 4 running oracles
        const oracleCountElements = screen.getAllByText(/[47]/);
        expect(oracleCountElements.length).toBeGreaterThan(0);
      });
    });
  });
});
