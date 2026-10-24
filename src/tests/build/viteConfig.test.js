// @vitest-environment node
/**
 * Unit tests for the Vite build config (replaces Create React App).
 *
 * These lock in the contract the Box 2 deploy script relies on:
 *  - output folder comes from BUILD_PATH (default `build/`)
 *  - bundles live under `static/`, entry named `static/js/main.<hex>.js`
 *    (deploy health check greps `main\.[a-f0-9]*\.js` in index.html)
 *  - REACT_APP_* env variables reach the app as `process.env.REACT_APP_*`,
 *    exactly like CRA did.
 */
import { describe, it, expect, afterEach } from 'vitest';
import viteConfig, { reactAppEnvDefine } from '../../../vite.config.js';

const resolveConfig = (mode = 'production', command = 'build') =>
  viteConfig({ mode, command });

describe('reactAppEnvDefine', () => {
  it('maps REACT_APP_* values to a process.env object like CRA', () => {
    const define = reactAppEnvDefine(
      {
        REACT_APP_API_BASE_URL: 'https://digibyte.io',
        REACT_APP_WS_BASE_URL: 'wss://digibyte.io/ws',
        REACT_APP_TESTNET_WS_BASE_URL: 'wss://digibyte.io/ws-testnet',
        REACT_APP_MAINNET_PRE_WS_BASE_URL: 'wss://digibyte.io/ws-mainnet-pre',
      },
      'production'
    );
    const env = JSON.parse(define['process.env']);
    expect(env).toEqual({
      NODE_ENV: 'production',
      PUBLIC_URL: '',
      REACT_APP_API_BASE_URL: 'https://digibyte.io',
      REACT_APP_WS_BASE_URL: 'wss://digibyte.io/ws',
      REACT_APP_TESTNET_WS_BASE_URL: 'wss://digibyte.io/ws-testnet',
      REACT_APP_MAINNET_PRE_WS_BASE_URL: 'wss://digibyte.io/ws-mainnet-pre',
    });
    expect(JSON.parse(define['process.env.NODE_ENV'])).toBe('production');
  });

  it('ignores variables without the REACT_APP_ prefix (no secret leaks)', () => {
    const define = reactAppEnvDefine(
      { REACT_APP_API_BASE_URL: 'x', SECRET_TOKEN: 'nope', HOME: '/root' },
      'production'
    );
    const env = JSON.parse(define['process.env']);
    expect(env.SECRET_TOKEN).toBeUndefined();
    expect(env.HOME).toBeUndefined();
    expect(env.REACT_APP_API_BASE_URL).toBe('x');
  });

  it('uses development NODE_ENV outside production mode', () => {
    const define = reactAppEnvDefine({}, 'development');
    expect(JSON.parse(define['process.env']).NODE_ENV).toBe('development');
  });
});

describe('vite config', () => {
  const savedBuildPath = process.env.BUILD_PATH;
  const savedApi = process.env.REACT_APP_API_BASE_URL;

  afterEach(() => {
    if (savedBuildPath === undefined) delete process.env.BUILD_PATH;
    else process.env.BUILD_PATH = savedBuildPath;
    if (savedApi === undefined) delete process.env.REACT_APP_API_BASE_URL;
    else process.env.REACT_APP_API_BASE_URL = savedApi;
  });

  it('builds into build/ by default (same folder as CRA)', () => {
    delete process.env.BUILD_PATH;
    expect(resolveConfig().build.outDir).toBe('build');
  });

  it('honours BUILD_PATH like CRA (deploy uses BUILD_PATH=.../build_ci)', () => {
    process.env.BUILD_PATH = '/home/ubuntu/dgbstats/build_ci';
    const { build } = resolveConfig();
    expect(build.outDir).toBe('/home/ubuntu/dgbstats/build_ci');
    expect(build.emptyOutDir).toBe(true);
  });

  it('emits bundles under static/ with a hex-hashed main entry', () => {
    const { build } = resolveConfig();
    const out = build.rollupOptions.output;
    expect(build.assetsDir).toBe('static');
    expect(out.entryFileNames).toBe('static/js/main.[hash].js');
    expect(out.chunkFileNames).toBe('static/js/[name].[hash].chunk.js');
    expect(out.hashCharacters).toBe('hex');
    expect(out.assetFileNames({ names: ['main.css'] })).toBe(
      'static/css/[name].[hash][extname]'
    );
    expect(out.assetFileNames({ names: ['digibyte256.png'] })).toBe(
      'static/media/[name].[hash][extname]'
    );
  });

  it('keeps the dev server on port 3005 (same as the old npm start)', () => {
    expect(resolveConfig('development', 'serve').server.port).toBe(3005);
  });

  it('reads REACT_APP_* from the shell environment', () => {
    process.env.REACT_APP_API_BASE_URL = 'https://example.test';
    const env = JSON.parse(resolveConfig().define['process.env']);
    expect(env.REACT_APP_API_BASE_URL).toBe('https://example.test');
  });
});
