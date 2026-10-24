/**
 * SEO source of truth: one entry per route in App.js, on both networks.
 *
 * Used at runtime by usePageSeo (head tags on every route change) and at build
 * time by scripts/prerender.mjs (per-route HTML, sitemap.xml, llms.txt).
 * Plain data with no imports, so plain Node can load it (see ./package.json).
 *
 * Rules (tests/unit/seo/pages.test.js): unique titles <= 60 chars, unique
 * descriptions 70-160 chars, 1-3 sentence intros, testnet pages say testnet,
 * and no price/token/investment wording about DigiDollar.
 * `group` matches the group ids in src/navigation.js (null = Home).
 */

export const SITE_URL = 'https://digibyte.io';
export const SITE_NAME = 'DigiByte Stats';
export const OG_IMAGE = `${SITE_URL}/og-image.png`;
export const INDEXNOW_KEY = '261e39d143d43afd6f4680a984cb1e39';

/** Group labels, same as src/navigation.js. */
export const NAV_GROUP_LABELS = {
  blockchain: 'Blockchain',
  mining: 'Mining',
  digidollar: 'DigiDollar',
  more: 'More',
};

/** Other DigiByte sites, linked from the static HTML and llms.txt. */
export const RELATED_SITES = [
  { label: 'DigiExplorer', url: 'https://digiexplorer.info/', description: 'Look up any DigiByte block, transaction or address' },
  { label: 'DigiHash', url: 'https://digihash.digibyte.io/', description: 'Free, open-source DigiByte mining pool' },
  { label: 'DigiByte.org', url: 'https://digibyte.org', description: 'The main DigiByte website' },
  { label: 'DigiByte Core on GitHub', url: 'https://github.com/DigiByte-Core/digibyte', description: 'DigiByte Core source code' },
];

export const PAGES = [
  // ---------------------------------------------------------------- mainnet
  {
    path: '/',
    group: null,
    breadcrumb: 'Home',
    title: 'DigiByte Stats – Live DGB Blockchain Statistics',
    h1: 'DigiByte Blockchain Statistics',
    description:
      'Live DigiByte (DGB) blockchain statistics: block height, supply, hashrate, difficulty, mining algorithms, nodes and the newest blocks.',
    intro:
      'DigiByte Stats shows live data from the DigiByte (DGB) blockchain: block height, coin supply, hashrate, difficulty for each of the five mining algorithms, the current DigiByte Core release and the newest blocks. The data comes straight from DigiByte nodes and updates as new blocks arrive.',
  },
  {
    path: '/blocks',
    group: 'blockchain',
    breadcrumb: 'Blocks',
    title: 'Latest DigiByte Blocks – DigiByte Stats',
    h1: 'Latest DigiByte Blocks',
    description:
      'The newest DigiByte (DGB) blocks, updated live: block height, mining algorithm, block reward, size and the miner or pool that found each block.',
    intro:
      'This page lists the latest DigiByte blocks as they are mined, about 240 at a time. For each block it shows the height, the mining algorithm, the block reward, the size and the miner or pool that found it.',
  },
  {
    path: '/txs',
    group: 'blockchain',
    breadcrumb: 'Transactions',
    title: 'DigiByte Transactions & Mempool – DigiByte Stats',
    h1: 'DigiByte Transactions',
    description:
      'Live DigiByte (DGB) transactions: the mempool of unconfirmed transactions, recently confirmed transactions, fees and transaction volume.',
    intro:
      'This page shows DigiByte transactions in real time. It lists transactions waiting in the mempool, recently confirmed transactions, fee statistics and transaction volume.',
  },
  {
    path: '/supply',
    group: 'blockchain',
    breadcrumb: 'Supply',
    title: 'DGB Supply & Emission – DigiByte Stats',
    h1: 'DigiByte Supply',
    description:
      'DigiByte (DGB) supply data: coins in circulation, the 21 billion DGB maximum supply, coins left to mine, emission rate and a supply projection.',
    intro:
      'This page shows how many DigiByte (DGB) coins exist today out of the 21 billion maximum supply. It also shows how many coins are left to mine, the current emission rate, supply per person and a projection of future supply.',
  },
  {
    path: '/tips',
    group: 'blockchain',
    breadcrumb: 'Chain Tips & Forks',
    title: 'DigiByte Chain Tips & Orphan Blocks – DigiByte Stats',
    h1: 'DigiByte Chain Tips & Orphans',
    description:
      'Live DigiByte fork monitor: current chain tips, competing branches, orphaned blocks in the last 24 hours, a fork-tree map and 30 days of history.',
    intro:
      'This page watches the DigiByte blockchain for short forks. It shows the current chain tips, competing branches, recent orphaned blocks, a live fork-tree map and a chart of orphans per day for the last 30 days. It also explains why orphans happen on a fast multi-algorithm chain.',
  },
  {
    path: '/nodes',
    group: 'blockchain',
    breadcrumb: 'Nodes',
    title: 'DigiByte Node Map – DigiByte Stats',
    h1: 'DigiByte Nodes Around the World',
    description:
      'World map of DigiByte (DGB) nodes, with node counts by country and the DigiByte Core versions seen on the network in the last 24 hours.',
    intro:
      'This page maps DigiByte nodes around the world. It shows the unique nodes known to a DigiByte node, node counts by country and which DigiByte Core versions were seen in the last 24 hours.',
  },
  {
    path: '/algos',
    group: 'mining',
    breadcrumb: 'Algorithms',
    title: 'DigiByte Mining Algorithms – DigiByte Stats',
    h1: 'DigiByte Mining Algorithms',
    description:
      'How recent DigiByte blocks split across the five mining algorithms: SHA256D, Scrypt, Skein, Qubit and Odocrypt, updated live as blocks arrive.',
    intro:
      'DigiByte is mined with five algorithms: SHA256D, Scrypt, Skein, Qubit and Odocrypt. This page shows how the most recent blocks are shared between them, and it updates as each new block is mined.',
  },
  {
    path: '/difficulties',
    group: 'mining',
    breadcrumb: 'Difficulty',
    title: 'DigiByte Mining Difficulty – DigiByte Stats',
    h1: 'DigiByte Mining Difficulty',
    description:
      'Current DigiByte mining difficulty for each algorithm (SHA256D, Scrypt, Skein, Qubit and Odocrypt), with live charts and DigiShield context.',
    intro:
      "This page shows the current mining difficulty for each of DigiByte's five algorithms, with live charts. DigiByte adjusts the difficulty of each algorithm every block with DigiShield.",
  },
  {
    path: '/hashrate',
    group: 'mining',
    breadcrumb: 'Hashrate',
    title: 'DigiByte Hashrate by Algorithm – DigiByte Stats',
    h1: 'DigiByte Hashrate',
    description:
      'Estimated DigiByte (DGB) network hashrate for each of the five mining algorithms, calculated from current difficulty, with charts.',
    intro:
      "This page estimates the mining power on each DigiByte algorithm. The hashrate is calculated from each algorithm's current difficulty and block rate.",
  },
  {
    path: '/pools',
    group: 'mining',
    breadcrumb: 'Mining Pools',
    title: 'DigiByte Mining Pools – DigiByte Stats',
    h1: 'DigiByte Mining Pools',
    description:
      'Which pools and solo miners are finding DigiByte (DGB) blocks: a live chart of the share of recent blocks found by each pool.',
    intro:
      "This page shows who is mining DigiByte blocks. A live chart shows each pool's share of recent blocks, with lists of the miners that found one or more blocks.",
  },
  {
    path: '/pool-upgrades',
    group: 'mining',
    breadcrumb: 'Pool Upgrades',
    title: 'DigiByte Pool Upgrade Tracker – DigiByte Stats',
    h1: 'DigiByte Pool Upgrade Tracker',
    description:
      'Which DigiByte mining pools run the newest DigiByte Core software, from the version signals in the last 240 blocks, per pool and per algorithm.',
    intro:
      'This page reads the version bits in recent DigiByte blocks to see which mining pools run current DigiByte Core software. It tracks the DigiDollar and Algolock signals and breaks the results down by pool and algorithm.',
  },
  {
    path: '/digidollar',
    group: 'digidollar',
    breadcrumb: 'What is DigiDollar',
    title: 'What Is DigiDollar? – DigiByte Stats',
    h1: 'What Is DigiDollar?',
    description:
      'DigiDollar is a time-locked UTXO stablecoin built into DigiByte Core. Learn how it works, how DGB is locked as collateral, and its risks.',
    intro:
      'DigiDollar is a time-locked UTXO stablecoin built into DigiByte Core. This page explains how it works, how DGB is locked as collateral, the collateral tiers and the risks.',
  },
  {
    path: '/ddstats',
    group: 'digidollar',
    breadcrumb: 'DigiDollar Stats',
    title: 'DigiDollar Network Stats – DigiByte Stats',
    h1: 'DigiDollar Network Stats',
    description:
      'Live DigiDollar network data from DigiByte nodes: total DGB locked as collateral, DigiDollar supply, active positions and system health.',
    intro:
      'This page shows live DigiDollar network data read from DigiByte nodes. It includes the total DGB locked as collateral, the DigiDollar supply, active positions, system health and the status of the DCA and ERR protection systems.',
  },
  {
    path: '/oracles',
    group: 'digidollar',
    breadcrumb: 'Oracles',
    title: 'DigiDollar Oracles – DigiByte Stats',
    h1: 'DigiDollar Oracle Network',
    description:
      'Status of the DigiDollar oracle network on DigiByte: the latest agreed DGB/USD rate, signer count, last update height and each oracle.',
    intro:
      'DigiDollar uses a network of oracles that report the DGB/USD exchange rate, signed with BIP-340 Schnorr signatures. This page shows the latest agreed rate, how many oracles signed it, the block height of the last update and the status of each oracle.',
  },
  {
    path: '/downloads',
    group: 'more',
    breadcrumb: 'Downloads',
    title: 'DigiByte Core Downloads – DigiByte Stats',
    h1: 'DigiByte Core Downloads',
    description:
      'Download counts for DigiByte Core wallet releases on GitHub, broken down by version and by platform: Windows, macOS and Linux.',
    intro:
      'This page shows how many times each DigiByte Core release has been downloaded from GitHub, by version and by platform (Windows, macOS and Linux).',
  },
  {
    path: '/roadmap',
    group: 'more',
    breadcrumb: 'Roadmap',
    title: 'DigiByte Development Roadmap – DigiByte Stats',
    h1: 'DigiByte Development Roadmap',
    description:
      'The DigiByte development roadmap for 2025 to 2029: the planned phases, their priorities and the DigiByte Core features that come next.',
    intro:
      'This page shows the DigiByte development roadmap from 2025 to 2029. It lists the planned phases, their priorities and the features that come next.',
  },
  {
    path: '/taproot',
    group: 'more',
    breadcrumb: 'Taproot',
    title: 'DigiByte Taproot Status – DigiByte Stats',
    h1: 'DigiByte Taproot Status',
    description:
      'Taproot status on the DigiByte (DGB) blockchain: the Taproot soft fork is active and buried, so every DigiByte node enforces it.',
    intro:
      'This page shows the status of the Taproot soft fork on DigiByte. Taproot is active and buried, which means every DigiByte node enforces it from a fixed block height.',
  },
  {
    path: '/activation',
    group: 'digidollar',
    noindex: true,
    breadcrumb: 'Activation',
    title: 'DigiDollar Activation Tracker – DigiByte Stats',
    h1: 'DigiDollar Activation',
    description:
      'BIP9 activation data for the DigiDollar and Algolock soft forks on DigiByte: deployment status, signaling progress and parameters.',
    intro:
      'This page shows BIP9 soft-fork activation data for DigiDollar (bit 23) and Algolock (bit 0) on DigiByte. DigiDollar is now active, and the page stays for old links.',
  },

  // ---------------------------------------------------------------- testnet
  {
    path: '/testnet',
    group: null,
    breadcrumb: 'Testnet',
    title: 'DigiByte Testnet Statistics – DigiByte Stats',
    h1: 'DigiByte Testnet Blockchain Statistics',
    description:
      'Live statistics from the DigiByte testnet: block height, supply, hashrate, difficulty and the newest blocks. Testnet coins are for testing only.',
    intro:
      'This page shows live data from the DigiByte testnet, a separate network for testing software. It shows the block height, supply, hashrate, difficulty and the newest testnet blocks. Testnet coins are for testing only.',
  },
  {
    path: '/testnet/blocks',
    group: 'blockchain',
    breadcrumb: 'Blocks',
    title: 'DigiByte Testnet Blocks – DigiByte Stats',
    h1: 'Latest DigiByte Testnet Blocks',
    description:
      'The newest DigiByte testnet blocks, updated live: block height, mining algorithm, reward, size and miner. Testnet data is for testing only.',
    intro:
      'This page lists the latest blocks on the DigiByte testnet as they are mined. It shows DigiByte testnet data, not mainnet data.',
  },
  {
    path: '/testnet/txs',
    group: 'blockchain',
    breadcrumb: 'Transactions',
    title: 'DigiByte Testnet Transactions – DigiByte Stats',
    h1: 'DigiByte Testnet Transactions',
    description:
      'Live DigiByte testnet transactions: the testnet mempool, recently confirmed testnet transactions, fees and transaction volume.',
    intro:
      'This page shows transactions on the DigiByte testnet in real time: the mempool, recently confirmed transactions, fees and volume. It shows DigiByte testnet data, not mainnet data.',
  },
  {
    path: '/testnet/supply',
    group: 'blockchain',
    breadcrumb: 'Supply',
    title: 'DigiByte Testnet Supply – DigiByte Stats',
    h1: 'DigiByte Testnet Supply',
    description:
      'Coin supply on the DigiByte testnet: testnet coins in circulation, emission and a supply chart. Testnet coins are for testing only.',
    intro:
      'This page shows the coin supply on the DigiByte testnet. Testnet coins are for testing software only, so these numbers are not mainnet DGB supply.',
  },
  {
    path: '/testnet/tips',
    group: 'blockchain',
    breadcrumb: 'Chain Tips & Forks',
    title: 'DigiByte Testnet Chain Tips & Orphans – DigiByte Stats',
    h1: 'DigiByte Testnet Chain Tips & Orphans',
    description:
      'Live fork monitor for the DigiByte testnet: current chain tips, competing branches, orphaned testnet blocks and a fork-tree map.',
    intro:
      'This page watches the DigiByte testnet for short forks. It shows chain tips, competing branches, orphaned blocks and a live fork-tree map from DigiByte testnet data.',
  },
  {
    path: '/testnet/nodes',
    group: 'blockchain',
    breadcrumb: 'Nodes',
    title: 'DigiByte Testnet Node Map – DigiByte Stats',
    h1: 'DigiByte Testnet Nodes',
    description:
      'World map of DigiByte testnet nodes, with node counts by country and the DigiByte Core versions seen on the testnet.',
    intro:
      'This page maps the nodes seen on the DigiByte testnet, with counts by country and DigiByte Core version. It shows DigiByte testnet data, not mainnet data.',
  },
  {
    path: '/testnet/algos',
    group: 'mining',
    breadcrumb: 'Algorithms',
    title: 'DigiByte Testnet Mining Algorithms – DigiByte Stats',
    h1: 'DigiByte Testnet Mining Algorithms',
    description:
      'How recent DigiByte testnet blocks split across the mining algorithms SHA256D, Scrypt, Skein, Qubit and Odocrypt, updated live.',
    intro:
      'This page shows how recent DigiByte testnet blocks are shared between the five mining algorithms. It shows DigiByte testnet data, not mainnet data.',
  },
  {
    path: '/testnet/difficulties',
    group: 'mining',
    breadcrumb: 'Difficulty',
    title: 'DigiByte Testnet Difficulty – DigiByte Stats',
    h1: 'DigiByte Testnet Mining Difficulty',
    description:
      'Current mining difficulty on the DigiByte testnet for each of the five algorithms, with live charts. Testnet data is for testing only.',
    intro:
      'This page shows the current mining difficulty for each algorithm on the DigiByte testnet, with live charts. It shows DigiByte testnet data, not mainnet data.',
  },
  {
    path: '/testnet/hashrate',
    group: 'mining',
    breadcrumb: 'Hashrate',
    title: 'DigiByte Testnet Hashrate – DigiByte Stats',
    h1: 'DigiByte Testnet Hashrate',
    description:
      'Estimated hashrate on the DigiByte testnet for each mining algorithm, calculated from current testnet difficulty, with charts.',
    intro:
      'This page estimates the mining power on each algorithm of the DigiByte testnet from its current difficulty. It shows DigiByte testnet data, not mainnet data.',
  },
  {
    path: '/testnet/pool-upgrades',
    group: 'mining',
    breadcrumb: 'Pool Upgrades',
    title: 'DigiByte Testnet Pool Upgrades – DigiByte Stats',
    h1: 'DigiByte Testnet Pool Upgrade Tracker',
    description:
      'Which miners on the DigiByte testnet run the newest DigiByte Core software, from the version signals in recent testnet blocks.',
    intro:
      'This page reads the version bits in recent DigiByte testnet blocks to see which miners run current DigiByte Core software. It shows DigiByte testnet data, not mainnet data.',
  },
  {
    path: '/testnet/digidollar',
    group: 'digidollar',
    breadcrumb: 'What is DigiDollar',
    title: 'DigiDollar on DigiByte Testnet – DigiByte Stats',
    h1: 'What Is DigiDollar? (Testnet)',
    description:
      'How the DigiDollar time-locked UTXO stablecoin works, shown on the DigiByte testnet, where you can try it with test coins.',
    intro:
      'DigiDollar is a time-locked UTXO stablecoin built into DigiByte Core. This testnet version of the explainer sits next to the DigiByte testnet pages, where it can be tried with test coins.',
  },
  {
    path: '/testnet/ddstats',
    group: 'digidollar',
    breadcrumb: 'DigiDollar Stats',
    title: 'DigiDollar Testnet Stats – DigiByte Stats',
    h1: 'DigiDollar Testnet Stats',
    description:
      'Live DigiDollar data from the DigiByte testnet: DGB locked as collateral, DigiDollar supply, active positions and system health.',
    intro:
      'This page shows live DigiDollar data from the DigiByte testnet: collateral locked, DigiDollar supply, active positions and system health. It shows DigiByte testnet data, not mainnet data.',
  },
  {
    path: '/testnet/oracles',
    group: 'digidollar',
    breadcrumb: 'Oracles',
    title: 'DigiDollar Testnet Oracles – DigiByte Stats',
    h1: 'DigiDollar Testnet Oracle Network',
    description:
      'Status of the DigiDollar oracle network on the DigiByte testnet: the latest agreed rate, signer count, last update and each oracle.',
    intro:
      'This page shows the DigiDollar oracles on the DigiByte testnet: the latest agreed DGB/USD rate, how many oracles signed it and the status of each oracle. It shows DigiByte testnet data, not mainnet data.',
  },
  {
    path: '/testnet/convert',
    group: 'digidollar',
    breadcrumb: 'Wallet Convert',
    title: 'Testnet Oracle Wallet Converter – DigiByte Stats',
    h1: 'DigiByte Testnet Oracle Wallet Converter',
    description:
      'Move a DigiByte oracle wallet.dat between testnets in your browser. The file never leaves your computer. For DigiByte testnet use.',
    intro:
      'This tool converts a DigiByte oracle wallet.dat file from one network to another, such as to the current DigiByte testnet. It runs fully in your browser and never uploads the file.',
  },
  {
    path: '/testnet/taproot',
    group: 'more',
    breadcrumb: 'Taproot',
    title: 'DigiByte Testnet Taproot Status – DigiByte Stats',
    h1: 'DigiByte Testnet Taproot Status',
    description:
      'Taproot status on the DigiByte testnet: the Taproot soft fork is active and buried, so every DigiByte testnet node enforces it.',
    intro:
      'This page shows the status of the Taproot soft fork on the DigiByte testnet. Taproot is active and buried there, as it is on mainnet.',
  },
  {
    path: '/testnet/activation',
    group: 'digidollar',
    noindex: true,
    breadcrumb: 'Activation',
    title: 'DigiDollar Testnet Activation – DigiByte Stats',
    h1: 'DigiDollar Testnet Activation',
    description:
      'BIP9 activation data for the DigiDollar and Algolock soft forks on the DigiByte testnet: deployment status and signaling progress.',
    intro:
      'This page shows BIP9 soft-fork activation data for DigiDollar and Algolock on the DigiByte testnet. It shows DigiByte testnet data, not mainnet data.',
  },
];

/** Page shown for any path not in PAGES. Never indexed. */
export const NOT_FOUND_PAGE = {
  path: null,
  noindex: true,
  title: 'Page Not Found – DigiByte Stats',
  h1: 'Page not found',
  description: 'This page does not exist on DigiByte Stats. Use the links to find live DigiByte blockchain statistics.',
  intro: 'The page you asked for does not exist. It may have moved, or the link may be wrong.',
};

const BY_PATH = new Map(PAGES.map((p) => [p.path, p]));

/** Clean a URL path: drop query/hash and trailing slashes, lower-case it. */
export function normalizePath(pathname) {
  if (typeof pathname !== 'string' || !pathname.startsWith('/')) return null;
  const clean = pathname.split(/[?#]/)[0].replace(/\/+$/, '').toLowerCase();
  return clean || '/';
}

/** The PAGES entry for a URL path, or null. */
export function findPage(pathname) {
  const clean = normalizePath(pathname);
  return (clean && BY_PATH.get(clean)) || null;
}

export function isTestnetPath(path) {
  return path === '/testnet' || (typeof path === 'string' && path.startsWith('/testnet/'));
}

/** Absolute canonical URL for a page path. Home keeps its trailing slash. */
export function canonicalUrl(path) {
  return path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}

/** Pages that belong in the sitemap, llms.txt and static nav. */
export function indexablePages() {
  return PAGES.filter((p) => !p.noindex);
}

/** Breadcrumb trail for a page: [{ name, path }], home first. */
export function breadcrumbTrail(page) {
  const trail = [{ name: 'Home', path: '/' }];
  if (page.path === '/') return trail;
  if (isTestnetPath(page.path)) {
    trail.push({ name: 'Testnet', path: '/testnet' });
    if (page.path === '/testnet') return trail;
  }
  trail.push({ name: page.breadcrumb, path: page.path });
  return trail;
}
