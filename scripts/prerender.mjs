#!/usr/bin/env node
/**
 * Build-time prerender. Runs after `vite build` (see the npm "build" script).
 * No headless browser: it rewrites the built index.html once per route.
 *
 * From <out>/index.html (out = $BUILD_PATH or build/) it writes:
 *   - <out>/<route>.html for every route in src/seo/pages.js
 *     (index.html for home, blocks.html, testnet.html, testnet/blocks.html …)
 *     with that route's title, description, canonical, og/twitter tags,
 *     JSON-LD and crawlable static HTML inside <div id="root">
 *   - <out>/404.html (noindex), sitemap.xml, robots.txt, llms.txt,
 *     llms-full.txt and the IndexNow key file
 *
 * nginx serves these with `try_files $uri $uri.html $uri/ =404` and
 * `error_page 404 /404.html`. React's ReactDOM.render() empties #root before
 * it mounts, so the static HTML is replaced, not hydrated.
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import {
  PAGES,
  NOT_FOUND_PAGE,
  NAV_GROUP_LABELS,
  RELATED_SITES,
  SITE_URL,
  SITE_NAME,
  INDEXNOW_KEY,
  canonicalUrl,
  indexablePages,
  isTestnetPath,
  breadcrumbTrail,
} from '../src/seo/pages.js';
import { jsonLdText } from '../src/seo/schema.js';

/** Crawlers that each get an explicit `Allow: /` group in robots.txt. */
export const ROBOTS_AGENTS = [
  'Googlebot', 'Google-Extended', 'GoogleOther', 'Bingbot', 'Applebot', 'Applebot-Extended',
  'DuckDuckBot', 'DuckAssistBot', 'YandexBot', 'Baiduspider',
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot',
  'anthropic-ai', 'PerplexityBot', 'Perplexity-User',
  'CCBot', 'meta-externalagent', 'FacebookBot', 'Amazonbot', 'MistralAI-User', 'cohere-ai', 'YouBot',
];

const SHELL_START = '<!--seo-shell-->';
const SHELL_END = '<!--/seo-shell-->';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Output file for a route, relative to the build folder. */
export function routeFile(routePath) {
  if (routePath === '/') return 'index.html';
  return path.join(...routePath.slice(1).split('/')) + '.html';
}

// ------------------------------------------------------------------ <head>

// Tags the prerender owns. They are removed from the template and written
// fresh for each route, so there is never a duplicate.
const OWNED_HEAD_TAGS = [
  /\s*<title>[\s\S]*?<\/title>/g,
  /\s*<meta\s+name="(?:title|description|robots|twitter:url|twitter:title|twitter:description)"[^>]*>/g,
  /\s*<meta\s+property="og:(?:url|title|description|type)"[^>]*>/g,
  /\s*<link\s+rel="canonical"[^>]*>/g,
  /\s*<script\s+type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g,
  /\s*<style id="seo-shell-style">[\s\S]*?<\/style>/g,
  /\s*<!-- Page SEO tags\.[\s\S]*?-->/g,
];

function headTags(meta, page) {
  const url = page ? canonicalUrl(page.path) : null;
  const lines = [
    `<title>${esc(meta.title)}</title>`,
    `<meta name="description" content="${esc(meta.description)}" />`,
    `<meta name="robots" content="${meta.noindex ? 'noindex, follow' : 'index, follow'}" />`,
    url && `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:type" content="website" />`,
    url && `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    `<meta name="twitter:title" content="${esc(meta.title)}" />`,
    `<meta name="twitter:description" content="${esc(meta.description)}" />`,
    page && `<script type="application/ld+json">${jsonLdText(page)}</script>`,
    `<style id="seo-shell-style">${SHELL_CSS}</style>`,
  ];
  return lines.filter(Boolean).map((l) => `    ${l}`).join('\n');
}

// Plain, visible styling for the static HTML. It shows only until the app
// mounts (or always, for crawlers and readers without JavaScript).
const SHELL_CSS = [
  '.seo-shell{max-width:960px;margin:0 auto;padding:24px 16px;color:#002352;font-family:Roboto,Helvetica,Arial,sans-serif;line-height:1.5}',
  '.seo-shell h1{font-size:2rem;margin:8px 0 12px}',
  '.seo-shell h2{font-size:1.15rem;margin:24px 0 4px}',
  '.seo-shell h3{font-size:1rem;margin:12px 0 4px}',
  '.seo-shell ul{margin:0;padding-left:20px}',
  '.seo-shell a{color:#0066cc}',
  '.seo-crumbs{font-size:.9rem}',
].join('');

// ------------------------------------------------------------ static body

function link(p) {
  return `<a href="${esc(p.path)}">${esc(p.breadcrumb)}</a>`;
}

function networkNav(isTestnet) {
  const pages = indexablePages().filter((p) => isTestnetPath(p.path) === isTestnet);
  const home = pages.find((p) => p.group === null);
  const parts = [
    `<h2>${isTestnet ? 'DigiByte testnet' : 'DigiByte mainnet'}</h2>`,
    `<ul><li>${link({ ...home, breadcrumb: isTestnet ? 'Testnet home' : 'Home' })}</li></ul>`,
  ];
  for (const [id, label] of Object.entries(NAV_GROUP_LABELS)) {
    const items = pages.filter((p) => p.group === id);
    if (!items.length) continue;
    parts.push(`<h3>${esc(label)}</h3>`, `<ul>${items.map((p) => `<li>${link(p)}</li>`).join('')}</ul>`);
  }
  return parts.join('');
}

function siteNav() {
  const related = RELATED_SITES.map((s) => `<li><a href="${esc(s.url)}">${esc(s.label)}</a></li>`).join('');
  return (
    `<nav aria-label="All pages">${networkNav(false)}${networkNav(true)}` +
    `<h2>Other DigiByte sites</h2><ul>${related}</ul></nav>`
  );
}

function crumbs(page) {
  const trail = breadcrumbTrail(page);
  if (trail.length < 2) return '';
  const items = trail.map((c, i) =>
    i === trail.length - 1 ? `<span aria-current="page">${esc(c.name)}</span>` : `<a href="${esc(c.path)}">${esc(c.name)}</a>`
  );
  return `<nav class="seo-crumbs" aria-label="Breadcrumb">${items.join(' › ')}</nav>`;
}

function shellHtml(meta, page) {
  return (
    `${SHELL_START}<div class="seo-shell">` +
    (page ? crumbs(page) : '') +
    `<main><h1>${esc(meta.h1)}</h1><p>${esc(meta.intro)}</p>` +
    (page ? '' : '<p><a href="/">Go to the DigiByte Stats home page</a></p>') +
    `</main>${siteNav()}</div>${SHELL_END}`
  );
}

// ---------------------------------------------------------------- render

const ROOT_RE = new RegExp(`<div id="root">(?:${SHELL_START}[\\s\\S]*?${SHELL_END})?</div>`);

/** One route's HTML from the built template. page = null renders the 404. */
export function renderPage(template, page) {
  const meta = page || NOT_FOUND_PAGE;
  if (!ROOT_RE.test(template)) {
    throw new Error('prerender: index.html has no empty <div id="root"></div> to fill');
  }
  let html = template;
  for (const re of OWNED_HEAD_TAGS) html = html.replace(re, '');
  html = html.replace(/(<meta\s+name="viewport"[^>]*>)/, `$1\n${headTags(meta, page)}`);
  if (!html.includes('<title>')) html = html.replace('</head>', `${headTags(meta, page)}\n  </head>`);
  return html.replace(ROOT_RE, () => `<div id="root">${shellHtml(meta, page)}</div>`);
}

export function sitemapXml(buildDate) {
  const urls = indexablePages()
    .map((p) => `  <url>\n    <loc>${esc(canonicalUrl(p.path))}</loc>\n    <lastmod>${buildDate}</lastmod>\n  </url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function robotsTxt() {
  const groups = ['*', ...ROBOTS_AGENTS].map((agent) => `User-agent: ${agent}\nAllow: /\n`);
  return [
    `# robots.txt for ${SITE_URL}`,
    '# Everything is public. Search and AI crawlers are welcome.',
    '',
    groups.join('\n'),
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    '',
  ].join('\n');
}

function llmsLinks(isTestnet) {
  return indexablePages()
    .filter((p) => isTestnetPath(p.path) === isTestnet)
    .map((p) => `- [${p.h1}](${canonicalUrl(p.path)}): ${p.description}`)
    .join('\n');
}

const LLMS_SUMMARY =
  `${SITE_NAME} (${SITE_URL}) is a free, open-source website with live statistics for the DigiByte (DGB) blockchain: ` +
  'blocks, transactions, supply, nodes, mining algorithms, difficulty, hashrate, mining pools and the DigiDollar stablecoin. ' +
  'The same pages also exist for the DigiByte testnet.';

const LLMS_ABOUT = [
  `- ${SITE_NAME} is free to use and open source (https://github.com/JaredTate/dgbstats).`,
  '- DigiByte is an open-source blockchain that launched in 2014. No company is behind it; a worldwide community of volunteers maintains it.',
  `- ${SITE_NAME} was created by DigiByte founder Jared Tate.`,
].join('\n');

const LLMS_DATA_NOTES = [
  '- The data comes live from DigiByte nodes (DigiByte Core) through this site\'s own API and WebSocket feeds.',
  '- Pages update in the browser as new blocks arrive (a DigiByte block is found about every 15 seconds). Without JavaScript a page shows only its summary and links.',
  '- Testnet pages show DigiByte testnet data. The testnet is a separate network for testing software, and its coins are for testing only.',
  '- DigiDollar is a time-locked UTXO stablecoin built into DigiByte Core (v9.26 and later).',
].join('\n');

export function llmsTxt() {
  const related = RELATED_SITES.map((s) => `- [${s.label}](${s.url}): ${s.description}`).join('\n');
  return [
    `# ${SITE_NAME}`,
    '',
    `> ${LLMS_SUMMARY}`,
    '',
    '## Mainnet pages',
    '',
    llmsLinks(false),
    '',
    '## Testnet pages',
    '',
    llmsLinks(true),
    '',
    '## About',
    '',
    LLMS_ABOUT,
    '',
    '## Data notes',
    '',
    LLMS_DATA_NOTES,
    '',
    '## Optional',
    '',
    `- [Full page list with summaries](${SITE_URL}/llms-full.txt): Every page on this site with a short description of what it shows`,
    related,
    '',
  ].join('\n');
}

export function llmsFullTxt() {
  const section = (isTestnet) =>
    indexablePages()
      .filter((p) => isTestnetPath(p.path) === isTestnet)
      .map((p) => `### ${p.h1}\n\nURL: ${canonicalUrl(p.path)}\n\n${p.intro}`)
      .join('\n\n');
  return [
    `# ${SITE_NAME}`,
    '',
    `> ${LLMS_SUMMARY}`,
    '',
    '## Mainnet pages',
    '',
    section(false),
    '',
    '## Testnet pages',
    '',
    section(true),
    '',
    '## About',
    '',
    LLMS_ABOUT,
    '',
    '## Data notes',
    '',
    LLMS_DATA_NOTES,
    '',
  ].join('\n');
}

/**
 * Write every prerendered file into outDir. Returns { routes, files }.
 * Safe to run twice: each run strips the tags and static HTML it owns first.
 */
export function prerender({ outDir, buildDate = new Date().toISOString().slice(0, 10), log = console.log } = {}) {
  const indexPath = path.join(outDir, 'index.html');
  if (!fs.existsSync(indexPath)) throw new Error(`prerender: ${indexPath} not found (run vite build first)`);
  const template = fs.readFileSync(indexPath, 'utf8');

  const files = [];
  const write = (rel, body) => {
    const full = path.join(outDir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, body);
    files.push(rel);
  };

  // Render everything before writing, so a bad template changes nothing.
  const pages = PAGES.map((page) => [routeFile(page.path), renderPage(template, page)]);
  pages.push(['404.html', renderPage(template, null)]);
  pages.forEach(([rel, html]) => write(rel, html));
  write('sitemap.xml', sitemapXml(buildDate));
  write('robots.txt', robotsTxt());
  write('llms.txt', llmsTxt());
  write('llms-full.txt', llmsFullTxt());
  write(`${INDEXNOW_KEY}.txt`, INDEXNOW_KEY);

  log(`prerender: wrote ${files.length} files to ${outDir}`);
  return { routes: PAGES.map((p) => p.path), files };
}

// CLI: `node scripts/prerender.mjs` (after vite build). Honors BUILD_PATH.
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const outDir = path.resolve(process.cwd(), process.env.BUILD_PATH || 'build');
  try {
    prerender({ outDir });
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

