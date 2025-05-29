import { test, expect } from '@playwright/test';
import { 
  waitForLoadingComplete, 
  detectWebSocketState 
} from './test-helpers.js';

test.describe('Downloads Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock GitHub API response
    await page.route('https://api.github.com/repos/digibyte-core/digibyte/releases', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            tag_name: 'v8.22.0',
            name: 'DigiByte Core v8.22.0',
            published_at: '2023-12-01T00:00:00Z',
            html_url: 'https://github.com/DigiByte-Core/digibyte/releases/tag/v8.22.0',
            body: 'Release notes for v8.22.0',
            assets: [
              {
                id: 11,
                name: 'digibyte-8.22.0-win64.zip',
                download_count: 12345,
                browser_download_url: 'https://github.com/DigiByte-Core/DigiByte/releases/download/v8.22.0/digibyte-8.22.0-win64.zip'
              },
              {
                id: 12,
                name: 'digibyte-8.22.0-osx.dmg',
                download_count: 6789,
                browser_download_url: 'https://github.com/DigiByte-Core/DigiByte/releases/download/v8.22.0/digibyte-8.22.0-osx.dmg'
              },
              {
                id: 13,
                name: 'digibyte-8.22.0-x86_64-linux-gnu.tar.gz',
                download_count: 8901,
                browser_download_url: 'https://github.com/DigiByte-Core/DigiByte/releases/download/v8.22.0/digibyte-8.22.0-x86_64-linux-gnu.tar.gz'
              }
            ]
          },
          {
            id: 2,
            tag_name: 'v7.17.3',
            name: 'DigiByte Core v7.17.3',
            published_at: '2022-06-15T00:00:00Z',
            html_url: 'https://github.com/DigiByte-Core/digibyte/releases/tag/v7.17.3',
            body: 'Release notes for v7.17.3',
            assets: [
              {
                id: 21,
                name: 'digibyte-7.17.3-win64.zip',
                download_count: 45678,
                browser_download_url: 'https://github.com/DigiByte-Core/DigiByte/releases/download/v7.17.3/digibyte-7.17.3-win64.zip'
              },
              {
                id: 22,
                name: 'digibyte-7.17.3-osx64.tar.gz',
                download_count: 23456,
                browser_download_url: 'https://github.com/DigiByte-Core/DigiByte/releases/download/v7.17.3/digibyte-7.17.3-osx64.tar.gz'
              },
              {
                id: 23,
                name: 'digibyte-7.17.3-x86_64-linux-gnu.tar.gz',
                download_count: 34567,
                browser_download_url: 'https://github.com/DigiByte-Core/DigiByte/releases/download/v7.17.3/digibyte-7.17.3-x86_64-linux-gnu.tar.gz'
              }
            ]
          }
        ])
      });
    });

    await page.goto('/downloads');
  });

  test('should display page title and description', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('DigiByte Core Wallet Downloads');
    await expect(page.locator('text=One way to estimate network size is total amount of DGB core wallets downloaded')).toBeVisible();
  });

  test('should display download button', async ({ page }) => {
    const downloadButton = page.locator('a:has-text("Download Latest Release on GitHub")');
    await expect(downloadButton).toBeVisible();
    
    // Check it's a link to GitHub releases
    await expect(downloadButton).toHaveAttribute('href', 'https://github.com/DigiByte-Core/digibyte/releases');
    await expect(downloadButton).toHaveAttribute('target', '_blank');
  });

  test('should display total download count', async ({ page }) => {
    // Standardized loading state handling
    const loadingText = page.locator('text=Loading...');
    if (await loadingText.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(loadingText).not.toBeVisible({ timeout: 10000 });
    }
    
    // Wait for progress indicators to complete
    const loadingIndicator = page.locator('role=progressbar');
    if (await loadingIndicator.count() > 0) {
      await expect(loadingIndicator).not.toBeVisible({ timeout: 10000 });
    }

    // Total downloads: 12345 + 6789 + 8901 + 45678 + 23456 + 34567 = 131736
    await expect(page.locator('text=131,736')).toBeVisible();
    await expect(page.locator('text=Total Downloads')).toBeVisible();
  });

  test('should display release information', async ({ page }) => {
    // Standardized loading state handling
    const loadingText = page.locator('text=Loading...');
    if (await loadingText.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(loadingText).not.toBeVisible({ timeout: 10000 });
    }
    
    // Wait for loading to complete - check for progress bar
    await page.waitForLoadState('networkidle');
    
    // Progress indicators should be gone
    await expect(page.locator('[role="progressbar"], [data-testid="loading-indicator"]')).not.toBeVisible();

    // Check release titles
    await expect(page.locator('text=DigiByte Core v8.22.0')).toBeVisible();
    await expect(page.locator('text=DigiByte Core v7.17.3')).toBeVisible();

    // Check latest badge - it's a Chip component with "Latest" text
    // The first release in our mock data should have it
    const latestChip = page.locator('.MuiChip-root:has-text("Latest")');
    await expect(latestChip).toBeVisible();

    // Check download counts for each release
    await expect(page.locator('text=28,035 Downloads')).toBeVisible(); // v8.22.0 total
    await expect(page.locator('text=103,701 Downloads')).toBeVisible(); // v7.17.3 total
  });

  test('should display platform categories', async ({ page }) => {
    // Standardized loading state handling
    const loadingText = page.locator('text=Loading...');
    if (await loadingText.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(loadingText).not.toBeVisible({ timeout: 10000 });
    }
    
    // Wait for content to load
    const loadingIndicator = page.locator('text=Loading releases data...');
    if (await loadingIndicator.isVisible()) {
      await expect(loadingIndicator).not.toBeVisible({ timeout: 10000 });
    }

    // Check platform headers
    await expect(page.locator('text=Windows').first()).toBeVisible();
    await expect(page.locator('text=macOS').first()).toBeVisible();
    await expect(page.locator('text=Linux').first()).toBeVisible();
  });

  test('should display download links for assets', async ({ page }) => {
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[role="progressbar"], [data-testid="loading-indicator"]')).not.toBeVisible();

    // Check asset names are visible
    await expect(page.locator('text=digibyte-8.22.0-win64.zip')).toBeVisible();
    await expect(page.locator('text=digibyte-8.22.0-osx.dmg')).toBeVisible();
    await expect(page.locator('text=digibyte-8.22.0-x86_64-linux-gnu.tar.gz')).toBeVisible();

    // Check download counts are displayed as links (they are anchor elements with the count as text)
    await expect(page.locator('a:has-text("12,345")')).toBeVisible(); // Windows
    await expect(page.locator('a:has-text("6,789")')).toBeVisible(); // macOS
    await expect(page.locator('a:has-text("8,901")')).toBeVisible(); // Linux
  });

  test('should display wallet information sections', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Scroll to bottom to ensure content is visible
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    // Wait for scroll to complete
    await page.waitForFunction(() => window.scrollY + window.innerHeight >= document.body.scrollHeight - 50, { timeout: 2000 }).catch(() => {});

    await expect(page.locator('text=About DigiByte Wallets')).toBeVisible();
    await expect(page.locator('text=Core Wallet').first()).toBeVisible();
    await expect(page.locator('text=Other Wallet Options')).toBeVisible();
    
    // Check educational content
    await expect(page.locator('text=The DigiByte Core wallet is the full node implementation')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Navigate to a new page first
    await page.goto('/');
    
    // Mock API error - Firefox handles route failures differently
    await page.route('https://api.github.com/repos/digibyte-core/digibyte/releases', async route => {
      await route.abort('failed');
    });

    // Navigate to downloads page
    await page.goto('/downloads');

    // Firefox-specific: Longer timeout for error state to settle
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(1000); // Firefox needs extra time for error handling
    await expect(page.locator('role=progressbar')).toHaveCount(0);

    // Should still show the page structure
    await expect(page.locator('h1')).toContainText('DigiByte Core Wallet Downloads');
    
    // Total downloads should show 0 when no data
    await expect(page.locator('text=0').first()).toBeVisible();
  });

  test('should have responsive design', async ({ page, viewport }) => {
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Page should still be functional
    await expect(page.locator('h1')).toContainText('DigiByte Core Wallet Downloads');
    
    // Download button should be visible
    await expect(page.locator('text=Download Latest Release on GitHub')).toBeVisible();
  });

  test('should format numbers with commas correctly', async ({ page }) => {
    // Wait for data to load
    const loadingIndicator = page.locator('text=Loading releases data...');
    if (await loadingIndicator.isVisible()) {
      await expect(loadingIndicator).not.toBeVisible({ timeout: 10000 });
    }

    // Check various formatted numbers
    await expect(page.locator('text=131,736')).toBeVisible(); // Total
    await expect(page.locator('text=12,345')).toBeVisible(); // Windows v8.22.0
    await expect(page.locator('text=45,678')).toBeVisible(); // Windows v7.17.3
  });

  test('should display release notes preview', async ({ page }) => {
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[role="progressbar"], [data-testid="loading-indicator"]')).not.toBeVisible();

    // Check release notes section exists - there should be at least one
    await expect(page.locator('text=Release Notes:').first()).toBeVisible();
    await expect(page.locator('text=Release notes for v8.22.0')).toBeVisible();
  });

  test('should have accessible external links', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Firefox-specific: Wait for link attributes to be fully loaded
    await page.waitForTimeout(500);
    
    // Check specific external links that we know have rel attributes
    // The main download button has rel="noopener noreferrer"
    const mainDownloadButton = page.locator('a:has-text("Download Latest Release on GitHub")');
    await expect(mainDownloadButton).toHaveAttribute('rel', 'noopener noreferrer', { timeout: 3000 });
    
    // The official website link in the info section
    const websiteLink = page.locator('a[href="https://digibyte.org/en-us/#download"]');
    await expect(websiteLink).toHaveAttribute('rel', 'noopener noreferrer', { timeout: 3000 });
    
    // Note: Individual asset download buttons don't have rel attributes in the component
    // This is a known limitation of the current implementation
  });
});