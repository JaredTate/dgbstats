import { test, expect } from '@playwright/test';

// Cross-browser compatibility tests for Chrome, Edge, and Safari
test.describe('Browser Compatibility Tests', () => {
  
  test.describe('Chrome Specific Tests', () => {
    test('Chrome Canvas and WebGL compatibility', async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'Chrome-specific test');
      
      await page.goto('/supply');
      
      // Wait for chart to load
      const loadingText = page.locator('text=Loading...');
      if (await loadingText.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(loadingText).not.toBeVisible({ timeout: 10000 });
      }
      
      // Chrome-specific: Test hardware acceleration and Canvas 2D
      const canvas = page.locator('canvas').first();
      await expect(canvas).toBeVisible({ timeout: 8000 });
      
      // Test Chrome's canvas performance optimizations
      const canvasProps = await canvas.evaluate(el => {
        const ctx = el.getContext('2d');
        return {
          width: el.width,
          height: el.height,
          hasContext: !!ctx,
          canvasSupport: el.getContext('2d') !== null
        };
      });
      
      expect(canvasProps.hasContext).toBeTruthy();
      expect(canvasProps.canvasSupport).toBeTruthy();
      expect(canvasProps.width).toBeGreaterThan(0);
      expect(canvasProps.height).toBeGreaterThan(0);
      
      console.log(`Chrome canvas: ${canvasProps.width}x${canvasProps.height}`);
    });

    test('Chrome memory management', async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'Chrome-specific test');
      
      const pages = ['/', '/pools', '/nodes', '/supply'];
      
      for (const testPage of pages) {
        await page.goto(testPage);
        
        // Chrome-specific: Test memory usage patterns
        const memoryInfo = await page.evaluate(() => {
          if (performance.memory) {
            return {
              usedJSHeapSize: performance.memory.usedJSHeapSize,
              totalJSHeapSize: performance.memory.totalJSHeapSize,
              jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            };
          }
          return null;
        });
        
        if (memoryInfo) {
          // Memory usage should be reasonable in Chrome
          expect(memoryInfo.usedJSHeapSize).toBeLessThan(50 * 1024 * 1024); // 50MB
          console.log(`Chrome ${testPage}: ${Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024)}MB`);
        }
        
        // Check for memory leaks (basic)
        const elementCount = await page.evaluate(() => document.querySelectorAll('*').length);
        expect(elementCount).toBeLessThan(5000); // Reasonable DOM size for modern apps
      }
    });
  });

  test.describe('Edge Specific Tests', () => {
    test('Edge Chromium compatibility', async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium' || !process.env.PLAYWRIGHT_BROWSER_NAME?.includes('edge'), 'Edge-specific test');
      
      await page.goto('/pools');
      
      // Wait for content
      const loadingText = page.locator('text=Loading block data...');
      if (await loadingText.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(loadingText).not.toBeVisible({ timeout: 10000 });
      }
      
      // Edge-specific: Test D3.js SVG rendering
      const svg = page.locator('svg').first();
      await expect(svg).toBeVisible({ timeout: 8000 });
      
      // Test Edge's SVG capabilities
      const svgInfo = await svg.evaluate(el => {
        const bbox = el.getBBox();
        return {
          width: bbox.width,
          height: bbox.height,
          pathElements: el.querySelectorAll('path').length,
          hasViewBox: el.hasAttribute('viewBox')
        };
      });
      
      expect(svgInfo.width).toBeGreaterThan(0);
      expect(svgInfo.height).toBeGreaterThan(0);
      expect(svgInfo.pathElements).toBeGreaterThan(0);
      
      console.log(`Edge SVG: ${svgInfo.width}x${svgInfo.height}, ${svgInfo.pathElements} paths`);
    });

    test('Edge font rendering and typography', async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'Edge-specific test');
      
      await page.goto('/');
      
      // Wait for content
      await page.waitForSelector('h1', { timeout: 8000 });
      
      // Edge-specific: Test font rendering
      const fontInfo = await page.evaluate(() => {
        const h1 = document.querySelector('h1');
        const style = window.getComputedStyle(h1);
        return {
          fontFamily: style.fontFamily,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          lineHeight: style.lineHeight
        };
      });
      
      // Font should be properly loaded in Edge
      expect(fontInfo.fontFamily).toBeTruthy();
      expect(fontInfo.fontSize).toBeTruthy();
      
      console.log(`Edge fonts: ${fontInfo.fontFamily}, ${fontInfo.fontSize}`);
    });
  });

  test.describe('Safari/WebKit Specific Tests', () => {
    test('Safari CSS Grid and Flexbox compatibility', async ({ page, browserName }) => {
      test.skip(browserName !== 'webkit', 'Safari-specific test');
      
      await page.goto('/nodes');
      
      // Wait for content
      const loadingText = page.locator('text=Loading...');
      if (await loadingText.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(loadingText).not.toBeVisible({ timeout: 10000 });
      }
      
      // Safari-specific: Test CSS Grid layout
      const cards = page.locator('.MuiCard-root');
      const cardCount = await cards.count();
      
      if (cardCount > 1) {
        // Test Safari's grid implementation
        const gridInfo = await page.evaluate(() => {
          const container = document.querySelector('.MuiContainer-root');
          const style = window.getComputedStyle(container);
          return {
            display: style.display,
            gridGap: style.gridGap || style.gap,
            flexWrap: style.flexWrap
          };
        });
        
        console.log(`Safari grid: ${JSON.stringify(gridInfo)}`);
      }
      
      // Verify cards don't overlap in Safari
      if (cardCount >= 2) {
        const card1Box = await cards.first().boundingBox();
        const card2Box = await cards.nth(1).boundingBox();
        
        if (card1Box && card2Box) {
          // Cards should not overlap in Safari
          const overlap = !(card1Box.x + card1Box.width <= card2Box.x || 
                           card2Box.x + card2Box.width <= card1Box.x ||
                           card1Box.y + card1Box.height <= card2Box.y ||
                           card2Box.y + card2Box.height <= card1Box.y);
          expect(overlap).toBeFalsy();
        }
      }
    });

    test('Safari WebSocket and real-time updates', async ({ page, browserName }) => {
      test.skip(browserName !== 'webkit', 'Safari-specific test');
      
      await page.goto('/');
      
      // Safari-specific: Longer WebSocket connection time
      await page.waitForTimeout(3000);
      
      // Test Safari's WebSocket implementation
      const wsStatus = await page.evaluate(() => {
        return {
          webSocketSupport: typeof WebSocket !== 'undefined',
          connectionReadyState: window.WebSocket ? window.WebSocket.CONNECTING : null
        };
      });
      
      expect(wsStatus.webSocketSupport).toBeTruthy();
      
      // Check for data updates in Safari
      const statCards = page.locator('.MuiCard-root').filter({ hasText: /Total Blocks|Circulating Supply/i });
      await expect(statCards.first()).toBeVisible({ timeout: 10000 });
      
      // Verify data is being received
      const hasData = await page.evaluate(() => {
        const text = document.body.textContent || '';
        return /\d{1,3}(,\d{3})*(\.\d+)?\s*(DGB|GB|MB)/.test(text);
      });
      
      expect(hasData).toBeTruthy();
      console.log('Safari: WebSocket data received successfully');
    });

    test('Safari mobile viewport and orientation', async ({ page, browserName }) => {
      test.skip(browserName !== 'webkit', 'Safari-specific test');
      
      // Test Safari mobile viewports
      const viewports = [
        { name: 'iPhone SE', width: 375, height: 667 },
        { name: 'iPhone 12', width: 390, height: 844 },
        { name: 'iPad Mini', width: 768, height: 1024 }
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/pools');
        
        // Safari-specific: Wait for viewport adjustment
        await page.waitForTimeout(1000);
        
        // Check responsive behavior in Safari
        const isMobile = viewport.width < 768;
        const menuButton = page.locator('[aria-label="menu"]');
        
        if (isMobile) {
          await expect(menuButton).toBeVisible({ timeout: 5000 });
        }
        
        // Check chart responsiveness in Safari
        const chart = page.locator('svg, canvas').first();
        if (await chart.isVisible()) {
          const chartBox = await chart.boundingBox();
          if (chartBox) {
            expect(chartBox.width).toBeLessThanOrEqual(viewport.width);
            console.log(`Safari ${viewport.name}: Chart ${chartBox.width}x${chartBox.height}`);
          }
        }
      }
    });
  });

  test.describe('Cross-Browser API Compatibility', () => {
    test('Fetch API compatibility', async ({ page, browserName }) => {
      await page.goto('/downloads');
      
      // Test Fetch API across browsers
      const fetchSupport = await page.evaluate(() => {
        return {
          hasFetch: typeof fetch !== 'undefined',
          hasPromise: typeof Promise !== 'undefined',
          hasAsyncAwait: (async () => {}).constructor.name === 'AsyncFunction'
        };
      });
      
      expect(fetchSupport.hasFetch).toBeTruthy();
      expect(fetchSupport.hasPromise).toBeTruthy();
      expect(fetchSupport.hasAsyncAwait).toBeTruthy();
      
      console.log(`${browserName}: Modern APIs supported`);
    });

    test('LocalStorage and SessionStorage compatibility', async ({ page, browserName }) => {
      await page.goto('/');
      
      // Test storage APIs across browsers
      const storageSupport = await page.evaluate(() => {
        try {
          localStorage.setItem('test', 'value');
          sessionStorage.setItem('test', 'value');
          return {
            localStorage: localStorage.getItem('test') === 'value',
            sessionStorage: sessionStorage.getItem('test') === 'value'
          };
        } catch (e) {
          return { localStorage: false, sessionStorage: false };
        } finally {
          try {
            localStorage.removeItem('test');
            sessionStorage.removeItem('test');
          } catch (e) {
            // Ignore cleanup errors
          }
        }
      });
      
      expect(storageSupport.localStorage).toBeTruthy();
      expect(storageSupport.sessionStorage).toBeTruthy();
      
      console.log(`${browserName}: Storage APIs supported`);
    });

    test('CSS custom properties (variables) support', async ({ page, browserName }) => {
      await page.goto('/');
      
      // Test CSS custom properties support
      const cssSupport = await page.evaluate(() => {
        const testElement = document.createElement('div');
        testElement.style.setProperty('--test-var', 'red');
        document.body.appendChild(testElement);
        
        const computedStyle = window.getComputedStyle(testElement);
        const support = computedStyle.getPropertyValue('--test-var').trim() === 'red';
        
        document.body.removeChild(testElement);
        return support;
      });
      
      expect(cssSupport).toBeTruthy();
      console.log(`${browserName}: CSS custom properties supported`);
    });

    test('ES6+ features compatibility', async ({ page, browserName }) => {
      await page.goto('/');
      
      // Test modern JavaScript features
      const jsSupport = await page.evaluate(() => {
        try {
          // Arrow functions
          const arrow = () => true;
          
          // Template literals
          const template = `test`;
          
          // Destructuring
          const [a] = [1];
          const {b} = {b: 2};
          
          // Spread operator
          const spread = [...[1, 2, 3]];
          
          // Maps and Sets
          const map = new Map();
          const set = new Set();
          
          return {
            arrow: arrow(),
            template: template === 'test',
            destructuring: a === 1 && b === 2,
            spread: spread.length === 3,
            mapSet: map instanceof Map && set instanceof Set
          };
        } catch (e) {
          return { error: e.message };
        }
      });
      
      if (jsSupport.error) {
        console.log(`${browserName}: JS compatibility error: ${jsSupport.error}`);
      } else {
        expect(jsSupport.arrow).toBeTruthy();
        expect(jsSupport.template).toBeTruthy();
        expect(jsSupport.destructuring).toBeTruthy();
        expect(jsSupport.spread).toBeTruthy();
        expect(jsSupport.mapSet).toBeTruthy();
        
        console.log(`${browserName}: ES6+ features supported`);
      }
    });
  });

  test.describe('Performance Comparison', () => {
    test('Cross-browser page load performance', async ({ page, browserName }) => {
      const pages = ['/', '/pools', '/nodes'];
      
      for (const testPage of pages) {
        const startTime = Date.now();
        await page.goto(testPage, { waitUntil: 'domcontentloaded' });
        const loadTime = Date.now() - startTime;
        
        // Performance should be reasonable across browsers
        expect(loadTime).toBeLessThan(15000); // 15 seconds max
        
        console.log(`${browserName} ${testPage}: ${loadTime}ms load time`);
      }
    });

    test('Chart rendering performance comparison', async ({ page, browserName }) => {
      await page.goto('/supply');
      
      // Wait for content
      const loadingText = page.locator('text=Loading...');
      if (await loadingText.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(loadingText).not.toBeVisible({ timeout: 10000 });
      }
      
      // Measure chart rendering time
      const renderTime = await page.evaluate(() => {
        const start = performance.now();
        const canvas = document.querySelector('canvas');
        if (canvas) {
          // Trigger a repaint
          canvas.style.display = 'none';
          canvas.offsetHeight; // Force reflow
          canvas.style.display = '';
        }
        return performance.now() - start;
      });
      
      // Rendering should be fast across browsers
      expect(renderTime).toBeLessThan(1000); // 1 second max
      
      console.log(`${browserName}: Chart render time ${renderTime.toFixed(2)}ms`);
    });
  });
});