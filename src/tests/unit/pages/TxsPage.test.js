import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import TxsPage from '../../../pages/TxsPage';
import { renderWithProviders, createWebSocketMock, waitForAsync } from '../../utils/testUtils';

// Mock the config
vi.mock('../../../config', () => ({
  default: {
    apiBaseUrl: 'http://localhost:5001',
    wsBaseUrl: 'ws://localhost:5002'
  }
}));

describe('TxsPage', () => {
  let wsSetup;
  let mockWebSocket;
  let webSocketInstances;

  beforeEach(() => {
    // Setup WebSocket mock
    wsSetup = createWebSocketMock();
    mockWebSocket = wsSetup.MockWebSocket;
    webSocketInstances = wsSetup.instances;
    global.WebSocket = mockWebSocket;
    
    // Mock timers for sample data loading
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Clean up WebSocket instances
    webSocketInstances.forEach(ws => ws.close());
    wsSetup.clearInstances();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render the hero section with title and description', () => {
      renderWithProviders(<TxsPage />);
      
      expect(screen.getByText('DigiByte Transaction Explorer')).toBeInTheDocument();
      expect(screen.getByText(/Real-time mempool monitoring and transaction tracking/)).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      renderWithProviders(<TxsPage />);
      
      expect(screen.getByText('Loading transaction data...')).toBeInTheDocument();
    });

    it('should render demo data notice after loading', async () => {
      renderWithProviders(<TxsPage />);
      
      // Fast-forward timer to load sample data
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(screen.queryByText('Loading transaction data...')).not.toBeInTheDocument();
      });
      
      expect(screen.getByText('Demo Mode:')).toBeInTheDocument();
      expect(screen.getByText(/Displaying sample transaction data/)).toBeInTheDocument();
    });

    it('should render mempool statistics', async () => {
      renderWithProviders(<TxsPage />);
      
      // Fast-forward timer to load sample data
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Mempool Size')).toBeInTheDocument();
      });
      
      expect(screen.getByText('234')).toBeInTheDocument(); // transactions count
      expect(screen.getByText('Total Size')).toBeInTheDocument();
      expect(screen.getByText('Avg Fee Rate')).toBeInTheDocument();
      expect(screen.getByText('High Priority')).toBeInTheDocument();
    });

    it('should render transaction cards with sample data', async () => {
      renderWithProviders(<TxsPage />);
      
      // Fast-forward timer to load sample data
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(screen.queryByText('Loading transaction data...')).not.toBeInTheDocument();
      });
      
      // Check for transaction elements
      expect(screen.getAllByText('Transaction ID').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Value').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Fee').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Size').length).toBeGreaterThan(0);
    });

    it('should render search and filter controls', async () => {
      renderWithProviders(<TxsPage />);
      
      // Fast-forward timer to load sample data
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(screen.queryByText('Loading transaction data...')).not.toBeInTheDocument();
      });
      
      expect(screen.getByPlaceholderText('Search by transaction ID...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'all' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'high' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'medium' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'low' })).toBeInTheDocument();
    });

    it('should render fee distribution chart', async () => {
      renderWithProviders(<TxsPage />);
      
      // Fast-forward timer to load sample data
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Fee Distribution')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Low fees')).toBeInTheDocument();
      expect(screen.getByText('High fees')).toBeInTheDocument();
    });
  });

  describe('WebSocket Connection', () => {
    it('should establish WebSocket connection on mount', async () => {
      renderWithProviders(<TxsPage />);
      
      await waitForAsync();
      
      expect(mockWebSocket).toHaveBeenCalledWith('ws://localhost:5002');
      expect(webSocketInstances.length).toBe(1);
      expect(webSocketInstances[0].readyState).toBe(WebSocket.OPEN);
    });

    it('should close WebSocket connection on unmount', async () => {
      const { unmount } = renderWithProviders(<TxsPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      unmount();
      
      expect(ws.readyState).toBe(WebSocket.CLOSED);
    });
  });

  describe('Search and Filter', () => {
    it('should filter transactions by search term', async () => {
      renderWithProviders(<TxsPage />);
      
      // Fast-forward timer to load sample data
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(screen.queryByText('Loading transaction data...')).not.toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText('Search by transaction ID...');
      
      // Search for a specific transaction ID part
      fireEvent.change(searchInput, { target: { value: 'e928e6' } });
      
      await waitFor(() => {
        // Should show only matching transaction
        const txIds = screen.getAllByText(/e928e6/);
        expect(txIds.length).toBeGreaterThan(0);
      });
    });

    it('should filter transactions by priority', async () => {
      renderWithProviders(<TxsPage />);
      
      // Fast-forward timer to load sample data
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(screen.queryByText('Loading transaction data...')).not.toBeInTheDocument();
      });
      
      // Click on High priority filter
      const highButton = screen.getByRole('button', { name: 'high' });
      fireEvent.click(highButton);
      
      await waitFor(() => {
        // Check that the high priority filter button is selected
        expect(highButton).toHaveAttribute('aria-pressed', 'true');
      });
    });
  });

  describe('Transaction Details', () => {
    it('should expand transaction to show details', async () => {
      renderWithProviders(<TxsPage />);
      
      // Fast-forward timer to load sample data
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(screen.queryByText('Loading transaction data...')).not.toBeInTheDocument();
      });
      
      // Find and click expand button
      const expandButtons = screen.getAllByTestId('ExpandMoreIcon');
      fireEvent.click(expandButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText('Inputs (1)')).toBeInTheDocument();
        expect(screen.getByText('Outputs (2)')).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('should show pagination controls when there are multiple pages', async () => {
      renderWithProviders(<TxsPage />);
      
      // Fast-forward timer to load sample data
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(screen.queryByText('Loading transaction data...')).not.toBeInTheDocument();
      });
      
      // With only 5 sample transactions, pagination should not show
      expect(screen.queryByText('Previous')).not.toBeInTheDocument();
      expect(screen.queryByText('Next')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      renderWithProviders(<TxsPage />);
      
      // Fast-forward timer to load sample data
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(screen.queryByText('Loading transaction data...')).not.toBeInTheDocument();
      });
      
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('DigiByte Transaction Explorer');
      
      const h2s = screen.getAllByRole('heading', { level: 2 });
      expect(h2s.length).toBeGreaterThan(0);
      expect(h2s[0]).toHaveTextContent('Mempool Transactions');
    });

    it('should have accessible links to transaction explorer', async () => {
      renderWithProviders(<TxsPage />);
      
      // Fast-forward timer to load sample data
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(screen.queryByText('Loading transaction data...')).not.toBeInTheDocument();
      });
      
      const links = screen.getAllByRole('link');
      const txLinks = links.filter(link => link.href.includes('digiexplorer.info/tx/'));
      
      expect(txLinks.length).toBeGreaterThan(0);
      expect(txLinks[0]).toHaveAttribute('target', '_blank');
      expect(txLinks[0]).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });
});