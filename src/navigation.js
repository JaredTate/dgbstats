/**
 * Site navigation: one config for the desktop top bar and the phone bottom bar.
 *
 * Four groups (Blockchain, Mining, DigiDollar, More) plus Home. Every page in
 * App.js is listed exactly once per network (see tests/unit/navigation.test.js),
 * except /activation (DigiDollar is active) and /taproot (linked from pages).
 * Paths here are network-relative; getNavGroups() adds the /testnet prefix.
 */
import HomeIcon from '@mui/icons-material/Home';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import HardwareIcon from '@mui/icons-material/Hardware';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import GridViewIcon from '@mui/icons-material/GridView';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import PieChartIcon from '@mui/icons-material/PieChart';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import PublicIcon from '@mui/icons-material/Public';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import SpeedIcon from '@mui/icons-material/Speed';
import BoltIcon from '@mui/icons-material/Bolt';
import GroupsIcon from '@mui/icons-material/Groups';
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import InsightsIcon from '@mui/icons-material/Insights';
import SensorsIcon from '@mui/icons-material/Sensors';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import DownloadIcon from '@mui/icons-material/Download';
import MapIcon from '@mui/icons-material/Map';
import SearchIcon from '@mui/icons-material/Search';
import HubIcon from '@mui/icons-material/Hub';
import LanguageIcon from '@mui/icons-material/Language';
import GitHubIcon from '@mui/icons-material/GitHub';
import FingerprintIcon from '@mui/icons-material/Fingerprint';

export const HOME_TAB = 'home';
export const HOME_ICON = HomeIcon;

const GROUPS = [
  {
    id: 'blockchain',
    label: 'Blockchain',
    description: 'Blocks, transactions, supply and nodes',
    icon: ViewInArIcon,
    items: [
      { label: 'Blocks', path: '/blocks', icon: GridViewIcon, description: 'The newest blocks, updated live' },
      { label: 'Transactions', path: '/txs', icon: SwapHorizIcon, description: 'Live and recent transactions' },
      { label: 'Supply', path: '/supply', icon: PieChartIcon, description: 'DGB in circulation and left to mine' },
      { label: 'Chain Tips & Forks', path: '/tips', icon: AccountTreeIcon, description: 'Network health, short forks and orphaned blocks' },
      { label: 'Nodes', path: '/nodes', icon: PublicIcon, description: 'World map of DigiByte nodes' },
    ],
  },
  {
    id: 'mining',
    label: 'Mining',
    description: 'Algorithms, difficulty, hashrate and pools',
    icon: HardwareIcon,
    items: [
      { label: 'Algorithms', path: '/algos', icon: DonutLargeIcon, description: 'How blocks split across the 5 algorithms' },
      { label: 'Difficulty', path: '/difficulties', icon: SpeedIcon, description: 'How hard each algorithm is to mine now' },
      { label: 'Hashrate', path: '/hashrate', icon: BoltIcon, description: 'Mining power on each algorithm' },
      { label: 'Mining Pools', path: '/pools', icon: GroupsIcon, description: 'Who is finding the blocks', mainnetOnly: true },
      { label: 'Pool Upgrades', path: '/pool-upgrades', icon: SystemUpdateAltIcon, description: 'Which pools run the newest software' },
    ],
  },
  {
    id: 'digidollar',
    label: 'DigiDollar',
    description: 'The DigiDollar stablecoin',
    icon: AttachMoneyIcon,
    items: [
      { label: 'What is DigiDollar', path: '/digidollar', icon: InfoOutlinedIcon, description: 'How the stablecoin works, and its risks' },
      { label: 'DigiDollar Stats', path: '/ddstats', icon: InsightsIcon, description: 'Collateral, supply and system health' },
      { label: 'Price Oracles', path: '/oracles', icon: SensorsIcon, description: 'The oracles that report the DGB price' },
      { label: 'Wallet Convert', path: '/convert', icon: SyncAltIcon, description: 'Move an oracle wallet between testnets', testnetOnly: true },
    ],
  },
  {
    id: 'more',
    label: 'More',
    description: 'Downloads, roadmap and other DigiByte sites',
    icon: MoreHorizIcon,
    items: [
      { label: 'Downloads', path: '/downloads', icon: DownloadIcon, description: 'Get the DigiByte Core wallet', mainnetOnly: true },
      { label: 'Roadmap', path: '/roadmap', icon: MapIcon, description: 'What is planned next', mainnetOnly: true },
      { label: 'DigiExplorer', path: 'https://digiexplorer.info/', icon: SearchIcon, description: 'Look up any block, transaction or address', external: true },
      { label: 'DigiHash', path: 'https://digihash.digibyte.io/', icon: HubIcon, description: 'DigiByte mining pool', external: true },
      { label: 'DigiByte.org', path: 'https://digibyte.org', icon: LanguageIcon, description: 'The main DigiByte website', external: true },
      { label: 'GitHub', path: 'https://github.com/DigiByte-Core/digibyte', icon: GitHubIcon, description: 'DigiByte Core source code', external: true },
      { label: 'Digi-ID', path: 'https://www.digi-id.io/', icon: FingerprintIcon, description: 'Password-free sign-in', external: true },
      { label: 'DigiScope', path: 'https://digiscope.me/', icon: PublicIcon, description: 'Another DigiByte block explorer', external: true },
    ],
  },
];

/** Join a network base path ('' or '/testnet') and a page path. */
export function withBase(path, basePath = '') {
  if (!path || path === '/') return basePath || '/';
  return `${basePath || ''}${path.startsWith('/') ? path : `/${path}`}`;
}

/** The four menu groups for one network, with network-ready paths. */
export function getNavGroups(isTestnet) {
  const basePath = isTestnet ? '/testnet' : '';
  return GROUPS.map((group) => ({
    ...group,
    items: group.items
      .filter((item) => (isTestnet ? !item.mainnetOnly : !item.testnetOnly))
      .map((item) => (item.external ? { ...item } : { ...item, path: withBase(item.path, basePath) })),
  }));
}

/**
 * Which bottom-bar tab a URL belongs to: HOME_TAB, a group id, or null for a
 * page that is in no menu. Never throws, whatever it is given.
 */
export function findActiveTab(pathname, basePath = '') {
  if (typeof pathname !== 'string') return null;
  const clean = (pathname.split(/[?#]/)[0] || '/').replace(/\/+$/, '') || '/';
  const base = basePath || '';
  if (clean === '/' || clean === base) return HOME_TAB;
  if (base && !clean.startsWith(`${base}/`)) return null;
  const page = clean.slice(base.length);
  const group = GROUPS.find((g) => g.items.some((i) => !i.external && i.path === page));
  return group ? group.id : null;
}
