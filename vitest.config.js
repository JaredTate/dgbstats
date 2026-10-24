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
    css: true,
    server: {
      deps: {
        inline: ['vitest-canvas-mock'],
      },
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
    // Two projects: the app tests run in jsdom with the DOM setup files; the
    // build tests (src/tests/build) run Vite itself, so they need plain Node.
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'jsdom',
          // Vitest 1.x default. Vitest 2+ switched to 'forks', which runs this
          // jsdom suite ~3x slower and causes 5s test timeouts.
          pool: 'threads',
          setupFiles: ['./src/tests/setup.js', './src/setupTests.js'],
          exclude: ['src/tests/build/**'],
          sequence: { groupOrder: 0 },
        },
      },
      {
        extends: true,
        test: {
          name: 'build',
          include: ['src/tests/build/**/*.test.js'],
          environment: 'node',
          testTimeout: 180000,
          hookTimeout: 180000,
          // Run after the unit project so the CPU-heavy build does not slow
          // the jsdom tests into timeouts.
          sequence: { groupOrder: 1 },
        },
      },
    ],
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