import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.js$/,
    exclude: []
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.js', './src/setupTests.js'],
    css: true,
    deps: {
      inline: ['vitest-canvas-mock'],
    },
    environmentOptions: {
      jsdom: {
        resources: 'usable',
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/tests/',
        'src/setupTests.js',
        'src/reportWebVitals.js',
        '**/*.test.js',
        '**/*.spec.js',
        'src/index.js',
        'src/logo.svg',
        'public/',
        'build/',
        '.eslintrc.js',
        'vitest.config.js',
        'playwright.config.js'
      ],
      statements: 95,
      branches: 95,
      functions: 95,
      lines: 95
    },
    exclude: ['**/node_modules/**', '**/dist/**', '**/cypress/**', '**/.{idea,git,cache,output,temp}/**', '**/e2e/**'],
    watchExclude: ['**/node_modules/**', '**/dist/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@tests': path.resolve(__dirname, './src/tests'),
    },
  },
});