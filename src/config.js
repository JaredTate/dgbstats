const config = {
    development: {
      apiBaseUrl: 'https://digibyte.io',
      //  http://localhost:5001
      //  https://digibyte.io
      wsBaseUrl: 'wss://digibyte.io/ws',
      //  ws://localhost:5002
      //  wss://digibyte.io/ws
    },
    production: {
      apiBaseUrl: 'https://digibyte.io',
      wsBaseUrl: 'ws://digibyte.io/ws',
    },
  };
  
  const env = process.env.NODE_ENV || 'development';
  
  export default config[env];