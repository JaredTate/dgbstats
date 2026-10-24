import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor, act } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { NetworkProvider } from '../../../context/NetworkContext';
import { renderWithProviders } from '../../utils/testUtils';
import Header from '../../../components/Header';

const primaryNav = () => screen.getByRole('navigation', { name: 'Primary navigation' });
const bottomNav = () => screen.getByRole('navigation', { name: 'Bottom navigation' });

describe('Header', () => {
  describe('Top bar', () => {
    it('shows the logo and title as a link home', () => {
      renderWithProviders(<Header />, { network: 'mainnet' });
      expect(screen.getByAltText('DigiByte Logo')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /DigiByte Stats home/i })).toHaveAttribute('href', '/');
    });

    it('links the logo to the testnet home on testnet and shows the TESTNET chip', () => {
      renderWithProviders(<Header />, { network: 'testnet', route: '/testnet' });
      expect(screen.getByRole('link', { name: /DigiByte Stats home/i })).toHaveAttribute('href', '/testnet');
      expect(screen.getAllByText('TESTNET').length).toBeGreaterThan(0);
    });

    it('does not show the TESTNET chip on mainnet', () => {
      renderWithProviders(<Header />, { network: 'mainnet' });
      expect(screen.queryByText('TESTNET')).not.toBeInTheDocument();
    });

    it('has a Mainnet / Testnet switch that marks the current network', () => {
      renderWithProviders(<Header />, { network: 'testnet', route: '/testnet' });
      const sw = screen.getByRole('group', { name: 'Network' });
      expect(within(sw).getByRole('link', { name: 'Mainnet' })).toHaveAttribute('href', '/');
      const testnet = within(sw).getByRole('link', { name: 'Testnet' });
      expect(testnet).toHaveAttribute('href', '/testnet');
      expect(testnet).toHaveAttribute('aria-current', 'true');
    });

    it('has no hamburger menu button', () => {
      renderWithProviders(<Header />, { network: 'mainnet' });
      expect(screen.queryByRole('button', { name: /^menu$/i })).not.toBeInTheDocument();
      expect(screen.queryByTestId('MenuIcon')).not.toBeInTheDocument();
    });
  });

  describe('Desktop menus', () => {
    it('shows Home and four group menus', () => {
      renderWithProviders(<Header />, { network: 'mainnet' });
      const nav = primaryNav();
      expect(within(nav).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
      ['Blockchain', 'Mining', 'DigiDollar', 'More'].forEach((label) => {
        const btn = within(nav).getByRole('button', { name: label });
        expect(btn).toHaveAttribute('aria-haspopup', 'true');
        expect(btn).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('opens a group menu with plain descriptions and closes it with Escape', async () => {
      renderWithProviders(<Header />, { network: 'mainnet' });
      const miningButton = within(primaryNav()).getByRole('button', { name: 'Mining' });
      fireEvent.click(miningButton);
      const menu = await screen.findByRole('menu', { name: 'Mining' });
      const difficulty = within(menu).getByRole('menuitem', { name: /Difficulty/ });
      expect(difficulty).toHaveAttribute('href', '/difficulties');
      expect(within(menu).getByText('How hard each algorithm is to mine now')).toBeInTheDocument();
      expect(miningButton).toHaveAttribute('aria-expanded', 'true');
      fireEvent.keyDown(menu, { key: 'Escape' });
      await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    });

    it('opens outside sites from the More menu in a new tab', async () => {
      renderWithProviders(<Header />, { network: 'mainnet' });
      fireEvent.click(within(primaryNav()).getByRole('button', { name: 'More' }));
      const menu = await screen.findByRole('menu', { name: 'More' });
      const explorer = within(menu).getByRole('menuitem', { name: /DigiExplorer/ });
      expect(explorer).toHaveAttribute('href', 'https://digiexplorer.info/');
      expect(explorer).toHaveAttribute('target', '_blank');
      expect(explorer).toHaveAttribute('rel', 'noopener noreferrer');
      expect(within(menu).getByRole('menuitem', { name: /Downloads/ })).toHaveAttribute('href', '/downloads');
    });

    it('marks the group of the current page', () => {
      renderWithProviders(<Header />, { network: 'mainnet', route: '/hashrate' });
      expect(within(primaryNav()).getByRole('button', { name: 'Mining' })).toHaveAttribute('aria-current', 'true');
      expect(within(primaryNav()).getByRole('button', { name: 'Blockchain' })).not.toHaveAttribute('aria-current');
    });

    it('marks Home on the home page', () => {
      renderWithProviders(<Header />, { network: 'mainnet', route: '/' });
      expect(within(primaryNav()).getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
    });

    it('uses /testnet paths and testnet pages on testnet', async () => {
      renderWithProviders(<Header />, { network: 'testnet', route: '/testnet' });
      expect(within(primaryNav()).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/testnet');
      fireEvent.click(within(primaryNav()).getByRole('button', { name: 'DigiDollar' }));
      const menu = await screen.findByRole('menu', { name: 'DigiDollar' });
      expect(within(menu).getByRole('menuitem', { name: /Wallet Convert/ })).toHaveAttribute('href', '/testnet/convert');
      expect(within(menu).getByRole('menuitem', { name: /Price Oracles/ })).toHaveAttribute('href', '/testnet/oracles');
    });
  });

  describe('Phone bottom bar', () => {
    it('shows five tabs, each with an icon and a word', () => {
      renderWithProviders(<Header />, { network: 'mainnet' });
      const nav = bottomNav();
      const home = within(nav).getByRole('link', { name: 'Home' });
      expect(home).toHaveAttribute('href', '/');
      expect(home.querySelector('svg')).not.toBeNull();
      ['Blockchain', 'Mining', 'DigiDollar', 'More'].forEach((label) => {
        const tab = within(nav).getByRole('button', { name: label });
        expect(tab.querySelector('svg')).not.toBeNull();
        expect(tab).toHaveTextContent(label);
        expect(tab).toHaveAttribute('aria-haspopup', 'dialog');
      });
    });

    it('slides up a sheet with the group pages and their descriptions', async () => {
      renderWithProviders(<Header />, { network: 'mainnet' });
      fireEvent.click(within(bottomNav()).getByRole('button', { name: 'Blockchain' }));
      const sheet = await screen.findByRole('dialog', { name: 'Blockchain' });
      const links = within(sheet).getAllByRole('link');
      expect(links.map((a) => a.getAttribute('href'))).toEqual(['/blocks', '/txs', '/supply', '/tips', '/nodes']);
      expect(within(sheet).getByText('Live and recent transactions')).toBeInTheDocument();
    });

    it('closes the sheet after picking a page', async () => {
      renderWithProviders(<Header />, { network: 'mainnet' });
      fireEvent.click(within(bottomNav()).getByRole('button', { name: 'Mining' }));
      const sheet = await screen.findByRole('dialog', { name: 'Mining' });
      fireEvent.click(within(sheet).getByRole('link', { name: /Hashrate/ }));
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(window.location.pathname).toBe('/hashrate');
    });

    it('closes the sheet with the Close button', async () => {
      renderWithProviders(<Header />, { network: 'mainnet' });
      fireEvent.click(within(bottomNav()).getByRole('button', { name: 'More' }));
      const sheet = await screen.findByRole('dialog', { name: 'More' });
      fireEvent.click(within(sheet).getByRole('button', { name: 'Close' }));
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });

    it('highlights the tab of the current page', () => {
      renderWithProviders(<Header />, { network: 'mainnet', route: '/oracles' });
      expect(within(bottomNav()).getByRole('button', { name: 'DigiDollar' })).toHaveAttribute('aria-current', 'true');
      expect(within(bottomNav()).getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
    });

    it('uses testnet pages in the testnet sheets', async () => {
      renderWithProviders(<Header />, { network: 'testnet', route: '/testnet/blocks' });
      expect(within(bottomNav()).getByRole('button', { name: 'Blockchain' })).toHaveAttribute('aria-current', 'true');
      fireEvent.click(within(bottomNav()).getByRole('button', { name: 'Mining' }));
      const sheet = await screen.findByRole('dialog', { name: 'Mining' });
      expect(within(sheet).queryByRole('link', { name: /Mining Pools/ })).not.toBeInTheDocument();
      expect(within(sheet).getByRole('link', { name: /Pool Upgrades/ })).toHaveAttribute('href', '/testnet/pool-upgrades');
    });
  });

  // Fuzz: any URL on either network renders, with at most one active tab per bar.
  describe('Header fuzz', () => {
    let seed = 0xbeef;
    const rand = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    const pieces = ['blocks', 'txs', 'supply', 'tips', 'nodes', 'algos', 'pools', 'convert', 'activation', 'x', '%20', '..', ''];
    const randomRoute = (base) => {
      const n = Math.floor(rand() * 3);
      let p = base;
      for (let i = 0; i < n; i += 1) p += `/${pieces[Math.floor(rand() * pieces.length)]}`;
      return p || '/';
    };

    it('renders for 60 random routes without throwing', () => {
      for (let i = 0; i < 60; i += 1) {
        const testnet = rand() < 0.5;
        const route = randomRoute(testnet ? '/testnet' : '');
        const { unmount } = renderWithProviders(<Header />, { network: testnet ? 'testnet' : 'mainnet', route });
        const active = within(bottomNav()).queryAllByRole((role, el) => el.getAttribute('aria-current') !== null && (role === 'button' || role === 'link'));
        expect(active.length).toBeLessThanOrEqual(1);
        unmount();
      }
    });
  });
});

// CHAOS-6/7/8/9: menus and sheets that stayed open (or closed by accident).
describe('Header: menus and sheets close at the right time', () => {
  let navigate;
  const Grab = () => {
    navigate = useNavigate();
    return null;
  };
  const renderAt = (path = '/blocks') => render(
    <NetworkProvider network="mainnet">
      <MemoryRouter initialEntries={['/', path]} initialIndex={1}>
        <Grab />
        <Header />
      </MemoryRouter>
    </NetworkProvider>
  );
  const openSheet = async (label) => {
    fireEvent.click(within(bottomNav()).getByRole('button', { name: label }));
    return screen.findByRole('dialog', { name: label });
  };
  const backdrop = () => document.querySelector('.MuiBackdrop-root');

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('closes the bottom sheet on browser Back and Forward (CHAOS-6)', async () => {
    renderAt();
    await openSheet('Mining');
    act(() => navigate(-1));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await openSheet('More');
    act(() => navigate(1));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('ignores the second tap of a double-tap on a tab (CHAOS-7)', async () => {
    let now = 1000000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    renderAt();
    await openSheet('Blockchain');
    now += 120; // second tap lands on the backdrop
    fireEvent.click(backdrop());
    expect(screen.getByRole('dialog', { name: 'Blockchain' })).toBeInTheDocument();
    now += 600; // a real tap outside later still closes it
    fireEvent.click(backdrop());
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('closes the bottom sheet when the screen widens to desktop (CHAOS-8)', async () => {
    let desktop = false;
    const lists = [];
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => {
      const isMd = /min-width:\s*900px/.test(query);
      const mql = {
        media: query,
        get matches() { return isMd && desktop; },
        listeners: [],
        addListener(fn) { this.listeners.push(fn); },
        removeListener(fn) { this.listeners = this.listeners.filter((l) => l !== fn); },
        addEventListener(_t, fn) { this.listeners.push(fn); },
        removeEventListener(_t, fn) { this.listeners = this.listeners.filter((l) => l !== fn); },
      };
      lists.push(mql);
      return mql;
    });
    renderAt();
    await openSheet('More');
    desktop = true;
    act(() => {
      lists.forEach((mql) => mql.listeners.forEach((fn) => fn({ matches: mql.matches, media: mql.media })));
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('closes the desktop group menu on browser Back (CHAOS-9)', async () => {
    renderAt();
    fireEvent.click(within(primaryNav()).getByRole('button', { name: 'Mining' }));
    await screen.findByRole('menu', { name: 'Mining' });
    act(() => navigate(-1));
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });
});
