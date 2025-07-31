import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, createWebSocketMock } from '../utils/testUtils';
import RoadmapPage from '../../pages/RoadmapPage';

// Mock date-fns to return consistent dates
vi.mock('date-fns', () => ({
  format: vi.fn((date, formatStr) => {
    const d = new Date(date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  })
}));

describe('RoadmapPage', () => {
  let mockWebSocket;
  let ws;

  beforeEach(() => {
    const { MockWebSocket, instances } = createWebSocketMock();
    mockWebSocket = MockWebSocket;
    global.WebSocket = mockWebSocket;
    
    // Clear instances before each test
    instances.length = 0;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the roadmap page with hero section', async () => {
      renderWithProviders(<RoadmapPage />);
      
      await waitFor(() => {
        expect(screen.getByText('DigiByte Development Roadmap')).toBeInTheDocument();
        expect(screen.getByText('2025 - 2035 Vision')).toBeInTheDocument();
      });
      
      const description = screen.getByText(/Track the evolution of DigiByte/i);
      expect(description).toBeInTheDocument();
    });

    it('should display overall progress bar', async () => {
      renderWithProviders(<RoadmapPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Overall Progress')).toBeInTheDocument();
        expect(screen.getByText('15%')).toBeInTheDocument();
        expect(screen.getByText('Current Status: v8.26 Core Upgrade In Progress')).toBeInTheDocument();
      });
    });

    it('should render all four development phases', async () => {
      renderWithProviders(<RoadmapPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Core Infrastructure Upgrade')).toBeInTheDocument();
        expect(screen.getByText('DigiDollar Implementation')).toBeInTheDocument();
        expect(screen.getByText('DigiDollar Ecosystem Development')).toBeInTheDocument();
        expect(screen.getByText('Advanced Features & Scaling')).toBeInTheDocument();
      });
    });
  });

  describe('Phase Cards', () => {
    it('should display phase details correctly', async () => {
      renderWithProviders(<RoadmapPage />);
      
      await waitFor(() => {
        // Phase 1 details
        const phase1Card = screen.getByText('Core Infrastructure Upgrade').closest('.MuiCard-root');
        expect(phase1Card).toBeInTheDocument();
        expect(screen.getByText('DigiByte v8.26')).toBeInTheDocument();
        expect(screen.getByText('Q3 2025 - Q1 2026')).toBeInTheDocument();
        expect(screen.getByText('65%')).toBeInTheDocument();
      });
    });

    it('should show correct status indicators', async () => {
      renderWithProviders(<RoadmapPage />);
      
      await waitFor(() => {
        // Check for status chips
        const statusChips = screen.getAllByText(/IN PROGRESS|PENDING/);
        expect(statusChips.length).toBeGreaterThan(0);
      });
    });

    it('should display key features for each phase', async () => {
      renderWithProviders(<RoadmapPage />);
      
      await waitFor(() => {
        // Phase 1 key features
        expect(screen.getByText(/Faster Node Synchronization/)).toBeInTheDocument();
        expect(screen.getByText(/Enhanced Security/)).toBeInTheDocument();
        expect(screen.getByText(/Modernized Features/)).toBeInTheDocument();
        expect(screen.getByText(/Performance Improvements/)).toBeInTheDocument();
      });
    });
  });

  describe('Milestone Expansion', () => {
    it('should expand and collapse phase milestones', async () => {
      renderWithProviders(<RoadmapPage />);
      
      await waitFor(() => {
        const milestonesButton = screen.getAllByText(/Milestones/)[0];
        expect(milestonesButton).toBeInTheDocument();
      });

      // Initially milestones should not be visible
      expect(screen.queryByText('Initial Merge Complete')).not.toBeInTheDocument();
      
      // Click to expand
      const expandButton = screen.getAllByText(/Milestones/)[0];
      fireEvent.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByText('Initial Merge Complete')).toBeInTheDocument();
        expect(screen.getByText('C++ Unit Tests Passing')).toBeInTheDocument();
        expect(screen.getByText('Functional Tests')).toBeInTheDocument();
      });
    });

    it('should show milestone status correctly', async () => {
      renderWithProviders(<RoadmapPage />);
      
      await waitFor(() => {
        const expandButton = screen.getAllByText(/Milestones/)[0];
        fireEvent.click(expandButton);
      });

      await waitFor(() => {
        // Check completed milestones
        const mergeComplete = screen.getByText('Initial Merge Complete');
        expect(mergeComplete).toBeInTheDocument();
        
        // Check in-progress milestones
        const functionalTests = screen.getByText('Functional Tests');
        expect(functionalTests).toBeInTheDocument();
        
        // Check pending milestones
        const multiAlgoMining = screen.getByText('Multi-Algo Test Mining');
        expect(multiAlgoMining).toBeInTheDocument();
      });
    });
  });

  describe('WebSocket Integration', () => {
    it('should establish WebSocket connection on mount', async () => {
      renderWithProviders(<RoadmapPage />);
      
      await waitFor(() => {
        const { instances } = global.WebSocket;
        expect(instances).toHaveLength(1);
        ws = instances[0];
        expect(ws.readyState).toBe(WebSocket.OPEN);
      });
    });

    it('should subscribe to roadmap updates', async () => {
      renderWithProviders(<RoadmapPage />);
      
      await waitFor(() => {
        const { instances } = global.WebSocket;
        ws = instances[0];
        
        const sentMessages = ws.getSentMessages();
        expect(sentMessages).toHaveLength(1);
        
        const subscribeMessage = JSON.parse(sentMessages[0]);
        expect(subscribeMessage.type).toBe('subscribeRoadmap');
        expect(subscribeMessage.data.clientId).toMatch(/^roadmap-\d+$/);
      });
    });

    it('should handle roadmap update messages', async () => {
      renderWithProviders(<RoadmapPage />);
      
      await waitFor(() => {
        const { instances } = global.WebSocket;
        ws = instances[0];
      });

      // Expand first phase to see milestones
      const expandButton = screen.getAllByText(/Milestones/)[0];
      fireEvent.click(expandButton);

      // Send update message
      ws.receiveMessage({
        type: 'roadmapUpdate',
        data: {
          milestoneId: 'functional-tests',
          status: 'completed',
          completionDate: '2025-09-01'
        }
      });

      await waitFor(() => {
        // Progress should update (was 65%, now should be higher)
        // Since we marked functional tests as complete, progress should increase
        const progressTexts = screen.getAllByText(/\d+%/);
        const hasUpdatedProgress = progressTexts.some(el => 
          parseInt(el.textContent) > 65
        );
        expect(hasUpdatedProgress).toBe(true);
      });
    });

    it('should close WebSocket connection on unmount', async () => {
      const { unmount } = renderWithProviders(<RoadmapPage />);
      
      await waitFor(() => {
        const { instances } = global.WebSocket;
        ws = instances[0];
        expect(ws.readyState).toBe(WebSocket.OPEN);
      });

      unmount();

      expect(ws.close).toHaveBeenCalled();
    });
  });

  describe('Timeline Visualization', () => {
    it('should render timeline on desktop', async () => {
      // Mock desktop viewport
      vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      renderWithProviders(<RoadmapPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Development Timeline')).toBeInTheDocument();
      });
    });

    it('should not render timeline on mobile', async () => {
      // Mock mobile viewport
      vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      renderWithProviders(<RoadmapPage />);
      
      await waitFor(() => {
        expect(screen.queryByText('Development Timeline')).not.toBeInTheDocument();
      });
    });
  });

  describe('Progress Calculations', () => {
    it('should display correct milestone counts', async () => {
      renderWithProviders(<RoadmapPage />);
      
      await waitFor(() => {
        // Phase 1 has 8 milestones, 2 completed
        const phase1Milestones = screen.getAllByText(/Milestones/)[0];
        expect(phase1Milestones.textContent).toMatch(/Milestones \(2\/8\)/);
      });
    });

    it('should show correct phase progress percentages', async () => {
      renderWithProviders(<RoadmapPage />);
      
      await waitFor(() => {
        // Phase 1: 65% progress
        const phase1Progress = screen.getAllByText('65%')[0];
        expect(phase1Progress).toBeInTheDocument();
        
        // Other phases: 0% progress
        const zeroProgress = screen.getAllByText('0%');
        expect(zeroProgress.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Date Formatting', () => {
    it('should format milestone dates correctly', async () => {
      renderWithProviders(<RoadmapPage />);
      
      // Expand first phase
      await waitFor(() => {
        const expandButton = screen.getAllByText(/Milestones/)[0];
        fireEvent.click(expandButton);
      });

      await waitFor(() => {
        // Check date formats
        expect(screen.getByText(/Target: Aug 2025/)).toBeInTheDocument();
        expect(screen.getByText(/Target: Sep 2025/)).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading state initially', () => {
      renderWithProviders(<RoadmapPage />);
      
      expect(screen.getByText('Loading roadmap...')).toBeInTheDocument();
    });

    it('should hide loading state after data loads', async () => {
      renderWithProviders(<RoadmapPage />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading roadmap...')).not.toBeInTheDocument();
        expect(screen.getByText('DigiByte Development Roadmap')).toBeInTheDocument();
      });
    });
  });

  describe('Footer Information', () => {
    it('should display last updated information', async () => {
      renderWithProviders(<RoadmapPage />);
      
      await waitFor(() => {
        const footer = screen.getByText(/Last Updated:/);
        expect(footer).toBeInTheDocument();
        expect(footer.textContent).toMatch(/This roadmap is subject to change/);
      });
    });
  });
});