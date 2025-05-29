import { test, expect } from '@playwright/test';

// Microsoft Edge specific compatibility tests and fixes
test.describe('Microsoft Edge Browser Compatibility', () => {
  
  test.describe('Edge Chromium Engine Tests', () => {
    test('Edge Chromium Canvas and Chart.js optimization', async ({ page, browserName }) => {
      // Skip for non-Edge browsers
      test.skip(!process.env.PLAYWRIGHT_BROWSER_NAME?.includes('edge') && browserName !== 'chromium', 'Edge-specific test');
      
      await page.goto('/supply');
      
      // Edge chart rendering
      const loadingText = page.locator('text=Loading...');
      if (await loadingText.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(loadingText).not.toBeVisible({ timeout: 12000 });
      }
      
      // Edge-specific chart optimization
      await page.waitForTimeout(2000);
      
      const canvas = page.locator('canvas').first();
      await expect(canvas).toBeVisible({ timeout: 10000 });
      
      // Edge Chromium canvas features
      const edgeCanvasInfo = await canvas.evaluate(el => {
        const ctx = el.getContext('2d');
        const rect = el.getBoundingClientRect();
        
        return {
          hasContext: !!ctx,
          canvasWidth: el.width,
          canvasHeight: el.height,
          displayWidth: rect.width,
          displayHeight: rect.height,
          edgeOptimizations: {
            hardwareAcceleration: !!(ctx && ctx.isContextLost),
            antiAliasing: ctx ? ctx.imageSmoothingEnabled !== undefined : false,
            pixelRatio: window.devicePixelRatio,
            memoryInfo: performance.memory ? {
              used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
              total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
            } : null
          },
          edgeFeatures: {
            msImageSmoothingEnabled: ctx ? ctx.msImageSmoothingEnabled !== undefined : false,
            webglSupport: (() => {
              try {
                const testCanvas = document.createElement('canvas');
                return !!(testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl'));
              } catch (e) {
                return false;
              }
            })()
          }
        };
      });
      
      expect(edgeCanvasInfo.hasContext).toBeTruthy();
      expect(edgeCanvasInfo.canvasWidth).toBeGreaterThan(200);
      expect(edgeCanvasInfo.canvasHeight).toBeGreaterThan(100);
      expect(edgeCanvasInfo.edgeOptimizations.antiAliasing).toBeTruthy();
      
      console.log(`Edge Canvas: ${edgeCanvasInfo.canvasWidth}x${edgeCanvasInfo.canvasHeight}`);
      console.log(`Edge Memory: ${edgeCanvasInfo.edgeOptimizations.memoryInfo?.used || 'N/A'}MB used`);
      console.log(`Edge WebGL: ${edgeCanvasInfo.edgeFeatures.webglSupport}`);
    });

    test('Edge D3.js SVG rendering compatibility', async ({ page, browserName }) => {
      test.skip(!process.env.PLAYWRIGHT_BROWSER_NAME?.includes('edge') && browserName !== 'chromium', 'Edge-specific test');
      
      await page.goto('/pools');
      
      // Wait for content
      const loadingText = page.locator('text=Loading block data...');
      if (await loadingText.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(loadingText).not.toBeVisible({ timeout: 12000 });
      }
      
      // Edge SVG rendering time
      await page.waitForTimeout(2000);
      
      const svg = page.locator('svg').first();
      await expect(svg).toBeVisible({ timeout: 10000 });
      
      // Edge SVG optimization tests
      const edgeSvgInfo = await svg.evaluate(el => {
        const bbox = el.getBBox();
        const paths = el.querySelectorAll('path');
        const transforms = el.querySelectorAll('[transform]');
        
        // Edge-specific SVG features
        const edgeFeatures = {
          msSupport: !!(el.msMatchesSelector || el.msRequestFullscreen),
          svgAnimationSupport: !!el.beginElement,
          filterSupport: CSS.supports('filter', 'blur(1px)'),
          transformSupport: CSS.supports('transform', 'scale(1)'),
          clipPathSupport: CSS.supports('clip-path', 'circle(50%)')
        };
        
        return {
          width: bbox.width,
          height: bbox.height,
          pathCount: paths.length,
          transformCount: transforms.length,
          hasViewBox: el.hasAttribute('viewBox'),
          edgeFeatures,
          performanceOptimized: {
            usesTransforms: transforms.length > 0,
            hasClipPaths: el.querySelectorAll('[clip-path]').length > 0,
            usesFilters: el.querySelectorAll('[filter]').length > 0
          }
        };
      });
      
      expect(edgeSvgInfo.width).toBeGreaterThan(50);
      expect(edgeSvgInfo.height).toBeGreaterThan(50);
      expect(edgeSvgInfo.pathCount).toBeGreaterThan(0);
      expect(edgeSvgInfo.edgeFeatures.filterSupport).toBeTruthy();
      expect(edgeSvgInfo.edgeFeatures.transformSupport).toBeTruthy();
      
      console.log(`Edge SVG: ${Math.round(edgeSvgInfo.width)}x${Math.round(edgeSvgInfo.height)}, ${edgeSvgInfo.pathCount} paths`);
      console.log(`Edge SVG Features:`, edgeSvgInfo.edgeFeatures);
    });
  });

  test.describe('Edge CSS and Layout Engine', () => {
    test('Edge CSS Grid and Flexbox modern features', async ({ page, browserName }) => {
      test.skip(!process.env.PLAYWRIGHT_BROWSER_NAME?.includes('edge') && browserName !== 'chromium', 'Edge-specific test');
      
      await page.goto('/nodes');
      
      // Wait for content
      const loadingText = page.locator('text=Loading...');
      if (await loadingText.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(loadingText).not.toBeVisible({ timeout: 12000 });
      }
      
      // Edge CSS compatibility testing
      const edgeCssSupport = await page.evaluate(() => {
        const container = document.querySelector('.MuiContainer-root');
        const cards = document.querySelectorAll('.MuiCard-root');
        
        if (!container) return null;
        
        const containerStyles = getComputedStyle(container);
        const cardStyles = cards.length > 0 ? getComputedStyle(cards[0]) : null;
        
        // Edge-specific CSS feature detection
        const edgeFeatures = {
          gridSupport: CSS.supports('display', 'grid'),
          flexSupport: CSS.supports('display', 'flex'),
          customProperties: CSS.supports('color', 'var(--test)'),
          clipPath: CSS.supports('clip-path', 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'),
          backdropFilter: CSS.supports('backdrop-filter', 'blur(10px)'),
          aspectRatio: CSS.supports('aspect-ratio', '16/9'),
          containerQueries: CSS.supports('container-type', 'inline-size'),
          edgeScrollbar: CSS.supports('-ms-overflow-style', 'none')
        };
        
        const layoutInfo = {
          containerDisplay: containerStyles.display,
          containerMaxWidth: containerStyles.maxWidth,
          cardDisplay: cardStyles ? cardStyles.display : null,
          cardBoxShadow: cardStyles ? cardStyles.boxShadow !== 'none' : false,
          cardBorderRadius: cardStyles ? cardStyles.borderRadius : null,
          cardTransition: cardStyles ? cardStyles.transition : null
        };
        
        return {
          edgeFeatures,
          layoutInfo,
          msEdgeDetected: navigator.userAgent.includes('Edg/'),
          msLegacyEdge: navigator.userAgent.includes('Edge/')
        };
      });
      
      if (edgeCssSupport) {
        expect(edgeCssSupport.edgeFeatures.gridSupport).toBeTruthy();
        expect(edgeCssSupport.edgeFeatures.flexSupport).toBeTruthy();
        expect(edgeCssSupport.edgeFeatures.customProperties).toBeTruthy();
        expect(edgeCssSupport.layoutInfo.cardBoxShadow).toBeTruthy();
        
        console.log('Edge CSS Support:', {
          grid: edgeCssSupport.edgeFeatures.gridSupport,
          flex: edgeCssSupport.edgeFeatures.flexSupport,
          customProps: edgeCssSupport.edgeFeatures.customProperties,
          clipPath: edgeCssSupport.edgeFeatures.clipPath,
          backdrop: edgeCssSupport.edgeFeatures.backdropFilter,
          edgeVersion: edgeCssSupport.msEdgeDetected ? 'Chromium' : 'Legacy'
        });
      }
    });

    test('Edge responsive design and viewport handling', async ({ page, browserName }) => {
      test.skip(!process.env.PLAYWRIGHT_BROWSER_NAME?.includes('edge') && browserName !== 'chromium', 'Edge-specific test');
      
      const viewports = [
        { name: 'Desktop HD', width: 1920, height: 1080 },
        { name: 'Laptop', width: 1366, height: 768 },
        { name: 'Tablet', width: 768, height: 1024 },
        { name: 'Mobile', width: 375, height: 667 }
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/pools');
        
        // Edge viewport handling
        await page.waitForTimeout(1000);
        
        // Edge responsive behavior tests
        const responsiveInfo = await page.evaluate(({ viewportWidth, viewportHeight }) => {
          const isMobile = viewportWidth < 768;
          const isTablet = viewportWidth >= 768 && viewportWidth < 1024;
          const isDesktop = viewportWidth >= 1024;
          
          return {
            actualWidth: window.innerWidth,
            actualHeight: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio,
            isMobile,
            isTablet,
            isDesktop,
            bodyScrollWidth: document.body.scrollWidth,
            hasHorizontalScroll: document.body.scrollWidth > window.innerWidth,
            edgeViewportFeatures: {
              visualViewport: !!window.visualViewport,
              matchMedia: !!window.matchMedia,
              msViewportSupport: !!window.msMatchMedia
            }
          };
        }, { viewportWidth: viewport.width, viewportHeight: viewport.height });
        
        expect(responsiveInfo.actualWidth).toBe(viewport.width);
        expect(responsiveInfo.actualHeight).toBe(viewport.height);
        expect(responsiveInfo.hasHorizontalScroll).toBeFalsy();
        
        // Test mobile menu on smaller screens
        if (responsiveInfo.isMobile) {
          const menuButton = page.locator('[aria-label="menu"]');
          await expect(menuButton).toBeVisible({ timeout: 5000 });
        }
        
        // Test chart responsiveness
        const chart = page.locator('svg, canvas').first();
        if (await chart.isVisible({ timeout: 5000 }).catch(() => false)) {
          const chartBox = await chart.boundingBox();
          if (chartBox) {
            expect(chartBox.width).toBeLessThanOrEqual(viewport.width);
            console.log(`Edge ${viewport.name}: Chart ${Math.round(chartBox.width)}x${Math.round(chartBox.height)}`);
          }
        }
        
        console.log(`Edge ${viewport.name}: Viewport ${responsiveInfo.actualWidth}x${responsiveInfo.actualHeight}, DPR: ${responsiveInfo.devicePixelRatio}`);
      }
    });
  });

  test.describe('Edge JavaScript and API Compatibility', () => {
    test('Edge modern JavaScript features', async ({ page, browserName }) => {
      test.skip(!process.env.PLAYWRIGHT_BROWSER_NAME?.includes('edge') && browserName !== 'chromium', 'Edge-specific test');
      
      await page.goto('/');
      
      // Test Edge JavaScript compatibility
      const jsCompatibility = await page.evaluate(() => {
        try {
          // ES6+ features
          const arrow = () => true;
          const template = `test${Math.random()}`;
          const [a] = [1, 2, 3];
          const { b } = { b: 2 };
          const spread = [...[1, 2, 3]];
          
          // ES2017+ features
          const asyncFunc = async () => await Promise.resolve('test');
          const objectValues = Object.values({ a: 1, b: 2 });
          const objectEntries = Object.entries({ c: 3, d: 4 });
          
          // ES2018+ features
          const { ...rest } = { x: 1, y: 2, z: 3 };
          
          // Modern APIs
          const fetchSupport = typeof fetch !== 'undefined';
          const promiseSupport = typeof Promise !== 'undefined';
          const mapSupport = typeof Map !== 'undefined';
          const setSupport = typeof Set !== 'undefined';
          const symbolSupport = typeof Symbol !== 'undefined';
          
          // Edge-specific APIs
          const edgeApis = {
            msBlobBuilder: typeof window.MSBlobBuilder !== 'undefined',
            msIndexedDB: typeof window.msIndexedDB !== 'undefined',
            msRequestAnimationFrame: typeof window.msRequestAnimationFrame !== 'undefined',
            msPointerEvents: typeof window.MSPointerEvent !== 'undefined'
          };
          
          return {
            success: true,
            es6Support: {
              arrow: arrow(),
              template: template.includes('test'),
              destructuring: a === 1 && b === 2,
              spread: spread.length === 3
            },
            modernApis: {
              fetch: fetchSupport,
              promise: promiseSupport,
              map: mapSupport,
              set: setSupport,
              symbol: symbolSupport
            },
            edgeApis,
            asyncAwaitSupport: asyncFunc.constructor.name === 'AsyncFunction',
            edgeVersion: navigator.userAgent.match(/Edg\/(\d+\.\d+)/)?.[1] || 'unknown'
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });
      
      expect(jsCompatibility.success).toBeTruthy();
      expect(jsCompatibility.es6Support.arrow).toBeTruthy();
      expect(jsCompatibility.es6Support.template).toBeTruthy();
      expect(jsCompatibility.es6Support.destructuring).toBeTruthy();
      expect(jsCompatibility.es6Support.spread).toBeTruthy();
      expect(jsCompatibility.modernApis.fetch).toBeTruthy();
      expect(jsCompatibility.modernApis.promise).toBeTruthy();
      expect(jsCompatibility.asyncAwaitSupport).toBeTruthy();
      
      console.log('Edge JavaScript Support:', {
        es6: jsCompatibility.es6Support,
        apis: jsCompatibility.modernApis,
        version: jsCompatibility.edgeVersion
      });
    });

    test('Edge WebSocket and real-time features', async ({ page, browserName }) => {
      test.skip(!process.env.PLAYWRIGHT_BROWSER_NAME?.includes('edge') && browserName !== 'chromium', 'Edge-specific test');
      
      // Monitor Edge WebSocket behavior
      const wsEvents = [];
      let messageCount = 0;
      
      page.on('websocket', ws => {
        wsEvents.push({ 
          type: 'connect', 
          url: ws.url(), 
          timestamp: Date.now(),
          browser: 'edge'
        });
        
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
      
      // Edge WebSocket connection time
      await page.waitForTimeout(3500);
      
      // Test Edge WebSocket API support
      const wsSupport = await page.evaluate(() => {
        return {
          webSocketSupport: typeof WebSocket !== 'undefined',
          webSocketConstructor: !!window.WebSocket,
          binaryTypeSupport: (() => {
            try {
              const ws = new WebSocket('ws://localhost:8080');
              ws.close();
              return ws.binaryType !== undefined;
            } catch (e) {
              return false;
            }
          })(),
          edgeWebSocketFeatures: {
            msWebSocket: typeof window.MSWebSocket !== 'undefined',
            webSocketExtensions: !!WebSocket.prototype.extensions
          }
        };
      });
      
      // Check for live data
      const hasLiveData = await page.evaluate(() => {
        const text = document.body.textContent || '';
        return /\d{1,3}(,\d{3})*(\.\d+)?\s*(DGB|MB|GB)/.test(text) ||
               /Block #\d+/.test(text) ||
               /\d+:\d+:\d+/.test(text);
      });
      
      expect(wsSupport.webSocketSupport).toBeTruthy();
      expect(wsSupport.webSocketConstructor).toBeTruthy();
      expect(hasLiveData).toBeTruthy();
      
      console.log(`Edge WebSocket: ${wsEvents.length} events, ${messageCount} messages, hasData: ${hasLiveData}`);
      console.log('Edge WebSocket Support:', wsSupport);
    });
  });

  test.describe('Edge Performance and Memory', () => {
    test('Edge performance optimization', async ({ page, browserName }) => {
      test.skip(!process.env.PLAYWRIGHT_BROWSER_NAME?.includes('edge') && browserName !== 'chromium', 'Edge-specific test');
      
      const pages = ['/', '/pools', '/nodes', '/supply'];
      const performanceData = [];
      
      for (const testPage of pages) {
        const startTime = Date.now();
        await page.goto(testPage, { waitUntil: 'domcontentloaded' });
        const loadTime = Date.now() - startTime;
        
        // Edge performance monitoring
        const pagePerformance = await page.evaluate(() => {
          const navigation = performance.getEntriesByType('navigation')[0];
          const elementCount = document.querySelectorAll('*').length;
          
          return {
            elementCount,
            canvasCount: document.querySelectorAll('canvas').length,
            svgCount: document.querySelectorAll('svg').length,
            navigationTiming: navigation ? {
              domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
              loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
              firstPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-paint')?.startTime || 0,
              firstContentfulPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint')?.startTime || 0
            } : null,
            memoryInfo: performance.memory ? {
              used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
              total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
              limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            } : null,
            edgeOptimizations: {
              hardwareAcceleration: (() => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                return !!(ctx && ctx.isContextLost);
              })(),
              webglSupport: (() => {
                try {
                  const canvas = document.createElement('canvas');
                  return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
                } catch (e) {
                  return false;
                }
              })()
            }
          };
        });
        
        performanceData.push({
          page: testPage,
          loadTime,
          ...pagePerformance
        });
        
        // Edge performance expectations
        expect(loadTime).toBeLessThan(8000); // 8 seconds max
        expect(pagePerformance.elementCount).toBeLessThan(2500);
        
        if (pagePerformance.memoryInfo) {
          expect(pagePerformance.memoryInfo.used).toBeLessThan(100); // 100MB max
        }
        
        console.log(`Edge ${testPage}: ${loadTime}ms load, ${pagePerformance.elementCount} elements, ${pagePerformance.memoryInfo?.used || 'N/A'}MB`);
        
        if (pagePerformance.navigationTiming) {
          console.log(`Edge ${testPage} Paint: FP ${Math.round(pagePerformance.navigationTiming.firstPaint)}ms, FCP ${Math.round(pagePerformance.navigationTiming.firstContentfulPaint)}ms`);
        }
      }
      
      // Check for memory leaks between pages
      const memoryGrowth = performanceData[performanceData.length - 1].memoryInfo?.used - performanceData[0].memoryInfo?.used;
      if (memoryGrowth) {
        expect(memoryGrowth).toBeLessThan(50); // Less than 50MB growth
      }
    });

    test('Edge rendering and animation performance', async ({ page, browserName }) => {
      test.skip(!process.env.PLAYWRIGHT_BROWSER_NAME?.includes('edge') && browserName !== 'chromium', 'Edge-specific test');
      
      await page.goto('/');
      
      // Test Edge animation and transition capabilities
      const animationTest = await page.evaluate(() => {
        const cards = document.querySelectorAll('.MuiCard-root');
        if (cards.length === 0) return { supported: false };
        
        const card = cards[0];
        const startTime = performance.now();
        
        // Test Edge animation performance
        card.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
        card.style.transform = 'translateY(-4px) scale(1.02)';
        card.style.boxShadow = '0 8px 32px rgba(0,0,0,0.2)';
        
        // Force reflow
        card.offsetHeight;
        
        const renderTime = performance.now() - startTime;
        
        // Reset
        card.style.transform = '';
        card.style.boxShadow = '';
        
        return {
          supported: true,
          renderTime,
          animationSupport: {
            transitions: CSS.supports('transition', 'transform 0.3s ease'),
            transforms: CSS.supports('transform', 'translateY(-4px) scale(1.02)'),
            boxShadow: CSS.supports('box-shadow', '0 8px 32px rgba(0,0,0,0.2)'),
            will_change: CSS.supports('will-change', 'transform')
          },
          edgeAnimationFeatures: {
            msTransition: CSS.supports('-ms-transition', 'transform 0.3s ease'),
            msTransform: CSS.supports('-ms-transform', 'scale(1.02)'),
            performanceOptimized: renderTime < 16.67 // 60fps
          }
        };
      });
      
      expect(animationTest.supported).toBeTruthy();
      expect(animationTest.animationSupport.transitions).toBeTruthy();
      expect(animationTest.animationSupport.transforms).toBeTruthy();
      expect(animationTest.animationSupport.boxShadow).toBeTruthy();
      expect(animationTest.renderTime).toBeLessThan(100); // Should render in under 100ms
      
      console.log('Edge Animation Performance:', {
        renderTime: `${animationTest.renderTime.toFixed(2)}ms`,
        support: animationTest.animationSupport,
        optimized: animationTest.edgeAnimationFeatures.performanceOptimized
      });
    });
  });

  test.describe('Edge Security and Privacy Features', () => {
    test('Edge security and tracking protection', async ({ page, browserName }) => {
      test.skip(!process.env.PLAYWRIGHT_BROWSER_NAME?.includes('edge') && browserName !== 'chromium', 'Edge-specific test');
      
      await page.goto('/');
      
      // Test Edge security features
      const securityFeatures = await page.evaluate(() => {
        return {
          httpsSupport: location.protocol === 'https:' || location.hostname === 'localhost',
          secureContext: typeof window.isSecureContext !== 'undefined' ? window.isSecureContext : true,
          cookieSupport: navigator.cookieEnabled,
          doNotTrack: navigator.doNotTrack,
          webSecurityApis: {
            crypto: !!window.crypto,
            cryptoSubtle: !!(window.crypto && window.crypto.subtle),
            webAuthentication: !!navigator.credentials,
            permissions: !!navigator.permissions
          },
          edgeSecurityFeatures: {
            msApplicationName: !!navigator.msApplicationName,
            msDoNotTrack: !!navigator.msDoNotTrack,
            trackingProtection: !!window.external && !!window.external.msTrackingProtectionEnabled
          },
          cspSupport: (() => {
            try {
              return 'SecurityPolicyViolationEvent' in window;
            } catch (e) {
              return false;
            }
          })()
        };
      });
      
      expect(securityFeatures.secureContext).toBeTruthy();
      expect(securityFeatures.cookieSupport).toBeTruthy();
      expect(securityFeatures.webSecurityApis.crypto).toBeTruthy();
      
      console.log('Edge Security Features:', {
        https: securityFeatures.httpsSupport,
        crypto: securityFeatures.webSecurityApis.crypto,
        subtle: securityFeatures.webSecurityApis.cryptoSubtle,
        webauthn: securityFeatures.webSecurityApis.webAuthentication,
        csp: securityFeatures.cspSupport
      });
    });
  });
});