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

  // N1: every field must agree with the buried, active deployment data.
  describe('buried active deployment (live shape)', () => {
    const renderLive = async (data = liveInitialData) => {
      renderWithProviders(<TaprootPage />);
      await waitForAsync();
      wsSetup.instances[0].receiveMessage(data);
      await waitFor(() => expect(screen.getByText('YES')).toBeInTheDocument());
    };

    const detailsText = () => screen.getByTestId('taproot-details').textContent;

    it('shows Status: Active and the activation height from the data', async () => {
      await renderLive();
      expect(detailsText()).toContain('Status: Active');
      expect(detailsText()).toContain('Activation Height: 21,168,000');
    });

    it('hides rows the data does not provide instead of N/A, Unknown or blank', async () => {
      await renderLive();
      const text = detailsText();
      expect(text).not.toMatch(/Unknown|N\/A/);
      expect(text).not.toContain('Minimum Activation Height');
      expect(text).not.toContain('Active Since Block');
    });

    it('fills the progress bar in the active green', async () => {
      await renderLive();
      const bar = document.querySelector('.MuiLinearProgress-bar');
      expect(getComputedStyle(bar).backgroundColor).toBe('rgb(76, 175, 80)');
      expect(screen.getByText(/Progress: 100\.00%/)).toBeInTheDocument();
    });

    it('highlights the "active" stage', async () => {
      await renderLive();
      const active = screen.getByText('active', { selector: 'h6' });
      expect(['bold', '700']).toContain(getComputedStyle(active).fontWeight);
    });

    it('uses the activation height from the data in the summary text (testnet: 0)', async () => {
      await renderLive({
        type: 'initialData',
        data: { deploymentInfo: { deployments: { taproot: { type: 'buried', active: true, height: 0 } } } },
      });
      expect(detailsText()).toContain('Activation Height: 0');
      expect(screen.queryByText(/21,168,000/)).not.toBeInTheDocument();
    });

    it('lets the cards and stage flow wrap so 400px does not scroll sideways', async () => {
      await renderLive();
      // jsdom ignores media queries, so check the emitted CSS: the cards stack
      // (column) on small screens and sit in a row only from the md breakpoint.
      const cardsClass = [...screen.getByTestId('taproot-cards').classList].find((c) => c.startsWith('css-'));
      const css = [...document.querySelectorAll('style')].map((el) => el.textContent).join('');
      expect(css).toMatch(new RegExp(`min-width:0px\\)\\{\\.${cardsClass}\\{[^}]*[;{]flex-direction:column`));
      expect(css).toMatch(new RegExp(`min-width:900px\\)\\{\\.${cardsClass}\\{[^}]*[;{]flex-direction:row`));
      expect(getComputedStyle(screen.getByTestId('taproot-stages')).flexWrap).toBe('wrap');
    });
  });

  it('still shows bip9 fields (and the min activation height) when a node reports them', async () => {
    renderWithProviders(<TaprootPage />);
    await waitForAsync();
    wsSetup.instances[0].receiveMessage({
      type: 'initialData',
      data: {
        blockchainInfo: {
          softforks: {
            taproot: {
              type: 'bip9', active: false, height: undefined,
              bip9: { status: 'started', since: 21000000, min_activation_height: 0,
                statistics: { period: 40320, threshold: 28224, elapsed: 100, count: 50, possible: true } },
            },
          },
        },
      },
    });
    await waitFor(() => expect(screen.getByText('NO')).toBeInTheDocument());
    const text = screen.getByTestId('taproot-details').textContent;
    expect(text).toContain('Status: Started');
    expect(text).toContain('Minimum Activation Height: 0');
    expect(text).not.toContain('Activation Height: undefined');
  });
});
