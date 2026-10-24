import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor, render, within } from '@testing-library/react';
import App from '../../App';
import { createWebSocketMock, waitForAsync } from '../utils/testUtils';
import { mockApiResponses, generateWebSocketMessage } from '../mocks/mockData';
import { getNavGroups } from '../../navigation';

// Open the page's group in the phone bottom bar and return its link.
// (jsdom renders both bars; the bottom bar keeps every page one tap away.)
async function navLink(label) {
  const bar = screen.getByRole('navigation', { name: 'Bottom navigation' });
  if (label === 'Home') return within(bar).getByRole('link', { name: 'Home' });
  const group = getNavGroups(false).find((g) => g.items.some((i) => i.label === label));
  fireEvent.click(within(bar).getByRole('button', { name: group.label }));
  const sheet = await screen.findByRole('dialog', { name: group.label });
  return within(sheet).getByRole('link', { name: new RegExp(`^${label}`) });
}

// Custom render for App component that already includes Router
function renderApp(options = {}) {
  const { route = '/' } = options;
  window.history.pushState({}, 'Test page', route);
  return render(<App />);
}

// Mock the config
vi.mock('../../config', () => ({
  default: {
    apiBaseUrl: 'http://localhost:5001',
    wsBaseUrl: 'ws://localhost:5002'
  }
}));

// Mock Material-UI's useMediaQuery for mobile tests
let isMobileView = false;

// Mock Chart.js to avoid canvas errors
vi.mock('chart.js', async () => {
  const actual = await vi.importActual('chart.js');
  const Chart = vi.fn().mockImplementation(function () { return ({
    destroy: vi.fn(),
    update: vi.fn(),
    render: vi.fn(),
    resize: vi.fn(),
    clear: vi.fn(),
    stop: vi.fn(),
    data: {},
    options: {}
  }); });
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

describe('App Integration Tests', () => {
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
    // Reset mobile mock
    isMobileView = false;
  });

  describe('Navigation', () => {
    it('should render the header and footer on all pages', () => {
      renderApp();
      
      // Header should be present
      expect(screen.getByRole('banner')).toBeInTheDocument();
      // There might be multiple logos, just check that at least one exists
      expect(screen.getAllByAltText('DigiByte Logo').length).toBeGreaterThan(0);
      
      // Footer should be present
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('should navigate between pages using header links', async () => {
      renderApp();
      
      // Should start on home page
      expect(screen.getByText('DigiByte Blockchain Statistics')).toBeInTheDocument();
      
      // Navigate to Nodes page
      const nodesLink = await navLink('Nodes');
      fireEvent.click(nodesLink);
      
      await waitFor(() => {
        expect(screen.getByText('DigiByte Blockchain Nodes')).toBeInTheDocument();
      });
      
      // Navigate to Pools page
      const poolsLink = await navLink('Mining Pools');
      fireEvent.click(poolsLink);
      
      await waitFor(() => {
        expect(screen.getByText('DigiByte Mining Pools')).toBeInTheDocument();
      });
    });

    it('should handle direct URL navigation', () => {
      renderApp({ route: '/supply' });
      
      expect(screen.getByText('DigiByte Supply Statistics')).toBeInTheDocument();
    });

    it('should maintain WebSocket connections across navigation', async () => {
      renderApp();
      
      await waitForAsync();

      // One WebSocket per page. The site-wide fork-alert banner listens to
      // the page's socket instead of opening its own (B2).
      expect(webSocketInstances.length).toBe(1);
      const pageWs = webSocketInstances[0];

      // Navigate to another page
      const nodesLink = await navLink('Nodes');
      fireEvent.click(nodesLink);

      await waitForAsync();

      // The page WebSocket should be closed after navigating away.
      expect(pageWs.readyState).toBe(WebSocket.CLOSED);

      // Exactly one new page WebSocket should be created and open.
      expect(webSocketInstances.length).toBe(2);
      const newPageWs = webSocketInstances[1];
      expect(newPageWs.readyState).toBe(WebSocket.OPEN);
    });
  });

  describe('DigiDollar Network Routes', () => {
    const routes = [
      { route: '/activation', title: 'DigiDollar Mainnet Activation', wsUrl: 'ws://localhost:5002' },
      { route: '/oracles', title: 'DigiDollar Mainnet Oracles', wsUrl: 'ws://localhost:5002' },
      { route: '/ddstats', title: 'DigiDollar Mainnet Stats', wsUrl: 'ws://localhost:5002' },
      { route: '/testnet/activation', title: 'DigiDollar Testnet Activation', wsUrl: 'ws://localhost:5003' },
      { route: '/testnet/oracles', title: 'DigiDollar Testnet Oracles', wsUrl: 'ws://localhost:5003' },
      { route: '/testnet/ddstats', title: 'DigiDollar Testnet Stats', wsUrl: 'ws://localhost:5003' }
      // Mainnet-PRE (rehearsal) routes were removed in v9.26.2; only Mainnet and Testnet remain.
    ];

    it.each(routes)('renders $route with the correct network feed', async ({ route, title, wsUrl }) => {
      renderApp({ route });

      expect(screen.getByText(title)).toBeInTheDocument();

      await waitForAsync();
      expect(webSocketInstances[0].url).toBe(wsUrl);
    });
  });

  describe('Data Flow', () => {
    it('should share theme across all pages', async () => {
      renderApp();
      
      // Check that theme is applied - look for MUI Container
      const homeContainer = document.querySelector('.MuiContainer-root');
      expect(homeContainer).toBeTruthy();
      
      // Navigate to another page
      const hashrateLink = await navLink('Hashrate');
      fireEvent.click(hashrateLink);
      
      await waitFor(() => {
        // Verify the page changed and still has theme
        expect(screen.getByText('DigiByte Hashrate By Algo')).toBeInTheDocument();
        const hashrateContainer = document.querySelector('.MuiContainer-root');
        expect(hashrateContainer).toBeTruthy();
      });
    });

    it('should update data in real-time on active page', async () => {
      renderApp();
      
      await waitForAsync();
      // The page's socket is the last one created (the banner socket mounts first).
      const ws = webSocketInstances[webSocketInstances.length - 1];

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
      renderApp({ route: '/non-existent-page' });

      // App doesn't have 404 handling, so no route matches
      // The app container should still be rendered (even if empty)
      // This is expected behavior - routes don't have a catch-all
      const appContainer = document.querySelector('[class*="app"]');
      expect(appContainer).toBeInTheDocument();

      // Navigate back to a valid page
      renderApp({ route: '/' });

      await waitFor(() => {
        expect(screen.getByText('DigiByte Blockchain Statistics')).toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });

    it('should recover from WebSocket failures', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      renderApp();
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      // Simulate WebSocket error
      ws.triggerError(new Error('Connection lost'));
      
      // App should still be functional
      expect(screen.getByText('DigiByte Blockchain Statistics')).toBeInTheDocument();
      
      // Should be able to navigate
      const poolsLink = await navLink('Mining Pools');
      fireEvent.click(poolsLink);
      
      await waitFor(() => {
        expect(screen.getByText('Mining Pool Distribution')).toBeInTheDocument();
      });
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Mobile Navigation', () => {
    it('shows a bottom tab bar with Home and the four groups', () => {
      renderApp();
      const bar = screen.getByRole('navigation', { name: 'Bottom navigation' });
      expect(within(bar).getByRole('link', { name: 'Home' })).toBeInTheDocument();
      ['Blockchain', 'Mining', 'DigiDollar', 'More'].forEach((label) =>
        expect(within(bar).getByRole('button', { name: label })).toBeInTheDocument());
    });

    it('closes the sheet after navigation and shows the new page', async () => {
      renderApp();
      fireEvent.click(await navLink('Nodes'));
      await waitFor(() => {
        expect(screen.getByText('DigiByte Blockchain Nodes')).toBeInTheDocument();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('should handle rapid page navigation', async () => {
      renderApp();
      
      const pages = [
        { link: 'Nodes', title: 'DigiByte Blockchain Nodes' },
        { link: 'Mining Pools', title: 'DigiByte Mining Pools' },
        { link: 'Supply', title: 'DigiByte Supply Statistics' },
        { link: 'Hashrate', title: 'DigiByte Hashrate By Algo' }
      ];
      
      // Navigate through pages rapidly
      for (const page of pages) {
        const link = await navLink(page.link);
        fireEvent.click(link);
        
        await waitFor(() => {
          expect(screen.getByText(page.title)).toBeInTheDocument();
        });
      }
      
      // Should end on the last page
      expect(screen.getByText('DigiByte Hashrate By Algo')).toBeInTheDocument();
    }, 90000); // four page loads through the bottom-bar sheets

    it('should clean up resources when switching pages', async () => {
      renderApp();
      
      await waitForAsync();
      
      // Navigate to a page with charts
      const supplyLink = await navLink('Supply');
      fireEvent.click(supplyLink);

      await waitFor(() => {
        expect(screen.getByText('DigiByte Supply Statistics')).toBeInTheDocument();
      });

      // Capture the supply page's socket (the last created after that navigation).
      const supplyWs = webSocketInstances[webSocketInstances.length - 1];

      // Navigate away
      const homeLink = await navLink('Home');
      fireEvent.click(homeLink);

      await waitFor(() => {
        expect(screen.getByText('DigiByte Blockchain Statistics')).toBeInTheDocument();
      });

      // The previous page's WebSocket should be closed.
      expect(supplyWs.readyState).toBe(WebSocket.CLOSED);
    });
  });

  describe('Accessibility', () => {
    it('should maintain focus management during navigation', async () => {
      renderApp();
      
      // Focus on a navigation link
      const nodesLink = await navLink('Nodes');
      nodesLink.focus();
      expect(document.activeElement).toBe(nodesLink);
      
      // Navigate
      fireEvent.click(nodesLink);
      
      await waitFor(() => {
        // Page should have changed
        expect(screen.getByText('DigiByte Blockchain Nodes')).toBeInTheDocument();
      });
    });

  });

  describe('Data Consistency', () => {
    it('should maintain consistent data format across pages', async () => {
      renderApp();
      
      await waitForAsync();
      // The page's socket is the last one created (the banner socket mounts first).
      const ws = webSocketInstances[webSocketInstances.length - 1];

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
      const blocksLink = await navLink('Blocks');
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
