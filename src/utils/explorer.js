/**
 * DigiExplorer links. Testnet lives under /testnet on the same site.
 */
export const EXPLORER_BASE = 'https://digiexplorer.info';

/** Link to a tx, block or address page on DigiExplorer. */
export function explorerUrl(kind, id, isTestnet = false) {
  return `${EXPLORER_BASE}${isTestnet ? '/testnet' : ''}/${kind}/${encodeURIComponent(id)}`;
}

const TXID = /^[0-9a-fA-F]{64}$/;
// bech32 (dgb1…, dgbt1…, dgbrt1…) or base58 (D…, S…, testnet t…/s…/y…).
const BECH32 = /^(dgb|dgbt|dgbrt)1[02-9ac-hj-np-z]{8,87}$/i;
const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{26,35}$/;

/**
 * What a search query looks like: 'tx', 'address' or null.
 * Spaces around the query are ignored.
 */
export function lookupKind(query) {
  const q = (query || '').trim();
  if (TXID.test(q)) return 'tx';
  if (BECH32.test(q) || BASE58.test(q)) return 'address';
  return null;
}
