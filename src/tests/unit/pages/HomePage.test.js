import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { renderWithProviders, createWebSocketMock, waitForAsync } from '../../utils/testUtils';

import HomePage from '../../../pages/HomePage';

// Mock the config
vi.mock('../../../config', () => ({
  default: {
    apiBaseUrl: 'http://localhost:5001',
    wsBaseUrl: 'ws://localhost:5002'
  }
}));

// Mock utils
vi.mock('../../../utils', () => ({
  formatNumber: (num) => num.toLocaleString(),
  numberWithCommas: (x) => x ? x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0"
}));

describe('HomePage', () => {
  let mockWebSocket;
  let webSocketInstances;
  let wsSetup;

  // Helper function to render HomePage with required props
  const renderHomePage = () => {
    return renderWithProviders(
      <HomePage 
        numberWithCommas={(x) => {
          if (x === null || x === undefined) return "0";
          return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }}
        formatNumber={(num) => {
          if (num === null || num === undefined) return "0";
          return num.toLocaleString();
        }}
      />
    );
  };

  beforeEach(() => {
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
      renderHomePage();
      
      expect(screen.getByText('DigiByte Blockchain Statistics')).toBeInTheDocument();
      expect(screen.getByText(/This is a free & open source website/)).toBeInTheDocument();
    });

    it('should render all stat cards with loading state initially', () => {
      renderHomePage();
      
      // Check for stat card titles
      expect(screen.getByText('Total Blocks')).toBeInTheDocument();
      expect(screen.getByText('Total Transactions')).toBeInTheDocument();
      expect(screen.getByText('Total Size')).toBeInTheDocument();
      expect(screen.getByText('Current Circulating Supply')).toBeInTheDocument();
      expect(screen.getByText('Remaining Supply To Be Mined')).toBeInTheDocument();
      expect(screen.getByText('Last Block Reward')).toBeInTheDocument();
      
      // Initially should show loading state
      const loadingIndicators = screen.getAllByText('Loading...');
      expect(loadingIndicators.length).toBeGreaterThan(0);
    });

    it('should show v9.26.7 as the latest testnet release', () => {
      renderWithProviders(
        <HomePage
          numberWithCommas={(x) => x ? x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0"}
          formatNumber={(num) => num ? num.toLocaleString() : "0"}
        />,
        { network: 'testnet' }
      );

      expect(screen.getByText('Latest Version')).toBeInTheDocument();
      expect(screen.getAllByText('v9.26.7').length).toBeGreaterThan(0);
      expect(screen.queryByText(/awaits 70% miner/)).not.toBeInTheDocument();
    });

    it('should show v9.26.7 as the latest mainnet release', () => {
      renderHomePage();

      expect(screen.getByText('Latest Version')).toBeInTheDocument();
      // Mainnet renders "v9.26.7 DigiDollar"; testnet renders the bare version.
      expect(screen.getAllByText(/v9\.26\.7/).length).toBeGreaterThan(0);
    });

    it('should render algorithm difficulties card', async () => {
      // SKIPPED: HomePage has a bug where it doesn't check blockchainInfo.softforks before calling Object.entries()
      renderHomePage();
      
      // The card title should be visible immediately
      expect(screen.getByText('Algo Difficulties')).toBeInTheDocument();
      
      // Send data to populate the difficulties
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      ws.receiveMessage({
        type: 'initialData',
        data: {
          blockchainInfo: {
            blocks: 17456789,
            difficulties: {
              sha256d: 12345678,
              scrypt: 234567,
              skein: 345678,
              qubit: 456789,
              odocrypt: 567890
            }
          }
        }
      });
      
      // Wait for the difficulties to be displayed
      await waitFor(() => {
        expect(screen.getByText('SHA256d:')).toBeInTheDocument();
        expect(screen.getByText('Scrypt:')).toBeInTheDocument();
        expect(screen.getByText('Skein:')).toBeInTheDocument();
        expect(screen.getByText('Qubit:')).toBeInTheDocument();
        expect(screen.getByText('Odo:')).toBeInTheDocument();
      });
    });

    it('should render active softforks card', () => {
      renderHomePage();
      
      expect(screen.getByText('Active Softforks')).toBeInTheDocument();
    });
  });

  describe('WebSocket Connection', () => {
    it('should establish WebSocket connection on mount', async () => {
      renderHomePage();
      
      await waitForAsync();
      
      expect(mockWebSocket).toHaveBeenCalledWith('ws://localhost:5002');
      expect(webSocketInstances.length).toBe(1);
      expect(webSocketInstances[0].readyState).toBe(WebSocket.OPEN);
    });

    it('should close WebSocket connection on unmount', async () => {
      const { unmount } = renderHomePage();
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      unmount();
      
      expect(ws.readyState).toBe(WebSocket.CLOSED);
    });

    it('should handle WebSocket connection', async () => {
      renderHomePage();
      
      await waitForAsync();
      
      // Just verify WebSocket was created
      expect(webSocketInstances).toHaveLength(1);
      expect(webSocketInstances[0].readyState).toBe(WebSocket.OPEN);
    });
  });

  describe('Data Updates', () => {
    it('should update stats when receiving WebSocket data', async () => {
      // SKIPPED: HomePage has a bug where it doesn't check blockchainInfo.softforks before calling Object.entries()
      renderHomePage();
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      // Send initial data message
      ws.receiveMessage({
        type: 'initialData',
        data: {
          blockchainInfo: {
            blocks: 17456789,
            size_on_disk: 123456789012,
            difficulties: {
              sha256d: 12345678.90,
              scrypt: 234567.89,
              skein: 345678.90,
              qubit: 456789.01,
              odo: 567890.12
            }
          },
          chainTxStats: {
            txcount: 987654321
          },
          txOutsetInfo: {
            total_amount: 16234567890.12
          },
          blockReward: 625.0
        }
      });
      
      await waitFor(() => {
        // Check that data is displayed
        expect(screen.getByText('17,456,789')).toBeInTheDocument(); // Block count
        expect(screen.getByText('987,654,321')).toBeInTheDocument(); // Transaction count
      });
    });

    it('should update algorithm difficulties with data', async () => {
      // SKIPPED: HomePage has a bug where it doesn't check blockchainInfo.softforks before calling Object.entries()
      renderHomePage();
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      // Send data with difficulties
      ws.receiveMessage({
        type: 'initialData',
        data: {
          blockchainInfo: {
            blocks: 17456789,
            difficulties: {
              sha256d: 12345678,
              scrypt: 234567,
              skein: 345678,
              qubit: 456789,
              odo: 567890
            }
          }
        }
      });
      
      await waitFor(() => {
        expect(screen.getByText('12,345,678')).toBeInTheDocument(); // SHA256d difficulty
        expect(screen.getByText('234,567')).toBeInTheDocument(); // Scrypt difficulty
      });
    });

    it('should preserve fractional testnet difficulties below one', async () => {
      renderWithProviders(
        <HomePage
          numberWithCommas={(x) => x ? x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0"}
          formatNumber={(num) => num ? num.toLocaleString() : "0"}
        />,
        { network: 'testnet' }
      );

      await waitForAsync();
      const ws = webSocketInstances[0];

      ws.receiveMessage({
        type: 'initialData',
        data: {
          blockchainInfo: {
            blocks: 123456,
            difficulties: {
              sha256d: 0.00001937,
              scrypt: 0.25,
              skein: 1.5,
              qubit: 12.75,
              odocrypt: 0.00000042
            }
          }
        }
      });

      await waitFor(() => {
        expect(screen.getByText('0.00001937')).toBeInTheDocument();
        expect(screen.getByText('0.25')).toBeInTheDocument();
        expect(screen.getByText('0.00000042')).toBeInTheDocument();
      });
      expect(screen.queryAllByText('0')).toHaveLength(0);
      expect(screen.queryByText('NaN')).not.toBeInTheDocument();
    });

    it('should display active softforks', async () => {
      renderHomePage();
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      ws.receiveMessage({
        type: 'initialData',
        data: {
          blockchainInfo: {
            blocks: 17456789
          },
          deploymentInfo: {
            deployments: {
              csv: { type: 'buried', active: true, height: 419328 },
              segwit: { type: 'buried', active: true, height: 1201536 },
              taproot: { type: 'bip9', active: true }
            }
          }
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Active Softforks')).toBeInTheDocument();
        expect(screen.getByText('csv:')).toBeInTheDocument();
        expect(screen.getByText('segwit:')).toBeInTheDocument();
        expect(screen.getByText('taproot:')).toBeInTheDocument();
        // There are multiple "buried" texts, so use getAllByText
        const buriedTexts = screen.getAllByText('buried');
        expect(buriedTexts.length).toBe(2); // csv and segwit are both buried
        expect(screen.getByText('active')).toBeInTheDocument(); // taproot is active
      });
    });
  });

  describe('Number Formatting', () => {
    it('should format large numbers correctly', async () => {
      // SKIPPED: HomePage has a bug where it doesn't check blockchainInfo.softforks before calling Object.entries()
      renderHomePage();
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      ws.receiveMessage({
        type: 'initialData',
        data: {
          blockchainInfo: {
            blocks: 123456789
          },
          txOutsetInfo: {
            total_amount: 12345678901.234
          }
        }
      });
      
      await waitFor(() => {
        expect(screen.getByText('123,456,789')).toBeInTheDocument(); // Block height with commas
        expect(screen.getByText('12,345,678,901.23 DGB')).toBeInTheDocument(); // Supply with commas
      });
    });
  });

  describe('User Interactions', () => {
    it('should have clickable cards with hover effects', async () => {
      renderHomePage();
      
      // Wait for WebSocket data to populate cards
      await waitForAsync();
      
      // Look for stat card titles
      expect(screen.getByText('Total Blocks')).toBeInTheDocument();
      expect(screen.getByText('Total Transactions')).toBeInTheDocument();
      expect(screen.getByText('Total Size')).toBeInTheDocument();
    });

    it('should handle rapid WebSocket updates', async () => {
      // SKIPPED: HomePage has a bug where it doesn't check blockchainInfo.softforks before calling Object.entries()
      renderHomePage();
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      // Send multiple rapid updates
      for (let i = 0; i < 10; i++) {
        ws.receiveMessage({
          type: 'initialData',
          data: {
            blockchainInfo: {
              blocks: 17456789 + i
            }
          }
        });
      }
      
      await waitFor(() => {
        expect(screen.getByText('17,456,798')).toBeInTheDocument(); // Last update
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed WebSocket messages', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      renderHomePage();
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      // Send malformed data through the mock's receiveMessage
      // The mock WebSocket will parse this, so we need to simulate the error differently
      ws.receiveMessage({ type: 'error', data: null });
      
      // Should not crash and continue to display
      expect(screen.getByText('DigiByte Blockchain Statistics')).toBeInTheDocument();
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle missing data gracefully', async () => {
      // SKIPPED: HomePage has a bug where it doesn't check blockchainInfo.softforks before calling Object.entries()
      renderHomePage();
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      // Send incomplete data
      ws.receiveMessage({
        type: 'initialData',
        data: {
          blockchainInfo: {
            blocks: 12345
          }
          // Missing other required fields
        }
      });
      
      await waitFor(() => {
        expect(screen.getByText('12,345')).toBeInTheDocument(); // Should update what's available
        const loadingElements = screen.getAllByText('Loading...');
        expect(loadingElements.length).toBeGreaterThan(0); // Missing data shows loading
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      // SKIPPED: HomePage has a bug where it doesn't check blockchainInfo.softforks before calling Object.entries()
      renderHomePage();

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('DigiByte Blockchain Statistics');

      // Wait for WebSocket data to populate stat cards with h6 headings
      await waitForAsync();
      const ws = webSocketInstances[0];

      ws.receiveMessage({
        type: 'initialData',
        data: {
          blockchainInfo: {
            blocks: 17456789
          }
        }
      });

      await waitFor(() => {
        const headings = screen.getAllByRole('heading');
        expect(headings.length).toBeGreaterThan(1);
      });
    });

    it('should have descriptive text for screen readers', () => {
      renderHomePage();

      // Check for descriptive content
      expect(screen.getByText(/This is a free & open source website/)).toBeInTheDocument();
      expect(screen.getByText(/Total blocks in the DigiByte blockchain since the chain was started/)).toBeInTheDocument();
    });
  });

  describe('Every tile is a door', () => {
    // Each home tile: its accessible name, its path (before the network prefix),
    // and the visible action line at the bottom of the card.
    const SHARED_TILES = [
      { name: 'Total Blocks: see latest blocks', path: '/blocks', action: 'See latest blocks →' },
      { name: 'Total Transactions: view transactions', path: '/txs', action: 'View transactions →' },
      { name: 'Total Size: see the nodes that store it', path: '/nodes', action: 'See the nodes that store it →' },
      { name: 'Current Circulating Supply: explore supply', path: '/supply', action: 'Explore supply →' },
      { name: 'Remaining Supply To Be Mined: see the supply schedule', path: '/supply', action: 'See the supply schedule →' },
      { name: 'Last Block Reward: see recent blocks', path: '/blocks', action: 'See recent blocks →' },
      { name: 'Algo Difficulties: view difficulty charts', path: '/difficulties', action: 'View difficulty charts →' },
      { name: 'Active Softforks: see network upgrades', path: '/pool-upgrades', action: 'See network upgrades →' }
    ];

    const MAINNET_VERSION_TILE = {
      name: 'Latest Version: download DigiByte Core', path: '/downloads', action: 'Download DigiByte Core →'
    };
    const GITHUB_RELEASES = 'https://github.com/DigiByte-Core/digibyte/releases';
    const TESTNET_VERSION_TILE = {
      name: 'Latest Version: get it on GitHub (opens in a new tab)', href: GITHUB_RELEASES, action: 'Get it on GitHub →'
    };
    const TESTNET_RELEASE_TILE = {
      name: 'Testnet26 DigiDollar Status: learn about DigiDollar', path: '/digidollar', action: 'Learn about DigiDollar →'
    };

    const renderOn = (network) => renderWithProviders(
      <HomePage
        numberWithCommas={(x) => (x === null || x === undefined ? '0' : x.toString())}
        formatNumber={(num) => (num === null || num === undefined ? '0' : num.toLocaleString())}
      />,
      { network }
    );

    const INTERACTIVE = 'a, button, input, select, textarea, [role="button"], [role="link"], [tabindex]';

    // FIRST-TIMER-19 (axe label-content-name-mismatch): a tile's accessible name is
    // its visible text, so it starts with the title and contains the action line.
    const tileName = (name) => {
      const [title, rest] = name.split(': ');
      const action = rest.replace(' (opens in a new tab)', '').toLowerCase();
      const external = rest.includes('(opens in a new tab)');
      return (accName) => accName.startsWith(title)
        && accName.toLowerCase().includes(action)
        && accName.includes('(opens in a new tab)') === external;
    };

    const expectTileLink = (tile, prefix) => {
      const link = screen.getByRole('link', { name: tileName(tile.name) });
      expect(link.tagName).toBe('A');
      expect(link).toHaveAttribute('href', tile.href || `${prefix}${tile.path}`);
      expect(link).toHaveTextContent(tile.action);
      return link;
    };

    it('makes every mainnet tile a link to its detail page', () => {
      renderOn('mainnet');
      [...SHARED_TILES, MAINNET_VERSION_TILE].forEach((tile) => {
        const link = expectTileLink(tile, '');
        expect(link).not.toHaveAttribute('target');
      });
      expect(screen.getAllByRole('link')).toHaveLength(SHARED_TILES.length + 1);
    });

    it('prefixes every testnet tile link with /testnet', () => {
      renderOn('testnet');
      [...SHARED_TILES, TESTNET_RELEASE_TILE].forEach((tile) => expectTileLink(tile, '/testnet'));
      expect(screen.queryByRole('link', { name: tileName(MAINNET_VERSION_TILE.name) })).not.toBeInTheDocument();
      // + testnet release tile + latest version tile + "Go to mainnet" intro link
      expect(screen.getAllByRole('link')).toHaveLength(SHARED_TILES.length + 3);
    });

    it('sends the testnet Latest Version tile to GitHub in a new tab', () => {
      renderOn('testnet');
      const link = expectTileLink(TESTNET_VERSION_TILE, '');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link.getAttribute('rel')).toContain('noopener');
      expect(link.getAttribute('rel')).toContain('noreferrer');
    });

    it.each(['mainnet', 'testnet'])('has no link or button nested inside a tile link (%s)', (network) => {
      renderOn(network);
      screen.getAllByRole('link').forEach((link) => {
        expect(link.querySelectorAll(INTERACTIVE)).toHaveLength(0);
      });
    });

    it('keeps the softfork rows inside the card link and non-interactive', async () => {
      renderOn('mainnet');
      await waitForAsync();
      webSocketInstances[0].receiveMessage({
        type: 'initialData',
        data: {
          blockchainInfo: { blocks: 1 },
          deploymentInfo: { deployments: { csv: { type: 'buried', active: true } } }
        }
      });
      const link = screen.getByRole('link', { name: tileName('Active Softforks: see network upgrades') });
      await waitFor(() => expect(link).toHaveTextContent('csv:'));
      expect(link.querySelectorAll(INTERACTIVE)).toHaveLength(0);
    });

    it.each(['mainnet', 'testnet'])('makes every tile link reachable by keyboard (%s)', (network) => {
      renderOn(network);
      screen.getAllByRole('link').forEach((link) => {
        expect(link.tabIndex).not.toBe(-1);
        link.focus();
        expect(document.activeElement).toBe(link);
      });
    });

    it('keeps keyboard focus on a tile when live data arrives', async () => {
      renderOn('mainnet');
      await waitForAsync();
      screen.getByRole('link', { name: tileName('Total Blocks: see latest blocks') }).focus();
      webSocketInstances[0].receiveMessage({ type: 'initialData', data: { blockchainInfo: { blocks: 42 } } });
      await waitFor(() => expect(screen.getByText('42')).toBeInTheDocument());
      expect(document.activeElement).toBe(screen.getByRole('link', { name: tileName('Total Blocks: see latest blocks') }));
    });

    it('names each tile by its visible card text (no aria-label override)', () => {
      renderOn('mainnet');
      const link = screen.getByRole('link', { name: tileName('Total Blocks: see latest blocks') });
      expect(link).not.toHaveAttribute('aria-label');
      expect(link).not.toHaveAttribute('aria-describedby');
      expect(link).toHaveAccessibleName(/Total blocks in the DigiByte blockchain/);
      screen.getAllByRole('link').forEach((l) => expect(l).not.toHaveAttribute('aria-label'));
    });

    // FIRST-TIMER-16: no menu-like icon next to the page title.
    it.each(['mainnet', 'testnet'])('has no icon next to the page title (%s)', (network) => {
      renderOn(network);
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1.parentElement.querySelector('svg')).toBeNull();
    });

    // FIRST-TIMER-17: say what "buried" means.
    it('explains what a "buried" softfork is', () => {
      renderOn('mainnet');
      expect(screen.getByText(/"buried" means the upgrade is permanent/)).toBeInTheDocument();
    });

    // SLOW-6: long difficulty numbers wrap instead of widening the page.
    it('lets long difficulty values wrap', async () => {
      renderOn('mainnet');
      await waitForAsync();
      webSocketInstances[0].receiveMessage({
        type: 'initialData',
        data: { blockchainInfo: { blocks: 1, difficulties: { sha256d: 571625498.0531434, scrypt: 1, skein: 1, qubit: 1, odo: 1 } } }
      });
      const label = await screen.findByText('SHA256d:');
      const value = label.nextElementSibling;
      expect(getComputedStyle(value).overflowWrap).toBe('anywhere');
    });
  });

  describe('Testnet Network', () => {
    // Helper function to render HomePage with testnet network
    const renderHomePageTestnet = () => {
      return renderWithProviders(
        <HomePage
          numberWithCommas={(x) => {
            if (x === null || x === undefined) return "0";
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          }}
          formatNumber={(num) => {
            if (num === null || num === undefined) return "0";
            return num.toLocaleString();
          }}
        />,
        { network: 'testnet' }
      );
    };

    it('should render the page on testnet network', () => {
      renderHomePageTestnet();

      // On testnet, the title includes "Testnet"
      expect(screen.getByText('DigiByte Testnet Blockchain Statistics')).toBeInTheDocument();
    });

    it('should connect to testnet WebSocket URL', async () => {
      renderHomePageTestnet();

      await waitForAsync();

      // Testnet uses ws://localhost:5003 (from NetworkContext)
      expect(mockWebSocket).toHaveBeenCalledWith('ws://localhost:5003');
      expect(webSocketInstances.length).toBe(1);
    });

    it('should display testnet data correctly', async () => {
      renderHomePageTestnet();

      await waitForAsync();
      const ws = webSocketInstances[0];

      // Send testnet-specific data (lower block numbers typical for testnet)
      ws.receiveMessage({
        type: 'initialData',
        data: {
          blockchainInfo: {
            blocks: 123456,
            difficulties: {
              sha256d: 1234,
              scrypt: 234,
              skein: 345,
              qubit: 456,
              odocrypt: 567
            }
          },
          chainTxStats: {
            txcount: 98765
          },
          txOutsetInfo: {
            total_amount: 1234567890
          },
          blockReward: 625.0
        }
      });

      await waitFor(() => {
        expect(screen.getByText('123,456')).toBeInTheDocument(); // Testnet block count
        expect(screen.getByText('98,765')).toBeInTheDocument(); // Testnet transaction count
      });
    });

    it('should render all stat cards on testnet', () => {
      renderHomePageTestnet();

      // Check for stat card titles (same as mainnet)
      expect(screen.getByText('Total Blocks')).toBeInTheDocument();
      expect(screen.getByText('Total Transactions')).toBeInTheDocument();
      expect(screen.getByText('Total Size')).toBeInTheDocument();
      expect(screen.getByText('Current Circulating Supply')).toBeInTheDocument();
    });

    // FIRST-TIMER-2: the testnet home repeated mainnet facts and never said
    // what testnet is or why the colors are green.
    it('explains what testnet is, what green means, and links back to mainnet', () => {
      renderHomePageTestnet();
      const intro = screen.getByTestId('testnet-intro');
      expect(intro).toHaveTextContent(/separate DigiByte network for testing/i);
      expect(intro).toHaveTextContent(/coins have no value/i);
      expect(intro).toHaveTextContent(/green/i);
      expect(within(intro).getByRole('link', { name: /mainnet/i })).toHaveAttribute('href', '/');
    });

    it('does not state mainnet facts on testnet', () => {
      renderHomePageTestnet();
      expect(screen.queryByText(/January 10th, 2014/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Jan 10th, 2014/)).not.toBeInTheDocument();
      expect(screen.queryByText(/until the maximum supply of 21 billion DGB is reached/)).not.toBeInTheDocument();
      expect(screen.getByText(/Total blocks on testnet/i)).toBeInTheDocument();
    });

    it('keeps the mainnet intro on mainnet (no testnet intro)', () => {
      renderWithProviders(<HomePage numberWithCommas={(x) => String(x)} formatNumber={(x) => String(x)} />);
      expect(screen.queryByTestId('testnet-intro')).not.toBeInTheDocument();
      expect(screen.getByText(/launched on January 10th, 2014/)).toBeInTheDocument();
    });

    it('should close testnet WebSocket connection on unmount', async () => {
      const { unmount } = renderHomePageTestnet();

      await waitForAsync();
      const ws = webSocketInstances[0];

      unmount();

      expect(ws.readyState).toBe(WebSocket.CLOSED);
    });
  });
});
