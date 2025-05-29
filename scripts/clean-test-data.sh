#!/bin/bash

# Clean Test Data Script
# Removes all test artifacts and generated files after test runs

echo "🧹 Cleaning up test data and artifacts..."

# Remove Playwright test results and reports
if [ -d "test-results" ]; then
    echo "  ├── Removing test-results/ directory..."
    rm -rf test-results
fi

if [ -d "playwright-report" ]; then
    echo "  ├── Removing playwright-report/ directory..."
    rm -rf playwright-report
fi

# Remove coverage reports
if [ -d "coverage" ]; then
    echo "  ├── Removing coverage/ directory..."
    rm -rf coverage
fi

# Remove other test artifacts
if [ -d ".nyc_output" ]; then
    echo "  ├── Removing .nyc_output/ directory..."
    rm -rf .nyc_output
fi

if [ -d "reports" ]; then
    echo "  ├── Removing reports/ directory..."
    rm -rf reports
fi

if [ -d "screenshots" ]; then
    echo "  ├── Removing screenshots/ directory..."
    rm -rf screenshots
fi

if [ -d "videos" ]; then
    echo "  ├── Removing videos/ directory..."
    rm -rf videos
fi

# Remove trace files
if ls *.trace.zip 1> /dev/null 2>&1; then
    echo "  ├── Removing trace files..."
    rm -f *.trace.zip
fi

# Remove lcov files
if ls *.lcov 1> /dev/null 2>&1; then
    echo "  ├── Removing lcov files..."
    rm -f *.lcov
fi

# Remove any temporary test files
if ls tmp-test-* 1> /dev/null 2>&1; then
    echo "  ├── Removing temporary test files..."
    rm -f tmp-test-*
fi

echo "✅ Test data cleanup complete!"

# Show remaining git status to confirm cleanup
echo ""
echo "📊 Current git status after cleanup:"
git status --porcelain | grep -E "(test-results|playwright-report|coverage)" || echo "  No test artifacts in git status ✅"