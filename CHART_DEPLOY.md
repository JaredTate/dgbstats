# CHART_DEPLOY.md — Historical charts: deploy notes

Audience: production ops / agent team. What shipped, what to expect, what to watch.

## What shipped
Two repos changed together:
- **dgbstats** (frontend): per-algo **history charts** on the Difficulties, Hashrate, and Algos pages.
  - Difficulties → per-algo difficulty over time (log-scale lines).
  - Hashrate → per-algo network hashrate over time (log-scale lines).
  - Algos → 100% smooth stacked area of block-share per algo over time.
  - Each chart has range buttons **Daily / 7D / 30D / 3M / 6M / 1Y / 3Y / 5Y / All** (default **30D**). "Daily" = last 24h at **hourly** granularity; **All** = full history back to genesis (2014-01-10). On **1Y / 3Y / 5Y / All** a slider under the chart zooms into a sub-period.
  - **Mining-era overlays (5Y / All):** vertical dashed **era divider lines with labels along the bottom** (MultiAlgo, MultiShield, DigiSpeed, Odocrypt) plus an **era explainer** beneath the chart. On the All view the Algos chart visibly shows the chain's history — single-algo **Scrypt** at launch (2014) → 5 algos (MultiAlgo, Sep 2014) → **Groestl→Odocrypt** swap (Jul 2019). Retired **Myriad-Groestl** appears on the deep ranges (its 2014-2019 era) and is auto-hidden on recent ranges.
- **dgbstats-server** (backend): a new SQLite history store + API that feeds those charts.

## Backend: new `history.db`
- New SQLite file **`history.db`** in the dgbstats-server working directory (gitignored). Tables: `daily_algo_stats` (now back to **genesis / 2014**) and `hourly_algo_stats` (last ~48h, auto-pruned to ~3 days).
- Data comes from block **HEADERS** (`getblockhash` + `getblockheader`) — so it works on a **pruned node** (headers are never pruned). This includes the earliest eras (pre-MultiAlgo Scrypt, Groestl) — the `pow_algo` header field is present at every height.
- **⚠️ First start now backfills the ENTIRE chain (~23.8M headers, block 0 → tip) in the background — expect ~1.5–3 hours** of elevated RPC to the node at ~4k headers/sec (was ~8–15 min for the old 3-year depth). It is **non-blocking**: API + WebSocket keep serving and the charts fill in **progressively, newest-first** — 30D/3M within a minute or two, 1Y/3Y within ~10–20 min, the **Jul-2019 Odocrypt boundary** (first era divider on All) around the ~1-hour mark, full genesis last. `DAILY_BACKFILL_DAYS = 6000` (~16y) pins the deep-walk target to block 0; backfill concurrency is **16**.
- **Restarts are fast**: a `backfill_low_height` cursor (in `history_meta`) skips already-covered days; only the remaining older gap is walked. A restart mid-backfill resumes from where it left off (does **not** re-walk).
- A 60s job then appends new blocks to daily + hourly and prunes old hourly rows. Negligible ongoing cost. `history.db` stays small (~25–30k daily rows for all-time).

## New API endpoints
- `GET /api/history/daily?days=N`  (N clamped **1–6000**; the frontend requests `days=6000` = All and slices client-side)
- `GET /api/history/hourly?hours=N` (N clamped **1–48**)
- plus `/api/testnet/history/{daily,hourly}` twins.
- JSON per bucket, per algo: `{ blocks, avgDifficulty, minDifficulty, maxDifficulty, lastDifficulty, hashrate }`. Daily hashrate = `2^32 * Σdifficulty / 86400`; hourly `/3600`.

## Config / env
- **History is ON by default.** To turn it off: set **`DGB_HISTORY_DISABLED=1`**.
- No other new required config. Uses the existing `DGB_RPC_*` (mainnet) / `DGB_TESTNET_RPC_*` env. Node needs `server=1` + reachable RPC (already required); pruned is fine.
- `history.db*` is gitignored and persistent on disk. Back it up if you want to avoid re-running the **full-chain backfill** (~1.5–3h, back to genesis) after a volume wipe (otherwise it just re-backfills from scratch on next start).

## What to watch
- **First-run backfill** now drives sustained RPC to the node for **~1.5–3 hours** (full-chain, ~23.8M headers). Fine for a healthy node; a slow/loaded node just makes the deep walk take longer (still non-blocking, still safe). If you'd rather not run the deep walk on a given host, set `DGB_HISTORY_DISABLED=1`.
- The **5Y / All era divider lines + explainer** only appear once the backfill has reached the relevant dates — All shows its first divider (Odocrypt, Jul 2019) around the ~1-hour mark and the full 5-era picture once the walk reaches 2014. Until then All simply shows the days backfilled so far (correct, just shorter).
- If a chart shows "History data isn't available yet," either the backfill hasn't reached that range yet or `DGB_HISTORY_DISABLED=1`.
- The `days=6000` (All) daily payload is ~**2–4 MB** (~4,500 day-rows × per-algo); the frontend fetches it **once** per page load and slices every range client-side. Cache it at your proxy/CDN if you want (it changes at most once/day per row).
- Frontend config unchanged — it talks to the same API base as everything else (`useHistory` → `getApiUrl('/history/...')`, network-aware).

## Incidental fix bundled in
- Fixed a real crash: an orphaned `.finally()` rejection in the **testnet peer fetch** was taking down the whole (mainnet) server whenever the testnet RPC was unreachable. Now non-fatal — testnet-offline just logs and continues.

## Post-deploy smoke check
1. `curl -s "http://<server>/api/history/daily?days=30" | head` → 200 with ~30 day rows.
2. Load `/difficulties`, `/hashrate`, `/algos` → charts render; toggle the range buttons **Daily … All**; on **1Y/3Y/5Y/All** drag the slider handles to zoom.
3. Once the backfill is deep enough, open **All**: confirm vertical **era divider lines with bottom labels** and the **era explainer** cards; on Algos/All confirm the stacked area starts as 100% Scrypt in 2014 and shows the Groestl→Odocrypt swap at Jul 2019.
4. Check **mobile** (narrow viewport): fewer x-axis ticks, era cards wrap to one column, chart stays legible.
5. Watch the server log for `deep daily backfill complete down to height 0` and `Historical stats started`. Progress lines read `deep daily backfill: heights A..B (walked/total)`.
