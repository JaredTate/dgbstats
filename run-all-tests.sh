#!/bin/bash

# DigiByte Stats - Run All Tests Script
# This script runs all tests and generates a comprehensive report

echo "🧪 DigiByte Stats - Comprehensive Test Suite"
echo "==========================================="
echo ""

# Check if dependencies are installed
echo "📦 Checking dependencies..."
if ! npm list vitest >/dev/null 2>&1; then
    echo "❌ Vitest not installed. Running npm install..."
    npm install
fi

if ! npm list @playwright/test >/dev/null 2>&1; then
    echo "❌ Playwright not installed. Running npm install..."
    npm install
fi

echo "✅ Dependencies verified"
echo ""

# Run unit and integration tests with coverage
echo "🔬 Running Unit & Integration Tests with Coverage..."
echo "---------------------------------------------------"
npm run test:coverage

# Check if tests passed
if [ $? -ne 0 ]; then
    echo "❌ Unit/Integration tests failed!"
    exit 1
fi

echo ""
echo "✅ Unit & Integration tests passed!"
echo ""

# Run E2E tests
echo "🌐 Running E2E Tests..."
echo "----------------------"
npm run test:e2e

# Check if E2E tests passed
if [ $? -ne 0 ]; then
    echo "❌ E2E tests failed!"
    exit 1
fi

echo ""
echo "✅ E2E tests passed!"
echo ""

# Generate reports
echo "📊 Test Summary"
echo "==============="
echo ""

# Show coverage summary
echo "📈 Coverage Report:"
echo "-------------------"
if [ -f coverage/coverage-summary.json ]; then
    node -e "
    const coverage = require('./coverage/coverage-summary.json');
    const total = coverage.total;
    console.log('  Statements: ' + total.statements.pct + '%');
    console.log('  Branches:   ' + total.branches.pct + '%');
    console.log('  Functions:  ' + total.functions.pct + '%');
    console.log('  Lines:      ' + total.lines.pct + '%');
    "
else
    echo "  Coverage report not found. Run 'npm run test:coverage' to generate."
fi

echo ""
echo "📄 Reports Generated:"
echo "--------------------"
echo "  - Coverage HTML: coverage/index.html"
echo "  - Playwright Report: playwright-report/index.html"
echo "  - Test Results: test-results/results.json"
echo ""

# Success message
echo "🎉 All tests passed successfully!"
echo ""
echo "📖 For more information, see:"
echo "  - Testing documentation: src/tests/README.md"
echo "  - Project documentation: CLAUDE.md"
echo ""

# Make script executable
chmod +x run-all-tests.sh