import path from 'path';
import fs from 'fs';
import shell from 'shelljs';
import { setupSupabase, setupUIFramework, setupStorybook } from '../../utils.js';

export async function setupSvelteKit(config) {
  const { targetDir, projectName, ui, storybook } = config;
  const frontendDir = path.join(targetDir, 'frontend');

  console.log('\n▶️ Creating SvelteKit frontend...');
  let result = shell.exec(`npm create svelte@latest frontend -- --template skeleton`, { cwd: targetDir, silent: true });
  if (!result || result.code !== 0) throw new Error(`Failed to create SvelteKit project in ${frontendDir}`);

  result = shell.exec('npm install', { cwd: frontendDir, silent: true });
  if (result.code !== 0) throw new Error(`Failed to install dependencies in ${frontendDir}`);

  const pagePath = path.join(frontendDir, 'src', 'routes', '+page.svelte');
  if (fs.existsSync(pagePath)) {
    const content = `<script lang=\"ts\"></script>\n<h1>${projectName} (SvelteKit)</h1>`;
    fs.writeFileSync(pagePath, content);
  }

  await setupSupabase(frontendDir, 'VITE');
  await setupUIFramework(frontendDir, ui, 'vite');
  if (storybook) {
    await setupStorybook(frontendDir);
  }
}
