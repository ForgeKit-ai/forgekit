import path from 'path';
import fs from 'fs';
import shell from 'shelljs';
import { setupSupabase, setupUIFramework } from '../../utils.js';

export async function setupVueVite(config) {
  const { targetDir, projectName, ui, backend } = config;
  
  // If there's a backend, create frontend in a subdirectory; otherwise create directly in targetDir
  const frontendDir = backend ? path.join(targetDir, 'frontend') : targetDir;
  const createCommand = backend ? 'npm create vite@latest frontend -- --template vue-ts' : 'npm create vite@latest . -- --template vue-ts';
  const parentDir = backend ? targetDir : path.dirname(targetDir);

  console.log('\n▶️ Creating frontend with Vite (Vue + TS)...');
  let result = shell.exec(createCommand, { cwd: parentDir, silent: true });
  if (!result || result.code !== 0) throw new Error(`Failed to create Vite project in ${frontendDir}: ${result.stderr || result.stdout}`);

  try { fs.rmSync(path.join(frontendDir, '.gitignore'), { force: true }); } catch {}
  try { fs.rmSync(path.join(frontendDir, 'README.md'), { force: true }); } catch {}

  console.log('  Installing frontend dependencies...');
  result = shell.exec('npm install', { cwd: frontendDir, silent: true });
  if (result.code !== 0) throw new Error(`Failed to install frontend dependencies in ${frontendDir}: ${result.stderr || result.stdout}`);

  // Verify and ensure build script exists
  console.log('  Verifying build configuration...');
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

  const appVuePath = path.join(frontendDir, 'src', 'App.vue');
  const mainTsPath = path.join(frontendDir, 'src', 'main.ts');
  const cssPath = path.join(frontendDir, 'src', 'style.css');

  let appContent = `<template>\n  <h1>${projectName} (Vue Frontend)</h1>\n</template>\n<script setup lang="ts"></script>\n`;
  if (ui === 'Chakra') {
    appContent = `<template>\n  <ChakraProvider><Box p=\"4\"><Heading mb=\"4\">${projectName} (Vue + Chakra)</Heading></Box></ChakraProvider>\n</template>\n<script setup lang="ts">\nimport { ChakraProvider, Box, Heading } from '@chakra-ui/vue-next';\n</script>\n`;
  }
  if (fs.existsSync(appVuePath)) {
    fs.writeFileSync(appVuePath, appContent);
  }

  if (!fs.existsSync(cssPath)) {
    fs.writeFileSync(cssPath, 'body { margin: 0; font-family: sans-serif; }\n');
  }

  if (fs.existsSync(mainTsPath)) {
    let mainContent = fs.readFileSync(mainTsPath, 'utf-8');
    if (ui === 'Chakra') {
      mainContent = `import { createApp } from 'vue';\n` +
        `import App from './App.vue';\n` +
        `import { ChakraPlugin } from '@chakra-ui/vue-next';\n` +
        `import './style.css';\n\n` +
        `const app = createApp(App);\n` +
        `app.use(ChakraPlugin);\n` +
        `app.mount('#app');\n`;
    }
    fs.writeFileSync(mainTsPath, mainContent);
  }

  // Configure Vite for production optimization
  console.log('  Configuring Vite for production...');
  const viteConfigPath = path.join(frontendDir, 'vite.config.ts');
  const productionConfig = `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue'],
        },
      },
    },
  },
  server: {
    port: 3000,
  },
  preview: {
    port: 3000,
  },
})`;
  fs.writeFileSync(viteConfigPath, productionConfig);
  console.log('  ↳ Configured Vite for optimized builds');

  if (config.database === 'supabase') {
    await setupSupabase(frontendDir, 'VITE');
  }
  await setupUIFramework(frontendDir, ui, 'vite');
}
