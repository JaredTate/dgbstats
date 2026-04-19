import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import RoadmapPage from '../../../pages/RoadmapPage';
import { renderWithProviders, createWebSocketMock, waitForAsync } from '../../utils/testUtils';

describe('RoadmapPage oracle consensus copy', () => {
  let wsSetup;
  let webSocketInstances;

  beforeEach(() => {
    wsSetup = createWebSocketMock();
    webSocketInstances = wsSetup.instances;
    global.WebSocket = wsSetup.MockWebSocket;
  });

  afterEach(() => {
    webSocketInstances.forEach(ws => ws.close());
    wsSetup.clearInstances();
    vi.clearAllMocks();
  });

  it('shows updated 9-of-17 MuSig2 references', async () => {
    renderWithProviders(<RoadmapPage />, { network: 'testnet' });
    await waitForAsync();

    await waitFor(() => {
      expect(screen.getByText(/Design 17-oracle system with 9-of-17 MuSig2 aggregate signing/i)).toBeInTheDocument();
      expect(screen.getByText(/Oracle network \(Phase Two - 9-of-17 MuSig2 consensus\)/i)).toBeInTheDocument();
      expect(screen.getByText(/with Phase Two 9-of-17 consensus/i)).toBeInTheDocument();
      expect(screen.getByText(/oracle price feeds and 9-of-17 consensus/i)).toBeInTheDocument();
      const validationMatches = screen.getAllByText(/9-of-17 MuSig2 Oracle Testnet Validation/i);
      expect(validationMatches.length).toBeGreaterThan(0);
      expect(screen.getByText(/Complete 9-of-17 oracle consensus validation on testnet/i)).toBeInTheDocument();
    });
  });
});
