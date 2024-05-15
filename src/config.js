const config = {
    development: {
      apiBaseUrl: 'http://localhost:5001',
      wsBaseUrl: 'ws://localhost:5002',
    },
    production: {
      apiBaseUrl: 'http://digibyte.io',
      wsBaseUrl: 'ws://digibyte.io',
    },
  };
  
  const env = process.env.NODE_ENV || 'development';
  
  export default config[env];