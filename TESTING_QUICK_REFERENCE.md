# Testing Quick Reference Guide

## 🚀 Essential Commands

### Unit & Integration Tests (Vitest)
```bash
npm test                    # Watch mode for development
npm run test:run           # Single run for CI/CD
npm run test:coverage      # Generate coverage report
npm run test:ui            # Visual test interface
```

### End-to-End Tests (Playwright)
```bash
npm run test:e2e           # All browsers (1,112 tests)
npm run test:e2e:ui        # Visual E2E interface
npm run test:all           # Everything (unit + E2E)
```

### Combined Test Execution
```bash
npm run test:all           # Run unit tests + E2E tests
```

## 🎯 Targeted Testing

### Run Specific Test Files
```bash
# Unit tests
npm test HomePage.test.js
npm test -- --grep "WebSocket"

# E2E tests
npx playwright test homepage.spec.js
npx playwright test mobile.spec.js
npx playwright test accessibility.spec.js
```

### Browser-Specific E2E Testing
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"
npx playwright test --project="Microsoft Edge"
```

## 🔍 Debugging & Analysis

### Unit Test Debugging
```bash
npm test -- --reporter=verbose
npm test -- --coverage
console.log(screen.debug())  # In test files
```

### E2E Test Debugging
```bash
npx playwright test --debug              # Interactive debugging
npx playwright test --headed             # Watch in browser
npx playwright test --trace on           # Record execution trace
npx playwright test --slow-mo=1000       # Slow motion execution
```

### Test Reports & Analysis
```bash
npx playwright show-report              # View HTML report
open coverage/index.html                # View coverage report
npx playwright test --reporter=json     # JSON output for CI
```

## 📊 Test Categories

### Core Functionality (1,326 total tests)
- **Unit Tests**: 214 tests (100% pass rate)
- **Integration Tests**: 15 tests (100% pass rate)
- **E2E Tests**: 1,112 tests (95.8% pass rate)

### Test Types
```bash
# Accessibility compliance
npx playwright test accessibility.spec.js

# Performance benchmarks
npx playwright test performance.spec.js

# Mobile responsiveness
npx playwright test mobile*.spec.js

# Cross-browser compatibility
npx playwright test browser-compatibility.spec.js

# Real-time features
npx playwright test -- --grep "WebSocket"

# Chart visualizations
npx playwright test -- --grep "chart"
```

## 🌐 Browser Coverage

### Desktop Browsers
- **Chrome** (chromium) - Primary development target
- **Firefox** (firefox) - Gecko engine testing
- **Safari** (webkit) - WebKit compatibility
- **Edge** (Microsoft Edge) - Chromium-based testing

### Mobile Browsers  
- **Mobile Chrome** - Android touch testing
- **Mobile Safari** - iOS WebKit testing
- **Mobile Safari Legacy** - Backward compatibility

## ⚡ Performance Metrics

### Current Test Performance
- **Unit Tests**: <10 seconds execution
- **E2E Tests**: 5-8 minutes full suite
- **Mobile Suite**: 10.1 seconds (95% faster than before)
- **Coverage Generation**: ~30 seconds

### Quality Standards
- **Unit Test Coverage**: 95%+ (statements, branches, functions, lines)
- **E2E Pass Rate**: 95.8% across all browsers
- **Zero Skipped Tests**: 100% execution requirement
- **Performance Budget**: <5s page load times

## 🛠️ Development Workflow

### Test-First Development (TDD)
```bash
# 1. Write failing test
touch src/tests/unit/pages/NewFeature.test.js
npm test NewFeature.test.js

# 2. Implement minimal code
# Edit src/pages/NewFeature.js

# 3. Make tests pass
npm test NewFeature.test.js

# 4. Refactor & verify coverage
npm run test:coverage
```

### Adding E2E Tests
```bash
# 1. Create E2E test file
touch e2e/new-feature.spec.js

# 2. Test across browsers
npx playwright test new-feature.spec.js

# 3. Verify mobile compatibility
npx playwright test new-feature.spec.js --project="Mobile Chrome"

# 4. Check accessibility
npx playwright test accessibility.spec.js
```

## 🚨 Common Issues & Quick Fixes

### WebSocket Tests Failing
```bash
# Check WebSocket mock setup
grep -r "createWebSocketMock" src/tests/

# Verify WebSocket connection in browser
npx playwright test --headed --grep "WebSocket"
```

### Chart Tests Timing Out
```bash
# Run with extended timeout
npx playwright test --timeout=30000 --grep "chart"

# Debug chart rendering
npx playwright test --debug pools.spec.js
```

### Mobile Tests Flaky
```bash
# Run mobile tests with debugging
npx playwright test --project="Mobile Chrome" --headed

# Check viewport setup
npx playwright test mobile.spec.js --trace on
```

### Coverage Below 95%
```bash
# Generate detailed coverage report
npm run test:coverage

# View coverage in browser
open coverage/index.html

# Check uncovered lines
npm run test:coverage -- --reporter=lcov
```

## 📚 Documentation Links

### Quick Access
- **[Unit Tests README](src/tests/README.md)** - Comprehensive testing guide
- **[E2E Tests README](e2e/README.md)** - Playwright documentation
- **[Main README](README.md)** - Project overview with testing section
- **[CLAUDE.md](CLAUDE.md)** - Complete testing campaign history

### External Resources
- **[Vitest Docs](https://vitest.dev/)** - Unit testing framework
- **[Playwright Docs](https://playwright.dev/)** - E2E testing
- **[React Testing Library](https://testing-library.com/)** - Component testing
- **[WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)** - Accessibility

---

**💡 Pro Tip**: Use `npm run test:all` for complete validation before commits, and `npm test` for rapid development feedback loops.**