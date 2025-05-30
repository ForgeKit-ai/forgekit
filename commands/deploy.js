import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const tar = require('tar');
import axios from 'axios';
import FormData from 'form-data';
import { ensureLoggedIn, getSavedUserId, getSavedSafeUserId } from '../src/auth.js';
import inquirer from 'inquirer';
import { generateDockerfile } from '../src/utils/dockerfile.js';
import { generateDockerignore, filesFromDockerignore } from '../src/utils/dockerignore.js';
import { detectEnvVars, loadEnvFiles } from '../src/utils/env.js';

const asyncExec = promisify(exec);

export const command = 'deploy';
export const describe = 'Build, bundle, and deploy to ForgeKit hosting';
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

function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

async function ensureForgeConfig() {
  const forgeConfigPath = path.join(process.cwd(), 'forgekit.json');
  
  if (fs.existsSync(forgeConfigPath)) {
    // Config already exists, check if it has required fields
    try {
      const config = JSON.parse(fs.readFileSync(forgeConfigPath, 'utf-8'));
      if (!config.userId || !config.safeUserId || !config.slug) {
        // Missing required fields, update the config
        const userId = getSavedUserId();
        const safeUserId = getSavedSafeUserId();
        if (!userId || !safeUserId) {
          console.error('❌ User ID not found. Please run `forge login` first.');
          return null;
        }
        
        if (!config.userId) config.userId = userId;
        if (!config.safeUserId) config.safeUserId = safeUserId;
        if (!config.slug) {
          config.slug = config.projectName ? generateSlug(config.projectName) : generateSlug(path.basename(process.cwd()));
        }
        
        fs.writeFileSync(forgeConfigPath, JSON.stringify(config, null, 2));
        console.log('📝 Updated forgekit.json with missing fields');
      }
      return config;
    } catch (err) {
      console.error('❌ Error reading forgekit.json:', err.message);
      return null;
    }
  }
  
  // Generate new forgekit.json
  const userId = getSavedUserId();
  const safeUserId = getSavedSafeUserId();
  if (!userId || !safeUserId) {
    console.error('❌ User ID not found. Please run `forge login` first.');
    return null;
  }
  
  const defaultName = path.basename(process.cwd());
  const defaultSlug = generateSlug(defaultName);
  
  console.log('\n📝 Creating forgekit.json for your project...');
  
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      default: defaultName,
      validate: input => !!input || 'Project name cannot be empty.'
    },
    {
      type: 'input',
      name: 'slug',
      message: 'Project slug (used in URLs):',
      default: answers => generateSlug(answers.projectName || defaultName),
      validate: input => {
        if (!input) return 'Slug cannot be empty.';
        if (!/^[a-z0-9-]+$/.test(input)) return 'Slug can only contain lowercase letters, numbers, and hyphens.';
        return true;
      }
    }
  ]);
  
  const config = {
    userId: userId,
    safeUserId: safeUserId,
    slug: answers.slug,
    projectName: answers.projectName
  };
  
  // Add existing config if available
  const existingConfig = readForgeConfig();
  if (existingConfig.frontend) config.frontend = existingConfig.frontend;
  if (existingConfig.backend) config.backend = existingConfig.backend;
  if (existingConfig.ui) config.ui = existingConfig.ui;
  if (existingConfig.database) config.database = existingConfig.database;
  if (existingConfig.buildDir) config.buildDir = existingConfig.buildDir;
  
  fs.writeFileSync(forgeConfigPath, JSON.stringify(config, null, 2));
  console.log('✅ Created forgekit.json');
  
  return config;
}


export const handler = async (argv = {}) => {
  const token = await ensureLoggedIn();
  if (!token) {
    console.error('❌ Unable to authenticate. Deployment canceled.');
    return;
  }

  const bundlePath = path.join(process.cwd(), 'bundle.tar.gz');

  // Ensure forgekit.json exists and has required fields
  const forgeConfig = await ensureForgeConfig();
  if (!forgeConfig) {
    return;
  }
  
  const slug = forgeConfig.slug;
  if (!slug) {
    console.error('❌ Project slug not found in forgekit.json.');
    return;
  }
  
  let dockerfileGeneratedAndStackName = null; // To store stack name for logging
  let dockerignoreGenerated = false;
  const dockerfilePath = path.join(process.cwd(), 'Dockerfile');
  const dockerignorePath = path.join(process.cwd(), '.dockerignore');

  loadEnvFiles(process.cwd());
  const envVarNames = await detectEnvVars(process.cwd());
  if (envVarNames.length) {
    console.log(`🧪 Injecting the following build-time environment variables: ${envVarNames.join(', ')}`);
  } else {
    console.log('🧪 No build-time environment variables detected.');
  }
  const envPairs = {};
  for (const name of envVarNames) {
    envPairs[name] = process.env[name];
  }

  try {
    // Dockerfile generation logic
    if (!fs.existsSync(dockerfilePath)) {
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

      const dockerfileContent = generateDockerfile(stackForDockerfile, envVarNames);
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

    console.log('📦 Bundling project root into bundle.tar.gz using .dockerignore rules...');
    const filesToBundle = await filesFromDockerignore(process.cwd());
    await tar.c({ gzip: true, file: bundlePath, cwd: process.cwd() }, filesToBundle);

    if (dockerfileGeneratedAndStackName) {
      console.log(`🛠️ Generating Dockerfile for stack: ${dockerfileGeneratedAndStackName}`);
    }

    console.log('🚀 Uploading bundle...');
    const form = new FormData();
    form.append('bundle', fs.createReadStream(bundlePath));
    form.append('slug', slug);
    if (Object.keys(envPairs).length) {
      form.append('env', JSON.stringify(envPairs));
    }
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
