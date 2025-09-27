import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import DigiDollarPage from '../../../pages/DigiDollarPage';
import { renderWithProviders } from '../../utils/testUtils';

describe('DigiDollarPage', () => {
  describe('Rendering', () => {
    it('should render the hero section with title and description', () => {
      renderWithProviders(<DigiDollarPage />);

      expect(screen.getByText('DigiDollar')).toBeInTheDocument();
      expect(screen.getByText('Decentralized USD Stablecoin on DigiByte')).toBeInTheDocument();
      expect(screen.getByText(/world's first truly decentralized stablecoin native on a UTXO blockchain/)).toBeInTheDocument();
    });

    it('should render the status alert', () => {
      renderWithProviders(<DigiDollarPage />);

      expect(screen.getByText(/In planning phase - Development will begin following community consensus/)).toBeInTheDocument();
    });

    it('should render all main sections', () => {
      renderWithProviders(<DigiDollarPage />);

      // Main sections
      expect(screen.getByText('What is DigiDollar?')).toBeInTheDocument();
      expect(screen.getByText('How It Works')).toBeInTheDocument();
      expect(screen.getByText('Collateral Requirements')).toBeInTheDocument();
      expect(screen.getByText('Revolutionary Use Cases')).toBeInTheDocument();
      expect(screen.getByText('Technical Implementation')).toBeInTheDocument();
      expect(screen.getByText('Development Roadmap')).toBeInTheDocument();
      expect(screen.getByText('Learn More')).toBeInTheDocument();
    });

    it('should render the simple explanation', () => {
      renderWithProviders(<DigiDollarPage />);

      expect(screen.getByText('Simple Explanation')).toBeInTheDocument();
      expect(screen.getByText(/proposed stable digital currency that would always equal \$1 USD/)).toBeInTheDocument();
    });

    it('should render the key benefits', () => {
      renderWithProviders(<DigiDollarPage />);

      expect(screen.getByText('Key Benefits')).toBeInTheDocument();
      expect(screen.getByText('World\'s first truly decentralized stablecoin on UTXO blockchain')).toBeInTheDocument();
      expect(screen.getByText('Always worth $1 USD - stable and predictable')).toBeInTheDocument();
      expect(screen.getByText('You keep full control of private keys in Core wallet')).toBeInTheDocument();
    });

    it('should render the how it works steps', () => {
      renderWithProviders(<DigiDollarPage />);

      expect(screen.getByText('1. Lock DGB Collateral')).toBeInTheDocument();
      expect(screen.getByText('2. Mint DigiDollars')).toBeInTheDocument();
      expect(screen.getByText('3. Use & Redeem')).toBeInTheDocument();
    });

    it('should render the collateral table', () => {
      renderWithProviders(<DigiDollarPage />);

      // Table headers
      expect(screen.getByText('Lock Period')).toBeInTheDocument();
      expect(screen.getByText('Collateral Ratio')).toBeInTheDocument();
      expect(screen.getByText('DGB for $100 DigiDollar')).toBeInTheDocument();

      // Sample data
      expect(screen.getByText('30 days')).toBeInTheDocument();
      expect(screen.getByText('400%')).toBeInTheDocument();
      expect(screen.getByText('10 years')).toBeInTheDocument();
      expect(screen.getByText('150%')).toBeInTheDocument();
    });

    it('should render use cases', () => {
      renderWithProviders(<DigiDollarPage />);

      expect(screen.getByText('Corporate Bonds')).toBeInTheDocument();
      expect(screen.getByText('Real Estate')).toBeInTheDocument();
      expect(screen.getByText('Autonomous Vehicles')).toBeInTheDocument();
      expect(screen.getByText('Global Remittances')).toBeInTheDocument();
      expect(screen.getByText('Healthcare Payments')).toBeInTheDocument();
    });

    it('should render technical implementation details', () => {
      renderWithProviders(<DigiDollarPage />);

      expect(screen.getByText('Core Technologies')).toBeInTheDocument();
      expect(screen.getByText('Taproot Integration')).toBeInTheDocument();
      expect(screen.getByText('Decentralized Oracles')).toBeInTheDocument();
      expect(screen.getByText('MAST Implementation')).toBeInTheDocument();
    });

    it('should render the roadmap phases', () => {
      renderWithProviders(<DigiDollarPage />);

      expect(screen.getByText('Phase 1')).toBeInTheDocument();
      expect(screen.getByText('Proposal & Design')).toBeInTheDocument();
      expect(screen.getByText('Phase 2')).toBeInTheDocument();
      expect(screen.getByText('Taproot Foundation')).toBeInTheDocument();
      expect(screen.getByText('Phase 3')).toBeInTheDocument();
      expect(screen.getByText('Oracle Integration')).toBeInTheDocument();
      expect(screen.getByText('Phase 4')).toBeInTheDocument();
      expect(screen.getByText('MainNet Launch')).toBeInTheDocument();
    });

    it('should render resource links', () => {
      renderWithProviders(<DigiDollarPage />);

      const whitepaperButton = screen.getByRole('link', { name: /White Paper/i });
      expect(whitepaperButton).toHaveAttribute('href', 'https://github.com/orgs/DigiByte-Core/discussions/319');

      const techSpecsButton = screen.getByRole('link', { name: /Tech Specs/i });
      expect(techSpecsButton).toHaveAttribute('href', 'https://github.com/orgs/DigiByte-Core/discussions/324');

      const useCasesButton = screen.getByRole('link', { name: /50 Use Cases/i });
      expect(useCasesButton).toHaveAttribute('href', 'https://github.com/orgs/DigiByte-Core/discussions/325');
    });
  });
});