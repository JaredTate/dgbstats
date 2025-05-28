import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to all pages via header links', async ({ page }) => {
    // Check home page loads
    await expect(page.locator('h1')).toContainText('DigiByte Blockchain Statistics');
    
    // Navigate to Nodes page
    await page.click('text=Nodes');
    await expect(page.locator('h1')).toContainText('DigiByte Network Nodes');
    await expect(page.url()).toContain('/nodes');
    
    // Navigate to Pools page
    await page.click('text=Pools');
    await expect(page.locator('h1')).toContainText('Mining Pool Distribution');
    await expect(page.url()).toContain('/pools');
    
    // Navigate to Supply page
    await page.click('text=Supply');
    await expect(page.locator('h1')).toContainText('DigiByte Supply Statistics');
    await expect(page.url()).toContain('/supply');
    
    // Navigate to Hashrate page
    await page.click('text=Hashrate');
    await expect(page.locator('h1')).toContainText('Network Hashrate Analysis');
    await expect(page.url()).toContain('/hashrate');
    
    // Navigate to Downloads page
    await page.click('text=Downloads');
    await expect(page.locator('h1')).toContainText('DigiByte Core Downloads');
    await expect(page.url()).toContain('/downloads');
    
    // Navigate to Difficulties page
    await page.click('text=Difficulties');
    await expect(page.locator('h1')).toContainText('Mining Difficulty Tracker');
    await expect(page.url()).toContain('/difficulties');
    
    // Navigate to Blocks page
    await page.click('text=Blocks');
    await expect(page.locator('h1')).toContainText('Recent Blocks');
    await expect(page.url()).toContain('/blocks');
    
    // Navigate to Algos page
    await page.click('text=Algos');
    await expect(page.locator('h1')).toContainText('Algorithm Distribution');
    await expect(page.url()).toContain('/algos');
    
    // Navigate to Taproot page
    await page.click('text=Taproot');
    await expect(page.locator('h1')).toContainText('Taproot Activation Status');
    await expect(page.url()).toContain('/taproot');
    
    // Navigate back to home
    await page.click('text=Home');
    await expect(page.locator('h1')).toContainText('DigiByte Blockchain Statistics');
    await expect(page.url()).toBe('http://localhost:3005/');
  });

  test('should handle direct URL navigation', async ({ page }) => {
    // Direct navigation to each page
    const pages = [
      { path: '/nodes', title: 'DigiByte Network Nodes' },
      { path: '/pools', title: 'Mining Pool Distribution' },
      { path: '/supply', title: 'DigiByte Supply Statistics' },
      { path: '/hashrate', title: 'Network Hashrate Analysis' },
      { path: '/downloads', title: 'DigiByte Core Downloads' },
      { path: '/difficulties', title: 'Mining Difficulty Tracker' },
      { path: '/blocks', title: 'Recent Blocks' },
      { path: '/algos', title: 'Algorithm Distribution' },
      { path: '/taproot', title: 'Taproot Activation Status' }
    ];
    
    for (const pageInfo of pages) {
      await page.goto(pageInfo.path);
      await expect(page.locator('h1')).toContainText(pageInfo.title);
    }
  });

  test('should maintain header and footer on all pages', async ({ page }) => {
    const pages = ['/', '/nodes', '/pools', '/supply', '/hashrate'];
    
    for (const path of pages) {
      await page.goto(path);
      
      // Check header is present
      await expect(page.locator('header')).toBeVisible();
      await expect(page.locator('img[alt="DigiByte Logo"]')).toBeVisible();
      
      // Check footer is present
      await expect(page.locator('footer')).toBeVisible();
      await expect(page.locator('text=© 2024 DigiByte Stats')).toBeVisible();
    }
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    // Navigate through several pages
    await page.click('text=Nodes');
    await expect(page.locator('h1')).toContainText('DigiByte Network Nodes');
    
    await page.click('text=Pools');
    await expect(page.locator('h1')).toContainText('Mining Pool Distribution');
    
    await page.click('text=Supply');
    await expect(page.locator('h1')).toContainText('DigiByte Supply Statistics');
    
    // Go back
    await page.goBack();
    await expect(page.locator('h1')).toContainText('Mining Pool Distribution');
    
    await page.goBack();
    await expect(page.locator('h1')).toContainText('DigiByte Network Nodes');
    
    // Go forward
    await page.goForward();
    await expect(page.locator('h1')).toContainText('Mining Pool Distribution');
  });

  test('should show active state for current page in navigation', async ({ page }) => {
    // Check home page active state
    const homeLink = page.locator('nav a[href="/"]');
    await expect(homeLink).toHaveCSS('font-weight', '700'); // Bold for active
    
    // Navigate to Nodes and check active state
    await page.click('text=Nodes');
    const nodesLink = page.locator('nav a[href="/nodes"]');
    await expect(nodesLink).toHaveCSS('font-weight', '700');
    
    // Home should no longer be active
    await expect(homeLink).not.toHaveCSS('font-weight', '700');
  });
});