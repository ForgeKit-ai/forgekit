import { setupExpressBackend } from '../stacks/backend/express.js';

export const backendStacks = {
  'express': { setup: setupExpressBackend }
};
