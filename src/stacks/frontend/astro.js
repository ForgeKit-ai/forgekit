import path from 'path';
import fs from 'fs';
import shell from 'shelljs';
import { setupUIFramework } from '../../utils.js';

export async function setupAstro(config) {
  const { targetDir, projectName, ui, backend } = config;
  
  // If there's a backend, create frontend in a subdirectory; otherwise create directly in targetDir
  const frontendDir = backend ? path.join(targetDir, 'frontend') : targetDir;
  const createCommand = backend ? 'npm create astro@latest frontend -- --template minimal' : 'npm create astro@latest . -- --template minimal';
  const parentDir = backend ? targetDir : path.dirname(targetDir);

  console.log('\n▶️ Creating Astro frontend...');
  let result = shell.exec(createCommand, { cwd: parentDir, silent: true });
  if (!result || result.code !== 0) throw new Error(`Failed to create Astro project in ${frontendDir}: ${result.stderr || result.stdout}`);

  result = shell.exec('npm install', { cwd: frontendDir, silent: true });
  if (result.code !== 0) throw new Error(`Failed to install dependencies in ${frontendDir}: ${result.stderr || result.stdout}`);

  // Configure Astro for static deployment
  console.log('  Configuring Astro for deployment...');
  const configPath = path.join(frontendDir, 'astro.config.mjs');
  const astroConfig = `import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  build: {
    format: 'directory'
  }
});`;
  fs.writeFileSync(configPath, astroConfig);
  console.log('  ↳ Configured Astro for static deployment');

  // Verify and ensure build script exists
  console.log('  Verifying build configuration...');
  const pkgJsonPath = path.join(frontendDir, 'package.json');
  if (fs.existsSync(pkgJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
    if (!pkg.scripts || !pkg.scripts.build) {
      pkg.scripts = pkg.scripts || {};
      pkg.scripts.build = 'astro build';
      pkg.scripts.preview = 'astro preview';
      fs.writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2));
      console.log('  ↳ Added missing build script to package.json');
    } else {
      console.log('  ↳ Build script verified in package.json');
    }
  }

  const indexPath = path.join(frontendDir, 'src', 'pages', 'index.astro');
  if (fs.existsSync(indexPath)) {
    const pageContent = `---\n---\n<h1>${projectName} (Astro)</h1>\n<p>Welcome to your new Astro project.</p>`;
    fs.writeFileSync(indexPath, pageContent);
  }

  await setupUIFramework(frontendDir, ui, 'vite');
}
