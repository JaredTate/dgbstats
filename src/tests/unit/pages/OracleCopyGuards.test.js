import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('RC42 oracle copy guards', () => {
  const pageSources = [
    'OraclesPage.js',
    'DigiDollarPage.js',
    'RoadmapPage.js'
  ].map((file) => fs.readFileSync(path.join(process.cwd(), 'src/pages', file), 'utf8')).join('\n');

  it('should not publish stale oracle protocol or exchange-count copy', () => {
    expect(pageSources).not.toMatch(/CoinMarketCap/);
    expect(pageSources).not.toMatch(/7 exchange APIs|7 exchanges/);
    expect(pageSources).not.toMatch(/individual fallback \(v0x02\)|v0x02 bundles/);
    expect(pageSources).not.toMatch(/Price updates every 15 seconds/);
  });

  it('should not describe testnet25 onboarding as a generic GitHub key submission', () => {
    expect(pageSources).not.toMatch(/simple 3-step process/);
    expect(pageSources).not.toMatch(/Step 2: Submit Public Key/);
    expect(pageSources).not.toMatch(/Submit Your Key on GitHub/);
  });

  it('should not publish stale pre-RC42 active-oracle roster copy', () => {
    expect(pageSources).not.toMatch(/17 active launch operators|17 active launch slots|17 active slots/);
    expect(pageSources).not.toMatch(/slot 0-16|slots 17-34/);
  });
});
