import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const tar = require('tar');
import FormData from 'form-data';
import { ensureLoggedIn } from '../src/auth.js';
import { secureClient } from '../src/secureClient.js';
import { ProgressIndicator } from '../src/progressIndicator.js';
import { validateDeployReadiness, verifyBuildOutput } from '../src/utils.js';

const asyncExec = promisify(exec);

// Enhanced error handling utilities
function getHelpfulErrorMessage(error, context) {
  const errorMessages = {
    'npm run build': {
      'Missing script': 'Your package.json is missing a "build" script. Add one with: npm run build',
      'Module not found': 'Some dependencies are missing. Try running: npm install',
      'Permission denied': 'Permission denied. Try running with elevated permissions or check file ownership.',
      'ENOENT': 'Command not found. Make sure all required tools are installed.',
    },
    'authentication': {
      'unauthorized': 'Authentication failed. Try running: forge login',
      'expired': 'Your login session has expired. Please run: forge login',
    },
    'upload': {
      'ECONNRESET': 'Upload failed due to network issues. Please check your internet connection and try again.',
      'timeout': 'Upload timed out. Your project might be too large or your connection is slow.',
      '413': 'Your project is too large for deployment. Try optimizing your build output.',
      '429': 'Rate limit exceeded. Please wait a few minutes and try again.',
    }
  };

  const contextMessages = errorMessages[context] || {};
  const errorString = error.toString();
  
  for (const [key, message] of Object.entries(contextMessages)) {
    if (errorString.includes(key)) {
      return message;
    }
  }
  
  return null;
}

async function retryOperation(operation, maxRetries = 3, delayMs = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      console.warn(`⚠️ Attempt ${attempt} failed, retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      delayMs *= 2; // Exponential backoff
    }
  }
}

export const command = 'deploy';
export const describe = 'Build, bundle, and deploy to ForgeKit hosting';
export const builder = {
  'build-dir': {
    type: 'string',
    describe: 'Directory containing build output',
  },
  verbose: {
    type: 'boolean',
    alias: 'v',
    default: false,
    describe: 'Show detailed deployment progress and debugging information'
  },
  'skip-build': {
    type: 'boolean',
    default: false,
    describe: 'Skip the build step (use existing build output)'
  },
  'dry-run': {
    type: 'boolean',
    default: false,
    describe: 'Show what would be deployed without actually deploying'
  }
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
  
  // Handle both v1 and v2 forgekit.json formats
  if (cfg.build?.buildDir) return cfg.build.buildDir;
  if (cfg.buildDir) return cfg.buildDir; // Legacy v1 format
  
  const map = {
    'react-vite': 'dist',
    'vue-vite': 'dist',
    'sveltekit': 'build',
    'nextjs': '.next',
    'astro': 'dist',
    'angular': 'dist',
  };
  
  // Handle both v1 and v2 config formats
  const frontend = cfg.stack?.frontend || cfg.frontend;
  if (frontend && map[frontend]) return map[frontend];
  
  const guesses = ['dist', 'build', '.next', 'out'];
  return guesses.find(d => fs.existsSync(d)) || 'dist';
}

export const handler = async (argv = {}) => {
  const { verbose, skipBuild, dryRun } = argv;
  const progress = new ProgressIndicator(verbose);
  
  // Set up deployment steps
  const steps = [
    { icon: '🔐', message: 'Authenticating', details: 'Verifying stored credentials and login status' },
    { icon: '⚙️', message: 'Preparing deployment', details: 'Reading configuration and detecting build directory' },
    { icon: '🏗️', message: 'Building project', details: 'Running build command to generate production assets' },
    { icon: '📦', message: 'Creating bundle', details: 'Compressing build output into deployment archive' },
    { icon: '🚀', message: 'Uploading to ForgeKit', details: 'Securely transferring bundle to deployment servers' },
    { icon: '🔄', message: 'Processing deployment', details: 'Server is building and starting your application' }
  ];

  if (skipBuild) {
    steps.splice(2, 1); // Remove build step
  }

  progress.setSteps(steps);
  let currentStepIndex = 0;

  try {
    // Step 1: Authentication
    progress.startStep(currentStepIndex);
    const token = await ensureLoggedIn();
    if (!token) {
      progress.failStep(currentStepIndex, 'Unable to authenticate');
      console.error('❌ Unable to authenticate. Please run `forge login` first.');
      return;
    }
    progress.logVerbose('Authentication token validated');
    progress.completeStep(currentStepIndex);
    currentStepIndex++;

    // Pre-deployment validation
    progress.logVerbose('Running pre-deployment validation...');
    const validation = await validateDeployReadiness(process.cwd(), verbose);
    
    if (validation.errors.length > 0) {
      progress.failStep(currentStepIndex, 'Pre-deployment validation failed');
      console.error('❌ Deployment validation failed:');
      validation.errors.forEach(error => console.error(`   • ${error}`));
      if (validation.warnings.length > 0) {
        console.warn('\n⚠️ Warnings:');
        validation.warnings.forEach(warning => console.warn(`   • ${warning}`));
      }
      return;
    }
    
    if (validation.warnings.length > 0 && verbose) {
      console.warn('⚠️ Deployment warnings:');
      validation.warnings.forEach(warning => console.warn(`   • ${warning}`));
    }
    
    if (validation.info.length > 0 && verbose) {
      console.log('ℹ️ Deployment info:');
      validation.info.forEach(info => console.log(`   • ${info}`));
    }
    
    progress.logVerbose('Pre-deployment validation passed');

    // Step 2: Preparation
    progress.startStep(currentStepIndex);
    const buildDir = detectBuildDir(argv);
    const bundlePath = path.join(process.cwd(), 'bundle.tar.gz');
    const deployUrl = process.env.FORGEKIT_DEPLOY_URL || 'https://api.forgekit.ai/deploy_cli';
    
    progress.logVerbose(`Build directory: ${buildDir}`);
    progress.logVerbose(`Bundle path: ${bundlePath}`);
    progress.logVerbose(`Deploy URL: ${deployUrl}`);
    
    // Read forgekit.json for additional context
    const config = readForgeConfig();
    if (config && Object.keys(config).length > 0) {
      progress.logVerbose(`Configuration: ${JSON.stringify(config)}`);
    }

    if (dryRun) {
      console.log('\n🔍 Dry Run - Deployment Preview:');
      console.log(`   Build Directory: ${buildDir}`);
      console.log(`   Target URL: ${deployUrl}`);
      console.log(`   Bundle: ${bundlePath}`);
      console.log(`   Skip Build: ${skipBuild ? 'Yes' : 'No'}`);
      console.log('\n✅ Dry run completed. Use `forge deploy` without --dry-run to actually deploy.');
      return;
    }

    progress.completeStep(currentStepIndex);
    currentStepIndex++;

    // Step 3: Build (if not skipped)
    if (!skipBuild) {
      progress.startStep(currentStepIndex);
      const useYarn = fs.existsSync('yarn.lock');
      const usePnpm = fs.existsSync('pnpm-lock.yaml');
      const useBun = fs.existsSync('bun.lockb');
      
      let buildCmd;
      if (useBun) {
        buildCmd = 'bun run build';
        progress.logVerbose('Detected bun.lockb, using bun');
      } else if (usePnpm) {
        buildCmd = 'pnpm build';
        progress.logVerbose('Detected pnpm-lock.yaml, using pnpm');
      } else if (useYarn) {
        buildCmd = 'yarn build';
        progress.logVerbose('Detected yarn.lock, using yarn');
      } else {
        buildCmd = 'npm run build';
        progress.logVerbose('Using npm (default)');
      }

      progress.updateStep(`Running: ${buildCmd}`);
      
      try {
        const buildResult = await retryOperation(async () => {
          return await asyncExec(buildCmd);
        }, 2, 2000);
        
        const { stdout, stderr } = buildResult;
        if (verbose && stdout) {
          progress.logVerbose(`Build output: ${stdout.trim()}`);
        }
        if (stderr) {
          progress.logWarning(`Build warnings: ${stderr.trim()}`);
        }
      } catch (buildError) {
        progress.failStep(currentStepIndex, 'Build failed');
        
        const helpfulMessage = getHelpfulErrorMessage(buildError, 'npm run build');
        if (helpfulMessage) {
          console.error(`❌ Build failed: ${helpfulMessage}`);
        } else {
          console.error('❌ Build failed. Please fix the build errors and try again.');
        }
        
        if (verbose && buildError.stdout) {
          console.error('\n📋 Build output:');
          console.error(buildError.stdout);
        }
        if (buildError.stderr) {
          console.error('\n🚨 Build errors:');
          console.error(buildError.stderr);
        }
        
        // Provide context-specific suggestions
        console.error('\n💡 Suggestions:');
        console.error('   • Make sure all dependencies are installed: npm install');
        console.error('   • Check that your build script is properly configured');
        console.error('   • Try building locally first: npm run build');
        console.error('   • Use --verbose flag for more detailed output');
        
        return;
      }

      progress.completeStep(currentStepIndex);
      currentStepIndex++;
    }

    // Verify build directory exists and validate build output
    if (!fs.existsSync(buildDir)) {
      progress.failStep(currentStepIndex, `Build directory '${buildDir}' not found`);
      console.error(`❌ Build directory '${buildDir}' not found.`);
      console.error('💡 Possible solutions:');
      console.error('   - Run `forge deploy` from your project root');
      console.error('   - Ensure your build script generates the correct output directory');
      console.error('   - Use --build-dir flag to specify the correct directory');
      console.error('   - Use --skip-build if you already have a build');
      return;
    }

    // Verify build output quality
    progress.logVerbose('Verifying build output...');
    const buildVerification = await verifyBuildOutput(process.cwd(), buildDir, verbose);
    
    if (buildVerification.errors.length > 0) {
      progress.failStep(currentStepIndex, 'Build verification failed');
      console.error('❌ Build verification failed:');
      buildVerification.errors.forEach(error => console.error(`   • ${error}`));
      return;
    }
    
    if (buildVerification.warnings.length > 0 && verbose) {
      console.warn('⚠️ Build warnings:');
      buildVerification.warnings.forEach(warning => console.warn(`   • ${warning}`));
    }
    
    if (buildVerification.info.length > 0 && verbose) {
      console.log('ℹ️ Build info:');
      buildVerification.info.forEach(info => console.log(`   • ${info}`));
    }
    
    progress.logVerbose('Build verification passed');

    // Step 4: Bundling
    progress.startStep(currentStepIndex);
    
    // Get bundle size info
    const buildStats = fs.statSync(buildDir);
    const isDirectory = buildStats.isDirectory();
    
    if (!isDirectory) {
      progress.failStep(currentStepIndex, `${buildDir} is not a directory`);
      console.error(`❌ ${buildDir} is not a directory.`);
      return;
    }

    progress.updateStep(`Compressing ${buildDir} directory`);
    
    try {
      await tar.c({ gzip: true, file: bundlePath }, [buildDir]);
      
      const bundleStats = fs.statSync(bundlePath);
      const bundleSizeMB = (bundleStats.size / 1024 / 1024).toFixed(2);
      progress.logVerbose(`Bundle size: ${bundleSizeMB} MB`);
      
      if (bundleStats.size > 100 * 1024 * 1024) { // 100MB
        progress.logWarning(`Large bundle size (${bundleSizeMB} MB). Consider optimizing your build.`);
      }
    } catch (tarError) {
      progress.failStep(currentStepIndex, tarError.message);
      console.error('❌ Failed to create deployment bundle:', tarError.message);
      return;
    }

    progress.completeStep(currentStepIndex);
    currentStepIndex++;

    // Step 5: Upload
    progress.startStep(currentStepIndex);
    const form = new FormData();
    form.append('file', fs.createReadStream(bundlePath));
    
    progress.updateStep('Establishing secure connection');
    
    try {
      const uploadStartTime = Date.now();
      
      const res = await retryOperation(async () => {
        return await secureClient.post(deployUrl, form, {
          headers: { ...form.getHeaders(), Authorization: `Bearer ${token}` },
          timeout: 300000, // 5 minute timeout for uploads
        });
      }, 3, 5000);
      
      const uploadTime = ((Date.now() - uploadStartTime) / 1000).toFixed(1);
      progress.logVerbose(`Upload completed in ${uploadTime}s`);
      
      progress.completeStep(currentStepIndex);
      currentStepIndex++;

      // Step 6: Processing
      progress.startStep(currentStepIndex);
      
      const responseData = res.data;
      if (!responseData) {
        throw new Error('Empty response from deployment server');
      }

      progress.logVerbose(`Server response: ${JSON.stringify(responseData, null, 2)}`);
      
      const url = responseData.url;
      const slug = responseData.slug;
      const buildId = responseData.buildId;

      if (!url) {
        throw new Error('No deployment URL received from server');
      }

      progress.completeStep(currentStepIndex, 'Deployment processing');
      progress.complete();

      // Success output
      console.log('\n🎉 Deployment Details:');
      console.log(`   URL: ${url}`);
      if (slug) console.log(`   Slug: ${slug}`);
      if (buildId) console.log(`   Build ID: ${buildId}`);
      
      console.log('\n💡 Next steps:');
      console.log(`   - View your app: ${url}`);
      console.log(`   - Check logs: forge logs ${slug || '<slug>'}`);
      console.log(`   - View stats: forge stats ${slug || '<slug>'}`);

    } catch (uploadError) {
      progress.failStep(currentStepIndex, 'Upload failed');
      
      const helpfulMessage = getHelpfulErrorMessage(uploadError, 'upload');
      if (helpfulMessage) {
        console.error(`❌ Upload failed: ${helpfulMessage}`);
      } else if (uploadError.response) {
        const status = uploadError.response.status;
        switch (status) {
          case 401:
            console.error('❌ Upload failed: Authentication expired. Try running: forge login');
            break;
          case 413:
            console.error('❌ Upload failed: Project bundle is too large.');
            console.error('💡 Try these optimizations:');
            console.error('   • Remove node_modules from your project');
            console.error('   • Check your .gitignore includes build artifacts');
            console.error('   • Optimize your build output size');
            break;
          case 429:
            console.error('❌ Upload failed: Rate limit exceeded. Please wait a few minutes and try again.');
            break;
          case 500:
            console.error('❌ Upload failed: Server error. Please try again in a few minutes.');
            break;
          default:
            console.error(`❌ Upload failed: Server returned status ${status}`);
        }
      } else if (uploadError.code === 'ECONNABORTED') {
        console.error('❌ Upload failed: Connection timeout.');
        console.error('💡 This might be due to:');
        console.error('   • Slow internet connection');
        console.error('   • Large project size');
        console.error('   • Server connectivity issues');
      } else if (uploadError.code === 'ENOTFOUND') {
        console.error('❌ Upload failed: Cannot reach deployment server.');
        console.error('💡 Check your internet connection and try again.');
      } else {
        console.error('❌ Upload failed:', uploadError.message || uploadError);
      }
      
      if (verbose && uploadError.response) {
        console.error('\n📋 Server response:', uploadError.response.data);
      }
      
      return;
    }

  } catch (err) {
    if (currentStepIndex < steps.length) {
      progress.failStep(currentStepIndex, err.message);
    }
    console.error('❌ Unexpected error during deployment:', err.message || err);
    if (verbose) {
      console.error('Error details:', err);
    }
  } finally {
    // Cleanup bundle file
    try {
      if (fs.existsSync(bundlePath)) {
        fs.unlinkSync(bundlePath);
        progress.logVerbose('Cleaned up temporary bundle file');
      }
    } catch (cleanupError) {
      if (verbose) {
        progress.logWarning(`Could not clean up bundle file: ${cleanupError.message}`);
      }
    }
  }
};
