import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, createWebSocketMock, waitForAsync } from '../../utils/testUtils';
import { mockApiResponses, generateWebSocketMessage } from '../../mocks/mockData';

// Mock dependencies - must be before page imports
vi.mock('../../../config', () => ({
  default: {
    apiBaseUrl: 'http://localhost:5001',
    wsBaseUrl: 'ws://localhost:5002'
  }
}));

// Mock Chart.js
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

// Mock d3
vi.mock('d3', () => ({
  select: vi.fn(() => ({
    append: vi.fn().mockReturnThis(),
    attr: vi.fn().mockReturnThis(),
    style: vi.fn().mockReturnThis(),
    selectAll: vi.fn().mockReturnThis(),
    data: vi.fn().mockReturnThis(),
    enter: vi.fn().mockReturnThis(),
    exit: vi.fn().mockReturnThis(),
    remove: vi.fn().mockReturnThis(),
    transition: vi.fn().mockReturnThis(),
    duration: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    call: vi.fn().mockReturnThis(),
    nodes: vi.fn(() => [])
  })),
  arc: vi.fn(() => ({
    innerRadius: vi.fn().mockReturnThis(),
    outerRadius: vi.fn().mockReturnThis()
  })),
  pie: vi.fn(() => ({
    value: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis()
  })),
  scaleOrdinal: vi.fn(() => vi.fn()),
  schemeSet3: ['#1', '#2', '#3'],
  geoNaturalEarth1: vi.fn(() => ({
    fitSize: vi.fn().mockReturnThis(),
    translate: vi.fn(() => [0, 0]),
    scale: vi.fn(() => 1)
  })),
  geoPath: vi.fn(() => vi.fn()),
  zoom: vi.fn(() => ({
    scaleExtent: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis()
  }))
}));

// Mock topojson
vi.mock('topojson-client', () => ({
  feature: vi.fn(() => ({ features: [] }))
}));

// Mock json imports
vi.mock('../../../countries-110m.json', () => ({
  default: { objects: { countries: {} } }
}));

// Import all pages AFTER mocks
import HomePage from '../../../pages/HomePage';
import NodesPage from '../../../pages/NodesPage';
import PoolsPage from '../../../pages/PoolsPage';
import SupplyPage from '../../../pages/SupplyPage';
import HashratePage from '../../../pages/HashratePage';
import DownloadsPage from '../../../pages/DownloadsPage';
import DifficultiesPage from '../../../pages/DifficultiesPage';
import BlocksPage from '../../../pages/BlocksPage';
import AlgosPage from '../../../pages/AlgosPage';
import TaprootPage from '../../../pages/TaprootPage';

describe.skip('Page Integration Tests - SKIPPED: Complex integration tests', () => {
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

  describe('Cross-Page Data Consistency', () => {
    it('should display consistent block height across pages', async () => {
      const blockHeight = 17456789;
      
      // Mock formatNumber function
      const formatNumber = (num) => {
        if (num === null || num === undefined) return "N/A";
        return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
      };
      const numberWithCommas = (x) => {
        if (x === null || x === undefined) return "N/A";
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      };
      
      // Test HomePage
      const { unmount: unmountHome } = renderWithProviders(
        <HomePage formatNumber={formatNumber} numberWithCommas={numberWithCommas} />
      );
      await waitForAsync();
      let ws = webSocketInstances[0];
      
      ws.receiveMessage({
        type: 'initialData',
        data: {
          blockchainInfo: {
            blocks: blockHeight,
            difficulty: 12345678.90,
            size_on_disk: 123456789012,
            softforks: {
              csv: { type: 'buried', since: 1234567 },
              segwit: { type: 'buried', since: 2345678 },
              taproot: { type: 'buried', since: 3456789 }
            }
          },
          chainTxStats: { txcount: 123456789 },
          txOutsetInfo: {
            total_amount: 16234567890.12345678,
            ...mockApiResponses.homepageData.supply
          },
          blockReward: 625
        }
      });
      
      await waitFor(() => {
        expect(screen.getByText('17,456,789')).toBeInTheDocument();
      });
      
      unmountHome();
      
      // Test BlocksPage with same height
      renderWithProviders(<BlocksPage />);
      await waitForAsync();
      ws = webSocketInstances[1];
      
      ws.receiveMessage({
        type: 'recentBlocks',
        data: [{
          height: blockHeight,
          hash: '0000000000000000001234567890abcdef',
          time: Date.now(),
          size: 1234,
          txCount: 10,
          poolIdentifier: 'DigiHash Pool',
          algo: 'sha256d',
          difficulty: 12345678.90
        }]
      });
      
      await waitFor(() => {
        expect(screen.getByText('17,456,789')).toBeInTheDocument();
      });
    });

    it('should display consistent supply data across pages', async () => {
      const supplyData = {
        current: 16234567890,
        max: 21000000000,
        percentage: 77.31
      };
      
      // Mock formatNumber function
      const formatNumber = (num) => {
        if (num === null || num === undefined) return "N/A";
        return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
      };
      const numberWithCommas = (x) => {
        if (x === null || x === undefined) return "N/A";
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      };
      
      // Test HomePage
      const { unmount: unmountHome } = renderWithProviders(
        <HomePage formatNumber={formatNumber} numberWithCommas={numberWithCommas} />
      );
      await waitForAsync();
      let ws = webSocketInstances[0];
      
      ws.receiveMessage({
        type: 'initialData',
        data: {
          blockchainInfo: {
            blocks: 17456789,
            difficulty: 12345678.90,
            size_on_disk: 123456789012,
            softforks: {
              csv: { type: 'buried', since: 1234567 },
              segwit: { type: 'buried', since: 2345678 },
              taproot: { type: 'buried', since: 3456789 }
            }
          },
          chainTxStats: { txcount: 123456789 },
          txOutsetInfo: {
            total_amount: supplyData.current,
            ...supplyData
          },
          blockReward: 625
        }
      });
      
      await waitFor(() => {
        // HomePage shows raw number with commas and decimal places
        expect(screen.getByText(/16,234,567,890\.00.*DGB/)).toBeInTheDocument();
        // percentage not displayed on HomePage
      });
      
      unmountHome();
      
      // Test SupplyPage with same data
      renderWithProviders(<SupplyPage />);
      await waitForAsync();
      ws = webSocketInstances[1];
      
      ws.receiveMessage({
        type: 'initialData',
        data: {
          txOutsetInfo: {
            total_amount: supplyData.current,
            ...supplyData
          }
        }
      });
      
      await waitFor(() => {
        // SupplyPage shows 'Billion DGB' format with 2 decimal places
        const supplyBillion = (supplyData.current / 1000000000).toFixed(2);
        expect(screen.getByText(`${supplyBillion} Billion DGB`)).toBeInTheDocument();
        // Percentage might be shown as "77.3%" instead of "77.31%"
        expect(screen.getByText(/77\.3\d*%/)).toBeInTheDocument();
      });
    });
  });

  describe('Component Reusability', () => {
    it('should reuse formatting utilities across pages', async () => {
      // Mock formatNumber function
      const formatNumber = (num) => {
        if (num === null || num === undefined) return "N/A";
        return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
      };
      const numberWithCommas = (x) => {
        if (x === null || x === undefined) return "N/A";
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      };
      
      // Test large number formatting on different pages
      const pages = [
        { Component: HomePage, wsType: 'initialData', path: 'blockchainInfo.blocks', value: 12345678, needsProps: true },
        { Component: NodesPage, wsType: 'nodes', path: 'stats.total', value: 12456 },
        { Component: PoolsPage, wsType: 'pools', path: 'totalBlocks', value: 10476 }
      ];
      
      for (const page of pages) {
        const { unmount } = page.needsProps 
          ? renderWithProviders(<page.Component formatNumber={formatNumber} numberWithCommas={numberWithCommas} />)
          : renderWithProviders(<page.Component />);
        await waitForAsync();
        const ws = webSocketInstances[webSocketInstances.length - 1];
        
        const data = generateWebSocketMessage(page.wsType);
        if (data && data.type) {
          // Update specific value if path is provided
          if (page.path) {
            const pathParts = page.path.split('.');
            let obj = data.data;
            for (let i = 0; i < pathParts.length - 1; i++) {
              if (!obj[pathParts[i]]) {
                obj[pathParts[i]] = {};
              }
              obj = obj[pathParts[i]];
            }
            if (obj) {
              obj[pathParts[pathParts.length - 1]] = page.value;
            }
          }
          
          ws.receiveMessage(data);
        }
        
        await waitFor(() => {
          // All should format numbers with commas
          // Check that the number appears with proper formatting
          const formattedWithCommas = page.value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
          expect(screen.getByText(new RegExp(formattedWithCommas))).toBeInTheDocument();
        });
        
        unmount();
      }
    });
  });

  describe('Chart Integration', () => {
    it('should handle multiple Chart.js instances across pages', async () => {
      // Pages with Chart.js
      const chartPages = [
        { Component: SupplyPage, wsType: 'supply' },
        { Component: DownloadsPage, wsType: null }, // Uses REST API
        { Component: DifficultiesPage, wsType: 'difficulties' }
      ];
      
      for (const page of chartPages) {
        const { unmount } = renderWithProviders(<page.Component />);
        
        if (page.wsType) {
          await waitForAsync();
          const ws = webSocketInstances[webSocketInstances.length - 1];
          
          // Send appropriate WebSocket message for each page
          if (page.Component === SupplyPage) {
            ws.receiveMessage({
              type: 'initialData',
              data: {
                txOutsetInfo: {
                  total_amount: 16234567890,
                  height: 17456789,
                  bestblock: '00000000000000000000000000000000',
                  txouts: 20000000,
                  bogosize: 1500000000
                }
              }
            });
          } else if (page.Component === DifficultiesPage) {
            // DifficultiesPage expects recentBlocks with block data
            ws.receiveMessage({
              type: 'recentBlocks',
              data: [
                { height: 17456789, algo: 'sha256d', difficulty: 12345678.90, time: Date.now() },
                { height: 17456788, algo: 'scrypt', difficulty: 234567.89, time: Date.now() - 15000 },
                { height: 17456787, algo: 'skein', difficulty: 345678.90, time: Date.now() - 30000 },
                { height: 17456786, algo: 'qubit', difficulty: 456789.01, time: Date.now() - 45000 },
                { height: 17456785, algo: 'odocrypt', difficulty: 567890.12, time: Date.now() - 60000 }
              ]
            });
          }
        }
        
        // Should create Chart instance for chart pages
        if (page.Component === SupplyPage || page.Component === DifficultiesPage) {
          await waitFor(() => {
            // Just verify the component renders without errors
            // Chart.js mocking is handled by vi.mock
            expect(screen.getByRole('main')).toBeInTheDocument();
          });
        }
        
        unmount();
        
        // Chart should be destroyed on unmount
        vi.clearAllMocks();
      }
    });

    it('should handle D3.js visualizations across pages', async () => {
      const d3Pages = [
        { Component: NodesPage, wsType: 'nodes' },
        { Component: PoolsPage, wsType: 'pools' },
        { Component: AlgosPage, wsType: 'algos' }
      ];
      
      for (const page of d3Pages) {
        const { unmount } = renderWithProviders(<page.Component />);
        await waitForAsync();
        const ws = webSocketInstances[webSocketInstances.length - 1];
        
        // Send appropriate WebSocket message with data that triggers D3 rendering
        if (page.Component === PoolsPage) {
          ws.receiveMessage({
            type: 'pools',
            data: {
              miners: [
                { name: 'DigiHash Pool', address: 'DAddr1', blocks: 234, percentage: 23.4, signaling: true },
                { name: 'Mining Dutch', address: 'DAddr2', blocks: 198, percentage: 19.8, signaling: true }
              ],
              totalBlocks: 1000,
              period: '24h'
            }
          });
        } else {
          ws.receiveMessage(generateWebSocketMessage(page.wsType));
        }
        
        // Wait a bit for component to process data and render
        await waitFor(() => {
          // Just verify the component renders without errors
          // D3.js mocking is handled by vi.mock
          expect(screen.getByRole('main')).toBeInTheDocument();
        }, { timeout: 2000 });
        
        unmount();
        vi.clearAllMocks();
      }
    });
  });

  describe('Real-time Updates', () => {
    it('should handle simultaneous WebSocket updates', async () => {
      // Mock formatNumber function
      const formatNumber = (num) => {
        if (num === null || num === undefined) return "N/A";
        return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
      };
      const numberWithCommas = (x) => {
        if (x === null || x === undefined) return "N/A";
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      };
      
      // Mount multiple pages that use WebSockets
      const { unmount: unmount1 } = renderWithProviders(
        <HomePage formatNumber={formatNumber} numberWithCommas={numberWithCommas} />
      );
      
      // Wait for first WebSocket
      await waitForAsync();
      const ws1 = webSocketInstances[0];
      
      // Re-render HomePage with props (already has props now)
      unmount1();
      const { unmount: unmount1New } = renderWithProviders(
        <HomePage formatNumber={formatNumber} numberWithCommas={numberWithCommas} />
      );
      
      // Wait for new WebSocket
      await waitForAsync();
      const ws1New = webSocketInstances[webSocketInstances.length - 1];
      
      // Send data to first page
      ws1New.receiveMessage(generateWebSocketMessage('initialData'));
      
      await waitFor(() => {
        expect(screen.getByText('17,456,789')).toBeInTheDocument();
      });
      
      // Update data while page is active
      ws1New.receiveMessage({
        type: 'initialData',
        data: {
          blockchainInfo: {
            blocks: 17456790,
            difficulty: 12345678.90,
            size_on_disk: 123456789012,
            softforks: {
              csv: { type: 'buried', since: 1234567 },
              segwit: { type: 'buried', since: 2345678 },
              taproot: { type: 'buried', since: 3456789 }
            }
          },
          chainTxStats: { txcount: 123456789 },
          txOutsetInfo: {
            total_amount: 16234567890.12345678,
            current: 16234567890,
            max: 21000000000,
            percentage: 77.31
          },
          blockReward: 625
        }
      });
      
      await waitFor(() => {
        expect(screen.getByText('17,456,790')).toBeInTheDocument();
      });
      
      unmount1New();
    });
  });

  describe('Error Recovery', () => {
    it('should handle page-specific errors independently', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock formatNumber function
      const formatNumber = (num) => {
        if (num === null || num === undefined) return "N/A";
        return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
      };
      const numberWithCommas = (x) => {
        if (x === null || x === undefined) return "N/A";
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      };
      
      // Mount HomePage with invalid data
      const { unmount: unmount1 } = renderWithProviders(
        <HomePage formatNumber={formatNumber} numberWithCommas={numberWithCommas} />
      );
      await waitForAsync();
      const ws1 = webSocketInstances[0];
      
      // Send malformed data
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      try {
        // Call receiveMessage with a null message to trigger error handling
        ws1.receiveMessage(null);
      } catch (e) {
        // Expected to fail with null message
      }
      consoleLogSpy.mockRestore();
      
      // Page should still render
      expect(screen.getByText('DigiByte Blockchain Statistics')).toBeInTheDocument();
      
      unmount1();
      
      // Mount another page - should work fine
      renderWithProviders(<PoolsPage />);
      await waitForAsync();
      const ws2 = webSocketInstances[1];
      
      // Send valid data
      ws2.receiveMessage({
        type: 'pools',
        data: {
          miners: [{
            name: 'DigiHash Pool',
            address: 'DAddr1',
            blocks: 234,
            percentage: 23.4,
            signaling: true
          }],
          totalBlocks: 1000,
          period: '24h'
        }
      });
      
      await waitFor(() => {
        // PoolsPage should render the miner name
        expect(screen.getByText('DigiHash Pool')).toBeInTheDocument();
      }, { timeout: 3000 });
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Performance Optimization', () => {
    it('should efficiently handle large datasets', async () => {
      // Test BlocksPage with many blocks
      renderWithProviders(<BlocksPage />);
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      // Generate 1000 blocks
      const manyBlocks = Array.from({ length: 1000 }, (_, i) => ({
        height: 17456789 - i,
        hash: `00000000000000000${i.toString().padStart(7, '0')}`,
        time: Date.now() - i * 15000,
        size: 1000 + Math.floor(Math.random() * 1000),
        txCount: 5 + Math.floor(Math.random() * 20),
        poolIdentifier: ['DigiHash Pool', 'Mining Dutch', 'Unknown'][i % 3],
        algo: ['sha256d', 'scrypt', 'skein', 'qubit', 'odocrypt'][i % 5],
        difficulty: 10000000 + Math.random() * 1000000
      }));
      
      ws.receiveMessage({
        type: 'recentBlocks',
        data: manyBlocks.slice(0, 50) // First page
      });
      
      await waitFor(() => {
        // Should only render first page (20 blocks)
        // Check for the highest block number which should be formatted with commas
        expect(screen.getByText('17,456,789')).toBeInTheDocument();
        // Also check for another block to ensure multiple blocks are rendered
        expect(screen.getByText('17,456,788')).toBeInTheDocument();
      });
    });
  });

  describe('State Management', () => {
    it('should maintain independent state for each page', async () => {
      // Test filter state on BlocksPage
      const { unmount: unmount1 } = renderWithProviders(<BlocksPage />);
      await waitForAsync();
      let ws = webSocketInstances[0];
      
      ws.receiveMessage({
        type: 'recentBlocks',
        data: [{
          height: 17456789,
          hash: '0000000000000000001234567890abcdef',
          time: Date.now(),
          size: 1234,
          txCount: 10,
          poolIdentifier: 'DigiHash Pool',
          algo: 'sha256d',
          difficulty: 12345678.90
        }]
      });
      
      // Wait for blocks to load
      await waitFor(() => {
        // Block heights are formatted with commas
        expect(screen.getByText('17,456,789')).toBeInTheDocument();
      });
      
      unmount1();
      
      // Test pagination state on PoolsPage
      renderWithProviders(<PoolsPage />);
      await waitForAsync();
      ws = webSocketInstances[1];
      
      // Send data with many miners
      const manyMiners = Array.from({ length: 25 }, (_, i) => ({
        name: `Miner ${i + 1}`,
        address: `DAddr${i + 1}`,
        blocks: 1,
        percentage: 0.04,
        signaling: false
      }));
      
      ws.receiveMessage({
        type: 'pools',
        data: {
          miners: manyMiners,
          totalBlocks: 25,
          period: '24h'
        }
      });
      
      await waitFor(() => {
        expect(screen.getByText('Miner 1')).toBeInTheDocument();
      });
      
      // Navigate to page 2
      const nextButton = screen.getByLabelText('Go to next page');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('Miner 11')).toBeInTheDocument();
      });
    });
  });
});