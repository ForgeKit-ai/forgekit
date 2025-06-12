import fs from 'fs';
import path from 'path';
import shell from 'shelljs';

// --- Helper Functions ---

function checkCommand(result, errorMessage) {
  if (!result || result.code !== 0) {
    console.error(`❌ Error: ${errorMessage}`);
    if (result && result.stderr) {
        console.error(`Stderr: ${result.stderr}`);
    }
    if (result && result.stdout) {
        console.error(`Stdout: ${result.stdout}`);
    }
    if (result && result.stderr && result.stderr.includes('could not determine executable to run')) {
        console.error("Hint: This often means npx couldn't find the command right after installation. Ensure node_modules is correct.");
    }
    process.exit(1);
  }
  console.log("✅ Success");
}

export { checkCommand };

export function sanitizeProjectName(name) {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/^\.+/, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase();
}

export function drawForgeHammer() {
  // ANSI color codes for flame gradient and steel anvil
  const colors = {
    red: '\x1b[31m',
    brightRed: '\x1b[91m',
    yellow: '\x1b[33m',
    brightYellow: '\x1b[93m',
    orange: '\x1b[38;5;208m',
    darkRed: '\x1b[38;5;124m',
    steel: '\x1b[38;5;240m',        // Dark steel gray for anvil
    darkSteel: '\x1b[38;5;235m',    // Even darker steel
    reset: '\x1b[0m'
  };

  console.log(`\n🔥 Forging your project with ForgeKit 🔥\n`);
  
  console.log(`${colors.yellow}                                  *${colors.reset}`);
  console.log(`${colors.yellow}                                  ***${colors.reset}`);
  console.log(`${colors.yellow}                                  ****${colors.reset}`);
  console.log(`${colors.yellow}                                  *****${colors.reset}`);
  console.log(`${colors.brightYellow}                                 ******${colors.reset}`);
  console.log(`${colors.brightYellow}                               ********${colors.reset}`);
  console.log(`${colors.brightYellow}                              *********  **${colors.reset}`);
  console.log(`${colors.orange}                             *********  ***${colors.reset}`);
  console.log(`${colors.orange}                        **  ******+++   ****${colors.reset}`);
  console.log(`${colors.orange}                       ***  +++++++++   *****${colors.reset}`);
  console.log(`${colors.orange}                      ****  ++++++++++  ++++**${colors.reset}`);
  console.log(`${colors.brightRed}                     ++++++  ++++++++++  ++++++${colors.reset}`);
  console.log(`${colors.brightRed}                     +++++++  ++++++++++  ++++++${colors.reset}`);
  console.log(`${colors.brightRed}                    ++++++++++++++++++++  +++++++${colors.reset}`);
  console.log(`${colors.brightRed}                    +++++++++++++++++++++ ++++++++${colors.reset}`);
  console.log(`${colors.red}                    ++++${colors.steel}==============${colors.red}++++++++++++${colors.reset}`);
  console.log(`${colors.red}                    +++++${colors.steel}==============${colors.red}+++++++++++${colors.reset}`);
  console.log(`${colors.red}                     +++++++${colors.darkSteel}==========${colors.red}++++++++++${colors.reset}`);
  console.log(`${colors.darkRed}                      ++++++++${colors.darkSteel}========${colors.darkRed}++++++++++${colors.reset}`);
  console.log(`${colors.darkRed}                       +++++++${colors.darkSteel}========${colors.darkRed}+++++++++${colors.reset}`);
  console.log(`${colors.darkRed}                        ++++++${colors.darkSteel}========${colors.darkRed}++++++++${colors.reset}`);
  console.log(`${colors.darkRed}                          +++${colors.darkSteel}===========${colors.darkRed}++++${colors.reset}`);
  console.log(`${colors.darkSteel}                              ==========${colors.reset}`);
  console.log(`\n`);
  console.log("===================================================\n");
}

export async function setupGit(projectRoot) {
  console.log("\n📂 Initializing Git repository...");
  if (!fs.existsSync(projectRoot)) {
      console.warn(`⚠️ Git init skipped: Project directory ${projectRoot} does not exist yet.`);
      return;
  }
  const result = shell.exec("git init", { cwd: projectRoot, silent: true });
  checkCommand(result, `Failed to initialize git repository in ${projectRoot}. Is git installed and in your PATH?`);
}

export function createProjectStructure(projectRoot, projectName, stack, uiFramework, database, gitInit = true) {
  console.log(`\n🏗️ Creating project structure for '${projectName}' at ${projectRoot}...`);
  fs.mkdirSync(projectRoot, { recursive: true });

  const docsDir = path.join(projectRoot, "docs");
  fs.mkdirSync(docsDir, { recursive: true });
  const readmeContent = generateReadme(projectRoot, projectName, stack, uiFramework, database);
  fs.writeFileSync(path.join(projectRoot, "README.md"), readmeContent);
  console.log("↳ Created README.md");

  const changelogContent = `# Changelog\n\nAll notable changes to this project will be documented in this file.\n\nThe format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),\nand this project adheres to [Semantic Versioning](https://semver.org/).\n\n## [Unreleased]\n- Initial project scaffolding created by ForgeKit.`;
  fs.writeFileSync(path.join(projectRoot, "CHANGELOG.md"), changelogContent);
  console.log("↳ Created CHANGELOG.md");

  if (gitInit) {
    const gitignoreContent = generateGitignore(stack);
    fs.writeFileSync(path.join(projectRoot, ".gitignore"), gitignoreContent);
    console.log("↳ Created .gitignore");
  }
}

export function generateReadme(projectRoot, projectName, stack, uiFramework, database) {
  const isFullStack = stack.backend;
  const frontendDir = path.join(projectRoot, 'frontend');
  const backendDir = path.join(projectRoot, 'backend');
  const hasFrontendDir = fs.existsSync(frontendDir);
  const hasBackendDir = fs.existsSync(backendDir);

  let readme = `# ${projectName}\n\n## Stack\n- **Frontend:** ${stack.frontend}\n${stack.backend ? `- **Backend:** ${stack.backend}\n` : ''}- **UI Library:** ${uiFramework}\n- **Database:** ${database || 'None'}\n`;

  // Getting Started section
  const instructions = [];
  if (hasFrontendDir) {
    instructions.push('```bash\ncd frontend && npm install && npm run dev\n```');
  }
  if (hasBackendDir) {
    instructions.push('```bash\ncd backend && npm install && npm run dev\n```');
  }

  if (instructions.length > 0) {
    readme += `\n## Getting Started\n\n${instructions.join('\n\n')}\n`;
  }

  // Development section
  readme += `\n## Development\n\n`;
  if (isFullStack) {
    readme += `- Run \`npm run dev\` from the project root to start frontend and backend.\n`;
    readme += `- Or run \`npm run dev\` in the \`frontend\` and \`backend\` directories individually.\n`;
  } else if (hasFrontendDir) {
    readme += `Run \`npm run dev\` in the \`frontend\` directory to start the development server.\n`;
  } else {
    readme += `Run \`npm run dev\` to start the development server.\n`;
  }

  // Build section
  readme += `\n## Building for Production\n\nThis project includes build scripts optimized for deployment:\n\n\`\`\`bash\nnpm run build\n\`\`\`\n\nThe build process will:\n- Build frontend assets to the \`dist\` directory\n`;
  
  if (isFullStack) {
    readme += `- Prepare backend for production deployment\n- Copy necessary files for containerized deployment\n`;
  } else {
    readme += `- Optimize assets for production deployment\n- Generate static files ready for hosting\n`;
  }

  readme += `\n### Build Output\n`;
  if (isFullStack) {
    readme += `- **Frontend builds to:** \`frontend/dist/\`\n- **Backend builds to:** \`backend-dist/\`\n`;
  } else {
    readme += `- **Builds to:** \`dist/\`\n`;
  }

  // Environment Variables section
  readme += `\n## Environment Variables\n\nCopy the example environment file and configure your variables:\n\n\`\`\`bash\n`;
  
  if (stack.frontend === 'nextjs') {
    readme += `cp .env.example .env.local  # For Next.js projects\n`;
  } else {
    readme += `cp .env.example .env        # Configure your environment\n`;
  }
  
  readme += `\`\`\`\n\nRequired environment variables are documented in \`.env.example\`.\n`;

  // Project Structure section
  readme += `\n## Project Structure\n\nThis project was scaffolded with ForgeKit and includes:\n\n- \`forgekit.json\` - Project metadata and deployment configuration\n- \`Dockerfile\` - Container configuration (auto-generated during deployment)\n- \`.env.example\` - Environment variable template\n- Build scripts configured for containerized deployment\n`;

  // Deployment Options section
  readme += `\n## Deployment Options\n\n### Option 1: ForgeKit Hosting (Recommended)\n\nDeploy instantly to ForgeKit's hosting platform:\n\n\`\`\`bash\n# Install ForgeKit CLI if you haven't already\nnpm install -g @forgekit/cli\n\n# Deploy your project\nforge deploy\n\`\`\`\n\nForgeKit deployment features:\n- ✅ Automatic containerization with Docker\n- ✅ SSL certificates and custom domains\n- ✅ Environment variable management\n- ✅ Real-time logs and monitoring\n- ✅ Zero-config deployment from this project\n\nLearn more at [forgekit.ai](https://forgekit.ai)\n\n### Option 2: Manual Deployment\n\nThis project is containerization-ready and can be deployed to any platform that supports Docker:\n\n1. **Build the project:** \`npm run build\`\n2. **Create Dockerfile:** A Dockerfile will be generated automatically during ForgeKit deployment, or you can create one manually\n3. **Deploy to your platform** (Vercel, Netlify, Railway, etc.)\n`;

  // Deployment Compatibility section
  readme += `\n## Deployment Compatibility\n\nThis project is configured to work with containerized deployment platforms:\n\n- **Port Configuration:** Configured to use \`process.env.PORT || 3000\`\n- **Build Output:** Optimized build process with proper asset handling\n- **Environment Variables:** Follows 12-factor app principles\n`;
  
  if (isFullStack) {
    readme += `- **Health Checks:** Includes endpoint for container health monitoring\n`;
  }

  // Framework-specific notes
  readme += `\n### Framework-Specific Notes\n\n`;
  
  if (stack.frontend === 'nextjs') {
    readme += `**Next.js:** Configured with \`output: 'standalone'\` for optimal containerization and reduced bundle size.\n\n`;
  } else if (stack.frontend === 'react-vite' || stack.frontend === 'vue-vite') {
    readme += `**Vite:** Configured with optimized build settings for static deployment.\n\n`;
  } else if (stack.frontend === 'sveltekit') {
    readme += `**SvelteKit:** Configured for static generation and optimal performance.\n\n`;
  } else if (stack.frontend === 'astro') {
    readme += `**Astro:** Optimized for static generation with partial hydration.\n\n`;
  }

  if (stack.backend === 'express') {
    readme += `**Express:** Configured with production-ready middleware and proper error handling.\n\n`;
  } else if (stack.backend === 'fastapi') {
    readme += `**FastAPI:** Configured with CORS, automatic documentation, and production settings.\n\n`;
  } else if (stack.backend === 'django') {
    readme += `**Django:** Configured with production settings and static file handling.\n\n`;
  }

  // Troubleshooting section
  readme += `## Troubleshooting\n\n### Build Issues\n- Ensure all dependencies are installed: \`npm install\`\n- Clear build cache: \`rm -rf dist .next node_modules && npm install\`\n- Check environment variables are properly configured\n\n### Deployment Issues\n- Verify build succeeds locally: \`npm run build\`\n- Check that required environment variables are set\n- Ensure port configuration allows dynamic port assignment\n- Review logs for specific error messages\n\n### ForgeKit Deployment Issues\n- Use \`forge logs <project-slug>\` to view deployment logs\n- Verify your project has a valid \`forgekit.json\` file\n- Check that build output directory matches configuration\n- Use \`forge --doctor\` to diagnose common issues\n`;

  // Support section
  readme += `\n## Support\n\n- **ForgeKit Documentation:** [docs.forgekit.ai](https://docs.forgekit.ai)\n- **Community Support:** [ForgeKit Discord](https://discord.gg/forgekit)\n- **Issue Tracker:** Report bugs specific to this template\n\n---\n\n*This project was created with [ForgeKit](https://forgekit.ai) - the fastest way to scaffold and deploy full-stack applications.*`;

  return readme;
}

export function generateGitignore(stack = {}) {
  let gitignore = `# Dependencies\n/node_modules\n/.pnp\n.pnp.js\n\n# Build outputs\n/dist\n/build\n/out\n/.next\n\n# Environment variables (keep example files)\n.env\n.env.*\n!.env.example\n.env.local\n\n# Logs\nlogs\n*.log\nnpm-debug.log*\nyarn-debug.log*\nyarn-error.log*\npnpm-debug.log*\nlerna-debug.log*\n\n# OS generated files\n.DS_Store\n.DS_Store?\n._*\n.Spotlight-V100\n.Trashes\nehthumbs.db\nThumbs.db\n\n# Editor directories and files\n.vscode/*\n!.vscode/settings.json\n!.vscode/tasks.json\n!.vscode/launch.json\n!.vscode/extensions.json\n*.sublime-workspace\n.idea\n\n# Optional files\n/.cache`;

  if (stack.frontend) {
    gitignore += `\n# Frontend\n/frontend/node_modules`;
  }

  if (stack.backend) {
    gitignore += `\n# Backend\n/backend/node_modules`;
  }

  return gitignore.trim();
}

export async function setupSupabase(targetDir, envPrefix = "VITE") {
    console.log("\n🔧 Setting up Supabase client...");
    const pkgManager = "npm";
    const installCmd = `${pkgManager} install @supabase/supabase-js`;
    console.log(`  Running: ${installCmd} in ${targetDir}`);
    let result = shell.exec(installCmd, { cwd: targetDir, silent: true });
    checkCommand(result, `Failed to install Supabase client in ${targetDir}`);

    const envFileName = envPrefix === 'NEXT_PUBLIC' ? '.env.local' : '.env';
    const envExampleFileName = '.env.example';
    const envExamplePath = path.join(targetDir, envExampleFileName);
    const envContent = `${envPrefix}_SUPABASE_URL=YOUR_SUPABASE_URL\n${envPrefix}_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY\n`;

    fs.writeFileSync(envExamplePath, envContent);
    console.log(`↳ Created ${envExampleFileName} in ${targetDir}.`);

    if (envPrefix === 'VITE') {
        const libDir = path.join(targetDir, 'src', 'lib');
        fs.mkdirSync(libDir, { recursive: true });
        const supabaseClientContent = `import { createClient } from '@supabase/supabase-js';\n\nconst supabaseUrl = import.meta.env.VITE_SUPABASE_URL;\nconst supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;\n\nif (!supabaseUrl || !supabaseAnonKey) {\n  throw new Error('Supabase URL or Anon Key is missing. Make sure to set them in your .env file.');\n}\n\nexport const supabase = createClient(supabaseUrl, supabaseAnonKey);`;
        fs.writeFileSync(path.join(libDir, 'supabaseClient.ts'), supabaseClientContent);
        console.log(`↳ Created basic src/lib/supabaseClient.ts`);
    }

     if (envPrefix === 'NEXT_PUBLIC') {
        const libDir = path.join(targetDir, 'src', 'lib');
        fs.mkdirSync(libDir, { recursive: true });
        const supabaseClientContent = `import { createClient } from '@supabase/supabase-js';\n\nconst supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;\nconst supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;\n\nif (!supabaseUrl || !supabaseAnonKey) {\n  throw new Error('Supabase URL or Anon Key is missing. Make sure to set them in your .env.local file.');\n}\n\nexport const supabase = createClient(supabaseUrl, supabaseAnonKey);`;
        fs.writeFileSync(path.join(libDir, 'supabaseClient.ts'), supabaseClientContent);
        console.log(`↳ Created basic src/lib/supabaseClient.ts (client-side)`);
    }
}

export async function setupUIFramework(targetDir, uiFramework, stackType) {
  if (uiFramework === "None") return;

  console.log(`\n💅 Adding UI Framework: ${uiFramework}...`);
  const pkgManager = "npm";

  if (uiFramework === "Tailwind") {
      console.log("   Detected Tailwind v4 Workflow (No 'init' command).");

      console.log(`  Attempting to clean node_modules and package-lock.json in ${targetDir} before install...`);
      const nodeModulesPath = path.join(targetDir, 'node_modules');
      const packageLockPath = path.join(targetDir, 'package-lock.json');
      try {
          if (fs.existsSync(nodeModulesPath)) {
              fs.rmSync(nodeModulesPath, { recursive: true, force: true });
              console.log("   Removed existing node_modules directory.");
          }
          if (fs.existsSync(packageLockPath)) {
              fs.rmSync(packageLockPath, { force: true });
              console.log("   Removed existing package-lock.json.");
          }
          console.log(`  Running \`npm install\` in ${targetDir}...`);
          let baseInstallResult = shell.exec("npm install", { cwd: targetDir, silent: true });
          checkCommand(baseInstallResult, `Failed to run base \`npm install\``);
          console.log("   Base dependencies reinstalled.");
      } catch (err) {
          console.warn(`⚠️ Warning: Could not clean/reinstall before Tailwind install: ${err.message}`);
      }

      let installCmd = `${pkgManager} install -D @tailwindcss/postcss`;
      console.log(`  Running Tailwind v4 Dep Install: ${installCmd} in ${targetDir}`);
      let result = shell.exec(installCmd, { cwd: targetDir });
      checkCommand(result, `Tailwind v4 dependency installation command finished`);

      console.log("  Creating tailwind.config.js manually (Tailwind v4)...");
      let configPath = path.join(targetDir, "tailwind.config.js");
      let postcssConfigPath = path.join(targetDir, "postcss.config.js");
      let cssPath = path.join(targetDir, "src", "index.css");
      let contentGlob = stackType === 'nextjs'
        ? `"./src/pages/**/*.{js,ts,jsx,tsx,mdx}", "./src/components/**/*.{js,ts,jsx,tsx,mdx}", "./src/app/**/*.{js,ts,jsx,tsx,mdx}"`
        : `"./index.html", "./src/**/*.{js,ts,jsx,tsx}"`;

      const tailwindConfigContent = `/** @type {import('tailwindcss').Config} */\nmodule.exports = {\ncontent: [\n  ${contentGlob}\n],\ntheme: {\n  extend: {},\n},\nplugins: [],\n}`;
      fs.writeFileSync(configPath, tailwindConfigContent);
      console.log(`↳ Created/Updated tailwind.config.js`);

      console.log(`  Creating postcss.config.js manually (Tailwind v4)...`);
      const postcssConfigContent = `// postcss.config.js\nimport tailwindcss from '@tailwindcss/postcss'; // Import the new package\n\nexport default {\n  plugins: {\n    "@tailwindcss/postcss": {},\n  },\n};`;
      fs.writeFileSync(postcssConfigPath, postcssConfigContent);
      console.log(`↳ Created/Updated postcss.config.js`);

      console.log(`  Adding Tailwind directives to ${path.basename(cssPath)}...`);
      fs.mkdirSync(path.dirname(cssPath), { recursive: true });
      const cssContent = `@import "tailwindcss";`;
      if (fs.existsSync(cssPath)) {
          const existingCss = fs.readFileSync(cssPath, 'utf8');
          if (!existingCss.trim().startsWith('@tailwind base;')) {
              fs.writeFileSync(cssPath, cssContent + '\n' + existingCss);
              console.log(`↳ Prepended Tailwind directives to existing ${path.basename(cssPath)}`);
          } else {
              console.log(`↳ Tailwind directives already present in ${path.basename(cssPath)}`);
          }
      } else {
          fs.writeFileSync(cssPath, cssContent);
          console.log(`↳ Created ${path.basename(cssPath)} with Tailwind directives`);
      }
      console.log("✅ Tailwind CSS v4 setup complete.");

  } else if (uiFramework === "Chakra") {
    const installCmd = `${pkgManager} install @chakra-ui/react @emotion/react @emotion/styled framer-motion`;
    console.log(`  Running: ${installCmd} in ${targetDir}`);
    let result = shell.exec(installCmd, { cwd: targetDir, silent: true });
    checkCommand(result, `Failed to install Chakra UI dependencies in ${targetDir}`);

    console.log(`↳ Installed Chakra UI dependencies.`);
    if (stackType === 'vite') {
        console.log(`   Action needed: Wrap your '<App />' component in 'src/main.tsx' with '<ChakraProvider>'`);
    } else if (stackType === 'nextjs') {
        console.log(`   Action needed: Import and wrap content in 'src/app/layout.tsx' with '<ChakraProvider>'`);
    }
  } else if (uiFramework === "Material") {
    if (stackType === 'angular') {
      // Angular Material
      const installCmd = `${pkgManager} install @angular/material @angular/cdk @angular/animations`;
      console.log(`  Running: ${installCmd} in ${targetDir}`);
      let result = shell.exec(installCmd, { cwd: targetDir, silent: true });
      checkCommand(result, `Failed to install Angular Material dependencies in ${targetDir}`);

      // Add Angular Material theme
      const stylesPath = path.join(targetDir, 'src', 'styles.scss');
      if (fs.existsSync(stylesPath)) {
        const materialStyles = `@import '@angular/material/prebuilt-themes/indigo-pink.css';

/* You can add global styles to this file, and also import other style files */
html, body { height: 100%; }
body { margin: 0; font-family: Roboto, "Helvetica Neue", sans-serif; }`;
        fs.writeFileSync(stylesPath, materialStyles);
        console.log(`↳ Added Angular Material theme to styles.scss`);
      }
      
      console.log(`↳ Installed Angular Material dependencies.`);
    } else {
      // Material-UI for React/Next.js
      const installCmd = `${pkgManager} install @mui/material @emotion/react @emotion/styled @mui/icons-material`;
      console.log(`  Running: ${installCmd} in ${targetDir}`);
      let result = shell.exec(installCmd, { cwd: targetDir, silent: true });
      checkCommand(result, `Failed to install Material-UI dependencies in ${targetDir}`);

      console.log(`↳ Installed Material-UI dependencies.`);
      if (stackType === 'vite') {
          console.log(`   Action needed: Configure Material-UI theme provider in your app`);
      } else if (stackType === 'nextjs') {
          console.log(`   Action needed: Configure Material-UI theme provider in your layout`);
      }
    }
  } else if (uiFramework === "shadcn") {
    // Import and call shadcn/ui setup function
    const { setupShadcnUI } = await import('./ui/shadcn.js');
    const projectName = path.basename(targetDir);
    await setupShadcnUI(targetDir, projectName);
  }
}

export async function setupStorybook(targetDir) {
    console.log("\n📖 Initializing Storybook...");
    console.log(`   This might take a minute... Target: ${targetDir}`);
    const result = shell.exec("npx storybook@latest init -y", { cwd: targetDir });
    if (result.code !== 0) {
        console.warn("⚠️ Warning: Storybook initialization may have encountered issues.");
        console.warn(`   Stderr: ${result.stderr}`);
        console.warn(`   Stdout: ${result.stdout}`);
    } else {
      console.log("✅ Storybook initialization command finished.");
    }
}

export function setupRootConcurrentDev(projectRoot) {
  const rootPkgJsonPath = path.join(projectRoot, 'package.json');
  if (!fs.existsSync(rootPkgJsonPath)) {
    let initResult = shell.exec("npm init -y", { cwd: projectRoot, silent: true});
    checkCommand(initResult, "Failed to create a root package.json");
  }

  let installResult = shell.exec("npm install -D concurrently", { cwd: projectRoot, silent: true });
  checkCommand(installResult, "Failed to install 'concurrently' at root");

  const rootPkg = JSON.parse(fs.readFileSync(rootPkgJsonPath, 'utf-8'));
  if (!rootPkg.scripts) {
    rootPkg.scripts = {};
  }

  rootPkg.scripts.dev = "concurrently \"npm run dev --prefix frontend\" \"npm run dev --prefix backend\"";

  fs.writeFileSync(rootPkgJsonPath, JSON.stringify(rootPkg, null, 2));
  console.log(`↳ Added "dev" script to root package.json: runs frontend & backend concurrently.`);
}

export function setupRootFrontendCoordination(projectRoot, frontend) {
  const rootPkgJsonPath = path.join(projectRoot, 'package.json');
  if (!fs.existsSync(rootPkgJsonPath)) {
    let initResult = shell.exec("npm init -y", { cwd: projectRoot, silent: true});
    checkCommand(initResult, "Failed to create a root package.json");
  }

  const rootPkg = JSON.parse(fs.readFileSync(rootPkgJsonPath, 'utf-8'));
  if (!rootPkg.scripts) {
    rootPkg.scripts = {};
  }

  // Add deployment-ready scripts for frontend-only projects
  const scriptMap = {
    'react-vite': { build: 'vite build', dev: 'vite', preview: 'vite preview' },
    'vue-vite': { build: 'vite build', dev: 'vite', preview: 'vite preview' },
    'sveltekit': { build: 'vite build', dev: 'vite dev', preview: 'vite preview' },
    'astro': { build: 'astro build', dev: 'astro dev', preview: 'astro preview' },
    'nextjs': { build: 'next build', dev: 'next dev', start: 'next start' },
    'angular': { build: 'ng build --configuration production', dev: 'ng serve', start: 'ng serve --configuration production' },
    'blazor': { build: 'dotnet publish -c Release -o wwwroot', dev: 'dotnet watch', serve: 'dotnet run' },
    'godot': { build: 'echo "Build Godot project manually in editor" && mkdir -p dist && cp -r . dist/', dev: 'echo "Open in Godot editor"' }
  };

  const scripts = scriptMap[frontend] || { build: 'npm run build', dev: 'npm run dev' };
  rootPkg.scripts.build = scripts.build;
  rootPkg.scripts.dev = scripts.dev;
  if (scripts.start) rootPkg.scripts.start = scripts.start;
  if (scripts.preview) rootPkg.scripts.preview = scripts.preview;
  if (scripts.serve) rootPkg.scripts.serve = scripts.serve;

  fs.writeFileSync(rootPkgJsonPath, JSON.stringify(rootPkg, null, 2));
  console.log(`↳ Added deployment scripts to root package.json for ${frontend}.`);
}

export function setupRootFullStackCoordination(projectRoot, frontend, backend) {
  const rootPkgJsonPath = path.join(projectRoot, 'package.json');
  if (!fs.existsSync(rootPkgJsonPath)) {
    let initResult = shell.exec("npm init -y", { cwd: projectRoot, silent: true});
    checkCommand(initResult, "Failed to create a root package.json");
  }

  let installResult = shell.exec("npm install -D concurrently", { cwd: projectRoot, silent: true });
  checkCommand(installResult, "Failed to install 'concurrently' at root");

  const rootPkg = JSON.parse(fs.readFileSync(rootPkgJsonPath, 'utf-8'));
  if (!rootPkg.scripts) {
    rootPkg.scripts = {};
  }

  // Add full-stack coordination scripts
  rootPkg.scripts.dev = "concurrently \"npm run dev --prefix frontend\" \"npm run dev --prefix backend\"";
  rootPkg.scripts.build = "npm run build:all && npm run copy-builds";
  rootPkg.scripts["build:all"] = "concurrently \"npm run build --prefix frontend\" \"npm run build --prefix backend\"";
  rootPkg.scripts["build:frontend"] = "npm run build --prefix frontend";
  rootPkg.scripts["build:backend"] = "npm run build --prefix backend";
  rootPkg.scripts["copy-builds"] = "node -e \"const fs=require('fs'); const path=require('path'); if(fs.existsSync('frontend/dist')){fs.cpSync('frontend/dist','dist',{recursive:true})} else if(fs.existsSync('frontend/build')){fs.cpSync('frontend/build','dist',{recursive:true})} if(fs.existsSync('backend/dist')){fs.cpSync('backend/dist','backend-dist',{recursive:true})} else if(fs.existsSync('backend/target')){fs.cpSync('backend/target','backend-dist',{recursive:true})} else if(fs.existsSync('backend/main')){fs.cpSync('backend/main','backend-dist/main')} console.log('✅ Copied build outputs to deployment directories')\"";
  rootPkg.scripts.start = "concurrently \"npm run start --prefix frontend\" \"npm run start --prefix backend\"";

  fs.writeFileSync(rootPkgJsonPath, JSON.stringify(rootPkg, null, 2));
  console.log(`↳ Added full-stack coordination scripts to root package.json.`);
}

export async function validateDeployReadiness(projectRoot, verbose = false) {
  const validationResults = {
    valid: true,
    errors: [],
    warnings: [],
    info: []
  };

  function logVerbose(message) {
    if (verbose) console.log(`  ${message}`);
  }

  function addError(message) {
    validationResults.errors.push(message);
    validationResults.valid = false;
  }

  function addWarning(message) {
    validationResults.warnings.push(message);
  }

  function addInfo(message) {
    validationResults.info.push(message);
  }

  logVerbose('🔍 Starting deployment readiness validation...');

  // 1. Check forgekit.json exists and is valid
  const forgeConfigPath = path.join(projectRoot, 'forgekit.json');
  if (!fs.existsSync(forgeConfigPath)) {
    addError('forgekit.json not found. This project may not be a ForgeKit project.');
    return validationResults;
  }

  let config;
  try {
    config = JSON.parse(fs.readFileSync(forgeConfigPath, 'utf-8'));
    logVerbose('✓ forgekit.json found and parsed successfully');
  } catch (error) {
    addError(`forgekit.json is invalid JSON: ${error.message}`);
    return validationResults;
  }

  // 2. Validate package.json exists and has build script
  const rootPkgPath = path.join(projectRoot, 'package.json');
  if (!fs.existsSync(rootPkgPath)) {
    addError('package.json not found in project root');
  } else {
    try {
      const pkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf-8'));
      if (!pkg.scripts?.build) {
        addError('package.json missing "build" script required for deployment');
      } else {
        logVerbose('✓ package.json has build script');
        addInfo(`Build command: ${pkg.scripts.build}`);
      }
    } catch (error) {
      addError(`package.json is invalid JSON: ${error.message}`);
    }
  }

  // 3. Check build directory configuration
  const buildDir = config.build?.buildDir || config.buildDir || 'dist';
  const buildDirPath = path.join(projectRoot, buildDir);
  
  if (fs.existsSync(buildDirPath)) {
    logVerbose(`✓ Build directory exists: ${buildDir}`);
    
    // Check if build directory has content
    const buildContents = fs.readdirSync(buildDirPath);
    if (buildContents.length === 0) {
      addWarning(`Build directory ${buildDir} is empty. Run build first or use --skip-build flag.`);
    } else {
      addInfo(`Build directory contains ${buildContents.length} items`);
    }
  } else {
    addWarning(`Build directory ${buildDir} doesn't exist. Will be created during build.`);
  }

  // 4. Validate framework-specific requirements
  const frontend = config.stack?.frontend || config.frontend;
  const backend = config.stack?.backend || config.backend;

  if (frontend) {
    logVerbose(`Validating frontend: ${frontend}`);
    
    // Check for framework-specific files
    const frameworkFiles = {
      'nextjs': ['next.config.ts', 'next.config.js'],
      'react-vite': ['vite.config.ts', 'vite.config.js'],
      'vue-vite': ['vite.config.ts', 'vite.config.js'],
      'sveltekit': ['svelte.config.js'],
      'astro': ['astro.config.mjs', 'astro.config.js'],
      'angular': ['angular.json']
    };

    const expectedFiles = frameworkFiles[frontend];
    if (expectedFiles) {
      const hasConfigFile = expectedFiles.some(file => fs.existsSync(path.join(projectRoot, file)));
      if (!hasConfigFile) {
        addWarning(`No ${frontend} config file found. Expected one of: ${expectedFiles.join(', ')}`);
      } else {
        logVerbose(`✓ ${frontend} config file found`);
      }
    }
  }

  if (backend) {
    logVerbose(`Validating backend: ${backend}`);
    
    const backendDir = path.join(projectRoot, 'backend');
    if (!fs.existsSync(backendDir)) {
      addError('Backend directory not found');
    } else {
      // Check backend package.json
      const backendPkgPath = path.join(backendDir, 'package.json');
      if (!fs.existsSync(backendPkgPath)) {
        addError('Backend package.json not found');
      } else {
        try {
          const backendPkg = JSON.parse(fs.readFileSync(backendPkgPath, 'utf-8'));
          if (!backendPkg.scripts?.start) {
            addError('Backend package.json missing "start" script');
          } else {
            logVerbose('✓ Backend has start script');
          }
        } catch (error) {
          addError(`Backend package.json is invalid: ${error.message}`);
        }
      }
    }
  }

  // 5. Check for environment variables if needed
  const envFiles = ['.env', '.env.local', '.env.production'];
  const foundEnvFiles = envFiles.filter(file => fs.existsSync(path.join(projectRoot, file)));
  if (foundEnvFiles.length > 0) {
    addInfo(`Environment files found: ${foundEnvFiles.join(', ')}`);
  }

  // 6. Check for security issues
  const sensitiveFiles = ['.env', '.env.local', '.env.production'];
  const gitignorePath = path.join(projectRoot, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignore = fs.readFileSync(gitignorePath, 'utf-8');
    const unprotectedSensitiveFiles = sensitiveFiles.filter(file => 
      fs.existsSync(path.join(projectRoot, file)) && !gitignore.includes(file)
    );
    if (unprotectedSensitiveFiles.length > 0) {
      addWarning(`Sensitive files not in .gitignore: ${unprotectedSensitiveFiles.join(', ')}`);
    }
  }

  logVerbose(`🏁 Validation complete: ${validationResults.valid ? 'PASS' : 'FAIL'}`);
  
  return validationResults;
}

export async function verifyBuildOutput(projectRoot, buildDir, verbose = false) {
  const verificationResults = {
    valid: true,
    errors: [],
    warnings: [],
    info: []
  };

  function logVerbose(message) {
    if (verbose) console.log(`  ${message}`);
  }

  function addError(message) {
    verificationResults.errors.push(message);
    verificationResults.valid = false;
  }

  function addWarning(message) {
    verificationResults.warnings.push(message);
  }

  function addInfo(message) {
    verificationResults.info.push(message);
  }

  logVerbose('🔍 Verifying build output...');

  const buildPath = path.join(projectRoot, buildDir);
  
  // 1. Check if build directory exists
  if (!fs.existsSync(buildPath)) {
    addError(`Build directory '${buildDir}' does not exist`);
    return verificationResults;
  }

  // 2. Check if build directory has content
  const buildContents = fs.readdirSync(buildPath);
  if (buildContents.length === 0) {
    addError(`Build directory '${buildDir}' is empty`);
    return verificationResults;
  }

  logVerbose(`✓ Build directory contains ${buildContents.length} items`);

  // 3. Check for common required files based on project type
  const forgeConfigPath = path.join(projectRoot, 'forgekit.json');
  if (fs.existsSync(forgeConfigPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(forgeConfigPath, 'utf-8'));
      const frontend = config.stack?.frontend || config.frontend;
      
      switch (frontend) {
        case 'nextjs':
          // Next.js specific checks
          if (fs.existsSync(path.join(buildPath, 'standalone'))) {
            addInfo('Next.js standalone build detected');
          } else if (fs.existsSync(path.join(buildPath, 'static'))) {
            addInfo('Next.js static build detected');
          } else {
            addWarning('Next.js build output structure not recognized');
          }
          break;
          
        case 'react-vite':
        case 'vue-vite':
          // Vite builds should have an index.html
          if (fs.existsSync(path.join(buildPath, 'index.html'))) {
            addInfo('Static index.html found');
          } else {
            addWarning('No index.html found in build output');
          }
          
          // Check for assets directory
          if (fs.existsSync(path.join(buildPath, 'assets'))) {
            const assets = fs.readdirSync(path.join(buildPath, 'assets'));
            addInfo(`Found ${assets.length} asset files`);
          }
          break;
          
        case 'sveltekit':
          // SvelteKit static build should have prerendered content
          if (fs.existsSync(path.join(buildPath, 'index.html'))) {
            addInfo('SvelteKit static build detected');
          } else {
            addWarning('SvelteKit build output may not be static');
          }
          break;
          
        case 'astro':
          // Astro builds should have an index.html
          if (fs.existsSync(path.join(buildPath, 'index.html'))) {
            addInfo('Astro static build detected');
          } else {
            addWarning('No index.html found in Astro build');
          }
          break;
          
        case 'angular':
          // Angular builds should have an index.html
          if (fs.existsSync(path.join(buildPath, 'index.html'))) {
            addInfo('Angular static build detected');
          } else {
            addWarning('No index.html found in Angular build');
          }
          
          // Check for Angular build artifacts
          if (fs.existsSync(path.join(buildPath, 'main.js')) || fs.existsSync(path.join(buildPath, 'main.*.js'))) {
            addInfo('Angular bundled files detected');
          }
          break;
      }
    } catch (error) {
      addWarning('Could not read forgekit.json for build verification');
    }
  }

  // 4. Check total build size
  const getBuildSize = (dirPath) => {
    let totalSize = 0;
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        totalSize += getBuildSize(filePath);
      } else {
        totalSize += stats.size;
      }
    }
    
    return totalSize;
  };

  try {
    const buildSize = getBuildSize(buildPath);
    const buildSizeMB = (buildSize / 1024 / 1024).toFixed(2);
    addInfo(`Total build size: ${buildSizeMB} MB`);
    
    if (buildSize > 100 * 1024 * 1024) { // 100MB
      addWarning(`Large build size (${buildSizeMB} MB). Consider optimizing your build.`);
    }
    
    if (buildSize > 500 * 1024 * 1024) { // 500MB
      addError(`Build size (${buildSizeMB} MB) exceeds deployment limits. Please optimize your build.`);
    }
  } catch (error) {
    addWarning('Could not calculate build size');
  }

  // 5. Check for common issues
  const commonIssues = [
    { pattern: /node_modules/, message: 'Build contains node_modules directory - this should not be deployed' },
    { pattern: /\.env$/, message: 'Build contains .env files - ensure secrets are not included' },
    { pattern: /\.log$/, message: 'Build contains log files - consider excluding these' },
  ];

  const checkForIssues = (dirPath, relativePath = '') => {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const relativeFilePath = path.join(relativePath, file);
      const stats = fs.statSync(filePath);
      
      for (const issue of commonIssues) {
        if (issue.pattern.test(relativeFilePath)) {
          addWarning(`${issue.message}: ${relativeFilePath}`);
        }
      }
      
      if (stats.isDirectory() && !file.startsWith('.')) {
        checkForIssues(filePath, relativeFilePath);
      }
    }
  };

  try {
    checkForIssues(buildPath);
  } catch (error) {
    addWarning('Could not scan build output for common issues');
  }

  logVerbose(`🏁 Build verification complete: ${verificationResults.valid ? 'PASS' : 'FAIL'}`);
  
  return verificationResults;
}
