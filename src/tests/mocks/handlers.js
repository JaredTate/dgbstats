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

  // Default handler for unhandled requests
  http.get('*', ({ request }) => {
    console.error(`Unhandled GET request: ${request.url}`);
    return HttpResponse.json({ error: 'Not found' }, { status: 404 });
  }),
];