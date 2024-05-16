const config = {
    development: {
      apiBaseUrl: 'http://localhost:5001',
      //  http://localhost:5001
      //  https://digibyte.io
      wsBaseUrl: 'ws://localhost:5002/ws',
      //  ws://localhost:5002
      //  ws://digibyte.io/ws
    },
    production: {
      apiBaseUrl: 'https://digibyte.io',
      wsBaseUrl: 'ws://digibyte.io/ws',
    },
  };
  
  const env = process.env.NODE_ENV || 'development';
  
  export default config[env];