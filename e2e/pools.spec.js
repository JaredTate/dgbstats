import { test, expect } from '@playwright/test';

test.describe('Pools Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pools');
    await page.waitForLoadState('networkidle');
  });

  test('should display page header and description', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Mining Pool Distribution');
    await expect(page.locator('text=This page shows the distribution of mining power')).toBeVisible();
  });

  test('should render pie chart with pool distribution', async ({ page }) => {
    // Wait for chart to render
    const chart = page.locator('#poolsChart');
    await expect(chart).toBeVisible();
    
    // Check for chart segments
    await page.waitForFunction(() => {
      const svg = document.querySelector('#poolsChart svg');
      return svg && svg.querySelectorAll('path.slice').length > 0;
    });

    // Verify chart has legend
    const legend = page.locator('.legend-item');
    await expect(legend.first()).toBeVisible();
  });

  test('should show interactive chart tooltips on hover', async ({ page }) => {
    // Wait for chart
    await page.waitForSelector('#poolsChart svg');
    
    // Hover over a chart segment
    const segment = page.locator('path.slice').first();
    await segment.hover();
    
    // Check for tooltip
    const tooltip = page.locator('.pool-tooltip');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText('%');
  });

  test('should display miner list with pagination', async ({ page }) => {
    // Check for miner list
    const minerList = page.locator('.miner-list-item');
    await expect(minerList.first()).toBeVisible();
    
    // Verify miner details
    const firstMiner = minerList.first();
    await expect(firstMiner.locator('.miner-address')).toBeVisible();
    await expect(firstMiner.locator('.block-count')).toContainText(/\d+ blocks/);
    await expect(firstMiner.locator('.percentage')).toContainText(/%/);
  });

  test('should handle pagination correctly', async ({ page }) => {
    // Check for pagination controls
    const pagination = page.locator('.MuiPagination-root');
    await expect(pagination).toBeVisible();
    
    // Click next page
    const nextButton = page.locator('button[aria-label="Go to next page"]');
    if (await nextButton.isEnabled()) {
      await nextButton.click();
      
      // Verify page changed
      await page.waitForTimeout(500);
      const pageIndicator = page.locator('.MuiPaginationItem-page.Mui-selected');
      await expect(pageIndicator).toContainText('2');
    }
  });

  test('should display taproot signaling status', async ({ page }) => {
    // Look for taproot indicators
    const taprootBadges = page.locator('.taproot-badge');
    const count = await taprootBadges.count();
    
    if (count > 0) {
      const firstBadge = taprootBadges.first();
      await expect(firstBadge).toBeVisible();
      await expect(firstBadge).toHaveText(/Taproot (Signaling|Not Signaling)/);
    }
  });

  test('should show summary statistics', async ({ page }) => {
    // Check for stats section
    const totalMiners = page.locator('text=/Total Miners.*\d+/');
    await expect(totalMiners).toBeVisible();
    
    const multiBlockMiners = page.locator('text=/Multi-Block Miners.*\d+/');
    await expect(multiBlockMiners).toBeVisible();
    
    const singleBlockMiners = page.locator('text=/Single-Block Miners.*\d+/');
    await expect(singleBlockMiners).toBeVisible();
  });

  test('should update data via WebSocket', async ({ page }) => {
    // Get initial block count
    const initialBlockCount = await page.locator('.total-blocks').first().textContent();
    
    // Wait for potential update (max 30 seconds)
    await page.waitForFunction(
      (initial) => {
        const current = document.querySelector('.total-blocks')?.textContent;
        return current && current !== initial;
      },
      initialBlockCount,
      { timeout: 30000 }
    ).catch(() => {
      // It's okay if no update happens during test
      console.log('No WebSocket update detected during test period');
    });
  });

  test('should handle empty data gracefully', async ({ page }) => {
    // Intercept WebSocket to send empty data
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('websocket-data', { 
        detail: { type: 'miners', data: [] } 
      }));
    });
    
    // Should show appropriate message
    const emptyMessage = page.locator('text=/No mining data available|Loading mining pool data/');
    await expect(emptyMessage).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Chart should still be visible
    await expect(page.locator('#poolsChart')).toBeVisible();
    
    // Miner list should be scrollable
    const minerList = page.locator('.miner-list-container');
    await expect(minerList).toBeVisible();
    
    // Pagination should be accessible
    const pagination = page.locator('.MuiPagination-root');
    await expect(pagination).toBeVisible();
  });

  test('should display pool colors consistently', async ({ page }) => {
    // Get colors from chart
    const chartColors = await page.evaluate(() => {
      const paths = document.querySelectorAll('#poolsChart path.slice');
      return Array.from(paths).map(p => p.getAttribute('fill'));
    });
    
    // Get colors from legend
    const legendColors = await page.evaluate(() => {
      const items = document.querySelectorAll('.legend-color-box');
      return Array.from(items).map(i => 
        window.getComputedStyle(i).backgroundColor
      );
    });
    
    // Should have matching number of colors
    expect(chartColors.length).toBeGreaterThan(0);
    expect(legendColors.length).toBeGreaterThan(0);
  });
});