import path from 'path';
import fs from 'fs';
import shell from 'shelljs';
import { setupUIFramework, setupStorybook } from '../../utils.js';

export async function setupAstro(config) {
  const { targetDir, projectName, ui, storybook } = config;
  const frontendDir = path.join(targetDir, 'frontend');

  console.log('\n▶️ Creating Astro frontend...');
  let result = shell.exec(`npm create astro@latest frontend -- --template minimal`, { cwd: targetDir, silent: true });
  if (!result || result.code !== 0) throw new Error(`Failed to create Astro project in ${frontendDir}`);

  result = shell.exec('npm install', { cwd: frontendDir, silent: true });
  if (result.code !== 0) throw new Error(`Failed to install dependencies in ${frontendDir}`);

  const indexPath = path.join(frontendDir, 'src', 'pages', 'index.astro');
  if (fs.existsSync(indexPath)) {
    const pageContent = `---\n---\n<h1>${projectName} (Astro)</h1>\n<p>Welcome to your new Astro project.</p>`;
    fs.writeFileSync(indexPath, pageContent);
  }

  await setupUIFramework(frontendDir, ui, 'vite');
  if (storybook) {
    await setupStorybook(frontendDir);
  }
}
