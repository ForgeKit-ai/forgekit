import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const tar = require('tar');
import axios from 'axios';
import FormData from 'form-data';

const asyncExec = promisify(exec);

export const command = 'deploy';
export const describe = 'Build, bundle, and deploy to ForgeKit hosting';
export const builder = {
  'build-dir': {
    type: 'string',
    describe: 'Directory containing build output',
  },
};

function readForgeConfig() {
  const cfgPath = path.join(process.cwd(), 'forgekit.json');
  if (fs.existsSync(cfgPath)) {
    try {
      return JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
    } catch {}
  }
  return {};
}

function detectBuildDir(argv) {
  if (argv.buildDir) return argv.buildDir;
  const cfg = readForgeConfig();
  if (cfg.buildDir) return cfg.buildDir;
  const map = {
    'react-vite': 'dist',
    'vue-vite': 'dist',
    'sveltekit': 'build',
    'nextjs': '.next',
    'astro': 'dist',
    'blazor': 'dist',
    'godot': 'dist',
  };
  if (cfg.frontend && map[cfg.frontend]) return map[cfg.frontend];
  const guesses = ['dist', 'build', '.next', 'out'];
  return guesses.find(d => fs.existsSync(d)) || 'dist';
}

export const handler = async (argv = {}) => {
  const bundlePath = path.join(process.cwd(), 'bundle.tar.gz');
  const buildDir = detectBuildDir(argv);
  try {
    const useYarn = fs.existsSync('yarn.lock');
    const buildCmd = useYarn ? 'yarn build' : 'npm run build';
    console.log('🏗️ Building project...');
    await asyncExec(buildCmd);

    if (!fs.existsSync(buildDir)) {
      console.error(`❌ Build directory '${buildDir}' not found. Did you run the build step?`);
      return;
    }

    console.log(`📦 Bundling ${buildDir}/ into bundle.tar.gz...`);
    await tar.c({ gzip: true, file: bundlePath }, [buildDir]);

    console.log('🚀 Uploading bundle...');
    const form = new FormData();
    form.append('file', fs.createReadStream(bundlePath));
    const deployUrl = process.env.FORGEKIT_DEPLOY_URL || 'http://178.156.171.10:3001/deploy_cli';
    const res = await axios.post(deployUrl, form, {
      headers: form.getHeaders(),
    });
    const url = res.data && res.data.url;
    console.log(`Deployed at: ${url}`);
  } catch (err) {
    console.error('❌ Deployment failed:', err.message || err);
  } finally {
    try {
      fs.unlinkSync(bundlePath);
    } catch {}
  }
};
