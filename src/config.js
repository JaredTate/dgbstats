const config = {
    development: {
      apiBaseUrl: 'http://digibyte.io',
      wsBaseUrl: 'ws://digibyte.io/ws',
    },
    production: {
      apiBaseUrl: 'http://digibyte.io',
      wsBaseUrl: 'ws://digibyte.io/ws',
    },
  };
  
  const env = process.env.NODE_ENV || 'development';
  
  export default config[env];