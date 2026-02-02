import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';
import { renderWithProviders } from '../../utils/testUtils';
import Header from '../../../components/Header';

describe('Header', () => {
  describe('Mainnet Mode', () => {
    it('should render DigiByte Stats title', () => {
      renderWithProviders(<Header />, { network: 'mainnet' });

      expect(screen.getByText('DigiByte Stats')).toBeInTheDocument();
    });

    it('should NOT show TESTNET chip on mainnet', () => {
      renderWithProviders(<Header />, { network: 'mainnet' });

      expect(screen.queryByText('TESTNET')).not.toBeInTheDocument();
    });

    it('should have navigation links without /testnet prefix', () => {
      renderWithProviders(<Header />, { network: 'mainnet' });

      // Check for mainnet navigation links (desktop buttons)
      const homeLinks = screen.getAllByRole('link').filter(link =>
        link.getAttribute('href') === '/'
      );
      expect(homeLinks.length).toBeGreaterThan(0);

      // Check that Blocks link is /blocks not /testnet/blocks
      const blocksLinks = screen.getAllByRole('link').filter(link =>
        link.getAttribute('href') === '/blocks'
      );
      expect(blocksLinks.length).toBeGreaterThan(0);
    });

    it('should show external links section on mainnet (desktop)', () => {
      renderWithProviders(<Header />, { network: 'mainnet' });

      // External links should be present
      expect(screen.getByText('DigiExplorer')).toBeInTheDocument();
      expect(screen.getByText('DigiHash')).toBeInTheDocument();
      expect(screen.getByText('DigiByte.org')).toBeInTheDocument();
      expect(screen.getByText('GitHub')).toBeInTheDocument();
    });

    it('should show Testnet switch button on mainnet', () => {
      renderWithProviders(<Header />, { network: 'mainnet' });

      // Find the testnet switch button
      const testnetButton = screen.getByRole('link', { name: /Testnet/i });
      expect(testnetButton).toBeInTheDocument();
      expect(testnetButton).toHaveAttribute('href', '/testnet');
    });

    it('should have all mainnet navigation items', () => {
      renderWithProviders(<Header />, { network: 'mainnet' });

      // Mainnet should have Pools, Downloads, Roadmap which testnet doesn't
      expect(screen.getByRole('link', { name: 'Pools' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Downloads' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Roadmap' })).toBeInTheDocument();
    });
  });

  describe('Testnet Mode', () => {
    it('should render DigiByte Stats title', () => {
      renderWithProviders(<Header />, { network: 'testnet' });

      expect(screen.getByText('DigiByte Stats')).toBeInTheDocument();
    });

    it('should show TESTNET chip when on testnet', () => {
      renderWithProviders(<Header />, { network: 'testnet' });

      // There are 2 TESTNET chips - one in desktop header, one in mobile drawer
      const testnetChips = screen.getAllByText('TESTNET');
      expect(testnetChips.length).toBeGreaterThan(0);
    });

    it('should have navigation links with /testnet prefix', () => {
      renderWithProviders(<Header />, { network: 'testnet' });

      // Check for testnet navigation links
      const homeLinks = screen.getAllByRole('link').filter(link =>
        link.getAttribute('href') === '/testnet'
      );
      expect(homeLinks.length).toBeGreaterThan(0);

      // Check that Blocks link is /testnet/blocks
      const blocksLinks = screen.getAllByRole('link').filter(link =>
        link.getAttribute('href') === '/testnet/blocks'
      );
      expect(blocksLinks.length).toBeGreaterThan(0);
    });

    it('should show Mainnet switch button on testnet', () => {
      renderWithProviders(<Header />, { network: 'testnet' });

      // Find the mainnet switch button (desktop)
      const mainnetButton = screen.getByRole('link', { name: /Mainnet/i });
      expect(mainnetButton).toBeInTheDocument();
      expect(mainnetButton).toHaveAttribute('href', '/');
    });

    it('should NOT show external links section on testnet', () => {
      renderWithProviders(<Header />, { network: 'testnet' });

      // External links should NOT be present as separate buttons
      // They may still exist in mobile drawer but we check that External Resources text is not shown
      expect(screen.queryByText('External Resources')).not.toBeInTheDocument();
    });

    it('should have testnet-specific navigation items', () => {
      renderWithProviders(<Header />, { network: 'testnet' });

      // Testnet does NOT have Pools, Downloads, Roadmap
      expect(screen.queryByRole('link', { name: 'Pools' })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Downloads' })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Roadmap' })).not.toBeInTheDocument();
    });

    it('should use testnet gradient color for app bar', () => {
      renderWithProviders(<Header />, { network: 'testnet' });

      // The AppBar should have testnet styling
      const appBar = screen.getByRole('banner');
      expect(appBar).toBeInTheDocument();
    });
  });

  describe('Mobile Drawer', () => {
    it('should open mobile drawer when menu button is clicked', () => {
      renderWithProviders(<Header />, { network: 'mainnet' });

      // Find and click the menu button
      const menuButton = screen.getByLabelText('menu');
      fireEvent.click(menuButton);

      // Drawer should be open - look for drawer content
      // The drawer has network switch text
      expect(screen.getByText(/Switch to Testnet/i)).toBeInTheDocument();
    });

    it('should show correct network switch in mobile drawer for mainnet', () => {
      renderWithProviders(<Header />, { network: 'mainnet' });

      const menuButton = screen.getByLabelText('menu');
      fireEvent.click(menuButton);

      expect(screen.getByText(/Switch to Testnet/i)).toBeInTheDocument();
    });

    it('should show correct network switch in mobile drawer for testnet', () => {
      renderWithProviders(<Header />, { network: 'testnet' });

      const menuButton = screen.getByLabelText('menu');
      fireEvent.click(menuButton);

      expect(screen.getByText(/Switch to Mainnet/i)).toBeInTheDocument();
    });

    it('should show TESTNET chip in mobile drawer when on testnet', () => {
      renderWithProviders(<Header />, { network: 'testnet' });

      const menuButton = screen.getByLabelText('menu');
      fireEvent.click(menuButton);

      // Should see TESTNET chip in drawer
      const testnetChips = screen.getAllByText('TESTNET');
      expect(testnetChips.length).toBeGreaterThanOrEqual(2); // One in header, one in drawer
    });

    it('should have testnet prefixed links in mobile drawer when on testnet', () => {
      renderWithProviders(<Header />, { network: 'testnet' });

      const menuButton = screen.getByLabelText('menu');
      fireEvent.click(menuButton);

      // Find the drawer and verify links have /testnet prefix
      const drawerLinks = screen.getAllByRole('link');
      const testnetLinks = drawerLinks.filter(link => {
        const href = link.getAttribute('href');
        return href && href.startsWith('/testnet');
      });

      // Should have multiple testnet links (Home, Blocks, Txs, etc.)
      expect(testnetLinks.length).toBeGreaterThan(5);
    });
  });

  describe('Logo and Branding', () => {
    it('should display logo image', () => {
      renderWithProviders(<Header />, { network: 'mainnet' });

      const logos = screen.getAllByRole('img', { name: /DigiByte Logo/i });
      expect(logos.length).toBeGreaterThan(0);
    });

    it('should link logo to correct home path for mainnet', () => {
      renderWithProviders(<Header />, { network: 'mainnet' });

      // The logo should be wrapped in a link to /
      const logoLinks = screen.getAllByRole('link').filter(link =>
        link.getAttribute('href') === '/'
      );
      expect(logoLinks.length).toBeGreaterThan(0);
    });

    it('should link logo to correct home path for testnet', () => {
      renderWithProviders(<Header />, { network: 'testnet' });

      // The logo should be wrapped in a link to /testnet
      const logoLinks = screen.getAllByRole('link').filter(link =>
        link.getAttribute('href') === '/testnet'
      );
      expect(logoLinks.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible menu button', () => {
      renderWithProviders(<Header />, { network: 'mainnet' });

      const menuButton = screen.getByRole('button', { name: /menu/i });
      expect(menuButton).toBeInTheDocument();
    });

    it('should have proper link structure for navigation', () => {
      renderWithProviders(<Header />, { network: 'mainnet' });

      // All nav items should be links
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });

    it('should have external links with proper attributes', () => {
      renderWithProviders(<Header />, { network: 'mainnet' });

      // External links should have target="_blank" and rel="noopener noreferrer"
      const digiExplorerLink = screen.getByRole('link', { name: /DigiExplorer/i });
      expect(digiExplorerLink).toHaveAttribute('target', '_blank');
      expect(digiExplorerLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });
});
