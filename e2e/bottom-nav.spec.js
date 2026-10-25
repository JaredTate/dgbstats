import { test, expect } from '@playwright/test';

// Functional tests for the 2026-10 navigation: phone bottom tab bar + desktop group menus.
// Run with: npx playwright test e2e/bottom-nav.spec.js --project=chromium --project="Mobile Chrome" --project="Mobile Safari"

const bottomBar = (page) => page.getByRole('navigation', { name: 'Bottom navigation' });
const topNav = (page) => page.getByRole('navigation', { name: 'Primary navigation' });

async function noSideScroll(page) {
  const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
  expect(sw).toBeLessThanOrEqual(iw);
}

test.describe('Phone', () => {
  test.beforeEach(({ isMobile }) => test.skip(!isMobile, 'phone-only'));

  test('shows a bottom tab bar with icons and no hamburger', async ({ page }) => {
    await page.goto('/');
    const bar = bottomBar(page);
    await expect(bar).toBeVisible();
    await expect(topNav(page)).toBeHidden();
    for (const label of ['Home', 'Blockchain', 'Mining', 'DigiDollar', 'More']) {
      const tab = bar.getByText(label, { exact: true });
      await expect(tab).toBeVisible();
    }
    expect(await bar.locator('svg').count()).toBeGreaterThanOrEqual(5);
    await expect(page.getByRole('button', { name: /^menu$/i })).toHaveCount(0);
    // Tabs are big enough to tap.
    const box = await bar.getByRole('button', { name: 'Mining' }).boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(48);
    expect(box.width).toBeGreaterThanOrEqual(56);
    // The bar sits at the bottom of the screen.
    const vp = page.viewportSize();
    const barBox = await bar.boundingBox();
    expect(Math.round(barBox.y + barBox.height)).toBeGreaterThanOrEqual(vp.height - 1);
    await noSideScroll(page);
  });

  test('opens a sheet, goes to a page, and highlights its tab', async ({ page }) => {
    await page.goto('/');
    await bottomBar(page).getByRole('button', { name: 'Blockchain' }).click();
    const sheet = page.getByRole('dialog', { name: 'Blockchain' });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByText('Live and recent transactions')).toBeVisible();
    await sheet.getByRole('link', { name: /^Transactions/ }).click();
    await expect(page).toHaveURL(/\/txs$/);
    await expect(sheet).toBeHidden();
    await expect(bottomBar(page).getByRole('button', { name: 'Blockchain' })).toHaveAttribute('aria-current', 'true');
  });

  // CHAOS-6: the sheet stayed open (scroll locked) after browser Back.
  test('browser Back closes an open sheet', async ({ page }) => {
    await page.goto('/');
    // Go to /blocks inside the app, so Back is an in-app navigation.
    await bottomBar(page).getByRole('button', { name: 'Blockchain' }).click();
    await page.getByRole('dialog', { name: 'Blockchain' }).getByRole('link', { name: /^Blocks/ }).click();
    await expect(page).toHaveURL(/\/blocks$/);
    await bottomBar(page).getByRole('button', { name: 'Mining' }).click();
    const sheet = page.getByRole('dialog', { name: 'Mining' });
    await expect(sheet).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect(sheet).toBeHidden();
  });

  // CHAOS-7: the 2nd tap of a double-tap hit the backdrop and closed the sheet.
  test('double-tapping a tab leaves its sheet open', async ({ page }) => {
    await page.goto('/blocks');
    await bottomBar(page).getByRole('button', { name: 'More' }).dblclick();
    await page.waitForTimeout(400);
    await expect(page.getByRole('dialog', { name: 'More' })).toBeVisible();
  });

  // CHAOS-8: the sheet stayed open on the desktop layout after widening.
  test('widening to desktop closes an open sheet', async ({ page }) => {
    await page.goto('/blocks');
    await bottomBar(page).getByRole('button', { name: 'More' }).click();
    const sheet = page.getByRole('dialog', { name: 'More' });
    await expect(sheet).toBeVisible();
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(sheet).toBeHidden();
    await topNav(page).getByRole('button', { name: 'Mining' }).click({ timeout: 5000 });
  });

  test('every group sheet lists its pages and fits the screen', async ({ page }) => {
    await page.goto('/');
    const expected = {
      Blockchain: ['Blocks', 'Transactions', 'Supply', 'Chain Tips & Forks', 'Nodes'],
      Mining: ['Algorithms', 'Difficulty', 'Hashrate', 'Mining Pools', 'Pool Upgrades'],
      DigiDollar: ['What is DigiDollar', 'DigiDollar Stats', 'Price Oracles'],
      More: ['Downloads', 'Roadmap', 'DigiExplorer'],
    };
    for (const [group, labels] of Object.entries(expected)) {
      await bottomBar(page).getByRole('button', { name: group }).click();
      const sheet = page.getByRole('dialog', { name: group });
      await expect(sheet).toBeVisible();
      for (const l of labels) await expect(sheet.getByRole('link', { name: new RegExp(`^${l.replace(/[.*+?^${}()|[\]\\&]/g, '\\$&')}`) })).toBeVisible();
      await sheet.getByRole('button', { name: 'Close' }).click();
      await expect(sheet).toBeHidden();
    }
  });

  test('the bar does not cover the footer', async ({ page }) => {
    await page.goto('/supply');
    // Live data keeps growing the page for a moment; scroll once it settles.
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const footer = page.getByRole('contentinfo');
    const fBox = await footer.boundingBox();
    const barBox = await bottomBar(page).boundingBox();
    expect(fBox.y + fBox.height).toBeLessThanOrEqual(barBox.y + 2);
  });

  test('testnet sheets use testnet pages', async ({ page }) => {
    await page.goto('/testnet');
    await bottomBar(page).getByRole('button', { name: 'DigiDollar' }).click();
    const sheet = page.getByRole('dialog', { name: 'DigiDollar' });
    await expect(sheet.getByRole('link', { name: /^Wallet Convert/ })).toHaveAttribute('href', '/testnet/convert');
    await sheet.getByRole('link', { name: /^Price Oracles/ }).click();
    await expect(page).toHaveURL(/\/testnet\/oracles$/);
  });

  for (const path of ['/', '/blocks', '/txs', '/digidollar', '/testnet', '/testnet/convert']) {
    test(`no sideways scroll on ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(bottomBar(page)).toBeVisible();
      await noSideScroll(page);
    });
  }
});

// SLOW-6 / SLOW-8: large text and tap sizes on a small phone.
test.describe('Small phone, large text', () => {
  test.beforeEach(({ isMobile, browserName }) => {
    test.skip(!isMobile || browserName !== 'chromium', 'needs a Chromium phone (CDP font size)');
  });

  test('fits a 360 px screen at a 32 px default font, with all five tabs on screen', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Page.setFontSizes', { fontSizes: { standard: 32, fixed: 26 } });
    for (const path of ['/', '/blocks']) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await noSideScroll(page);
      const bar = bottomBar(page);
      for (const label of ['Home', 'Blockchain', 'Mining', 'DigiDollar', 'More']) {
        const box = await bar.getByText(label, { exact: true }).boundingBox();
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(361);
      }
    }
    await bottomBar(page).getByRole('button', { name: 'More' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('Mainnet / Testnet links are at least 44 px tall', async ({ page }) => {
    await page.goto('/');
    const sw = page.getByRole('group', { name: 'Network' });
    for (const name of ['Mainnet', 'Testnet']) {
      const box = await sw.getByRole('link', { name }).boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });
});

test.describe('Desktop', () => {
  test.beforeEach(({ isMobile }) => test.skip(isMobile, 'desktop-only'));

  test('one top bar with Home and four menus; no bottom bar', async ({ page }) => {
    await page.goto('/');
    const nav = topNav(page);
    await expect(nav).toBeVisible();
    await expect(bottomBar(page)).toBeHidden();
    await expect(nav.getByRole('link', { name: 'Home' })).toBeVisible();
    for (const label of ['Blockchain', 'Mining', 'DigiDollar', 'More']) {
      await expect(nav.getByRole('button', { name: label })).toBeVisible();
    }
    await noSideScroll(page);
  });

  test('a menu opens with descriptions and goes to the page', async ({ page }) => {
    await page.goto('/');
    await topNav(page).getByRole('button', { name: 'Mining' }).click();
    const menu = page.getByRole('menu', { name: 'Mining' });
    await expect(menu.getByText('How hard each algorithm is to mine now')).toBeVisible();
    await menu.getByRole('menuitem', { name: /^Difficulty/ }).click();
    await expect(page).toHaveURL(/\/difficulties$/);
    await expect(topNav(page).getByRole('button', { name: 'Mining' })).toHaveAttribute('aria-current', 'true');
  });

  test('menus work with the keyboard', async ({ page }) => {
    await page.goto('/');
    await topNav(page).getByRole('button', { name: 'Blockchain' }).focus();
    await page.keyboard.press('Enter');
    const menu = page.getByRole('menu', { name: 'Blockchain' });
    await expect(menu).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(topNav(page).getByRole('button', { name: 'Blockchain' })).toBeFocused();
    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/txs$/);
  });

  for (const width of [900, 1024, 1280, 1440]) {
    test(`top bar fits on one row at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
      const bar = page.locator('header').first();
      const box = await bar.boundingBox();
      expect(box.height).toBeLessThanOrEqual(72);
      await noSideScroll(page);
    });
  }
});

test.describe('Home tiles', () => {
  test('every tile is a door', async ({ page }) => {
    await page.goto('/');
    const tiles = [
      // A tile's accessible name is its visible text: title first, action last.
      [/^Total Transactions.*View transactions/i, /\/txs$/],
      [/^Total Blocks.*See latest blocks/i, /\/blocks$/],
      [/^Algo Difficulties.*View difficulty charts/i, /\/difficulties$/],
    ];
    for (const [name, url] of tiles) {
      await page.getByRole('link', { name }).click();
      await expect(page).toHaveURL(url);
      await page.goBack();
    }
    await expect(page.getByRole('link', { name: /^Latest Version.*Download DigiByte Core/i })).toHaveAttribute('href', '/downloads');
  });

  // FIRST-TIMER-16: no menu-like icon next to the home title.
  test('the home title has no icon next to it', async ({ page }) => {
    await page.goto('/');
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1.locator('xpath=..').locator('svg')).toHaveCount(0);
  });
});

// WEIRD-INPUT-9: near-miss URLs end on the real page.
test.describe('Near-miss URLs', () => {
  for (const [from, to] of [['/BLOCKS', '/blocks'], ['/blocks.html', '/blocks'], ['/index.html', '/'], ['/testnet/Blocks.html', '/testnet/blocks']]) {
    test(`${from} goes to ${to}`, async ({ page }) => {
      await page.goto(from);
      await expect(page).toHaveURL(new RegExp(`${to.replace(/\//g, '\\/')}$`));
      await expect(page.getByRole('heading', { level: 1 })).not.toHaveText('Page not found');
    });
  }
});
