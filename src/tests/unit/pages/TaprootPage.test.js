import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import TaprootPage from '../../../pages/TaprootPage';
import { renderWithProviders, createWebSocketMock, waitForAsync } from '../../utils/testUtils';

describe('TaprootPage', () => {
  let wsSetup;

  beforeEach(() => {
    wsSetup = createWebSocketMock();
    global.WebSocket = wsSetup.MockWebSocket;
  });

  afterEach(() => {
    wsSetup.instances.forEach((ws) => ws.close());
    wsSetup.clearInstances();
    vi.restoreAllMocks();
  });

  // Live digibyte.io data: getblockchaininfo no longer has `softforks`
  // (DigiByte Core moved it to getdeploymentinfo), and taproot is buried.
  const liveInitialData = {
    type: 'initialData',
    data: {
      blockchainInfo: { chain: 'main', blocks: 24438000 },
      deploymentInfo: {
        deployments: { taproot: { type: 'buried', active: true, height: 21168000 } },
      },
    },
  };

  it('reads taproot from deploymentInfo without logging an error', async () => {
    const errorSpy = vi.spyOn(console, 'error');
    renderWithProviders(<TaprootPage />);
    await waitForAsync();

    wsSetup.instances[0].receiveMessage(liveInitialData);

    await waitFor(() => expect(screen.getByText('YES')).toBeInTheDocument());
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('still reads the old blockchainInfo.softforks shape', async () => {
    renderWithProviders(<TaprootPage />);
    await waitForAsync();

    wsSetup.instances[0].receiveMessage({
      type: 'initialData',
      data: { blockchainInfo: { softforks: { taproot: { type: 'buried', active: true } } } },
    });

    await waitFor(() => expect(screen.getByText('YES')).toBeInTheDocument());
  });
});
