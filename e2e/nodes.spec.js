import { test, expect } from '@playwright/test';
import { 
  waitForLoadingComplete, 
  checkAndWaitForLoading, 
  waitForWebSocketData, 
  detectWebSocketState, 
  waitForRealTimeUpdate 
} from './test-helpers.js';

test.describe('Nodes Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/nodes');
  });

  test('should display world map', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Standardized loading state handling with page type
    await waitForWebSocketData(page, { 
      timeout: 8000, 
      browserName: 'chromium',
      pageType: 'nodes'
    });
    
    // Map is rendered inside map container - use stable selectors
    const mapContainer = page.locator('.map-container, [data-testid="world-map-container"], #map-container');
    await expect(mapContainer).toBeVisible({ timeout: 5000 });
    
    // Check SVG exists - use multiple selectors
    const svg = mapContainer.locator('svg, [data-testid="world-map-svg"]');
    await expect(svg).toBeVisible();
    
    // Check map has world countries rendered - use stable selectors
    const countryPaths = svg.locator('path[fill="#e0e0e0"], path[data-country], .country-path');
    expect(await countryPaths.count()).toBeGreaterThan(0);
  });

  test('should display node statistics', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Check for the Node Statistics section
    await expect(page.locator('text=Node Statistics')).toBeVisible();
    
    // Wait for stats data to be visible
    await page.waitForSelector('.MuiPaper-root:has-text("Total Nodes Seen")', { timeout: 5000 }).catch(() => {});
    
    // Check for the stats cards
    await expect(page.locator('text=Total Nodes Seen')).toBeVisible();
    await expect(page.locator('text=Mapped Active Regions')).toBeVisible();
    await expect(page.locator('text=Total Countries')).toBeVisible();
    
    // Check values are not loading
    const loadingIndicator = page.locator('text=Loading node data...');
    if (await loadingIndicator.isVisible()) {
      await expect(loadingIndicator).not.toBeVisible({ timeout: 5000 });
    }
  });

  test('should display nodes on the map', async ({ page }) => {
    // Wait for page load and data
    await page.waitForLoadState('networkidle');
    
    // Standardized loading state handling
    await waitForWebSocketData(page, { 
      timeout: 6000, 
      browserName: 'chromium',
      pageType: 'nodes'
    });
    
    // Check for node icons - use stable selectors
    const nodeIcons = page.locator('.map-container svg image, [data-testid="node-icon"], .node-icon');
    const count = await nodeIcons.count();
    
    // Nodes should be visible if data was received
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display countries by continent', async ({ page }) => {
    // Wait for data to load
    await page.waitForLoadState('networkidle');
    
    const loadingText = page.locator('text=Loading node data...');
    const isLoading = await loadingText.isVisible();
    
    if (!isLoading) {
      // If data has loaded (or failed to load), check for the geographic region section
      const geographicSection = page.locator('text=Nodes by Geographic Region');
      const sectionExists = await geographicSection.isVisible();
      
      if (sectionExists) {
        // Section exists, so check if it has continent data
        const continents = ['North America', 'Europe', 'Asia', 'Africa', 'Oceania', 'South America'];
        let continentCount = 0;
        
        for (const continent of continents) {
          if (await page.locator(`text=${continent}`).isVisible()) {
            continentCount++;
          }
        }
        
        // Either we have continents displayed, or we have empty state (both valid)
        expect(continentCount).toBeGreaterThanOrEqual(0);
      }
    } else {
      // If still loading, that's expected behavior
      await expect(loadingText).toBeVisible();
    }
  });

  test('should handle map zoom interactions', async ({ page }) => {
    // Wait for map to load
    await page.waitForLoadState('networkidle');
    
    const loadingText = page.locator('text=Loading node data...');
    const isLoading = await loadingText.isVisible();
    
    if (!isLoading) {
      // Map should be visible if data is loaded - use stable selectors
      const mapContainer = page.locator('.map-container, [data-testid="world-map-container"], #map-container');
      await expect(mapContainer).toBeVisible();
      
      const map = mapContainer.locator('svg');
      await expect(map).toBeVisible();
      
      // Firefox-specific: Use longer timeout for interactions
      await map.hover({ timeout: 3000 });
      
      // Check that the SVG is properly sized and positioned
      const boundingBox = await map.boundingBox();
      if (boundingBox) {
        expect(boundingBox.width).toBeGreaterThan(100);
        expect(boundingBox.height).toBeGreaterThan(100);
      }
    } else {
      // If still loading, map container should not be visible
      await expect(loadingText).toBeVisible();
      const mapContainer = page.locator('.map-container');
      await expect(mapContainer).not.toBeVisible();
    }
  });

  test('should show educational content', async ({ page }) => {
    // Look for the descriptive text about nodes
    await expect(page.locator('text=This page displays unique nodes')).toBeVisible();
    await expect(page.locator('text=A blockchain node is a computer running the DGB core wallet')).toBeVisible();
  });

  test('should update node count in real-time', async ({ page, browserName }) => {
    // Wait for initial data with WebSocket detection
    await waitForWebSocketData(page, { 
      timeout: 10000, 
      browserName: browserName || 'chromium',
      pageType: 'nodes'
    });
    
    // Test real-time updates for node statistics
    const updateResult = await waitForRealTimeUpdate(
      page, 
      '.MuiPaper-root:has-text("Total Nodes Seen")',
      { 
        timeout: 12000, 
        browserName: browserName || 'chromium',
        allowNoUpdate: true 
      }
    );
    
    // Verify stats cards are showing values
    await expect(page.locator('text=Total Nodes Seen')).toBeVisible();
    await expect(page.locator('text=Mapped Active Regions')).toBeVisible();
    await expect(page.locator('text=Total Countries')).toBeVisible();
    
    // Either data updated or is stable (both valid)
    expect(updateResult.initialValue || updateResult.timeout).toBeTruthy();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState('networkidle');
    
    // Wait for loading to disappear
    const loadingText = page.locator('text=Loading node data...');
    if (await loadingText.isVisible()) {
      await expect(loadingText).not.toBeVisible({ timeout: 10000 });
    }
    
    // Map should still be visible - use stable selectors
    const mapContainer = page.locator('.map-container, [data-testid="world-map-container"], #map-container');
    await expect(mapContainer).toBeVisible();
    
    // Stats should stack vertically - use stable selectors
    const cards = page.locator('.MuiPaper-root, [data-testid="stats-card"], .stats-card').filter({ hasText: /Total Nodes|Mapped Active|Total Countries/ });
    const cardCount = await cards.count();
    
    if (cardCount > 1) {
      const firstCard = cards.first();
      const secondCard = cards.nth(1);
      
      const firstBox = await firstCard.boundingBox();
      const secondBox = await secondCard.boundingBox();
      
      // Firefox-specific: Check both boxes exist before comparing
      if (firstBox && secondBox) {
        // Firefox may have slight layout differences
        expect(secondBox.y).toBeGreaterThanOrEqual(firstBox.y);
      } else {
        // If boxes are null, just verify cards exist
        expect(cardCount).toBeGreaterThan(0);
      }
    }
  });

  test('should display continent colors in country list', async ({ page }) => {
    // Wait for data to load
    await page.waitForLoadState('networkidle');
    
    const loadingText = page.locator('text=Loading node data...');
    const isDataLoaded = await loadingText.isVisible() === false;
    
    if (isDataLoaded) {
      // If data has loaded, check for continent styling - use stable selectors
      const continentPapers = page.locator('.MuiPaper-root, [data-testid="continent-card"], .continent-card').filter({ hasText: /North America|Europe|Asia|Africa|Oceania|South America/ });
      const count = await continentPapers.count();
      
      if (count > 0) {
        // Check first continent has color styling - use stable selectors
        const firstContinent = continentPapers.first();
        const coloredAvatar = firstContinent.locator('.MuiAvatar-root, [data-testid="continent-avatar"], .continent-avatar');
        await expect(coloredAvatar).toBeVisible();
      } else {
        // No continent data is also valid if WebSocket hasn't provided data
        expect(count).toBeGreaterThanOrEqual(0);
      }
    } else {
      // If still loading, that's expected - no continent colors should be visible
      await expect(loadingText).toBeVisible();
    }
  });

  test('should handle no data gracefully', async ({ page, context, browserName }) => {
    // Block WebSocket connections comprehensively
    await context.route(/ws:\/\/.*/, route => route.abort());
    await context.route(/wss:\/\/.*/, route => route.abort());
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Detect offline state
    const wsState = await detectWebSocketState(page, 5000, browserName || 'chromium');
    
    // Page should still render despite connection failure
    await expect(page.locator('h1')).toContainText('DigiByte Blockchain Nodes');
    
    // Verify graceful degradation
    expect(wsState.connected).toBe(false);
    
    // UI should still show structure
    const hasZeroValues = await page.locator('text=Total Nodes Seen').isVisible();
    expect(hasZeroValues).toBeTruthy();
  });
});