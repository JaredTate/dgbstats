// @vitest-environment node
/**
 * End-to-end check of `vite build` against the Box 2 deploy contract.
 *
 * deploy-frontend.sh runs `BUILD_PATH=$FE/build_ci npm run build`, then:
 *   - requires build_ci/index.html and build_ci/static/
 *   - health check greps `main\.[a-f0-9]*\.js` in index.html
 * nginx serves /static/ as immutable and index.html as no-cache.
 *
 * This runs a real production build into a temp folder (slow, ~20s).
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';

const ROOT = path.resolve(__dirname, '../../..');
const PROD_ENV = {
  REACT_APP_API_BASE_URL: 'https://digibyte.io',
  REACT_APP_WS_BASE_URL: 'wss://digibyte.io/ws',
  REACT_APP_TESTNET_WS_BASE_URL: 'wss://digibyte.io/ws-testnet',
  REACT_APP_MAINNET_PRE_WS_BASE_URL: 'wss://digibyte.io/ws-mainnet-pre',
};

let outDir;
let indexHtml;
let mainJs;

const readAllJs = (dir) =>
  fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.js'))
    .map((f) => fs.readFileSync(path.join(dir, f), 'utf8'))
    .join('\n');

describe('production build (deploy contract)', () => {
  beforeAll(() => {
    outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dgbstats-build-'));
    // Run the real npm script, exactly like deploy-frontend.sh does.
    const env = { ...process.env, ...PROD_ENV, BUILD_PATH: outDir };
    delete env.NODE_ENV; // vitest sets NODE_ENV=test; the deploy shell does not
    delete env.VITEST;
    execFileSync('npm', ['run', 'build'], { cwd: ROOT, env, stdio: 'pipe' });
    indexHtml = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
    mainJs = readAllJs(path.join(outDir, 'static/js'));
  }, 180000);

  afterAll(() => {
    if (outDir) fs.rmSync(outDir, { recursive: true, force: true });
  });

  it('writes index.html and static/ into BUILD_PATH', () => {
    expect(fs.existsSync(path.join(outDir, 'index.html'))).toBe(true);
    expect(fs.statSync(path.join(outDir, 'static')).isDirectory()).toBe(true);
  });

  it('references a main.<hex>.js bundle the deploy health check can find', () => {
    const match = indexHtml.match(/main\.[a-f0-9]*\.js/);
    expect(match).not.toBeNull();
    expect(match[0]).toMatch(/^main\.[a-f0-9]{8}\.js$/);
    expect(indexHtml).toContain(`/static/js/${match[0]}`);
    expect(fs.existsSync(path.join(outDir, 'static/js', match[0]))).toBe(true);
  });

  it('keeps the SEO meta tags and resolves %PUBLIC_URL%', () => {
    expect(indexHtml).toContain(
      '<title>DigiByte Blockchain Stats | Real-time DGB Network Analytics</title>'
    );
    expect(indexHtml).toContain('property="og:image" content="https://digibyte.io/og-image.png"');
    expect(indexHtml).toContain('<link rel="manifest" href="/manifest.json"');
    expect(indexHtml).not.toContain('%PUBLIC_URL%');
    expect(indexHtml).toContain('<div id="root"></div>');
  });

  it('copies public/ assets to the output root', () => {
    for (const f of [
      'favicon.ico',
      'logo.png',
      'manifest.json',
      'robots.txt',
      'sitemap.xml',
      'og-image.png',
      'og-images/og-blocks.png',
    ]) {
      expect(fs.existsSync(path.join(outDir, f)), f).toBe(true);
    }
  });

  it('inlines the REACT_APP_* production URLs and leaves no process.env lookups', () => {
    expect(mainJs).toContain('https://digibyte.io');
    expect(mainJs).toContain('wss://digibyte.io/ws');
    expect(mainJs).toContain('wss://digibyte.io/ws-testnet');
    // NetworkContext's dev fallback must be folded away once the env var is set.
    // (localhost:5001/5002 can still come from the git-ignored src/config.js.)
    expect(mainJs).not.toContain('ws://localhost:5003');
    expect(mainJs).not.toMatch(/process\.env/);
  });

  it('builds React in production mode', () => {
    expect(mainJs).not.toContain('react-dom.development');
    expect(mainJs).not.toContain('jsxDEV');
  });
});
