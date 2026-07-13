/**
 * BIP9 activation math for the DigiDollar / Algolock soft-fork trackers.
 *
 * Mirrors DigiByte Core's versionbits.cpp state machine. The key subtlety this
 * module fixes: while a deployment is LOCKED_IN it does NOT activate at
 * `min_activation_height`. Per `AbstractThresholdConditionChecker::GetStateFor`
 * (versionbits.cpp), LOCKED_IN progresses to ACTIVE at the FIRST retarget-period
 * boundary after lock-in (`since + period`) — and only once that boundary is at
 * or beyond `min_activation_height`:
 *
 *   case ThresholdState::LOCKED_IN:
 *     if (pindexPrev->nHeight + 1 >= min_activation_height)
 *       stateNext = ThresholdState::ACTIVE;
 *
 * `min_activation_height` is a FLOOR, not the activation height. On mainnet it
 * (23,627,520) was passed long before lock-in, so the real activation height is
 * the next window boundary — showing the floor made the tracker report
 * "0 blocks remaining" while the chain kept advancing.
 */

/** Round a height UP to the nearest BIP9 retarget-period boundary (inclusive). */
export function ceilToPeriod(height, period) {
  if (!period || period <= 0) return height;
  return Math.ceil(height / period) * period;
}

/** Start of the first period strictly after the period that contains `height`. */
export function nextPeriodBoundary(height, period) {
  if (!period || period <= 0) return height;
  return (Math.floor(height / period) + 1) * period;
}

/**
 * Height at which a LOCKED_IN BIP9 deployment becomes ACTIVE.
 *
 * activation = smallest retarget boundary B with B >= (since + period) and
 *              B >= min_activation_height
 *            = max(since + period, ceilToPeriod(min_activation_height))
 *
 * `since` (from getdeploymentinfo's `bip9.since`) is the height at which the
 * LOCKED_IN state began and is itself a period boundary. When `since` is not
 * available (older WebSocket payloads) we fall back to the boundary after the
 * current chain height, which is equivalent while lock-in is in the current
 * window and never overshoots the true activation height.
 *
 * @param {Object} p
 * @param {number} [p.currentHeight]        current chain tip
 * @param {number} p.period                 BIP9 confirmation window (e.g. 40320)
 * @param {number} [p.minActivationHeight]  BIP9 min_activation_height floor
 * @param {number} [p.since]                bip9.since (lock-in window start)
 * @returns {number|null} activation height, or null if period is unusable
 */
export function lockInActivationHeight({ currentHeight, period, minActivationHeight = 0, since } = {}) {
  if (!period || period <= 0) return null;
  const candidates = [ceilToPeriod(minActivationHeight || 0, period)];
  if (Number.isFinite(since) && since >= 0) candidates.push(since + period);
  if (Number.isFinite(currentHeight) && currentHeight > 0) {
    candidates.push(nextPeriodBoundary(currentHeight, period));
  }
  return Math.max(...candidates);
}

/** Blocks between the chain tip and a target height (never negative). */
export function blocksRemaining(targetHeight, currentHeight) {
  if (!Number.isFinite(targetHeight) || !Number.isFinite(currentHeight)) return null;
  return Math.max(0, targetHeight - currentHeight);
}

/** Split a duration in seconds into day/hour/minute/second components. */
export function splitDuration(totalSeconds) {
  const t = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  return {
    days: Math.floor(t / 86400),
    hours: Math.floor((t % 86400) / 3600),
    minutes: Math.floor((t % 3600) / 60),
    seconds: t % 60,
    totalSeconds: t,
  };
}

/** Rough human ETA from a block count at DigiByte's ~15s spacing. */
export function formatEta(blocks, spacingSeconds = 15) {
  if (blocks == null || !Number.isFinite(blocks)) return '—';
  const hours = (blocks * spacingSeconds) / 3600;
  if (hours >= 24) return `~${(hours / 24).toFixed(1)} days`;
  if (hours >= 1) return `~${hours.toFixed(1)} hours`;
  const minutes = (blocks * spacingSeconds) / 60;
  return `~${Math.max(0, Math.round(minutes))} minutes`;
}
