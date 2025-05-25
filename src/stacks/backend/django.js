import path from 'path';
import fs from 'fs';
import shell from 'shelljs';
import { checkCommand } from '../../utils.js';

export async function setupDjango(config) {
  const { targetDir, projectName } = config;
  const backendDir = path.join(targetDir, 'backend');

  console.log('\n◀️ Setting up backend (Django)...');
  fs.mkdirSync(backendDir, { recursive: true });

  let result = shell.exec('python3 -m venv venv', { cwd: backendDir, silent: true });
  checkCommand(result, 'Failed to create Python venv for Django');

  result = shell.exec('venv/bin/pip install django', { cwd: backendDir, silent: true });
  checkCommand(result, 'Failed to install Django');

  result = shell.exec(`venv/bin/django-admin startproject ${projectName} .`, { cwd: backendDir, silent: true });
  checkCommand(result, 'Failed to start Django project');

  fs.writeFileSync(path.join(backendDir, 'requirements.txt'), 'django\n');
}
