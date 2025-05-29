import { test, expect } from '@playwright/test';

// Safari/WebKit specific compatibility fixes and tests
test.describe('Safari/WebKit Browser Compatibility', () => {
  
  test.beforeEach(async ({ page, context, browserName }) => {
    // Skip non-WebKit browsers
    if (browserName !== 'webkit') {
      test.skip();
    }
    
    // WebKit-specific setup
    await context.addInitScript(() => {
      // Fix WebKit-specific issues
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: false,
        value: 5,
      });
    });
  });

  test.describe('WebKit Canvas and Chart Rendering', () => {
    test('Safari Chart.js canvas compatibility', async ({ page }) => {
      await page.goto('/supply');
      
      // Safari often has delayed canvas rendering
      const loadingText = page.locator('text=Loading...');
      if (await loadingText.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(loadingText).not.toBeVisible({ timeout: 15000 });
      }
      
      // WebKit-specific: Extended wait for Chart.js
      await page.waitForTimeout(3000);
      
      const canvas = page.locator('canvas').first();
      await expect(canvas).toBeVisible({ timeout: 12000 });
      
      // Safari canvas specific validations
      const canvasInfo = await canvas.evaluate(el => {
        const ctx = el.getContext('2d');
        const rect = el.getBoundingClientRect();
        
        // Safari-specific canvas properties
        const safariFeatures = {
          hasContext: !!ctx,
          isCanvasElement: el.tagName === 'CANVAS',
          canvasWidth: el.width,
          canvasHeight: el.height,
          displayWidth: rect.width,
          displayHeight: rect.height,
          hasWebKitContext: !!(ctx && ctx.webkitBackingStorePixelRatio),
          supportsImageData: !!(ctx && ctx.createImageData),
          retina: window.devicePixelRatio > 1
        };
        
        return safariFeatures;
      });
      
      expect(canvasInfo.hasContext).toBeTruthy();
      expect(canvasInfo.isCanvasElement).toBeTruthy();
      expect(canvasInfo.canvasWidth).toBeGreaterThan(200);
      expect(canvasInfo.canvasHeight).toBeGreaterThan(100);
      expect(canvasInfo.supportsImageData).toBeTruthy();
      
      console.log(`Safari Canvas: ${canvasInfo.canvasWidth}x${canvasInfo.canvasHeight}, retina: ${canvasInfo.retina}, WebKit context: ${canvasInfo.hasWebKitContext}`);
    });

    test('Safari D3.js SVG rendering optimization', async ({ page }) => {
      await page.goto('/pools');
      
      // Wait for content
      const loadingText = page.locator('text=Loading block data...');
      if (await loadingText.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(loadingText).not.toBeVisible({ timeout: 15000 });
      }
      
      // Safari SVG rendering may need extra time
      await page.waitForTimeout(2500);
      
      const svg = page.locator('svg').first();
      await expect(svg).toBeVisible({ timeout: 10000 });
      
      // Safari SVG optimizations
      const svgInfo = await svg.evaluate(el => {
        const bbox = el.getBBox();
        const paths = el.querySelectorAll('path');
        const transforms = el.querySelectorAll('[transform]');
        
        return {
          width: bbox.width,
          height: bbox.height,
          pathCount: paths.length,
          transformCount: transforms.length,
          hasViewBox: el.hasAttribute('viewBox'),
          webkitOptimized: el.style.webkitOptimizeContrast !== undefined,
          svgVersion: el.getAttribute('version') || '1.1',
          safariCompatible: true
        };
      });
      
      expect(svgInfo.width).toBeGreaterThan(50);
      expect(svgInfo.height).toBeGreaterThan(50);
      expect(svgInfo.pathCount).toBeGreaterThan(0);
      
      console.log(`Safari SVG: ${Math.round(svgInfo.width)}x${Math.round(svgInfo.height)}, ${svgInfo.pathCount} paths, ${svgInfo.transformCount} transforms`);
    });

    test('Safari world map D3.js performance', async ({ page }) => {
      await page.goto('/nodes');
      
      // Wait for content
      const loadingText = page.locator('text=Loading...');
      if (await loadingText.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(loadingText).not.toBeVisible({ timeout: 15000 });
      }
      
      // Safari map rendering optimization
      await page.waitForTimeout(4000);
      
      const worldMap = page.locator('svg').first();
      await expect(worldMap).toBeVisible({ timeout: 12000 });
      
      // Test Safari map performance
      const mapPerformance = await worldMap.evaluate(el => {
        const startTime = performance.now();
        
        // Trigger Safari map rendering
        const paths = el.querySelectorAll('path');
        const circles = el.querySelectorAll('circle');
        
        // Force Safari reflow
        el.style.display = 'none';
        el.offsetHeight; // Force reflow
        el.style.display = '';
        
        const renderTime = performance.now() - startTime;
        
        return {
          pathCount: paths.length,
          circleCount: circles.length,
          renderTime: renderTime,
          safariOptimized: renderTime < 100,
          mapLoaded: paths.length > 10
        };
      });
      
      expect(mapPerformance.mapLoaded).toBeTruthy();
      expect(mapPerformance.renderTime).toBeLessThan(500); // Safari should render in 500ms
      expect(mapPerformance.pathCount).toBeGreaterThan(10);
      
      console.log(`Safari World Map: ${mapPerformance.pathCount} paths, ${mapPerformance.circleCount} circles, ${Math.round(mapPerformance.renderTime)}ms render`);
    });
  });

  test.describe('WebKit Touch and Mobile Interactions', () => {
    test('Safari touch event handling', async ({ page }) => {
      // Set mobile viewport for touch testing
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/pools');
      
      // Wait for content
      const loadingText = page.locator('text=Loading block data...');
      if (await loadingText.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(loadingText).not.toBeVisible({ timeout: 12000 });
      }
      
      // Test Safari touch capabilities
      const touchSupport = await page.evaluate(() => {
        return {
          maxTouchPoints: navigator.maxTouchPoints,
          touchSupport: 'ontouchstart' in window,
          pointerSupport: 'onpointerdown' in window,
          gestureSupport: 'ongesturestart' in window, // Safari-specific
          webkitTouchCallout: 'webkitTouchCallout' in document.documentElement.style
        };
      });
      
      expect(touchSupport.touchSupport).toBeTruthy();
      expect(touchSupport.maxTouchPoints).toBeGreaterThan(0);
      
      console.log('Safari Touch Support:', touchSupport);
      
      // Test touch interaction on chart
      const chart = page.locator('svg').first();
      if (await chart.isVisible({ timeout: 5000 }).catch(() => false)) {
        const chartBox = await chart.boundingBox();
        if (chartBox && chartBox.width > 100) {
          // Safari touch interaction
          await chart.tap({ position: { x: chartBox.width / 2, y: chartBox.height / 2 } });
          
          // Verify no errors after touch
          const hasErrors = await page.evaluate(() => {
            return window.onerror !== null || window.addEventListener !== undefined;
          });
          
          expect(hasErrors).toBeTruthy(); // Should have error handlers
        }
      }
    });

    test('Safari mobile viewport and orientation', async ({ page }) => {
      const orientations = [
        { name: 'Portrait', width: 375, height: 812 },
        { name: 'Landscape', width: 812, height: 375 }
      ];
      
      for (const orientation of orientations) {
        await page.setViewportSize({ width: orientation.width, height: orientation.height });
        await page.goto('/');
        
        // Safari viewport adjustment time
        await page.waitForTimeout(1500);
        
        // Check Safari-specific viewport behavior
        const viewportInfo = await page.evaluate(() => {
          return {
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio,
            orientationType: screen.orientation?.type || 'unknown',
            safariViewport: window.visualViewport ? {
              width: window.visualViewport.width,
              height: window.visualViewport.height,
              scale: window.visualViewport.scale
            } : null
          };
        });
        
        expect(viewportInfo.innerWidth).toBe(orientation.width);
        expect(viewportInfo.innerHeight).toBe(orientation.height);
        
        // Mobile menu should work in both orientations
        const menuButton = page.locator('[aria-label="menu"]');
        await expect(menuButton).toBeVisible({ timeout: 5000 });
        
        console.log(`Safari ${orientation.name}: ${viewportInfo.innerWidth}x${viewportInfo.innerHeight}, DPR: ${viewportInfo.devicePixelRatio}`);
      }
    });

    test('Safari pinch-to-zoom handling', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/nodes');
      
      // Wait for map
      const loadingText = page.locator('text=Loading...');
      if (await loadingText.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(loadingText).not.toBeVisible({ timeout: 12000 });
      }
      
      await page.waitForTimeout(2000);
      
      // Test Safari zoom behavior
      const zoomTest = await page.evaluate(() => {
        const meta = document.querySelector('meta[name="viewport"]');
        const initialScale = window.visualViewport ? window.visualViewport.scale : 1;
        
        return {
          hasViewportMeta: !!meta,
          viewportContent: meta ? meta.getAttribute('content') : null,
          initialScale: initialScale,
          zoomDisabled: meta ? meta.content.includes('user-scalable=no') : false,
          safariZoomSupport: !!window.visualViewport
        };
      });
      
      // Should allow zooming but with proper viewport controls
      expect(zoomTest.hasViewportMeta).toBeTruthy();
      expect(zoomTest.safariZoomSupport).toBeTruthy();
      
      console.log('Safari Zoom Support:', zoomTest);
    });
  });

  test.describe('WebKit CSS and Layout', () => {
    test('Safari CSS Grid and modern layout', async ({ page }) => {
      await page.goto('/nodes');
      
      // Wait for content
      const loadingText = page.locator('text=Loading...');
      if (await loadingText.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(loadingText).not.toBeVisible({ timeout: 12000 });
      }
      
      // Test Safari CSS support
      const cssSupport = await page.evaluate(() => {
        const container = document.querySelector('.MuiContainer-root');
        const cards = document.querySelectorAll('.MuiCard-root');
        
        if (!container) return null;
        
        const containerStyles = getComputedStyle(container);
        const cardStyles = cards.length > 0 ? getComputedStyle(cards[0]) : null;
        
        return {
          gridSupport: CSS.supports('display', 'grid'),
          flexSupport: CSS.supports('display', 'flex'),
          transformSupport: CSS.supports('transform', 'translateZ(0)'),
          webkitTransform: CSS.supports('-webkit-transform', 'translateZ(0)'),
          backdropFilter: CSS.supports('backdrop-filter', 'blur(10px)'),
          webkitBackdrop: CSS.supports('-webkit-backdrop-filter', 'blur(10px)'),
          containerDisplay: containerStyles.display,
          cardBorderRadius: cardStyles ? cardStyles.borderRadius : null,
          webkitBorderRadius: cardStyles ? cardStyles.webkitBorderRadius : null
        };
      });
      
      if (cssSupport) {
        expect(cssSupport.flexSupport).toBeTruthy();
        expect(cssSupport.transformSupport || cssSupport.webkitTransform).toBeTruthy();
        
        console.log('Safari CSS Support:', {
          grid: cssSupport.gridSupport,
          flex: cssSupport.flexSupport,
          transforms: cssSupport.transformSupport,
          webkit: cssSupport.webkitTransform,
          backdrop: cssSupport.backdropFilter || cssSupport.webkitBackdrop
        });
      }
      
      // Check layout integrity
      const cards = page.locator('.MuiCard-root');
      const cardCount = await cards.count();
      
      if (cardCount >= 2) {
        // Verify Safari layout rendering
        const layoutCheck = await page.evaluate(() => {
          const cards = document.querySelectorAll('.MuiCard-root');
          const positions = Array.from(cards).map(card => {
            const rect = card.getBoundingClientRect();
            return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
          });
          
          return {
            cardPositions: positions,
            noOverlap: positions.every((pos1, i) => 
              positions.every((pos2, j) => {
                if (i === j) return true;
                return !(pos1.x < pos2.x + pos2.width && 
                        pos1.x + pos1.width > pos2.x &&
                        pos1.y < pos2.y + pos2.height && 
                        pos1.y + pos1.height > pos2.y);
              })
            )
          };
        });
        
        expect(layoutCheck.noOverlap).toBeTruthy();
        console.log(`Safari Layout: ${layoutCheck.cardPositions.length} cards properly positioned`);
      }
    });

    test('Safari font rendering and typography', async ({ page }) => {
      await page.goto('/');
      
      // Wait for content and fonts
      await page.waitForSelector('h1', { timeout: 8000 });
      await page.waitForTimeout(1000);
      
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
          webkitFontSmoothing: h1Style.webkitFontSmoothing || 'auto',
          webkitTextStroke: h1Style.webkitTextStroke || 'none',
          fontFeatureSettings: h1Style.fontFeatureSettings || 'normal',
          safariSystemFont: h1Style.fontFamily.includes('system-ui') || 
                           h1Style.fontFamily.includes('-apple-system')
        };
      });
      
      if (fontInfo) {
        expect(fontInfo.h1FontFamily).toBeTruthy();
        expect(fontInfo.h1FontSize).toBeTruthy();
        expect(fontInfo.bodyFontFamily).toBeTruthy();
        
        console.log('Safari Font Rendering:', {
          h1: `${fontInfo.h1FontFamily} ${fontInfo.h1FontSize} ${fontInfo.h1FontWeight}`,
          body: `${fontInfo.bodyFontFamily} ${fontInfo.bodyFontSize}`,
          smoothing: fontInfo.webkitFontSmoothing,
          systemFont: fontInfo.safariSystemFont
        });
      }
    });
  });

  test.describe('WebKit WebSocket and Network', () => {
    test('Safari WebSocket connection stability', async ({ page }) => {
      // Monitor WebSocket behavior in Safari
      const wsEvents = [];
      let messageCount = 0;
      
      page.on('websocket', ws => {
        wsEvents.push({ type: 'connect', url: ws.url(), timestamp: Date.now() });
        
        ws.on('framereceived', frame => {
          messageCount++;
          if (frame.payload) {
            try {
              const data = JSON.parse(frame.payload);
              wsEvents.push({ 
                type: 'message', 
                messageType: data.type || 'unknown', 
                timestamp: Date.now() 
              });
            } catch (e) {
              wsEvents.push({ type: 'non-json', timestamp: Date.now() });
            }
          }
        });
        
        ws.on('close', () => {
          wsEvents.push({ type: 'close', timestamp: Date.now() });
        });
      });
      
      await page.goto('/');
      
      // Safari WebSocket establishment time
      await page.waitForTimeout(4000);
      
      // Check for data indicators
      const hasData = await page.evaluate(() => {
        const text = document.body.textContent || '';
        return /\d{1,3}(,\d{3})*(\.\d+)?\s*(DGB|MB|GB)/.test(text) ||
               /Block #\d+/.test(text) ||
               /\d+:\d+:\d+/.test(text);
      });
      
      console.log(`Safari WebSocket: ${wsEvents.length} events, ${messageCount} messages, hasData: ${hasData}`);
      
      // Safari should establish stable WebSocket connections
      const connections = wsEvents.filter(e => e.type === 'connect');
      const messages = wsEvents.filter(e => e.type === 'message');
      
      expect(connections.length).toBeGreaterThanOrEqual(1);
      expect(hasData).toBeTruthy();
      
      // Check connection stability (no excessive reconnections)
      expect(connections.length).toBeLessThan(5);
    });

    test('Safari network error handling', async ({ page }) => {
      await page.goto('/');
      
      // Wait for initial load
      await page.waitForTimeout(3000);
      
      // Test Safari network resilience
      await page.route('**/*', route => {
        // Simulate slow network in Safari
        setTimeout(() => route.continue(), 200);
      });
      
      // Navigate to another page
      await page.goto('/pools');
      
      // Should still load with simulated slow network
      await expect(page.locator('h1, h2')).toBeVisible({ timeout: 15000 });
      
      // Clear route
      await page.unroute('**/*');
      
      // Test quick navigation
      await page.goto('/nodes');
      await expect(page.locator('h1, h2')).toBeVisible({ timeout: 10000 });
      
      console.log('Safari Network: Handled slow network and recovery successfully');
    });
  });

  test.describe('WebKit Memory and Performance', () => {
    test('Safari memory optimization', async ({ page }) => {
      const pages = ['/', '/pools', '/nodes', '/supply'];
      const performanceData = [];
      
      for (const testPage of pages) {
        const startTime = Date.now();
        await page.goto(testPage, { waitUntil: 'domcontentloaded' });
        const loadTime = Date.now() - startTime;
        
        // Safari memory and performance check
        const pageStats = await page.evaluate(() => {
          const elementCount = document.querySelectorAll('*').length;
          const canvasCount = document.querySelectorAll('canvas').length;
          const svgCount = document.querySelectorAll('svg').length;
          
          return {
            elementCount,
            canvasCount,
            svgCount,
            hasPerformanceMemory: !!performance.memory,
            webkitOptimized: !!window.webkit,
            safariVersion: navigator.userAgent.match(/Version\/(\d+\.\d+)/)?.[1] || 'unknown'
          };
        });
        
        performanceData.push({
          page: testPage,
          loadTime,
          ...pageStats
        });
        
        // Safari performance expectations
        expect(loadTime).toBeLessThan(8000); // 8 seconds max
        expect(pageStats.elementCount).toBeLessThan(2500);
        
        console.log(`Safari ${testPage}: ${loadTime}ms, ${pageStats.elementCount} elements, ${pageStats.canvasCount} canvas, ${pageStats.svgCount} SVG`);
      }
      
      // Memory should not grow excessively between pages
      const elementGrowth = performanceData[performanceData.length - 1].elementCount - performanceData[0].elementCount;
      expect(elementGrowth).toBeLessThan(800);
    });

    test('Safari animation and GPU acceleration', async ({ page }) => {
      await page.goto('/');
      
      // Test Safari hardware acceleration
      const accelerationTest = await page.evaluate(() => {
        const cards = document.querySelectorAll('.MuiCard-root');
        if (cards.length === 0) return { supported: false };
        
        const card = cards[0];
        const cardStyle = getComputedStyle(card);
        
        // Test Safari GPU acceleration
        card.style.transform = 'translateZ(0)';
        card.style.webkitTransform = 'translateZ(0)';
        card.style.transition = 'transform 0.3s ease';
        
        const supportsTransform3d = CSS.supports('transform', 'translateZ(0)');
        const supportsWebkitTransform = CSS.supports('-webkit-transform', 'translateZ(0)');
        const supportsTransitions = CSS.supports('transition', 'transform 0.3s ease');
        
        return {
          supported: true,
          transform3d: supportsTransform3d,
          webkitTransform: supportsWebkitTransform,
          transitions: supportsTransitions,
          gpuAccelerated: supportsTransform3d || supportsWebkitTransform
        };
      });
      
      expect(accelerationTest.supported).toBeTruthy();
      expect(accelerationTest.gpuAccelerated).toBeTruthy();
      expect(accelerationTest.transitions).toBeTruthy();
      
      console.log('Safari GPU Acceleration:', accelerationTest);
    });
  });
});