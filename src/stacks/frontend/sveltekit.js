import path from 'path';
import fs from 'fs';
import shell from 'shelljs';
import { setupSupabase, setupUIFramework } from '../../utils.js';

export async function setupSvelteKit(config) {
  const { targetDir, projectName, ui, backend } = config;
  
  // If there's a backend, create frontend in a subdirectory; otherwise create directly in targetDir
  const frontendDir = backend ? path.join(targetDir, 'frontend') : targetDir;
  const createCommand = backend ? 
    'npm create svelte@latest frontend -- --template skeleton --yes --no-install' : 
    'npm create svelte@latest . -- --template skeleton --yes --no-install';
  const parentDir = backend ? targetDir : path.dirname(targetDir);

  console.log('\n▶️ Creating SvelteKit frontend...');
  let result = shell.exec(createCommand, { cwd: parentDir });
  if (!result || result.code !== 0) throw new Error(`Failed to create SvelteKit project in ${frontendDir}`);


  result = shell.exec('npm install', { cwd: frontendDir, silent: true });
  if (result.code !== 0) throw new Error(`Failed to install dependencies in ${frontendDir}: ${result.stderr || result.stdout}`);

  // Add static adapter for deployment and verify build script
  console.log('  Configuring SvelteKit for deployment...');
  result = shell.exec('npm install -D @sveltejs/adapter-static', { cwd: frontendDir, silent: true });
  if (result.code !== 0) throw new Error(`Failed to install SvelteKit static adapter: ${result.stderr || result.stdout}`);

  // Configure svelte.config.js for static deployment
  const configPath = path.join(frontendDir, 'svelte.config.js');
  const staticConfig = `import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: undefined,
      precompress: false,
      strict: true
    })
  }
};

export default config;`;
  fs.writeFileSync(configPath, staticConfig);
  console.log('  ↳ Configured SvelteKit for static deployment');

  // Verify and ensure build script exists
  const pkgJsonPath = path.join(frontendDir, 'package.json');
  if (fs.existsSync(pkgJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
    if (!pkg.scripts || !pkg.scripts.build) {
      pkg.scripts = pkg.scripts || {};
      pkg.scripts.build = 'vite build';
      pkg.scripts.preview = 'vite preview';
      fs.writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2));
      console.log('  ↳ Added missing build script to package.json');
    } else {
      console.log('  ↳ Build script verified in package.json');
    }
  }

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
