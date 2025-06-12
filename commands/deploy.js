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
import { createFilteredBundle, estimateBundleSize } from '../src/bundleUtils.js';

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

function generateDockerfileForDeployment(projectDir, buildDir, config) {
  const dockerfilePath = path.join(projectDir, 'Dockerfile');
  
  // Secure, universal Dockerfile that works with most web apps
  const dockerfileContent = `FROM nginx:alpine

# Copy built files and set ownership
COPY --chown=nginx:nginx ${buildDir} /usr/share/nginx/html

# Create a custom nginx config that works with non-root user
RUN echo 'server { \\
    listen 8080; \\
    listen [::]:8080; \\
    server_name _; \\
    root /usr/share/nginx/html; \\
    index index.html; \\
    location / { \\
        try_files $uri $uri/ /index.html; \\
    } \\
    # Security headers \\
    add_header X-Frame-Options "SAMEORIGIN" always; \\
    add_header X-Content-Type-Options "nosniff" always; \\
    add_header X-XSS-Protection "1; mode=block" always; \\
}' > /etc/nginx/conf.d/default.conf

# Create a minimal nginx.conf that works with non-root user
RUN echo 'worker_processes auto; \\
error_log /var/log/nginx/error.log warn; \\
pid /tmp/nginx.pid; \\
events { \\
    worker_connections 1024; \\
} \\
http { \\
    include /etc/nginx/mime.types; \\
    default_type application/octet-stream; \\
    sendfile on; \\
    keepalive_timeout 65; \\
    include /etc/nginx/conf.d/*.conf; \\
}' > /etc/nginx/nginx.conf

# Create directories nginx needs and set permissions
RUN mkdir -p /var/cache/nginx/client_temp && \\
    mkdir -p /var/cache/nginx/proxy_temp && \\
    mkdir -p /var/cache/nginx/fastcgi_temp && \\
    mkdir -p /var/cache/nginx/uwsgi_temp && \\
    mkdir -p /var/cache/nginx/scgi_temp && \\
    mkdir -p /var/log/nginx && \\
    mkdir -p /tmp && \\
    chown -R nginx:nginx /var/cache/nginx && \\
    chown -R nginx:nginx /var/log/nginx && \\
    chown -R nginx:nginx /tmp && \\
    chown -R nginx:nginx /usr/share/nginx/html && \\
    chown -R nginx:nginx /etc/nginx && \\
    chmod -R 755 /var/cache/nginx && \\
    chmod -R 755 /var/log/nginx && \\
    chmod -R 755 /tmp

# Switch to non-root user
USER nginx

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]`;
  
  fs.writeFileSync(dockerfilePath, dockerfileContent);
  console.log('Generated secure Dockerfile for static deployment');
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
  const backend = cfg.stack?.backend || cfg.backend;
  
  if (frontend && map[frontend]) {
    const expectedDir = map[frontend];
    
    // For full-stack projects, check if build output is in frontend subdirectory
    if (backend && fs.existsSync(path.join('frontend', expectedDir))) {
      return path.join('frontend', expectedDir);
    }
    
    // For frontend-only projects or if frontend build dir exists at root
    if (fs.existsSync(expectedDir)) {
      return expectedDir;
    }
    
    // Fallback: return expected directory (will be created during build)
    // For full-stack projects, frontend build gets copied to root dist/
    return expectedDir;
  }
  
  // Fallback guesses - check both root and frontend subdirectory
  const guesses = ['dist', 'build', '.next', 'out'];
  
  // First check root directory
  for (const guess of guesses) {
    if (fs.existsSync(guess)) return guess;
  }
  
  // Then check frontend subdirectory
  for (const guess of guesses) {
    const frontendPath = path.join('frontend', guess);
    if (fs.existsSync(frontendPath)) return frontendPath;
  }
  
  // Final fallback
  return 'dist';
}

export const handler = async (argv = {}) => {
  const { verbose, skipBuild, dryRun } = argv;
  const progress = new ProgressIndicator(verbose);
  
  // Check if this is a redeploy
  const config = readForgeConfig();
  const existingSlug = config.deployment?.slug;
  const isRedeploy = !!existingSlug;
  
  // Set up deployment steps
  const steps = [
    { icon: '🔐', message: 'Authenticating', details: 'Verifying stored credentials and login status' },
    { icon: '⚙️', message: 'Preparing deployment', details: 'Reading configuration and detecting build directory' },
    { icon: '🏗️', message: 'Building project', details: 'Running build command to generate production assets' },
    { icon: '📦', message: 'Creating bundle', details: 'Compressing build output into deployment archive' },
    { icon: '🚀', message: isRedeploy ? 'Updating deployment' : 'Uploading to ForgeKit', details: isRedeploy ? 'Updating existing deployment with new code' : 'Securely transferring bundle to deployment servers' },
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
    
    // Determine deploy URL based on whether this is a redeploy
    let deployUrl;
    if (isRedeploy) {
      const baseUrl = process.env.FORGEKIT_DEPLOY_URL?.replace('/deploy_cli', '') || 'https://api.forgekit.ai';
      deployUrl = `${baseUrl}/redeploy/${existingSlug}`;
      progress.logVerbose(`Redeploying to existing slug: ${existingSlug}`);
    } else {
      deployUrl = process.env.FORGEKIT_DEPLOY_URL || 'https://api.forgekit.ai/deploy_cli';
    }
    
    progress.logVerbose(`Build directory: ${buildDir}`);
    progress.logVerbose(`Bundle path: ${bundlePath}`);
    progress.logVerbose(`Deploy URL: ${deployUrl}`);
    
    if (config && Object.keys(config).length > 0) {
      progress.logVerbose(`Configuration: ${JSON.stringify(config)}`);
    }

    if (dryRun) {
      console.log('\n🔍 Dry Run - Deployment Preview:');
      console.log(`   Build Directory: ${buildDir}`);
      console.log(`   Target URL: ${deployUrl}`);
      console.log(`   Bundle: ${bundlePath}`);
      console.log(`   Skip Build: ${skipBuild ? 'Yes' : 'No'}`);
      if (isRedeploy) {
        console.log(`   Mode: Update existing deployment (${existingSlug})`);
      } else {
        console.log(`   Mode: New deployment`);
      }
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

    // Ensure Dockerfile exists for deployment
    const dockerfilePath = path.join(process.cwd(), 'Dockerfile');
    if (!fs.existsSync(dockerfilePath)) {
      progress.logVerbose('Dockerfile not found, generating one based on project configuration...');
      generateDockerfileForDeployment(process.cwd(), buildDir, config);
      progress.logVerbose('Generated Dockerfile for deployment');
    } else {
      progress.logVerbose('Using existing Dockerfile');
    }

    progress.updateStep(`Creating optimized deployment bundle`);
    
    try {
      // Include build directory and project metadata for deployment context
      const candidateFiles = [buildDir];
      
      // Check if this is a Next.js project that needs source files for Docker build
      const isNextjsWithDockerBuild = config.stack?.frontend === 'nextjs' && fs.existsSync('Dockerfile');
      
      if (isNextjsWithDockerBuild) {
        // For Next.js projects with Dockerfile, include source files needed for build
        if (fs.existsSync('src')) {
          candidateFiles.push('src');
          progress.logVerbose('Including Next.js source directory: src');
        }
        
        if (fs.existsSync('public')) {
          candidateFiles.push('public');
          progress.logVerbose('Including Next.js public assets: public');
        }
        
        // Include Next.js configuration files
        if (fs.existsSync('next.config.js')) {
          candidateFiles.push('next.config.js');
          progress.logVerbose('Including Next.js config: next.config.js');
        }
        
        if (fs.existsSync('next.config.mjs')) {
          candidateFiles.push('next.config.mjs');
          progress.logVerbose('Including Next.js config: next.config.mjs');
        }
        
        if (fs.existsSync('next.config.ts')) {
          candidateFiles.push('next.config.ts');
          progress.logVerbose('Including Next.js config: next.config.ts');
        }
        
        // Include build configuration files
        if (fs.existsSync('tailwind.config.js')) {
          candidateFiles.push('tailwind.config.js');
          progress.logVerbose('Including Tailwind config: tailwind.config.js');
        }
        
        if (fs.existsSync('tailwind.config.ts')) {
          candidateFiles.push('tailwind.config.ts');
          progress.logVerbose('Including Tailwind config: tailwind.config.ts');
        }
        
        if (fs.existsSync('postcss.config.js')) {
          candidateFiles.push('postcss.config.js');
          progress.logVerbose('Including PostCSS config: postcss.config.js');
        }
        
        if (fs.existsSync('tsconfig.json')) {
          candidateFiles.push('tsconfig.json');
          progress.logVerbose('Including TypeScript config: tsconfig.json');
        }
        
        if (fs.existsSync('next-env.d.ts')) {
          candidateFiles.push('next-env.d.ts');
          progress.logVerbose('Including Next.js TypeScript env: next-env.d.ts');
        }
      }
      
      // Always include Dockerfile (generated or existing)
      if (fs.existsSync('Dockerfile')) {
        candidateFiles.push('Dockerfile');
        progress.logVerbose('Including Dockerfile for deployment');
      }
      
      // Add backend build output if it exists (for full-stack projects)
      if (fs.existsSync('backend-dist')) {
        candidateFiles.push('backend-dist');
        progress.logVerbose('Including backend build output: backend-dist');
      }
      
      // Add backend source if it exists (for runtime dependencies)
      if (fs.existsSync('backend')) {
        candidateFiles.push('backend');
        progress.logVerbose('Including backend source: backend');
      }
      
      // Add forgekit.json for stack information
      if (fs.existsSync('forgekit.json')) {
        candidateFiles.push('forgekit.json');
        progress.logVerbose('Including project configuration: forgekit.json');
      }
      
      // Add package.json for dependency and script information
      if (fs.existsSync('package.json')) {
        candidateFiles.push('package.json');
        progress.logVerbose('Including project metadata: package.json');
      }
      
      // Add package-lock.json if it exists
      if (fs.existsSync('package-lock.json')) {
        candidateFiles.push('package-lock.json');
        progress.logVerbose('Including package-lock.json for consistent installs');
      }
      
      // Add yarn.lock if it exists
      if (fs.existsSync('yarn.lock')) {
        candidateFiles.push('yarn.lock');
        progress.logVerbose('Including yarn.lock for consistent installs');
      }
      
      // Add pnpm-lock.yaml if it exists
      if (fs.existsSync('pnpm-lock.yaml')) {
        candidateFiles.push('pnpm-lock.yaml');
        progress.logVerbose('Including pnpm-lock.yaml for consistent installs');
      }
      
      // Add bun.lockb if it exists
      if (fs.existsSync('bun.lockb')) {
        candidateFiles.push('bun.lockb');
        progress.logVerbose('Including bun.lockb for consistent installs');
      }
      
      // Estimate size before filtering
      const estimatedSize = estimateBundleSize(candidateFiles, process.cwd());
      progress.logVerbose(`Estimated bundle: ${(estimatedSize.size / 1024 / 1024).toFixed(2)} MB, ${estimatedSize.files} files (after filtering)`);
      
      // Create filtered bundle excluding node_modules and other unwanted files
      progress.logVerbose('Applying exclusion filters (node_modules, .git, etc.)...');
      await createFilteredBundle(tar, bundlePath, candidateFiles, process.cwd(), verbose);
      
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
          timeout: 600000, // 10 minute timeout for uploads
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

      // Save deployment info to forgekit.json for future redeploys
      if (slug || isRedeploy) {
        try {
          const configPath = path.join(process.cwd(), 'forgekit.json');
          const currentConfig = readForgeConfig();
          currentConfig.deployment = {
            slug: slug || existingSlug,
            url: url,
            lastDeployed: new Date().toISOString()
          };
          if (buildId) {
            currentConfig.deployment.buildId = buildId;
          }
          fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 2));
          progress.logVerbose(isRedeploy ? 'Updated deployment info in forgekit.json' : 'Saved deployment info to forgekit.json');
        } catch (saveError) {
          progress.logWarning(`Could not save deployment info: ${saveError.message}`);
        }
      }

      // Success output
      console.log(isRedeploy ? '\n🎉 Deployment Updated:' : '\n🎉 Deployment Details:');
      console.log(`   URL: ${url}`);
      if (slug) console.log(`   Slug: ${slug}`);
      if (buildId) console.log(`   Build ID: ${buildId}`);
      
      console.log('\n💡 Next steps:');
      console.log(`   - View your app: ${url}`);
      console.log(`   - Check logs: forge logs ${slug || existingSlug || '<slug>'}`);
      console.log(`   - View stats: forge stats ${slug || existingSlug || '<slug>'}`);
      
      // Explicitly exit with success code
      process.exit(0);

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
            console.error('   • Optimize your build output size');
            console.error('   • Use .dockerignore to exclude large files');
            console.error('   • Remove unnecessary assets from your build');
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
      
      process.exit(1);
    }

  } catch (err) {
    if (currentStepIndex < steps.length) {
      progress.failStep(currentStepIndex, err.message);
    }
    console.error('❌ Unexpected error during deployment:', err.message || err);
    if (verbose) {
      console.error('Error details:', err);
    }
    process.exit(1);
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
