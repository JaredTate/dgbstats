const { test, expect } = require('@playwright/test');

test.describe('NodesPage Debug', () => {
  test('check SVG structure', async ({ page }) => {
    await page.goto('/nodes');
    
    // Wait for the map to load
    await page.waitForSelector('.map-container svg', { timeout: 10000 });
    
    // Log the SVG structure
    const svgStructure = await page.evaluate(() => {
      const svg = document.querySelector('.map-container svg');
      if (!svg) return 'No SVG found';
      
      const structure = {
        svgPresent: true,
        svgChildren: svg.children.length,
        svgHTML: svg.outerHTML.substring(0, 200),
        groups: []
      };
      
      // Get all direct children
      for (let i = 0; i < svg.children.length; i++) {
        const child = svg.children[i];
        structure.groups.push({
          tagName: child.tagName,
          className: child.className.baseVal || child.className,
          transform: child.getAttribute('transform'),
          childCount: child.children.length
        });
      }
      
      return structure;
    });
    
    console.log('SVG Structure:', JSON.stringify(svgStructure, null, 2));
    
    // Check for transform on the main group
    const transform = await page.evaluate(() => {
      const svg = document.querySelector('.map-container svg');
      if (!svg) return null;
      
      // Try to find the main group
      const g = svg.querySelector('g');
      if (!g) {
        // If no g element, check if elements are directly in svg
        return 'No g element found';
      }
      
      return g.getAttribute('transform');
    });
    
    console.log('Transform:', transform);
    
    // Take a screenshot
    await page.screenshot({ path: 'nodes-debug.png' });
  });
});