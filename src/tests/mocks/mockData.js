export const mockApiResponses = {
  // Homepage data
  homepageData: {
    difficulty: {
      'sha256d': 12345678.90,
      'scrypt': 234567.89,
      'skein': 345678.90,
      'qubit': 456789.01,
      'odocrypt': 567890.12
    },
    hashrate: {
      'sha256d': 1234567890,
      'scrypt': 234567890,
      'skein': 345678901,
      'qubit': 456789012,
      'odocrypt': 567890123
    },
    supply: {
      current: 16234567890,
      max: 21000000000,
      percentage: 77.31
    },
    blocks: {
      height: 17456789,
      time: 15,
      difficulty: 12345678.90
    },
    nodes: {
      total: 12456,
      countries: 142
    },
    price: {
      usd: 0.00912,
      btc: 0.00000021,
      change24h: 2.34
    },
    softforks: {
      csv: { type: 'buried', since: 1234567 },
      segwit: { type: 'buried', since: 2345678 },
      taproot: { type: 'buried', since: 3456789 }
    }
  },

  // Nodes data
  nodesData: {
    nodes: [
      { ip: '1.2.3.4', lat: 40.7128, lon: -74.0060, country: 'United States', city: 'New York' },
      { ip: '5.6.7.8', lat: 51.5074, lon: -0.1278, country: 'United Kingdom', city: 'London' },
      { ip: '9.10.11.12', lat: 35.6762, lon: 139.6503, country: 'Japan', city: 'Tokyo' },
      { ip: '13.14.15.16', lat: -33.8688, lon: 151.2093, country: 'Australia', city: 'Sydney' },
      { ip: '17.18.19.20', lat: 52.5200, lon: 13.4050, country: 'Germany', city: 'Berlin' },
    ],
    stats: {
      total: 12456,
      countries: 142,
      continents: {
        'North America': 4523,
        'Europe': 3456,
        'Asia': 2345,
        'South America': 1234,
        'Oceania': 678,
        'Africa': 220
      }
    }
  },

  // Pools data
  poolsData: {
    miners: [
      { 
        name: 'DigiHash Pool', 
        address: 'SXk8zJgGBQ5Z1P3V4sH7Cx1M3ZX1YYa9Qw',
        blocks: 2456,
        percentage: 23.45,
        signaling: true
      },
      { 
        name: 'Mining Dutch', 
        address: 'DTm8KnykGLXQaYJuJnJEzfrrkVVGdsE5k3',
        blocks: 1987,
        percentage: 18.97,
        signaling: true
      },
      { 
        name: 'Unknown Miner 1', 
        address: 'DPgY7z5Wdgz5QjQmfKWrFxHe3EULZ9Xfec',
        blocks: 1,
        percentage: 0.01,
        signaling: false
      },
    ],
    totalBlocks: 10476,
    period: '24h'
  },

  // Supply data
  supplyData: {
    current: 16234567890,
    max: 21000000000,
    percentage: 77.31,
    blocksRemaining: 3765432,
    dailyProduction: 72000,
    inflationRate: 0.66,
    marketCap: 148000000,
    perPerson: 2.03,
    timeline: [
      { date: '2014-01-10', supply: 0 },
      { date: '2015-01-10', supply: 2000000000 },
      { date: '2016-01-10', supply: 4000000000 },
      { date: '2017-01-10', supply: 6000000000 },
      { date: '2018-01-10', supply: 8000000000 },
      { date: '2019-01-10', supply: 10000000000 },
      { date: '2020-01-10', supply: 12000000000 },
      { date: '2021-01-10', supply: 13500000000 },
      { date: '2022-01-10', supply: 14800000000 },
      { date: '2023-01-10', supply: 15600000000 },
      { date: '2024-01-10', supply: 16234567890 },
    ]
  },

  // Hashrate data
  hashrateData: {
    total: 23456789012345,
    algorithms: {
      sha256d: {
        hashrate: 12345678901234,
        difficulty: 12345678.90,
        blocks: 123,
        percentage: 52.67
      },
      scrypt: {
        hashrate: 2345678901234,
        difficulty: 234567.89,
        blocks: 98,
        percentage: 10.00
      },
      skein: {
        hashrate: 3456789012345,
        difficulty: 345678.90,
        blocks: 102,
        percentage: 14.74
      },
      qubit: {
        hashrate: 4567890123456,
        difficulty: 456789.01,
        blocks: 87,
        percentage: 19.48
      },
      odocrypt: {
        hashrate: 567890123456,
        difficulty: 567890.12,
        blocks: 71,
        percentage: 2.42
      }
    },
    blockTime: 15,
    blocksPerHour: 240
  },

  // Downloads data
  downloadsData: {
    releases: [
      {
        version: 'v8.22.0',
        date: '2023-12-01',
        downloads: {
          windows: 12345,
          mac: 6789,
          linux: 8901,
          total: 28035
        },
        assets: [
          { name: 'digibyte-8.22.0-win64.zip', download_count: 12345 },
          { name: 'digibyte-8.22.0-osx.dmg', download_count: 6789 },
          { name: 'digibyte-8.22.0-x86_64-linux-gnu.tar.gz', download_count: 8901 }
        ]
      },
      {
        version: 'v7.17.3',
        date: '2022-06-15',
        downloads: {
          windows: 45678,
          mac: 23456,
          linux: 34567,
          total: 103701
        },
        assets: [
          { name: 'digibyte-7.17.3-win64.zip', download_count: 45678 },
          { name: 'digibyte-7.17.3-osx64.tar.gz', download_count: 23456 },
          { name: 'digibyte-7.17.3-x86_64-linux-gnu.tar.gz', download_count: 34567 }
        ]
      }
    ],
    totalDownloads: 131736,
    lastUpdated: '2024-01-15T12:00:00Z'
  },

  // Difficulties data
  difficultiesData: {
    current: {
      sha256d: 12345678.90,
      scrypt: 234567.89,
      skein: 345678.90,
      qubit: 456789.01,
      odocrypt: 567890.12
    },
    history: {
      sha256d: Array.from({ length: 100 }, (_, i) => ({
        height: 17456789 - i * 10,
        difficulty: 12345678.90 + Math.random() * 1000000,
        timestamp: Date.now() - i * 150000
      })),
      scrypt: Array.from({ length: 100 }, (_, i) => ({
        height: 17456789 - i * 10,
        difficulty: 234567.89 + Math.random() * 10000,
        timestamp: Date.now() - i * 150000
      })),
      skein: Array.from({ length: 100 }, (_, i) => ({
        height: 17456789 - i * 10,
        difficulty: 345678.90 + Math.random() * 10000,
        timestamp: Date.now() - i * 150000
      })),
      qubit: Array.from({ length: 100 }, (_, i) => ({
        height: 17456789 - i * 10,
        difficulty: 456789.01 + Math.random() * 10000,
        timestamp: Date.now() - i * 150000
      })),
      odocrypt: Array.from({ length: 100 }, (_, i) => ({
        height: 17456789 - i * 10,
        difficulty: 567890.12 + Math.random() * 10000,
        timestamp: Date.now() - i * 150000
      }))
    }
  },

  // Blocks data
  blocksData: {
    blocks: Array.from({ length: 50 }, (_, i) => ({
      height: 17456789 - i,
      hash: `000000000000000000${i.toString().padStart(6, '0')}abcdef1234567890`,
      time: Date.now() - i * 15000,
      size: 1234 + Math.floor(Math.random() * 1000),
      txCount: 5 + Math.floor(Math.random() * 20),
      poolIdentifier: i % 3 === 0 ? 'DigiHash Pool' : i % 3 === 1 ? 'Mining Dutch' : 'Unknown',
      algo: ['sha256d', 'scrypt', 'skein', 'qubit', 'odocrypt'][i % 5],
      difficulty: 12345678.90 + Math.random() * 1000000,
      taprootSignaling: i % 2 === 0
    })),
    pagination: {
      total: 17456789,
      page: 1,
      perPage: 50
    }
  },

  // Algos data
  algosData: {
    distribution: {
      sha256d: { blocks: 4234, percentage: 42.34 },
      scrypt: { blocks: 1823, percentage: 18.23 },
      skein: { blocks: 1567, percentage: 15.67 },
      qubit: { blocks: 1289, percentage: 12.89 },
      odocrypt: { blocks: 1087, percentage: 10.87 }
    },
    period: '24h',
    totalBlocks: 10000,
    timeline: Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      sha256d: 150 + Math.floor(Math.random() * 50),
      scrypt: 70 + Math.floor(Math.random() * 30),
      skein: 60 + Math.floor(Math.random() * 20),
      qubit: 50 + Math.floor(Math.random() * 20),
      odocrypt: 40 + Math.floor(Math.random() * 20)
    }))
  },

  // Taproot data
  taprootData: {
    activated: true,
    activationHeight: 12345678,
    activationDate: '2023-01-15T00:00:00Z',
    signaling: {
      current: 945,
      required: 900,
      percentage: 94.5,
      threshold: 90
    },
    miners: [
      { name: 'DigiHash Pool', signaling: true, blocks: 234 },
      { name: 'Mining Dutch', signaling: true, blocks: 189 },
      { name: 'DGB Pool', signaling: true, blocks: 156 },
      { name: 'Unknown Miner', signaling: false, blocks: 45 }
    ],
    period: {
      blocks: 1000,
      start: 17456000,
      end: 17457000
    }
  },

  // GitHub releases for downloads page
  githubReleases: [
    {
      id: 1,
      tag_name: 'v8.22.0',
      name: 'DigiByte Core v8.22.0',
      published_at: '2023-12-01T00:00:00Z',
      html_url: 'https://github.com/DigiByte-Core/digibyte/releases/tag/v8.22.0',
      body: 'Release notes for v8.22.0',
      assets: [
        {
          id: 11,
          name: 'digibyte-8.22.0-win64.zip',
          download_count: 12345,
          browser_download_url: 'https://github.com/DigiByte-Core/DigiByte/releases/download/v8.22.0/digibyte-8.22.0-win64.zip'
        },
        {
          id: 12,
          name: 'digibyte-8.22.0-osx.dmg',
          download_count: 6789,
          browser_download_url: 'https://github.com/DigiByte-Core/DigiByte/releases/download/v8.22.0/digibyte-8.22.0-osx.dmg'
        },
        {
          id: 13,
          name: 'digibyte-8.22.0-x86_64-linux-gnu.tar.gz',
          download_count: 8901,
          browser_download_url: 'https://github.com/DigiByte-Core/DigiByte/releases/download/v8.22.0/digibyte-8.22.0-x86_64-linux-gnu.tar.gz'
        }
      ]
    },
    {
      id: 2,
      tag_name: 'v7.17.3',
      name: 'DigiByte Core v7.17.3',
      published_at: '2022-06-15T00:00:00Z',
      html_url: 'https://github.com/DigiByte-Core/digibyte/releases/tag/v7.17.3',
      body: 'Release notes for v7.17.3',
      assets: [
        {
          id: 21,
          name: 'digibyte-7.17.3-win64.zip',
          download_count: 45678,
          browser_download_url: 'https://github.com/DigiByte-Core/DigiByte/releases/download/v7.17.3/digibyte-7.17.3-win64.zip'
        },
        {
          id: 22,
          name: 'digibyte-7.17.3-osx64.tar.gz',
          download_count: 23456,
          browser_download_url: 'https://github.com/DigiByte-Core/DigiByte/releases/download/v7.17.3/digibyte-7.17.3-osx64.tar.gz'
        },
        {
          id: 23,
          name: 'digibyte-7.17.3-x86_64-linux-gnu.tar.gz',
          download_count: 34567,
          browser_download_url: 'https://github.com/DigiByte-Core/DigiByte/releases/download/v7.17.3/digibyte-7.17.3-x86_64-linux-gnu.tar.gz'
        }
      ]
    }
  ]
};

// WebSocket mock data generators
export const generateWebSocketMessage = (type) => {
  switch (type) {
    case 'homepage':
    case 'initialData':
      return {
        type: 'initialData',
        data: {
          blockchainInfo: {
            blocks: mockApiResponses.homepageData.blocks.height,
            difficulty: mockApiResponses.homepageData.blocks.difficulty,
            size_on_disk: 123456789012,
            softforks: mockApiResponses.homepageData.softforks
          },
          chainTxStats: { txcount: 123456789 },
          txOutsetInfo: {
            total_amount: mockApiResponses.homepageData.supply.current,
            ...mockApiResponses.homepageData.supply
          },
          blockReward: 625
        }
      };
    case 'nodes':
      return {
        type: 'nodes',
        data: mockApiResponses.nodesData
      };
    case 'pools':
      return {
        type: 'pools',
        data: mockApiResponses.poolsData
      };
    case 'supply':
      return {
        type: 'supply',
        data: mockApiResponses.supplyData
      };
    case 'hashrate':
      return {
        type: 'hashrate',
        data: mockApiResponses.hashrateData
      };
    case 'difficulties':
      return {
        type: 'difficulties',
        data: mockApiResponses.difficultiesData
      };
    case 'blocks':
    case 'recentBlocks':
      return {
        type: 'recentBlocks',
        data: mockApiResponses.blocksData.blocks
      };
    case 'algos':
      return {
        type: 'algos',
        data: mockApiResponses.algosData
      };
    case 'taproot':
      return {
        type: 'taproot',
        data: mockApiResponses.taprootData
      };
    default:
      return null;
  }
};