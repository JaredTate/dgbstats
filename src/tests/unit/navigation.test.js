import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getNavGroups, findActiveTab, withBase, HOME_TAB } from '../../navigation';

// Routes registered in App.js, per layout. Pages reached only from old links
// (activation) or from inside other pages (taproot) are not in the menus.
const UNLISTED = ['activation', 'taproot'];

function appRoutes() {
  const src = fs.readFileSync(path.join(process.cwd(), 'src/App.js'), 'utf8');
  const testnetStart = src.indexOf('path="/testnet"');
  const mainnet = [...src.slice(0, testnetStart).matchAll(/path="\/([a-z-]+)"/g)].map((m) => m[1]);
  const testnet = [...src.slice(testnetStart).matchAll(/path="([a-z-]+)"/g)].map((m) => m[1]);
  return {
    mainnet: mainnet.filter((p) => !UNLISTED.includes(p)),
    testnet: testnet.filter((p) => !UNLISTED.includes(p)),
  };
}

const internalPaths = (groups) =>
  groups.flatMap((g) => g.items).filter((i) => !i.external).map((i) => i.path);

describe('navigation config', () => {
  it('has four groups in a fixed, logical order', () => {
    expect(getNavGroups(false).map((g) => g.label)).toEqual(['Blockchain', 'Mining', 'DigiDollar', 'More']);
    expect(getNavGroups(true).map((g) => g.label)).toEqual(['Blockchain', 'Mining', 'DigiDollar', 'More']);
  });

  it('lists every mainnet page exactly once', () => {
    const paths = internalPaths(getNavGroups(false));
    const routes = appRoutes().mainnet;
    expect(routes.length).toBeGreaterThan(10);
    routes.forEach((r) => expect(paths.filter((p) => p === `/${r}`)).toHaveLength(1));
    expect(paths.sort()).toEqual(routes.map((r) => `/${r}`).sort());
  });

  it('lists every testnet page exactly once, with the /testnet prefix', () => {
    const paths = internalPaths(getNavGroups(true));
    const routes = appRoutes().testnet;
    expect(paths.sort()).toEqual(routes.map((r) => `/testnet/${r}`).sort());
  });

  it('keeps mainnet-only and testnet-only pages on their own network', () => {
    const main = internalPaths(getNavGroups(false));
    const test = internalPaths(getNavGroups(true));
    ['/pools', '/downloads', '/roadmap'].forEach((p) => {
      expect(main).toContain(p);
      expect(test).not.toContain(`/testnet${p}`);
    });
    expect(test).toContain('/testnet/convert');
    expect(main).not.toContain('/convert');
  });

  it('puts the pages in the expected groups', () => {
    const byGroup = Object.fromEntries(getNavGroups(false).map((g) => [g.id, g.items.map((i) => i.label)]));
    expect(byGroup.blockchain).toEqual(['Blocks', 'Transactions', 'Supply', 'Chain Tips & Forks', 'Nodes']);
    expect(byGroup.mining).toEqual(['Algorithms', 'Difficulty', 'Hashrate', 'Mining Pools', 'Pool Upgrades']);
    expect(byGroup.digidollar).toEqual(['What is DigiDollar', 'DigiDollar Stats', 'Price Oracles']);
    expect(byGroup.more.slice(0, 2)).toEqual(['Downloads', 'Roadmap']);
  });

  it('gives every item a plain label, a short description and an icon', () => {
    [false, true].forEach((isTestnet) => {
      getNavGroups(isTestnet).forEach((g) => {
        expect(g.icon).toBeTruthy();
        expect(g.description.length).toBeGreaterThan(5);
        g.items.forEach((i) => {
          expect(i.label.length).toBeGreaterThan(2);
          expect(i.description.length).toBeGreaterThan(5);
          expect(i.description.length).toBeLessThanOrEqual(60);
          expect(i.icon).toBeTruthy();
        });
      });
    });
  });

  it('opens outside sites in a new tab, with https links', () => {
    const external = getNavGroups(false).flatMap((g) => g.items).filter((i) => i.external);
    expect(external.map((i) => i.label)).toEqual(['DigiExplorer', 'DigiHash', 'DigiByte.org', 'GitHub', 'Digi-ID', 'DigiScope']);
    external.forEach((i) => expect(i.path).toMatch(/^https:\/\//));
  });
});

describe('findActiveTab', () => {
  it('maps pages to their tab on both networks', () => {
    expect(findActiveTab('/', '')).toBe(HOME_TAB);
    expect(findActiveTab('/testnet', '/testnet')).toBe(HOME_TAB);
    expect(findActiveTab('/testnet/', '/testnet')).toBe(HOME_TAB);
    expect(findActiveTab('/blocks', '')).toBe('blockchain');
    expect(findActiveTab('/supply', '')).toBe('blockchain');
    expect(findActiveTab('/difficulties', '')).toBe('mining');
    expect(findActiveTab('/testnet/oracles', '/testnet')).toBe('digidollar');
    expect(findActiveTab('/testnet/convert', '/testnet')).toBe('digidollar');
    expect(findActiveTab('/roadmap', '')).toBe('more');
  });

  it('returns null for pages that are not in a menu', () => {
    expect(findActiveTab('/activation', '')).toBeNull();
    expect(findActiveTab('/taproot', '')).toBeNull();
    expect(findActiveTab('/no/such/page', '')).toBeNull();
  });
});

describe('withBase', () => {
  it('joins the network base path', () => {
    expect(withBase('/blocks', '')).toBe('/blocks');
    expect(withBase('/blocks', '/testnet')).toBe('/testnet/blocks');
    expect(withBase('/', '/testnet')).toBe('/testnet');
    expect(withBase('/', '')).toBe('/');
  });
});

// Fuzz: random and hostile paths must never throw, and results stay well-formed.
describe('navigation fuzz', () => {
  let seed = 0x5eed;
  const rand = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const chars = 'abcdefghijklmnopqrstuvwxyz-/_.%?#&=0123456789 é中';
  const randomPath = () => {
    const len = Math.floor(rand() * 40);
    let s = rand() < 0.8 ? '/' : '';
    for (let i = 0; i < len; i += 1) s += chars[Math.floor(rand() * chars.length)];
    return s;
  };
  const validTabs = [HOME_TAB, 'blockchain', 'mining', 'digidollar', 'more', null];

  it('findActiveTab never throws and returns a known tab or null', () => {
    const odd = [undefined, null, '', '//', '/testnet//', 42, {}, [], '/BLOCKS', '/blocks/', '/blocks?x=1', '/blocks#a'];
    for (let i = 0; i < 500; i += 1) {
      const p = i < odd.length ? odd[i] : randomPath();
      const base = rand() < 0.5 ? '' : '/testnet';
      let tab;
      expect(() => { tab = findActiveTab(p, base); }).not.toThrow();
      expect(validTabs).toContain(tab);
    }
  });

  it('findActiveTab ignores a trailing slash, query or hash on real pages', () => {
    expect(findActiveTab('/blocks/', '')).toBe('blockchain');
    expect(findActiveTab('/blocks?x=1', '')).toBe('blockchain');
    expect(findActiveTab('/testnet/hashrate/', '/testnet')).toBe('mining');
  });

  it('withBase always returns one leading slash and no double slashes', () => {
    for (let i = 0; i < 500; i += 1) {
      const p = `/${randomPath().replace(/^\/+/, '').replace(/\/+/g, '/')}`;
      const base = rand() < 0.5 ? '' : '/testnet';
      const out = withBase(p, base);
      expect(out.startsWith('/')).toBe(true);
      expect(out).not.toMatch(/\/\//);
      if (base) expect(out.startsWith('/testnet')).toBe(true);
    }
  });
});
