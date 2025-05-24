import { setupReactVite } from '../stacks/frontend/react-vite.js';
import { setupNextJS } from '../stacks/frontend/nextjs.js';

export const frontendStacks = {
  'react-vite': { setup: setupReactVite },
  'nextjs': { setup: setupNextJS }
};
