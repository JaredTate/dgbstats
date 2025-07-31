const { test, expect } = require('@playwright/test');

test.describe('Roadmap Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/roadmap');
  });

  test('should display roadmap page title and description', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('h2:has-text("DigiByte Development Roadmap")', { timeout: 10000 });
    
    // Check main title
    await expect(page.locator('h2:has-text("DigiByte Development Roadmap")')).toBeVisible();
    await expect(page.locator('h5:has-text("2025 - 2035 Vision")')).toBeVisible();
    
    // Check description
    const description = page.locator('text=/Track the evolution of DigiByte/i');
    await expect(description).toBeVisible();
  });

  test('should show overall progress', async ({ page }) => {
    // Wait for progress section
    await page.waitForSelector('text=Overall Progress', { timeout: 10000 });
    
    // Check progress elements
    await expect(page.locator('text=Overall Progress')).toBeVisible();
    await expect(page.locator('text=/\\d+%/')).toBeVisible();
    await expect(page.locator('text=Current Status: v8.26 Core Upgrade In Progress')).toBeVisible();
    
    // Check progress bar
    const progressBar = page.locator('.MuiLinearProgress-root').first();
    await expect(progressBar).toBeVisible();
  });

  test('should display all four development phases', async ({ page }) => {
    // Wait for phases to load
    await page.waitForSelector('text=Core Infrastructure Upgrade', { timeout: 10000 });
    
    // Check all phases are present
    const phases = [
      'Core Infrastructure Upgrade',
      'DigiDollar Implementation',
      'DigiDollar Ecosystem Development',
      'Advanced Features & Scaling'
    ];
    
    for (const phase of phases) {
      await expect(page.locator(`text=${phase}`)).toBeVisible();
    }
  });

  test('should show phase details with progress', async ({ page }) => {
    // Wait for phase cards
    await page.waitForSelector('.MuiCard-root', { timeout: 10000 });
    
    // Check Phase 1 details
    const phase1Card = page.locator('text=Core Infrastructure Upgrade').locator('..').locator('..');
    await expect(phase1Card).toBeVisible();
    
    // Check for progress percentage
    await expect(phase1Card.locator('text=/\\d+%/')).toBeVisible();
    
    // Check for status chip
    await expect(page.locator('text=/IN PROGRESS|PENDING|COMPLETED/').first()).toBeVisible();
    
    // Check for time range
    await expect(page.locator('text=Q3 2025 - Q1 2026')).toBeVisible();
  });

  test('should expand and collapse milestones', async ({ page }) => {
    // Wait for milestone buttons
    await page.waitForSelector('text=/Milestones \\(\\d+\\/\\d+\\)/', { timeout: 10000 });
    
    // Find first milestones button
    const milestonesButton = page.locator('text=/Milestones \\(\\d+\\/\\d+\\)/').first();
    await expect(milestonesButton).toBeVisible();
    
    // Check milestones are initially collapsed
    await expect(page.locator('text=Initial Merge Complete')).not.toBeVisible();
    
    // Click to expand
    await milestonesButton.click();
    
    // Wait for expansion animation
    await page.waitForTimeout(500);
    
    // Check milestones are now visible
    await expect(page.locator('text=Initial Merge Complete')).toBeVisible();
    await expect(page.locator('text=C++ Unit Tests Passing')).toBeVisible();
    await expect(page.locator('text=Functional Tests')).toBeVisible();
    
    // Click to collapse
    await milestonesButton.click();
    await page.waitForTimeout(500);
    
    // Check milestones are hidden again
    await expect(page.locator('text=Initial Merge Complete')).not.toBeVisible();
  });

  test('should display milestone status indicators', async ({ page }) => {
    // Expand first phase milestones
    await page.waitForSelector('text=/Milestones \\(\\d+\\/\\d+\\)/', { timeout: 10000 });
    const milestonesButton = page.locator('text=/Milestones \\(\\d+\\/\\d+\\)/').first();
    await milestonesButton.click();
    
    // Wait for milestones to be visible
    await page.waitForSelector('text=Initial Merge Complete', { timeout: 5000 });
    
    // Check for different status chips
    const statusChips = page.locator('.MuiChip-root:has-text("completed"), .MuiChip-root:has-text("in progress"), .MuiChip-root:has-text("pending")');
    const count = await statusChips.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display key features for phases', async ({ page }) => {
    // Wait for key features
    await page.waitForSelector('text=/Faster Node Synchronization/', { timeout: 10000 });
    
    // Check Phase 1 key features
    const keyFeatures = [
      'Faster Node Synchronization',
      'Enhanced Security',
      'Modernized Features',
      'Performance Improvements'
    ];
    
    for (const feature of keyFeatures) {
      await expect(page.locator(`text=/${feature}/`)).toBeVisible();
    }
  });

  test('should show timeline on desktop', async ({ page, viewport }) => {
    // Skip if mobile viewport
    if (viewport.width < 960) {
      test.skip();
    }
    
    // Check for timeline header
    await page.waitForSelector('text=Development Timeline', { timeout: 10000 });
    await expect(page.locator('text=Development Timeline')).toBeVisible();
    
    // Check for timeline dots
    const timelineDots = page.locator('.MuiTimelineDot-root');
    const dotCount = await timelineDots.count();
    expect(dotCount).toBe(4); // 4 phases
  });

  test('should not show timeline on mobile', async ({ page, viewport }) => {
    // Skip if desktop viewport
    if (viewport.width >= 960) {
      test.skip();
    }
    
    // Timeline should not be visible on mobile
    await page.waitForTimeout(2000); // Give time for conditional rendering
    await expect(page.locator('text=Development Timeline')).not.toBeVisible();
  });

  test('should navigate from header menu', async ({ page }) => {
    // Go to home first
    await page.goto('/');
    
    // Check if mobile menu is needed
    const menuButton = page.locator('[aria-label="menu"]');
    const isMobile = await menuButton.isVisible();
    
    if (isMobile) {
      await menuButton.click();
      await page.waitForTimeout(500); // Wait for drawer animation
    }
    
    // Click roadmap link
    await page.click('text=Roadmap');
    
    // Wait for navigation
    await page.waitForURL('**/roadmap');
    
    // Verify we're on the roadmap page
    await expect(page.locator('h2:has-text("DigiByte Development Roadmap")')).toBeVisible();
  });

  test('should display phase descriptions', async ({ page }) => {
    // Wait for phase descriptions
    await page.waitForSelector('text=/Upgrading DigiByte Core/', { timeout: 10000 });
    
    // Check phase descriptions are visible
    await expect(page.locator('text=/Upgrading DigiByte Core from v8.22.1 to v8.26/')).toBeVisible();
    await expect(page.locator('text=/Implementing DigiDollar.*decentralized.*stablecoin/')).toBeVisible();
  });

  test('should show correct date ranges', async ({ page }) => {
    // Wait for date ranges
    await page.waitForSelector('text=Q3 2025 - Q1 2026', { timeout: 10000 });
    
    // Check all phase date ranges
    const dateRanges = [
      'Q3 2025 - Q1 2026',
      'Q1 2026 - Q4 2026',
      '2027 - 2028',
      '2029 - 2035'
    ];
    
    for (const range of dateRanges) {
      await expect(page.locator(`text=${range}`)).toBeVisible();
    }
  });

  test('should display footer information', async ({ page }) => {
    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Check footer text
    const footerText = page.locator('text=/Last Updated:.*This roadmap is subject to change/');
    await expect(footerText).toBeVisible();
  });

  test('should handle phase card hover effects', async ({ page }) => {
    // Wait for phase cards
    await page.waitForSelector('.MuiCard-root', { timeout: 10000 });
    
    // Get first phase card
    const phaseCard = page.locator('.MuiCard-root').filter({ hasText: 'Core Infrastructure Upgrade' }).first();
    
    // Hover over card
    await phaseCard.hover();
    
    // Card should have hover transform effect (visual regression test would be better here)
    // For now, just verify the card is still interactive
    await expect(phaseCard).toBeVisible();
  });

  test('should show milestone target dates', async ({ page }) => {
    // Expand first phase milestones
    await page.waitForSelector('text=/Milestones \\(\\d+\\/\\d+\\)/', { timeout: 10000 });
    const milestonesButton = page.locator('text=/Milestones \\(\\d+\\/\\d+\\)/').first();
    await milestonesButton.click();
    
    // Wait for milestones
    await page.waitForSelector('text=/Target:.*2025/', { timeout: 5000 });
    
    // Check for target dates
    const targetDates = page.locator('text=/Target:.*\\w+ \\d{4}/');
    const dateCount = await targetDates.count();
    expect(dateCount).toBeGreaterThan(0);
  });

  test('should display phase icons', async ({ page }) => {
    // Wait for phase cards
    await page.waitForSelector('.MuiCard-root', { timeout: 10000 });
    
    // Check for icon containers in phase headers
    const iconContainers = page.locator('.MuiCard-root svg').locator('..');
    const iconCount = await iconContainers.count();
    expect(iconCount).toBeGreaterThanOrEqual(4); // At least one icon per phase
  });
});