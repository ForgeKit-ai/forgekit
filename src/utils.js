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
  console.log(`\n      _______`);
  console.log(`     // ___ \\      🔥 Forging your project with ForgeKit 🔨`);
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

export async function setupGit(projectRoot) {
  console.log("\n📂 Initializing Git repository...");
  if (!fs.existsSync(projectRoot)) {
      console.warn(`⚠️ Git init skipped: Project directory ${projectRoot} does not exist yet.`);
      return;
  }
  const result = shell.exec("git init", { cwd: projectRoot, silent: true });
  checkCommand(result, `Failed to initialize git repository in ${projectRoot}. Is git installed and in your PATH?`);
}

export function createProjectStructure(projectRoot, projectName, stack, uiFramework, database) {
  console.log(`\n🏗️ Creating project structure for '${projectName}' at ${projectRoot}...`);
  fs.mkdirSync(projectRoot, { recursive: true });

  const docsDir = path.join(projectRoot, "docs");
  fs.mkdirSync(docsDir, { recursive: true });
  const readmeContent = generateReadme(projectName, stack, uiFramework, database);
  fs.writeFileSync(path.join(projectRoot, "README.md"), readmeContent);
  console.log("↳ Created README.md");

  const changelogContent = `# Changelog\n\nAll notable changes to this project will be documented in this file.\n\nThe format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),\nand this project adheres to [Semantic Versioning](https://semver.org/).\n\n## [Unreleased]\n- Initial project scaffolding created by ForgeKit.`;
  fs.writeFileSync(path.join(projectRoot, "CHANGELOG.md"), changelogContent);
  console.log("↳ Created CHANGELOG.md");

  const gitignoreContent = generateGitignore(stack);
  fs.writeFileSync(path.join(projectRoot, ".gitignore"), gitignoreContent);
  console.log("↳ Created .gitignore");
}

export function generateReadme(projectName, stack, uiFramework, database) {
  let readme = `# ${projectName}\n\n## Stack\n- **Frontend:** ${stack.frontend}\n${stack.backend ? `- **Backend:** ${stack.backend}\n` : ''}- **UI Library:** ${uiFramework}\n- **Database:** ${database || 'None'}\n`;

  readme += `\n## Development\n`;
  if (stack.backend) {
    readme += `- Run \`npm run dev\` from the project root to start frontend and backend.\n`;
    readme += `- Or run \`npm run dev\` in the \`frontend\` and \`backend\` directories individually.\n`;
  } else {
    readme += `Run \`npm run dev\` in the \`frontend\` directory to start the development server.\n`;
  }

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
