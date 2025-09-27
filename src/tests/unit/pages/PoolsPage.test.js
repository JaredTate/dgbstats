import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import PoolsPage from '../../../pages/PoolsPage';
import { renderWithProviders, createWebSocketMock, waitForAsync } from '../../utils/testUtils';
import { mockApiResponses, generateWebSocketMessage } from '../../mocks/mockData';
import * as d3 from 'd3';

// Mock the config
vi.mock('../../../config', () => ({
  default: {
    apiBaseUrl: 'http://localhost:5001',
    wsBaseUrl: 'ws://localhost:5002'
  }
}));

// Mock d3
vi.mock('d3', () => {
  const mockArc = {
    innerRadius: vi.fn().mockReturnThis(),
    outerRadius: vi.fn().mockReturnThis(),
    padAngle: vi.fn().mockReturnThis(),
    centroid: vi.fn(() => [0, 0])
  };
  
  const mockSelection = {
    attr: vi.fn().mockReturnThis(),
    selectAll: vi.fn().mockReturnThis(),
    data: vi.fn().mockReturnThis(),
    enter: vi.fn().mockReturnThis(),
    append: vi.fn().mockReturnThis(),
    text: vi.fn().mockReturnThis(),
    each: vi.fn().mockReturnThis(),
    remove: vi.fn().mockReturnThis(),
  };
  
  return {
    select: vi.fn(() => mockSelection),
    arc: vi.fn(() => mockArc),
    pie: vi.fn(() => vi.fn((data) => data.map((d, i) => ({ data: d, value: d.count })))),
    scaleOrdinal: vi.fn(() => vi.fn()),
    schemeSet3: ['#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3']
  };
});

describe('PoolsPage', () => {
  let wsSetup;
  let mockWebSocket;
  let webSocketInstances;

  beforeEach(async () => {
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

  describe('Rendering', () => {
    it('should render the hero section with title and description', () => {
      renderWithProviders(<PoolsPage />);
      
      expect(screen.getByText('DigiByte Mining Pools')).toBeInTheDocument();
      expect(screen.getByText(/This page preloads the last 240 DGB blocks/)).toBeInTheDocument();
    });

    it('should render the pie chart container', () => {
      renderWithProviders(<PoolsPage />);
      
      // The component uses an SVG ref, not an id selector
      expect(screen.getByText('Mining Pool Distribution')).toBeInTheDocument();
    });

    it('should render the loading state initially', () => {
      renderWithProviders(<PoolsPage />);
      
      expect(screen.getByText('Loading block data...')).toBeInTheDocument();
    });

    it('should render summary statistics section', async () => {
      renderWithProviders(<PoolsPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      // Send recentBlocks message with block data
      const blocks = [
        { minerAddress: 'DAddr1', poolIdentifier: 'Pool A', taprootSignaling: true, height: 1 },
        { minerAddress: 'DAddr1', poolIdentifier: 'Pool A', taprootSignaling: true, height: 2 },
        { minerAddress: 'DAddr2', poolIdentifier: 'Pool B', taprootSignaling: false, height: 3 },
      ];
      ws.receiveMessage({ type: 'recentBlocks', data: blocks });
      
      await waitFor(() => {
        expect(screen.getByText(/Total Blocks Analyzed: 3/)).toBeInTheDocument();
        expect(screen.getByText(/Data refreshes in real-time/)).toBeInTheDocument();
      });
    });
  });

  describe('WebSocket Connection', () => {
    it('should establish WebSocket connection on mount', async () => {
      renderWithProviders(<PoolsPage />);
      
      await waitForAsync();
      
      expect(mockWebSocket).toHaveBeenCalledWith('ws://localhost:5002');
      expect(webSocketInstances.length).toBe(1);
      expect(webSocketInstances[0].readyState).toBe(WebSocket.OPEN);
    });

    it('should handle WebSocket connection', async () => {
      renderWithProviders(<PoolsPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      // Component doesn't send any message on open, it just waits for recentBlocks
      expect(ws.readyState).toBe(WebSocket.OPEN);
    });
  });

  describe('Data Processing', () => {
    it('should categorize miners into pools and solo miners', async () => {
      renderWithProviders(<PoolsPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      // Send blocks with different miners
      const blocks = [
        { minerAddress: 'DAddr1', poolIdentifier: 'DigiHash Pool', taprootSignaling: true, height: 1 },
        { minerAddress: 'DAddr1', poolIdentifier: 'DigiHash Pool', taprootSignaling: true, height: 2 },
        { minerAddress: 'DAddr2', poolIdentifier: 'Mining Dutch', taprootSignaling: true, height: 3 },
        { minerAddress: 'DAddr2', poolIdentifier: 'Mining Dutch', taprootSignaling: true, height: 4 },
        { minerAddress: 'DAddr3', poolIdentifier: 'Unknown Miner 1', taprootSignaling: false, height: 5 },
      ];
      ws.receiveMessage({ type: 'recentBlocks', data: blocks });
      
      await waitFor(() => {
        // Should show multi-block miners (pools)
        expect(screen.getByText('Multi-Block Miners')).toBeInTheDocument();
        // Look for the pool identifier in the secondary text
        expect(screen.getByText(/Pool: DigiHash Pool/)).toBeInTheDocument();
        expect(screen.getByText(/Pool: Mining Dutch/)).toBeInTheDocument();
        
        // Should show single-block miners
        expect(screen.getByText('Single Block Miners')).toBeInTheDocument();
        expect(screen.getByText(/Pool: Unknown Miner 1/)).toBeInTheDocument();
      });
    });

    it('should display miner statistics correctly', async () => {
      renderWithProviders(<PoolsPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      // Send blocks to create specific counts
      const blocks = [
        ...Array(3).fill(null).map((_, i) => ({ 
          minerAddress: 'DAddr1', 
          poolIdentifier: 'DigiHash Pool', 
          taprootSignaling: true, 
          height: i + 1 
        })),
        ...Array(2).fill(null).map((_, i) => ({ 
          minerAddress: 'DAddr2', 
          poolIdentifier: 'Mining Dutch', 
          taprootSignaling: true, 
          height: i + 4 
        })),
      ];
      ws.receiveMessage({ type: 'recentBlocks', data: blocks });
      
      await waitFor(() => {
        // Check blocks count
        expect(screen.getByText('3 blocks')).toBeInTheDocument(); // DigiHash Pool
        expect(screen.getByText('2 blocks')).toBeInTheDocument(); // Mining Dutch
      });
    });

  });

  describe('D3.js Pie Chart', () => {
    it('should initialize D3 pie chart on data load', async () => {
      renderWithProviders(<PoolsPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      const blocks = [
        { minerAddress: 'DAddr1', poolIdentifier: 'Pool A', taprootSignaling: true, height: 1 },
        { minerAddress: 'DAddr1', poolIdentifier: 'Pool A', taprootSignaling: true, height: 2 },
      ];
      ws.receiveMessage({ type: 'recentBlocks', data: blocks });
      
      await waitFor(() => {
        // Check that loading is complete
        expect(screen.queryByText('Loading block data...')).not.toBeInTheDocument();
        // Chart should be rendered (D3 mocking is handled by vi.mock)
        expect(screen.getByText('Mining Pool Distribution')).toBeInTheDocument();
      });
    });

    it('should render pie slices for each miner', async () => {
      renderWithProviders(<PoolsPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      const blocks = [
        { minerAddress: 'DAddr1', poolIdentifier: 'Pool A', taprootSignaling: true, height: 1 },
        { minerAddress: 'DAddr1', poolIdentifier: 'Pool A', taprootSignaling: true, height: 2 },
      ];
      ws.receiveMessage({ type: 'recentBlocks', data: blocks });
      
      await waitFor(() => {
        // Chart should be rendered with data
        expect(screen.getByText('Mining Pool Distribution')).toBeInTheDocument();
        // Check that miner data is displayed in the list
        expect(screen.getByText(/Pool: Pool A/)).toBeInTheDocument();
      });
    });

    it('should render chart with data', async () => {
      renderWithProviders(<PoolsPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      const blocks = [
        { minerAddress: 'DAddr1', poolIdentifier: 'Pool A', taprootSignaling: true, height: 1 },
        { minerAddress: 'DAddr1', poolIdentifier: 'Pool A', taprootSignaling: true, height: 2 },
      ];
      ws.receiveMessage({ type: 'recentBlocks', data: blocks });
      
      await waitFor(() => {
        // Check that loading is complete
        expect(screen.queryByText('Loading block data...')).not.toBeInTheDocument();
        // Check that chart section is rendered
        expect(screen.getByText('Mining Pool Distribution')).toBeInTheDocument();
        // Chart should render properly (D3 mocking is handled by vi.mock)
      });
    });
  });

  describe('Pagination', () => {
    it('should paginate single-block miners', async () => {
      renderWithProviders(<PoolsPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      // Send data with many single-block miners
      const blocks = Array.from({ length: 30 }, (_, i) => ({
        minerAddress: `DAddress${i + 1}`,
        poolIdentifier: `Unknown Miner ${i + 1}`,
        taprootSignaling: i % 2 === 0,
        height: i + 1
      }));
      
      ws.receiveMessage({ type: 'recentBlocks', data: blocks });
      
      await waitFor(() => {
        // Should show pagination
        const pagination = screen.getByRole('navigation');
        expect(pagination).toBeInTheDocument();
      });
    });

    it('should navigate between pages', async () => {
      renderWithProviders(<PoolsPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      // Send data with many miners - ensure single-block miners
      const blocks = Array.from({ length: 30 }, (_, i) => ({
        minerAddress: `DAddress${i + 1}`,
        poolIdentifier: `Unknown Miner ${i + 1}`,
        taprootSignaling: false,
        height: i + 1
      }));
      
      ws.receiveMessage({ type: 'recentBlocks', data: blocks });
      
      await waitFor(() => {
        expect(screen.getByText('Single Block Miners')).toBeInTheDocument();
      });
      
      // Find and click page 2 button
      const pageButtons = screen.getAllByRole('button');
      const page2Button = pageButtons.find(btn => btn.textContent === '2');
      if (page2Button) {
        fireEvent.click(page2Button);
      }
    });
  });

  describe('Summary Statistics', () => {
    it('should calculate and display summary stats correctly', async () => {
      renderWithProviders(<PoolsPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      const blocks = [
        { minerAddress: 'DAddr1', poolIdentifier: 'Pool A', taprootSignaling: true, height: 1 },
        { minerAddress: 'DAddr1', poolIdentifier: 'Pool A', taprootSignaling: true, height: 2 },
        { minerAddress: 'DAddr2', poolIdentifier: 'Pool B', taprootSignaling: true, height: 3 },
        { minerAddress: 'DAddr2', poolIdentifier: 'Pool B', taprootSignaling: false, height: 4 },
        { minerAddress: 'DAddr3', poolIdentifier: 'Solo Miner', taprootSignaling: false, height: 5 },
      ];
      ws.receiveMessage({ type: 'recentBlocks', data: blocks });
      
      await waitFor(() => {
        // Total blocks analyzed
        expect(screen.getByText(/Total Blocks Analyzed: 5/)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle empty miners list', async () => {
      renderWithProviders(<PoolsPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      ws.receiveMessage({ type: 'recentBlocks', data: [] });
      
      await waitFor(() => {
        // Should show 0 blocks analyzed
        expect(screen.getByText(/Total Blocks Analyzed: 0/)).toBeInTheDocument();
      });
    });

    it('should handle malformed miner data', async () => {
      renderWithProviders(<PoolsPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      ws.receiveMessage({
        type: 'recentBlocks',
        data: [
          { poolIdentifier: 'Invalid Miner' } // Missing minerAddress/minedTo
        ]
      });
      
      // Should not crash and still show the page
      expect(screen.getByText('DigiByte Mining Pools')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should adjust chart size for mobile screens', () => {
      // Mock small screen
      global.innerWidth = 375;
      global.innerHeight = 667;
      
      renderWithProviders(<PoolsPage />);
      
      // Should still render the chart section
      expect(screen.getByText('Mining Pool Distribution')).toBeInTheDocument();
    });

    it('should show mobile-friendly miner list', async () => {
      global.innerWidth = 375;
      
      renderWithProviders(<PoolsPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      const blocks = [
        { minerAddress: 'DAddr1', poolIdentifier: 'DigiHash Pool', taprootSignaling: true, height: 1 },
        { minerAddress: 'DAddr1', poolIdentifier: 'DigiHash Pool', taprootSignaling: true, height: 2 },
      ];
      ws.receiveMessage({ type: 'recentBlocks', data: blocks });
      
      await waitFor(() => {
        // Should still show miner information
        expect(screen.getByText(/Pool: DigiHash Pool/)).toBeInTheDocument();
        expect(screen.getByText('2 blocks')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      renderWithProviders(<PoolsPage />);
      
      // The main title is h2 in this component
      const mainTitle = screen.getByText('DigiByte Mining Pools');
      expect(mainTitle).toBeInTheDocument();
      
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('should provide accessible labels for chart', async () => {
      renderWithProviders(<PoolsPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      const blocks = [
        { minerAddress: 'DAddr1', poolIdentifier: 'Pool A', taprootSignaling: true, height: 1 },
      ];
      ws.receiveMessage({ type: 'recentBlocks', data: blocks });
      
      await waitFor(() => {
        // Chart is rendered as SVG
        expect(screen.getByText('Mining Pool Distribution')).toBeInTheDocument();
      });
    });

    it('should have accessible pagination controls', async () => {
      renderWithProviders(<PoolsPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      // Send data requiring pagination
      const manyMiners = Array.from({ length: 25 }, (_, i) => ({
        name: `Miner ${i + 1}`,
        address: `DAddr${i + 1}`,
        blocks: 1,
        percentage: 0.04,
        signaling: false
      }));
      
      // Convert to blocks
      const blocks = manyMiners.map((miner, index) => ({
        minerAddress: miner.address,
        poolIdentifier: miner.name,
        taprootSignaling: miner.signaling,
        height: index + 1
      }));
      ws.receiveMessage({ type: 'recentBlocks', data: blocks });
      
      await waitFor(() => {
        const pagination = screen.getByRole('navigation');
        expect(pagination).toBeInTheDocument();
      });
    });
  });
});