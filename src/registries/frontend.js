import { setupReactVite } from '../stacks/frontend/react-vite.js';
import { setupNextJS } from '../stacks/frontend/nextjs.js';
import { setupVueVite } from '../stacks/frontend/vue-vite.js';
import { setupSvelteKit } from '../stacks/frontend/sveltekit.js';
import { setupAstro } from '../stacks/frontend/astro.js';
import { setupAngular } from '../stacks/frontend/angular.js';

export const frontendStacks = {
  'react-vite': { setup: setupReactVite },
  'nextjs': { setup: setupNextJS },
  'vue-vite': { setup: setupVueVite },
  'sveltekit': { setup: setupSvelteKit },
  'astro': { setup: setupAstro },
  'angular': { setup: setupAngular }
};
