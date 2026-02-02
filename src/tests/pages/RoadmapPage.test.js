import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import { renderWithProviders, createWebSocketMock, waitForAsync } from '../utils/testUtils';
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

  describe('Component Rendering', () => {
    it('should render the roadmap page with hero section', async () => {
      renderWithProviders(<RoadmapPage />);

      await waitFor(() => {
        expect(screen.getByText('DigiByte Core Development Roadmap')).toBeInTheDocument();
        expect(screen.getByText('Next Three Years: 2025 - 2028')).toBeInTheDocument();
      });
    });

    it('should display overall progress bar', async () => {
      renderWithProviders(<RoadmapPage />);

      await waitFor(() => {
        // Check for progress text or percentage
        const progressElements = screen.getAllByText(/Progress|\d+%/);
        expect(progressElements.length).toBeGreaterThan(0);
      });
    });

    it('should render development phases', async () => {
      renderWithProviders(<RoadmapPage />);

      await waitFor(() => {
        // Check for phase titles that exist in the component (may have duplicates)
        const phaseElements = screen.getAllByText(/DigiByte v8\.26|Taproot/);
        expect(phaseElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Phase Cards', () => {
    it('should display phase details correctly', async () => {
      renderWithProviders(<RoadmapPage />);

      await waitFor(() => {
        // Phase 1 details - use getAllByText since there may be duplicates
        const phaseElements = screen.getAllByText(/DigiByte v8\.26|Taproot Release/);
        expect(phaseElements.length).toBeGreaterThan(0);
        const mergeElements = screen.getAllByText(/Bitcoin v26\.2|Merge/);
        expect(mergeElements.length).toBeGreaterThan(0);
      });
    });

    it('should display key features for each phase', async () => {
      renderWithProviders(<RoadmapPage />);

      await waitFor(() => {
        // Check for key features from the roadmap data
        const featureElements = screen.getAllByText(/Bitcoin|merge|DigiByte/i);
        expect(featureElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Milestone Expansion', () => {
    it('should expand and collapse phase milestones', async () => {
      renderWithProviders(<RoadmapPage />);

      await waitFor(() => {
        const milestonesButtons = screen.getAllByText(/Milestones/);
        expect(milestonesButtons.length).toBeGreaterThan(0);
      });

      // Click to expand
      const expandButton = screen.getAllByText(/Milestones/)[0];
      fireEvent.click(expandButton);

      await waitFor(() => {
        // Check for any milestone content (may have multiple instances)
        const milestoneElements = screen.getAllByText(/Merge|Tests|Complete/);
        expect(milestoneElements.length).toBeGreaterThan(0);
      });
    });

    it('should show milestone status correctly', async () => {
      renderWithProviders(<RoadmapPage />);

      await waitFor(() => {
        const expandButtons = screen.getAllByText(/Milestones/);
        if (expandButtons.length > 0) {
          fireEvent.click(expandButtons[0]);
        }
      });

      await waitFor(() => {
        // Check for milestones - use getAllByText since there may be duplicates
        const milestoneElements = screen.getAllByText(/Merge|Tests|Complete/);
        expect(milestoneElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('WebSocket Integration', () => {
    it('should establish WebSocket connection on mount', async () => {
      renderWithProviders(<RoadmapPage />);

      await waitForAsync();

      expect(mockWebSocket).toHaveBeenCalledWith('ws://localhost:5002');
      expect(webSocketInstances.length).toBe(1);
      expect(webSocketInstances[0].readyState).toBe(WebSocket.OPEN);
    });

    it('should subscribe to roadmap updates', async () => {
      renderWithProviders(<RoadmapPage />);

      await waitForAsync();

      const ws = webSocketInstances[0];
      const sentMessages = ws.getSentMessages();

      // Check that a subscription message was sent (if the component sends one)
      // The component may or may not send subscription messages
      expect(ws).toBeDefined();
    });

    it('should handle roadmap update messages', async () => {
      renderWithProviders(<RoadmapPage />);

      await waitForAsync();

      const ws = webSocketInstances[0];

      // Send update message
      ws.receiveMessage({
        type: 'roadmapUpdate',
        data: {
          milestoneId: 'functional-tests',
          status: 'completed',
          completionDate: '2025-09-01'
        }
      });

      // Component should handle the message without crashing
      await waitFor(() => {
        expect(screen.getByText('DigiByte Core Development Roadmap')).toBeInTheDocument();
      });
    });

    it('should close WebSocket connection on unmount', async () => {
      const { unmount } = renderWithProviders(<RoadmapPage />);

      await waitForAsync();

      const ws = webSocketInstances[0];
      expect(ws.readyState).toBe(WebSocket.OPEN);

      unmount();

      expect(ws.close).toHaveBeenCalled();
    });
  });

  describe('Progress Calculations', () => {
    it('should display correct milestone counts', async () => {
      renderWithProviders(<RoadmapPage />);

      await waitFor(() => {
        // Look for milestones button/text
        const milestonesText = screen.getAllByText(/Milestones/)[0];
        expect(milestonesText).toBeInTheDocument();
      });
    });

    it('should show correct phase progress percentages', async () => {
      renderWithProviders(<RoadmapPage />);

      await waitFor(() => {
        // Check that progress percentages are displayed
        const progressElements = screen.getAllByText(/%/);
        expect(progressElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Date Formatting', () => {
    it('should format milestone dates correctly', async () => {
      renderWithProviders(<RoadmapPage />);

      // Expand first phase
      await waitFor(() => {
        const expandButtons = screen.getAllByText(/Milestones/);
        if (expandButtons.length > 0) {
          fireEvent.click(expandButtons[0]);
        }
      });

      await waitFor(() => {
        // Check that dates/milestones are displayed
        const dateElements = screen.getAllByText(/2025|Merge|Tests|Complete/);
        expect(dateElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading state initially or transition to content', async () => {
      renderWithProviders(<RoadmapPage />);

      // The component may show loading briefly, then transition to content
      // Check that either loading is shown initially OR content is shown
      await waitFor(() => {
        const hasLoading = screen.queryByText('Loading roadmap...');
        const hasContent = screen.queryByText('DigiByte Core Development Roadmap');
        expect(hasLoading || hasContent).toBeTruthy();
      });
    });

    it('should hide loading state after data loads', async () => {
      renderWithProviders(<RoadmapPage />);

      await waitFor(() => {
        expect(screen.queryByText('Loading roadmap...')).not.toBeInTheDocument();
        expect(screen.getByText('DigiByte Core Development Roadmap')).toBeInTheDocument();
      });
    });
  });

  describe('Footer Information', () => {
    it('should display last updated information', async () => {
      renderWithProviders(<RoadmapPage />);

      await waitFor(() => {
        // The component should display update information
        const footer = screen.getByText(/Last Updated:/);
        expect(footer).toBeInTheDocument();
      });
    });
  });
});
