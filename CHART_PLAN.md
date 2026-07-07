# CHART_PLAN.md — Historical daily per-algo charts

Adds **30-day (and growing) daily history charts** to the Difficulties, Hashrate, and Algos pages,
backed by a new SQLite DB in `dgbstats-server` that is backfilled from block headers and accumulated
live going forward.

## Determination 1 — how far back can we go? (verified on the live node)

The charts need only **block headers**, and a pruned node keeps **every header back to genesis** — only
block *data* is pruned.

- `getblockheader <hash>` works for any height (verified at height 1 = 2014-01-10) on the pruned node.
- Each header carries everything we need: `time`, `difficulty` (per-algo), **`pow_algo`** (native algo
  field — no version-bit decoding), `bits`, `chainwork`, `nTx`.
- `getnetworkhashps(n, height)` also works at historical heights.
- **Data ceiling = genesis (Jan 2014, ~26M blocks).** The only real cost is the one-time chain walk to
  backfill; we start with **30 days** (~172,800 blocks) and the mechanism extends to any depth later.

## Determination 2 — what we store

DigiByte retargets difficulty **every block, per algo** (DigiShield/MultiShield), so a day's value is only
meaningful as an **average over all of that algo's blocks that UTC day** (plus min/max/last for range).

New SQLite DB **`history.db`** in `dgbstats-server`:

```sql
CREATE TABLE IF NOT EXISTS daily_algo_stats (
  network        TEXT NOT NULL,   -- 'mainnet' | 'testnet'
  day            TEXT NOT NULL,   -- 'YYYY-MM-DD' (UTC)
  algo           TEXT NOT NULL,   -- canonical, from getAlgoName(pow_algo)
  block_count    INTEGER NOT NULL,
  sum_difficulty REAL NOT NULL,   -- Σ difficulty over the day's blocks for this algo
  min_difficulty REAL NOT NULL,
  max_difficulty REAL NOT NULL,
  last_difficulty REAL NOT NULL,  -- difficulty of the highest block that day/algo
  last_height    INTEGER NOT NULL,
  PRIMARY KEY (network, day, algo)
);
CREATE TABLE IF NOT EXISTS history_meta (
  network TEXT PRIMARY KEY,
  last_height INTEGER NOT NULL,   -- highest block folded into the aggregates
  backfill_done INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);
```

Derived in the API (single source of truth for the formula; recomputable if inputs change):
- `avgDifficulty = sum_difficulty / block_count`
- `hashrate = 2^32 * sum_difficulty / 86400`
  (this is exactly HashratePage's `(blocks/48)·avgDiff·2^32/75` generalized to a 1-day window:
  `hashrate = Σdiff · 2^32 / windowSeconds`).

## Backend (dgbstats-server) — Wave 1

New module `history.js`:
- **DB layer**: `new sqlite3.Database('history.db')`, `CREATE TABLE IF NOT EXISTS`, promisified
  `run/all/get` helpers (mirror `crawler.js`). Add `history.db*` to `.gitignore`.
- **Aggregation** (pure, unit-tested): `foldHeaders(rows) -> Map<day, Map<algo, agg>>` from
  `[{ time, difficulty, algo }]`. `algo = getAlgoName(pow_algo)` (reuse the existing helper so it matches
  the live block pipeline). UTC day = `new Date(time*1000).toISOString().slice(0,10)`.
- **Backfill**: on startup, background (non-blocking), walk the last 30 days by height
  (`getblockhash(h)` → `getblockheader(hash)`, bounded concurrency ~12), upsert daily rows
  (`INSERT ... ON CONFLICT(network,day,algo) DO UPDATE`), set `history_meta.last_height = tip`,
  `backfill_done = 1`. Idempotent + resumable.
- **Incremental updater**: every 60s, fetch headers for `history_meta.last_height+1 .. tip` (usually a
  few blocks), fold into their UTC-day rows (upsert), advance `last_height`. Re-derives the current +
  previous day cleanly on restart.
- **RPC**: use the existing `sendRpcRequest` / `sendTestnetRpcRequest` from `rpc.js`.
- **Endpoints** (mirror the chaintips pattern — register both):
  - `GET /api/history/daily?days=30` (mainnet)
  - `GET /api/testnet/history/daily?days=30` (testnet)
- **Tests** (vitest, TDD): `foldHeaders` day/algo bucketing + min/max/last; avg + hashrate derivation;
  endpoint response shape. Mock RPC (no live node in tests).
- Update `dgbstats-server/ARCHITECTURE.md` + `REPO_MAP.md`.

### API contract
```jsonc
GET /api/history/daily?days=30   ->
{
  "network": "mainnet",
  "days": 30,
  "generatedAt": 1751846400,
  "algos": ["SHA256D","Scrypt","Skein","Qubit","Odo"],   // active algos present (+ retired if any)
  "data": [
    { "date": "2026-06-08", "partial": false, "totalBlocks": 5740,
      "perAlgo": {
        "SHA256D": { "blocks": 1150, "avgDifficulty": 3.9e8, "minDifficulty": 3.4e8,
                     "maxDifficulty": 4.4e8, "lastDifficulty": 3.6e8, "hashrate": 1.7e13 },
        "Scrypt":  { ... }, "Skein": { ... }, "Qubit": { ... }, "Odo": { ... }
      }
    }
    // ... oldest → newest; final entry is today, "partial": true
  ]
}
```

## Frontend (dgbstats) — Waves 2 (three separate commits)

**Shared infra** (built first):
- `useDailyHistory(days)` hook — network-aware fetch via `getApiUrl('/history/daily?days=' + days)`,
  returns `{ data, algos, loading, error }`.
- `HistoryChart` component (Chart.js + luxon time scale) with two modes:
  - `mode="lines-log"` — one line per algo, logarithmic y-axis, hover tooltip, legend toggle.
  - `mode="stacked-100"` — 100% stacked area of per-day shares.
  - Props: `data`, `algos`, `series(dayEntry, algo) -> number`, `valueFormat`, `colors`, `title`,
    `yLabel`, range selector (7d / 30d), responsive + accessible (colorblind-safe legend, aria).
  - Colors reuse the existing `algoColors` map. Follow the **dataviz skill**.

Per page (each = its own commit):
1. **DifficultiesPage** — "Difficulty history (30 days)": `lines-log`, 5 active algos (exclude Groestl),
   plots daily **average**; subtitle notes "daily average — DigiByte retargets every block". Optional min–max band.
2. **HashratePage** — "Hashrate history (30 days)": `lines-log`, per-algo `hashrate`, 5 active algos, H/s units.
3. **AlgosPage** — "Algorithm distribution (30 days)": `stacked-100` of daily block share per algo;
   **includes Groestl** (retired, brown) for the historical days it existed → visibly fades to 0 at the
   backstop (height 23,808,000).

Tests (vitest): render + data-mapping + range-switch with mock history data.
Update `dgbstats/ARCHITECTURE.md` + `REPO_MAP.md`.

## Orchestration & commits
- **Wave 1**: backend (`dgbstats-server`) — 1 commit in that repo.
- **Wave 2**: shared infra + 3 charts — **3 separate commits** in `dgbstats` (difficulty, hashrate, algos).
- **Visual QA in Chrome** against the live server with real 30-day data before each frontend commit.

## Decisions (v2 — confirmed)
- Backfill depth: **3 years (1095 days)** of daily data (smart gap backfill, resumable); plus an **hourly rollup** of the last ~48h.
- Range buttons on every chart: **Daily / 7D / 30D / 3M / 6M / 1Y / 3Y**, **default 30D**.
- On **1Y / 3Y** a brush **slider** under the chart zooms into a sub-period.
- Algo distribution is a **smooth 100% stacked area** (monotone, pre-stacked cumulative).
- See **CHART_DEPLOY.md** for production deploy notes (backfill timing, config, what to watch).
  - **Daily** = last 24h at **hourly** granularity (endpoint `/api/history/hourly?hours=24`).
  - 7D / 30D / 3M = daily granularity (`/api/history/daily?days=90`, sliced client-side).
- Difficulty & Hashrate charts: multi-line, **log** y-axis, daily average (hourly average in Daily view).
- Algo distribution: **100% stacked BAR** (reliable in Chart.js), Groestl included historically.
- History **enabled by default** in the server (opt-out via `DGB_HISTORY_DISABLED=1`).
- Network: **mainnet first**; testnet endpoints wired, populate when its RPC is reachable.

## Shared frontend infra (v2)
- `useHistory({days:90, hours:24})` → `{ daily, hourly, algos, loading, error }` (fetches both; hourly best-effort).
- `HistoryChart` owns the range selector; exports pure `resolveView` / `bucketLabel` / `HISTORY_RANGES`
  (unit-tested). `mode="lines-log"` → `type:'line'` (log y); `mode="stacked-100"` → `type:'bar'` (stacked, 0–100%).
