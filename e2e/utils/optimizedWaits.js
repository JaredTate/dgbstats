/**
 * Optimized wait utilities for E2E tests
 * These utilities replace long timeouts with smart element waits and progressive loading strategies
 */

/**
 * Wait for page to be ready with data loaded
 * @param {Page} page - Playwright page object
 * @param {Object} options - Configuration options
 */
export async function waitForPageReady(page, options = {}) {
  const {
    timeout = 5000,
    selector = 'h1, .MuiCard-root',
    loadingText = 'Loading...'
  } = options;

  // Wait for basic page structure
  await page.waitForSelector(selector, { timeout });

  // Check for and wait for loading states to complete
  const loadingIndicator = page.locator(`text=${loadingText}`);
  if (await loadingIndicator.isVisible().catch(() => false)) {
    await loadingIndicator.waitFor({ state: 'hidden', timeout });
  }
}

/**
 * Wait for WebSocket data to load
 * @param {Page} page - Playwright page object
 * @param {Object} options - Configuration options
 */
export async function waitForWebSocketData(page, options = {}) {
  const {
    timeout = 6000,
    dataSelector = '.MuiCard-root h4:not(:has-text("Loading..."))',
    fallbackSelector = '.MuiCard-root'
  } = options;

  try {
    // Wait for actual data to appear
    await page.waitForSelector(dataSelector, { timeout });
  } catch {
    // Fallback to basic structure
    await page.waitForSelector(fallbackSelector, { timeout: 2000 }).catch(() => {});
  }
}

/**
 * Wait for chart to render
 * @param {Page} page - Playwright page object
 * @param {Object} options - Configuration options
 */
export async function waitForChartRender(page, options = {}) {
  const {
    timeout = 4000,
    chartSelector = 'svg, canvas',
    minElements = 1
  } = options;

  await page.waitForFunction(
    ({ selector, minCount }) => {
      const elements = document.querySelectorAll(selector);
      return elements.length >= minCount;
    },
    { selector: chartSelector, minCount: minElements },
    { timeout }
  ).catch(() => {
    // Fallback to basic chart container
    return page.waitForSelector(chartSelector, { timeout: 2000 }).catch(() => {});
  });
}

/**
 * Wait for navigation to complete
 * @param {Page} page - Playwright page object
 * @param {Object} options - Configuration options
 */
export async function waitForNavigation(page, options = {}) {
  const {
    timeout = 3000,
    waitUntil = 'domcontentloaded'
  } = options;

  await page.waitForLoadState(waitUntil, { timeout }).catch(() => {});
}

/**
 * Wait for responsive layout to adapt
 * @param {Page} page - Playwright page object
 * @param {Object} options - Configuration options
 */
export async function waitForResponsiveLayout(page, options = {}) {
  const {
    timeout = 2000,
    expectedWidth = null
  } = options;

  if (expectedWidth) {
    await page.waitForFunction(
      (width) => window.innerWidth === width,
      expectedWidth,
      { timeout }
    ).catch(() => {});
  } else {
    // General layout stabilization wait
    await page.waitForLoadState('networkidle', { timeout }).catch(() => {});
  }
}

/**
 * Wait for mobile menu to open
 * @param {Page} page - Playwright page object
 * @param {Object} options - Configuration options
 */
export async function waitForMobileMenu(page, options = {}) {
  const {
    timeout = 2000,
    drawerSelector = '.MuiDrawer-root'
  } = options;

  await page.waitForSelector(drawerSelector, { timeout });
  
  // Wait for drawer animation to complete
  await page.waitForFunction(
    (selector) => {
      const drawer = document.querySelector(selector);
      return drawer && drawer.getAttribute('aria-hidden') === 'false';
    },
    drawerSelector,
    { timeout: 1000 }
  ).catch(() => {});
}

/**
 * Progressive loading strategy - try multiple wait conditions
 * @param {Page} page - Playwright page object
 * @param {Array} waitStrategies - Array of wait functions to try
 */
export async function progressiveWait(page, waitStrategies) {
  for (const strategy of waitStrategies) {
    try {
      await strategy(page);
      return; // Success, exit early
    } catch (error) {
      console.log(`Wait strategy failed: ${error.message}`);
      continue; // Try next strategy
    }
  }
  
  // All strategies failed, do basic wait
  await page.waitForTimeout(1000);
}