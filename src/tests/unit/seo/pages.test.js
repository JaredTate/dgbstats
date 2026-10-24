import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  PAGES,
  NAV_GROUP_LABELS,
  SITE_URL,
  findPage,
  indexablePages,
  canonicalUrl,
  isTestnetPath,
} from '../../../seo/pages';
import { getNavGroups } from '../../../navigation';
import { BANNED_WORDS as BANNED } from '../../utils/seoRules';

/** Every path App.js registers, as a full URL path ('/', '/blocks', '/testnet', '/testnet/blocks'). */
function appRoutes() {
  const src = fs.readFileSync(path.join(process.cwd(), 'src/App.js'), 'utf8');
  const testnetStart = src.indexOf('path="/testnet"');
  const mainnet = [...src.slice(0, testnetStart).matchAll(/path="\/([a-z-]*)"/g)].map((m) => `/${m[1]}`);
  const testnetSrc = src.slice(testnetStart);
  const testnet = [...testnetSrc.matchAll(/path="([a-z-]+)"/g)].map((m) => `/testnet/${m[1]}`);
  if (/<Route\s+index/.test(testnetSrc)) testnet.unshift('/testnet');
  return [...mainnet, ...testnet];
}

const sentences = (text) => text.split(/(?<=[.!?])\s+/).filter(Boolean);

describe('SEO pages (src/seo/pages.js)', () => {
  it('covers every App.js route exactly once', () => {
    const routes = appRoutes();
    expect(routes.length).toBe(34);
    const paths = PAGES.map((p) => p.path);
    expect(new Set(paths).size).toBe(paths.length);
    expect([...paths].sort()).toEqual([...routes].sort());
  });

  it('gives every page a unique title of at most 60 characters that names DigiByte', () => {
    const titles = PAGES.map((p) => p.title);
    expect(new Set(titles).size).toBe(titles.length);
    PAGES.forEach((p) => {
      expect(p.title.length, p.path).toBeLessThanOrEqual(60);
      expect(p.title, p.path).toMatch(/DigiByte|DGB/);
    });
  });

  it('gives every page a unique description of 70 to 160 characters', () => {
    const descs = PAGES.map((p) => p.description);
    expect(new Set(descs).size).toBe(descs.length);
    PAGES.forEach((p) => {
      expect(p.description.length, `${p.path}: ${p.description.length}`).toBeGreaterThanOrEqual(70);
      expect(p.description.length, `${p.path}: ${p.description.length}`).toBeLessThanOrEqual(160);
    });
  });

  it('gives every page an h1, a 1-3 sentence intro and a breadcrumb label', () => {
    PAGES.forEach((p) => {
      expect(p.h1.length, p.path).toBeGreaterThan(3);
      expect(p.breadcrumb.length, p.path).toBeGreaterThan(2);
      const n = sentences(p.intro).length;
      expect(n, `${p.path} intro has ${n} sentences`).toBeGreaterThanOrEqual(1);
      expect(n, `${p.path} intro has ${n} sentences`).toBeLessThanOrEqual(3);
    });
  });

  it('says testnet on every testnet page', () => {
    PAGES.filter((p) => isTestnetPath(p.path)).forEach((p) => {
      expect(p.title, p.path).toMatch(/Testnet/);
      expect(p.intro, p.path).toMatch(/DigiByte testnet/i);
      expect(p.description, p.path).toMatch(/testnet/i);
    });
  });

  it('marks only the activation pages noindex and keeps them out of the indexable list', () => {
    const noindex = PAGES.filter((p) => p.noindex).map((p) => p.path).sort();
    expect(noindex).toEqual(['/activation', '/testnet/activation']);
    const indexable = indexablePages().map((p) => p.path);
    expect(indexable).toHaveLength(32);
    expect(indexable).not.toContain('/activation');
    expect(indexable).not.toContain('/testnet/activation');
  });

  it('uses no banned DigiDollar words in any text', () => {
    PAGES.forEach((p) => {
      const text = [p.title, p.description, p.h1, p.intro, p.breadcrumb].join(' ');
      BANNED.forEach((re) => expect(text, `${p.path} matches ${re}`).not.toMatch(re));
    });
  });

  it('calls DigiDollar a stablecoin where it says what it is', () => {
    expect(findPage('/digidollar').description).toMatch(/time-locked UTXO stablecoin/);
  });

  it('groups pages like navigation.js, in the same order', () => {
    [false, true].forEach((isTestnet) => {
      getNavGroups(isTestnet).forEach((group) => {
        expect(NAV_GROUP_LABELS[group.id]).toBe(group.label);
        const navPaths = group.items.filter((i) => !i.external).map((i) => i.path);
        const pagePaths = indexablePages()
          .filter((p) => p.group === group.id && isTestnetPath(p.path) === isTestnet)
          .map((p) => p.path)
          .filter((p) => navPaths.includes(p));
        expect(pagePaths).toEqual(navPaths);
      });
    });
  });

  it('finds pages by path, ignoring trailing slashes, query strings and case', () => {
    expect(findPage('/blocks').path).toBe('/blocks');
    expect(findPage('/blocks/').path).toBe('/blocks');
    expect(findPage('/Blocks?x=1#top').path).toBe('/blocks');
    expect(findPage('/testnet/').path).toBe('/testnet');
    expect(findPage('/').path).toBe('/');
    expect(findPage('')).toBe(null);
    expect(findPage('/nope')).toBe(null);
    expect(findPage('/testnet/pools')).toBe(null);
    expect(findPage(undefined)).toBe(null);
  });

  it('builds absolute, https, no-trailing-slash canonicals (home keeps its slash)', () => {
    expect(canonicalUrl('/')).toBe(`${SITE_URL}/`);
    expect(canonicalUrl('/blocks')).toBe('https://digibyte.io/blocks');
    expect(canonicalUrl('/testnet')).toBe('https://digibyte.io/testnet');
  });
});

describe('index.html defaults', () => {
  it('match the home page entry in pages.js', async () => {
    const { jsonLdText } = await import('../../../seo/schema');
    const html = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
    const home = findPage('/');
    expect(html).toContain(`<title>${home.title}</title>`);
    expect(html).toContain(`<meta name="description" content="${home.description}" />`);
    expect(html).toContain(`<meta property="og:title" content="${home.title}" />`);
    expect(html).toContain(`<meta name="twitter:description" content="${home.description}" />`);
    expect(html).toContain('<link rel="canonical" href="https://digibyte.io/" />');
    expect(html).toContain('<meta property="og:image" content="https://digibyte.io/og-image.png" />');
    expect(html).toContain(`<script type="application/ld+json">${jsonLdText(home)}</script>`);
    expect(html).toContain('<div id="root"></div>');
  });
});
