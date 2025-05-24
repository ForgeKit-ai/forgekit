import { setupReactVite } from '../stacks/frontend/react-vite.js';
import { setupNextJS } from '../stacks/frontend/nextjs.js';
import { setupVueVite } from '../stacks/frontend/vue-vite.js';
import { setupSvelteKit } from '../stacks/frontend/sveltekit.js';
import { setupAstro } from '../stacks/frontend/astro.js';
import { setupBlazor } from '../stacks/frontend/blazor.js';
import { setupGodot } from '../stacks/frontend/godot.js';

export const frontendStacks = {
  'react-vite': { setup: setupReactVite },
  'nextjs': { setup: setupNextJS },
  'vue-vite': { setup: setupVueVite },
  'sveltekit': { setup: setupSvelteKit },
  'astro': { setup: setupAstro },
  'blazor': { setup: setupBlazor },
  'godot': { setup: setupGodot }
};
