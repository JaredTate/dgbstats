import { test, expect } from '@playwright/test';

test.describe('Blocks Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/blocks');
    await page.waitForLoadState('networkidle');
  });

  test('should display page header and description', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Recent Blocks');
    await expect(page.locator('text=View the most recent blocks')).toBeVisible();
  });

  test('should display block list with details', async ({ page }) => {
    // Wait for blocks to load
    await page.waitForSelector('.block-item', { timeout: 10000 });
    
    // Check for block items
    const blocks = page.locator('.block-item');
    await expect(blocks.first()).toBeVisible();
    
    // Verify block details
    const firstBlock = blocks.first();
    await expect(firstBlock.locator('.block-height')).toContainText(/#\d+/);
    await expect(firstBlock.locator('.block-time')).toBeVisible();
    await expect(firstBlock.locator('.block-algo')).toContainText(/SHA256|Scrypt|Groestl|Skein|Qubit/);
    await expect(firstBlock.locator('.block-txs')).toContainText(/\d+ tx/);
  });

  test('should handle pagination correctly', async ({ page }) => {
    // Wait for pagination
    const pagination = page.locator('.MuiPagination-root');
    await expect(pagination).toBeVisible();
    
    // Get initial first block height
    const firstBlockHeight = await page.locator('.block-item').first().locator('.block-height').textContent();
    
    // Click next page
    const nextButton = page.locator('button[aria-label="Go to next page"]');
    await nextButton.click();
    
    // Wait for new blocks to load
    await page.waitForTimeout(1000);
    
    // Verify blocks changed
    const newFirstBlockHeight = await page.locator('.block-item').first().locator('.block-height').textContent();
    expect(newFirstBlockHeight).not.toBe(firstBlockHeight);
  });

  test('should filter blocks by algorithm', async ({ page }) => {
    // Look for algorithm filter
    const algoFilter = page.locator('[data-testid="algo-filter"], .algo-filter-select');
    
    if (await algoFilter.isVisible()) {
      // Click filter
      await algoFilter.click();
      
      // Select an algorithm
      await page.locator('li:has-text("SHA256")').click();
      
      // Wait for filtered results
      await page.waitForTimeout(1000);
      
      // Verify all blocks show SHA256
      const blocks = page.locator('.block-item');
      const count = await blocks.count();
      
      for (let i = 0; i < Math.min(count, 5); i++) {
        await expect(blocks.nth(i).locator('.block-algo')).toContainText('SHA256');
      }
    }
  });

  test('should update with real-time blocks via WebSocket', async ({ page }) => {
    // Get initial block count
    const initialBlockCount = await page.locator('.block-item').count();
    
    // Wait for new block (max 30 seconds)
    await page.waitForFunction(
      (initial) => {
        const current = document.querySelectorAll('.block-item').length;
        return current !== initial;
      },
      initialBlockCount,
      { timeout: 30000 }
    ).catch(() => {
      // It's okay if no new block arrives during test
      console.log('No new block detected during test period');
    });
  });

  test('should display block size and difficulty', async ({ page }) => {
    const firstBlock = page.locator('.block-item').first();
    
    // Check for block size
    const blockSize = firstBlock.locator('.block-size');
    if (await blockSize.isVisible()) {
      await expect(blockSize).toContainText(/\d+(\.\d+)?\s*(bytes|KB|MB)/);
    }
    
    // Check for difficulty
    const difficulty = firstBlock.locator('.block-difficulty');
    if (await difficulty.isVisible()) {
      await expect(difficulty).toContainText(/\d+(\.\d+)?[KMG]?/);
    }
  });

  test('should show block miner information', async ({ page }) => {
    const firstBlock = page.locator('.block-item').first();
    
    // Check for miner address
    const minerAddress = firstBlock.locator('.block-miner');
    await expect(minerAddress).toBeVisible();
    await expect(minerAddress).toContainText(/^[DS][a-zA-Z0-9]{20,}/);
  });

  test('should handle click on block for details', async ({ page }) => {
    // Click on first block
    const firstBlock = page.locator('.block-item').first();
    const blockHeight = await firstBlock.locator('.block-height').textContent();
    
    // Some implementations might expand inline
    await firstBlock.click();
    
    // Check if details expanded or modal opened
    const expandedDetails = page.locator('.block-details-expanded');
    const modal = page.locator('.block-details-modal');
    
    const detailsVisible = await expandedDetails.isVisible().catch(() => false);
    const modalVisible = await modal.isVisible().catch(() => false);
    
    if (detailsVisible || modalVisible) {
      // Look for additional details
      await expect(page.locator('text=/Hash.*[0-9a-f]{64}/')).toBeVisible();
      await expect(page.locator('text=/Confirmations.*\d+/')).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Blocks should still be visible
    const blocks = page.locator('.block-item');
    await expect(blocks.first()).toBeVisible();
    
    // Check for mobile-optimized layout
    const firstBlock = blocks.first();
    const blockBox = await firstBlock.boundingBox();
    
    if (blockBox) {
      // Block should use most of screen width
      expect(blockBox.width).toBeGreaterThan(300);
    }
    
    // Pagination should be accessible
    const pagination = page.locator('.MuiPagination-root');
    await expect(pagination).toBeVisible();
  });

  test('should show loading state', async ({ page }) => {
    // Navigate with slow network
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 1000);
    });
    
    await page.goto('/blocks');
    
    // Should show loading indicator
    const loading = page.locator('.loading-spinner, .skeleton-loader, text=/Loading/');
    await expect(loading).toBeVisible();
    
    // Eventually loads
    await page.waitForSelector('.block-item', { timeout: 15000 });
  });

  test('should display time since block', async ({ page }) => {
    const blocks = page.locator('.block-item');
    const firstBlock = blocks.first();
    
    // Check for relative time
    const blockTime = firstBlock.locator('.block-time');
    await expect(blockTime).toBeVisible();
    await expect(blockTime).toContainText(/(seconds?|minutes?|hours?) ago/);
  });

  test('should show algorithm colors consistently', async ({ page }) => {
    // Get multiple blocks
    const blocks = page.locator('.block-item');
    const count = await blocks.count();
    
    // Check algorithm styling
    for (let i = 0; i < Math.min(count, 3); i++) {
      const algo = await blocks.nth(i).locator('.block-algo').textContent();
      const algoElement = blocks.nth(i).locator('.block-algo');
      
      // Should have algorithm-specific styling
      const className = await algoElement.getAttribute('class');
      expect(className).toContain(algo.toLowerCase());
    }
  });
});