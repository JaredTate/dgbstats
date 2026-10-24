/**
 * Vite build config. Replaces Create React App (react-scripts), which is
 * end-of-life and pulled in most of the npm audit high/critical findings.
 *
 * It keeps the CRA behaviour the Box 2 deploy (deploy-frontend.sh) and nginx
 * depend on:
 *  - output folder: $BUILD_PATH, default `build/`
 *  - bundles under `static/` (nginx caches /static/ as immutable)
 *  - entry bundle named `static/js/main.<8 hex>.js` (deploy health check
 *    greps `main\.[a-f0-9]*\.js`)
 *  - REACT_APP_* variables (shell env or .env files such as
 *    .env.production.local) reach the app as `process.env.REACT_APP_*`
 *  - dev server on port 3005
 */
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Build the `define` map that gives the app a CRA-style `process.env`.
 * Only REACT_APP_* keys are exposed, so no other env values reach the bundle.
 */
export function reactAppEnvDefine(env, mode) {
  const nodeEnv = mode === 'production' ? 'production' : 'development';
  const processEnv = { NODE_ENV: nodeEnv, PUBLIC_URL: '' };
  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith('REACT_APP_')) processEnv[key] = value;
  }
  return {
    'process.env.NODE_ENV': JSON.stringify(nodeEnv),
    'process.env': JSON.stringify(processEnv),
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define: reactAppEnvDefine(loadEnv(mode, process.cwd(), 'REACT_APP_'), mode),
  // The source uses JSX inside .js files (CRA allowed this).
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' },
    },
  },
  server: {
    port: 3005,
  },
  build: {
    outDir: process.env.BUILD_PATH || 'build',
    emptyOutDir: true,
    assetsDir: 'static',
    sourcemap: true,
    rollupOptions: {
      output: {
        entryFileNames: 'static/js/main.[hash].js',
        chunkFileNames: 'static/js/[name].[hash].chunk.js',
        assetFileNames: ({ names = [] }) =>
          names.some((n) => n.endsWith('.css'))
            ? 'static/css/[name].[hash][extname]'
            : 'static/media/[name].[hash][extname]',
        hashCharacters: 'hex',
      },
    },
  },
}));
