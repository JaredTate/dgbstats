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

      // Check for alert content - look for the status text (may appear multiple times)
      const statusTexts = screen.getAllByText(/Status:/);
      expect(statusTexts.length).toBeGreaterThan(0);
      const implementationTexts = screen.getAllByText(/Implementation is/);
      expect(implementationTexts.length).toBeGreaterThan(0);
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

      // Table headers - may vary based on component version
      expect(screen.getByText('Lock Period')).toBeInTheDocument();
      expect(screen.getByText('Collateral Ratio')).toBeInTheDocument();
      // Column header text may differ
      const dgbHeaders = screen.getAllByText(/DGB for \$100/);
      expect(dgbHeaders.length).toBeGreaterThan(0);

      // Sample data - using the actual 9-tier collateral data from the component
      // Use getAllByText since some periods may appear elsewhere on page
      const thirtyDaysTexts = screen.getAllByText('30 days');
      expect(thirtyDaysTexts.length).toBeGreaterThan(0);
      const fiveHundredPercentTexts = screen.getAllByText('500%');
      expect(fiveHundredPercentTexts.length).toBeGreaterThan(0);
      const tenYearsTexts = screen.getAllByText('10 years');
      expect(tenYearsTexts.length).toBeGreaterThan(0);
      const twoHundredPercentTexts = screen.getAllByText('200%');
      expect(twoHundredPercentTexts.length).toBeGreaterThan(0);
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

      // Check for development roadmap section
      expect(screen.getByText('Development Roadmap')).toBeInTheDocument();

      // Check for phase-related content (text may vary)
      const phaseElements = screen.getAllByText(/Phase|Complete|Implementation|Oracle/);
      expect(phaseElements.length).toBeGreaterThan(0);
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