const config = {
    development: {
      apiBaseUrl: 'http://localhost:5001',
      wsBaseUrl: 'ws://localhost:5002',
    },
    production: {
      apiBaseUrl: 'http://digibyte.io:5001',
      wsBaseUrl: 'ws://digibyte.io:5002',
    },
  };
  
  const env = process.env.NODE_ENV || 'production';
  
  export default config[env];