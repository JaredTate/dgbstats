import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import MainnetLayout from '../../../components/MainnetLayout';
import TestnetLayout from '../../../components/TestnetLayout';
import Footer from '../../../components/Footer';
import { NetworkProvider } from '../../../context/NetworkContext';
import { createWebSocketMock } from '../../utils/testUtils';

// FIRST-TIMER-19 (axe landmark-one-main / region): every page has one <main>
// that holds the page content. SLOW-8: footer icon links are 44 px.
describe('Layout landmarks', () => {
  let ws;
  beforeEach(() => {
    ws = createWebSocketMock();
    global.WebSocket = ws.MockWebSocket;
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
  });
  afterEach(() => {
    ws.instances.forEach((s) => s.close());
    ws.clearInstances();
    vi.restoreAllMocks();
  });

  const renderAt = (path) => render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<MainnetLayout />}>
          <Route path="/blocks" element={<p>mainnet page body</p>} />
        </Route>
        <Route path="/testnet" element={<TestnetLayout />}>
          <Route path="blocks" element={<p>testnet page body</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

  it.each([['/blocks', 'mainnet page body'], ['/testnet/blocks', 'testnet page body']])(
    'wraps the page content of %s in one <main>', (path, body) => {
      renderAt(path);
      const mains = screen.getAllByRole('main');
      expect(mains).toHaveLength(1);
      expect(within(mains[0]).getByText(body)).toBeInTheDocument();
    });

  // WEIRD-INPUT-9: both layouts send near-miss URLs to the real page.
  const Where = () => <p data-testid="where">{useLocation().pathname}</p>;
  it.each([['/BLOCKS', '/blocks'], ['/blocks.html', '/blocks'], ['/testnet/Blocks.html', '/testnet/blocks']])(
    'moves %s to %s inside the layout', async (from, to) => {
      render(
        <MemoryRouter initialEntries={[from]}>
          <Routes>
            <Route element={<MainnetLayout />}>
              <Route path="/blocks" element={<Where />} />
              <Route path="*" element={<Where />} />
            </Route>
            <Route path="/testnet" element={<TestnetLayout />}>
              <Route path="blocks" element={<Where />} />
              <Route path="*" element={<Where />} />
            </Route>
          </Routes>
        </MemoryRouter>
      );
      expect((await screen.findByTestId('where')).textContent).toBe(to);
    });

  it('makes the footer GitHub and X links at least 44 px', () => {
    render(<MemoryRouter><NetworkProvider network="mainnet"><Footer /></NetworkProvider></MemoryRouter>);
    ['GitHub', 'X (formerly Twitter)'].forEach((name) => {
      const link = screen.getByRole('link', { name });
      expect(getComputedStyle(link).width).toBe('44px');
      expect(getComputedStyle(link).height).toBe('44px');
    });
  });
});
