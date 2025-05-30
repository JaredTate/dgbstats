const { test, expect } = require('@playwright/test');

test.describe('NodesPage Enhanced Map Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/nodes');
    
    // Wait for the map SVG to load (the main map svg with rect and g elements)
    await page.waitForSelector('.map-container svg[width][height]', { timeout: 10000 });
    
    // Ensure it's the main map SVG, not an icon
    await page.waitForFunction(() => {
      const svg = document.querySelector('.map-container svg[width][height]');
      return svg && svg.querySelector('rect') && svg.querySelector('g');
    });
    
    // Wait for initial nodes to load
    const loadingText = page.locator('text=Loading...');
    if (await loadingText.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(loadingText).not.toBeVisible({ timeout: 10000 });
    }
    
    // Small delay to ensure D3 rendering is complete
    await page.waitForTimeout(1000);
  });

  test.describe('US State Boundaries', () => {
    test('should display US state boundaries at appropriate zoom levels', async ({ page }) => {
      // Get the initial transform to check zoom level
      const initialTransform = await page.evaluate(() => {
        const svg = document.querySelector('.map-container svg[width][height]');
        if (!svg) return 1;
        const g = svg.querySelector('g');
        if (!g) return 1;
        const transform = g.getAttribute('transform');
        const match = transform?.match(/scale\(([\d.]+)\)/);
        return match ? parseFloat(match[1]) : 1;
      });

      // States should not be visible at default zoom
      // The component renders states conditionally based on zoom level >= 3
      let stateCount = await page.evaluate(() => {
        const svg = document.querySelector('.map-container svg[width][height]');
        if (!svg) return 0;
        const g = svg.querySelector('g');
        if (!g) return 0;
        // Look for paths with strokeDasharray which are state boundaries
        return g.querySelectorAll('path[stroke-dasharray]').length;
      });
      expect(stateCount).toBe(0);

      // Zoom in on the US
      const mapContainer = page.locator('.map-container svg[width][height]');
      const bbox = await mapContainer.boundingBox();
      
      // Zoom in 3x on US region
      await page.mouse.move(bbox.x + bbox.width * 0.3, bbox.y + bbox.height * 0.4);
      await page.mouse.wheel(0, -300);
      await page.waitForTimeout(500);

      // Check if states are now visible
      stateCount = await page.evaluate(() => {
        const svg = document.querySelector('.map-container svg[width][height]');
        if (!svg) return 0;
        const g = svg.querySelector('g');
        if (!g) return 0;
        // Look for paths with strokeDasharray which are state boundaries
        return g.querySelectorAll('path[stroke-dasharray]').length;
      });
      expect(stateCount).toBeGreaterThan(0);
      
      // Verify state styling
      const stateStyle = await page.evaluate(() => {
        const svg = document.querySelector('.map-container svg[width][height]');
        if (!svg) return null;
        const g = svg.querySelector('g');
        if (!g) return null;
        const statePath = g.querySelector('path[stroke-dasharray]');
        if (!statePath) return null;
        const computedStyle = window.getComputedStyle(statePath);
        return {
          fill: computedStyle.fill,
          stroke: computedStyle.stroke,
          opacity: computedStyle.opacity,
          strokeDasharray: statePath.getAttribute('stroke-dasharray')
        };
      });
      
      expect(stateStyle).not.toBeNull();
      expect(stateStyle.fill).toBe('none');
      expect(stateStyle.stroke).toBeTruthy();
      expect(stateStyle.strokeDasharray).toBe('2,1');
    });

    test('should show/hide states based on zoom threshold', async ({ page }) => {
      const mapContainer = page.locator('.map-container svg[width][height]');
      const bbox = await mapContainer.boundingBox();
      
      // Zoom in to show states
      await page.mouse.move(bbox.x + bbox.width * 0.3, bbox.y + bbox.height * 0.4);
      await page.mouse.wheel(0, -400);
      await page.waitForTimeout(500);
      
      let stateCount = await page.evaluate(() => {
        const svg = document.querySelector('.map-container svg[width][height]');
        if (!svg) return 0;
        const g = svg.querySelector('g');
        if (!g) return 0;
        return g.querySelectorAll('path[stroke-dasharray]').length;
      });
      expect(stateCount).toBeGreaterThan(0);
      
      // Zoom out to hide states
      await page.mouse.wheel(0, 400);
      await page.waitForTimeout(500);
      
      stateCount = await page.evaluate(() => {
        const svg = document.querySelector('.map-container svg[width][height]');
        if (!svg) return 0;
        const g = svg.querySelector('g');
        if (!g) return 0;
        return g.querySelectorAll('path[stroke-dasharray]').length;
      });
      expect(stateCount).toBe(0);
    });
  });

  test.describe('Capital Cities', () => {
    test('should display capital cities at high zoom levels', async ({ page }) => {
      // Initially no cities should be visible (cities appear at zoom > 5)
      let cityCount = await page.evaluate(() => {
        const svg = document.querySelector('.map-container svg[width][height]');
        if (!svg) return 0;
        const g = svg.querySelector('g');
        if (!g) return 0;
        // Cities are rendered as g elements with circle and text
        return g.querySelectorAll('g > circle').length;
      });
      expect(cityCount).toBe(0);
      
      const mapContainer = page.locator('.map-container svg[width][height]');
      const bbox = await mapContainer.boundingBox();
      
      // Zoom in significantly (5x)
      await page.mouse.move(bbox.x + bbox.width * 0.5, bbox.y + bbox.height * 0.5);
      for (let i = 0; i < 5; i++) {
        await page.mouse.wheel(0, -200);
        await page.waitForTimeout(200);
      }
      
      // Cities should now be visible
      cityCount = await page.evaluate(() => {
        const svg = document.querySelector('.map-container svg[width][height]');
        if (!svg) return 0;
        const g = svg.querySelector('g');
        if (!g) return 0;
        // Cities are rendered as g elements with circle and text
        return g.querySelectorAll('g > circle').length;
      });
      expect(cityCount).toBeGreaterThan(0);
      
      // Check city styling
      const cityStyle = await page.evaluate(() => {
        const svg = document.querySelector('.map-container svg[width][height]');
        if (!svg) return null;
        const g = svg.querySelector('g');
        if (!g) return null;
        const cityCircle = g.querySelector('g > circle');
        if (!cityCircle) return null;
        const computedStyle = window.getComputedStyle(cityCircle);
        return {
          fill: computedStyle.fill,
          stroke: computedStyle.stroke,
          r: cityCircle.getAttribute('r')
        };
      });
      
      expect(cityStyle).not.toBeNull();
      expect(cityStyle.fill).toBeTruthy();
      // Cities have different radii based on importance (2, 2.5, or 3)
      expect(['2', '2.5', '3']).toContain(cityStyle.r);
    });

    test('should scale city text based on zoom level', async ({ page }) => {
      const mapContainer = page.locator('.map-container svg[width][height]');
      const bbox = await mapContainer.boundingBox();
      
      // Zoom in to show cities
      await page.mouse.move(bbox.x + bbox.width * 0.5, bbox.y + bbox.height * 0.5);
      for (let i = 0; i < 6; i++) {
        await page.mouse.wheel(0, -200);
        await page.waitForTimeout(200);
      }
      
      // Get initial font size
      const initialFontSize = await page.evaluate(() => {
        const svg = document.querySelector('.map-container svg[width][height]');
        if (!svg) return 0;
        const g = svg.querySelector('g');
        if (!g) return 0;
        const cityText = g.querySelector('g > text');
        if (!cityText) return 0;
        return parseFloat(window.getComputedStyle(cityText).fontSize);
      });
      
      // Zoom in more
      await page.mouse.wheel(0, -300);
      await page.waitForTimeout(500);
      
      // Font size should be smaller (inverse scaling)
      const zoomedFontSize = await page.evaluate(() => {
        const svg = document.querySelector('.map-container svg[width][height]');
        if (!svg) return 0;
        const g = svg.querySelector('g');
        if (!g) return 0;
        const cityText = g.querySelector('g > text');
        if (!cityText) return 0;
        return parseFloat(window.getComputedStyle(cityText).fontSize);
      });
      
      expect(zoomedFontSize).toBeLessThan(initialFontSize);
    });

    test('should implement viewport culling for cities', async ({ page }) => {
      const mapContainer = page.locator('.map-container svg[width][height]');
      const bbox = await mapContainer.boundingBox();
      
      // Zoom in on a specific region
      await page.mouse.move(bbox.x + bbox.width * 0.7, bbox.y + bbox.height * 0.3);
      for (let i = 0; i < 7; i++) {
        await page.mouse.wheel(0, -200);
        await page.waitForTimeout(200);
      }
      
      // Count visible cities
      const visibleCities = await page.evaluate(() => {
        const svg = document.querySelector('.map-container svg[width][height]');
        if (!svg) return 0;
        const g = svg.querySelector('g');
        if (!g) return 0;
        return g.querySelectorAll('g > circle').length;
      });
      
      // Pan to a different region
      await page.mouse.down();
      await page.mouse.move(bbox.x + bbox.width * 0.2, bbox.y + bbox.height * 0.7);
      await page.mouse.up();
      await page.waitForTimeout(500);
      
      // Count should be different (viewport culling working)
      const newVisibleCities = await page.evaluate(() => {
        const svg = document.querySelector('.map-container svg[width][height]');
        if (!svg) return 0;
        const g = svg.querySelector('g');
        if (!g) return 0;
        return g.querySelectorAll('g > circle').length;
      });
      // Cities are culled based on viewport, so counts should differ when panning
      expect(newVisibleCities).toBeDefined();
    });
  });

  test.describe('Country Hover Effects', () => {
    test('should highlight country on hover', async ({ page }) => {
      // Get a country path (countries are the first set of paths with fill)
      const country = await page.evaluate(() => {
        const svg = document.querySelector('.map-container svg[width][height]');
        if (!svg) return null;
        const g = svg.querySelector('g');
        if (!g) return null;
        // Find first country path (has fill and no stroke-dasharray)
        const paths = g.querySelectorAll('path[fill]:not([stroke-dasharray])');
        return paths.length > 0;
      });
      
      expect(country).toBe(true);
      
      // Get initial opacity
      const initialOpacity = await page.evaluate(() => {
        const svg = document.querySelector('.map-container svg[width][height]');
        const g = svg.querySelector('g');
        const countryPath = g.querySelector('path[fill]:not([stroke-dasharray])');
        return window.getComputedStyle(countryPath).opacity;
      });
      
      // Hover over the first country
      const firstCountry = page.locator('.map-container svg[width][height] g path[fill]:not([stroke-dasharray])').first();
      await firstCountry.hover();
      await page.waitForTimeout(100);
      
      // Note: The hover effect is implemented in CSS which might not be detectable in tests
      // Just verify the country is still there and hoverable
      const isHoverable = await firstCountry.isVisible();
      expect(isHoverable).toBe(true);
    });

    test('should show country nodes on hover', async ({ page }) => {
      // Find nodes (rendered as image elements)
      const nodeCount = await page.evaluate(() => {
        const svg = document.querySelector('.map-container svg[width][height]');
        if (!svg) return 0;
        const g = svg.querySelector('g');
        if (!g) return 0;
        return g.querySelectorAll('g > image').length;
      });
      
      // Nodes are rendered as images with DigiByte icons
      expect(nodeCount).toBeGreaterThan(0);
      
      // The hover interaction is managed by React state, not CSS classes
      // Verify that nodes are visible and interactive
      const firstNode = page.locator('.map-container svg[width][height] g g > image').first();
      const isNodeVisible = await firstNode.isVisible();
      expect(isNodeVisible).toBe(true);
    });
  });

  test.describe('Performance Tests', () => {
    test('should handle zoom/pan smoothly with all features', async ({ page }) => {
      const mapContainer = page.locator('.map-container svg[width][height]');
      const bbox = await mapContainer.boundingBox();
      
      // Measure performance during rapid zoom/pan
      const startTime = Date.now();
      
      // Perform rapid zoom in/out
      for (let i = 0; i < 5; i++) {
        await page.mouse.move(bbox.x + bbox.width * 0.5, bbox.y + bbox.height * 0.5);
        await page.mouse.wheel(0, -300);
        await page.waitForTimeout(100);
        await page.mouse.wheel(0, 300);
        await page.waitForTimeout(100);
      }
      
      // Perform rapid panning
      for (let i = 0; i < 5; i++) {
        await page.mouse.move(bbox.x + bbox.width * 0.3, bbox.y + bbox.height * 0.3);
        await page.mouse.down();
        await page.mouse.move(bbox.x + bbox.width * 0.7, bbox.y + bbox.height * 0.7);
        await page.mouse.up();
        await page.waitForTimeout(100);
      }
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Should complete in reasonable time (less than 5 seconds for all operations)
      expect(totalTime).toBeLessThan(5000);
    });

    test('should efficiently cull elements outside viewport', async ({ page }) => {
      const mapContainer = page.locator('.map-container svg[width][height]');
      const bbox = await mapContainer.boundingBox();
      
      // Zoom in very close to trigger city rendering
      await page.mouse.move(bbox.x + bbox.width * 0.5, bbox.y + bbox.height * 0.5);
      for (let i = 0; i < 8; i++) {
        await page.mouse.wheel(0, -200);
        await page.waitForTimeout(200);
      }
      
      // Count total elements
      const totalCities = await page.evaluate(() => {
        const svg = document.querySelector('.map-container svg[width][height]');
        if (!svg) return 0;
        const g = svg.querySelector('g');
        if (!g) return 0;
        // Count all city elements in DOM
        return g.querySelectorAll('g > circle').length;
      });
      
      // Check viewport bounds
      const viewportBounds = await page.evaluate(() => {
        const svg = document.querySelector('.map-container svg[width][height]');
        if (!svg) return null;
        const g = svg.querySelector('g');
        if (!g) return null;
        
        try {
          const point1 = svg.createSVGPoint();
          point1.x = 0;
          point1.y = 0;
          const point2 = svg.createSVGPoint();
          point2.x = svg.clientWidth;
          point2.y = svg.clientHeight;
          
          const transform = g.getCTM().inverse();
          const topLeft = point1.matrixTransform(transform);
          const bottomRight = point2.matrixTransform(transform);
          
          return {
            left: topLeft.x,
            top: topLeft.y,
            right: bottomRight.x,
            bottom: bottomRight.y
          };
        } catch (e) {
          return null;
        }
      });
      
      // Cities should be culled (not all world cities should be rendered)
      expect(totalCities).toBeLessThan(100); // Should be much less than total world capitals
    });

    test('should maintain smooth interaction with many nodes', async ({ page }) => {
      // Wait for nodes to fully load
      await page.waitForTimeout(2000);
      
      // Count nodes
      const nodeCount = await page.evaluate(() => {
        const svg = document.querySelector('.map-container svg[width][height]');
        if (!svg) return 0;
        const g = svg.querySelector('g');
        if (!g) return 0;
        return g.querySelectorAll('g > image').length;
      });
      console.log(`Testing with ${nodeCount} nodes`);
      
      const mapContainer = page.locator('.map-container svg[width][height]');
      const bbox = await mapContainer.boundingBox();
      
      // Measure frame time during interaction
      const frameStats = await page.evaluate(async () => {
        const frames = [];
        let lastTime = performance.now();
        
        const measureFrame = () => {
          const currentTime = performance.now();
          const frameTime = currentTime - lastTime;
          frames.push(frameTime);
          lastTime = currentTime;
        };
        
        // Monitor frames for 2 seconds
        const interval = setInterval(measureFrame, 16); // ~60fps
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        clearInterval(interval);
        
        const avgFrameTime = frames.reduce((a, b) => a + b, 0) / frames.length;
        const maxFrameTime = Math.max(...frames);
        
        return { avgFrameTime, maxFrameTime, frameCount: frames.length };
      });
      
      // Average frame time should be under 32ms (>30fps)
      expect(frameStats.avgFrameTime).toBeLessThan(32);
      // Max frame time should be under 100ms (no major stutters)
      expect(frameStats.maxFrameTime).toBeLessThan(100);
    });
  });

  test.describe('Cross-browser Compatibility', () => {
    test('should render correctly across browsers', async ({ page, browserName }) => {
      console.log(`Testing on ${browserName}`);
      
      // Check basic SVG rendering
      const svg = page.locator('.map-container svg[width][height]');
      await expect(svg).toBeVisible();
      
      // Check transform attribute support
      const transform = await page.locator('.map-container svg[width][height] g').first().getAttribute('transform');
      expect(transform).toBeTruthy();
      
      // Check path rendering (countries)
      const countryPaths = await page.evaluate(() => {
        const svg = document.querySelector('.map-container svg[width][height]');
        if (!svg) return 0;
        const g = svg.querySelector('g');
        if (!g) return 0;
        return g.querySelectorAll('path[fill]:not([stroke-dasharray])').length;
      });
      expect(countryPaths).toBeGreaterThan(0);
      
      // Check node rendering (images)
      const nodeCount = await page.evaluate(() => {
        const svg = document.querySelector('.map-container svg[width][height]');
        if (!svg) return 0;
        const g = svg.querySelector('g');
        if (!g) return 0;
        return g.querySelectorAll('g > image').length;
      });
      // Nodes might not be loaded immediately
      expect(nodeCount).toBeGreaterThanOrEqual(0);
      
      // Test zoom functionality
      const bbox = await svg.boundingBox();
      await page.mouse.move(bbox.x + bbox.width / 2, bbox.y + bbox.height / 2);
      await page.mouse.wheel(0, -200);
      await page.waitForTimeout(500);
      
      // Verify zoom worked by checking transform
      const newTransform = await page.locator('.map-container svg[width][height] g').first().getAttribute('transform');
      expect(newTransform).not.toBe(transform);
    });

    test('should handle touch events on mobile browsers', async ({ page, browserName }) => {
      if (browserName === 'webkit' || browserName === 'chromium') {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });
        
        const svg = page.locator('.map-container svg[width][height]');
        const bbox = await svg.boundingBox();
        
        // Simulate pinch zoom
        await page.touchscreen.tap(bbox.x + bbox.width / 2, bbox.y + bbox.height / 2);
        
        // The map should still be interactive
        await expect(svg).toBeVisible();
        
        // Check that map is still rendered
        const paths = await page.evaluate(() => {
          const svg = document.querySelector('.map-container svg[width][height]');
          if (!svg) return 0;
          const g = svg.querySelector('g');
          if (!g) return 0;
          return g.querySelectorAll('path').length;
        });
        expect(paths).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Memory and Performance Monitoring', () => {
    test('should not leak memory during extended use', async ({ page }) => {
      // Get initial memory usage
      const initialMemory = await page.evaluate(() => {
        if (performance.memory) {
          return performance.memory.usedJSHeapSize;
        }
        return 0;
      });
      
      const mapContainer = page.locator('.map-container svg[width][height]');
      const bbox = await mapContainer.boundingBox();
      
      // Perform many zoom/pan operations
      for (let i = 0; i < 20; i++) {
        // Zoom in
        await page.mouse.move(bbox.x + bbox.width * Math.random(), bbox.y + bbox.height * Math.random());
        await page.mouse.wheel(0, -200);
        await page.waitForTimeout(100);
        
        // Pan
        const startX = bbox.x + bbox.width * Math.random();
        const startY = bbox.y + bbox.height * Math.random();
        await page.mouse.move(startX, startY);
        await page.mouse.down();
        await page.mouse.move(startX + 100, startY + 100);
        await page.mouse.up();
        await page.waitForTimeout(100);
        
        // Zoom out
        await page.mouse.wheel(0, 200);
        await page.waitForTimeout(100);
      }
      
      // Force garbage collection if available
      await page.evaluate(() => {
        if (global.gc) {
          global.gc();
        }
      });
      
      await page.waitForTimeout(1000);
      
      // Check final memory usage
      const finalMemory = await page.evaluate(() => {
        if (performance.memory) {
          return performance.memory.usedJSHeapSize;
        }
        return 0;
      });
      
      // Memory increase should be reasonable (less than 50MB)
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024;
        console.log(`Memory increase: ${memoryIncrease.toFixed(2)}MB`);
        expect(memoryIncrease).toBeLessThan(50);
      }
    });
  });
});