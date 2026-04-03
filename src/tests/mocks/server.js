import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Setup mock server with API handlers
export const server = setupServer(...handlers);
