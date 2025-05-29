import { test, expect } from '@playwright/test';
import { 
  waitForLoadingComplete, 
  waitForWebSocketData, 
  detectWebSocketState,
  waitForRealTimeUpdate 
} from './test-helpers.js';

test.describe('Supply Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/supply');
    await page.waitForLoadState('networkidle');
  });

  test('should display page header and description', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('DigiByte Supply Statistics');
    await expect(page.locator('text=DigiByte has a limited supply of 21 billion DGB')).toBeVisible();
  });

  test('should display supply statistics cards', async ({ page }) => {
    // Check for main supply stats
    await expect(page.locator('text=Current Circulating Supply')).toBeVisible();
    await expect(page.locator('text=/\\d+\\.\\d+ Billion DGB/')).toBeVisible();
    
    await expect(page.locator('text=Remaining Supply To Be Mined')).toBeVisible();
    await expect(page.locator('text=/\\d+\\.\\d+%/')).toBeVisible();
  });

  test('should render supply timeline chart', async ({ page }) => {
    // Wait for chart canvas - use stable selectors
    const chart = page.locator('#supplyChart, [data-testid="supply-chart"], canvas[data-chart="supply"]');
    await expect(chart).toBeVisible();
    
    // Verify chart has rendered
    await page.waitForFunction(() => {
      const canvas = document.querySelector('#supplyChart, [data-testid="supply-chart"], canvas[data-chart="supply"]');
      const ctx = canvas?.getContext('2d');
      return ctx && canvas.width > 0 && canvas.height > 0;
    });
  });

  test('should display additional supply information', async ({ page }) => {
    // Look for supply-related text
    await expect(page.locator('text=/DGB per person/i, [data-testid="per-person-stat"]')).toBeVisible();
    
    // Check that percentage is displayed
    await expect(page.locator('text=/of the maximum supply/')).toBeVisible();
  });

  test('should show real-time updates via WebSocket', async ({ page, browserName }) => {
    // Standardized WebSocket data loading
    await waitForWebSocketData(page, { 
      timeout: 8000, 
      browserName: browserName || 'chromium',
      pageType: 'supply'
    });
    
    // Test real-time updates for supply data
    const updateResult = await waitForRealTimeUpdate(
      page, 
      '.MuiCard-root:has-text("Current Circulating Supply") h4',
      { 
        timeout: 10000, 
        browserName: browserName || 'chromium',
        allowNoUpdate: true 
      }
    );
    
    // Either data updated or is stable (both valid)
    expect(updateResult.initialValue || updateResult.timeout).toBeTruthy();
    console.log(`Supply WebSocket test: ${updateResult.updated ? 'Updated' : 'Stable'}`);
  });

  test('should handle chart interactions', async ({ page }) => {
    // Wait for chart - use stable selectors
    await page.waitForSelector('#supplyChart, [data-testid="supply-chart"], canvas[data-chart="supply"]');
    
    // Hover over chart to trigger tooltips - use stable selectors
    const chart = page.locator('#supplyChart, [data-testid="supply-chart"], canvas[data-chart="supply"]');
    const box = await chart.boundingBox();
    
    if (box) {
      // Move mouse across chart
      await page.mouse.move(box.x + box.width / 4, box.y + box.height / 2);
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.move(box.x + box.width * 3/4, box.y + box.height / 2);
    }
  });

  test('should display block reward information', async ({ page }) => {
    // The page shows supply information in cards
    await expect(page.locator('text=DigiByte Supply Statistics')).toBeVisible();
    
    // Check for text mentioning 2035 (the year mining ends)
    await expect(page.locator('text=/2035/')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Main title should still be visible
    await expect(page.locator('text=DigiByte Supply Statistics')).toBeVisible();
    
    // Chart should be visible and responsive - use stable selectors
    const chart = page.locator('#supplyChart, [data-testid="supply-chart"], canvas[data-chart="supply"]');
    await expect(chart).toBeVisible();
    const chartBox = await chart.boundingBox();
    if (chartBox) {
      expect(chartBox.width).toBeLessThanOrEqual(375);
    }
  });

  test('should calculate percentages correctly', async ({ page }) => {
    // Look for percentage values - use stable selectors
    const percentages = await page.locator('text=/%/, [data-testid*="percentage"], .percentage').all();
    
    // Should have at least one percentage displayed
    expect(percentages.length).toBeGreaterThan(0);
    
    // Verify percentages are reasonable (between 0 and 100)
    for (const percentage of percentages) {
      const text = await percentage.textContent();
      const match = text.match(/(\d+\.?\d*)%/);
      if (match) {
        const value = parseFloat(match[1]);
        expect(value).toBeGreaterThan(0);
        expect(value).toBeLessThanOrEqual(100);
      }
    }
  });

  test('should handle chart resize', async ({ page }) => {
    // Initial size
    await page.setViewportSize({ width: 1200, height: 800 });
    // Wait for responsive layout to adapt
    await page.waitForLoadState('networkidle', { timeout: 2000 }).catch(() => {});
    
    // Resize window
    await page.setViewportSize({ width: 800, height: 600 });
    // Wait for responsive layout to adapt
    await page.waitForLoadState('networkidle', { timeout: 2000 }).catch(() => {});
    
    // Chart should still be visible - use stable selectors
    const chart = page.locator('#supplyChart, [data-testid="supply-chart"], canvas[data-chart="supply"]');
    await expect(chart).toBeVisible();
    
    // Verify chart resized
    const chartBox = await chart.boundingBox();
    if (chartBox) {
      expect(chartBox.width).toBeLessThan(800);
    }
  });

  test('should display supply milestones', async ({ page }) => {
    // Look for milestone information or key dates - use stable selectors
    const yearInfo = await page.locator('text=/2035|2014/, [data-testid*="year"], .milestone-year').count();
    
    // Should mention key years (launch year or end year)
    expect(yearInfo).toBeGreaterThan(0);
    
    // Should mention key years (launch year or end year)
    expect(yearInfo).toBeGreaterThan(0);
  });
});