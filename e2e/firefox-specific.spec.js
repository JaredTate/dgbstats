import { test, expect } from '@playwright/test';

// Firefox-specific compatibility tests and fixes
test.describe('Firefox Browser Compatibility', () => {
  
  test.describe('Firefox Chart and Canvas Rendering', () => {
    test('Firefox D3.js SVG rendering timing', async ({ page, browserName }) => {
      test.skip(browserName !== 'firefox', 'Firefox-specific test');
      
      await page.goto('/pools');
      
      // Firefox often needs longer timeout for complex SVG rendering
      const loadingText = page.locator('text=Loading block data...');
      if (await loadingText.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(loadingText).not.toBeVisible({ timeout: 15000 });
      }
      
      // Firefox-specific: Extra wait for D3.js SVG rendering
      await page.waitForTimeout(2000);
      
      // Check for SVG chart with Firefox-specific selectors
      const svgChart = page.locator('svg').first();
      await expect(svgChart).toBeVisible({ timeout: 10000 });
      
      // Firefox SVG specific validations
      const svgInfo = await svgChart.evaluate(el => {
        const bbox = el.getBBox();
        const pathElements = el.querySelectorAll('path');
        const hasAnimation = el.querySelectorAll('animate, animateTransform').length > 0;
        
        return {
          width: bbox.width,
          height: bbox.height,
          pathCount: pathElements.length,
          hasAnimation: hasAnimation,
          viewBox: el.getAttribute('viewBox'),
          firefoxCompatible: true
        };
      });
      
      expect(svgInfo.width).toBeGreaterThan(100);
      expect(svgInfo.height).toBeGreaterThan(100);
      expect(svgInfo.pathCount).toBeGreaterThan(0);
      
      console.log(`Firefox SVG Chart: ${svgInfo.width}x${svgInfo.height}, ${svgInfo.pathCount} paths`);
    });

    test('Firefox Chart.js canvas performance', async ({ page, browserName }) => {
      test.skip(browserName !== 'firefox', 'Firefox-specific test');
      
      await page.goto('/supply');
      
      // Firefox canvas rendering often slower than Chrome
      const loadingText = page.locator('text=Loading...');
      if (await loadingText.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(loadingText).not.toBeVisible({ timeout: 15000 });
      }
      
      // Firefox-specific: Wait for Chart.js canvas initialization
      await page.waitForTimeout(3000);
      
      const canvas = page.locator('canvas').first();
      await expect(canvas).toBeVisible({ timeout: 12000 });
      
      // Firefox canvas specific tests
      const canvasInfo = await canvas.evaluate(el => {
        const ctx = el.getContext('2d');
        const rect = el.getBoundingClientRect();
        
        return {
          hasContext: !!ctx,
          canvasWidth: el.width,
          canvasHeight: el.height,
          displayWidth: rect.width,
          displayHeight: rect.height,
          firefoxOptimized: ctx && ctx.canvas === el
        };
      });
      
      expect(canvasInfo.hasContext).toBeTruthy();
      expect(canvasInfo.canvasWidth).toBeGreaterThan(200);
      expect(canvasInfo.canvasHeight).toBeGreaterThan(100);
      expect(canvasInfo.firefoxOptimized).toBeTruthy();
      
      console.log(`Firefox Canvas: ${canvasInfo.canvasWidth}x${canvasInfo.canvasHeight} (display: ${canvasInfo.displayWidth}x${canvasInfo.displayHeight})`);
    });
  });

  test.describe('Firefox WebSocket Handling', () => {
    test('Firefox WebSocket connection timing', async ({ page, browserName }) => {
      test.skip(browserName !== 'firefox', 'Firefox-specific test');
      
      // Monitor WebSocket connections in Firefox
      const wsConnections = [];
      let wsMessageCount = 0;
      
      page.on('websocket', ws => {
        wsConnections.push({
          url: ws.url(),
          timestamp: Date.now(),
          browser: 'firefox'
        });
        
        ws.on('framereceived', frame => {
          wsMessageCount++;
          if (frame.payload) {
            try {
              const data = JSON.parse(frame.payload);
              console.log(`Firefox WS received: ${data.type || 'unknown'} (message #${wsMessageCount})`);
            } catch (e) {
              // Ignore non-JSON frames
            }
          }
        });
      });
      
      await page.goto('/');
      
      // Firefox often needs more time for WebSocket establishment
      await page.waitForTimeout(4000);
      
      // Check for data that indicates WebSocket success
      const hasLiveData = await page.evaluate(() => {
        const text = document.body.textContent || '';
        // Look for patterns that indicate real-time data
        return /\d{1,3}(,\d{3})*(\.\d+)?\s*(DGB|MB|GB)/.test(text) ||
               /\d+:\d+:\d+/.test(text) || // Timestamps
               /Block #\d+/.test(text);    // Block numbers
      });
      
      console.log(`Firefox WebSocket Status: ${wsConnections.length} connections, ${wsMessageCount} messages, hasData: ${hasLiveData}`);
      
      // Firefox should establish WebSocket connections and receive data
      expect(wsConnections.length).toBeGreaterThanOrEqual(1);
      expect(hasLiveData).toBeTruthy();
    });

    test('Firefox WebSocket reconnection behavior', async ({ page, browserName }) => {
      test.skip(browserName !== 'firefox', 'Firefox-specific test');
      
      await page.goto('/');
      
      // Wait for initial connection
      await page.waitForTimeout(3000);
      
      // Get initial data state
      const initialData = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('.MuiCard-root'));
        return cards.map(card => card.textContent).join(' ');
      });
      
      // Simulate network interruption
      await page.route(/ws:\/\/.*/, route => route.abort());
      await page.route(/wss:\/\/.*/, route => route.abort());
      
      await page.waitForTimeout(2000);
      
      // Restore connections
      await page.unroute(/ws:\/\/.*|wss:\/\/.*/);
      
      // Firefox reconnection may take longer
      await page.waitForTimeout(5000);
      
      // Check if data is still present/refreshed
      const finalData = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('.MuiCard-root'));
        return cards.map(card => card.textContent).join(' ');
      });
      
      // Data should either persist or be refreshed
      expect(finalData.length).toBeGreaterThan(100);
      console.log('Firefox WebSocket reconnection: Data maintained after network interruption');
    });
  });

  test.describe('Firefox DOM and CSS Handling', () => {
    test('Firefox CSS Grid and Flexbox compatibility', async ({ page, browserName }) => {
      test.skip(browserName !== 'firefox', 'Firefox-specific test');
      
      await page.goto('/nodes');
      
      // Wait for content
      const loadingText = page.locator('text=Loading...');
      if (await loadingText.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(loadingText).not.toBeVisible({ timeout: 12000 });
      }
      
      // Firefox CSS compatibility checks
      const cssCompatibility = await page.evaluate(() => {
        const container = document.querySelector('.MuiContainer-root');
        const cards = document.querySelectorAll('.MuiCard-root');
        
        if (!container || cards.length === 0) return null;
        
        const containerStyles = getComputedStyle(container);
        const cardStyles = getComputedStyle(cards[0]);
        
        return {
          containerDisplay: containerStyles.display,
          containerMaxWidth: containerStyles.maxWidth,
          cardDisplay: cardStyles.display,
          cardBoxShadow: cardStyles.boxShadow !== 'none',
          cardBorderRadius: cardStyles.borderRadius,
          firefoxGridSupport: CSS.supports('display', 'grid'),
          firefoxFlexSupport: CSS.supports('display', 'flex'),
          mozBorderRadius: cardStyles.MozBorderRadius || 'not-set'
        };
      });
      
      if (cssCompatibility) {
        expect(cssCompatibility.firefoxGridSupport).toBeTruthy();
        expect(cssCompatibility.firefoxFlexSupport).toBeTruthy();
        expect(cssCompatibility.cardBoxShadow).toBeTruthy();
        
        console.log('Firefox CSS Support:', cssCompatibility);
      }
      
      // Check for layout integrity
      const cards = page.locator('.MuiCard-root');
      const cardCount = await cards.count();
      
      if (cardCount >= 2) {
        const card1Box = await cards.first().boundingBox();
        const card2Box = await cards.nth(1).boundingBox();
        
        if (card1Box && card2Box) {
          // Cards should not overlap in Firefox
          const noOverlap = (card1Box.x + card1Box.width <= card2Box.x + 10) ||
                           (card2Box.x + card2Box.width <= card1Box.x + 10) ||
                           (card1Box.y + card1Box.height <= card2Box.y + 10) ||
                           (card2Box.y + card2Box.height <= card1Box.y + 10);
          
          expect(noOverlap).toBeTruthy();
          console.log(`Firefox Layout: Card positions OK (${card1Box.x},${card1Box.y}) vs (${card2Box.x},${card2Box.y})`);
        }
      }
    });

    test('Firefox responsive design and viewport handling', async ({ page, browserName }) => {
      test.skip(browserName !== 'firefox', 'Firefox-specific test');
      
      const viewports = [
        { name: 'Desktop', width: 1024, height: 768 },
        { name: 'Tablet', width: 768, height: 1024 },
        { name: 'Mobile', width: 375, height: 667 }
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/pools');
        
        // Firefox viewport adjustment time
        await page.waitForTimeout(1000);
        
        // Check responsive behavior
        const isMobile = viewport.width < 768;
        const isTablet = viewport.width >= 768 && viewport.width < 1024;
        
        if (isMobile) {
          // Mobile menu should be visible
          const menuButton = page.locator('[aria-label="menu"]');
          await expect(menuButton).toBeVisible({ timeout: 5000 });
        }
        
        // Chart should adapt to viewport
        const chart = page.locator('svg, canvas').first();
        if (await chart.isVisible({ timeout: 5000 }).catch(() => false)) {
          const chartBox = await chart.boundingBox();
          if (chartBox) {
            expect(chartBox.width).toBeLessThanOrEqual(viewport.width);
            console.log(`Firefox ${viewport.name} (${viewport.width}x${viewport.height}): Chart ${Math.round(chartBox.width)}x${Math.round(chartBox.height)}`);
          }
        }
        
        // Check for horizontal scroll issues
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 50); // Allow small margin
      }
    });
  });

  test.describe('Firefox Performance and Memory', () => {
    test('Firefox memory usage and garbage collection', async ({ page, browserName }) => {
      test.skip(browserName !== 'firefox', 'Firefox-specific test');
      
      const pages = ['/', '/pools', '/nodes', '/supply'];
      const memoryStats = [];
      
      for (const testPage of pages) {
        const startTime = Date.now();
        await page.goto(testPage, { waitUntil: 'domcontentloaded' });
        const loadTime = Date.now() - startTime;
        
        // Firefox-specific memory monitoring
        const memoryInfo = await page.evaluate(() => {
          // Force garbage collection if available
          if (window.gc) {
            window.gc();
          }
          
          return {
            domNodes: document.querySelectorAll('*').length,
            loadTime: performance.timing ? 
              performance.timing.loadEventEnd - performance.timing.navigationStart : null,
            memorySupported: !!performance.memory,
            canvasElements: document.querySelectorAll('canvas').length,
            svgElements: document.querySelectorAll('svg').length
          };
        });
        
        memoryStats.push({
          page: testPage,
          loadTime,
          ...memoryInfo
        });
        
        // Memory usage should be reasonable
        expect(memoryInfo.domNodes).toBeLessThan(3000);
        expect(loadTime).toBeLessThan(10000); // 10 seconds max for Firefox
        
        console.log(`Firefox ${testPage}: ${loadTime}ms, ${memoryInfo.domNodes} DOM nodes, ${memoryInfo.canvasElements} canvas, ${memoryInfo.svgElements} SVG`);
      }
      
      // No significant memory growth between pages
      const nodeGrowth = memoryStats[memoryStats.length - 1].domNodes - memoryStats[0].domNodes;
      expect(nodeGrowth).toBeLessThan(1000);
    });

    test('Firefox animation and transition performance', async ({ page, browserName }) => {
      test.skip(browserName !== 'firefox', 'Firefox-specific test');
      
      await page.goto('/');
      
      // Test Firefox CSS transitions
      const transitionTest = await page.evaluate(() => {
        const cards = document.querySelectorAll('.MuiCard-root');
        if (cards.length === 0) return { supported: false };
        
        const card = cards[0];
        const initialTransform = getComputedStyle(card).transform;
        
        // Trigger hover state
        card.style.transform = 'scale(1.02)';
        card.style.transition = 'transform 0.3s ease';
        
        // Check if Firefox supports transitions
        const supportsTransitions = CSS.supports('transition', 'transform 0.3s ease');
        const supportsTransforms = CSS.supports('transform', 'scale(1.02)');
        
        // Reset
        card.style.transform = initialTransform;
        
        return {
          supported: true,
          transitions: supportsTransitions,
          transforms: supportsTransforms,
          initialTransform
        };
      });
      
      expect(transitionTest.supported).toBeTruthy();
      expect(transitionTest.transitions).toBeTruthy();
      expect(transitionTest.transforms).toBeTruthy();
      
      console.log('Firefox Animation Support:', transitionTest);
    });
  });

  test.describe('Firefox Text Rendering and Fonts', () => {
    test('Firefox font rendering and text clarity', async ({ page, browserName }) => {
      test.skip(browserName !== 'firefox', 'Firefox-specific test');
      
      await page.goto('/');
      
      // Wait for content and fonts
      await page.waitForSelector('h1', { timeout: 8000 });
      await page.waitForTimeout(1000); // Font loading
      
      const fontInfo = await page.evaluate(() => {
        const h1 = document.querySelector('h1');
        const body = document.body;
        
        if (!h1) return null;
        
        const h1Style = getComputedStyle(h1);
        const bodyStyle = getComputedStyle(body);
        
        return {
          h1FontFamily: h1Style.fontFamily,
          h1FontSize: h1Style.fontSize,
          h1FontWeight: h1Style.fontWeight,
          bodyFontFamily: bodyStyle.fontFamily,
          bodyFontSize: bodyStyle.fontSize,
          mozFontFeatureSettings: h1Style.MozFontFeatureSettings || 'not-set',
          fontSmoothing: h1Style.MozOsxFontSmoothing || 'not-set'
        };
      });
      
      if (fontInfo) {
        expect(fontInfo.h1FontFamily).toBeTruthy();
        expect(fontInfo.h1FontSize).toBeTruthy();
        expect(fontInfo.bodyFontFamily).toBeTruthy();
        
        console.log('Firefox Font Rendering:', {
          h1: `${fontInfo.h1FontFamily} ${fontInfo.h1FontSize} ${fontInfo.h1FontWeight}`,
          body: `${fontInfo.bodyFontFamily} ${fontInfo.bodyFontSize}`,
          smoothing: fontInfo.fontSmoothing
        });
      }
      
      // Check text readability
      const textElements = page.locator('h1, h2, h3, p').first();
      const textBox = await textElements.boundingBox();
      
      if (textBox) {
        expect(textBox.width).toBeGreaterThan(50);
        expect(textBox.height).toBeGreaterThan(10);
      }
    });
  });
});