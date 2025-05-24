#!/usr/bin/env node
// create.js
import inquirer from "inquirer";
import shell from "shelljs";
import fs from "fs";
import path from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { fileURLToPath } from 'url'; // Import for path calculation

// --- Helper Functions ---

function checkCommand(result, errorMessage) {
  // Check if result is null/undefined (command couldn't even run) OR if the exit code is non-zero
  if (!result || result.code !== 0) {
    console.error(`❌ Error: ${errorMessage}`);
    if (result && result.stderr) {
        console.error(`Stderr: ${result.stderr}`);
    }
    if (result && result.stdout) {
        // Sometimes useful info is on stdout even on error
        console.error(`Stdout: ${result.stdout}`);
    }
    // Add a more specific check for the npx error seen with Tailwind
    if (result && result.stderr && result.stderr.includes('could not determine executable to run')) {
        console.error("Hint: This often means npx couldn't find the command right after installation. Ensure node_modules is correct.");
    }
    process.exit(1);
  }
  console.log("✅ Success");
}

function drawForgeHammer() {
  console.log(`\n      _______`);
  console.log(`     // ___ \\\\      🔥 Forging your project with ForgeKit 🔨`);
  console.log(`    | |___| |`);
  console.log(`    | |___| |     /----\\`);
  console.log(`    | |   | |    /      \\`);
  console.log(`    \\ |   | /   /________\\`);
  console.log(`     \\|___|/   /__________\\`);
  console.log(`      |   |   |____________|`);
  console.log(`      |   |   |____________|`);
  console.log(`      |   |   /------------\\`);
  console.log(`     /_____\\ /______________\\`);
  console.log(`    /______\\----------------/`);
  console.log(`   /________\\______________//`);
  console.log(`  /__________\\____________//`);
  console.log(` |____________|___________/\n`);
  console.log("===================================================\n");
}

async function setupGit(projectRoot) {
  console.log("\n📂 Initializing Git repository...");
  if (!fs.existsSync(projectRoot)) {
      console.warn(`⚠️ Git init skipped: Project directory ${projectRoot} does not exist yet.`);
      return;
  }
  const result = shell.exec("git init", { cwd: projectRoot, silent: true });
  checkCommand(result, `Failed to initialize git repository in ${projectRoot}. Is git installed and in your PATH?`);
}

function createProjectStructure(projectRoot, projectName, stack, uiFramework, storybook, obsidianVaultPath) {
  console.log(`\n🏗️ Creating project structure for '${projectName}' at ${projectRoot}...`);
  fs.mkdirSync(projectRoot, { recursive: true });

  // --- Create Obsidian Folder Automatically ---
  const vaultPath = obsidianVaultPath || DEFAULT_OBSIDIAN_VAULT_PATH;
  if (projectName && vaultPath) {
      const obsidianProjectFolder = path.join(vaultPath, projectName);
      try {
          fs.mkdirSync(obsidianProjectFolder, { recursive: true });
          console.log(`↳ Created Obsidian folder: ${obsidianProjectFolder}`);
      } catch (err) {
          console.warn(`⚠️ Warning: Could not create Obsidian folder at ${obsidianProjectFolder}.`);
          console.warn(`   Reason: ${err.message}`);
      }
  } else {
      if (!vaultPath) console.warn(`⚠️ Warning: Obsidian vault path not configured. Skipping Obsidian folder creation.`);
      if (!projectName) console.warn(`⚠️ Warning: Project name is invalid. Skipping Obsidian folder creation.`);
  }

  // Create docs folder and initial README
  const docsDir = path.join(projectRoot, "docs");
  fs.mkdirSync(docsDir, { recursive: true });
  const readmeContent = generateReadme(projectName, stack, uiFramework, storybook);
  fs.writeFileSync(path.join(projectRoot, "README.md"), readmeContent);
  console.log("↳ Created README.md");

  // Create CHANGELOG.md
  const changelogContent = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]
- Initial project scaffolding created by ForgeKit.
`;
  fs.writeFileSync(path.join(projectRoot, "CHANGELOG.md"), changelogContent);
  console.log("↳ Created CHANGELOG.md");

  // Create .gitignore
  const gitignoreContent = generateGitignore(stack);
  fs.writeFileSync(path.join(projectRoot, ".gitignore"), gitignoreContent);
  console.log("↳ Created .gitignore");
}

function generateReadme(projectName, stack, uiFramework, storybook) {
    let structure = `- \`frontend/\` – React/Vite frontend`;
    let gettingStartedDev = `cd frontend\nnpm run dev\n\n# In another terminal for backend:\ncd ../backend\nnpm run dev`;
    let gettingStartedInstall = `# Install root deps (if any), then frontend and backend deps\nnpm install\ncd frontend && npm install\ncd ../backend && npm install`;
    let backendSection = `- \`backend/\` – Express API`;
    let envFiles = `- \`frontend/.env\` (copy from \`frontend/.env.example\`)\n- \`backend/.env\` (copy from \`backend/.env.example\`)`;

    if (stack === "Next.js + Supabase") {
        structure = `- \`src/\` – Next.js application source (App Router)\n  - \`app/\` – Pages and layouts\n  - \`components/\` – Reusable components\n  - \`lib/\` – Utility functions (e.g., Supabase client)`;
        backendSection = "";
        gettingStartedInstall = `# Install dependencies\nnpm install`;
        gettingStartedDev = `# Run the development server\nnpm run dev`;
        envFiles = `- \`.env.local\` (copy from \`.env.example\`)`;
    }

    return `# ${projectName}

Welcome to **${projectName}**! Forged with ForgeKit.

## Overview
*Provide a brief description of your project.*

## Stack
- **Framework/API:** ${stack}
- **UI Framework:** ${uiFramework}
- **Storybook:** ${storybook ? "Included" : "Not included"}
- **Database:** Supabase (Setup required)

## Getting Started

1.  **Install Dependencies:**
    \`\`\`bash
    ${gettingStartedInstall}
    \`\`\`

2.  **Environment Setup:**
    - Locate the \`.env.example\` file(s) mentioned below.
    - Copy it to a new file (e.g., \`.env.local\` for Next.js, \`.env\` for Vite/Express).
    - Fill in your Supabase Project URL and Anon Key.
    - Find these in your Supabase project settings (API section).
    - **Required Files:**
      ${envFiles}

3.  **Run Development Servers:**
    \`\`\`bash
    ${gettingStartedDev}
    \`\`\`
    - The application should now be running (check terminal output for exact URLs).

## Folder Structure
${structure}
${backendSection ? backendSection : ''}
- \`docs/\` – Documentation files
- \`README.md\` – This file
- \`CHANGELOG.md\` – Project changes history
- \`.gitignore\` – Files ignored by Git

## Supabase Setup Reminder
- Create a project on [Supabase](https://supabase.com/).
- Get your Project URL and Anon Key from the API settings.
- Update your environment file(s) as described in "Getting Started".
- Define your database schema using the Supabase table editor or SQL.
`;
}

function generateGitignore(stack) {
  let gitignore = `# Dependencies
/node_modules
/.pnp
.pnp.js

# Build outputs
/dist
/build
/out
/.next

# Environment variables (keep example files)
.env
.env.*
!.env.example
.env.local

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Editor directories and files
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json
*.sublime-workspace
.idea

# Optional files
/.cache
`;

  if (stack === "React + Express + Supabase") {
    gitignore += `
# React + Express specific
/frontend/node_modules
/frontend/dist
/backend/node_modules
/backend/dist
`;
  } else if (stack === "Next.js + Supabase") {
    gitignore += `
# Next.js specific
/.next/
/out/
`;
  }

  return gitignore.trim();
}

async function setupSupabase(targetDir, envPrefix = "VITE") {
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
        const supabaseClientContent = `import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL or Anon Key is missing. Make sure to set them in your .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
`;
        fs.writeFileSync(path.join(libDir, 'supabaseClient.ts'), supabaseClientContent);
        console.log(`↳ Created basic src/lib/supabaseClient.ts`);
    }

     if (envPrefix === 'NEXT_PUBLIC') {
        const libDir = path.join(targetDir, 'src', 'lib');
        fs.mkdirSync(libDir, { recursive: true });
        const supabaseClientContent = `import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL or Anon Key is missing. Make sure to set them in your .env.local file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
`;
        fs.writeFileSync(path.join(libDir, 'supabaseClient.ts'), supabaseClientContent);
        console.log(`↳ Created basic src/lib/supabaseClient.ts (client-side)`);
    }
}

async function setupUIFramework(targetDir, uiFramework, stackType) {
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

      const tailwindConfigContent = `/** @type {import('tailwindcss').Config} */
module.exports = {
content: [
  ${contentGlob}
],
theme: {
  extend: {},
},
plugins: [],
}`;
      fs.writeFileSync(configPath, tailwindConfigContent);
      console.log(`↳ Created/Updated tailwind.config.js`);

      console.log(`  Creating postcss.config.js manually (Tailwind v4)...`);
      const postcssConfigContent = `// postcss.config.js
import tailwindcss from '@tailwindcss/postcss'; // Import the new package

export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
},
};`;
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
  }
}

async function setupStorybook(targetDir) {
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

// ---- ADD THIS FUNCTION TO SET UP A ROOT-LEVEL 'npm run dev' FOR BOTH SERVERS ----
function setupRootConcurrentDev(projectRoot) {
  const rootPkgJsonPath = path.join(projectRoot, 'package.json');
  // If there's no root package.json yet, create it
  if (!fs.existsSync(rootPkgJsonPath)) {
    let initResult = shell.exec("npm init -y", { cwd: projectRoot, silent: true });
    checkCommand(initResult, "Failed to create a root package.json");
  }

  // Ensure "concurrently" is installed at the root (as a dev dependency)
  let installResult = shell.exec("npm install -D concurrently", { cwd: projectRoot, silent: true });
  checkCommand(installResult, "Failed to install 'concurrently' at root");

  // Update or create the "dev" script in root package.json
  const rootPkg = JSON.parse(fs.readFileSync(rootPkgJsonPath, 'utf-8'));
  if (!rootPkg.scripts) {
    rootPkg.scripts = {};
  }

  // "npm run dev" will run both front and back in parallel
  rootPkg.scripts.dev = "concurrently \"npm run dev --prefix frontend\" \"npm run dev --prefix backend\"";

  fs.writeFileSync(rootPkgJsonPath, JSON.stringify(rootPkg, null, 2));
  console.log(`↳ Added "dev" script to root package.json: runs frontend & backend concurrently.`);
}
// ---- END ADDITION ----

async function setupReactExpress(projectRoot, options) {
  console.log("\n🚀 Setting up React + Express + Supabase...");

  // --- Frontend Setup (React + Vite) ---
  // (Retain the existing frontend creation so it won't break anything else)
  const frontendDir = path.join(projectRoot, "frontend");
  console.log("\n▶️ Creating frontend with Vite (React + TS)...");
  let result = shell.exec(`npm create vite@latest frontend -- --template react-ts`, { cwd: projectRoot, silent: true });
  checkCommand(result, `Failed to create Vite project in ${frontendDir}`);

  try { fs.rmSync(path.join(frontendDir, ".gitignore"), { force: true }); } catch {}
  try { fs.rmSync(path.join(frontendDir, "README.md"), { force: true }); } catch {}

  console.log("  Installing frontend dependencies...");
  result = shell.exec("npm install", { cwd: frontendDir, silent: true });
  checkCommand(result, `Failed to install frontend dependencies in ${frontendDir}`);

  const appTsxPath = path.join(frontendDir, "src", "App.tsx");
  const mainTsxPath = path.join(frontendDir, "src", "main.tsx");
  const indexCssPath = path.join(frontendDir, "src", "index.css");

  let appContent = `// import { useState } from 'react'

export function App() {
  return (
    <>
      <h1>${options.projectName} (React Frontend)</h1>
      <p>Edit <code>src/App.tsx</code> and save to test HMR</p>
    </>
  )
}`;
  if (options.uiFramework === "Chakra") {
      appContent = `import { ChakraProvider, Box, Heading, Text } from '@chakra-ui/react';

export function AppContent() {
  return (
    <Box p={4}>
      <Heading mb={4}>${options.projectName} (React + Chakra)</Heading>
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
}
`;
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

  await setupSupabase(frontendDir, "VITE");
  await setupUIFramework(frontendDir, options.uiFramework, 'vite');
  if (options.storybook) {
    await setupStorybook(frontendDir);
  }

  // --- Backend Setup (Express + TS) ---
  const backendDir = path.join(projectRoot, "backend");
  console.log("\n◀️ Setting up backend (Express + TS)...");
  fs.mkdirSync(backendDir, { recursive: true });

  console.log(`  Initializing backend package in ${backendDir}...`);
  result = shell.exec("npm init -y", { cwd: backendDir, silent: true });
  checkCommand(result, `Failed to initialize backend npm package in ${backendDir}`);

  console.log("  Installing backend dependencies...");
  const backendDeps = ["express", "cors", "dotenv"];
  const backendDevDeps = ["typescript", "@types/express", "@types/cors", "@types/node", "ts-node"];
  if (options.useNodemon) backendDevDeps.push("nodemon");

  result = shell.exec(`npm install ${backendDeps.join(" ")}`, { cwd: backendDir, silent: true });
  checkCommand(result, `Failed to install backend dependencies in ${backendDir}`);
  result = shell.exec(`npm install -D ${backendDevDeps.join(" ")}`, { cwd: backendDir, silent: true });
  checkCommand(result, `Failed to install backend dev dependencies in ${backendDir}`);

  const tsconfigContent = `{
  "compilerOptions": {
    "target": "ES2016",
    "module": "CommonJS",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "sourceMap": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}`;
  fs.writeFileSync(path.join(backendDir, "tsconfig.json"), tsconfigContent);
  console.log(`↳ Created tsconfig.json in backend`);

  const backendSrcDir = path.join(backendDir, "src");
  fs.mkdirSync(backendSrcDir, { recursive: true });
  const indexTsContent = `import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3001;

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from the Express Backend!');
});

app.get('/api/message', (req: Request, res: Response) => {
  res.json({ message: 'This is a message from your API' });
});

app.listen(port, () => {
  console.log(\`🚀 Backend server listening on http://localhost:\${port}\`);
});
`;
  fs.writeFileSync(path.join(backendSrcDir, "index.ts"), indexTsContent);
  console.log(`↳ Created src/index.ts in backend`);

  const backendPkgPath = path.join(backendDir, "package.json");
  const backendPkg = JSON.parse(fs.readFileSync(backendPkgPath, 'utf-8'));
  backendPkg.main = "dist/index.js";
  backendPkg.scripts = {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": options.useNodemon
      ? "nodemon --watch src --ext ts --exec ts-node src/index.ts"
      : "ts-node src/index.ts"
  };
  fs.writeFileSync(backendPkgPath, JSON.stringify(backendPkg, null, 2));
  console.log(`↳ Updated package.json scripts in backend`);

  const backendEnvExamplePath = path.join(backendDir, ".env.example");
  const backendEnvContent = `PORT=3001
# Add other backend-specific environment variables here
# Example: DATABASE_URL=your_db_connection_string
`;
  fs.writeFileSync(backendEnvExamplePath, backendEnvContent);
  console.log(`↳ Created .env.example in backend`);

  // ---- CALL OUR NEW FUNCTION TO SETUP ROOT "npm run dev" ----
  setupRootConcurrentDev(projectRoot);
  // ----------------------------------------------------------
}

async function setupNextJS(projectRoot, options) {
  console.log("\n🚀 Setting up Next.js + Supabase...");

  console.log("\n▶️ Creating project with create-next-app...");
  let cnaFlags = `--ts --eslint --app --src-dir --import-alias "@/*" --use-npm`;
  if (options.uiFramework === 'Tailwind') {
      cnaFlags += ' --tailwind';
  } else {
      cnaFlags += ' --no-tailwind';
  }

  const parentDir = path.dirname(projectRoot);
  fs.mkdirSync(parentDir, { recursive: true });

  const createCommand = `npx create-next-app@latest "${options.projectName}" ${cnaFlags}`;
  let result = shell.exec(createCommand, { cwd: parentDir });
  checkCommand(result, `Failed to create Next.js project '${options.projectName}'.`);

  console.log("\n📝 Adding ForgeKit structure files...");
  createProjectStructure(projectRoot, options.projectName, options.stack, options.uiFramework, options.storybook, options.obsidianVaultPath);

  await setupSupabase(projectRoot, "NEXT_PUBLIC");
  if (options.uiFramework !== 'Tailwind') {
     await setupUIFramework(projectRoot, options.uiFramework, 'nextjs');
  }

  const pageTsxPath = path.join(projectRoot, "src", "app", "page.tsx");
  if (fs.existsSync(pageTsxPath)) {
      try {
          let pageContent = fs.readFileSync(pageTsxPath, 'utf-8');
          if (options.uiFramework === 'Chakra') {
            pageContent = `import { Box, Heading, Text } from '@chakra-ui/react';

export default function Home() {
  return (
    <Box p={4}>
      <Heading mb={4}>${options.projectName} (Next.js + Chakra)</Heading>
      <Text>Welcome! Your Next.js project is running.</Text>
    </Box>
  );
}`;
            console.warn("⚠️ Remember to wrap src/app/layout.tsx with <ChakraProvider> for Chakra.");
            fs.writeFileSync(pageTsxPath, pageContent);
            console.log(`↳ Updated src/app/page.tsx for Chakra example.`);
          } else if (pageContent.includes('<main')) {
              pageContent = pageContent.replace(
                /(<main.*?>)/,
                `$1\n      <h1 className="text-2xl font-bold mb-4">${options.projectName}</h1>\n      <p>Welcome! Your Next.js project is running.</p>\n`
              );
              fs.writeFileSync(pageTsxPath, pageContent);
              console.log(`↳ Updated src/app/page.tsx with initial content.`);
          }
      } catch (err) {
          console.warn(`⚠️ Could not modify ${pageTsxPath}: ${err.message}`);
      }
  }

  if (options.storybook) {
    await setupStorybook(projectRoot);
  }
}

(async () => {
  let projectsBaseDir;
  try {
      const __filename = fileURLToPath(import.meta.url);
      const createScriptDir = path.dirname(__filename);
      projectsBaseDir = path.dirname(createScriptDir);
  } catch (e) {
      console.error("❌ Error determining script location.");
      process.exit(1);
  }

  const argv = yargs(hideBin(process.argv))
    .option("projectName", { type: "string", description: "Name of the project to create" })
    .option("stack", { type: "string", description: "Tech stack", choices: ["React + Express + Supabase", "Next.js + Supabase"] })
    .option("gitInit", { type: "boolean", description: "Initialize git repository", default: true })
    .option("useNodemon", { type: "boolean", description: "Use nodemon for backend (React+Express)", default: true })
    .option("uiFramework", { type: "string", description: "UI framework", choices: ["Tailwind", "Chakra", "None"], default: "None" })
    .option("storybook", { type: "boolean", description: "Include Storybook setup", default: false })
    .option("obsidianVaultPath", {type: "string", description: "Path to Obsidian Vault", default: DEFAULT_OBSIDIAN_VAULT_PATH })
    .option("nonInteractive", { type: "boolean", description: "Run in non-interactive mode", default: false })
    .help()
    .alias('h', 'help')
    .wrap(null)
    .argv;

  let options = {};

  if (argv.nonInteractive) {
    if (!argv.projectName || !argv.stack) {
      console.error("❌ Error: In non-interactive mode, --projectName and --stack are required.");
      yargs().showHelp();
      process.exit(1);
    }
    options = { ...argv };
    options.gitInit = !!options.gitInit;
    options.useNodemon = !!options.useNodemon;
    options.storybook = !!options.storybook;

    console.log("\n⚙️ Running in Non-Interactive Mode with options:");
    console.log(`  Project Name: ${options.projectName}`);
    console.log(`  Stack: ${options.stack}`);
    console.log(`  Git Init: ${options.gitInit}`);
    if (options.stack === "React + Express + Supabase") {
        console.log(`  Use Nodemon: ${options.useNodemon}`);
    }
    console.log(`  UI Framework: ${options.uiFramework}`);
    console.log(`  Storybook: ${options.storybook}`);
    console.log(`  Obsidian Vault Path: ${options.obsidianVaultPath}`);

  } else {
    const answers = await inquirer.prompt([
      { type: "input", name: "projectName", message: "Project name:", validate: input => !!input || "Project name cannot be empty." },
      { type: "list", name: "stack", message: "Choose your tech stack:", choices: ["React + Express + Supabase", "Next.js + Supabase"] },
      { type: "confirm", name: "gitInit", message: "Initialize a Git repository?", default: true },
      { type: "confirm", name: "useNodemon", message: "Use Nodemon for backend auto-restart?", default: true, when: (ans) => ans.stack === "React + Express + Supabase" },
      { type: "list", name: "uiFramework", message: "Choose a UI framework:", choices: ["Tailwind", "Chakra", "None"], default: "None" },
      { type: "confirm", name: "storybook", message: "Include Storybook setup?", default: false },
      { type: "input", name: "obsidianVaultPath", message: `Obsidian vault path (default: ${DEFAULT_OBSIDIAN_VAULT_PATH}):`, default: DEFAULT_OBSIDIAN_VAULT_PATH },
    ]);
    options = { ...answers };
    if (options.stack !== "React + Express + Supabase") {
        options.useNodemon = false;
    }
    if (options.obsidianVaultPath === '') {
        options.obsidianVaultPath = DEFAULT_OBSIDIAN_VAULT_PATH;
    }
  }

  drawForgeHammer();
  console.log(`🔥 Starting project setup for: ${options.projectName}`);
  console.log(`Selected Stack: ${options.stack}`);

  const projectRoot = path.join(projectsBaseDir, options.projectName);
  console.log(`Project will be created at: ${projectRoot}`);

  if (fs.existsSync(projectRoot)) {
      if (argv.nonInteractive) {
          console.error(`❌ Error: Project directory '${projectRoot}' already exists.`);
          process.exit(1);
      }
      const { confirm } = await inquirer.prompt([{
          type: 'confirm',
          name: 'confirm',
          message: `Directory '${options.projectName}' already exists at '${projectRoot}'. Continue?`,
          default: false
      }]);
      if (!confirm) {
          console.log("Aborting project creation.");
          process.exit(0);
      }
      console.log("Proceeding with existing directory...");
  }

  if (options.stack !== "Next.js + Supabase") {
      createProjectStructure(projectRoot, options.projectName, options.stack, options.uiFramework, options.storybook, options.obsidianVaultPath);
  }

  if (options.gitInit) {
      if (!fs.existsSync(projectRoot)) {
         fs.mkdirSync(projectRoot, { recursive: true });
         console.log(`Created project directory: ${projectRoot}`);
      }
      await setupGit(projectRoot);
  }

  try {
    if (options.stack === "React + Express + Supabase") {
      await setupReactExpress(projectRoot, options);
    } else if (options.stack === "Next.js + Supabase") {
      await setupNextJS(projectRoot, options);
    } else {
      console.error(`❌ Error: Unknown stack selected: ${options.stack}`);
      process.exit(1);
    }

    console.log(`\n===================================================`);
    console.log(`✅ Project '${options.projectName}' has been forged successfully!`);
    console.log(`📂 Located at: ${projectRoot}`);
    const obsidianVault = options.obsidianVaultPath || DEFAULT_OBSIDIAN_VAULT_PATH;
    if (obsidianVault) {
        const obsidianProjectFolder = path.join(obsidianVault, options.projectName);
        if (fs.existsSync(obsidianProjectFolder)) {
            console.log(`📓 Obsidian folder created at: ${obsidianProjectFolder}`);
        } else {
             console.log(`(Obsidian folder link: ${obsidianProjectFolder} - check warnings if creation failed)`);
        }
    }
    console.log(`\nNext Steps:`);
    const relativeProjectPath = path.relative(process.cwd(), projectRoot) || options.projectName;
    console.log(`  1. cd "${relativeProjectPath}"`);
    console.log(`  2. Review & fill in your Supabase credentials in the .env files (see README.md).`);
    console.log(`  3. Run "npm run dev" in the project root to start both frontend and backend!`);
    console.log(`\nHappy coding! 🎉`);

  } catch (error) {
      console.error(`\n❌ An unexpected error occurred during setup:`);
      console.error(error.message || error);
      if (error.stack) {
        console.error(error.stack);
      }
      process.exit(1);
  }

})();
