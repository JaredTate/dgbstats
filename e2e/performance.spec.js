import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('measure page load times for all routes', async ({ page }) => {
    const routes = [
      { path: '/', name: 'Home' },
      { path: '/pools', name: 'Pools' },
      { path: '/nodes', name: 'Nodes' },
      { path: '/supply', name: 'Supply' },
      { path: '/hashrate', name: 'Hashrate' },
      { path: '/blocks', name: 'Blocks' },
      { path: '/difficulties', name: 'Difficulties' },
      { path: '/algos', name: 'Algos' },
      { path: '/taproot', name: 'Taproot' },
      { path: '/downloads', name: 'Downloads' }
    ];

    const results = [];

    for (const route of routes) {
      // Measure navigation timing
      await page.goto(route.path);
      
      const metrics = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0];
        return {
          domContentLoaded: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
          loadComplete: nav.loadEventEnd - nav.loadEventStart,
          domInteractive: nav.domInteractive - nav.fetchStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
        };
      });

      results.push({
        route: route.name,
        ...metrics
      });

      // Assert reasonable load times
      expect(metrics.domInteractive).toBeLessThan(3000);
      expect(metrics.loadComplete).toBeLessThan(5000);
    }

    // Log results
    console.table(results);
  });

  test('measure WebSocket connection time', async ({ page }) => {
    await page.goto('/');
    
    // Measure WebSocket connection
    const wsMetrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const startTime = performance.now();
        const checkConnection = setInterval(() => {
          // Check if WebSocket data has been received
          const hasData = document.querySelector('.stat-value')?.textContent !== 'Loading...';
          if (hasData) {
            clearInterval(checkConnection);
            resolve({
              connectionTime: performance.now() - startTime,
              success: true
            });
          }
        }, 100);

        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkConnection);
          resolve({
            connectionTime: 10000,
            success: false
          });
        }, 10000);
      });
    });

    expect(wsMetrics.success).toBeTruthy();
    expect(wsMetrics.connectionTime).toBeLessThan(5000);
    console.log(`WebSocket connected in ${wsMetrics.connectionTime}ms`);
  });

  test('measure chart rendering performance', async ({ page }) => {
    // Test D3.js chart (Pools page)
    await page.goto('/pools');
    
    const d3Metrics = await page.evaluate(() => {
      const startTime = performance.now();
      return new Promise((resolve) => {
        const checkChart = setInterval(() => {
          const chart = document.querySelector('#poolsChart svg');
          if (chart && chart.querySelectorAll('path.slice').length > 0) {
            clearInterval(checkChart);
            resolve({
              renderTime: performance.now() - startTime,
              elementCount: chart.querySelectorAll('*').length
            });
          }
        }, 50);
      });
    });

    expect(d3Metrics.renderTime).toBeLessThan(2000);
    console.log(`D3 chart rendered in ${d3Metrics.renderTime}ms with ${d3Metrics.elementCount} elements`);

    // Test Chart.js (Supply page)
    await page.goto('/supply');
    
    const chartJsMetrics = await page.evaluate(() => {
      const startTime = performance.now();
      return new Promise((resolve) => {
        const checkChart = setInterval(() => {
          const canvas = document.querySelector('#supplyChart');
          if (canvas && canvas.getContext('2d').__chartjs) {
            clearInterval(checkChart);
            resolve({
              renderTime: performance.now() - startTime
            });
          }
        }, 50);
      });
    });

    expect(chartJsMetrics.renderTime).toBeLessThan(2000);
    console.log(`Chart.js rendered in ${chartJsMetrics.renderTime}ms`);
  });

  test('measure memory usage', async ({ page }) => {
    await page.goto('/');
    
    // Get initial memory
    const initialMemory = await page.evaluate(() => {
      if (performance.memory) {
        return {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize
        };
      }
      return null;
    });

    // Navigate through multiple pages
    const pages = ['/pools', '/nodes', '/supply', '/blocks', '/hashrate'];
    
    for (const path of pages) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
    }

    // Get final memory
    const finalMemory = await page.evaluate(() => {
      if (performance.memory) {
        return {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize
        };
      }
      return null;
    });

    if (initialMemory && finalMemory) {
      const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
      console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    }
  });

  test('measure scroll performance on data-heavy pages', async ({ page }) => {
    await page.goto('/blocks');
    await page.waitForSelector('.block-item');

    // Measure scroll performance
    const scrollMetrics = await page.evaluate(() => {
      const measurements = [];
      let lastTime = performance.now();
      let frameCount = 0;

      return new Promise((resolve) => {
        const measureFrame = () => {
          frameCount++;
          const currentTime = performance.now();
          const frameDuration = currentTime - lastTime;
          measurements.push(frameDuration);
          lastTime = currentTime;

          if (frameCount < 60) { // Measure 60 frames
            requestAnimationFrame(measureFrame);
          } else {
            const avgFrameTime = measurements.reduce((a, b) => a + b) / measurements.length;
            const fps = 1000 / avgFrameTime;
            resolve({ avgFrameTime, fps });
          }
        };

        // Start scrolling
        window.scrollTo({ top: 1000, behavior: 'smooth' });
        requestAnimationFrame(measureFrame);
      });
    });

    console.log(`Scroll performance: ${scrollMetrics.fps.toFixed(2)} FPS`);
    expect(scrollMetrics.fps).toBeGreaterThan(30); // Should maintain at least 30 FPS
  });

  test('measure bundle size impact', async ({ page }) => {
    const resourceMetrics = [];

    page.on('response', response => {
      const url = response.url();
      if (url.includes('.js') || url.includes('.css')) {
        resourceMetrics.push({
          url: url.split('/').pop(),
          size: response.headers()['content-length'] || 0,
          type: url.includes('.js') ? 'JavaScript' : 'CSS'
        });
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Calculate total bundle sizes
    const jsSize = resourceMetrics
      .filter(r => r.type === 'JavaScript')
      .reduce((sum, r) => sum + parseInt(r.size), 0);
    
    const cssSize = resourceMetrics
      .filter(r => r.type === 'CSS')
      .reduce((sum, r) => sum + parseInt(r.size), 0);

    console.log(`JavaScript bundle: ${(jsSize / 1024).toFixed(2)} KB`);
    console.log(`CSS bundle: ${(cssSize / 1024).toFixed(2)} KB`);
    console.log(`Total: ${((jsSize + cssSize) / 1024).toFixed(2)} KB`);

    // Bundles should be reasonably sized
    expect(jsSize).toBeLessThan(2 * 1024 * 1024); // 2MB
    expect(cssSize).toBeLessThan(500 * 1024); // 500KB
  });

  test('measure API response times', async ({ page }) => {
    const apiCalls = [];

    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/') || url.includes('ws://') || url.includes('wss://')) {
        apiCalls.push({
          url: url.split('/').slice(-2).join('/'),
          status: response.status(),
          time: response.timing()
        });
      }
    });

    await page.goto('/');
    await page.waitForTimeout(5000); // Wait for API calls

    // Log API performance
    console.log('API Response Times:');
    apiCalls.forEach(call => {
      if (call.time) {
        console.log(`${call.url}: ${call.time.responseEnd - call.time.requestStart}ms`);
      }
    });
  });

  test('measure pagination performance', async ({ page }) => {
    await page.goto('/blocks');
    await page.waitForSelector('.block-item');

    // Measure pagination click
    const paginationMetrics = await page.evaluate(() => {
      return new Promise(async (resolve) => {
        const startTime = performance.now();
        
        // Click next page
        const nextButton = document.querySelector('button[aria-label="Go to next page"]');
        if (nextButton) {
          nextButton.click();
          
          // Wait for content update
          const observer = new MutationObserver(() => {
            observer.disconnect();
            resolve({
              updateTime: performance.now() - startTime,
              success: true
            });
          });
          
          observer.observe(document.querySelector('.block-list-container'), {
            childList: true,
            subtree: true
          });
        } else {
          resolve({ updateTime: 0, success: false });
        }
      });
    });

    if (paginationMetrics.success) {
      expect(paginationMetrics.updateTime).toBeLessThan(1000);
      console.log(`Pagination updated in ${paginationMetrics.updateTime}ms`);
    }
  });

  test('measure CPU usage during interactions', async ({ page }) => {
    await page.goto('/nodes');
    
    // Start CPU profiling
    await page.evaluateOnNewDocument(() => {
      window.cpuMetrics = [];
      let lastIdleDeadline = 0;
      
      if (window.requestIdleCallback) {
        const measureCPU = (deadline) => {
          const idleTime = deadline.timeRemaining();
          window.cpuMetrics.push({
            timestamp: Date.now(),
            idleTime: idleTime,
            cpuUsage: 100 - (idleTime / 50 * 100) // Approximate CPU usage
          });
          
          if (window.cpuMetrics.length < 100) {
            window.requestIdleCallback(measureCPU);
          }
        };
        window.requestIdleCallback(measureCPU);
      }
    });

    await page.reload();
    await page.waitForTimeout(5000);

    const cpuMetrics = await page.evaluate(() => window.cpuMetrics || []);
    
    if (cpuMetrics.length > 0) {
      const avgCPU = cpuMetrics.reduce((sum, m) => sum + m.cpuUsage, 0) / cpuMetrics.length;
      console.log(`Average CPU usage: ${avgCPU.toFixed(2)}%`);
      
      // CPU usage should be reasonable
      expect(avgCPU).toBeLessThan(80);
    }
  });

  test('measure time to interactive (TTI)', async ({ page }) => {
    await page.goto('/');
    
    // Measure TTI
    const tti = await page.evaluate(() => {
      return new Promise((resolve) => {
        if ('PerformanceObserver' in window) {
          let tti = 0;
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
              if (entry.name === 'first-input') {
                tti = entry.processingStart - entry.startTime;
                observer.disconnect();
                resolve(tti);
              }
            });
          });
          observer.observe({ entryTypes: ['first-input'] });
          
          // Simulate user input after page loads
          setTimeout(() => {
            document.body.click();
          }, 100);
          
          // Timeout fallback
          setTimeout(() => resolve(0), 5000);
        } else {
          resolve(0);
        }
      });
    });

    if (tti > 0) {
      console.log(`Time to Interactive: ${tti}ms`);
      expect(tti).toBeLessThan(3000);
    }
  });
});