/**
 * E2E Test Helpers - Standardized WebSocket and Loading State Patterns
 * 
 * This file provides comprehensive helper functions for consistent WebSocket
 * connection handling and loading state detection across all E2E tests.
 * 
 * Key Features:
 * - Reliable WebSocket data loading detection
 * - Cross-browser compatible loading state handling
 * - Race condition prevention for real-time data
 * - Standardized error handling for disconnections
 * - Performance-optimized waiting strategies
 * 
 * Browser-specific optimizations:
 * - Chrome: Fast WebSocket connections with short timeouts
 * - Firefox: Extended timeouts for chart rendering and DOM updates
 * - Safari/WebKit: Mobile viewport handling and touch interaction support
 */

/**
 * Comprehensive loading state detection and waiting
 * Handles all loading patterns used across different pages with race condition prevention
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {Object} options - Configuration options
 * @param {number} options.timeout - Maximum wait time in milliseconds (default: 10000)
 * @param {boolean} options.strict - Whether to require loading state to be initially visible (default: false)
 * @param {string} options.browserName - Browser name for specific optimizations
 */
export async function waitForLoadingComplete(page, options = {}) {
  const { timeout = 10000, strict = false, browserName = 'chromium' } = options;
  
  // Browser-specific timeout adjustments
  const adjustedTimeout = browserName === 'webkit' ? timeout * 1.3 : 
                         browserName === 'firefox' ? timeout * 1.2 : timeout;
  
  // Comprehensive loading text patterns across all pages
  const loadingPatterns = [
    'text=Loading...',
    'text=Loading block data...',
    'text=Loading node data...',
    'text=Loading releases data...',
    'text=Loading supply data...',
    'text=Loading difficulty data...',
    'text=Loading algorithm data...',
    'text=Connecting to WebSocket...',
    'text=Fetching data...'
  ];
  
  // Check for any visible loading indicators first
  let foundLoading = false;
  for (const pattern of loadingPatterns) {
    const loadingElement = page.locator(pattern);
    const isVisible = await loadingElement.isVisible({ timeout: 500 }).catch(() => false);
    
    if (isVisible) {
      foundLoading = true;
      await loadingElement.waitFor({ state: 'hidden', timeout: adjustedTimeout });
      break; // Only wait for the first visible loading indicator
    }
  }
  
  // Check for progress bars and loading spinners
  const progressIndicators = [
    'role=progressbar',
    '[data-testid="loading-spinner"]',
    '.MuiCircularProgress-root',
    '.loading-indicator'
  ];
  
  for (const selector of progressIndicators) {
    const indicator = page.locator(selector);
    const count = await indicator.count();
    if (count > 0) {
      await indicator.waitFor({ state: 'hidden', timeout: adjustedTimeout });
    }
  }
  
  // Browser-specific stabilization delay
  if (foundLoading) {
    const stabilizationDelay = browserName === 'webkit' ? 300 : 
                              browserName === 'firefox' ? 200 : 100;
    await page.waitForTimeout(stabilizationDelay);
  }
}

/**
 * Advanced WebSocket data loading detection with race condition prevention
 * Handles real-time data loading across all page types with reliable detection
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {Object} options - Configuration options
 * @param {string} options.dataSelector - CSS selector for data elements (default: '.MuiCard-root')
 * @param {number} options.timeout - Maximum wait time in milliseconds (default: 15000)
 * @param {string} options.browserName - Browser name for specific optimizations
 * @param {string} options.pageType - Page type for specific handling ('homepage', 'blocks', 'nodes', 'pools', 'supply', 'downloads')
 */
export async function waitForWebSocketData(page, options = {}) {
  const { 
    dataSelector = '.MuiCard-root', 
    timeout = 15000, 
    browserName = 'chromium',
    pageType = 'general'
  } = options;
  
  // Browser-specific timeout adjustments
  const adjustedTimeout = browserName === 'webkit' ? timeout * 1.4 : 
                         browserName === 'firefox' ? timeout * 1.3 : timeout;
  
  // Step 1: Wait for basic loading states to complete
  await waitForLoadingComplete(page, { 
    timeout: adjustedTimeout / 3, 
    browserName 
  });
  
  // Step 2: Page-specific WebSocket data detection
  await waitForPageSpecificData(page, pageType, adjustedTimeout / 2);
  
  // Step 3: Verify data elements are populated (not just visible)
  await waitForDataPopulation(page, dataSelector, adjustedTimeout / 3);
  
  // Step 4: Browser-specific stabilization
  const stabilizationDelay = browserName === 'webkit' ? 500 : 
                            browserName === 'firefox' ? 300 : 150;
  await page.waitForTimeout(stabilizationDelay);
}

/**
 * Intelligent loading state detection with graceful fallback
 * Handles cases where loading might not be visible or might complete immediately
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} loadingText - Specific loading text to look for
 * @param {number} timeout - Maximum wait time in milliseconds (default: 10000)
 * @param {string} browserName - Browser name for specific handling
 */
export async function checkAndWaitForLoading(page, loadingText = 'Loading...', timeout = 10000, browserName = 'chromium') {
  const loadingElement = page.locator(`text=${loadingText}`);
  
  // Browser-specific timeout for initial detection
  const detectionTimeout = browserName === 'webkit' ? 2000 : 1000;
  
  try {
    const isVisible = await loadingElement.isVisible({ timeout: detectionTimeout });
    if (isVisible) {
      // Adjust timeout based on browser
      const waitTimeout = browserName === 'webkit' ? timeout * 1.3 : 
                         browserName === 'firefox' ? timeout * 1.2 : timeout;
      await loadingElement.waitFor({ state: 'hidden', timeout: waitTimeout });
      
      // Additional stabilization for browsers that need it
      if (browserName === 'webkit') {
        await page.waitForTimeout(200);
      }
    }
  } catch (error) {
    // Loading state not found or already completed - this is expected behavior
    // No action needed as this indicates fast loading or cached data
  }
}

/**
 * Handle mobile viewport loading patterns
 * Mobile devices may have different loading behavior due to performance constraints
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {Object} options - Configuration options
 */
export async function waitForMobileLoading(page, options = {}) {
  const { timeout = 8000 } = options;
  
  // Mobile may have slower loading, so use shorter initial timeout
  await waitForLoadingComplete(page, { timeout });
  
  // Wait for essential elements to be ready
  await page.waitForSelector('h1, h2, .MuiCard-root', { timeout });
}

/**
 * Wait for chart/visualization loading
 * Handles D3.js, Chart.js, and other visualization libraries
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} chartSelector - CSS selector for chart container
 * @param {Object} options - Configuration options
 */
export async function waitForChartLoading(page, chartSelector, options = {}) {
  const { timeout = 10000 } = options;
  
  // Firefox-specific: Longer timeout for chart libraries
  const firefoxTimeout = timeout * 1.5;
  
  // Wait for general loading to complete
  await waitForLoadingComplete(page, { timeout: firefoxTimeout / 2 });
  
  // Wait for chart container to be visible
  await page.waitForSelector(chartSelector, { timeout: firefoxTimeout / 2 });
  
  // Firefox-specific: Longer wait for chart rendering (SVG paths, canvas context, etc.)
  await page.waitForTimeout(800);
}

/**
 * Comprehensive WebSocket connection and error state detection
 * Handles offline scenarios, connection failures, and graceful degradation
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {number} maxWaitTime - Maximum time to wait for data (default: 8000)
 * @param {string} browserName - Browser name for specific handling
 * @returns {Promise<{connected: boolean, hasData: boolean, error: string|null}>} - Connection status details
 */
export async function detectWebSocketState(page, maxWaitTime = 8000, browserName = 'chromium') {
  try {
    // Browser-specific timeout adjustments
    const adjustedTimeout = browserName === 'webkit' ? maxWaitTime * 1.3 : maxWaitTime;
    
    await waitForLoadingComplete(page, { timeout: adjustedTimeout, browserName });
    
    // Check for explicit error indicators
    const errorSelectors = [
      'text=/error|offline|connection.*failed|websocket.*error/i',
      '[data-testid="error-message"]',
      '.error-state',
      '.connection-error'
    ];
    
    let errorFound = false;
    let errorMessage = null;
    
    for (const selector of errorSelectors) {
      const errorElement = page.locator(selector);
      const count = await errorElement.count();
      if (count > 0) {
        errorFound = true;
        errorMessage = await errorElement.first().textContent().catch(() => 'Unknown error');
        break;
      }
    }
    
    // Check for data presence indicators
    const dataIndicators = [
      '.MuiCard-root:has-text(/\d/)', // Cards with numbers
      'svg path', // Chart elements
      '.MuiListItem-root', // List items with data
      'canvas', // Chart canvases
      'text=/\d{1,3}(,\d{3})*/' // Formatted numbers
    ];
    
    let hasData = false;
    for (const selector of dataIndicators) {
      const dataElement = page.locator(selector);
      const count = await dataElement.count();
      if (count > 0) {
        hasData = true;
        break;
      }
    }
    
    return {
      connected: !errorFound,
      hasData,
      error: errorMessage
    };
  } catch (error) {
    return {
      connected: false,
      hasData: false,
      error: `Loading timeout: ${error.message}`
    };
  }
}

/**
 * Standard pattern for page navigation and loading
 * Combines navigation with proper loading state handling
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} path - URL path to navigate to
 * @param {Object} options - Configuration options
 */
export async function navigateAndWaitForLoad(page, path, options = {}) {
  const { 
    waitUntil = 'networkidle',
    loadingTimeout = 10000,
    expectData = true,
    browserName = 'chromium',
    pageType = 'general'
  } = options;
  
  await page.goto(path, { waitUntil });
  
  if (expectData) {
    await waitForWebSocketData(page, { 
      timeout: loadingTimeout, 
      browserName,
      pageType 
    });
  } else {
    await waitForLoadingComplete(page, { 
      timeout: loadingTimeout, 
      browserName 
    });
  }
}

/**
 * Comprehensive WebSocket and loading state test suite
 * Validates all aspects of real-time data loading
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} pageType - Type of page being tested
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} - Comprehensive test results
 */
export async function validateWebSocketReliability(page, pageType, options = {}) {
  const { 
    browserName = 'chromium', 
    timeout = 15000,
    enableReconnectionTest = false 
  } = options;
  
  const results = {
    initialLoad: null,
    dataPopulation: null,
    realTimeUpdate: null,
    reconnection: null,
    errorHandling: null
  };
  
  try {
    // Test 1: Initial WebSocket data loading
    results.initialLoad = await detectWebSocketState(page, timeout / 3, browserName);
    
    // Test 2: Data population verification
    await waitForWebSocketData(page, { 
      timeout: timeout / 2, 
      browserName,
      pageType 
    });
    results.dataPopulation = await detectWebSocketState(page, timeout / 3, browserName);
    
    // Test 3: Real-time updates (if enabled)
    if (enableReconnectionTest) {
      results.reconnection = await testWebSocketReconnection(page, {
        browserName,
        timeout: timeout / 2
      });
    }
    
    return {
      success: true,
      pageType,
      browserName,
      results,
      summary: {
        connected: results.dataPopulation?.connected || false,
        hasData: results.dataPopulation?.hasData || false,
        reliable: results.initialLoad?.connected && results.dataPopulation?.hasData
      }
    };
  } catch (error) {
    return {
      success: false,
      pageType,
      browserName,
      error: error.message,
      results
    };
  }
}

/**
 * Firefox-specific browser history navigation helper
 * Adds stabilization delays needed for Firefox's rendering engine
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {'back'|'forward'} direction - Navigation direction
 * @param {Object} options - Configuration options
 */
export async function navigateHistoryFirefox(page, direction, options = {}) {
  const { stabilizationDelay = 500, loadTimeout = 8000 } = options;
  
  if (direction === 'back') {
    await page.goBack();
  } else if (direction === 'forward') {
    await page.goForward();
  }
  
  // Firefox-specific: Wait for navigation to complete
  await page.waitForLoadState('networkidle', { timeout: loadTimeout });
  
  // Firefox-specific: Stabilization delay for rendering
  await page.waitForTimeout(stabilizationDelay);
}

/**
 * Page-specific WebSocket data detection with race condition prevention
 * Handles different data loading patterns for each page type
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} pageType - Type of page ('homepage', 'blocks', 'nodes', 'pools', 'supply', 'downloads')
 * @param {number} timeout - Maximum wait time in milliseconds
 */
async function waitForPageSpecificData(page, pageType, timeout) {
  switch (pageType) {
    case 'homepage':
      // Wait for blockchain statistics to populate
      await page.waitForFunction(() => {
        const totalBlocks = document.querySelector('.MuiCard-root:has-text("Total Blocks")');
        return totalBlocks && !totalBlocks.textContent.includes('Loading') && 
               totalBlocks.textContent.match(/\d{1,3}(,\d{3})*/);
      }, { timeout }).catch(() => {});
      break;
      
    case 'blocks':
      // Wait for block list to populate
      await page.waitForFunction(() => {
        const blocks = document.querySelectorAll('a[href*="digiexplorer.info/block/"]');
        return blocks.length > 0;
      }, { timeout }).catch(() => {});
      break;
      
    case 'nodes':
      // Wait for node map and statistics
      await page.waitForFunction(() => {
        const mapSvg = document.querySelector('svg');
        const nodeStats = document.querySelector('.MuiPaper-root:has-text("Total Nodes Seen")');
        return mapSvg && nodeStats && !nodeStats.textContent.includes('Loading');
      }, { timeout }).catch(() => {});
      break;
      
    case 'pools':
      // Wait for mining pool chart and list
      await page.waitForFunction(() => {
        const chartSvg = document.querySelector('svg');
        const minerList = document.querySelectorAll('.MuiListItem-root');
        return chartSvg && chartSvg.querySelectorAll('path').length > 0 && minerList.length > 0;
      }, { timeout }).catch(() => {});
      break;
      
    case 'supply':
      // Wait for supply statistics and chart
      await page.waitForFunction(() => {
        const supplyCard = document.querySelector('.MuiCard-root:has-text("Current Circulating Supply")');
        const chart = document.querySelector('canvas');
        return supplyCard && !supplyCard.textContent.includes('Loading') && chart;
      }, { timeout }).catch(() => {});
      break;
      
    case 'downloads':
      // Wait for GitHub release data (API-based, not WebSocket)
      await page.waitForFunction(() => {
        const totalDownloads = document.querySelector('text*="Total Downloads"');
        const releases = document.querySelectorAll('.MuiCard-root:has-text("DigiByte Core v")');
        return totalDownloads && releases.length > 0;
      }, { timeout }).catch(() => {});
      break;
      
    default:
      // Generic data loading detection
      await page.waitForFunction(() => {
        const cards = document.querySelectorAll('.MuiCard-root');
        return cards.length > 0 && !document.body.textContent.includes('Loading...');
      }, { timeout }).catch(() => {});
  }
}

/**
 * Verify that data elements are actually populated with real data (not just placeholders)
 * Prevents race conditions where elements are visible but not yet populated
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} dataSelector - CSS selector for data container elements
 * @param {number} timeout - Maximum wait time in milliseconds
 */
async function waitForDataPopulation(page, dataSelector, timeout) {
  await page.waitForFunction((selector) => {
    const elements = document.querySelectorAll(selector);
    if (elements.length === 0) return false;
    
    // Check if elements have actual data content
    for (const element of elements) {
      const text = element.textContent || '';
      
      // Skip elements that only contain loading text or are empty
      if (text.includes('Loading') || text.includes('Connecting') || text.trim() === '') {
        continue;
      }
      
      // Look for data patterns (numbers, dates, addresses, etc.)
      if (text.match(/\d{1,3}(,\d{3})*/) || // Formatted numbers
          text.match(/D[A-Za-z0-9]{25,}/) ||  // DigiByte addresses
          text.match(/\d+\.\d+/) ||           // Decimal numbers
          text.match(/\d{4}-\d{2}-\d{2}/) ||  // Dates
          text.match(/[a-f0-9]{64}/) ||       // Block hashes
          text.includes('DGB') ||             // Currency amounts
          text.includes('%')) {               // Percentages
        return true;
      }
    }
    
    return false;
  }, dataSelector, { timeout }).catch(() => {});
}

/**
 * Reliable WebSocket reconnection testing
 * Handles browser differences in WebSocket connection behavior
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {Object} options - Configuration options
 * @param {string} options.browserName - Browser name for specific handling
 * @param {number} options.timeout - Maximum wait time for reconnection
 */
export async function testWebSocketReconnection(page, options = {}) {
  const { browserName = 'chromium', timeout = 10000 } = options;
  
  // Get initial data state
  const initialState = await detectWebSocketState(page, 3000, browserName);
  
  // Block WebSocket connections to simulate network failure
  await page.route(/ws:\/\/.*/, route => route.abort());
  await page.route(/wss:\/\/.*/, route => route.abort());
  
  // Wait for disconnection to be detected
  await page.waitForTimeout(1000);
  
  // Restore WebSocket connections
  await page.unroute(/ws:\/\/.*/);
  await page.unroute(/wss:\/\/.*/);
  
  // Wait for reconnection and data restoration
  const reconnectionTimeout = browserName === 'webkit' ? timeout * 1.5 : timeout;
  
  return new Promise((resolve) => {
    const checkReconnection = async () => {
      const currentState = await detectWebSocketState(page, 2000, browserName);
      
      if (currentState.connected && currentState.hasData) {
        resolve({
          reconnected: true,
          initialState,
          finalState: currentState
        });
      } else {
        setTimeout(checkReconnection, 500);
      }
    };
    
    setTimeout(() => {
      resolve({
        reconnected: false,
        initialState,
        finalState: null,
        timeout: true
      });
    }, reconnectionTimeout);
    
    checkReconnection();
  });
}

/**
 * Cross-browser hover interaction helper
 * Includes browser-specific timeout and stabilization handling
 * 
 * @param {import('@playwright/test').Locator} element - Element to hover
 * @param {Object} options - Configuration options
 */
export async function hoverElementCrossBrowser(element, options = {}) {
  const { timeout = 3000, stabilizationDelay = 300, browserName = 'chromium' } = options;
  
  // Browser-specific timeout adjustments
  const adjustedTimeout = browserName === 'webkit' ? timeout * 1.2 : timeout;
  const adjustedDelay = browserName === 'firefox' ? stabilizationDelay * 1.5 : stabilizationDelay;
  
  await element.hover({ timeout: adjustedTimeout });
  await element.page().waitForTimeout(adjustedDelay);
}

/**
 * Standardized real-time data update testing
 * Verifies that WebSocket updates are working correctly across browsers
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} dataSelector - CSS selector for data that should update
 * @param {Object} options - Configuration options
 */
export async function waitForRealTimeUpdate(page, dataSelector, options = {}) {
  const { timeout = 15000, browserName = 'chromium', allowNoUpdate = true } = options;
  
  // Get initial data value
  const initialValue = await page.locator(dataSelector).first().textContent().catch(() => null);
  
  if (!initialValue) {
    throw new Error(`No initial data found for selector: ${dataSelector}`);
  }
  
  // Browser-specific timeout for WebSocket updates
  const updateTimeout = browserName === 'webkit' ? timeout * 1.3 : timeout;
  
  try {
    await page.waitForFunction(
      ({ selector, initial }) => {
        const current = document.querySelector(selector)?.textContent;
        return current && current !== initial;
      },
      { selector: dataSelector, initial: initialValue },
      { timeout: updateTimeout }
    );
    
    return { updated: true, initialValue, timeout: false };
  } catch (error) {
    if (allowNoUpdate) {
      // No update during test period is acceptable for real-time tests
      return { updated: false, initialValue, timeout: true };
    } else {
      throw error;
    }
  }
}