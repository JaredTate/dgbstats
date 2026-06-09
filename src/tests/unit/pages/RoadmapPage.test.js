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

  it('shows updated RC44 MuSig2 references', async () => {
    renderWithProviders(<RoadmapPage />, { network: 'testnet' });
    await waitForAsync();

    await waitFor(() => {
      expect(screen.getByText(/Design 35-slot oracle system with 35 active testnet operators and 7-signature MuSig2 aggregate signing/i)).toBeInTheDocument();
      expect(screen.getByText(/Oracle network \(Phase Two - 35-slot roster, 7-signature MuSig2 quorum\)/i)).toBeInTheDocument();
      expect(screen.getByText(/with Phase Two 7-signature consensus/i)).toBeInTheDocument();
      expect(screen.getByText(/oracle price feeds and a 7-signature quorum across a 35-slot roster/i)).toBeInTheDocument();
      const validationMatches = screen.getAllByText(/RC44 MuSig2 Oracle Testnet Validation/i);
      expect(validationMatches.length).toBeGreaterThan(0);
      expect(screen.getByText(/Complete 7-signature oracle consensus validation on testnet26/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Testnet Release v9\.26\.0-RC44/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/DigiByte v9\.26 Release Candidate 43 \(Current\)/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Current testnet26 release candidate \(v9\.26\.0-RC44\)/i)).toBeInTheDocument();
    });
  });
});
