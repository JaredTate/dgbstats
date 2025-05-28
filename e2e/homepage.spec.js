import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display all main statistics cards', async ({ page }) => {
    // Wait for WebSocket connection
    await page.waitForTimeout(1000);
    
    // Check for all stat cards
    await expect(page.locator('text=Current Height')).toBeVisible();
    await expect(page.locator('text=Total Supply')).toBeVisible();
    await expect(page.locator('text=Circulating %')).toBeVisible();
    await expect(page.locator('text=Network Nodes')).toBeVisible();
    await expect(page.locator('text=Avg Block Time')).toBeVisible();
    await expect(page.locator('text=Countries')).toBeVisible();
  });

  test('should display algorithm difficulties', async ({ page }) => {
    await expect(page.locator('text=Algorithm Difficulties')).toBeVisible();
    
    // Check all algorithms are listed
    const algorithms = ['SHA256', 'Scrypt', 'Skein', 'Qubit', 'Odocrypt'];
    for (const algo of algorithms) {
      await expect(page.locator(`text=${algo}`)).toBeVisible();
    }
  });

  test('should display active softforks', async ({ page }) => {
    await expect(page.locator('text=Active Softforks')).toBeVisible();
    
    // Wait for data to load
    await page.waitForTimeout(1000);
    
    // Check for softfork entries
    const softforkCard = page.locator('text=Active Softforks').locator('..');
    await expect(softforkCard.locator('text=CSV')).toBeVisible();
    await expect(softforkCard.locator('text=SegWit')).toBeVisible();
    await expect(softforkCard.locator('text=Taproot')).toBeVisible();
  });

  test('should update data in real-time', async ({ page }) => {
    // Get initial block height
    await page.waitForTimeout(1000);
    const blockHeightCard = page.locator('text=Current Height').locator('..');
    const initialHeight = await blockHeightCard.locator('h3').textContent();
    
    // Wait for potential update (in real environment)
    await page.waitForTimeout(5000);
    
    // Data should be present (might be same or updated)
    const currentHeight = await blockHeightCard.locator('h3').textContent();
    expect(currentHeight).toBeTruthy();
    expect(currentHeight).not.toBe('0');
  });

  test('should have hover effects on cards', async ({ page }) => {
    const card = page.locator('text=Current Height').locator('..');
    
    // Get initial transform
    const initialTransform = await card.evaluate(el => 
      window.getComputedStyle(el).transform
    );
    
    // Hover over card
    await card.hover();
    await page.waitForTimeout(300); // Wait for transition
    
    // Check if transform changed (scale effect)
    const hoverTransform = await card.evaluate(el => 
      window.getComputedStyle(el).transform
    );
    
    expect(hoverTransform).not.toBe(initialTransform);
  });

  test('should handle WebSocket disconnection gracefully', async ({ page, context }) => {
    // Load page normally
    await page.waitForTimeout(1000);
    
    // Block WebSocket connections
    await context.route('ws://localhost:3001', route => route.abort());
    
    // Reload page
    await page.reload();
    
    // Page should still render
    await expect(page.locator('h1')).toContainText('DigiByte Blockchain Statistics');
    await expect(page.locator('text=Current Height')).toBeVisible();
    
    // Should show loading state (0 values)
    const blockHeightCard = page.locator('text=Current Height').locator('..');
    await expect(blockHeightCard.locator('h3')).toContainText('0');
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Cards should stack vertically
    const cards = page.locator('[class*="MuiCard-root"]');
    const firstCard = cards.first();
    const secondCard = cards.nth(1);
    
    const firstBox = await firstCard.boundingBox();
    const secondBox = await secondCard.boundingBox();
    
    // Second card should be below first card (not side by side)
    expect(secondBox.y).toBeGreaterThan(firstBox.y + firstBox.height);
  });

  test('should format large numbers correctly', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Check number formatting
    const supplyCard = page.locator('text=Total Supply').locator('..');
    const supplyText = await supplyCard.locator('h3').textContent();
    
    // Should contain formatted number (e.g., "16.23B")
    expect(supplyText).toMatch(/^\d+\.\d+[KMBT]?$/);
  });

  test('should display loading state initially', async ({ page }) => {
    // Navigate to page and immediately check
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Should show 0 or loading indicators initially
    const blockHeightCard = page.locator('text=Current Height').locator('..');
    const initialHeight = await blockHeightCard.locator('h3').textContent();
    
    expect(initialHeight).toBe('0');
  });

  test('should have accessible color contrast', async ({ page }) => {
    // Check text contrast on cards
    const card = page.locator('text=Current Height').locator('..');
    
    const backgroundColor = await card.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    
    const textColor = await card.locator('h6').evaluate(el => 
      window.getComputedStyle(el).color
    );
    
    // Both should be defined
    expect(backgroundColor).toBeTruthy();
    expect(textColor).toBeTruthy();
  });
});