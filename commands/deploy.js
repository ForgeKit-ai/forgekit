import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const tar = require('tar');
import axios from 'axios';
import FormData from 'form-data';
import { ensureLoggedIn } from '../src/auth.js';
import { generateDockerfile } from '../src/utils/dockerfile.js';
import { generateDockerignore } from '../src/utils/dockerignore.js';

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
  const token = await ensureLoggedIn();
  if (!token) {
    console.error('❌ Unable to authenticate. Deployment canceled.');
    return;
  }

  const bundlePath = path.join(process.cwd(), 'bundle.tar.gz');
  const buildDir = detectBuildDir(argv);

  // Determine project slug from forgekit.json
  let slug;
  const forgeConfigPath = path.join(process.cwd(), 'forgekit.json');
  if (!fs.existsSync(forgeConfigPath)) {
    console.error('❌ Cannot detect project slug—missing forgekit.json in the project root.');
    return;
  }
  try {
    const forgeConfig = JSON.parse(fs.readFileSync(forgeConfigPath, 'utf-8'));
    slug = forgeConfig.projectName || forgeConfig.slug;
    if (!slug) {
      console.error('❌ Project slug not found in forgekit.json.');
      return;
    }
  } catch (error) {
    console.error(`❌ Error reading or parsing forgekit.json: ${error.message}`);
    return;
  }
  
  let dockerfileGeneratedAndStackName = null; // To store stack name for logging
  let dockerignoreGenerated = false;
  const dockerfilePath = path.join(process.cwd(), 'Dockerfile');
  const dockerignorePath = path.join(process.cwd(), '.dockerignore');

  try {
    // Dockerfile generation logic
    if (!fs.existsSync(dockerfilePath)) {
      const forgeConfig = readForgeConfig();
      let stackForDockerfile;

      if (forgeConfig && Object.keys(forgeConfig).length > 0) {
        if (forgeConfig.stack) {
          stackForDockerfile = forgeConfig.stack;
        } else if (forgeConfig.frontend) {
          stackForDockerfile = forgeConfig.frontend;
          if (forgeConfig.backend) {
            stackForDockerfile += ` + ${forgeConfig.backend}`;
          }
        } else if (forgeConfig.backend) {
          stackForDockerfile = forgeConfig.backend;
        }
      }

      if (!stackForDockerfile) {
        throw new Error('❌ forgekit.json is missing, malformed, or does not contain stack information. Cannot auto-generate Dockerfile.');
      }

      const dockerfileContent = generateDockerfile(stackForDockerfile);
      if (dockerfileContent) {
        fs.writeFileSync(dockerfilePath, dockerfileContent);
        dockerfileGeneratedAndStackName = stackForDockerfile; // Store for logging
      } else {
        // Log a warning if Dockerfile couldn't be generated for a supposedly supported stack
        console.warn(`⚠️ Could not generate Dockerfile for stack: ${stackForDockerfile}. This stack might not be supported for auto-generation or an internal issue occurred.`);
      }

    }

    // Dockerignore generation logic (always run once per deploy)
    if (!fs.existsSync(dockerignorePath)) {
      const forgeConfig = readForgeConfig();
      let stackName = forgeConfig.stack || forgeConfig.frontend || forgeConfig.backend;
      if (!stackName) {
        stackName = 'node';
      }
      let nextStandalone = false;
      if (stackName.startsWith('nextjs') && fs.existsSync('next.config.js')) {
        const nextCfg = fs.readFileSync('next.config.js', 'utf-8');
        nextStandalone = /output\s*:\s*['\"]standalone['\"]/.test(nextCfg);
      }
      const diContent = generateDockerignore(stackName, { nextStandalone });
      fs.writeFileSync(dockerignorePath, diContent);
      dockerignoreGenerated = true;
    }

    const useYarn = fs.existsSync('yarn.lock');
    const buildCmd = useYarn ? 'yarn build' : 'npm run build';
    console.log('🏗️ Building project...');
    await asyncExec(buildCmd);

    if (!fs.existsSync(buildDir)) {
      console.error(`❌ Build directory '${buildDir}' not found. Did you run the build step?`);
      return;
    }

    console.log(`📦 Bundling ${buildDir}/ into bundle.tar.gz...`);
    const filesToBundle = [buildDir];

    // Always include core project metadata files
    ['package.json', 'package-lock.json', 'yarn.lock'].forEach(file => {
      if (fs.existsSync(file)) filesToBundle.push(file);
    });

    // Include common Next.js/Frontend assets when present
    if (fs.existsSync('next.config.js')) filesToBundle.push('next.config.js');
    if (fs.existsSync('public')) filesToBundle.push('public');

    // Include Dockerfile if it exists or was auto-generated
    if (fs.existsSync(dockerfilePath)) {
      filesToBundle.push('Dockerfile');
    }
    if (fs.existsSync(dockerignorePath)) {
      filesToBundle.push('.dockerignore');
    }

    await tar.c({ gzip: true, file: bundlePath }, filesToBundle);

    if (dockerfileGeneratedAndStackName) {
      console.log(`🛠️ Generating Dockerfile for stack: ${dockerfileGeneratedAndStackName}`);
    }

    console.log('🚀 Uploading bundle...');
    const form = new FormData();
    form.append('bundle', fs.createReadStream(bundlePath));
    form.append('slug', slug);
    const deployUrl = process.env.FORGEKIT_DEPLOY_URL || 'http://178.156.171.10:3001/deploy_cli';
    const res = await axios.post(deployUrl, form, {
      headers: { ...form.getHeaders(), Authorization: `Bearer ${token}` },
    });
    const url = res.data && res.data.url;
    console.log(`Deployed at: ${url}`);
  } catch (err) {
    if (err.response && err.response.status === 401) {
      console.error('❌ Deployment failed: unauthorized. Try running `forge login` again.');
    } else {
      console.error('❌ Deployment failed:', err.message || err);
      if (err.response) {
        if (err.response.status) {
          console.error(`HTTP Status: ${err.response.status}`);
        }
        if (err.response.data) {
          console.error('Server response:', err.response.data);
        }
      }
    }
  } finally {
    try {
      fs.unlinkSync(bundlePath);
    } catch {}
    // Delete Dockerfile if it was generated by this command
    if (dockerfileGeneratedAndStackName && fs.existsSync(dockerfilePath)) {
      try {
        fs.unlinkSync(dockerfilePath);
        // console.log('🗑️ Auto-generated Dockerfile removed.'); // Optional: for verbose logging
      } catch (err) {
        console.warn(`⚠️ Could not remove auto-generated Dockerfile: ${err.message}`);
      }
    }
    if (dockerignoreGenerated && fs.existsSync(dockerignorePath)) {
      try {
        fs.unlinkSync(dockerignorePath);
      } catch (err) {
        console.warn(`⚠️ Could not remove auto-generated .dockerignore: ${err.message}`);
      }
    }
  }
};
