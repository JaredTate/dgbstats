import { useState, useEffect } from 'react';
import { useNetwork } from '../context/NetworkContext';

/**
 * useHistory — fetch both the daily (up to 90 days) and hourly (last 24h) per-algo
 * history series for the current network, so the chart's range selector
 * (Daily / 7D / 30D / 3M) can switch instantly client-side.
 *
 * Endpoints (network-aware via getApiUrl):
 *   GET /api/history/daily?days=90   → daily aggregates (entries keyed by `date`)
 *   GET /api/history/hourly?hours=24 → hourly aggregates (entries keyed by `hour`)
 *
 * @param {object} [opts]
 * @param {number} [opts.days=6000] daily depth to request. 6000 (~16y) reaches
 *   genesis (2014-01-10), so the "5Y" and "All" ranges have full data; the
 *   server clamps to what it has backfilled. Sliced client-side per range.
 * @param {number} [opts.hours=24]  hourly depth to request
 * @returns {{ daily:Array, hourly:Array, algos:string[], loading:boolean, error:string|null }}
 */
export const useHistory = ({ days = 6000, hours = 24 } = {}) => {
  const { getApiUrl } = useNetwork();
  const [state, setState] = useState({
    daily: [], hourly: [], algos: [], loading: true, error: null,
  });

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));

    const getJson = (url) => fetch(url).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    });

    Promise.all([
      getJson(getApiUrl(`/history/daily?days=${days}`)),
      // Hourly is best-effort: if it 404s / errors, we still show the daily ranges.
      getJson(getApiUrl(`/history/hourly?hours=${hours}`)).catch(() => ({ data: [], algos: [] })),
    ])
      .then(([daily, hourly]) => {
        if (!alive) return;
        // Union of algos present in either series, preserving the daily order.
        const algos = Array.from(new Set([...(daily.algos || []), ...(hourly.algos || [])]));
        setState({
          daily: Array.isArray(daily.data) ? daily.data : [],
          hourly: Array.isArray(hourly.data) ? hourly.data : [],
          algos,
          loading: false,
          error: null,
        });
      })
      .catch((err) => {
        if (!alive) return;
        setState({ daily: [], hourly: [], algos: [], loading: false, error: err.message });
      });

    return () => { alive = false; };
  }, [getApiUrl, days, hours]);

  return state;
};

export default useHistory;
