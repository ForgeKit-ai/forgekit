import path from 'path';
import fs from 'fs';
import shell from 'shelljs';
import { checkCommand } from '../../utils.js';

export async function setupFastAPI(config) {
  const { targetDir } = config;
  const backendDir = path.join(targetDir, 'backend');

  console.log('\n◀️ Setting up backend (FastAPI)...');
  fs.mkdirSync(backendDir, { recursive: true });

  fs.writeFileSync(path.join(backendDir, 'requirements.txt'), 'fastapi\nuvicorn\n');
  const mainPy = `from fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get('/')\nasync def root():\n    return {'message': 'Hello from FastAPI'}\n`;
  fs.writeFileSync(path.join(backendDir, 'main.py'), mainPy);

  let result = shell.exec('python3 -m venv venv', { cwd: backendDir, silent: true });
  checkCommand(result, 'Failed to create Python venv for FastAPI');

  result = shell.exec('venv/bin/pip install -r requirements.txt', { cwd: backendDir, silent: true });
  checkCommand(result, 'Failed to install FastAPI dependencies');
}
