# CHART_DEPLOY.md — Historical charts: deploy notes

Audience: production ops / agent team. What shipped, what to expect, what to watch.

## What shipped
Two repos changed together:
- **dgbstats** (frontend): per-algo **history charts** on the Difficulties, Hashrate, and Algos pages.
  - Difficulties → per-algo difficulty over time (log-scale lines).
  - Hashrate → per-algo network hashrate over time (log-scale lines).
  - Algos → 100% smooth stacked area of block-share per algo over time.
  - Each chart has range buttons **Daily / 7D / 30D / 3M / 6M / 1Y / 3Y** (default **30D**). "Daily" = last 24h at **hourly** granularity. On **1Y / 3Y** a slider under the chart zooms into a sub-period.
- **dgbstats-server** (backend): a new SQLite history store + API that feeds those charts.

## Backend: new `history.db`
- New SQLite file **`history.db`** in the dgbstats-server working directory (gitignored). Tables: `daily_algo_stats` (up to **3 years**) and `hourly_algo_stats` (last ~48h, auto-pruned to ~3 days).
- Data comes from block **HEADERS** (`getblockhash` + `getblockheader`) — so it works on a **pruned node** (headers are never pruned).
- **First start backfills ~3 years (~6.3M headers) in the background.** Expect ~**8–15 min** of elevated RPC to the node — non-blocking (API + WebSocket keep serving; charts fill in progressively: 6M ≈ 1 min, 1Y ≈ 2–3 min, full 3Y ≈ 8–15 min).
- **Restarts are fast**: a `backfill_low_height` cursor (in `history_meta`) skips already-covered days; only new gaps are walked.
- A 60s job then appends new blocks to daily + hourly and prunes old hourly rows. Negligible ongoing cost. `history.db` stays tiny (~a few thousand rows).

## New API endpoints
- `GET /api/history/daily?days=N`  (N clamped **1–1095**)
- `GET /api/history/hourly?hours=N` (N clamped **1–48**)
- plus `/api/testnet/history/{daily,hourly}` twins.
- JSON per bucket, per algo: `{ blocks, avgDifficulty, minDifficulty, maxDifficulty, lastDifficulty, hashrate }`. Daily hashrate = `2^32 * Σdifficulty / 86400`; hourly `/3600`.

## Config / env
- **History is ON by default.** To turn it off: set **`DGB_HISTORY_DISABLED=1`**.
- No other new required config. Uses the existing `DGB_RPC_*` (mainnet) / `DGB_TESTNET_RPC_*` env. Node needs `server=1` + reachable RPC (already required); pruned is fine.
- `history.db*` is gitignored and persistent on disk. Back it up if you want to avoid re-running the 3-year backfill after a volume wipe (otherwise it just re-backfills on next start).

## What to watch
- **First-run backfill** drives sustained RPC to the node for several minutes. Fine for a healthy node; a slow/loaded node just makes the deep backfill take longer (still non-blocking, still safe).
- If a chart shows "History data isn't available yet," either the backfill hasn't reached that range yet or `DGB_HISTORY_DISABLED=1`.
- The `days=1095` daily payload is ~1–2 MB; the frontend fetches it once per page load. Cache it at your proxy/CDN if you want.
- Frontend config unchanged — it talks to the same API base as everything else (`useHistory` → `getApiUrl('/history/...')`, network-aware).

## Incidental fix bundled in
- Fixed a real crash: an orphaned `.finally()` rejection in the **testnet peer fetch** was taking down the whole (mainnet) server whenever the testnet RPC was unreachable. Now non-fatal — testnet-offline just logs and continues.

## Post-deploy smoke check
1. `curl -s "http://<server>/api/history/daily?days=30" | head` → 200 with ~30 day rows.
2. Load `/difficulties`, `/hashrate`, `/algos` → charts render; toggle the range buttons; on **1Y/3Y** drag the slider handles to zoom.
3. Watch the server log for `daily backfill complete` and `Historical stats started`.
