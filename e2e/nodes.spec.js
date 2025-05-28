import { test, expect } from '@playwright/test';

test.describe('Nodes Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/nodes');
  });

  test('should display world map', async ({ page }) => {
    // Wait for map to render
    await page.waitForSelector('#world-map svg', { timeout: 10000 });
    
    const map = page.locator('#world-map svg');
    await expect(map).toBeVisible();
    
    // Check map has content
    const mapContent = await map.innerHTML();
    expect(mapContent).toContain('path'); // Should have country paths
  });

  test('should display node statistics', async ({ page }) => {
    await expect(page.locator('text=Total Nodes')).toBeVisible();
    await expect(page.locator('text=Countries')).toBeVisible();
    await expect(page.locator('text=Continents')).toBeVisible();
    await expect(page.locator('text=Largest Network')).toBeVisible();
    
    // Wait for data
    await page.waitForTimeout(2000);
    
    // Check values are not zero
    const totalNodes = page.locator('text=Total Nodes').locator('..').locator('h3');
    const nodesText = await totalNodes.textContent();
    expect(nodesText).not.toBe('0');
  });

  test('should display nodes on the map', async ({ page }) => {
    // Wait for nodes to render
    await page.waitForTimeout(3000);
    
    // Check for node circles on the map
    const nodeCircles = page.locator('#world-map svg circle');
    const count = await nodeCircles.count();
    
    expect(count).toBeGreaterThan(0);
  });

  test('should display countries by continent', async ({ page }) => {
    await expect(page.locator('text=Nodes by Country')).toBeVisible();
    
    // Check continent sections
    const continents = ['North America', 'Europe', 'Asia', 'South America', 'Oceania', 'Africa'];
    for (const continent of continents) {
      await expect(page.locator(`text=${continent}`)).toBeVisible();
    }
  });

  test('should handle map zoom interactions', async ({ page }) => {
    await page.waitForSelector('#world-map svg', { timeout: 10000 });
    
    const map = page.locator('#world-map svg');
    
    // Get initial viewBox
    const initialViewBox = await map.getAttribute('viewBox');
    
    // Simulate zoom (wheel event)
    await map.hover();
    await page.mouse.wheel(0, -100); // Zoom in
    await page.waitForTimeout(500);
    
    // ViewBox might change or transform might be applied
    const svgTransform = await map.evaluate(el => el.style.transform);
    
    // Either viewBox or transform should indicate zoom
    const newViewBox = await map.getAttribute('viewBox');
    const hasChanged = newViewBox !== initialViewBox || svgTransform !== '';
    
    expect(hasChanged).toBeTruthy();
  });

  test('should show educational content', async ({ page }) => {
    await expect(page.locator('text=What is a Node?')).toBeVisible();
    await expect(page.locator('text=full copy of the blockchain')).toBeVisible();
  });

  test('should update node count in real-time', async ({ page }) => {
    // Get initial count
    await page.waitForTimeout(2000);
    const totalNodesCard = page.locator('text=Total Nodes').locator('..');
    const initialCount = await totalNodesCard.locator('h3').textContent();
    
    // Wait for potential updates
    await page.waitForTimeout(5000);
    
    // Count should still be valid
    const currentCount = await totalNodesCard.locator('h3').textContent();
    expect(currentCount).toBeTruthy();
    expect(parseInt(currentCount.replace(/,/g, ''))).toBeGreaterThan(0);
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Map should still be visible
    await page.waitForSelector('#world-map', { timeout: 10000 });
    await expect(page.locator('#world-map')).toBeVisible();
    
    // Stats should stack vertically
    const cards = page.locator('[class*="MuiCard-root"]');
    const firstCard = cards.first();
    const secondCard = cards.nth(1);
    
    const firstBox = await firstCard.boundingBox();
    const secondBox = await secondCard.boundingBox();
    
    expect(secondBox.y).toBeGreaterThan(firstBox.y);
  });

  test('should display continent colors in country list', async ({ page }) => {
    // Each continent section should have a colored indicator
    const continentSections = page.locator('[class*="continentSection"]');
    const count = await continentSections.count();
    
    expect(count).toBeGreaterThan(0);
    
    // Check first continent has color styling
    const firstContinent = continentSections.first();
    const colorBox = firstContinent.locator('[style*="backgroundColor"]');
    await expect(colorBox).toBeVisible();
  });

  test('should handle no data gracefully', async ({ page, context }) => {
    // Block WebSocket to simulate no data
    await context.route('ws://localhost:3001', route => route.abort());
    
    await page.reload();
    
    // Page should still render
    await expect(page.locator('h1')).toContainText('DigiByte Network Nodes');
    await expect(page.locator('#world-map')).toBeVisible();
    
    // Should show 0 nodes
    const totalNodesCard = page.locator('text=Total Nodes').locator('..');
    await expect(totalNodesCard.locator('h3')).toContainText('0');
  });
});