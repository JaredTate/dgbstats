import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import TaprootPage from '../../../pages/TaprootPage';
import { renderWithProviders, createWebSocketMock, waitForAsync } from '../../utils/testUtils';
import { mockApiResponses, generateWebSocketMessage } from '../../mocks/mockData';

// Mock the config
vi.mock('../../../config', () => ({
  default: {
    apiBaseUrl: 'http://localhost:5001',
    wsBaseUrl: 'ws://localhost:5002'
  }
}));

describe.skip('TaprootPage - SKIPPED: Page not active', () => {
  let wsSetup;
  let mockWebSocket;
  let webSocketInstances;

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
      renderWithProviders(<TaprootPage />);
      
      expect(screen.getByText('Taproot Activation Status')).toBeInTheDocument();
    });

    it('should render activation status section', () => {
      renderWithProviders(<TaprootPage />);
      
      expect(screen.getByText('Is Taproot Active?')).toBeInTheDocument();
      expect(screen.getByText('NO')).toBeInTheDocument(); // Initial state before WebSocket data
    });

    it('should render recent support section', () => {
      renderWithProviders(<TaprootPage />);
      
      expect(screen.getByText('Recent Taproot Support')).toBeInTheDocument();
      expect(screen.getByText('0.0%')).toBeInTheDocument(); // Initial state
      expect(screen.getByText('Blocks supporting Taproot last 1 hour')).toBeInTheDocument();
    });

    it('should render activation details section', () => {
      renderWithProviders(<TaprootPage />);
      
      expect(screen.getByText('Activation Details')).toBeInTheDocument();
    });

    it('should render current state section', () => {
      renderWithProviders(<TaprootPage />);
      
      expect(screen.getByText('Current State')).toBeInTheDocument();
      expect(screen.getByText('Activation Progress')).toBeInTheDocument();
    });

    it('should render BIP9 educational content', () => {
      renderWithProviders(<TaprootPage />);
      
      expect(screen.getByText('BIP 9 Soft Fork Process')).toBeInTheDocument();
      expect(screen.getByText(/BIP 9 is a mechanism used by DigiByte/)).toBeInTheDocument();
    });

    it('should render technical parameters section', () => {
      renderWithProviders(<TaprootPage />);
      
      expect(screen.getByText('DigiByte Taproot Activation Parameters')).toBeInTheDocument();
    });
  });

  describe('WebSocket Connection', () => {
    it('should establish WebSocket connection on mount', async () => {
      renderWithProviders(<TaprootPage />);
      
      await waitForAsync();
      
      expect(mockWebSocket).toHaveBeenCalledWith('ws://localhost:5002');
      expect(webSocketInstances.length).toBe(1);
      expect(webSocketInstances[0].readyState).toBe(WebSocket.OPEN);
    });

    it('should handle WebSocket connection open', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      renderWithProviders(<TaprootPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      // Trigger onopen
      ws.onopen({ type: 'open' });
      
      expect(consoleLogSpy).toHaveBeenCalledWith('WebSocket connection established for Taproot page');
      
      consoleLogSpy.mockRestore();
    });

    it('should close WebSocket connection on unmount', async () => {
      const { unmount } = renderWithProviders(<TaprootPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      unmount();
      
      expect(ws.readyState).toBe(WebSocket.CLOSED);
    });
  });

  describe('Activation Status Display', () => {
    it('should display YES when taproot is active', async () => {
      renderWithProviders(<TaprootPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      ws.onmessage({
        data: JSON.stringify({
          type: 'initialData',
          data: {
            blockchainInfo: {
              softforks: {
                taproot: {
                  type: 'bip9',
                  active: true,
                  height: 12345678,
                  bip9: {
                    status: 'active',
                    since: 12345678
                  }
                }
              }
            }
          }
        })
      });
      
      await waitFor(() => {
        expect(screen.getByText('YES')).toBeInTheDocument();
      });
    });

    it('should display NO when taproot is not active', async () => {
      renderWithProviders(<TaprootPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      ws.onmessage({
        data: JSON.stringify({
          type: 'initialData',
          data: {
            blockchainInfo: {
              softforks: {
                taproot: {
                  type: 'bip9',
                  active: false,
                  bip9: {
                    status: 'started'
                  }
                }
              }
            }
          }
        })
      });
      
      await waitFor(() => {
        expect(screen.getByText('NO')).toBeInTheDocument();
      });
    });

    it('should highlight locked_in state', async () => {
      renderWithProviders(<TaprootPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      ws.onmessage({
        data: JSON.stringify({
          type: 'initialData',
          data: {
            blockchainInfo: {
              softforks: {
                taproot: {
                  type: 'bip9',
                  active: false,
                  bip9: {
                    status: 'locked_in',
                    since: 12345000,
                    statistics: {
                      period: 40320,
                      threshold: 28224,
                      elapsed: 1000,
                      count: 950,
                      possible: true
                    }
                  }
                }
              }
            }
          }
        })
      });
      
      await waitFor(() => {
        expect(screen.getByText('locked_in')).toBeInTheDocument();
        expect(screen.getByText('Yay! Taproot Locked In')).toBeInTheDocument();
      });
    });
  });

  describe('Signaling Progress', () => {
    it('should display signaling percentage and progress bar', async () => {
      renderWithProviders(<TaprootPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      ws.onmessage({
        data: JSON.stringify({
          type: 'initialData',
          data: {
            blockchainInfo: {
              softforks: {
                taproot: {
                  type: 'bip9',
                  active: false,
                  bip9: {
                    status: 'started',
                    statistics: {
                      period: 1000,
                      threshold: 700,
                      elapsed: 1000,
                      count: 945,
                      possible: true
                    }
                  }
                }
              }
            }
          }
        })
      });
      
      await waitFor(() => {
        // The component calculates 945/1000 * 100 = 94.5%
        expect(screen.getByText(/Progress: 94.50%/)).toBeInTheDocument();
        expect(screen.getByText(/Need 70% for activation/)).toBeInTheDocument();
        
        // Progress bar
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toBeInTheDocument();
      });
    });

    it('should display statistics information', async () => {
      renderWithProviders(<TaprootPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      ws.onmessage({
        data: JSON.stringify({
          type: 'initialData',
          data: {
            blockchainInfo: {
              softforks: {
                taproot: {
                  type: 'bip9',
                  active: false,
                  bip9: {
                    status: 'started',
                    statistics: {
                      period: 1000,
                      threshold: 700,
                      elapsed: 500,
                      count: 450,
                      possible: true
                    }
                  }
                }
              }
            }
          }
        })
      });
      
      await waitFor(() => {
        expect(screen.getByText(/Supporting Blocks: 450 out of 1000 blocks/)).toBeInTheDocument();
        expect(screen.getByText(/Blocks Elapsed: 500/)).toBeInTheDocument();
        expect(screen.getByText(/Threshold Required: 700/)).toBeInTheDocument();
      });
    });

    it('should show activation possibility', async () => {
      renderWithProviders(<TaprootPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      ws.onmessage({
        data: JSON.stringify({
          type: 'initialData',
          data: {
            blockchainInfo: {
              softforks: {
                taproot: {
                  type: 'bip9',
                  active: false,
                  bip9: {
                    status: 'started',
                    statistics: {
                      period: 1000,
                      threshold: 700,
                      elapsed: 900,
                      count: 100,
                      possible: false
                    }
                  }
                }
              }
            }
          }
        })
      });
      
      await waitFor(() => {
        expect(screen.getByText('Activation Possible:')).toBeInTheDocument();
        expect(screen.getByText('No')).toBeInTheDocument();
      });
    });
  });

  describe('Recent Blocks Support', () => {
    it('should display recent blocks support percentage', async () => {
      renderWithProviders(<TaprootPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      // Send recent blocks data
      ws.onmessage({
        data: JSON.stringify({
          type: 'recentBlocks',
          data: [
            { height: 1, taprootSignaling: true },
            { height: 2, taprootSignaling: true },
            { height: 3, taprootSignaling: false },
            { height: 4, taprootSignaling: true }
          ]
        })
      });
      
      await waitFor(() => {
        // 3 out of 4 blocks = 75%
        expect(screen.getByText('75.0%')).toBeInTheDocument();
        expect(screen.getByText('(4 blocks analyzed)')).toBeInTheDocument();
        expect(screen.getByText('(3/4 supporting blocks)')).toBeInTheDocument();
      });
    });

    it('should update recent blocks on new block', async () => {
      renderWithProviders(<TaprootPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      // Send initial blocks
      ws.onmessage({
        data: JSON.stringify({
          type: 'recentBlocks',
          data: [
            { height: 1, taprootSignaling: true },
            { height: 2, taprootSignaling: false }
          ]
        })
      });
      
      await waitFor(() => {
        expect(screen.getByText('50.0%')).toBeInTheDocument();
      });
      
      // Send new block
      ws.onmessage({
        data: JSON.stringify({
          type: 'newBlock',
          data: { height: 3, taprootSignaling: true }
        })
      });
      
      await waitFor(() => {
        // Now 2 out of 3 blocks = 66.7%
        expect(screen.getByText('66.7%')).toBeInTheDocument();
        expect(screen.getByText('(3 blocks analyzed)')).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should update signaling progress in real-time', async () => {
      renderWithProviders(<TaprootPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      // Initial data
      ws.onmessage({
        data: JSON.stringify({
          type: 'initialData',
          data: {
            blockchainInfo: {
              softforks: {
                taproot: {
                  type: 'bip9',
                  active: false,
                  bip9: {
                    status: 'started',
                    statistics: {
                      period: 1000,
                      threshold: 700,
                      elapsed: 1000,
                      count: 945,
                      possible: true
                    }
                  }
                }
              }
            }
          }
        })
      });
      
      await waitFor(() => {
        expect(screen.getByText(/Progress: 94.50%/)).toBeInTheDocument();
      });
      
      // Updated data - simulating blockchain update
      ws.onmessage({
        data: JSON.stringify({
          type: 'initialData',
          data: {
            blockchainInfo: {
              softforks: {
                taproot: {
                  type: 'bip9',
                  active: false,
                  bip9: {
                    status: 'started',
                    statistics: {
                      period: 1000,
                      threshold: 700,
                      elapsed: 1000,
                      count: 950,
                      possible: true
                    }
                  }
                }
              }
            }
          }
        })
      });
      
      await waitFor(() => {
        expect(screen.getByText(/Progress: 95.00%/)).toBeInTheDocument();
        expect(screen.getByText(/Supporting Blocks: 950 out of 1000 blocks/)).toBeInTheDocument();
      });
    });
  });

  describe('Educational Content', () => {
    it('should display BIP9 process explanation', () => {
      renderWithProviders(<TaprootPage />);
      
      expect(screen.getByText('BIP 9 Soft Fork Process')).toBeInTheDocument();
      expect(screen.getByText(/BIP 9 is a mechanism used by DigiByte/)).toBeInTheDocument();
      expect(screen.getByText('DEFINED')).toBeInTheDocument();
      expect(screen.getByText('STARTED')).toBeInTheDocument();
      expect(screen.getByText('LOCKED_IN')).toBeInTheDocument();
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    });

    it('should display technical parameters', () => {
      renderWithProviders(<TaprootPage />);
      
      expect(screen.getByText('DigiByte Taproot Activation Parameters')).toBeInTheDocument();
      expect(screen.getByText(/Activation Window: 40,320 blocks/)).toBeInTheDocument();
      expect(screen.getByText(/Required Threshold: 28,224 blocks/)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle WebSocket errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      renderWithProviders(<TaprootPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      ws.triggerError(new Error('Connection failed'));
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('WebSocket error:', expect.any(Error));
      
      // Page should still render
      expect(screen.getByText('Taproot Activation Status')).toBeInTheDocument();
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle malformed WebSocket messages', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      renderWithProviders(<TaprootPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      // Send malformed data
      ws.onmessage({ data: 'invalid json' });
      
      // Should not crash
      expect(screen.getByText('Taproot Activation Status')).toBeInTheDocument();
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle missing data fields', async () => {
      renderWithProviders(<TaprootPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      // Send incomplete data
      ws.receiveMessage({
        type: 'taproot',
        data: {
          activated: true
          // Missing other fields
        }
      });
      
      await waitFor(() => {
        expect(screen.getByText('ACTIVATED')).toBeInTheDocument();
        // Should handle missing data gracefully
      });
    });
  });

  describe('Visual Indicators', () => {
    it('should use appropriate colors for activation status', async () => {
      renderWithProviders(<TaprootPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      ws.onmessage({
        data: JSON.stringify({
          type: 'initialData',
          data: {
            blockchainInfo: {
              softforks: {
                taproot: {
                  type: 'bip9',
                  active: true,
                  bip9: {
                    status: 'active'
                  }
                }
              }
            }
          }
        })
      });
      
      await waitFor(() => {
        const yesStatus = screen.getByText('YES');
        expect(yesStatus).toBeInTheDocument();
        // The component uses inline styles with color: '#4caf50' for YES
      });
    });

    it('should show progress bar with red threshold line', async () => {
      renderWithProviders(<TaprootPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      ws.onmessage({
        data: JSON.stringify({
          type: 'initialData',
          data: {
            blockchainInfo: {
              softforks: {
                taproot: {
                  type: 'bip9',
                  active: false,
                  bip9: {
                    status: 'started',
                    statistics: {
                      period: 1000,
                      threshold: 700,
                      elapsed: 1000,
                      count: 500,
                      possible: true
                    }
                  }
                }
              }
            }
          }
        })
      });
      
      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toBeInTheDocument();
        // Component includes a red line at 70% threshold
        expect(screen.getByText(/Need 70% for activation/)).toBeInTheDocument();
      });
    });

    it('should highlight current state in state progression', async () => {
      renderWithProviders(<TaprootPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      ws.onmessage({
        data: JSON.stringify({
          type: 'initialData',
          data: {
            blockchainInfo: {
              softforks: {
                taproot: {
                  type: 'bip9',
                  active: false,
                  bip9: {
                    status: 'started'
                  }
                }
              }
            }
          }
        })
      });
      
      await waitFor(() => {
        // The component shows all states but highlights the current one
        expect(screen.getByText('defined')).toBeInTheDocument();
        expect(screen.getByText('started')).toBeInTheDocument();
        expect(screen.getByText('locked_in')).toBeInTheDocument();
        expect(screen.getByText('active')).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should stack sections on mobile', () => {
      // Mock mobile viewport
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));
      
      renderWithProviders(<TaprootPage />);
      
      // Sections should be stacked vertically
      const sections = screen.getAllByRole('region');
      expect(sections.length).toBeGreaterThan(0);
    });

    it('should adjust progress bar size on mobile', async () => {
      // Mock mobile viewport
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));
      
      renderWithProviders(<TaprootPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      ws.receiveMessage(generateWebSocketMessage('taproot'));
      
      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      renderWithProviders(<TaprootPage />);
      
      const h4 = screen.getByRole('heading', { level: 4 });
      expect(h4).toHaveTextContent('Taproot Activation Status');
      
      const h5s = screen.getAllByRole('heading', { level: 5 });
      expect(h5s.length).toBeGreaterThan(0);
    });

    it('should have accessible progress indicators', async () => {
      renderWithProviders(<TaprootPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      ws.onmessage({
        data: JSON.stringify({
          type: 'initialData',
          data: {
            blockchainInfo: {
              softforks: {
                taproot: {
                  type: 'bip9',
                  active: false,
                  bip9: {
                    status: 'started',
                    statistics: {
                      period: 1000,
                      threshold: 700,
                      elapsed: 500,
                      count: 450,
                      possible: true
                    }
                  }
                }
              }
            }
          }
        })
      });
      
      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toBeInTheDocument();
        // MUI LinearProgress has built-in accessibility
      });
    });

    it('should provide text for all important information', async () => {
      renderWithProviders(<TaprootPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      ws.onmessage({
        data: JSON.stringify({
          type: 'initialData',
          data: {
            blockchainInfo: {
              softforks: {
                taproot: {
                  type: 'bip9',
                  active: false,
                  bip9: {
                    status: 'started',
                    statistics: {
                      period: 1000,
                      threshold: 700,
                      elapsed: 500,
                      count: 450,
                      possible: true
                    }
                  }
                }
              }
            }
          }
        })
      });
      
      await waitFor(() => {
        // Check for text content
        expect(screen.getByText('Is Taproot Active?')).toBeInTheDocument();
        expect(screen.getByText('NO')).toBeInTheDocument();
        expect(screen.getByText('Activation Progress')).toBeInTheDocument();
        expect(screen.getByText(/Activation Possible:/)).toBeInTheDocument();
      });
    });

    it('should display status information clearly', async () => {
      renderWithProviders(<TaprootPage />);
      
      await waitForAsync();
      const ws = webSocketInstances[0];
      
      ws.onmessage({
        data: JSON.stringify({
          type: 'initialData', 
          data: {
            blockchainInfo: {
              softforks: {
                taproot: {
                  type: 'bip9',
                  active: true,
                  height: 12345678,
                  bip9: {
                    status: 'active',
                    since: 12345678
                  }
                }
              }
            }
          }
        })
      });
      
      await waitFor(() => {
        // Status section should display activation details
        expect(screen.getByText('YES')).toBeInTheDocument();
        expect(screen.getByText(/Status: active/)).toBeInTheDocument();
        expect(screen.getByText(/Activation Height: 12345678/)).toBeInTheDocument();
      });
    });
  });
});