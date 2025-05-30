import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const tar = require('tar');
import { generateDockerfile } from '../src/utils/dockerfile.js';
import { generateDockerignore, filesFromDockerignore } from '../src/utils/dockerignore.js';
import { detectEnvVars, loadEnvFiles } from '../src/utils/env.js';

const asyncExec = promisify(exec);

export const command = 'build';
export const describe = 'Build project and create bundle.tar.gz without deploying';
export const builder = {};

function readForgeConfig() {
  const cfgPath = path.join(process.cwd(), 'forgekit.json');
  if (fs.existsSync(cfgPath)) {
    try {
      return JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
    } catch {}
  }
  return {};
}

function detectStackType() {
  const cwd = process.cwd();
  
  // Check for Next.js
  if (fs.existsSync(path.join(cwd, 'next.config.js')) || 
      fs.existsSync(path.join(cwd, 'next.config.mjs'))) {
    return 'nextjs';
  }
  
  // Check for Vite-based projects
  if (fs.existsSync(path.join(cwd, 'vite.config.js')) || 
      fs.existsSync(path.join(cwd, 'vite.config.ts'))) {
    // Check package.json to determine specific framework
    const pkgPath = path.join(cwd, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (deps['react']) return 'react-vite';
        if (deps['vue']) return 'vue-vite';
        if (deps['svelte']) return 'svelte-vite';
      } catch {}
    }
    return 'vite';
  }
  
  // Check for SvelteKit
  if (fs.existsSync(path.join(cwd, 'svelte.config.js'))) {
    return 'sveltekit';
  }
  
  // Check for Astro
  if (fs.existsSync(path.join(cwd, 'astro.config.mjs'))) {
    return 'astro';
  }
  
  // Check for other framework-specific files
  const forgeConfig = readForgeConfig();
  if (forgeConfig.frontend) {
    return forgeConfig.frontend;
  }
  
  return null;
}

function getBuildCommand(stackType) {
  const useYarn = fs.existsSync('yarn.lock');
  const npmCmd = useYarn ? 'yarn' : 'npm run';
  
  switch (stackType) {
    case 'nextjs':
      return `${npmCmd} build`;
    case 'react-vite':
    case 'vue-vite':
    case 'vite':
      return `${npmCmd} build`;
    case 'sveltekit':
      return `${npmCmd} build`;
    case 'astro':
      return `${npmCmd} build`;
    case 'blazor':
      return 'dotnet publish -c Release -o dist';
    case 'godot':
      return 'godot --export-release "HTML5" dist/index.html';
    default:
      return `${npmCmd} build`;
  }
}

export const handler = async (argv = {}) => {
  const forgeKitDir = path.join(process.cwd(), '.forgekit');
  const bundlePath = path.join(forgeKitDir, 'bundle.tar.gz');
  
  try {
    // Create .forgekit directory if it doesn't exist
    if (!fs.existsSync(forgeKitDir)) {
      fs.mkdirSync(forgeKitDir, { recursive: true });
    }
    
    // Detect stack type
    const stackType = detectStackType();
    if (!stackType) {
      console.error('❌ Could not detect project stack type. Make sure you have a valid project configuration.');
      return;
    }
    
    console.log(`🔍 Detected stack: ${stackType}`);
    
    // Load environment variables
    loadEnvFiles(process.cwd());
    const envVarNames = await detectEnvVars(process.cwd());
    if (envVarNames.length) {
      console.log(`🧪 Detected build-time environment variables: ${envVarNames.join(', ')}`);
    }
    
    // Run build command
    const buildCmd = getBuildCommand(stackType);
    console.log(`🏗️ Building project with: ${buildCmd}`);
    await asyncExec(buildCmd);
    console.log('✅ Build completed successfully');
    
    // Generate .dockerignore if needed
    const dockerignorePath = path.join(process.cwd(), '.dockerignore');
    let dockerignoreGenerated = false;
    
    if (!fs.existsSync(dockerignorePath)) {
      const forgeConfig = readForgeConfig();
      let stackName = forgeConfig.stack || forgeConfig.frontend || forgeConfig.backend || stackType;
      
      let nextStandalone = false;
      if (stackName.startsWith('nextjs') && fs.existsSync('next.config.js')) {
        const nextCfg = fs.readFileSync('next.config.js', 'utf-8');
        nextStandalone = /output\s*:\s*['\"]standalone['\"]/.test(nextCfg);
      }
      
      const diContent = generateDockerignore(stackName, { nextStandalone });
      fs.writeFileSync(dockerignorePath, diContent);
      dockerignoreGenerated = true;
    }
    
    // Bundle project
    console.log('📦 Creating bundle.tar.gz...');
    const filesToBundle = await filesFromDockerignore(process.cwd());
    await tar.c({ gzip: true, file: bundlePath, cwd: process.cwd() }, filesToBundle);
    
    // Get bundle size
    const stats = fs.statSync(bundlePath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`✅ Bundle created successfully at: ${bundlePath}`);
    console.log(`📏 Bundle size: ${sizeInMB} MB`);
    
    // Validate bundle contents
    console.log('🔍 Validating bundle contents...');
    const buildDirMap = {
      'react-vite': 'dist',
      'vue-vite': 'dist',
      'sveltekit': 'build',
      'nextjs': '.next',
      'astro': 'dist',
      'blazor': 'dist',
      'godot': 'dist'
    };
    
    const expectedBuildDir = buildDirMap[stackType] || 'dist';
    const buildDirExists = fs.existsSync(path.join(process.cwd(), expectedBuildDir));
    
    if (!buildDirExists) {
      console.warn(`⚠️ Warning: Expected build directory '${expectedBuildDir}' not found. Bundle may be incomplete.`);
    } else {
      console.log(`✅ Build output directory '${expectedBuildDir}' included in bundle`);
    }
    
    // Clean up temporary .dockerignore if generated
    if (dockerignoreGenerated && fs.existsSync(dockerignorePath)) {
      try {
        fs.unlinkSync(dockerignorePath);
      } catch (err) {
        console.warn(`⚠️ Could not remove auto-generated .dockerignore: ${err.message}`);
      }
    }
    
  } catch (err) {
    console.error('❌ Build failed:', err.message || err);
    process.exit(1);
  }
};