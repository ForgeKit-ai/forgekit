import path from 'path';
import fs from 'fs';
import shell from 'shelljs';
import { setupSupabase, setupUIFramework } from '../../utils.js';

export async function setupSvelteKit(config) {
  const { targetDir, projectName, ui } = config;
  const frontendDir = path.join(targetDir, 'frontend');

  console.log('\n▶️ Creating SvelteKit frontend...');
  let result = shell.exec(
    `npm create svelte@latest frontend -- --template skeleton --yes --no-install`,
    { cwd: targetDir }
  );
  if (!result || result.code !== 0) throw new Error(`Failed to create SvelteKit project in ${frontendDir}`);


  result = shell.exec('npm install', { cwd: frontendDir, silent: true });
  if (result.code !== 0) throw new Error(`Failed to install dependencies in ${frontendDir}: ${result.stderr || result.stdout}`);

  const pagePath = path.join(frontendDir, 'src', 'routes', '+page.svelte');
  if (fs.existsSync(pagePath)) {
    const content = `<script lang=\"ts\"></script>\n<h1>${projectName} (SvelteKit)</h1>`;
    fs.writeFileSync(pagePath, content);
  }

  if (config.database === 'supabase') {
    await setupSupabase(frontendDir, 'VITE');
  }
  await setupUIFramework(frontendDir, ui, 'vite');
}
