import { test, expect, devices } from '@playwright/test';

// Test on multiple mobile devices
const mobileDevices = [
  { name: 'iPhone 12', device: devices['iPhone 12'] },
  { name: 'Pixel 5', device: devices['Pixel 5'] },
  { name: 'iPhone SE', device: devices['iPhone SE'] },
  { name: 'Galaxy S9+', device: devices['Galaxy S9+'] }
];

mobileDevices.forEach(({ name, device }) => {
  test.describe(`Mobile Testing - ${name}`, () => {
    test.use(device);

    test('HomePage - mobile layout and navigation', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check mobile menu
      const menuButton = page.locator('[aria-label="menu"], .mobile-menu-button');
      await expect(menuButton).toBeVisible();
      
      // Open mobile menu
      await menuButton.click();
      
      // Check navigation items
      await expect(page.locator('text=Pools')).toBeVisible();
      await expect(page.locator('text=Nodes')).toBeVisible();
      await expect(page.locator('text=Supply')).toBeVisible();
      
      // Navigate to another page
      await page.locator('text=Pools').click();
      await expect(page).toHaveURL('/pools');
    });

    test('HomePage - responsive stat cards', async ({ page }) => {
      await page.goto('/');
      
      // Stat cards should stack vertically
      const statCards = page.locator('.stat-card');
      const count = await statCards.count();
      
      if (count >= 2) {
        const firstCard = await statCards.first().boundingBox();
        const secondCard = await statCards.nth(1).boundingBox();
        
        if (firstCard && secondCard) {
          // Cards should be stacked
          expect(secondCard.y).toBeGreaterThan(firstCard.y);
        }
      }
    });

    test('PoolsPage - mobile pie chart', async ({ page }) => {
      await page.goto('/pools');
      await page.waitForLoadState('networkidle');
      
      // Chart should be visible
      const chart = page.locator('#poolsChart');
      await expect(chart).toBeVisible();
      
      // Chart should fit mobile screen
      const chartBox = await chart.boundingBox();
      if (chartBox) {
        expect(chartBox.width).toBeLessThanOrEqual(device.viewport.width);
      }
      
      // Miner list should be scrollable
      const minerList = page.locator('.miner-list-container');
      await expect(minerList).toBeVisible();
    });

    test('NodesPage - mobile map interaction', async ({ page }) => {
      await page.goto('/nodes');
      await page.waitForLoadState('networkidle');
      
      // Map should be visible
      const map = page.locator('#world-map svg');
      await expect(map).toBeVisible();
      
      // Map should be responsive
      const mapBox = await map.boundingBox();
      if (mapBox) {
        expect(mapBox.width).toBeLessThanOrEqual(device.viewport.width);
      }
      
      // Country list should be accessible
      const countryList = page.locator('.country-list-section');
      await expect(countryList).toBeVisible();
    });

    test('SupplyPage - mobile chart and stats', async ({ page }) => {
      await page.goto('/supply');
      await page.waitForLoadState('networkidle');
      
      // Stats should be visible
      const statCards = page.locator('.stat-card');
      await expect(statCards.first()).toBeVisible();
      
      // Chart should render
      const chart = page.locator('#supplyChart');
      await expect(chart).toBeVisible();
      
      // Scroll to chart
      await chart.scrollIntoViewIfNeeded();
      
      // Chart should fit screen
      const chartBox = await chart.boundingBox();
      if (chartBox) {
        expect(chartBox.width).toBeLessThanOrEqual(device.viewport.width);
      }
    });

    test('Touch interactions - swipe and tap', async ({ page }) => {
      await page.goto('/pools');
      await page.waitForLoadState('networkidle');
      
      // Test tap on miner item
      const minerItem = page.locator('.miner-list-item').first();
      await minerItem.tap();
      
      // Test swipe gesture on chart (if supported)
      const chart = page.locator('#poolsChart');
      const box = await chart.boundingBox();
      
      if (box) {
        // Simulate swipe
        await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      }
    });

    test('Mobile performance - page load times', async ({ page }) => {
      const pages = ['/', '/pools', '/nodes', '/supply', '/blocks'];
      
      for (const path of pages) {
        const startTime = Date.now();
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        const loadTime = Date.now() - startTime;
        
        // Mobile pages should load within 5 seconds
        expect(loadTime).toBeLessThan(5000);
        console.log(`${path} loaded in ${loadTime}ms on ${name}`);
      }
    });

    test('Orientation change handling', async ({ page, context }) => {
      await page.goto('/');
      
      // Portrait orientation (default)
      const portraitCards = await page.locator('.stat-card').count();
      
      // Switch to landscape
      await page.setViewportSize({ 
        width: device.viewport.height, 
        height: device.viewport.width 
      });
      await page.waitForTimeout(500);
      
      // Layout should adapt
      const landscapeCards = await page.locator('.stat-card').count();
      expect(landscapeCards).toBe(portraitCards);
      
      // Charts should resize
      const charts = page.locator('canvas, svg.chart');
      const chartCount = await charts.count();
      
      for (let i = 0; i < chartCount; i++) {
        await expect(charts.nth(i)).toBeVisible();
      }
    });

    test('Mobile-specific UI elements', async ({ page }) => {
      await page.goto('/');
      
      // Check for mobile-optimized buttons
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < Math.min(buttonCount, 3); i++) {
        const button = buttons.nth(i);
        const box = await button.boundingBox();
        
        if (box) {
          // Buttons should be touch-friendly (min 44px)
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
      
      // Check for mobile-specific classes
      const hasMobileClasses = await page.evaluate(() => {
        const elements = document.querySelectorAll('[class*="mobile"], [class*="Mobile"]');
        return elements.length > 0;
      });
      
      expect(hasMobileClasses).toBeTruthy();
    });

    test('Scroll performance on mobile', async ({ page }) => {
      await page.goto('/blocks');
      await page.waitForLoadState('networkidle');
      
      // Scroll to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      
      // Scroll back to top
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
      
      // Content should remain visible
      const blocks = page.locator('.block-item');
      await expect(blocks.first()).toBeVisible();
    });

    test('Mobile data usage optimization', async ({ page }) => {
      // Check for lazy loading images
      await page.goto('/');
      
      const images = await page.evaluate(() => {
        const imgs = document.querySelectorAll('img');
        return Array.from(imgs).map(img => ({
          src: img.src,
          loading: img.loading,
          hasLazyClass: img.className.includes('lazy')
        }));
      });
      
      // Some images should be optimized for mobile
      const hasOptimization = images.some(img => 
        img.loading === 'lazy' || img.hasLazyClass
      );
      
      console.log(`${name} - Image optimization: ${hasOptimization ? 'Yes' : 'No'}`);
    });
  });
});

// Additional mobile-specific tests
test.describe('Mobile Features', () => {
  test.use(devices['iPhone 12']);

  test('PWA installation prompt', async ({ page }) => {
    await page.goto('/');
    
    // Check for manifest
    const hasManifest = await page.evaluate(() => {
      const link = document.querySelector('link[rel="manifest"]');
      return link !== null;
    });
    
    expect(hasManifest).toBeTruthy();
  });

  test('Mobile offline behavior', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Go offline
    await context.setOffline(true);
    
    // Try to navigate
    await page.locator('text=Pools').click().catch(() => {});
    
    // Should show offline message or cached content
    const offlineIndicator = page.locator('text=/offline|connection|network/i');
    const hasOfflineHandling = await offlineIndicator.isVisible().catch(() => false);
    
    console.log(`Offline handling: ${hasOfflineHandling ? 'Yes' : 'No'}`);
  });
});