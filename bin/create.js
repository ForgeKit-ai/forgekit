#!/usr/bin/env node
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { fileURLToPath } from 'url';
import { drawForgeHammer, setupGit, createProjectStructure, sanitizeProjectName } from '../src/utils.js';
import { spawn } from 'child_process';
import { scaffoldProject } from '../src/scaffold.js';
import { stacks } from '../src/registries/stackRegistry.js';


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

  const stackKeys = Object.keys(stacks);
  const argv = yargs(hideBin(process.argv))
    .option('projectName', { type: 'string', description: 'Name of the project to create' })
    .option('stack', { type: 'string', description: 'Tech stack', choices: stackKeys })
    .option('gitInit', { type: 'boolean', description: 'Initialize git repository', default: true })
    .option('useNodemon', { type: 'boolean', description: 'Use nodemon for backend (React+Express)', default: true })
    .option('uiFramework', { type: 'string', description: 'UI framework', choices: ['Tailwind', 'Chakra', 'None'], default: 'None' })
    .option('storybook', { type: 'boolean', description: 'Include Storybook setup', default: false })
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
    if (!stacks[argv.stack]) {
      console.error(`❌ Unknown stack key '${argv.stack}'.`);
      console.error(`Available stacks: ${Object.keys(stacks).join(', ')}`);
      process.exit(1);
    }
    options = { ...argv };
    options.gitInit = !!options.gitInit;
    options.useNodemon = stacks[argv.stack].backend === 'express' ? !!options.useNodemon : false;
    options.storybook = !!options.storybook;

    console.log('\n⚙️ Running in Non-Interactive Mode with options:');
    console.log(`  Project Name: ${options.projectName}`);
    console.log(`  Stack: ${options.stack} (${stacks[options.stack].label})`);
    console.log(`  Git Init: ${options.gitInit}`);
    if (stacks[options.stack].backend === 'express') {
        console.log(`  Use Nodemon: ${options.useNodemon}`);
    }
    console.log(`  UI Framework: ${options.uiFramework}`);
    console.log(`  Storybook: ${options.storybook}`);

  } else {
    const stackChoicesInteractive = Object.entries(stacks).map(([key, val]) => ({ name: val.label, value: key }));
    const answers = await inquirer.prompt([
      { type: 'input', name: 'projectName', message: 'Project name:', validate: input => !!input || 'Project name cannot be empty.' },
      { type: 'list', name: 'stack', message: 'Choose your tech stack:', choices: stackChoicesInteractive },
      { type: 'confirm', name: 'gitInit', message: 'Initialize a Git repository?', default: true },
      { type: 'confirm', name: 'useNodemon', message: 'Use Nodemon for backend auto-restart?', default: true, when: (ans) => stacks[ans.stack].backend === 'express' },
      { type: 'list', name: 'uiFramework', message: 'Choose a UI framework:', choices: ['Tailwind', 'Chakra', 'None'], default: 'None' },
      { type: 'confirm', name: 'storybook', message: 'Include Storybook setup?', default: false },
    ]);
    options = { ...answers };
    if (stacks[options.stack].backend !== 'express') {
        options.useNodemon = false;
    }
  }

  const sanitizedName = sanitizeProjectName(options.projectName);
  if (sanitizedName !== options.projectName) {
    console.log(`⚠️ Project name sanitized to '${sanitizedName}' for folder creation.`);
  }
  options.projectName = sanitizedName;

  drawForgeHammer();
  console.log(`🔥 Starting project setup for: ${options.projectName}`);
  console.log(`Selected Stack: ${stacks[options.stack].label}`);

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

  if (stacks[options.stack].frontend !== 'nextjs') {
      createProjectStructure(projectRoot, options.projectName, stacks[options.stack].label, options.uiFramework, options.storybook);
  }

  if (options.gitInit) {
      if (!fs.existsSync(projectRoot)) {
         fs.mkdirSync(projectRoot, { recursive: true });
         console.log(`Created project directory: ${projectRoot}`);
      }
      await setupGit(projectRoot);
  }

  const stackConfig = stacks[options.stack];
  const config = {
    projectName: options.projectName,
    targetDir: projectRoot,
    frontend: stackConfig.frontend,
    backend: stackConfig.backend,
    ui: options.uiFramework,
    storybook: options.storybook,
    useNodemon: options.useNodemon,
    stackLabel: stackConfig.label,
    database: stackConfig.database
  };

  try {
    await scaffoldProject(config);

    console.log('\n===================================================');
    console.log(`✅ Project '${options.projectName}' has been forged successfully!`);
    console.log(`📂 Located at: ${projectRoot}`);
    console.log('\nNext Steps:');
    console.log('  Review & fill in your Supabase credentials in the .env files (see README.md).');
    console.log('  Run "npm run dev" in the project root to start both frontend and backend!');
    console.log('\nHappy coding! 🎉');

    console.log(`\nOpening shell in ${projectRoot} ...`);
    const shellProcess = spawn(process.env.SHELL || process.env.COMSPEC || 'sh', { stdio: 'inherit', cwd: projectRoot, shell: true });
    shellProcess.on('exit', code => process.exit(code));

  } catch (error) {
      console.error('\n❌ An unexpected error occurred during setup:');
      console.error(error.message || error);
      if (error.stack) {
        console.error(error.stack);
      }
      process.exit(1);
  }
})();
