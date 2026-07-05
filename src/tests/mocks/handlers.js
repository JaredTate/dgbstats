import { http, HttpResponse } from 'msw';
import { mockApiResponses } from './mockData';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

export const handlers = [
  // Homepage API endpoints
  http.get(`${API_BASE_URL}/api/homepage-data`, () => {
    return HttpResponse.json(mockApiResponses.homepageData);
  }),

  // Nodes API endpoints
  http.get(`${API_BASE_URL}/api/nodes`, () => {
    return HttpResponse.json(mockApiResponses.nodesData);
  }),

  // Version breakdown of nodes seen in the last 24 hours
  // (REST twin of the `nodeVersions24h` WebSocket message)
  http.get(`${API_BASE_URL}/api/nodes/versions24h`, () => {
    return HttpResponse.json(mockApiResponses.nodeVersions24hData);
  }),

  // Pools API endpoints
  http.get(`${API_BASE_URL}/api/pools`, () => {
    return HttpResponse.json(mockApiResponses.poolsData);
  }),

  // Supply API endpoints
  http.get(`${API_BASE_URL}/api/supply`, () => {
    return HttpResponse.json(mockApiResponses.supplyData);
  }),

  // Hashrate API endpoints
  http.get(`${API_BASE_URL}/api/hashrate`, () => {
    return HttpResponse.json(mockApiResponses.hashrateData);
  }),

  // Downloads API endpoints
  http.get(`${API_BASE_URL}/api/downloads`, () => {
    return HttpResponse.json(mockApiResponses.downloadsData);
  }),

  // Difficulties API endpoints
  http.get(`${API_BASE_URL}/api/difficulties`, () => {
    return HttpResponse.json(mockApiResponses.difficultiesData);
  }),

  // Blocks API endpoints
  http.get(`${API_BASE_URL}/api/blocks`, () => {
    return HttpResponse.json(mockApiResponses.blocksData);
  }),

  // Algos API endpoints
  http.get(`${API_BASE_URL}/api/algos`, () => {
    return HttpResponse.json(mockApiResponses.algosData);
  }),

  // Taproot API endpoints
  http.get(`${API_BASE_URL}/api/taproot`, () => {
    return HttpResponse.json(mockApiResponses.taprootData);
  }),

  // GitHub releases API
  http.get('https://api.github.com/repos/:owner/:repo/releases', ({ params }) => {
    const { owner, repo } = params;
    if (owner === 'DigiByte-Core' && repo === 'DigiByte') {
      return HttpResponse.json(mockApiResponses.githubReleases);
    }
    return HttpResponse.json([]);
  }),

  // TxOutsetInfo endpoint for SupplyPage (handles both port 3001 and 5001)
  http.get('http://localhost:5001/api/gettxoutsetinfo', () => {
    return HttpResponse.json({
      total_amount: 15700000000,
      height: 18000000,
      bestblock: "0000000000000000000000000000000000000000000000000000000000000000",
      txouts: 15000000,
      bogosize: 1000000000
    });
  }),

  http.get('http://localhost:5001/api/getblockchaininfo', () => {
    return HttpResponse.json({
      blocks: 17456789,
      difficulty: 12345678.9,
      size_on_disk: 123456789012,
      difficulties: {}
    });
  }),

  http.get('http://localhost:5001/api/getchaintxstats', () => {
    return HttpResponse.json({ txcount: 123456789 });
  }),

  http.get('http://localhost:5001/api/getblockreward', () => {
    return HttpResponse.json({ blockReward: { blockreward: 625 } });
  }),

  // BIP9 deployment info (PoolUpgradeTrackerPage / DDActivationPage poll this)
  http.get('http://localhost:5001/api/getdeploymentinfo', () => {
    return HttpResponse.json(mockApiResponses.deploymentInfo);
  }),

  http.get('http://localhost:5001/api/testnet/getdeploymentinfo', () => {
    return HttpResponse.json(mockApiResponses.deploymentInfo);
  }),

  http.get('http://localhost:5001/api/visitstats', () => {
    return HttpResponse.json({ visitsLast30Days: 0, totalVisits: 0, uniqueVisitors: 0 });
  }),

  // Handle any other endpoint on port 5001
  http.get('http://localhost:5001/*', ({ request }) => {
    console.error(`Unhandled GET request on port 5001: ${request.url}`);
    return HttpResponse.json({ error: 'Not found' }, { status: 404 });
  }),

  // Default handler for unhandled requests
  http.get('*', ({ request }) => {
    console.error(`Unhandled GET request: ${request.url}`);
    return HttpResponse.json({ error: 'Not found' }, { status: 404 });
  }),
];
