import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('RC43 oracle copy guards', () => {
  const pageSources = [
    'HomePage.js',
    'OraclesPage.js',
    'DigiDollarPage.js',
    'DDStatsPage.js',
    'WalletConvertPage.js',
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
    expect(pageSources).not.toMatch(/active slots|active testnet slots|Active slot/);
    expect(pageSources).not.toMatch(/slot 0-16|slots 17-34/);
  });

  it('should use public oracle signing words instead of protocol jargon', () => {
    expect(pageSources).not.toMatch(/In Current Epoch|In epoch|Signing price|Active slot/);
    expect(pageSources).not.toMatch(/Core does not currently expose the exact 9-oracle MuSig2 bundle signer list/);
    expect(pageSources).toMatch(/Part of Latest 9|Part of latest 9/);
    expect(pageSources).toMatch(/Latest 9 \/ Live|Live Price Feeds/);
  });

  it('should publish RC43 as the current testnet release, not RC42', () => {
    expect(pageSources).toMatch(/v9\.26\.0-RC43|RC43/);
    expect(pageSources).not.toMatch(/v9\.26\.0-RC42|RC42 Testnet Update|RC42 MuSig2 Context|RC42 Phase Two|current RC42/);
  });
});
