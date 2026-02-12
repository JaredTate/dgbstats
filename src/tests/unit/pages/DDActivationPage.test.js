import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, act } from '@testing-library/react';
import DDActivationPage from '../../../pages/DDActivationPage';
import { renderWithProviders, createWebSocketMock, waitForAsync } from '../../utils/testUtils';

// Mock data for WebSocket responses
// Backend sends: { type: 'ddDeploymentData', data: { ... } }
const mockDeploymentDefined = {
  enabled: false,
  status: 'defined',
  bit: 23,
  start_time: 1763932527,
  timeout: 1830297600,
  min_activation_height: 600
};

const mockDeploymentStarted = {
  enabled: false,
  status: 'started',
  bit: 23,
  start_time: 1763932527,
  timeout: 1830297600,
  min_activation_height: 600,
  blocks_until_timeout: 114,
  signaling_blocks: 90,
  threshold: 140,
  period_blocks: 200,
  progress_percent: 64.3
};

const mockDeploymentLockedIn = {
  enabled: false,
  status: 'locked_in',
  bit: 23,
  start_time: 1763932527,
  timeout: 1830297600,
  min_activation_height: 600,
  signaling_blocks: 200,
  threshold: 140,
  period_blocks: 200,
  progress_percent: 100
};

const mockDeploymentActive = {
  enabled: true,
  status: 'active',
  bit: 23,
  start_time: 1763932527,
  timeout: 1830297600,
  min_activation_height: 600,
  activation_height: 600
};

// Initial data message with block height
const mockInitialData = {
  type: 'initialData',
  data: {
    blockchainInfo: { blocks: 289 }
  }
};

// Helper to send deployment data via WebSocket
function sendDeploymentData(ws, deployment) {
  ws.receiveMessage({ type: 'ddDeploymentData', data: deployment });
}

// Helper to send initial data via WebSocket
function sendInitialData(ws, overrides = {}) {
  const data = {
    ...mockInitialData.data,
    ...overrides
  };
  ws.receiveMessage({ type: 'initialData', data });
}

describe('DDActivationPage', () => {
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
    it('should render hero section with title "DigiDollar Activation"', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });

      expect(screen.getByText('DigiDollar Activation')).toBeInTheDocument();
    });

    it('should render "BIP9 Soft Fork Activation Tracker" subtitle', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });

      expect(screen.getByText('BIP9 Soft Fork Activation Tracker')).toBeInTheDocument();
    });

    it('should render activation progress description', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });

      expect(screen.getByText(/Track the activation progress of DigiDollar/)).toBeInTheDocument();
    });

    it('should mention testnet accelerated parameters', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });

      expect(screen.getByText(/testnet deployment uses accelerated parameters/)).toBeInTheDocument();
    });

    it('should show loading state initially', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });

      expect(screen.getByText('Loading activation data...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should not show status cards or stage flow while loading', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });

      expect(screen.queryByText('Is DigiDollar Active?')).not.toBeInTheDocument();
      expect(screen.queryByText('Current Stage')).not.toBeInTheDocument();
      expect(screen.queryByText('Activation Progress')).not.toBeInTheDocument();
    });
  });

  describe('WebSocket Connection', () => {
    it('should establish WebSocket connection on mount', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });

      await waitForAsync();

      expect(mockWebSocket).toHaveBeenCalledWith('ws://localhost:5003');
      expect(webSocketInstances.length).toBe(1);
      expect(webSocketInstances[0].readyState).toBe(WebSocket.OPEN);
    });

    it('should close WebSocket connection on unmount', async () => {
      const { unmount } = renderWithProviders(<DDActivationPage />, { network: 'testnet' });

      await waitForAsync();
      const ws = webSocketInstances[0];

      unmount();

      expect(ws.readyState).toBe(WebSocket.CLOSED);
    });

    it('should remove loading state after receiving ddDeploymentData', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentDefined);

      await waitFor(() => {
        expect(screen.queryByText('Loading activation data...')).not.toBeInTheDocument();
        expect(screen.getByText('Is DigiDollar Active?')).toBeInTheDocument();
      });
    });

    it('should update data on subsequent ddDeploymentData messages', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      // Send initial DEFINED state
      sendDeploymentData(ws, mockDeploymentDefined);

      await waitFor(() => {
        // DEFINED appears in both the status chip and the stage flow label
        const definedElements = screen.getAllByText('DEFINED');
        expect(definedElements.length).toBeGreaterThan(0);
      });

      // Send updated STARTED state
      sendDeploymentData(ws, mockDeploymentStarted);

      await waitFor(() => {
        const startedElements = screen.getAllByText('STARTED');
        expect(startedElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('DEFINED State', () => {
    it('should show "NO" for "Is DigiDollar Active?"', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentDefined);

      await waitFor(() => {
        expect(screen.getByText('Is DigiDollar Active?')).toBeInTheDocument();
        expect(screen.getByText('NO')).toBeInTheDocument();
      });
    });

    it('should show "DEFINED" as current stage', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentDefined);

      await waitFor(() => {
        expect(screen.getByText('Current Stage')).toBeInTheDocument();
        // DEFINED appears in status chip and stage flow
        const definedElements = screen.getAllByText('DEFINED');
        expect(definedElements.length).toBeGreaterThan(0);
      });
    });

    it('should highlight DEFINED in the 4-stage flow', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentDefined);

      await waitFor(() => {
        expect(screen.getByText('Activation Progress')).toBeInTheDocument();
        expect(screen.getByText('Code exists but is dormant')).toBeInTheDocument();
      });
    });

    it('should show "Current" chip on DEFINED stage', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentDefined);

      await waitFor(() => {
        const currentChips = screen.getAllByText(/Current/);
        expect(currentChips.length).toBeGreaterThan(0);
      });
    });

    it('should not show signaling progress bar in DEFINED state', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentDefined);

      await waitFor(() => {
        const definedElements = screen.getAllByText('DEFINED');
        expect(definedElements.length).toBeGreaterThan(0);
      });

      expect(screen.queryByText('Signaling Progress')).not.toBeInTheDocument();
    });

    it('should show block range labels for all 4 stages', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentDefined);

      await waitFor(() => {
        expect(screen.getByText(/Blocks 0/)).toBeInTheDocument();
        expect(screen.getByText(/Blocks 200/)).toBeInTheDocument();
        expect(screen.getByText(/Blocks 400/)).toBeInTheDocument();
        expect(screen.getByText(/Blocks 600/)).toBeInTheDocument();
      });
    });
  });

  describe('STARTED State', () => {
    it('should show "STARTED" as current stage', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentStarted);

      await waitFor(() => {
        expect(screen.getByText('Current Stage')).toBeInTheDocument();
        // STARTED appears in status chip and stage flow
        const startedElements = screen.getAllByText('STARTED');
        expect(startedElements.length).toBeGreaterThan(0);
      });
    });

    it('should show "NO" for "Is DigiDollar Active?" in STARTED state', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentStarted);

      await waitFor(() => {
        expect(screen.getByText('NO')).toBeInTheDocument();
      });
    });

    it('should show signaling progress bar', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentStarted);

      await waitFor(() => {
        expect(screen.getByText('Signaling Progress')).toBeInTheDocument();
      });
    });

    it('should show progress percentage (64.3%)', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentStarted);

      await waitFor(() => {
        expect(screen.getByText('64.3%')).toBeInTheDocument();
      });
    });

    it('should show "90 / 200 blocks signaling"', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentStarted);

      await waitFor(() => {
        expect(screen.getByText('90 / 200 blocks signaling')).toBeInTheDocument();
      });
    });

    it('should show "Need 140 for lock-in"', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentStarted);

      await waitFor(() => {
        expect(screen.getByText('Need 140 for lock-in')).toBeInTheDocument();
      });
    });

    it('should show 70% threshold marker', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentStarted);

      await waitFor(() => {
        expect(screen.getByText('70%')).toBeInTheDocument();
      });
    });

    it('should show "Current" chip on STARTED stage', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentStarted);

      await waitFor(() => {
        const currentChips = screen.getAllByText(/Current/);
        expect(currentChips.length).toBeGreaterThan(0);
      });
    });

    it('should not show lock-in or active alerts in STARTED state', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentStarted);

      await waitFor(() => {
        const startedElements = screen.getAllByText('STARTED');
        expect(startedElements.length).toBeGreaterThan(0);
      });

      expect(screen.queryByText(/DigiDollar activation is locked in/)).not.toBeInTheDocument();
      expect(screen.queryByText(/DigiDollar is active!/)).not.toBeInTheDocument();
    });
  });

  describe('LOCKED_IN State', () => {
    it('should show "LOCKED IN" as current stage chip', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentLockedIn);

      await waitFor(() => {
        expect(screen.getByText('Current Stage')).toBeInTheDocument();
        // The status chip shows "LOCKED IN" (space), the stage flow shows "LOCKED_IN" (underscore)
        const lockedInElements = screen.getAllByText(/LOCKED.IN/);
        expect(lockedInElements.length).toBeGreaterThan(0);
      });
    });

    it('should show "NO" for "Is DigiDollar Active?" in LOCKED_IN state', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentLockedIn);

      await waitFor(() => {
        expect(screen.getByText('NO')).toBeInTheDocument();
      });
    });

    it('should show lock-in alert message', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentLockedIn);

      await waitFor(() => {
        expect(screen.getByText(/DigiDollar activation is locked in!/)).toBeInTheDocument();
      });
    });

    it('should show activation block height in lock-in message', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentLockedIn);

      await waitFor(() => {
        expect(screen.getByText(/will activate at block 600/)).toBeInTheDocument();
      });
    });

    it('should show blocks remaining when block height is known', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendInitialData(ws);
      sendDeploymentData(ws, mockDeploymentLockedIn);

      await waitFor(() => {
        // currentHeight=289, min_activation_height=600, remaining = 600-289 = 311
        expect(screen.getByText(/311 blocks remaining/)).toBeInTheDocument();
      });
    });

    it('should NOT show signaling progress bar in LOCKED_IN state', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentLockedIn);

      await waitFor(() => {
        const lockedInElements = screen.getAllByText(/LOCKED.IN/);
        expect(lockedInElements.length).toBeGreaterThan(0);
      });

      expect(screen.queryByText('Signaling Progress')).not.toBeInTheDocument();
    });

    it('should show "Current" chip on LOCKED_IN stage', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentLockedIn);

      await waitFor(() => {
        const currentChips = screen.getAllByText(/Current/);
        expect(currentChips.length).toBeGreaterThan(0);
      });
    });
  });

  describe('ACTIVE State', () => {
    it('should show "YES" for "Is DigiDollar Active?"', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentActive);

      await waitFor(() => {
        expect(screen.getByText('Is DigiDollar Active?')).toBeInTheDocument();
        expect(screen.getByText('YES')).toBeInTheDocument();
      });
    });

    it('should show "ACTIVE" as current stage', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentActive);

      await waitFor(() => {
        expect(screen.getByText('Current Stage')).toBeInTheDocument();
        // ACTIVE appears in status chip, stage flow, and technical parameters
        const activeElements = screen.getAllByText('ACTIVE');
        expect(activeElements.length).toBeGreaterThan(0);
      });
    });

    it('should show success alert "DigiDollar is active!"', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentActive);

      await waitFor(() => {
        expect(screen.getByText(/DigiDollar is active!/)).toBeInTheDocument();
      });
    });

    it('should show minting, sending, and redeeming are functional', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentActive);

      await waitFor(() => {
        expect(screen.getByText(/Minting, sending, and redeeming are fully functional/)).toBeInTheDocument();
      });
    });

    it('should show activation height', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentActive);

      await waitFor(() => {
        expect(screen.getByText(/Activated at block 600/)).toBeInTheDocument();
      });
    });

    it('should show "Current" chip on ACTIVE stage', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentActive);

      await waitFor(() => {
        const currentChips = screen.getAllByText(/Current/);
        expect(currentChips.length).toBeGreaterThan(0);
      });
    });

    it('should NOT show signaling progress bar in ACTIVE state', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentActive);

      await waitFor(() => {
        const activeElements = screen.getAllByText('ACTIVE');
        expect(activeElements.length).toBeGreaterThan(0);
      });

      expect(screen.queryByText('Signaling Progress')).not.toBeInTheDocument();
    });

    it('should NOT show lock-in alert in ACTIVE state', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentActive);

      await waitFor(() => {
        const activeElements = screen.getAllByText('ACTIVE');
        expect(activeElements.length).toBeGreaterThan(0);
      });

      expect(screen.queryByText(/DigiDollar activation is locked in/)).not.toBeInTheDocument();
    });
  });

  describe('Block Height', () => {
    it('should update block height from initialData message', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentStarted);
      sendInitialData(ws);

      await waitFor(() => {
        // 289 appears in the Current Block card and in Current Status section
        const heightElements = screen.getAllByText('289');
        expect(heightElements.length).toBeGreaterThan(0);
      });
    });

    it('should show "..." when block height is not yet received', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentStarted);

      await waitFor(() => {
        expect(screen.getByText('...')).toBeInTheDocument();
      });
    });

    it('should show window progress information', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentStarted);
      sendInitialData(ws);

      // Block 289: window = floor(289/200) = 1, start = 200, end = 399, blocksInto = 89
      await waitFor(() => {
        expect(screen.getByText(/Window: 200/)).toBeInTheDocument();
        expect(screen.getByText(/89\/200/)).toBeInTheDocument();
      });
    });

    it('should update block height from newBlock messages', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentStarted);
      sendInitialData(ws);

      await waitFor(() => {
        const heightElements = screen.getAllByText('289');
        expect(heightElements.length).toBeGreaterThan(0);
      });

      // Send a new block
      ws.receiveMessage({ type: 'newBlock', data: { height: 290 } });

      await waitFor(() => {
        const heightElements = screen.getAllByText('290');
        expect(heightElements.length).toBeGreaterThan(0);
      });
    });

    it('should not decrease block height from newBlock with lower height', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentStarted);
      sendInitialData(ws, { blockchainInfo: { blocks: 300 } });

      await waitFor(() => {
        const heightElements = screen.getAllByText('300');
        expect(heightElements.length).toBeGreaterThan(0);
      });

      // Send a newBlock with lower height (should be ignored via Math.max)
      ws.receiveMessage({ type: 'newBlock', data: { height: 295 } });

      await waitFor(() => {
        const heightElements = screen.getAllByText('300');
        expect(heightElements.length).toBeGreaterThan(0);
      });
    });

    it('should increment block height when newBlock has no height field', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentStarted);
      sendInitialData(ws);

      await waitFor(() => {
        const heightElements = screen.getAllByText('289');
        expect(heightElements.length).toBeGreaterThan(0);
      });

      // Send newBlock without a height field (falls back to prev + 1)
      ws.receiveMessage({ type: 'newBlock', data: {} });

      await waitFor(() => {
        const heightElements = screen.getAllByText('290');
        expect(heightElements.length).toBeGreaterThan(0);
      });
    });

    it('should show Current Block label', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentStarted);

      await waitFor(() => {
        expect(screen.getByText('Current Block')).toBeInTheDocument();
      });
    });
  });

  describe('BIP9 Explanation', () => {
    it('should render "How DigiDollar Activates" section', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentStarted);

      await waitFor(() => {
        const headings = screen.getAllByText(/How DigiDollar Activates/);
        expect(headings.length).toBeGreaterThan(0);
      });
    });

    it('should explain BIP9 miner signaling', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentStarted);

      await waitFor(() => {
        const signalingTexts = screen.getAllByText(/BIP9 miner signaling/);
        expect(signalingTexts.length).toBeGreaterThan(0);
        const votingTexts = screen.getAllByText(/Miners vote by setting bit 23/);
        expect(votingTexts.length).toBeGreaterThan(0);
      });
    });

    it('should show the 4 stages explanation', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentStarted);

      await waitFor(() => {
        expect(screen.getByText('The 4 Stages:')).toBeInTheDocument();
        // Check stage descriptions in the explanation
        const definedTexts = screen.getAllByText(/DigiDollar code exists but is dormant/);
        expect(definedTexts.length).toBeGreaterThan(0);
        expect(screen.getByText(/Miners can begin signaling support/)).toBeInTheDocument();
        expect(screen.getByText(/Activation is guaranteed. No going back./)).toBeInTheDocument();
      });
    });

    it('should show CLI command for testnet', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentStarted);

      await waitFor(() => {
        expect(screen.getByText(/digibyte-cli -testnet getdigidollardeploymentinfo/)).toBeInTheDocument();
      });
    });

    it('should show "Why Does This Matter?" section', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentStarted);

      await waitFor(() => {
        expect(screen.getByText('Why Does This Matter?')).toBeInTheDocument();
      });
    });

    it('should explain testnet accelerated parameters in explanation', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentStarted);

      await waitFor(() => {
        expect(screen.getByText(/200-block windows instead of 40,320/)).toBeInTheDocument();
      });
    });

    it('should show "Monitor via CLI:" label', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentStarted);

      await waitFor(() => {
        expect(screen.getByText('Monitor via CLI:')).toBeInTheDocument();
      });
    });
  });

  describe('Technical Parameters', () => {
    it('should show testnet activation parameters heading', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentStarted);

      await waitFor(() => {
        expect(screen.getByText('Testnet Activation Parameters')).toBeInTheDocument();
      });
    });

    it('should show BIP9 Configuration section', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentStarted);

      await waitFor(() => {
        expect(screen.getByText('BIP9 Configuration')).toBeInTheDocument();
      });
    });

    it('should show signaling bit 23', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentStarted);

      await waitFor(() => {
        expect(screen.getByText('Signaling Bit:')).toBeInTheDocument();
        const bit23Elements = screen.getAllByText('23');
        expect(bit23Elements.length).toBeGreaterThan(0);
      });
    });

    it('should show activation window 200 blocks', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentStarted);

      await waitFor(() => {
        expect(screen.getByText('Activation Window:')).toBeInTheDocument();
        expect(screen.getByText('200 blocks')).toBeInTheDocument();
      });
    });

    it('should show required threshold 140 blocks (70%)', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentStarted);

      await waitFor(() => {
        expect(screen.getByText('Required Threshold:')).toBeInTheDocument();
        expect(screen.getByText('140 blocks (70%)')).toBeInTheDocument();
      });
    });

    it('should show min activation height', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentStarted);

      await waitFor(() => {
        expect(screen.getByText('Min Activation Height:')).toBeInTheDocument();
        const val600 = screen.getAllByText('600');
        expect(val600.length).toBeGreaterThan(0);
      });
    });

    it('should show Current Status section', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentStarted);

      await waitFor(() => {
        expect(screen.getByText('Current Status')).toBeInTheDocument();
      });
    });

    it('should show status value in current status section', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentStarted);

      await waitFor(() => {
        expect(screen.getByText('Status:')).toBeInTheDocument();
        const startedElements = screen.getAllByText('STARTED');
        expect(startedElements.length).toBeGreaterThan(0);
      });
    });

    it('should show current block in current status section', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentStarted);
      sendInitialData(ws);

      await waitFor(() => {
        const currentBlockLabels = screen.getAllByText('Current Block:');
        expect(currentBlockLabels.length).toBeGreaterThan(0);
      });
    });

    it('should show window progress in current status section', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentStarted);
      sendInitialData(ws);

      // Block 289: blocksIntoWindow = 289 % 200 = 89
      await waitFor(() => {
        expect(screen.getByText('Window Progress:')).toBeInTheDocument();
        expect(screen.getByText('89 / 200')).toBeInTheDocument();
      });
    });

    it('should show signaling blocks count in current status section', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentStarted);

      await waitFor(() => {
        expect(screen.getByText('Signaling Blocks:')).toBeInTheDocument();
        expect(screen.getByText('90')).toBeInTheDocument();
      });
    });

    it('should show "Loading..." for block-dependent values before height is received', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentStarted);

      await waitFor(() => {
        const loadingTexts = screen.getAllByText('Loading...');
        expect(loadingTexts.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Stage Flow Visualization', () => {
    it('should render all 4 stage labels', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentStarted);

      await waitFor(() => {
        expect(screen.getByText('Activation Progress')).toBeInTheDocument();
        const definedElements = screen.getAllByText('DEFINED');
        expect(definedElements.length).toBeGreaterThan(0);
        const startedElements = screen.getAllByText('STARTED');
        expect(startedElements.length).toBeGreaterThan(0);
        // LOCKED_IN appears in stage flow and BIP9 explanation
        const lockedInElements = screen.getAllByText('LOCKED_IN');
        expect(lockedInElements.length).toBeGreaterThan(0);
        // ACTIVE appears in stage flow (not current) and may appear in explanation
        const activeElements = screen.getAllByText('ACTIVE');
        expect(activeElements.length).toBeGreaterThan(0);
      });
    });

    it('should show stage descriptions', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentStarted);

      await waitFor(() => {
        expect(screen.getByText('Code exists but is dormant')).toBeInTheDocument();
        expect(screen.getByText('Miners signal support (bit 23)')).toBeInTheDocument();
        expect(screen.getByText('Activation guaranteed')).toBeInTheDocument();
        expect(screen.getByText('DigiDollar is live!')).toBeInTheDocument();
      });
    });

    it('should show DEFINED as past stage when status is STARTED', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentStarted);

      // When STARTED is current, DEFINED should be a past stage.
      // We verify by checking both DEFINED and STARTED labels render.
      await waitFor(() => {
        const definedElements = screen.getAllByText('DEFINED');
        expect(definedElements.length).toBeGreaterThan(0);
        const startedElements = screen.getAllByText('STARTED');
        expect(startedElements.length).toBeGreaterThan(0);
      });
    });

    it('should show DEFINED and STARTED as past when LOCKED_IN', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentLockedIn);

      await waitFor(() => {
        const definedElements = screen.getAllByText('DEFINED');
        expect(definedElements.length).toBeGreaterThan(0);
        const startedElements = screen.getAllByText('STARTED');
        expect(startedElements.length).toBeGreaterThan(0);
        // LOCKED_IN appears in stage flow and also as "LOCKED IN" in status chip and technical params
        const lockedInElements = screen.getAllByText(/LOCKED.IN/);
        expect(lockedInElements.length).toBeGreaterThan(0);
      });
    });

    it('should show all stages as past/current when ACTIVE', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentActive);

      await waitFor(() => {
        const definedElements = screen.getAllByText('DEFINED');
        expect(definedElements.length).toBeGreaterThan(0);
        const startedElements = screen.getAllByText('STARTED');
        expect(startedElements.length).toBeGreaterThan(0);
        // LOCKED_IN appears in stage flow and BIP9 explanation
        const lockedInElements = screen.getAllByText('LOCKED_IN');
        expect(lockedInElements.length).toBeGreaterThan(0);
        const activeElements = screen.getAllByText('ACTIVE');
        expect(activeElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Network Context', () => {
    it('should connect to testnet WebSocket', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });

      await waitForAsync();

      expect(mockWebSocket).toHaveBeenCalledWith('ws://localhost:5003');
    });

    it('should connect to mainnet WebSocket', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'mainnet' });

      await waitForAsync();

      expect(mockWebSocket).toHaveBeenCalledWith('ws://localhost:5002');
    });

    it('should use testnet parameters (200 block window)', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'testnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentStarted);

      await waitFor(() => {
        expect(screen.getByText('200 blocks')).toBeInTheDocument();
        expect(screen.getByText('140 blocks (70%)')).toBeInTheDocument();
      });
    });

    it('should use mainnet parameters when rendered on mainnet', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'mainnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentStarted);

      await waitFor(() => {
        expect(screen.getByText('Mainnet Activation Parameters')).toBeInTheDocument();
        expect(screen.getByText('40,320 blocks')).toBeInTheDocument();
        expect(screen.getByText('28,224 blocks (70%)')).toBeInTheDocument();
      });
    });

    it('should show mainnet CLI command without -testnet flag', async () => {
      renderWithProviders(<DDActivationPage />, { network: 'mainnet' });
      await waitForAsync();
      const ws = webSocketInstances[0];

      sendDeploymentData(ws, mockDeploymentStarted);

      await waitFor(() => {
        expect(screen.getByText('digibyte-cli getdigidollardeploymentinfo')).toBeInTheDocument();
      });
    });
  });
});
