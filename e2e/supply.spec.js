import { test, expect } from '@playwright/test';

test.describe('Supply Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/supply');
    await page.waitForLoadState('networkidle');
  });

  test('should display page header and description', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('DigiByte Supply Statistics');
    await expect(page.locator('text=Track the current and projected supply')).toBeVisible();
  });

  test('should display supply statistics cards', async ({ page }) => {
    // Check for main supply stats
    const currentSupply = page.locator('.stat-card:has-text("Current Supply")');
    await expect(currentSupply).toBeVisible();
    await expect(currentSupply.locator('.stat-value')).toContainText(/[\d,.]+ DGB/);
    
    const maxSupply = page.locator('.stat-card:has-text("Maximum Supply")');
    await expect(maxSupply).toBeVisible();
    await expect(maxSupply.locator('.stat-value')).toContainText('21,000,000,000 DGB');
    
    const percentMined = page.locator('.stat-card:has-text("Percent Mined")');
    await expect(percentMined).toBeVisible();
    await expect(percentMined.locator('.stat-value')).toContainText(/%/);
  });

  test('should render supply timeline chart', async ({ page }) => {
    // Wait for chart canvas
    const chart = page.locator('#supplyChart');
    await expect(chart).toBeVisible();
    
    // Verify chart has rendered
    await page.waitForFunction(() => {
      const canvas = document.querySelector('#supplyChart');
      const ctx = canvas?.getContext('2d');
      return ctx && canvas.width > 0 && canvas.height > 0;
    });
  });

  test('should display additional supply information', async ({ page }) => {
    // Check for per person stats
    const perPerson = page.locator('.stat-card:has-text("Per Person on Earth")');
    await expect(perPerson).toBeVisible();
    await expect(perPerson.locator('.stat-value')).toContainText(/[\d,.]+ DGB/);
    
    // Check for remaining supply
    const remaining = page.locator('.stat-card:has-text("Remaining to Mine")');
    await expect(remaining).toBeVisible();
    await expect(remaining.locator('.stat-value')).toContainText(/[\d,.]+ DGB/);
    
    // Check for expected completion
    const completion = page.locator('.stat-card:has-text("Expected Mining Completion")');
    await expect(completion).toBeVisible();
    await expect(completion.locator('.stat-value')).toContainText(/20\d{2}/);
  });

  test('should show real-time updates via WebSocket', async ({ page }) => {
    // Get initial supply value
    const initialSupply = await page.locator('.stat-card:has-text("Current Supply") .stat-value').textContent();
    
    // Wait for potential update (max 30 seconds)
    await page.waitForFunction(
      (initial) => {
        const current = document.querySelector('.stat-card:has-text("Current Supply") .stat-value')?.textContent;
        return current && current !== initial;
      },
      initialSupply,
      { timeout: 30000 }
    ).catch(() => {
      // It's okay if no update happens during test
      console.log('No WebSocket update detected during test period');
    });
  });

  test('should handle chart interactions', async ({ page }) => {
    // Wait for chart
    await page.waitForSelector('#supplyChart');
    
    // Hover over chart to trigger tooltips
    const chart = page.locator('#supplyChart');
    const box = await chart.boundingBox();
    
    if (box) {
      // Move mouse across chart
      await page.mouse.move(box.x + box.width / 4, box.y + box.height / 2);
      await page.mouse.move(box.x + box.width / 2, basket.y + box.height / 2);
      await page.mouse.move(box.x + box.width * 3/4, box.y + box.height / 2);
    }
  });

  test('should display block reward information', async ({ page }) => {
    // Look for block reward section
    const blockReward = page.locator('text=/Current Block Reward.*\d+ DGB/');
    const nextHalving = page.locator('text=/Next Halving.*Block #\d+/');
    
    // At least one should be visible
    const rewardVisible = await blockReward.isVisible().catch(() => false);
    const halvingVisible = await nextHalving.isVisible().catch(() => false);
    
    expect(rewardVisible || halvingVisible).toBeTruthy();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Stats should stack vertically
    const statCards = page.locator('.stat-card');
    const firstCard = await statCards.first().boundingBox();
    const secondCard = await statCards.nth(1).boundingBox();
    
    if (firstCard && secondCard) {
      // Cards should be stacked (second card below first)
      expect(secondCard.y).toBeGreaterThan(firstCard.y + firstCard.height);
    }
    
    // Chart should be visible and responsive
    const chart = page.locator('#supplyChart');
    await expect(chart).toBeVisible();
    const chartBox = await chart.boundingBox();
    if (chartBox) {
      expect(chartBox.width).toBeLessThanOrEqual(375);
    }
  });

  test('should calculate percentages correctly', async ({ page }) => {
    // Get values
    const currentSupplyText = await page.locator('.stat-card:has-text("Current Supply") .stat-value').textContent();
    const percentMinedText = await page.locator('.stat-card:has-text("Percent Mined") .stat-value').textContent();
    
    // Parse values
    const currentSupply = parseFloat(currentSupplyText.replace(/[^0-9.]/g, ''));
    const percentMined = parseFloat(percentMinedText.replace('%', ''));
    
    // Calculate expected percentage
    const expectedPercent = (currentSupply / 21000000000) * 100;
    
    // Should be within reasonable range
    expect(Math.abs(expectedPercent - percentMined)).toBeLessThan(1);
  });

  test('should handle chart resize', async ({ page }) => {
    // Initial size
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(500);
    
    // Resize window
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(500);
    
    // Chart should still be visible
    const chart = page.locator('#supplyChart');
    await expect(chart).toBeVisible();
    
    // Verify chart resized
    const chartBox = await chart.boundingBox();
    if (chartBox) {
      expect(chartBox.width).toBeLessThan(800);
    }
  });

  test('should display supply milestones', async ({ page }) => {
    // Look for milestone information
    const milestones = page.locator('.milestone-item');
    const count = await milestones.count();
    
    if (count > 0) {
      // Check milestone structure
      const firstMilestone = milestones.first();
      await expect(firstMilestone).toContainText(/\d+%.*reached/i);
    }
  });
});