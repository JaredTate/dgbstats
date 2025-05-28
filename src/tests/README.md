# DigiByte Stats - Testing Documentation

## Overview

This project uses a comprehensive testing strategy with three levels of testing:
- **Unit Tests** - Test individual components and functions in isolation
- **Integration Tests** - Test component interactions and data flow
- **E2E Tests** - Test complete user workflows across the application

### Testing Stack
- **Vitest** - Fast unit and integration testing framework
- **React Testing Library** - Component testing utilities
- **Playwright** - End-to-end testing across browsers
- **MSW (Mock Service Worker)** - API and WebSocket mocking
- **Coverage** - Code coverage reporting with c8/v8

## Quick Start

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
# Run all unit and integration tests
npm test

# Run all tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run everything
npm run test:all
```

## Test Commands

### Unit & Integration Tests (Vitest)

```bash
# Run tests in watch mode (development)
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test HomePage.test.js

# Run tests matching pattern
npm test -- --grep "WebSocket"
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI mode
npm run test:e2e:ui

# Run specific test file
npx playwright test homepage.spec.js

# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run mobile tests only
npx playwright test mobile.spec.js

# Debug mode
npx playwright test --debug

# Generate test report
npx playwright show-report
```

### Coverage Reports

After running tests with coverage, view the HTML report:
```bash
# Generate coverage report
npm run test:coverage

# Open coverage report (macOS)
open coverage/index.html

# Open coverage report (Windows)
start coverage/index.html

# Open coverage report (Linux)
xdg-open coverage/index.html
```

## Test Structure

```
src/tests/
├── unit/
│   └── pages/
│       ├── HomePage.test.js
│       ├── NodesPage.test.js
│       ├── PoolsPage.test.js
│       ├── SupplyPage.test.js
│       ├── HashratePage.test.js
│       ├── DownloadsPage.test.js
│       ├── DifficultiesPage.test.js
│       ├── BlocksPage.test.js
│       ├── AlgosPage.test.js
│       └── TaprootPage.test.js
├── integration/
│   ├── App.integration.test.js
│   └── pages/
│       └── PageIntegration.test.js
├── mocks/
│   ├── server.js         # MSW server setup
│   ├── handlers.js       # API mock handlers
│   └── mockData.js       # Mock data fixtures
├── utils/
│   └── testUtils.js      # Testing utilities
└── setup.js             # Test environment setup

e2e/
├── navigation.spec.js    # Navigation tests
├── homepage.spec.js      # Homepage tests
├── nodes.spec.js         # Nodes page tests
├── pools.spec.js         # Pools page tests
├── supply.spec.js        # Supply page tests
├── blocks.spec.js        # Blocks page tests
├── mobile.spec.js        # Mobile responsiveness
├── performance.spec.js   # Performance tests
└── accessibility.spec.js # Accessibility tests
```

## Writing Tests

### Unit Test Example

```javascript
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import HomePage from '../../../pages/HomePage';
import { renderWithProviders, createWebSocketMock } from '../../utils/testUtils';

describe('HomePage', () => {
  it('should display blockchain statistics', async () => {
    // Setup WebSocket mock
    const { MockWebSocket, instances } = createWebSocketMock();
    global.WebSocket = MockWebSocket;
    
    // Render component
    renderWithProviders(<HomePage />);
    
    // Send mock data
    instances[0].receiveMessage({
      type: 'homepage',
      data: { blocks: { height: 12345678 } }
    });
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText('12,345,678')).toBeInTheDocument();
    });
  });
});
```

### Integration Test Example

```javascript
describe('Page Navigation', () => {
  it('should maintain WebSocket connections across navigation', async () => {
    renderWithProviders(<App />);
    
    // Navigate to different page
    fireEvent.click(screen.getByText('Nodes'));
    
    // Verify new WebSocket connection
    expect(webSocketInstances.length).toBe(2);
    expect(webSocketInstances[0].readyState).toBe(WebSocket.CLOSED);
    expect(webSocketInstances[1].readyState).toBe(WebSocket.OPEN);
  });
});
```

### E2E Test Example

```javascript
import { test, expect } from '@playwright/test';

test('should navigate between pages', async ({ page }) => {
  await page.goto('/');
  
  // Click navigation link
  await page.click('text=Nodes');
  
  // Verify navigation
  await expect(page.locator('h1')).toContainText('DigiByte Network Nodes');
  await expect(page.url()).toContain('/nodes');
});
```

## Testing Best Practices

### 1. Test Organization
- Group related tests using `describe` blocks
- Use descriptive test names that explain what is being tested
- Follow the AAA pattern: Arrange, Act, Assert

### 2. Mocking
- Mock external dependencies (WebSocket, APIs, timers)
- Use MSW for consistent API mocking
- Create reusable mock utilities

### 3. Assertions
- Test user-visible behavior, not implementation details
- Use semantic queries (getByRole, getByLabelText)
- Wait for async operations with `waitFor`

### 4. Performance
- Run tests in parallel when possible
- Use `test.only` sparingly during development
- Clean up after tests (close connections, clear timers)

### 5. Accessibility
- Test keyboard navigation
- Verify ARIA attributes
- Check color contrast and focus indicators

## Debugging Tests

### Vitest Debugging

```bash
# Run in debug mode
node --inspect-brk ./node_modules/.bin/vitest

# Use console.log in tests
console.log(screen.debug());

# Take DOM snapshots
expect(container).toMatchSnapshot();
```

### Playwright Debugging

```bash
# Debug mode with inspector
npx playwright test --debug

# Headed mode (see browser)
npx playwright test --headed

# Slow motion
npx playwright test --headed --slow-mo=1000

# Save trace on failure
npx playwright test --trace on
```

## Coverage Goals

The project maintains strict coverage requirements:
- **Statements**: 95%
- **Branches**: 95%
- **Functions**: 95%
- **Lines**: 95%

View current coverage:
```bash
npm run test:coverage
```

## Continuous Integration

Tests run automatically on:
- Pull request creation
- Commits to main branch
- Scheduled daily runs

### CI Configuration
- Unit/Integration tests run first (fast feedback)
- E2E tests run on multiple browsers
- Coverage reports are generated and archived
- Failed tests block deployment

## Common Issues and Solutions

### Issue: WebSocket Mock Not Working
**Solution**: Ensure WebSocket is mocked before component render
```javascript
beforeEach(() => {
  const { MockWebSocket } = createWebSocketMock();
  global.WebSocket = MockWebSocket;
});
```

### Issue: Chart.js Canvas Errors
**Solution**: Mock canvas context in setup
```javascript
HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation(() => ({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  // ... other canvas methods
}));
```

### Issue: Flaky E2E Tests
**Solution**: Use proper wait strategies
```javascript
// Bad
await page.waitForTimeout(5000);

// Good
await page.waitForSelector('.data-loaded');
await expect(page.locator('.value')).toBeVisible();
```

### Issue: Tests Timeout
**Solution**: Increase timeout for specific tests
```javascript
test('slow operation', async () => {
  // Increase timeout to 30 seconds
  test.setTimeout(30000);
  // ... test code
});
```

## Test Data Management

### Mock Data Location
All mock data is centralized in `src/tests/mocks/mockData.js`

### Updating Mock Data
1. Update data in `mockData.js`
2. Ensure consistency across related data
3. Update relevant tests if structure changes

### WebSocket Message Simulation
```javascript
// Generate consistent WebSocket messages
const message = generateWebSocketMessage('homepage');
ws.receiveMessage(message);
```

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all tests pass
3. Maintain or improve coverage
4. Update mock data if needed
5. Add E2E tests for user workflows

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)
- [Testing Best Practices](https://testingjavascript.com/)