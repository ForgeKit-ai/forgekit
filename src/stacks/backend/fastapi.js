import path from 'path';
import fs from 'fs';
import shell from 'shelljs';
import { checkCommand, setupRootConcurrentDev } from '../../utils.js';

export async function setupFastAPI(config) {
  const { targetDir, projectName } = config;
  const backendDir = path.join(targetDir, 'backend');

  console.log('\n◀️ Setting up backend (FastAPI)...');
  fs.mkdirSync(backendDir, { recursive: true });

  // Create package.json for deployment compatibility
  const packageJson = {
    name: `${projectName}-backend`,
    version: '1.0.0',
    description: `FastAPI backend for ${projectName}`,
    scripts: {
      build: 'python3 -m venv venv && venv/bin/pip install -r requirements.txt',
      start: 'venv/bin/uvicorn main:app --host 0.0.0.0 --port 3000',
      dev: 'venv/bin/uvicorn main:app --reload'
    },
    main: 'main.py'
  };
  fs.writeFileSync(path.join(backendDir, 'package.json'), JSON.stringify(packageJson, null, 2));
  console.log('↳ Created package.json for deployment');

  // Create production-ready requirements.txt
  const requirements = `fastapi>=0.104.0
uvicorn[standard]>=0.24.0
python-multipart>=0.0.6
python-jose[cryptography]>=3.3.0
python-cors>=1.7.0`;
  fs.writeFileSync(path.join(backendDir, 'requirements.txt'), requirements);
  console.log('↳ Created requirements.txt for production');

  // Create enhanced main.py with CORS support
  const mainPy = `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="${projectName} API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.get("/")
async def root():
    return {"message": "Hello from ${projectName} FastAPI backend"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
`;
  fs.writeFileSync(path.join(backendDir, 'main.py'), mainPy);
  console.log('↳ Created main.py with CORS support');

  let result = shell.exec('python3 -m venv venv', { cwd: backendDir, silent: true });
  checkCommand(result, 'Failed to create Python venv for FastAPI');

  result = shell.exec('venv/bin/pip install -r requirements.txt', { cwd: backendDir, silent: true });
  checkCommand(result, 'Failed to install FastAPI dependencies');

  // Update root package.json for concurrent development
  setupRootConcurrentDev(targetDir);
}
