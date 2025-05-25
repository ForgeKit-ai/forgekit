#!/usr/bin/env node
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { drawForgeHammer, setupGit, createProjectStructure, sanitizeProjectName } from '../src/utils.js';
import { spawn } from 'child_process';
import { scaffoldProject } from '../src/scaffold.js';
import { frontendOptions, uiOptions, backendOptions, databaseOptions, uiCompatibility, backendCompatibility, dbCompatibility } from '../src/registries/modularOptions.js';
import { runDoctor } from '../src/doctor.js';
import * as deployCommand from '../commands/deploy.js';

async function main() {
  const projectsBaseDir = process.cwd();

  const argv = await yargs(hideBin(process.argv))
    .command(deployCommand)
    .option('projectName', { type: 'string', description: 'Name of the project to create' })
    .option('frontend', { type: 'string', choices: Object.keys(frontendOptions) })
    .option('ui', { type: 'string', choices: Object.keys(uiOptions) })
    .option('backend', { type: 'string', choices: Object.keys(backendOptions) })
    .option('database', { type: 'string', choices: Object.keys(databaseOptions) })
    .option('gitInit', { type: 'boolean', default: true })
    .option('useNodemon', { type: 'boolean', default: true })
    .option('nonInteractive', { type: 'boolean', default: false })
    .option('doctor', { type: 'boolean' })
    .help()
    .alias('h', 'help')
    .wrap(null)
    .parse();

  if (argv._[0] === 'deploy') {
    return;
  }

  if (argv.doctor) {
    runDoctor();
    process.exit(0);
  }

  let options = {};

  const validateCombo = (frontend, ui, backend, database) => {
    if (ui && !uiCompatibility[frontend].includes(ui)) {
      throw new Error(`UI option '${ui}' is not compatible with ${frontendOptions[frontend]}`);
    }
    if (backendCompatibility[frontend]) {
      const allowed = backendCompatibility[frontend];
      if (!allowed.includes(backend)) {
        throw new Error(`Backend '${backend}' is not compatible with ${frontendOptions[frontend]}`);
      }
    }
    if (database && !dbCompatibility[backend].includes(database)) {
      throw new Error(`Database '${database}' is not compatible with backend '${backend}'`);
    }
  };

  if (argv.nonInteractive) {
    if (!argv.projectName || !argv.frontend) {
      console.error('❌ In non-interactive mode, --projectName and --frontend are required.');
      process.exit(1);
    }
    const frontend = argv.frontend;
    const ui = argv.ui || uiCompatibility[frontend][0];
    const backend = argv.backend ?? backendCompatibility[frontend][0];
    const database = argv.database || null;
    try { validateCombo(frontend, ui, backend, database); } catch (err) { console.error(`❌ ${err.message}`); process.exit(1); }
    options = { projectName: argv.projectName, frontend, ui, backend, database, gitInit: !!argv.gitInit, useNodemon: backend === 'express' ? !!argv.useNodemon : false };
    console.log('\n⚙️ Running in Non-Interactive Mode with options:');
    console.log(options);
  } else {
    const answers = await inquirer.prompt([
      { type: 'input', name: 'projectName', message: 'Project name:', validate: i => !!i || 'Project name cannot be empty.' },
      { type: 'list', name: 'frontend', message: 'Choose a frontend framework:', choices: Object.entries(frontendOptions).map(([k,v]) => ({ name: v, value: k })) },
      { type: 'list', name: 'ui', message: 'Choose a UI library:', choices: ans => uiCompatibility[ans.frontend].map(k => ({ name: uiOptions[k], value: k })) },
      { type: 'list', name: 'backend', message: 'Choose a backend framework:', choices: ans => backendCompatibility[ans.frontend].map(k => ({ name: backendOptions[k], value: k })) },
      { type: 'confirm', name: 'useDb', message: 'Add a local database?', default: false },
      { type: 'list', name: 'database', when: ans => ans.useDb, message: 'Choose a database:', choices: ans => dbCompatibility[ans.backend].map(k => ({ name: databaseOptions[k], value: k })) },
      { type: 'confirm', name: 'gitInit', message: 'Initialize a Git repository?', default: true },
      { type: 'confirm', name: 'useNodemon', message: 'Enable Nodemon for automatic backend restarts?', default: true, when: ans => ans.backend === 'express' }
    ]);
    options = { projectName: answers.projectName, frontend: answers.frontend, ui: answers.ui, backend: answers.backend, database: answers.database || null, gitInit: answers.gitInit, useNodemon: answers.backend === 'express' ? answers.useNodemon : false };
  }

  const sanitizedName = sanitizeProjectName(options.projectName);
  if (sanitizedName !== options.projectName) {
    console.log(`⚠️ Project name sanitized to '${sanitizedName}' for folder creation.`);
  }
  options.projectName = sanitizedName;

  drawForgeHammer();
  console.log(`🔥 Starting project setup for: ${options.projectName}`);

  const projectRoot = path.join(projectsBaseDir, options.projectName);
  console.log(`Project will be created at: ${projectRoot}`);

  if (fs.existsSync(projectRoot)) {
    const { confirm } = await inquirer.prompt([{ type: 'confirm', name: 'confirm', message: `Directory '${options.projectName}' already exists at '${projectRoot}'. Continue?`, default: false }]);
    if (!confirm) {
      console.log('Aborting project creation.');
      process.exit(0);
    }
    console.log('Proceeding with existing directory...');
  }

  if (options.frontend !== 'nextjs') {
    createProjectStructure(
      projectRoot,
      options.projectName,
      { frontend: frontendOptions[options.frontend], backend: backendOptions[options.backend] },
      options.ui,
      options.database,
      options.gitInit
    );
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
    frontend: options.frontend,
    backend: options.backend,
    ui: options.ui,
    useNodemon: options.useNodemon,
    database: options.database,
    stackLabel: `${frontendOptions[options.frontend]}${options.backend ? ' + ' + backendOptions[options.backend] : ''}`,
    gitInit: options.gitInit
  };

  try {
    await scaffoldProject(config);

    console.log('\n===================================================');
    console.log(`✅ Project '${options.projectName}' has been forged successfully!`);
    console.log(`📂 Located at: ${projectRoot}`);
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
}

main();
