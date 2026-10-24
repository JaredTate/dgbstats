/**
 * Fuzz test for the home page tiles ("every tile is a door").
 *
 * A seeded PRNG builds random, missing and garbage `initialData` payloads
 * (undefined, null, NaN, Infinity, huge numbers, strings, empty objects,
 * arrays, nested junk). After each payload the page must still render and
 * every tile must still link to the right place. The seed is fixed, so a
 * failure is repeatable: the failing iteration and payload are in the message.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderWithProviders, createWebSocketMock, waitForAsync } from '../../utils/testUtils';
import { formatNumber, numberWithCommas } from '../../../utils';
import HomePage from '../../../pages/HomePage';

const ITERATIONS = 200;
const MESSAGES_PER_MOUNT = 10;

// mulberry32: tiny seeded PRNG, no dependencies.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const EXPECTED = {
  mainnet: {
    'Total Blocks': '/blocks',
    'Total Transactions': '/txs',
    'Total Size': '/nodes',
    'Current Circulating Supply': '/supply',
    'Remaining Supply To Be Mined': '/supply',
    'Last Block Reward': '/blocks',
    'Algo Difficulties': '/difficulties',
    'Latest Version': '/downloads',
    'Active Softforks': '/pool-upgrades'
  },
  testnet: {
    'Total Blocks': '/testnet/blocks',
    'Total Transactions': '/testnet/txs',
    'Total Size': '/testnet/nodes',
    'Current Circulating Supply': '/testnet/supply',
    'Remaining Supply To Be Mined': '/testnet/supply',
    'Last Block Reward': '/testnet/blocks',
    'Algo Difficulties': '/testnet/difficulties',
    'Latest Version': 'https://github.com/DigiByte-Core/digibyte/releases',
    'Active Softforks': '/testnet/pool-upgrades',
    'Testnet26 DigiDollar Status': '/testnet/digidollar'
  }
};

function makeGen(rand) {
  const pick = (list) => list[Math.floor(rand() * list.length)];
  const chance = (p) => rand() < p;

  const scalar = () => pick([
    () => undefined,
    () => null,
    () => NaN,
    () => Infinity,
    () => -Infinity,
    () => 0,
    () => -1,
    () => 1e308,
    () => Number.MAX_SAFE_INTEGER * 1e6,
    () => rand() * 1e12,
    () => -rand() * 1e6,
    () => '',
    () => 'abc',
    () => '12345',
    () => '<script>x</script>',
    () => true,
    () => false,
    () => ({}),
    () => [],
    () => [1, 'two', null]
  ])();

  const junk = (depth = 0) => {
    if (depth > 2 || chance(0.6)) return scalar();
    if (chance(0.5)) return Array.from({ length: Math.floor(rand() * 3) }, () => junk(depth + 1));
    const obj = {};
    const n = Math.floor(rand() * 4);
    for (let i = 0; i < n; i += 1) obj[pick(['status', 'active', 'type', 'bip9', 'x', 'value'])] = junk(depth + 1);
    return obj;
  };

  // Mostly the right shape, with random holes and garbage values.
  const maybe = (good) => (chance(0.5) ? good() : junk());

  const deployment = () => maybe(() => ({
    type: maybe(() => pick(['buried', 'bip9'])),
    active: maybe(() => chance(0.5)),
    bip9: maybe(() => ({ status: maybe(() => pick(['started', 'defined', 'locked_in'])) }))
  }));

  const payload = () => maybe(() => {
    const data = {};
    if (chance(0.8)) {
      data.blockchainInfo = maybe(() => ({
        blocks: maybe(() => Math.floor(rand() * 3e7)),
        size_on_disk: maybe(() => rand() * 1e11),
        difficulties: maybe(() => ({
          sha256d: junk(), scrypt: junk(), skein: junk(), qubit: junk(), odo: junk(), odocrypt: junk()
        }))
      }));
    }
    if (chance(0.8)) data.chainTxStats = maybe(() => ({ txcount: maybe(() => Math.floor(rand() * 1e9)) }));
    if (chance(0.8)) data.txOutsetInfo = maybe(() => ({ total_amount: maybe(() => rand() * 2.1e10) }));
    if (chance(0.8)) data.blockReward = maybe(() => rand() * 1000);
    if (chance(0.8)) {
      data.deploymentInfo = maybe(() => ({
        deployments: maybe(() => {
          const d = {};
          const n = Math.floor(rand() * 5);
          for (let i = 0; i < n; i += 1) d[pick(['csv', 'segwit', 'taproot', 'digidollar', 'algolock', ''])] = deployment();
          return d;
        })
      }));
    }
    return data;
  });

  // The whole message can be garbage too, not just its data.
  const message = () => (chance(0.9) ? { type: 'initialData', data: payload() } : junk());

  return { message, pick };
}

describe('Home tiles fuzz', () => {
  let wsSetup;

  beforeEach(() => {
    wsSetup = createWebSocketMock();
    global.WebSocket = wsSetup.MockWebSocket;
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    wsSetup.instances.forEach((ws) => ws.close());
    wsSetup.clearInstances();
    vi.restoreAllMocks();
  });

  const tileHrefs = (container) => {
    const map = {};
    container.querySelectorAll('a').forEach((a) => {
      const title = (a.getAttribute('aria-label') || '').split(':')[0];
      map[title] = a.getAttribute('href');
    });
    return map;
  };

  it(`never throws and keeps every tile link right over ${ITERATIONS} random payloads`, async () => {
    const rand = mulberry32(0xd16b7e);
    const gen = makeGen(rand);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    for (let mount = 0; mount < ITERATIONS / MESSAGES_PER_MOUNT; mount += 1) {
      const network = mount % 2 === 0 ? 'mainnet' : 'testnet';
      const { container, unmount } = renderWithProviders(
        <HomePage numberWithCommas={numberWithCommas} formatNumber={formatNumber} />,
        { network }
      );
      await waitForAsync();
      const ws = wsSetup.instances[wsSetup.instances.length - 1];

      for (let i = 0; i < MESSAGES_PER_MOUNT; i += 1) {
        const iteration = mount * MESSAGES_PER_MOUNT + i;
        const msg = gen.message();
        const context = `iteration ${iteration} (${network}) payload ${JSON.stringify(msg)}`;

        expect(() => ws.receiveMessage(msg), context).not.toThrow();
        expect(container.querySelector('h1'), context).not.toBeNull();
        expect(tileHrefs(container), context).toEqual(EXPECTED[network]);
      }
      unmount();
    }

    // React logs render crashes through console.error; there must be none.
    const crashes = consoleError.mock.calls.filter((args) => /error|uncaught/i.test(String(args[0])));
    expect(crashes).toEqual([]);
  }, 120000);
});
