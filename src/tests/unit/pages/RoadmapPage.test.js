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

  it('shows updated RC41 MuSig2 references', async () => {
    renderWithProviders(<RoadmapPage />, { network: 'testnet' });
    await waitForAsync();

    await waitFor(() => {
      expect(screen.getByText(/Design 35-slot oracle system with 17 active launch operators and 9-signature MuSig2 aggregate signing/i)).toBeInTheDocument();
      expect(screen.getByText(/Oracle network \(Phase Two - 35-slot roster, 9-signature MuSig2 quorum\)/i)).toBeInTheDocument();
      expect(screen.getByText(/with Phase Two 9-signature consensus/i)).toBeInTheDocument();
      expect(screen.getByText(/oracle price feeds and a 9-signature quorum across a 35-slot roster/i)).toBeInTheDocument();
      const validationMatches = screen.getAllByText(/RC41 MuSig2 Oracle Testnet Validation/i);
      expect(validationMatches.length).toBeGreaterThan(0);
      expect(screen.getByText(/Complete 9-signature oracle consensus validation on testnet25/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Testnet Release v9\.26\.0-RC41/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Fresh testnet25 release candidate \(v9\.26\.0-RC41\)/i)).toBeInTheDocument();
    });
  });
});
