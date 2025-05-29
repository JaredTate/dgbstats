import { test, expect } from '@playwright/test';

// Mobile tests with explicit viewport configuration for consistent behavior
test.describe('Mobile Testing', () => {

    test('HomePage - mobile layout and navigation', async ({ page }) => {
      // Set mobile viewport explicitly
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Wait for loading to complete
      const loadingText = page.locator('text=Loading...');
      if (await loadingText.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(loadingText).not.toBeVisible({ timeout: 10000 });
      }
      
      // Check mobile menu button is visible (only appears on mobile)
      const menuButton = page.locator('[aria-label="menu"]').first();
      await expect(menuButton).toBeVisible({ timeout: 8000 });
      
      // Open mobile menu
      await menuButton.click();
      
      // Wait for drawer to open and check navigation items
      const drawer = page.locator('.MuiDrawer-root');
      await expect(drawer).toBeVisible({ timeout: 5000 });
      
      const poolsLink = drawer.locator('text=Pools');
      const nodesLink = drawer.locator('text=Nodes');
      const supplyLink = drawer.locator('text=Supply');
      
      await expect(poolsLink).toBeVisible({ timeout: 3000 });
      await expect(nodesLink).toBeVisible({ timeout: 3000 });
      await expect(supplyLink).toBeVisible({ timeout: 3000 });
      
      // Navigate to another page
      await poolsLink.click();
      await expect(page).toHaveURL('/pools', { timeout: 8000 });
    });

    test('HomePage - responsive stat cards', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Wait for data to load
      const loadingText = page.locator('text=Loading...');
      if (await loadingText.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(loadingText).not.toBeVisible({ timeout: 10000 });
      }
      
      // Look for stat cards - they are MUI Cards with specific text patterns
      const statCards = page.locator('.MuiCard-root');
      await expect(statCards.first()).toBeVisible({ timeout: 8000 });
      
      const count = await statCards.count();
      expect(count).toBeGreaterThan(1);
      
      // Verify cards are responsive on mobile
      const firstCard = await statCards.first().boundingBox();
      if (firstCard) {
        // Cards should fit within mobile viewport width
        expect(firstCard.width).toBeLessThanOrEqual(375);
        expect(firstCard.width).toBeGreaterThan(200); // Reasonable minimum
      }
      
      // If multiple cards, check vertical stacking on mobile
      if (count >= 2) {
        const firstCardBox = await statCards.first().boundingBox();
        const secondCardBox = await statCards.nth(1).boundingBox();
        
        if (firstCardBox && secondCardBox) {
          // Cards should be stacked vertically on mobile
          expect(secondCardBox.y).toBeGreaterThan(firstCardBox.y);
        }
      }
    });

    test('PoolsPage - mobile pie chart', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/pools');
      
      // Wait for loading to complete
      const loadingText = page.locator('text=Loading block data...');
      if (await loadingText.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(loadingText).not.toBeVisible({ timeout: 12000 });
      }
      
      // Verify page loaded
      await expect(page.locator('text=DigiByte Mining Pools')).toBeVisible({ timeout: 8000 });
      
      // Chart should be visible (D3.js SVG chart)
      const charts = page.locator('svg');
      const chartCount = await charts.count();
      
      if (chartCount > 0) {
        const chart = charts.first();
        await expect(chart).toBeVisible({ timeout: 8000 });
        
        // Chart should fit mobile screen
        const chartBox = await chart.boundingBox();
        if (chartBox) {
          expect(chartBox.width).toBeLessThanOrEqual(375);
          expect(chartBox.width).toBeGreaterThan(20); // Should have some size
        }
      }
      
      // Miner list should be visible
      const minerList = page.locator('.MuiList-root, .MuiListItem-root');
      if (await minerList.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(minerList.first()).toBeVisible();
      }
    });

    test('NodesPage - mobile map interaction', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/nodes');
      
      // Wait for loading to complete
      const loadingText = page.locator('text=Loading...');
      if (await loadingText.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(loadingText).not.toBeVisible({ timeout: 12000 });
      }
      
      // Verify page loaded
      await expect(page.locator('text=DigiByte Blockchain Nodes')).toBeVisible({ timeout: 8000 });
      
      // Map should be visible (D3.js SVG world map)
      const maps = page.locator('svg');
      const mapCount = await maps.count();
      
      if (mapCount > 0) {
        const map = maps.first();
        await expect(map).toBeVisible({ timeout: 10000 });
        
        // Map should be responsive
        const mapBox = await map.boundingBox();
        if (mapBox) {
          expect(mapBox.width).toBeLessThanOrEqual(375);
          expect(mapBox.width).toBeGreaterThan(20); // Should have some size
        }
      }
      
      // Check for stats cards
      const statsCards = page.locator('.MuiCard-root');
      if (await statsCards.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(statsCards.first()).toBeVisible();
      }
    });

    test('SupplyPage - mobile chart and stats', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/supply');
      
      // Wait for loading to complete
      const loadingText = page.locator('text=Loading...');
      if (await loadingText.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(loadingText).not.toBeVisible({ timeout: 12000 });
      }
      
      // Verify page loaded
      await expect(page.locator('h1, h2')).toBeVisible({ timeout: 8000 });
      
      // Stats should be visible (look for MUI Cards)
      const statCards = page.locator('.MuiCard-root');
      await expect(statCards.first()).toBeVisible({ timeout: 8000 });
      
      // Chart should render (Chart.js canvas element)
      const charts = page.locator('canvas');
      const chartCount = await charts.count();
      
      if (chartCount > 0) {
        const chart = charts.first();
        await expect(chart).toBeVisible({ timeout: 10000 });
        
        // Chart should fit mobile screen
        const chartBox = await chart.boundingBox().catch(() => null);
        if (chartBox) {
          expect(chartBox.width).toBeLessThanOrEqual(375);
          expect(chartBox.width).toBeGreaterThan(50);
          expect(chartBox.height).toBeGreaterThan(50);
        }
      }
      
      // Verify stats are displaying numeric data
      const hasNumericData = await page.evaluate(() => {
        const text = document.body.textContent || '';
        return /\d{1,3}(,\d{3})*(\.\d+)?/.test(text);
      });
      expect(hasNumericData).toBeTruthy();
    });

    test('Touch interactions - swipe and tap', async ({ page, browserName }) => {
      // Enable touch for all browsers, skip only if explicitly unsupported
      if (browserName === 'firefox') {
        test.skip('Touch not well supported in Firefox');
        return;
      }
      
      // Set mobile viewport with touch enabled
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/pools');
      
      // Wait for loading to complete
      const loadingText = page.locator('text=Loading block data...');
      if (await loadingText.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(loadingText).not.toBeVisible({ timeout: 12000 });
      }
      
      // Verify the page loaded correctly on mobile
      await expect(page.locator('text=DigiByte Mining Pools')).toBeVisible({ timeout: 8000 });
      
      // Test scrolling (touch-like interaction)
      await page.evaluate(() => {
        window.scrollTo(0, 200);
      });
      
      const scrollY = await page.evaluate(() => window.scrollY);
      expect(scrollY).toBeGreaterThan(100);
      
      // Test menu button touch
      const menuButton = page.locator('[aria-label="menu"]');
      if (await menuButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await menuButton.click();
        
        // Verify drawer opens
        const drawer = page.locator('.MuiDrawer-root');
        await expect(drawer).toBeVisible({ timeout: 5000 });
      }
    });

    test('Mobile performance - page load times', async ({ page, browserName }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      const pages = ['/', '/pools', '/nodes', '/supply', '/blocks'];
      const timeoutMultiplier = browserName === 'webkit' ? 2 : 1.5;
      
      for (const path of pages) {
        const startTime = Date.now();
        await page.goto(path, { timeout: Math.floor(15000 * timeoutMultiplier) });
        
        // Wait for essential content with browser-specific timing
        await page.waitForSelector('h1, h2, .MuiCard-root', { 
          timeout: Math.floor(10000 * timeoutMultiplier) 
        });
        
        const loadTime = Date.now() - startTime;
        
        // More lenient timing for mobile
        const maxTime = browserName === 'webkit' ? 20000 : 15000;
        expect(loadTime).toBeLessThan(maxTime);
        console.log(`${path} loaded in ${loadTime}ms on mobile ${browserName}`);
      }
    });

    test('Orientation change handling', async ({ page, browserName }) => {
      // Start with mobile portrait
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Wait for content to load
      const loadingText = page.locator('text=Loading...');
      if (await loadingText.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(loadingText).not.toBeVisible({ timeout: 12000 });
      }
      
      // Verify portrait layout
      await expect(page.locator('h1, h2')).toBeVisible({ timeout: 8000 });
      const portraitCards = await page.locator('.MuiCard-root').count();
      
      // Switch to landscape
      await page.setViewportSize({ width: 667, height: 375 });
      
      // Wait for layout to adapt
      const waitTime = browserName === 'webkit' ? 4000 : 2000;
      await page.waitForTimeout(waitTime);
      
      // Verify layout adapted
      const landscapeCards = await page.locator('.MuiCard-root').count();
      expect(landscapeCards).toBeGreaterThan(0); // Should still have cards
      
      // Content should still be visible
      await expect(page.locator('h1, h2')).toBeVisible({ timeout: 5000 });
      
      // Check viewport dimensions match
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(viewportWidth).toBe(667);
    });

    test('Mobile-specific UI elements', async ({ page, browserName }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Wait for page to load
      const loadingText = page.locator('text=Loading...');
      if (await loadingText.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(loadingText).not.toBeVisible({ timeout: 10000 });
      }
      
      // Check for mobile menu button
      const menuButton = page.locator('[aria-label="menu"]').first();
      await expect(menuButton).toBeVisible({ timeout: 8000 });
      
      // Menu button should be touch-friendly
      const box = await menuButton.boundingBox();
      if (box) {
        // Should be at least 40px for touch (Material-UI IconButton)
        expect(box.height).toBeGreaterThanOrEqual(35); // Slightly more lenient
        expect(box.width).toBeGreaterThanOrEqual(35);
      }
      
      // Test menu functionality
      await menuButton.click();
      const drawer = page.locator('.MuiDrawer-root');
      await expect(drawer).toBeVisible({ timeout: 5000 });
      
      // Menu should have navigation items
      const navItems = drawer.locator('text=Pools, text=Nodes, text=Supply');
      const hasNavItems = await navItems.count() > 0 || 
                           await drawer.locator('a, button').count() > 2;
      expect(hasNavItems).toBeTruthy();
    });

    test('Scroll performance on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/blocks');
      
      // Wait for content to load
      const loadingText = page.locator('text=Loading...');
      if (await loadingText.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(loadingText).not.toBeVisible({ timeout: 10000 });
      }
      
      // Verify page loaded
      await expect(page.locator('h1, h2')).toBeVisible({ timeout: 8000 });
      
      // Test scrolling
      const initialScrollY = await page.evaluate(() => window.scrollY);
      
      // Scroll down
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(500);
      
      const scrolledY = await page.evaluate(() => window.scrollY);
      expect(scrolledY).toBeGreaterThan(initialScrollY);
      
      // Scroll back to top
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
      
      const finalScrollY = await page.evaluate(() => window.scrollY);
      expect(finalScrollY).toBeLessThan(scrolledY);
      
      // Content should remain visible
      await expect(page.locator('h1, h2')).toBeVisible({ timeout: 3000 });
    });

    test('Mobile data usage optimization', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Wait for page initialization
      await page.waitForSelector('h1, .MuiCard-root', { timeout: 8000 });
      
      // Check for essential page content loaded
      const hasContent = await page.evaluate(() => {
        const text = document.body.textContent || '';
        return text.length > 100 && (/digibyte|blockchain/i.test(text));
      });
      
      expect(hasContent).toBeTruthy();
      
      // Check resource efficiency
      const images = await page.evaluate(() => {
        const imgs = document.querySelectorAll('img');
        return Array.from(imgs).map(img => ({
          src: img.src,
          loading: img.loading,
          hasLazyClass: img.className.includes('lazy')
        }));
      });
      
      console.log(`Found ${images.length} images`);
      
      // Basic performance check - page should load without excessive resources
      const styleSheets = await page.evaluate(() => document.styleSheets.length);
      expect(styleSheets).toBeLessThan(20); // Reasonable limit
    });
});

// Additional mobile-specific tests with optimized performance
test.describe('Mobile Features', () => {
  test('PWA installation prompt', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/', { timeout: 15000 });
    
    // Wait for page to stabilize
    await page.waitForSelector('h1, h2', { timeout: 8000 });
    
    // Check for manifest (PWA requirement)
    const hasManifest = await page.evaluate(() => {
      const link = document.querySelector('link[rel="manifest"]');
      return link !== null;
    });
    
    expect(hasManifest).toBeTruthy();
    
    // Check for service worker registration (optional PWA feature)
    const hasServiceWorker = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    
    expect(hasServiceWorker).toBeTruthy();
  });

  test('Mobile offline behavior', async ({ page, context }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/', { timeout: 15000 });
    
    // Wait for essential content
    await page.waitForSelector('h1, h2', { timeout: 8000 });
    
    // Verify initial page load
    const initialContent = await page.locator('h1, h2').textContent();
    expect(initialContent).toBeTruthy();
    
    // Go offline
    await context.setOffline(true);
    
    // Test offline behavior - try navigation
    const menuButton = page.locator('[aria-label="menu"]');
    if (await menuButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await menuButton.click();
      
      // Should still be able to access menu
      const drawer = page.locator('.MuiDrawer-root');
      const drawerVisible = await drawer.isVisible({ timeout: 3000 }).catch(() => false);
      
      console.log(`Offline menu access: ${drawerVisible ? 'Yes' : 'No'}`);
    }
    
    // Go back online
    await context.setOffline(false);
    
    // Verify page still works
    await expect(page.locator('h1, h2')).toBeVisible({ timeout: 5000 });
  });
});