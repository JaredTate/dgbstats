import { describe, it, expect } from 'vitest';
import { screen, fireEvent, within, waitFor } from '@testing-library/react';
import ChainTipsExplainer from '../../../components/ChainTipsExplainer';
import { renderWithProviders } from '../../utils/testUtils';

// The six educational section headings, in render order.
const HEADINGS = [
  'What is a chain tip?',
  'What is an orphan / stale block?',
  'Why does DigiByte produce them?',
  'Tip statuses',
  'Branch length & reorganizations (reorgs)',
  'When is it a real fork risk?',
];

// The five getchaintips statuses shown as colour-coded chips.
const STATUS_NAMES = ['active', 'valid-fork', 'valid-headers', 'headers-only', 'invalid'];

describe('ChainTipsExplainer', () => {
  it('renders the section title and the root data-testid', () => {
    renderWithProviders(<ChainTipsExplainer />);
    expect(screen.getByTestId('chain-tips-explainer')).toBeInTheDocument();
    expect(screen.getByText('Understanding Chain Tips & Orphans')).toBeInTheDocument();
  });

  it('renders all six topic headings', () => {
    renderWithProviders(<ChainTipsExplainer accentColor="#123456" />);
    HEADINGS.forEach((heading) => {
      expect(screen.getByText(heading)).toBeInTheDocument();
    });
  });

  it('shows the first topic body by default (default-expanded)', () => {
    renderWithProviders(<ChainTipsExplainer />);
    expect(screen.getByTestId('topic-body-0')).toBeInTheDocument();
    expect(screen.getByText(/newest block of any chain branch/i)).toBeInTheDocument();
  });

  it('expanding a collapsed accordion reveals its body text', async () => {
    renderWithProviders(<ChainTipsExplainer />);
    // The second topic is collapsed by default, so its body is not mounted yet.
    expect(screen.queryByTestId('topic-body-1')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('What is an orphan / stale block?'));

    await waitFor(() => {
      expect(screen.getByTestId('topic-body-1')).toBeInTheDocument();
    });
    expect(screen.getByText(/real mining work that didn't make the canonical chain/i)).toBeInTheDocument();
  });

  it('renders the five tip-status chips with their status names', async () => {
    renderWithProviders(<ChainTipsExplainer />);
    // "Tip statuses" is collapsed by default — expand it to reveal the legend.
    fireEvent.click(screen.getByText('Tip statuses'));
    const legend = await screen.findByTestId('status-legend');
    STATUS_NAMES.forEach((name) => {
      expect(within(legend).getByText(name)).toBeInTheDocument();
    });
  });

  it('renders under the testnet network without crashing', () => {
    renderWithProviders(<ChainTipsExplainer />, { network: 'testnet' });
    expect(screen.getByTestId('chain-tips-explainer')).toBeInTheDocument();
    expect(screen.getByText('When is it a real fork risk?')).toBeInTheDocument();
  });
});
