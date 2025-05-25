import path from "path";
import { frontendStacks } from './registries/frontend.js';
import { backendStacks } from './registries/backend.js';
import { uiFrameworks } from './registries/ui.js';

export async function scaffoldProject(config) {
  const { frontend, backend, ui, targetDir } = config;

  if (frontendStacks[frontend]) await frontendStacks[frontend].setup(config);
  // Individual frontend stacks handle UI framework installation via
  // `setupUIFramework` internally.
  // if (uiFrameworks[ui]) await uiFrameworks[ui].install(frontend === 'nextjs' ? targetDir : path.join(targetDir, 'frontend'), frontend);
  if (backend && backendStacks[backend]) await backendStacks[backend].setup(config);
}
