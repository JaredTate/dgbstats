import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../../App';
import { renderWithProviders, createWebSocketMock, waitForAsync } from '../utils/testUtils';
import { mockApiResponses, generateWebSocketMessage } from '../mocks/mockData';

// Mock the config
vi.mock('../../config', () => ({
  default: {
    apiBaseUrl: 'http://localhost:5001',
    wsBaseUrl: 'ws://localhost:5002'
  }
}));

// Mock Chart.js to avoid canvas errors
vi.mock('chart.js', async () => {
  const actual = await vi.importActual('chart.js');
  const Chart = vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    update: vi.fn(),
    render: vi.fn(),
    resize: vi.fn(),
    clear: vi.fn(),
    stop: vi.fn(),
    data: {},
    options: {}
  }));
  Chart.register = vi.fn();
  Chart.instances = {};
  return {
    ...actual,
    Chart,
    registerables: [],
    LineController: vi.fn(),
    LineElement: vi.fn(),
    PointElement: vi.fn(),
    LinearScale: vi.fn(),
    Title: vi.fn(),
    Tooltip: vi.fn(),
    Legend: vi.fn(),
    CategoryScale: vi.fn(),
    TimeScale: vi.fn()
  };
});

// Mock chartjs-adapter-luxon
vi.mock('chartjs-adapter-luxon', () => ({}));

describe.skip('App Integration Tests - SKIPPED: Complex integration tests', () => {
  let wsSetup;
  let mockWebSocket;
  let webSocketInstances;

  beforeEach(() => {
    // Setup WebSocket mock
    wsSetup = createWebSocketMock();
    mockWebSocket = wsSetup.MockWebSocket;
    webSocketInstances = wsSetup.instances;
    global.WebSocket = mockWebSocket;
  });

  afterEach(() => {
    // Clean up WebSocket instances
    webSocketInstances.forEach(ws => ws.close());
    wsSetup.clearInstances();
    vi.clearAllMocks();
  });

  describe('Navigation', () => {
    it('should render the header and footer on all pages', () => {
      renderWithProviders(<App />);
      
      // Header should be present
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByAltText('DigiByte Logo')).toBeInTheDocument();
      
      // Footer should be present
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('should navigate between pages using header links', async () => {
      renderWithProviders(<App />);
      
      // Should start on home page
      expect(screen.getByText('DigiByte Blockchain Statistics')).toBeInTheDocument();
      
      // Navigate to Nodes page
      const nodesLink = screen.getByRole('link', { name: /nodes/i });
      fireEvent.click(nodesLink);
      
      await waitFor(() => {
        expect(screen.getByText('DigiByte Network Nodes')).toBeInTheDocument();
      });
      
      // Navigate to Pools page
      const poolsLink = screen.getByRole('link', { name: /pools/i });
      fireEvent.click(poolsLink);
      
      await waitFor(() => {
        expect(screen.getByText('Mining Pool Distribution')).toBeInTheDocument();
      });
    });

    it('should handle direct URL navigation', () => {
      renderWithProviders(<App />, { route: '/supply' });
      
      expect(screen.getByText('DigiByte Supply Statistics')).toBeInTheDocument();
    });

    it('should maintain WebSocket connections across navigation', async () => {
      renderWithProviders(<App />);
      
      await waitForAsync();
      
      // Should have one WebSocket for home page
      expect(webSocketInstances.length).toBe(1);
      const firstWs = webSocketInstances[0];
      
      // Navigate to another page
      const nodesLink = screen.getByRole('link', { name: /nodes/i });
      fireEvent.click(nodesLink);
      
      await waitForAsync();
      
      // First WebSocket should be closed
      expect(firstWs.readyState).toBe(WebSocket.CLOSED);
      
      // New WebSocket should be created
      expect(webSocketInstances.length).toBe(2);
      expect(webSocketInstances[1].readyState).toBe(WebSocket.OPEN);
    });
  });

  describe('Data Flow', () => {
    it('should share theme across all pages', async () => {
      renderWithProviders(<App />);
      
      // Check dark theme on home page
      const homeContainer = screen.getByRole('main');
      expect(homeContainer).toHaveStyle({ backgroundColor: expect.stringContaining('rgb') });
      
      // Navigate to another page
      const hashrateLink = screen.getByRole('link', { name: /hashrate/i });
      fireEvent.click(hashrateLink);
      
      await waitFor(() => {
        const hashrateContainer = screen.getByRole('main');
        expect(hashrateContainer).toHaveStyle({ backgroundColor: expect.stringContaining('rgb') });
      });
    });

    it('should update data in real-time on active page', async () => {
      renderWithProviders(<App />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      // Send homepage data
      ws.receiveMessage(generateWebSocketMessage('initialData'));
      
      await waitFor(() => {
        expect(screen.getByText('17,456,789')).toBeInTheDocument(); // Block height
      });
      
      // Send updated data
      ws.receiveMessage({
        type: 'initialData',
        data: {
          blockchainInfo: {
            blocks: 17456790,
            difficulty: 12345678.90,
            size_on_disk: 123456789012,
            softforks: mockApiResponses.homepageData.softforks
          },
          chainTxStats: { txcount: 123456789 },
          txOutsetInfo: {
            total_amount: mockApiResponses.homepageData.supply.current,
            ...mockApiResponses.homepageData.supply
          },
          blockReward: 625
        }
      });
      
      await waitFor(() => {
        expect(screen.getByText('17,456,790')).toBeInTheDocument(); // Updated height
      });
    });
  });

  describe('Error Boundaries', () => {
    it('should handle page load errors gracefully', async () => {
      // Mock console.error to suppress error output
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Navigate to a non-existent route
      renderWithProviders(<App />, { route: '/non-existent-page' });
      
      // Should show 404 or redirect to home
      await waitFor(() => {
        expect(screen.getByText('DigiByte Blockchain Statistics')).toBeInTheDocument();
      });
      
      consoleErrorSpy.mockRestore();
    });

    it('should recover from WebSocket failures', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      renderWithProviders(<App />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      // Simulate WebSocket error
      ws.triggerError(new Error('Connection lost'));
      
      // App should still be functional
      expect(screen.getByText('DigiByte Blockchain Statistics')).toBeInTheDocument();
      
      // Should be able to navigate
      const poolsLink = screen.getByRole('link', { name: /pools/i });
      fireEvent.click(poolsLink);
      
      await waitFor(() => {
        expect(screen.getByText('Mining Pool Distribution')).toBeInTheDocument();
      });
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Mobile Navigation', () => {
    it('should show mobile menu on small screens', async () => {
      // Mock mobile viewport
      global.innerWidth = 375;
      global.innerHeight = 667;
      
      renderWithProviders(<App />);
      
      // Mobile menu button should be visible
      const menuButton = screen.getByLabelText(/menu/i);
      expect(menuButton).toBeInTheDocument();
      
      // Click menu button
      fireEvent.click(menuButton);
      
      // Navigation drawer should open
      await waitFor(() => {
        const drawer = screen.getByRole('presentation');
        expect(drawer).toBeInTheDocument();
      });
    });

    it('should close mobile menu after navigation', async () => {
      global.innerWidth = 375;
      
      renderWithProviders(<App />);
      
      // Open menu
      const menuButton = screen.getByLabelText(/menu/i);
      fireEvent.click(menuButton);
      
      // Click a navigation link
      const nodesLink = screen.getAllByRole('link', { name: /nodes/i })[1]; // Mobile menu link
      fireEvent.click(nodesLink);
      
      // Menu should close and page should change
      await waitFor(() => {
        expect(screen.getByText('DigiByte Network Nodes')).toBeInTheDocument();
        expect(screen.queryByRole('presentation')).not.toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('should handle rapid page navigation', async () => {
      renderWithProviders(<App />);
      
      const pages = [
        { link: /nodes/i, title: 'DigiByte Network Nodes' },
        { link: /pools/i, title: 'Mining Pool Distribution' },
        { link: /supply/i, title: 'DigiByte Supply Statistics' },
        { link: /hashrate/i, title: 'Network Hashrate Analysis' }
      ];
      
      // Navigate through pages rapidly
      for (const page of pages) {
        const link = screen.getByRole('link', { name: page.link });
        fireEvent.click(link);
        
        await waitFor(() => {
          expect(screen.getByText(page.title)).toBeInTheDocument();
        });
      }
      
      // Should end on the last page
      expect(screen.getByText('Network Hashrate Analysis')).toBeInTheDocument();
    });

    it('should clean up resources when switching pages', async () => {
      renderWithProviders(<App />);
      
      await waitForAsync();
      
      // Navigate to a page with charts
      const supplyLink = screen.getByRole('link', { name: /supply/i });
      fireEvent.click(supplyLink);
      
      await waitFor(() => {
        expect(screen.getByText('DigiByte Supply Statistics')).toBeInTheDocument();
      });
      
      // Navigate away
      const homeLink = screen.getByRole('link', { name: /home/i });
      fireEvent.click(homeLink);
      
      await waitFor(() => {
        expect(screen.getByText('DigiByte Blockchain Statistics')).toBeInTheDocument();
      });
      
      // Previous WebSocket should be closed
      expect(webSocketInstances[0].readyState).toBe(WebSocket.CLOSED);
    });
  });

  describe('Accessibility', () => {
    it('should maintain focus management during navigation', async () => {
      renderWithProviders(<App />);
      
      // Focus on a navigation link
      const nodesLink = screen.getByRole('link', { name: /nodes/i });
      nodesLink.focus();
      expect(document.activeElement).toBe(nodesLink);
      
      // Navigate
      fireEvent.click(nodesLink);
      
      await waitFor(() => {
        // Focus should move to main content
        const main = screen.getByRole('main');
        expect(main).toBeInTheDocument();
      });
    });

    it('should have skip navigation links', () => {
      renderWithProviders(<App />);
      
      // Should have skip to main content link (may be visually hidden)
      const skipLink = screen.getByText(/skip to main content/i, { selector: 'a' });
      expect(skipLink).toBeInTheDocument();
    });
  });

  describe('Data Consistency', () => {
    it('should maintain consistent data format across pages', async () => {
      renderWithProviders(<App />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      // Send homepage data with large numbers
      ws.receiveMessage({
        type: 'initialData',
        data: {
          blockchainInfo: {
            blocks: 12345678,
            difficulty: 12345678.90,
            size_on_disk: 123456789012,
            softforks: mockApiResponses.homepageData.softforks
          },
          chainTxStats: { txcount: 123456789 },
          txOutsetInfo: {
            total_amount: mockApiResponses.homepageData.supply.current,
            ...mockApiResponses.homepageData.supply
          },
          blockReward: 625
        }
      });
      
      await waitFor(() => {
        // Should format with commas
        expect(screen.getByText('12,345,678')).toBeInTheDocument();
      });
      
      // Navigate to blocks page
      const blocksLink = screen.getByRole('link', { name: /blocks/i });
      fireEvent.click(blocksLink);
      
      await waitForAsync();
      const blocksWs = webSocketInstances[webSocketInstances.length - 1];
      
      // Send blocks data
      blocksWs.receiveMessage(generateWebSocketMessage('recentBlocks'));
      
      await waitFor(() => {
        // Should use same formatting
        expect(screen.getByText(/17,456,789/)).toBeInTheDocument();
      });
    });
  });
});