import path from 'path';
import fs from 'fs';
import shell from 'shelljs';
import { setupSupabase, setupUIFramework } from '../../utils.js';

export async function setupReactVite(config) {
  const { targetDir, projectName, ui } = config;
  const frontendDir = path.join(targetDir, 'frontend');

  console.log("\n▶️ Creating frontend with Vite (React + TS)...");
  let result = shell.exec(`npm create vite@latest frontend -- --template react-ts`, { cwd: targetDir, silent: true });
  if (!result || result.code !== 0) throw new Error(`Failed to create Vite project in ${frontendDir}: ${result.stderr || result.stdout}`);

  try { fs.rmSync(path.join(frontendDir, '.gitignore'), { force: true }); } catch {}
  try { fs.rmSync(path.join(frontendDir, 'README.md'), { force: true }); } catch {}

  console.log('  Installing frontend dependencies...');
  result = shell.exec('npm install', { cwd: frontendDir, silent: true });
  if (result.code !== 0) throw new Error(`Failed to install frontend dependencies in ${frontendDir}: ${result.stderr || result.stdout}`);

  const appTsxPath = path.join(frontendDir, 'src', 'App.tsx');
  const mainTsxPath = path.join(frontendDir, 'src', 'main.tsx');
  const indexCssPath = path.join(frontendDir, 'src', 'index.css');

  let appContent = `// import { useState } from 'react'

export function App() {
  return (
    <>
      <h1>${projectName} (React Frontend)</h1>
      <p>Edit <code>src/App.tsx</code> and save to test HMR</p>
    </>
  )
}`;
  if (ui === 'Chakra') {
      appContent = `import { ChakraProvider, Box, Heading, Text } from '@chakra-ui/react';

export function AppContent() {
  return (
    <Box p={4}>
      <Heading mb={4}>${projectName} (React + Chakra)</Heading>
      <Text>Edit <code>src/App.tsx</code> and save to test HMR</Text>
    </Box>
  );
}

export function App() {
    return (
        <ChakraProvider>
            <AppContent />
        </ChakraProvider>
    )
}`;
  }
  fs.writeFileSync(appTsxPath, appContent);

  let mainContent = `import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);`;
  fs.writeFileSync(mainTsxPath, mainContent);

  if (!fs.existsSync(indexCssPath)) {
    fs.writeFileSync(indexCssPath, 'body { margin: 0; font-family: sans-serif; }\n');
  }

  if (config.database === 'supabase') {
    await setupSupabase(frontendDir, 'VITE');
  }
  await setupUIFramework(frontendDir, ui, 'vite');
}
