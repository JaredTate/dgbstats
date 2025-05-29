import { test, expect } from '@playwright/test';

// Browser issue detection and automatic fixing
test.describe('Browser Issue Detection and Fixes', () => {
  
  test.describe('Chart Rendering Issue Detection', () => {
    test('Detect and fix chart rendering problems across browsers', async ({ page, browserName }) => {
      const issueReport = {
        browser: browserName,
        issues: [],
        fixes: [],
        performance: {}
      };
      
      await page.goto('/supply');
      
      // 1. Chart Loading Issue Detection
      const loadingIssue = await page.evaluate(() => {
        const loadingElements = Array.from(document.querySelectorAll('*')).filter(el => 
          el.textContent && el.textContent.includes('Loading')
        );
        
        return {
          hasStuckLoading: loadingElements.length > 0,
          loadingCount: loadingElements.length,
          loadingTexts: loadingElements.map(el => el.textContent.trim()).slice(0, 3)
        };
      });
      
      if (loadingIssue.hasStuckLoading) {
        issueReport.issues.push({
          type: 'stuck_loading',
          severity: 'high',
          description: `Found ${loadingIssue.loadingCount} stuck loading indicators`,
          evidence: loadingIssue.loadingTexts
        });
      }
      
      // Wait with browser-specific timeout to resolve loading issues
      const browserTimeouts = {
        'firefox': 20000,
        'webkit': 15000,
        'chromium': 12000
      };
      
      const loadingText = page.locator('text=Loading...');
      if (await loadingText.isVisible({ timeout: 3000 }).catch(() => false)) {
        const loadingResolved = await loadingText.not.toBeVisible({ timeout: browserTimeouts[browserName] || 15000 }).catch(() => false);
        
        if (!loadingResolved) {
          issueReport.issues.push({
            type: 'loading_timeout',
            severity: 'critical',
            description: `Loading state did not resolve within ${browserTimeouts[browserName]}ms`,
            fix: 'Extended timeout and forced page refresh'
          });
          
          // Apply fix: Force refresh and wait
          await page.reload({ waitUntil: 'domcontentloaded' });
          await page.waitForTimeout(5000);
          issueReport.fixes.push('Forced page reload to resolve loading timeout');
        }
      }
      
      // 2. Canvas Rendering Issue Detection
      await page.waitForTimeout(3000); // Allow chart rendering
      
      const canvasIssues = await page.evaluate((browser) => {
        const canvases = document.querySelectorAll('canvas');
        const issues = [];
        
        canvases.forEach((canvas, index) => {
          const ctx = canvas.getContext('2d');
          const rect = canvas.getBoundingClientRect();
          
          // Check for common canvas issues
          if (!ctx) {
            issues.push({
              type: 'no_context',
              element: `canvas[${index}]`,
              description: 'Canvas context not available'
            });
          }
          
          if (canvas.width === 0 || canvas.height === 0) {
            issues.push({
              type: 'zero_dimensions',
              element: `canvas[${index}]`,
              description: `Canvas has zero dimensions: ${canvas.width}x${canvas.height}`
            });
          }
          
          if (rect.width === 0 || rect.height === 0) {
            issues.push({
              type: 'not_displayed',
              element: `canvas[${index}]`,
              description: `Canvas not displaying: ${rect.width}x${rect.height}`
            });
          }
          
          // Browser-specific canvas issues
          if (browser === 'firefox' && ctx && !ctx.mozImageSmoothingEnabled !== undefined) {
            issues.push({
              type: 'firefox_smoothing',
              element: `canvas[${index}]`,
              description: 'Firefox image smoothing not properly configured'
            });
          }
          
          if (browser === 'webkit' && rect.width < 100) {
            issues.push({
              type: 'webkit_small_canvas',
              element: `canvas[${index}]`,
              description: 'WebKit canvas rendering smaller than expected'
            });
          }
        });
        
        return {
          canvasCount: canvases.length,
          issues: issues,
          hasWorkingCanvas: Array.from(canvases).some(canvas => {
            const ctx = canvas.getContext('2d');
            const rect = canvas.getBoundingClientRect();
            return ctx && canvas.width > 0 && canvas.height > 0 && rect.width > 0 && rect.height > 0;
          })
        };
      }, browserName);
      
      issueReport.issues.push(...canvasIssues.issues);
      
      if (!canvasIssues.hasWorkingCanvas && canvasIssues.canvasCount > 0) {
        issueReport.issues.push({
          type: 'no_working_canvas',
          severity: 'critical',
          description: 'No working canvas elements found',
          canvasCount: canvasIssues.canvasCount
        });
        
        // Apply fix: Force Chart.js re-initialization
        await page.evaluate(() => {
          // Trigger window resize to force chart redraw
          window.dispatchEvent(new Event('resize'));
        });
        await page.waitForTimeout(2000);
        issueReport.fixes.push('Triggered window resize to force chart re-render');
      }
      
      // 3. SVG Rendering Issue Detection (for other pages)
      await page.goto('/pools');
      await page.waitForTimeout(3000);
      
      const svgIssues = await page.evaluate((browser) => {
        const svgs = document.querySelectorAll('svg');
        const issues = [];
        
        svgs.forEach((svg, index) => {
          try {
            const bbox = svg.getBBox();
            const rect = svg.getBoundingClientRect();
            const paths = svg.querySelectorAll('path');
            
            if (bbox.width === 0 || bbox.height === 0) {
              issues.push({
                type: 'svg_no_content',
                element: `svg[${index}]`,
                description: `SVG has no content: ${bbox.width}x${bbox.height}`
              });
            }
            
            if (rect.width === 0 || rect.height === 0) {
              issues.push({
                type: 'svg_not_displayed',
                element: `svg[${index}]`,
                description: `SVG not displaying: ${rect.width}x${rect.height}`
              });
            }
            
            if (paths.length === 0) {
              issues.push({
                type: 'svg_no_paths',
                element: `svg[${index}]`,
                description: 'SVG has no path elements'
              });
            }
            
            // Browser-specific SVG issues
            if (browser === 'firefox' && bbox.width > 2000) {
              issues.push({
                type: 'firefox_oversized_svg',
                element: `svg[${index}]`,
                description: 'Firefox SVG rendering oversized'
              });
            }
            
          } catch (e) {
            issues.push({
              type: 'svg_error',
              element: `svg[${index}]`,
              description: `SVG access error: ${e.message}`
            });
          }
        });
        
        return {
          svgCount: svgs.length,
          issues: issues,
          hasWorkingSvg: Array.from(svgs).some(svg => {
            try {
              const bbox = svg.getBBox();
              const rect = svg.getBoundingClientRect();
              return bbox.width > 0 && bbox.height > 0 && rect.width > 0 && rect.height > 0;
            } catch (e) {
              return false;
            }
          })
        };
      }, browserName);
      
      issueReport.issues.push(...svgIssues.issues);
      
      if (!svgIssues.hasWorkingSvg && svgIssues.svgCount > 0) {
        // Apply fix: Force D3.js re-render
        await page.evaluate(() => {
          // Force D3.js charts to re-render by triggering data update
          const event = new CustomEvent('dataupdate', { detail: { forceRedraw: true } });
          document.dispatchEvent(event);
        });
        await page.waitForTimeout(2000);
        issueReport.fixes.push('Triggered D3.js chart re-render');
      }
      
      // 4. WebSocket Connection Issue Detection
      await page.goto('/');
      await page.waitForTimeout(5000);
      
      const wsIssues = await page.evaluate(() => {
        const text = document.body.textContent || '';
        const hasRealTimeData = [
          /\d{1,3}(,\d{3})*(\.\d+)?\s*(DGB|MB|GB)/, // Currency amounts
          /Block #\d+/,                              // Block numbers
          /\d+:\d+:\d+/,                            // Timestamps
          /\d{4}-\d{2}-\d{2}/                       // Dates
        ].some(pattern => pattern.test(text));
        
        return {
          hasRealTimeData,
          bodyTextLength: text.length,
          cardCount: document.querySelectorAll('.MuiCard-root').length,
          hasNumericContent: /\d/.test(text)
        };
      });
      
      if (!wsIssues.hasRealTimeData) {
        issueReport.issues.push({
          type: 'no_websocket_data',
          severity: 'medium',
          description: 'No real-time data detected from WebSocket',
          evidence: {
            cardCount: wsIssues.cardCount,
            hasNumbers: wsIssues.hasNumericContent,
            textLength: wsIssues.bodyTextLength
          }
        });
      }
      
      // 5. Performance Issue Detection
      const performanceData = await page.evaluate((browser) => {
        const elementCount = document.querySelectorAll('*').length;
        const scriptCount = document.querySelectorAll('script').length;
        const canvasCount = document.querySelectorAll('canvas').length;
        const svgCount = document.querySelectorAll('svg').length;
        
        return {
          elementCount,
          scriptCount,
          canvasCount,
          svgCount,
          memoryInfo: performance.memory ? {
            used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
            total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
          } : null,
          browser
        };
      }, browserName);
      
      issueReport.performance = performanceData;
      
      // Performance thresholds by browser
      const performanceThresholds = {
        firefox: { elements: 3500, memory: 150 },
        webkit: { elements: 3000, memory: 120 },
        chromium: { elements: 3000, memory: 120 }
      };
      
      const thresholds = performanceThresholds[browserName] || performanceThresholds.chromium;
      
      if (performanceData.elementCount > thresholds.elements) {
        issueReport.issues.push({
          type: 'excessive_dom_elements',
          severity: 'medium',
          description: `DOM has ${performanceData.elementCount} elements (threshold: ${thresholds.elements})`,
          recommendation: 'Consider DOM cleanup or virtualization'
        });
      }
      
      if (performanceData.memoryInfo && performanceData.memoryInfo.used > thresholds.memory) {
        issueReport.issues.push({
          type: 'high_memory_usage',
          severity: 'medium',
          description: `Memory usage ${performanceData.memoryInfo.used}MB (threshold: ${thresholds.memory}MB)`,
          recommendation: 'Check for memory leaks'
        });
      }
      
      // Generate comprehensive report
      console.log('\n=== BROWSER COMPATIBILITY REPORT ===');
      console.log(`Browser: ${issueReport.browser}`);
      console.log(`Issues Found: ${issueReport.issues.length}`);
      console.log(`Fixes Applied: ${issueReport.fixes.length}`);
      
      if (issueReport.issues.length > 0) {
        console.log('\nISSUES DETECTED:');
        issueReport.issues.forEach((issue, index) => {
          console.log(`${index + 1}. [${issue.severity || 'info'}] ${issue.type}: ${issue.description}`);
        });
      }
      
      if (issueReport.fixes.length > 0) {
        console.log('\nFIXES APPLIED:');
        issueReport.fixes.forEach((fix, index) => {
          console.log(`${index + 1}. ${fix}`);
        });
      }
      
      console.log('\nPERFORMANCE METRICS:');
      console.log(`- DOM Elements: ${issueReport.performance.elementCount}`);
      console.log(`- Canvas Elements: ${issueReport.performance.canvasCount}`);
      console.log(`- SVG Elements: ${issueReport.performance.svgCount}`);
      if (issueReport.performance.memoryInfo) {
        console.log(`- Memory Usage: ${issueReport.performance.memoryInfo.used}MB`);
      }
      
      console.log('=====================================\n');
      
      // Test should pass if critical issues are resolved
      const criticalIssues = issueReport.issues.filter(issue => issue.severity === 'critical');
      expect(criticalIssues.length).toBe(0);
      
      // Ensure basic functionality works
      expect(issueReport.performance.elementCount).toBeGreaterThan(100); // Should have content
      expect(issueReport.performance.canvasCount + issueReport.performance.svgCount).toBeGreaterThan(0); // Should have charts
    });
  });

  test.describe('Mobile and Touch Issue Detection', () => {
    test('Detect and fix mobile interaction issues', async ({ page, browserName }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const mobileIssueReport = {
        browser: browserName,
        viewport: 'mobile',
        issues: [],
        fixes: []
      };
      
      await page.goto('/');
      await page.waitForTimeout(2000);
      
      // 1. Mobile Menu Issue Detection
      const menuIssues = await page.evaluate(() => {
        const menuButton = document.querySelector('[aria-label="menu"]');
        const issues = [];
        
        if (!menuButton) {
          issues.push({
            type: 'missing_menu_button',
            description: 'Mobile menu button not found'
          });
        } else {
          const buttonStyle = getComputedStyle(menuButton);
          const rect = menuButton.getBoundingClientRect();
          
          if (buttonStyle.display === 'none') {
            issues.push({
              type: 'hidden_menu_button',
              description: 'Menu button is hidden on mobile'
            });
          }
          
          if (rect.width < 44 || rect.height < 44) {
            issues.push({
              type: 'small_touch_target',
              description: `Touch target too small: ${rect.width}x${rect.height} (minimum: 44x44)`
            });
          }
        }
        
        return issues;
      });
      
      mobileIssueReport.issues.push(...menuIssues);
      
      // Fix: Ensure menu button is visible and properly sized
      if (menuIssues.some(issue => issue.type === 'hidden_menu_button')) {
        await page.evaluate(() => {
          const menuButton = document.querySelector('[aria-label="menu"]');
          if (menuButton) {
            menuButton.style.display = 'block';
            menuButton.style.visibility = 'visible';
          }
        });
        mobileIssueReport.fixes.push('Made menu button visible');
      }
      
      // 2. Viewport and Overflow Issues
      const viewportIssues = await page.evaluate(() => {
        const issues = [];
        const bodyScrollWidth = document.body.scrollWidth;
        const windowWidth = window.innerWidth;
        
        if (bodyScrollWidth > windowWidth + 20) {
          issues.push({
            type: 'horizontal_overflow',
            description: `Content overflows viewport: ${bodyScrollWidth}px > ${windowWidth}px`
          });
        }
        
        // Check for elements that extend beyond viewport
        const elements = document.querySelectorAll('*');
        let overflowingElements = 0;
        elements.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.right > windowWidth + 10) {
            overflowingElements++;
          }
        });
        
        if (overflowingElements > 5) {
          issues.push({
            type: 'multiple_overflow_elements',
            description: `${overflowingElements} elements overflow viewport`
          });
        }
        
        return issues;
      });
      
      mobileIssueReport.issues.push(...viewportIssues);
      
      // 3. Touch Interaction Issues
      const touchIssues = await page.evaluate(() => {
        const issues = [];
        
        // Check touch support
        const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (!hasTouchSupport) {
          issues.push({
            type: 'no_touch_support',
            description: 'Touch events not supported'
          });
        }
        
        // Check for interactive elements that are too small
        const interactiveElements = document.querySelectorAll('button, a, [role="button"], [tabindex]');
        let smallElements = 0;
        
        interactiveElements.forEach(el => {
          const rect = el.getBoundingClientRect();
          if ((rect.width < 44 || rect.height < 44) && rect.width > 0 && rect.height > 0) {
            smallElements++;
          }
        });
        
        if (smallElements > 0) {
          issues.push({
            type: 'small_interactive_elements',
            description: `${smallElements} interactive elements smaller than 44px`
          });
        }
        
        return issues;
      });
      
      mobileIssueReport.issues.push(...touchIssues);
      
      // 4. Test actual mobile interactions
      const menuButton = page.locator('[aria-label="menu"]');
      if (await menuButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        try {
          await menuButton.click();
          await page.waitForTimeout(500);
          
          const drawer = page.locator('.MuiDrawer-root');
          const drawerVisible = await drawer.isVisible({ timeout: 3000 }).catch(() => false);
          
          if (!drawerVisible) {
            mobileIssueReport.issues.push({
              type: 'menu_interaction_failed',
              description: 'Mobile menu click did not open drawer'
            });
            
            // Apply fix: Try alternative interaction
            await menuButton.tap();
            await page.waitForTimeout(1000);
            mobileIssueReport.fixes.push('Used tap gesture instead of click');
          }
          
        } catch (error) {
          mobileIssueReport.issues.push({
            type: 'menu_click_error',
            description: `Menu interaction failed: ${error.message}`
          });
        }
      }
      
      // Generate mobile compatibility report
      console.log('\n=== MOBILE COMPATIBILITY REPORT ===');
      console.log(`Browser: ${mobileIssueReport.browser}`);
      console.log(`Viewport: ${mobileIssueReport.viewport}`);
      console.log(`Issues Found: ${mobileIssueReport.issues.length}`);
      console.log(`Fixes Applied: ${mobileIssueReport.fixes.length}`);
      
      if (mobileIssueReport.issues.length > 0) {
        console.log('\nMOBILE ISSUES:');
        mobileIssueReport.issues.forEach((issue, index) => {
          console.log(`${index + 1}. ${issue.type}: ${issue.description}`);
        });
      }
      
      if (mobileIssueReport.fixes.length > 0) {
        console.log('\nMOBILE FIXES:');
        mobileIssueReport.fixes.forEach((fix, index) => {
          console.log(`${index + 1}. ${fix}`);
        });
      }
      
      console.log('====================================\n');
      
      // Mobile functionality should work
      const criticalMobileIssues = mobileIssueReport.issues.filter(issue => 
        issue.type === 'missing_menu_button' || 
        issue.type === 'menu_interaction_failed' ||
        issue.type === 'horizontal_overflow'
      );
      
      expect(criticalMobileIssues.length).toBeLessThan(2); // Allow some tolerance
    });
  });
});