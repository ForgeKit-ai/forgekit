import path from 'path';
import fs from 'fs';
import shell from 'shelljs';
import { setupSupabase, setupUIFramework } from '../../utils.js';

export async function setupReactVite(config) {
  const { targetDir, projectName, ui, backend } = config;
  
  // If there's a backend, create frontend in a subdirectory; otherwise create directly in targetDir
  const frontendDir = backend ? path.join(targetDir, 'frontend') : targetDir;
  const createCommand = backend ? 'npm create vite@latest frontend -- --template react-ts' : 'npm create vite@latest . -- --template react-ts';
  const parentDir = backend ? targetDir : path.dirname(targetDir);

  console.log("\n▶️ Creating frontend with Vite (React + TS)...");
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
  } else if (ui === 'Material') {
      appContent = `import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Container, Typography, Paper, Box } from '@mui/material';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

export function AppContent() {
  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            ${projectName}
          </Typography>
          <Typography variant="h5" component="h2" gutterBottom>
            React + Material-UI
          </Typography>
          <Typography variant="body1">
            Edit <code>src/App.tsx</code> and save to test HMR
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}

export function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppContent />
    </ThemeProvider>
  )
}`;
  } else if (ui === 'shadcn') {
      appContent = `import { useState } from 'react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';

export function App() {
  const [count, setCount] = useState(0);
  
  return (
    <div className="container mx-auto p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">${projectName}</CardTitle>
          <CardDescription>React + shadcn/ui</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Edit <code className="bg-muted px-2 py-1 rounded">src/App.tsx</code> and save to test HMR
          </p>
          <Button onClick={() => setCount(count + 1)} variant="default">
            Count: {count}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
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

  // Configure Vite for production optimization
  console.log('  Configuring Vite for production...');
  const viteConfigPath = path.join(frontendDir, 'vite.config.ts');
  const productionConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
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
