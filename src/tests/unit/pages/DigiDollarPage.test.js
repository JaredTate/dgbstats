import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import DigiDollarPage from '../../../pages/DigiDollarPage';
import { renderWithProviders } from '../../utils/testUtils';
import { contrastRatio } from '../../utils/contrast';
import { CORE_RELEASE } from '../../../coreRelease';

const pageText = () => document.body.textContent;

describe('DigiDollarPage', () => {
  describe('Rendering', () => {
    it('should render the hero section with title and description', () => {
      renderWithProviders(<DigiDollarPage />);

      expect(screen.getByText('DigiDollar')).toBeInTheDocument();
      expect(screen.getByText('Decentralized USD Stablecoin on DigiByte')).toBeInTheDocument();
      expect(screen.getAllByText(/A time-locked UTXO stablecoin built into DigiByte Core/).length).toBeGreaterThan(0);
    });

    it('should render the status alert', () => {
      renderWithProviders(<DigiDollarPage />);

      expect(screen.getAllByText(/Status:/).length).toBeGreaterThan(0);
      // Shipped on mainnet in v9.26.2, active since block 23,869,440; current release v9.26.7
      expect(screen.getAllByText(/Active on mainnet since block 23,869,440/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/v9\.26\.7/).length).toBeGreaterThan(0);
      expect(screen.getAllByText((_, el) => el?.tagName === 'P' && /Current release: v9\.26\.7\./.test(el.textContent)).length).toBeGreaterThan(0);
      expect(screen.queryByText(/in miners. hands/)).not.toBeInTheDocument();
      expect(screen.queryByText(/activation pending/)).not.toBeInTheDocument();
    });

    it('should render all main sections', () => {
      renderWithProviders(<DigiDollarPage />);

      expect(screen.getByText('What is DigiDollar?')).toBeInTheDocument();
      expect(screen.getByText('How It Works')).toBeInTheDocument();
      expect(screen.getByText('Risks')).toBeInTheDocument();
      expect(screen.getByText('Collateral Requirements')).toBeInTheDocument();
      expect(screen.getByText('Possible Uses')).toBeInTheDocument();
      expect(screen.getByText('Technical Implementation')).toBeInTheDocument();
      expect(screen.getByText('How the System Handles Price Drops')).toBeInTheDocument();
      expect(screen.getByText('Development Roadmap')).toBeInTheDocument();
      expect(screen.getByText('Learn More')).toBeInTheDocument();
    });

    it('should render the simple explanation', () => {
      renderWithProviders(<DigiDollarPage />);

      expect(screen.getByText('Simple Explanation')).toBeInTheDocument();
      expect(screen.getByText(/DigiDollar is a stablecoin designed to track \$1 USD/)).toBeInTheDocument();
    });

    it('should render the key features', () => {
      renderWithProviders(<DigiDollarPage />);

      expect(screen.getAllByText('Key Features').length).toBeGreaterThan(0);
      expect(screen.getByText('Designed to track $1 USD (market price not guaranteed)')).toBeInTheDocument();
      expect(screen.getByText('You keep your private keys in DigiByte Core wallet')).toBeInTheDocument();
      expect(screen.getByText(/Fees paid in DGB \(minimum 0\.1 DGB per DigiDollar transaction\)/)).toBeInTheDocument();
    });

    it('should render the how it works steps', () => {
      renderWithProviders(<DigiDollarPage />);

      expect(screen.getByText('1. Lock DGB Collateral')).toBeInTheDocument();
      expect(screen.getByText('2. Mint DigiDollars')).toBeInTheDocument();
      expect(screen.getByText('3. Use & Redeem')).toBeInTheDocument();
      expect(screen.getByText(/at least \$100 and at most \$100,000/)).toBeInTheDocument();
    });

    it('should render the collateral table', () => {
      renderWithProviders(<DigiDollarPage />);

      expect(screen.getByText('Lock Period')).toBeInTheDocument();
      expect(screen.getByText('Collateral Ratio')).toBeInTheDocument();
      expect(screen.getAllByText(/DGB for \$100/).length).toBeGreaterThan(0);
      expect(screen.getAllByText('30 days').length).toBeGreaterThan(0);
      expect(screen.getAllByText('500%').length).toBeGreaterThan(0);
      expect(screen.getAllByText('10 years').length).toBeGreaterThan(0);
      expect(screen.getAllByText('200%').length).toBeGreaterThan(0);
      expect(screen.getByText(/fixed ratios, not price predictions/)).toBeInTheDocument();
    });

    it('should render possible uses without market-size claims', () => {
      renderWithProviders(<DigiDollarPage />);

      expect(screen.getByText('Payments Priced in Dollars')).toBeInTheDocument();
      expect(screen.getByText('Sending Money Across Borders')).toBeInTheDocument();
      expect(pageText()).not.toMatch(/Trillion|Billion market|Corporate Bonds|Real Estate/);
    });

    it('should render technical implementation details', () => {
      renderWithProviders(<DigiDollarPage />);

      expect(screen.getByText('Core Technologies')).toBeInTheDocument();
      expect(screen.getByText('Taproot Integration')).toBeInTheDocument();
      expect(screen.getByText('Decentralized Oracles')).toBeInTheDocument();
      expect(screen.getByText('MAST Implementation')).toBeInTheDocument();
    });

    it('should show the oracle network on mainnet and testnet26', () => {
      renderWithProviders(<DigiDollarPage />);

      expect(screen.getAllByText(/mainnet and testnet26/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/v9\.26\.0-RC44/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/7-of-35 MuSig2/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/six active exchange APIs|six active exchanges/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/v0x03/i).length).toBeGreaterThan(0);
      expect(pageText()).not.toMatch(/Live on testnet26 \(port 12033\)/);
      expect(screen.queryByText(/v9\.26\.0-RC42/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/testnet24/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/CoinMarketCap/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/7 exchange APIs/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/v0x02/i)).not.toBeInTheDocument();
    });

    it('should render the roadmap phases', () => {
      renderWithProviders(<DigiDollarPage />);

      expect(screen.getByText('Development Roadmap')).toBeInTheDocument();
      expect(screen.getAllByText(/Phase|Complete|Implementation|Oracle/).length).toBeGreaterThan(0);
    });

    it('should render resource links', () => {
      renderWithProviders(<DigiDollarPage />);

      expect(screen.getByRole('link', { name: /White Paper/i }))
        .toHaveAttribute('href', 'https://github.com/orgs/DigiByte-Core/discussions/319');
      expect(screen.getByRole('link', { name: /Tech Specs/i }))
        .toHaveAttribute('href', 'https://github.com/orgs/DigiByte-Core/discussions/324');
      expect(screen.getByRole('link', { name: /50 Use Cases/i }))
        .toHaveAttribute('href', 'https://github.com/orgs/DigiByte-Core/discussions/325');
    });
  });

  describe('Disclaimers and risks', () => {
    it('should show the experimental-software disclaimer near the top', () => {
      renderWithProviders(<DigiDollarPage />);

      expect(screen.getByText('Experimental software. Please read.')).toBeInTheDocument();
      expect(pageText()).toMatch(/You can lose money\./);
      expect(pageText()).toMatch(/its market price is not guaranteed/);
      expect(pageText()).toMatch(/not financial, investment, legal or tax advice/);
    });

    it('should list the risks', () => {
      renderWithProviders(<DigiDollarPage />);

      ['Software risk.', 'Lock risk.', 'Price risk.', 'Oracle risk.', 'Pauses and adjustments.', 'Network upgrades.', 'Tax and legal.']
        .forEach((label) => expect(screen.getByText(label)).toBeInTheDocument());
    });

    it('should tell node operators about Thaw Day', () => {
      renderWithProviders(<DigiDollarPage />);

      expect(screen.getAllByText(/24,490,000/).length).toBeGreaterThan(0);
      expect(pageText()).toMatch(/minimum v9\.26\.6/);
    });

    // FIRST-TIMER-20: one clear upgrade message: minimum v9.26.6, recommended = current release.
    it('gives the minimum and the recommended version together', () => {
      renderWithProviders(<DigiDollarPage />);
      expect(pageText()).toMatch(new RegExp(`minimum v9\\.26\\.6, recommended ${CORE_RELEASE.replace(/\./g, '\\.')}`));
      expect(pageText()).not.toMatch(/v9\.26\.6 or later/);
    });

    // FIRST-TIMER-17: spell out each term once, in plain words.
    it('spells out DCA, ERR, Thaw Day and MuSig2 in plain words', () => {
      renderWithProviders(<DigiDollarPage />);
      const text = pageText();
      expect(text).toMatch(/Dynamic Collateral Adjustment \(DCA\)/);
      expect(text).toMatch(/Emergency Redemption Ratio \(ERR\)/);
      expect(text).toMatch(/Thaw Day: the block where new DigiDollar rules start/);
      expect(text).toMatch(/MuSig2 \(the 7 oracle signatures are combined into one\)/);
      // DCA and ERR are spelled out where they are first used.
      expect(text.indexOf('DCA')).toBe(text.indexOf('(DCA)') + 1);
      expect(text.indexOf('ERR')).toBe(text.indexOf('(ERR)') + 1);
    });

    it('should describe the volatility pause as a protection layer', () => {
      renderWithProviders(<DigiDollarPage />);

      expect(screen.getByText(/Volatility Pause/)).toBeInTheDocument();
      expect(pageText()).toMatch(/20% or more/);
    });
  });

  describe('No investment or price language', () => {
    const banned = [
      /price support/i,
      /supply (squeeze|shock)/i,
      /upside/i,
      /apprecia/i,
      /strategic reserve/i,
      /tax advantage|tax-efficient|taxable event|capital gains/i,
      /billionaire/i,
      /wealth/i,
      /10x gain|future gains/i,
      /always worth/i,
      /ALWAYS get 100%/,
      /\$0\.01/,
      /drives price|higher DGB price/i,
      /benefits all DGB holders/i,
      /more scarce|extreme scarcity|scarcity/i,
      /world's first/i,
      /revolutionary/i,
      /paradigm shift/i,
      /trustless/i,
      /\btokens?\b/i,
      /appear identical on-chain/i,
      /batch signature verification/i,
      /CHECKSEQUENCEVERIFY/,
      /22-byte/,
      /miners can now signal/i,
      /minting stops/i,
      /36 hours/,
      /depends solely on miner signaling/i,
    ];

    it.each(banned.map((re) => [re]))('should not contain %s', (re) => {
      renderWithProviders(<DigiDollarPage />);
      expect(pageText()).not.toMatch(re);
    });
  });

  // FIRST-TIMER-19: axe color-contrast and scrollable-region-focusable on /digidollar.
  describe('Accessibility', () => {
    const LIGHT = '#f8f9fa';
    it.each(['2. Oracle Verification', '3. Redemption Process', '3️⃣ Emergency Redemption Ratio', '4️⃣ Volatility Pause'])(
      'gives the "%s" heading at least 4.5:1 contrast', (heading) => {
        renderWithProviders(<DigiDollarPage />);
        const el = screen.getByText(heading);
        expect(contrastRatio(getComputedStyle(el).color, LIGHT)).toBeGreaterThanOrEqual(4.5);
      });

    it.each([`SHIPPED — ${CORE_RELEASE}`, 'MAINNET RELEASED'])('gives the "%s" chip readable white text', (label) => {
      renderWithProviders(<DigiDollarPage />);
      const chip = screen.getByText(label).closest('.MuiChip-root');
      expect(contrastRatio('#ffffff', getComputedStyle(chip).backgroundColor)).toBeGreaterThanOrEqual(4.5);
    });

    it('gives the testnet quick start note readable text', () => {
      renderWithProviders(<DigiDollarPage />);
      const el = screen.getByText(/Both guides include a testnet quick start/);
      expect(contrastRatio(getComputedStyle(el).color, '#ffffff')).toBeGreaterThanOrEqual(4.5);
    });

    it('lets keyboard users focus every scrolling box', () => {
      renderWithProviders(<DigiDollarPage />);
      const scrollers = [...document.querySelectorAll('*')].filter((el) => /auto|scroll/.test(getComputedStyle(el).overflowY + getComputedStyle(el).overflowX));
      expect(scrollers.length).toBeGreaterThanOrEqual(3);
      scrollers.forEach((el) => {
        expect(el.getAttribute('tabindex')).toBe('0');
        expect(el.getAttribute('aria-label')).toBeTruthy();
      });
    });

    // SLOW-8: the documentation buttons are at least 44 px tall.
    it('makes the documentation buttons at least 44 px tall', () => {
      renderWithProviders(<DigiDollarPage />);
      const btn = screen.getByRole('link', { name: /Oracle Explainer/ });
      expect(getComputedStyle(btn).minHeight).toBe('44px');
    });
  });
});
