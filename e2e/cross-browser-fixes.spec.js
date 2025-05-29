import { test, expect } from '@playwright/test';

// Cross-browser compatibility fixes for common issues
test.describe('Cross-Browser Compatibility Fixes', () => {
  
  test.describe('Universal Chart and Canvas Fixes', () => {
    test('Cross-browser chart rendering standardization', async ({ page, browserName }) => {
      await page.goto('/supply');
      
      // Browser-specific loading timeouts
      const browserTimeouts = {
        'firefox': 15000,
        'webkit': 12000,
        'chromium': 10000
      };
      
      const timeout = browserTimeouts[browserName] || 10000;
      
      // Wait for loading to complete with browser-specific timeout
      const loadingText = page.locator('text=Loading...');
      if (await loadingText.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(loadingText).not.toBeVisible({ timeout });
      }
      
      // Browser-specific chart rendering delays
      const renderDelays = {
        'firefox': 3000,
        'webkit': 2500,
        'chromium': 1500
      };
      
      await page.waitForTimeout(renderDelays[browserName] || 2000);
      
      // Universal canvas compatibility check
      const canvas = page.locator('canvas').first();
      await expect(canvas).toBeVisible({ timeout });
      
      // Cross-browser canvas validation
      const canvasCompatibility = await canvas.evaluate((el, browser) => {
        const ctx = el.getContext('2d');
        const rect = el.getBoundingClientRect();
        
        // Universal canvas features that should work across all browsers
        const universalFeatures = {
          hasContext: !!ctx,
          canvasElement: el.tagName === 'CANVAS',
          hasWidth: el.width > 0,
          hasHeight: el.height > 0,
          isVisible: rect.width > 0 && rect.height > 0,
          contextMethods: !!(ctx && ctx.fillRect && ctx.drawImage && ctx.getImageData)
        };
        
        // Browser-specific optimizations
        const browserOptimizations = {
          firefox: {
            mozImageSmoothingEnabled: ctx ? ctx.mozImageSmoothingEnabled !== undefined : false,
            devicePixelRatio: window.devicePixelRatio || 1
          },
          webkit: {
            webkitImageSmoothingEnabled: ctx ? ctx.webkitImageSmoothingEnabled !== undefined : false,
            retina: window.devicePixelRatio > 1,
            safariOptimized: !!window.safari
          },
          chromium: {
            hardwareAcceleration: !!(ctx && ctx.isContextLost),
            chromeOptimized: !!window.chrome
          }
        };
        
        return {
          universal: universalFeatures,
          browserSpecific: browserOptimizations[browser] || {},
          dimensions: {
            canvas: { width: el.width, height: el.height },
            display: { width: rect.width, height: rect.height }
          },
          browser
        };
      }, browserName);
      
      // Universal expectations that should work on all browsers
      expect(canvasCompatibility.universal.hasContext).toBeTruthy();
      expect(canvasCompatibility.universal.canvasElement).toBeTruthy();
      expect(canvasCompatibility.universal.hasWidth).toBeTruthy();
      expect(canvasCompatibility.universal.hasHeight).toBeTruthy();
      expect(canvasCompatibility.universal.isVisible).toBeTruthy();
      expect(canvasCompatibility.universal.contextMethods).toBeTruthy();
      
      console.log(`${browserName} Canvas: ${canvasCompatibility.dimensions.canvas.width}x${canvasCompatibility.dimensions.canvas.height} (display: ${Math.round(canvasCompatibility.dimensions.display.width)}x${Math.round(canvasCompatibility.dimensions.display.height)})`);
    });

    test('Cross-browser SVG rendering standardization', async ({ page, browserName }) => {
      await page.goto('/pools');
      
      // Browser-specific timeouts
      const browserTimeouts = {
        'firefox': 15000,
        'webkit': 12000,
        'chromium': 10000
      };
      
      const timeout = browserTimeouts[browserName] || 10000;
      
      // Wait for content with browser-specific timeout
      const loadingText = page.locator('text=Loading block data...');
      if (await loadingText.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(loadingText).not.toBeVisible({ timeout });
      }
      
      // Browser-specific SVG rendering delays
      const svgDelays = {
        'firefox': 2500,
        'webkit': 2000,
        'chromium': 1500
      };
      
      await page.waitForTimeout(svgDelays[browserName] || 2000);
      
      const svg = page.locator('svg').first();
      await expect(svg).toBeVisible({ timeout });
      
      // Cross-browser SVG compatibility
      const svgCompatibility = await svg.evaluate((el, browser) => {
        const bbox = el.getBBox();
        const paths = el.querySelectorAll('path');
        const circles = el.querySelectorAll('circle');
        
        // Universal SVG features
        const universalFeatures = {
          isSvgElement: el.tagName.toLowerCase() === 'svg',
          hasBoundingBox: bbox.width > 0 && bbox.height > 0,
          hasContent: paths.length > 0 || circles.length > 0,
          hasViewBox: el.hasAttribute('viewBox'),
          isVisible: getComputedStyle(el).display !== 'none'
        };
        
        // Browser-specific SVG support
        const browserFeatures = {
          firefox: {
            mozSupport: !!el.createSVGRect,
            filterSupport: CSS.supports('filter', 'blur(1px)')
          },
          webkit: {
            webkitSupport: !!el.createSVGRect,
            safariAnimationSupport: !!el.beginElement
          },
          chromium: {
            chromeSupport: !!el.createSVGRect,
            clipPathSupport: CSS.supports('clip-path', 'circle(50%)')
          }
        };
        
        return {
          universal: universalFeatures,
          browserSpecific: browserFeatures[browser] || {},
          content: {
            pathCount: paths.length,
            circleCount: circles.length,
            bbox: { width: bbox.width, height: bbox.height }
          },
          browser
        };
      }, browserName);
      
      // Universal SVG expectations
      expect(svgCompatibility.universal.isSvgElement).toBeTruthy();
      expect(svgCompatibility.universal.hasBoundingBox).toBeTruthy();
      expect(svgCompatibility.universal.hasContent).toBeTruthy();
      expect(svgCompatibility.universal.isVisible).toBeTruthy();
      
      console.log(`${browserName} SVG: ${Math.round(svgCompatibility.content.bbox.width)}x${Math.round(svgCompatibility.content.bbox.height)}, ${svgCompatibility.content.pathCount} paths, ${svgCompatibility.content.circleCount} circles`);
    });
  });

  test.describe('Universal WebSocket Fixes', () => {
    test('Cross-browser WebSocket connection handling', async ({ page, browserName }) => {
      // Browser-specific WebSocket timeouts
      const wsTimeouts = {
        'firefox': 5000,
        'webkit': 4000,
        'chromium': 3000
      };
      
      const wsTimeout = wsTimeouts[browserName] || 4000;
      
      // Monitor WebSocket connections across browsers
      const wsEvents = [];
      let messageCount = 0;
      
      page.on('websocket', ws => {
        wsEvents.push({
          type: 'connect',
          url: ws.url(),
          timestamp: Date.now(),
          browser: browserName
        });
        
        ws.on('framereceived', frame => {
          messageCount++;
          if (frame.payload) {
            try {
              const data = JSON.parse(frame.payload);
              wsEvents.push({
                type: 'message',
                messageType: data.type || 'unknown',
                timestamp: Date.now(),
                browser: browserName
              });
            } catch (e) {
              // Non-JSON message
            }
          }
        });
        
        ws.on('close', () => {
          wsEvents.push({
            type: 'close',
            timestamp: Date.now(),
            browser: browserName
          });
        });
      });
      
      await page.goto('/');
      
      // Browser-specific WebSocket establishment time
      await page.waitForTimeout(wsTimeout);
      
      // Universal WebSocket API test
      const wsSupport = await page.evaluate((browser) => {
        const universalFeatures = {
          webSocketConstructor: typeof WebSocket !== 'undefined',
          webSocketPrototype: !!WebSocket.prototype,
          readyStateConstants: !!(WebSocket.CONNECTING !== undefined && 
                                  WebSocket.OPEN !== undefined && 
                                  WebSocket.CLOSING !== undefined && 
                                  WebSocket.CLOSED !== undefined)
        };
        
        // Test WebSocket creation capability (don't actually connect)
        let webSocketCreation = false;
        try {
          // Just test constructor availability, don't create actual connection
          webSocketCreation = typeof WebSocket !== 'undefined' && typeof WebSocket === 'function';
        } catch (e) {
          webSocketCreation = false;
        }
        
        const browserSpecificFeatures = {
          firefox: {
            mozWebSocket: typeof window.MozWebSocket !== 'undefined'
          },
          webkit: {
            webkitWebSocket: typeof window.webkitWebSocket !== 'undefined'
          },
          chromium: {
            extensions: typeof WebSocket !== 'undefined' && WebSocket.prototype ? !!WebSocket.prototype.extensions : false
          }
        };
        
        return {
          universal: { ...universalFeatures, creation: webSocketCreation },
          browserSpecific: browserSpecificFeatures[browser] || {},
          browser
        };
      }, browserName);
      
      // Check for data that indicates successful WebSocket connection
      const hasLiveData = await page.evaluate(() => {
        const text = document.body.textContent || '';
        const patterns = [
          /\d{1,3}(,\d{3})*(\.\d+)?\s*(DGB|MB|GB)/, // Currency/size amounts
          /Block #\d+/,                              // Block numbers
          /\d+:\d+:\d+/,                            // Timestamps
          /\d{4}-\d{2}-\d{2}/,                      // Dates
          /[0-9a-f]{32,64}/i                        // Hashes
        ];
        
        return patterns.some(pattern => pattern.test(text));
      });
      
      // Universal WebSocket expectations
      expect(wsSupport.universal.webSocketConstructor).toBeTruthy();
      expect(wsSupport.universal.webSocketPrototype).toBeTruthy();
      expect(wsSupport.universal.readyStateConstants).toBeTruthy();
      expect(wsSupport.universal.creation).toBeTruthy();
      
      // Should have data (either from WebSocket or fallback)
      expect(hasLiveData).toBeTruthy();
      
      console.log(`${browserName} WebSocket: ${wsEvents.length} events, ${messageCount} messages, hasData: ${hasLiveData}`);
    });

    test('Cross-browser WebSocket reconnection resilience', async ({ page, browserName }) => {
      await page.goto('/');
      
      // Browser-specific initial connection time
      const connectionTimes = {
        'firefox': 4000,
        'webkit': 3500,
        'chromium': 3000
      };
      
      await page.waitForTimeout(connectionTimes[browserName] || 3500);
      
      // Get initial data state
      const initialData = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('.MuiCard-root'));
        return cards.map(card => {
          const text = card.textContent || '';
          return {
            hasNumbers: /\d/.test(text),
            hasContent: text.trim().length > 20,
            text: text.substring(0, 100) // First 100 chars for debugging
          };
        });
      });
      
      // Simulate network interruption (universal across browsers)
      await page.route(/ws:\/\/.*|wss:\/\/.*/, route => route.abort());
      
      // Wait for disconnection detection
      await page.waitForTimeout(2000);
      
      // Restore connections
      await page.unroute(/ws:\/\/.*|wss:\/\/.*/);
      
      // Browser-specific reconnection time
      const reconnectionTimes = {
        'firefox': 6000,
        'webkit': 5000,
        'chromium': 4000
      };
      
      await page.waitForTimeout(reconnectionTimes[browserName] || 5000);
      
      // Check data persistence/recovery
      const finalData = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('.MuiCard-root'));
        return cards.map(card => {
          const text = card.textContent || '';
          return {
            hasNumbers: /\d/.test(text),
            hasContent: text.trim().length > 20,
            text: text.substring(0, 100)
          };
        });
      });
      
      // Data should be maintained or refreshed after reconnection
      expect(finalData.length).toBeGreaterThan(0);
      expect(finalData.some(card => card.hasContent)).toBeTruthy();
      
      const dataIntegrity = initialData.length === finalData.length &&
                           finalData.some(card => card.hasNumbers);
      
      expect(dataIntegrity).toBeTruthy();
      
      console.log(`${browserName} Reconnection: ${initialData.length} -> ${finalData.length} cards, data integrity: ${dataIntegrity}`);
    });
  });

  test.describe('Universal CSS and Layout Fixes', () => {
    test('Cross-browser responsive layout compatibility', async ({ page, browserName }) => {
      const testViewports = [
        { name: 'Mobile', width: 375, height: 667 },
        { name: 'Tablet', width: 768, height: 1024 },
        { name: 'Desktop', width: 1024, height: 768 }
      ];
      
      for (const viewport of testViewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/nodes');
        
        // Browser-specific viewport adjustment time
        const adjustmentTimes = {
          'firefox': 1500,
          'webkit': 1200,
          'chromium': 1000
        };
        
        await page.waitForTimeout(adjustmentTimes[browserName] || 1200);
        
        // Universal responsive behavior tests
        const responsiveCheck = await page.evaluate(({ viewportInfo, browser }) => {
          const { width, height } = viewportInfo;
          const isMobile = width < 768;
          const isTablet = width >= 768 && width < 1024;
          const isDesktop = width >= 1024;
          
          // Universal layout checks
          const universalChecks = {
            bodyFitsViewport: document.body.scrollWidth <= width + 50, // Allow small margin
            hasNoHorizontalScroll: window.innerWidth >= document.body.scrollWidth - 20,
            viewportMatches: window.innerWidth === width && window.innerHeight === height,
            contentVisible: document.querySelectorAll('.MuiCard-root').length > 0
          };
          
          // Mobile-specific checks
          const mobileChecks = isMobile ? {
            hasMenuButton: !!document.querySelector('[aria-label="menu"]'),
            menuButtonVisible: (() => {
              const btn = document.querySelector('[aria-label="menu"]');
              return btn ? getComputedStyle(btn).display !== 'none' : false;
            })()
          } : {};
          
          // Browser-specific CSS feature detection
          const cssSupport = {
            flexbox: CSS.supports('display', 'flex'),
            grid: CSS.supports('display', 'grid'),
            transforms: CSS.supports('transform', 'translateZ(0)'),
            transitions: CSS.supports('transition', 'all 0.3s ease')
          };
          
          return {
            universal: universalChecks,
            mobile: mobileChecks,
            css: cssSupport,
            viewport: { width, height, isMobile, isTablet, isDesktop },
            browser
          };
        }, { viewportInfo: viewport, browser: browserName });
        
        // Universal expectations
        expect(responsiveCheck.universal.bodyFitsViewport).toBeTruthy();
        expect(responsiveCheck.universal.viewportMatches).toBeTruthy();
        expect(responsiveCheck.universal.contentVisible).toBeTruthy();
        expect(responsiveCheck.css.flexbox).toBeTruthy();
        
        // Mobile-specific expectations
        if (responsiveCheck.viewport.isMobile) {
          expect(responsiveCheck.mobile.hasMenuButton).toBeTruthy();
          expect(responsiveCheck.mobile.menuButtonVisible).toBeTruthy();
        }
        
        // Chart responsiveness check
        const chart = page.locator('svg, canvas').first();
        if (await chart.isVisible({ timeout: 5000 }).catch(() => false)) {
          const chartBox = await chart.boundingBox();
          if (chartBox) {
            expect(chartBox.width).toBeLessThanOrEqual(viewport.width + 10);
            console.log(`${browserName} ${viewport.name}: Chart ${Math.round(chartBox.width)}x${Math.round(chartBox.height)}`);
          }
        }
        
        // Check scroll width within page context
        const scrollCheck = await page.evaluate((width) => {
          return {
            scrollWidth: document.body.scrollWidth,
            fitsViewport: document.body.scrollWidth <= width + 50
          };
        }, viewport.width);
        
        console.log(`${browserName} ${viewport.name}: Layout OK, scrollWidth: ${scrollCheck.fitsViewport ? 'fits' : 'overflow'}`);
      }
    });

    test('Cross-browser animation and transition compatibility', async ({ page, browserName }) => {
      await page.goto('/');
      
      // Wait for content
      await page.waitForSelector('.MuiCard-root', { timeout: 10000 });
      
      // Universal animation compatibility test
      const animationSupport = await page.evaluate((browser) => {
        const cards = document.querySelectorAll('.MuiCard-root');
        if (cards.length === 0) return { supported: false };
        
        const card = cards[0];
        const originalTransform = getComputedStyle(card).transform;
        const originalTransition = getComputedStyle(card).transition;
        
        // Universal CSS animation features
        const universalSupport = {
          transitions: CSS.supports('transition', 'all 0.3s ease'),
          transforms: CSS.supports('transform', 'scale(1.05)'),
          opacity: CSS.supports('opacity', '0.8'),
          boxShadow: CSS.supports('box-shadow', '0 4px 20px rgba(0,0,0,0.1)')
        };
        
        // Browser-specific prefixes
        const browserPrefixes = {
          firefox: {
            mozTransition: CSS.supports('-moz-transition', 'all 0.3s ease'),
            mozTransform: CSS.supports('-moz-transform', 'scale(1.05)')
          },
          webkit: {
            webkitTransition: CSS.supports('-webkit-transition', 'all 0.3s ease'),
            webkitTransform: CSS.supports('-webkit-transform', 'scale(1.05)')
          },
          chromium: {
            willChange: CSS.supports('will-change', 'transform'),
            backfaceVisibility: CSS.supports('backface-visibility', 'hidden')
          }
        };
        
        // Test actual animation capability
        let animationWorks = false;
        try {
          card.style.transition = 'transform 0.1s ease';
          card.style.transform = 'scale(1.01)';
          
          // Force reflow
          card.offsetHeight;
          
          // Check if transform was applied
          const newTransform = getComputedStyle(card).transform;
          animationWorks = newTransform !== originalTransform;
          
          // Reset
          card.style.transform = originalTransform;
          card.style.transition = originalTransition;
        } catch (e) {
          animationWorks = false;
        }
        
        return {
          supported: true,
          universal: universalSupport,
          browserSpecific: browserPrefixes[browser] || {},
          actualAnimation: animationWorks,
          browser
        };
      }, browserName);
      
      // Universal animation expectations
      expect(animationSupport.supported).toBeTruthy();
      expect(animationSupport.universal.transitions).toBeTruthy();
      expect(animationSupport.universal.transforms).toBeTruthy();
      expect(animationSupport.universal.opacity).toBeTruthy();
      expect(animationSupport.actualAnimation).toBeTruthy();
      
      console.log(`${browserName} Animation Support:`, {
        transitions: animationSupport.universal.transitions,
        transforms: animationSupport.universal.transforms,
        actualAnimation: animationSupport.actualAnimation
      });
    });
  });

  test.describe('Universal Performance Fixes', () => {
    test('Cross-browser memory management', async ({ page, browserName }) => {
      const testPages = ['/', '/pools', '/nodes', '/supply'];
      const performanceData = [];
      
      // Browser-specific performance expectations
      const performanceThresholds = {
        firefox: { loadTime: 10000, elements: 4500 },
        webkit: { loadTime: 8000, elements: 3000 },
        chromium: { loadTime: 8000, elements: 2500 }
      };
      
      const thresholds = performanceThresholds[browserName] || performanceThresholds.chromium;
      
      for (const testPage of testPages) {
        const startTime = Date.now();
        await page.goto(testPage, { waitUntil: 'domcontentloaded' });
        const loadTime = Date.now() - startTime;
        
        // Universal performance metrics
        const pageMetrics = await page.evaluate((browser) => {
          const elementCount = document.querySelectorAll('*').length;
          const scriptCount = document.querySelectorAll('script').length;
          const styleCount = document.querySelectorAll('style, link[rel="stylesheet"]').length;
          const imageCount = document.querySelectorAll('img').length;
          const canvasCount = document.querySelectorAll('canvas').length;
          const svgCount = document.querySelectorAll('svg').length;
          
          // Memory info if available
          const memoryInfo = performance.memory ? {
            used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
            total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
            limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
          } : null;
          
          return {
            elementCount,
            scriptCount,
            styleCount,
            imageCount,
            canvasCount,
            svgCount,
            memoryInfo,
            browser
          };
        }, browserName);
        
        performanceData.push({
          page: testPage,
          loadTime,
          ...pageMetrics
        });
        
        // Universal performance expectations
        expect(loadTime).toBeLessThan(thresholds.loadTime);
        expect(pageMetrics.elementCount).toBeLessThan(thresholds.elements);
        
        console.log(`${browserName} ${testPage}: ${loadTime}ms load, ${pageMetrics.elementCount} elements${pageMetrics.memoryInfo ? `, ${pageMetrics.memoryInfo.used}MB memory` : ''}`);
      }
      
      // Check for excessive growth between pages
      const elementGrowth = performanceData[performanceData.length - 1].elementCount - performanceData[0].elementCount;
      expect(elementGrowth).toBeLessThan(1000);
      
      if (performanceData[0].memoryInfo && performanceData[performanceData.length - 1].memoryInfo) {
        const memoryGrowth = performanceData[performanceData.length - 1].memoryInfo.used - performanceData[0].memoryInfo.used;
        expect(memoryGrowth).toBeLessThan(100); // Less than 100MB growth
      }
    });
  });
});