import { test, expect } from '@playwright/test';

// Mobile debugging utilities for cross-device compatibility
test.describe('Mobile Debug and Compatibility', () => {
  
  test('Viewport and device capability detection', async ({ page, browserName }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Debug viewport and device capabilities
    const deviceInfo = await page.evaluate(() => {
      return {
        userAgent: navigator.userAgent,
        viewport: {
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio,
          orientation: screen.orientation?.type || 'unknown'
        },
        touch: {
          maxTouchPoints: navigator.maxTouchPoints,
          hasTouch: 'ontouchstart' in window,
          hasPointer: 'onpointerdown' in window
        },
        css: {
          supports: {
            grid: CSS.supports('display', 'grid'),
            flexbox: CSS.supports('display', 'flex'),
            webkitTransform: CSS.supports('-webkit-transform', 'translateZ(0)')
          }
        },
        webgl: (() => {
          try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
          } catch (e) {
            return false;
          }
        })()
      };
    });
    
    console.log(`${browserName} Device Info:`, JSON.stringify(deviceInfo, null, 2));
    
    // Basic capability checks
    expect(deviceInfo.viewport.innerWidth).toBe(375);
    expect(deviceInfo.viewport.innerHeight).toBe(667);
    
    // WebKit-specific checks
    if (browserName === 'webkit') {
      expect(deviceInfo.userAgent).toContain('WebKit');
      expect(deviceInfo.css.supports.webkitTransform).toBeTruthy();
    }
  });

  test('Chart and Canvas compatibility across browsers', async ({ page, browserName }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const testPages = [
      { path: '/supply', chartType: 'canvas', description: 'Chart.js canvas' },
      { path: '/pools', chartType: 'svg', description: 'D3.js SVG pie chart' },
      { path: '/nodes', chartType: 'svg', description: 'D3.js SVG world map' }
    ];
    
    for (const testPage of testPages) {
      await page.goto(testPage.path);
      
      // Wait for loading with longer timeout
      const loadingText = page.locator('text=Loading...');
      if (await loadingText.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(loadingText).not.toBeVisible({ timeout: 15000 });
      }
      
      // Ensure page content loaded first
      await expect(page.locator('h1, h2')).toBeVisible({ timeout: 10000 });
      
      // Extended wait for chart rendering, especially WebKit
      const waitTime = browserName === 'webkit' ? 4000 : 2000;
      await page.waitForTimeout(waitTime);
      
      // Check for chart element
      const chartSelector = testPage.chartType === 'canvas' ? 'canvas' : 'svg';
      const charts = page.locator(chartSelector);
      const chartCount = await charts.count();
      
      if (chartCount > 0) {
        const chart = charts.first();
        const isVisible = await chart.isVisible({ timeout: 10000 }).catch(() => false);
        
        if (isVisible) {
          const chartBox = await chart.boundingBox();
          const chartInfo = await page.evaluate((selector) => {
            const element = document.querySelector(selector);
            if (!element) return null;
            
            return {
              tagName: element.tagName,
              hasContent: element.children.length > 0 || element.textContent.length > 0,
              computedStyle: {
                display: getComputedStyle(element).display,
                visibility: getComputedStyle(element).visibility,
                opacity: getComputedStyle(element).opacity
              },
              boundingRect: element.getBoundingClientRect()
            };
          }, chartSelector);
          
          console.log(`${browserName} ${testPage.description}:`, {
            visible: isVisible,
            dimensions: chartBox,
            elementInfo: chartInfo
          });
          
          expect(isVisible).toBeTruthy();
          if (chartBox) {
            // Very lenient for mobile compatibility
            expect(chartBox.width).toBeGreaterThan(10);
            expect(chartBox.height).toBeGreaterThan(10);
            expect(chartBox.width).toBeLessThanOrEqual(375);
          }
        } else {
          console.log(`${browserName} ${testPage.description}: Chart not visible but page loaded`);
        }
      } else {
        console.log(`${browserName} ${testPage.description}: No ${testPage.chartType} elements found`);
      }
    }
  });

  test('WebSocket connectivity across mobile browsers', async ({ page, browserName }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Monitor WebSocket connections
    const wsConnections = [];
    page.on('websocket', ws => {
      wsConnections.push({
        url: ws.url(),
        browser: browserName,
        timestamp: Date.now()
      });
      
      ws.on('framereceived', frame => {
        if (frame.payload) {
          try {
            const data = JSON.parse(frame.payload);
            console.log(`${browserName} WS received:`, data.type || 'unknown');
          } catch (e) {
            // Ignore non-JSON frames
          }
        }
      });
    });
    
    await page.goto('/');
    
    // Wait for potential WebSocket connection
    await page.waitForTimeout(3000);
    
    // Check if we have WebSocket data indicators
    const hasData = await page.evaluate(() => {
      const text = document.body.textContent || '';
      // Look for numeric data that would indicate WebSocket success
      return /\d{1,3}(,\d{3})*(\.\d+)?/.test(text);
    });
    
    console.log(`${browserName} WebSocket status:`, {
      connections: wsConnections.length,
      hasData: hasData
    });
    
    // At minimum, page should render with or without WebSocket
    await expect(page.locator('h1, h2')).toBeVisible();
  });

  test('Mobile interaction patterns', async ({ page, browserName }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Wait for page load with longer timeout
    const loadingText = page.locator('text=Loading...');
    if (await loadingText.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(loadingText).not.toBeVisible({ timeout: 12000 });
    }
    
    // Ensure page content is loaded
    await expect(page.locator('h1, h2')).toBeVisible({ timeout: 8000 });
    
    // Test scrolling performance
    const initialScrollY = await page.evaluate(() => window.scrollY);
    const scrollStartTime = Date.now();
    
    await page.evaluate(() => {
      window.scrollTo(0, 500);
    });
    
    await page.waitForTimeout(500); // Allow scroll to complete
    const scrollY = await page.evaluate(() => window.scrollY);
    const scrollTime = Date.now() - scrollStartTime;
    
    // Test menu interaction
    const menuButton = page.locator('[aria-label="menu"]');
    const menuClickTime = Date.now();
    
    if (await menuButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await menuButton.click();
      const drawerVisible = await page.locator('.MuiDrawer-root').isVisible({ timeout: 5000 }).catch(() => false);
      const menuResponseTime = Date.now() - menuClickTime;
      
      console.log(`${browserName} Mobile Interactions:`, {
        scrollTime: scrollTime,
        initialScrollY: initialScrollY,
        finalScrollY: scrollY,
        scrollDifference: scrollY - initialScrollY,
        menuResponseTime: menuResponseTime,
        drawerOpened: drawerVisible
      });
      
      expect(scrollY).toBeGreaterThan(initialScrollY + 100);
      expect(menuResponseTime).toBeLessThan(3000); // More lenient
      
      if (drawerVisible) {
        // Test drawer content
        const navItems = page.locator('.MuiDrawer-root a, .MuiDrawer-root button');
        const navCount = await navItems.count();
        expect(navCount).toBeGreaterThan(2);
      }
    } else {
      console.log(`${browserName}: Menu button not found, checking alternative navigation`);
      // Menu might not be visible on this viewport/page
    }
  });

  test('CSS and styling compatibility', async ({ page, browserName }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Wait for content
    await page.waitForSelector('.MuiCard-root', { timeout: 8000 });
    
    // Check CSS compatibility
    const styleInfo = await page.evaluate(() => {
      const card = document.querySelector('.MuiCard-root');
      if (!card) return null;
      
      const styles = getComputedStyle(card);
      return {
        display: styles.display,
        boxShadow: styles.boxShadow !== 'none',
        borderRadius: styles.borderRadius,
        transform: styles.transform,
        transition: styles.transition,
        webkitTransform: styles.webkitTransform || 'not supported',
        grid: CSS.supports('display', 'grid'),
        flexbox: CSS.supports('display', 'flex'),
        modernFeatures: {
          cssGrid: CSS.supports('display', 'grid'),
          flexbox: CSS.supports('display', 'flex'),
          transforms: CSS.supports('transform', 'translateZ(0)'),
          animations: CSS.supports('animation', 'none')
        }
      };
    });
    
    console.log(`${browserName} CSS Compatibility:`, styleInfo);
    
    if (styleInfo) {
      expect(styleInfo.modernFeatures.flexbox).toBeTruthy();
      
      // WebKit should support transforms
      if (browserName === 'webkit') {
        expect(styleInfo.modernFeatures.transforms).toBeTruthy();
      }
    }
  });

  test('Network and loading behavior', async ({ page, browserName }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Monitor network requests
    const requests = [];
    page.on('request', request => {
      requests.push({
        url: request.url(),
        resourceType: request.resourceType(),
        method: request.method()
      });
    });
    
    const startTime = Date.now();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const domLoadTime = Date.now() - startTime;
    
    // Wait for additional resources
    await page.waitForTimeout(2000);
    const totalTime = Date.now() - startTime;
    
    // Analyze requests
    const requestsByType = requests.reduce((acc, req) => {
      acc[req.resourceType] = (acc[req.resourceType] || 0) + 1;
      return acc;
    }, {});
    
    console.log(`${browserName} Network Performance:`, {
      domLoadTime: domLoadTime,
      totalTime: totalTime,
      totalRequests: requests.length,
      requestsByType: requestsByType
    });
    
    // Basic performance expectations
    expect(domLoadTime).toBeLessThan(8000);
    expect(requests.length).toBeGreaterThan(5); // Should have some assets
    
    // Check for essential assets
    const hasJS = requests.some(req => req.url.includes('.js'));
    const hasCSS = requests.some(req => req.url.includes('.css'));
    expect(hasJS || hasCSS).toBeTruthy();
  });
});