// @vitest-environment node
/**
 * Build-time prerender (scripts/prerender.mjs), run against a fixture
 * index.html in a temp folder. Checks the per-route HTML files, 404.html,
 * sitemap.xml, robots.txt, llms.txt and the IndexNow key file.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { prerender, routeFile } from '../../../scripts/prerender.mjs';
import { PAGES, indexablePages, INDEXNOW_KEY, findPage } from '../../seo/pages';
import { BANNED_WORDS, CRAWLERS } from '../utils/seoRules';

const ROOT = path.resolve(__dirname, '../../..');
const BUILD_DATE = '2026-10-24';

// The real index.html template, with the dev entry swapped for a built bundle
// and stale files from public/ that the prerender must overwrite.
function writeFixture(dir) {
  const template = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const built = template
    .replace('<script type="module" src="/src/index.js"></script>', '')
    .replace('</head>', '  <script type="module" crossorigin src="/static/js/main.1234abcd.js"></script>\n</head>');
  fs.writeFileSync(path.join(dir, 'index.html'), built);
  fs.mkdirSync(path.join(dir, 'static/js'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'static/js/main.1234abcd.js'), '');
}

const read = (dir, f) => fs.readFileSync(path.join(dir, f), 'utf8');
const attr = (html, re) => (html.match(re) || [])[1];
const title = (html) => attr(html, /<title>([^<]*)<\/title>/);
const canonical = (html) => attr(html, /<link rel="canonical" href="([^"]*)"/);
const metaName = (html, n) => attr(html, new RegExp(`<meta name="${n}" content="([^"]*)"`));
const metaProp = (html, n) => attr(html, new RegExp(`<meta property="${n}" content="([^"]*)"`));
const root = (html) => attr(html, /<div id="root">([\s\S]*?)<\/div>\s*<\/body>/);
const jsonLd = (html) =>
  [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
const unescape = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const count = (html, re) => (html.match(re) || []).length;

let outDir;
let result;

describe('prerender script', () => {
  beforeAll(() => {
    outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dgbstats-prerender-'));
    writeFixture(outDir);
    result = prerender({ outDir, buildDate: BUILD_DATE, log: () => {} });
  });

  afterAll(() => {
    if (outDir) fs.rmSync(outDir, { recursive: true, force: true });
  });

  it('maps routes to files nginx can find with try_files $uri.html', () => {
    expect(routeFile('/')).toBe('index.html');
    expect(routeFile('/blocks')).toBe('blocks.html');
    expect(routeFile('/testnet')).toBe('testnet.html');
    expect(routeFile('/testnet/blocks')).toBe(path.join('testnet', 'blocks.html'));
  });

  it('writes one HTML file per route, including noindex pages', () => {
    expect(result.routes.sort()).toEqual(PAGES.map((p) => p.path).sort());
    PAGES.forEach((p) => expect(fs.existsSync(path.join(outDir, routeFile(p.path))), p.path).toBe(true));
  });

  it('gives each route its own title, description, canonical, og and twitter tags, once each', () => {
    PAGES.forEach((p) => {
      const html = read(outDir, routeFile(p.path));
      const url = p.path === '/' ? 'https://digibyte.io/' : `https://digibyte.io${p.path}`;
      expect(unescape(title(html)), p.path).toBe(p.title);
      expect(unescape(metaName(html, 'description')), p.path).toBe(p.description);
      expect(canonical(html), p.path).toBe(url);
      expect(metaProp(html, 'og:url'), p.path).toBe(url);
      expect(unescape(metaProp(html, 'og:title')), p.path).toBe(p.title);
      expect(unescape(metaProp(html, 'og:description')), p.path).toBe(p.description);
      expect(metaProp(html, 'og:image'), p.path).toBe('https://digibyte.io/og-image.png');
      expect(metaProp(html, 'og:site_name'), p.path).toBe('DigiByte Stats');
      expect(metaName(html, 'twitter:card'), p.path).toBe('summary_large_image');
      expect(unescape(metaName(html, 'twitter:title')), p.path).toBe(p.title);
      expect(unescape(metaName(html, 'twitter:description')), p.path).toBe(p.description);
      expect(metaName(html, 'robots'), p.path).toBe(p.noindex ? 'noindex, follow' : 'index, follow');
      for (const re of [/<title>/g, /rel="canonical"/g, /name="description"/g, /property="og:url"/g, /name="robots"/g]) {
        expect(count(html, re), `${p.path} ${re}`).toBe(1);
      }
      expect(html).toContain('<html lang="en">');
      expect(html).toContain('/static/js/main.1234abcd.js');
    });
  });

  it('writes parseable schema.org JSON-LD: WebSite + WebApplication on home, WebPage + BreadcrumbList inside', () => {
    const home = jsonLd(read(outDir, 'index.html'));
    expect(home).toHaveLength(1);
    expect(home[0]['@context']).toBe('https://schema.org');
    const homeTypes = home[0]['@graph'].map((n) => n['@type']);
    expect(homeTypes).toEqual(expect.arrayContaining(['WebSite', 'WebApplication']));
    const site = home[0]['@graph'].find((n) => n['@type'] === 'WebSite');
    expect(site.url).toBe('https://digibyte.io/');
    expect(site.creator.name).toBe('Jared Tate');

    const blocks = jsonLd(read(outDir, 'testnet/blocks.html'));
    expect(blocks).toHaveLength(1);
    expect(blocks[0]['@context']).toBe('https://schema.org');
    const graph = blocks[0]['@graph'];
    const page = graph.find((n) => n['@type'] === 'WebPage');
    expect(page.url).toBe('https://digibyte.io/testnet/blocks');
    expect(page.name).toBe(findPage('/testnet/blocks').title);
    const crumbs = graph.find((n) => n['@type'] === 'BreadcrumbList').itemListElement;
    expect(crumbs.map((c) => c.position)).toEqual([1, 2, 3]);
    expect(crumbs.map((c) => c.item)).toEqual([
      'https://digibyte.io/',
      'https://digibyte.io/testnet',
      'https://digibyte.io/testnet/blocks',
    ]);

    PAGES.forEach((p) => {
      const text = JSON.stringify(jsonLd(read(outDir, routeFile(p.path))));
      BANNED_WORDS.forEach((re) => expect(text, `${p.path} JSON-LD ${re}`).not.toMatch(re));
    });
  });

  it('puts crawlable static HTML in #root: one h1, the intro and links to every indexable page', () => {
    PAGES.forEach((p) => {
      const html = read(outDir, routeFile(p.path));
      const body = root(html);
      expect(body, p.path).toBeTruthy();
      expect(count(html, /<h1[\s>]/g), p.path).toBe(1);
      expect(unescape(attr(body, /<h1>([^<]*)<\/h1>/)), p.path).toBe(p.h1);
      expect(unescape(body)).toContain(p.intro);
      indexablePages().forEach((target) => {
        expect(body, `${p.path} -> ${target.path}`).toContain(`<a href="${target.path}">`);
      });
      expect(body).not.toContain('href="/activation"');
      expect(body).not.toMatch(/display:\s*none|visibility:\s*hidden/);
    });
  });

  it('writes 404.html with noindex and a "Page not found" message', () => {
    const html = read(outDir, '404.html');
    expect(metaName(html, 'robots')).toBe('noindex, follow');
    expect(title(html)).toMatch(/Page Not Found/);
    expect(canonical(html)).toBeUndefined();
    expect(metaProp(html, 'og:url')).toBeUndefined();
    expect(root(html)).toMatch(/<h1>Page not found<\/h1>/);
    expect(root(html)).toContain('<a href="/">');
    expect(html).toContain('/static/js/main.1234abcd.js');
  });

  it('generates sitemap.xml from pages.js with only indexable routes', () => {
    const xml = read(outDir, 'sitemap.xml');
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    const locs = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
    expect(locs).toHaveLength(32);
    expect(locs).toContain('https://digibyte.io/');
    expect(locs).toContain('https://digibyte.io/testnet/taproot');
    expect(locs).not.toContain('https://digibyte.io/activation');
    expect(locs).not.toContain('https://digibyte.io/testnet/activation');
    locs.forEach((l) => expect(l).toMatch(/^https:\/\/digibyte\.io\//));
    expect(count(xml, /<lastmod>2026-10-24<\/lastmod>/g)).toBe(32);
  });

  it('writes a valid robots.txt with a group for every crawler and the sitemap', () => {
    const txt = read(outDir, 'robots.txt');
    const lines = txt.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
    lines.forEach((l) => expect(l, l).toMatch(/^(User-agent|Allow|Disallow|Sitemap):\s*\S+$/));
    expect(txt).toMatch(/User-agent: \*\nAllow: \//);
    CRAWLERS.forEach((bot) => {
      expect(txt, bot).toMatch(new RegExp(`User-agent: ${bot.replace('-', '\\-')}\\nAllow: /\\n`));
    });
    expect(lines[lines.length - 1]).toBe('Sitemap: https://digibyte.io/sitemap.xml');
  });

  it('writes llms.txt in llmstxt.org format with absolute links', () => {
    const txt = read(outDir, 'llms.txt');
    expect(txt.split('\n')[0]).toBe('# DigiByte Stats');
    expect(txt).toMatch(/\n> .+/);
    expect(txt).toMatch(/\n## About\n/);
    expect(txt).toMatch(/\n## Data notes\n/);
    expect(txt).toMatch(/open source/i);
    const links = [...txt.matchAll(/^- \[([^\]]+)\]\(([^)]+)\): .+$/gm)].map((m) => m[2]);
    indexablePages().forEach((p) => {
      const url = p.path === '/' ? 'https://digibyte.io/' : `https://digibyte.io${p.path}`;
      expect(links, url).toContain(url);
    });
    links.forEach((l) => expect(l).toMatch(/^https:\/\//));
    expect(txt).not.toContain('/activation');
    BANNED_WORDS.forEach((re) => expect(txt, `llms.txt ${re}`).not.toMatch(re));
  });

  it('writes llms-full.txt with every indexable page and its intro', () => {
    const txt = read(outDir, 'llms-full.txt');
    indexablePages().forEach((p) => {
      expect(txt).toContain(p.intro);
    });
    BANNED_WORDS.forEach((re) => expect(txt, `llms-full.txt ${re}`).not.toMatch(re));
  });

  it('writes the IndexNow key file whose whole body is the key', () => {
    expect(INDEXNOW_KEY).toBe('261e39d143d43afd6f4680a984cb1e39');
    expect(read(outDir, `${INDEXNOW_KEY}.txt`)).toBe(INDEXNOW_KEY);
  });

  it('is idempotent: running twice gives the same files', () => {
    const before = read(outDir, 'blocks.html');
    prerender({ outDir, buildDate: BUILD_DATE, log: () => {} });
    expect(read(outDir, 'blocks.html')).toBe(before);
    expect(count(read(outDir, 'index.html'), /<h1[\s>]/g)).toBe(1);
  });

  it('fails loudly when index.html has no empty #root', () => {
    const bad = fs.mkdtempSync(path.join(os.tmpdir(), 'dgbstats-prerender-bad-'));
    fs.writeFileSync(path.join(bad, 'index.html'), '<html><head><title>x</title></head><body></body></html>');
    expect(() => prerender({ outDir: bad, buildDate: BUILD_DATE, log: () => {} })).toThrow(/root/);
    fs.rmSync(bad, { recursive: true, force: true });
  });
});
