import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MiningGuideCallout from '../../../components/MiningGuideCallout';

const GUIDE_URL = 'https://github.com/DigiByte-Core/digibyte/blob/develop/DIGIDOLLAR_MINING_INTEGRATION_GUIDE.md';

describe('MiningGuideCallout', () => {
  it('renders a call-to-action linking to the Mining Integration Guide', () => {
    render(<MiningGuideCallout />);

    const link = screen.getByRole('link', { name: /Mining Integration Guide/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', GUIDE_URL);
  });

  it('opens the guide safely in a new tab', () => {
    render(<MiningGuideCallout />);

    const link = screen.getByRole('link', { name: /Mining Integration Guide/i });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('tells pool operators the getblocktemplate change needed for DigiDollar', () => {
    render(<MiningGuideCallout />);

    expect(screen.getByText(/digidollar-oracle/)).toBeInTheDocument();
    expect(screen.getByText(/getblocktemplate/)).toBeInTheDocument();
    expect(screen.getByText(/default_oracle_commitment/)).toBeInTheDocument();
  });
});
