#!/usr/bin/env node
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { fileURLToPath } from 'url';
import { drawForgeHammer, setupGit, createProjectStructure, DEFAULT_OBSIDIAN_VAULT_PATH } from '../src/utils.js';
import { scaffoldProject } from '../src/scaffold.js';

(async () => {
  let projectsBaseDir;
  try {
      const __filename = fileURLToPath(import.meta.url);
      const createScriptDir = path.dirname(__filename);
      projectsBaseDir = path.dirname(createScriptDir);
  } catch (e) {
      console.error('❌ Error determining script location.');
      process.exit(1);
  }

  const argv = yargs(hideBin(process.argv))
    .option('projectName', { type: 'string', description: 'Name of the project to create' })
    .option('stack', { type: 'string', description: 'Tech stack', choices: ['React + Express + Supabase', 'Next.js + Supabase'] })
    .option('gitInit', { type: 'boolean', description: 'Initialize git repository', default: true })
    .option('useNodemon', { type: 'boolean', description: 'Use nodemon for backend (React+Express)', default: true })
    .option('uiFramework', { type: 'string', description: 'UI framework', choices: ['Tailwind', 'Chakra', 'None'], default: 'None' })
    .option('storybook', { type: 'boolean', description: 'Include Storybook setup', default: false })
    .option('obsidianVaultPath', { type: 'string', description: 'Path to Obsidian Vault', default: DEFAULT_OBSIDIAN_VAULT_PATH })
    .option('nonInteractive', { type: 'boolean', description: 'Run in non-interactive mode', default: false })
    .help()
    .alias('h', 'help')
    .wrap(null)
    .argv;

  let options = {};

  if (argv.nonInteractive) {
    if (!argv.projectName || !argv.stack) {
      console.error('❌ Error: In non-interactive mode, --projectName and --stack are required.');
      yargs().showHelp();
      process.exit(1);
    }
    options = { ...argv };
    options.gitInit = !!options.gitInit;
    options.useNodemon = !!options.useNodemon;
    options.storybook = !!options.storybook;

    console.log('\n⚙️ Running in Non-Interactive Mode with options:');
    console.log(`  Project Name: ${options.projectName}`);
    console.log(`  Stack: ${options.stack}`);
    console.log(`  Git Init: ${options.gitInit}`);
    if (options.stack === 'React + Express + Supabase') {
        console.log(`  Use Nodemon: ${options.useNodemon}`);
    }
    console.log(`  UI Framework: ${options.uiFramework}`);
    console.log(`  Storybook: ${options.storybook}`);
    console.log(`  Obsidian Vault Path: ${options.obsidianVaultPath}`);

  } else {
    const answers = await inquirer.prompt([
      { type: 'input', name: 'projectName', message: 'Project name:', validate: input => !!input || 'Project name cannot be empty.' },
      { type: 'list', name: 'stack', message: 'Choose your tech stack:', choices: ['React + Express + Supabase', 'Next.js + Supabase'] },
      { type: 'confirm', name: 'gitInit', message: 'Initialize a Git repository?', default: true },
      { type: 'confirm', name: 'useNodemon', message: 'Use Nodemon for backend auto-restart?', default: true, when: (ans) => ans.stack === 'React + Express + Supabase' },
      { type: 'list', name: 'uiFramework', message: 'Choose a UI framework:', choices: ['Tailwind', 'Chakra', 'None'], default: 'None' },
      { type: 'confirm', name: 'storybook', message: 'Include Storybook setup?', default: false },
      { type: 'input', name: 'obsidianVaultPath', message: `Obsidian vault path (default: ${DEFAULT_OBSIDIAN_VAULT_PATH}):`, default: DEFAULT_OBSIDIAN_VAULT_PATH },
    ]);
    options = { ...answers };
    if (options.stack !== 'React + Express + Supabase') {
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
      const { confirm } = await inquirer.prompt([{ type: 'confirm', name: 'confirm', message: `Directory '${options.projectName}' already exists at '${projectRoot}'. Continue?`, default: false }]);
      if (!confirm) {
          console.log('Aborting project creation.');
          process.exit(0);
      }
      console.log('Proceeding with existing directory...');
  }

  if (options.stack !== 'Next.js + Supabase') {
      createProjectStructure(projectRoot, options.projectName, options.stack, options.uiFramework, options.storybook, options.obsidianVaultPath);
  }

  if (options.gitInit) {
      if (!fs.existsSync(projectRoot)) {
         fs.mkdirSync(projectRoot, { recursive: true });
         console.log(`Created project directory: ${projectRoot}`);
      }
      await setupGit(projectRoot);
  }

  const config = {
    projectName: options.projectName,
    targetDir: projectRoot,
    frontend: options.stack === 'React + Express + Supabase' ? 'react-vite' : 'nextjs',
    backend: options.stack === 'React + Express + Supabase' ? 'express' : null,
    ui: options.uiFramework,
    storybook: options.storybook,
    useNodemon: options.useNodemon,
    obsidianVaultPath: options.obsidianVaultPath,
    stackLabel: options.stack
  };

  try {
    await scaffoldProject(config);

    console.log('\n===================================================');
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
    console.log('\nNext Steps:');
    const relativeProjectPath = path.relative(process.cwd(), projectRoot) || options.projectName;
    console.log(`  1. cd "${relativeProjectPath}"`);
    console.log('  2. Review & fill in your Supabase credentials in the .env files (see README.md).');
    console.log('  3. Run "npm run dev" in the project root to start both frontend and backend!');
    console.log('\nHappy coding! 🎉');

  } catch (error) {
      console.error('\n❌ An unexpected error occurred during setup:');
      console.error(error.message || error);
      if (error.stack) {
        console.error(error.stack);
      }
      process.exit(1);
  }
})();
