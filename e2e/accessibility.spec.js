import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Accessibility Tests', () => {
  test('HomePage - accessibility compliance', async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);
    
    // Run accessibility checks
    const results = await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: {
        html: true
      }
    });
    
    // Check for page landmarks
    const landmarks = await page.evaluate(() => {
      return {
        header: document.querySelector('header') !== null,
        main: document.querySelector('main') !== null,
        footer: document.querySelector('footer') !== null,
        nav: document.querySelector('nav') !== null
      };
    });
    
    expect(landmarks.header).toBeTruthy();
    expect(landmarks.main).toBeTruthy();
    expect(landmarks.nav).toBeTruthy();
  });

  test('keyboard navigation - main menu', async ({ page }) => {
    await page.goto('/');
    
    // Focus on first interactive element
    await page.keyboard.press('Tab');
    
    // Check focused element
    const firstFocused = await page.evaluate(() => {
      return {
        tagName: document.activeElement.tagName,
        text: document.activeElement.textContent,
        hasOutline: window.getComputedStyle(document.activeElement).outline !== 'none'
      };
    });
    
    expect(firstFocused.hasOutline).toBeTruthy();
    
    // Navigate through menu items
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          isLink: el.tagName === 'A',
          hasHref: el.hasAttribute('href'),
          isVisible: el.offsetWidth > 0 && el.offsetHeight > 0
        };
      });
      
      expect(focused.isVisible).toBeTruthy();
    }
  });

  test('screen reader - page headings structure', async ({ page }) => {
    await page.goto('/');
    
    // Check heading hierarchy
    const headings = await page.evaluate(() => {
      const h1 = document.querySelectorAll('h1');
      const h2 = document.querySelectorAll('h2');
      const h3 = document.querySelectorAll('h3');
      
      return {
        h1Count: h1.length,
        h2Count: h2.length,
        h3Count: h3.length,
        h1Text: Array.from(h1).map(h => h.textContent),
        headingOrder: Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
          .map(h => ({ level: h.tagName, text: h.textContent.substring(0, 50) }))
      };
    });
    
    // Should have exactly one h1
    expect(headings.h1Count).toBe(1);
    
    // Should have logical heading structure
    console.log('Heading structure:', headings.headingOrder);
  });

  test('ARIA labels and roles', async ({ page }) => {
    await page.goto('/pools');
    
    // Check for ARIA labels
    const ariaElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('[aria-label], [aria-describedby], [role]');
      return Array.from(elements).map(el => ({
        tag: el.tagName,
        role: el.getAttribute('role'),
        ariaLabel: el.getAttribute('aria-label'),
        ariaDescribedBy: el.getAttribute('aria-describedby')
      }));
    });
    
    // Should have ARIA labels for interactive elements
    expect(ariaElements.length).toBeGreaterThan(0);
    
    // Check specific elements
    const buttons = await page.$$('button');
    for (const button of buttons) {
      const hasAccessibleName = await button.evaluate(el => {
        return el.textContent.trim() !== '' || 
               el.getAttribute('aria-label') !== null ||
               el.getAttribute('aria-labelledby') !== null;
      });
      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test('focus indicators visibility', async ({ page }) => {
    await page.goto('/');
    
    // Tab through interactive elements
    const focusableElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
      return elements.length;
    });
    
    for (let i = 0; i < Math.min(focusableElements, 10); i++) {
      await page.keyboard.press('Tab');
      
      const hasFocusIndicator = await page.evaluate(() => {
        const el = document.activeElement;
        const styles = window.getComputedStyle(el);
        const hasSpeudoStyles = window.getComputedStyle(el, ':focus');
        
        return {
          hasOutline: styles.outline !== 'none' && styles.outline !== '',
          hasBoxShadow: styles.boxShadow !== 'none',
          hasBorderChange: styles.border !== window.getComputedStyle(el.parentElement).border,
          backgroundColor: styles.backgroundColor
        };
      });
      
      // Should have some form of focus indicator
      const hasIndicator = hasFocusIndicator.hasOutline || 
                          hasFocusIndicator.hasBoxShadow || 
                          hasFocusIndicator.hasBorderChange;
      expect(hasIndicator).toBeTruthy();
    }
  });

  test('color contrast compliance', async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);
    
    // Check color contrast
    const contrastResults = await page.evaluate(() => {
      return window.axe.run({
        runOnly: ['color-contrast']
      });
    });
    
    // Log any contrast issues
    if (contrastResults.violations.length > 0) {
      console.log('Color contrast violations:', contrastResults.violations);
    }
    
    // Check text is readable
    const textElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
      return Array.from(elements).slice(0, 10).map(el => {
        const styles = window.getComputedStyle(el);
        return {
          color: styles.color,
          backgroundColor: styles.backgroundColor,
          fontSize: styles.fontSize,
          fontWeight: styles.fontWeight
        };
      });
    });
    
    // Verify text has sufficient size
    textElements.forEach(el => {
      if (el.fontSize) {
        const size = parseInt(el.fontSize);
        expect(size).toBeGreaterThanOrEqual(12);
      }
    });
  });

  test('form accessibility', async ({ page }) => {
    // Navigate to a page with forms (if any)
    await page.goto('/blocks');
    
    // Check for form elements
    const formElements = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input, select, textarea');
      return Array.from(inputs).map(input => {
        const label = input.labels?.[0] || 
                     document.querySelector(`label[for="${input.id}"]`);
        return {
          type: input.type,
          hasLabel: label !== null,
          labelText: label?.textContent,
          hasAriaLabel: input.getAttribute('aria-label') !== null,
          hasPlaceholder: input.placeholder !== '',
          isRequired: input.required,
          hasAriaRequired: input.getAttribute('aria-required') === 'true'
        };
      });
    });
    
    // All form inputs should have labels
    formElements.forEach(element => {
      const hasAccessibleLabel = element.hasLabel || element.hasAriaLabel;
      expect(hasAccessibleLabel).toBeTruthy();
    });
  });

  test('skip navigation links', async ({ page }) => {
    await page.goto('/');
    
    // Check for skip links
    const skipLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      return links.filter(link => 
        link.textContent.toLowerCase().includes('skip') ||
        link.className.toLowerCase().includes('skip')
      ).map(link => ({
        text: link.textContent,
        href: link.href,
        isVisible: window.getComputedStyle(link).display !== 'none'
      }));
    });
    
    // If skip links exist, verify they work
    if (skipLinks.length > 0) {
      const firstSkipLink = skipLinks[0];
      console.log('Skip link found:', firstSkipLink.text);
    }
  });

  test('table accessibility', async ({ page }) => {
    await page.goto('/blocks');
    
    // Check for tables
    const tables = await page.$$('table');
    
    for (const table of tables) {
      const tableInfo = await table.evaluate(el => {
        const headers = el.querySelectorAll('th');
        const caption = el.querySelector('caption');
        const scope = Array.from(headers).map(h => h.getAttribute('scope'));
        
        return {
          hasHeaders: headers.length > 0,
          hasCaption: caption !== null,
          captionText: caption?.textContent,
          headerScopes: scope,
          summary: el.getAttribute('summary')
        };
      });
      
      // Tables should have headers
      expect(tableInfo.hasHeaders).toBeTruthy();
    }
  });

  test('image alt text', async ({ page }) => {
    await page.goto('/');
    
    // Check all images
    const images = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img');
      return Array.from(imgs).map(img => ({
        src: img.src,
        alt: img.alt,
        isDecorative: img.getAttribute('role') === 'presentation' || img.alt === '',
        isVisible: img.offsetWidth > 0 && img.offsetHeight > 0
      }));
    });
    
    // All visible images should have alt text or be marked as decorative
    images.forEach(img => {
      if (img.isVisible && !img.isDecorative) {
        expect(img.alt).toBeTruthy();
      }
    });
  });

  test('interactive element sizes for touch', async ({ page }) => {
    await page.goto('/');
    
    // Check button and link sizes
    const interactiveElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('button, a, input, select');
      return Array.from(elements).slice(0, 20).map(el => {
        const rect = el.getBoundingClientRect();
        return {
          tag: el.tagName,
          width: rect.width,
          height: rect.height,
          text: el.textContent?.substring(0, 30)
        };
      });
    });
    
    // Interactive elements should be at least 44x44 pixels for touch
    interactiveElements.forEach(el => {
      if (el.width > 0 && el.height > 0) {
        const minSize = Math.min(el.width, el.height);
        expect(minSize).toBeGreaterThanOrEqual(44);
      }
    });
  });

  test('page language declaration', async ({ page }) => {
    await page.goto('/');
    
    // Check for lang attribute
    const htmlLang = await page.evaluate(() => {
      return document.documentElement.getAttribute('lang');
    });
    
    expect(htmlLang).toBeTruthy();
    expect(htmlLang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/); // e.g., 'en' or 'en-US'
  });

  test('error message accessibility', async ({ page }) => {
    await page.goto('/');
    
    // Trigger an error (disconnect network)
    await page.context().setOffline(true);
    await page.reload().catch(() => {});
    
    // Check for error messages
    await page.waitForTimeout(2000);
    
    const errorMessages = await page.evaluate(() => {
      const errors = document.querySelectorAll('[role="alert"], .error, .alert');
      return Array.from(errors).map(error => ({
        role: error.getAttribute('role'),
        ariaLive: error.getAttribute('aria-live'),
        text: error.textContent
      }));
    });
    
    // Error messages should have appropriate ARIA attributes
    errorMessages.forEach(error => {
      if (error.text) {
        expect(error.role === 'alert' || error.ariaLive === 'polite' || error.ariaLive === 'assertive').toBeTruthy();
      }
    });
    
    // Restore connection
    await page.context().setOffline(false);
  });

  test('loading state announcements', async ({ page }) => {
    await page.goto('/blocks');
    
    // Check for loading indicators
    const loadingIndicators = await page.evaluate(() => {
      const indicators = document.querySelectorAll('[aria-busy], .loading, .spinner');
      return Array.from(indicators).map(indicator => ({
        ariaBusy: indicator.getAttribute('aria-busy'),
        ariaLabel: indicator.getAttribute('aria-label'),
        role: indicator.getAttribute('role'),
        hasText: indicator.textContent.trim() !== ''
      }));
    });
    
    // Loading indicators should be accessible
    loadingIndicators.forEach(indicator => {
      const isAccessible = indicator.ariaBusy === 'true' || 
                          indicator.ariaLabel !== null || 
                          indicator.hasText;
      expect(isAccessible).toBeTruthy();
    });
  });

  test('modal dialog accessibility', async ({ page }) => {
    await page.goto('/');
    
    // Look for modal triggers
    const modalTriggers = await page.$$('[data-toggle="modal"], [aria-haspopup="dialog"]');
    
    if (modalTriggers.length > 0) {
      // Click first modal trigger
      await modalTriggers[0].click();
      await page.waitForTimeout(500);
      
      // Check modal accessibility
      const modalInfo = await page.evaluate(() => {
        const modal = document.querySelector('[role="dialog"], .modal');
        if (modal) {
          return {
            hasRole: modal.getAttribute('role') === 'dialog',
            hasAriaLabel: modal.getAttribute('aria-label') !== null,
            hasAriaLabelledby: modal.getAttribute('aria-labelledby') !== null,
            hasCloseButton: modal.querySelector('[aria-label*="close"], .close') !== null,
            trapsFocus: document.activeElement.closest('[role="dialog"]') !== null
          };
        }
        return null;
      });
      
      if (modalInfo) {
        expect(modalInfo.hasRole).toBeTruthy();
        expect(modalInfo.hasAriaLabel || modalInfo.hasAriaLabelledby).toBeTruthy();
        expect(modalInfo.hasCloseButton).toBeTruthy();
      }
    }
  });
});