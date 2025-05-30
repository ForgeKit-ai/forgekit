import path from 'path';
import fs from 'fs';
import shell from 'shelljs';
import { checkCommand, setupRootConcurrentDev } from '../../utils.js';

export async function setupFlask(config) {
  const { targetDir, projectName } = config;
  const backendDir = path.join(targetDir, 'backend');

  console.log('\n◀️ Setting up backend (Flask)...');
  fs.mkdirSync(backendDir, { recursive: true });

  // Create package.json for deployment compatibility
  const packageJson = {
    name: `${projectName}-backend`,
    version: '1.0.0',
    description: `Flask backend for ${projectName}`,
    scripts: {
      build: 'python3 -m venv venv && venv/bin/pip install -r requirements.txt',
      start: 'venv/bin/python app.py',
      dev: 'venv/bin/flask run --debug'
    },
    main: 'app.py'
  };
  fs.writeFileSync(path.join(backendDir, 'package.json'), JSON.stringify(packageJson, null, 2));
  console.log('↳ Created package.json for deployment');

  // Create production-ready requirements.txt
  const requirements = `Flask>=3.0.0
Flask-CORS>=4.0.0
gunicorn>=21.0.0`;
  fs.writeFileSync(path.join(backendDir, 'requirements.txt'), requirements);
  console.log('↳ Created requirements.txt for production');

  // Create enhanced app.py with CORS support
  const appPy = `from flask import Flask, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all domains on all routes

@app.route('/')
def index():
    return jsonify({
        "message": "Hello from ${projectName} Flask backend",
        "status": "running"
    })

@app.route('/health')
def health_check():
    return jsonify({"status": "healthy"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    app.run(debug=False, host='0.0.0.0', port=port)
`;
  fs.writeFileSync(path.join(backendDir, 'app.py'), appPy);
  console.log('↳ Created app.py with CORS support');

  let result = shell.exec('python3 -m venv venv', { cwd: backendDir, silent: true });
  checkCommand(result, 'Failed to create Python venv for Flask');

  result = shell.exec('venv/bin/pip install -r requirements.txt', { cwd: backendDir, silent: true });
  checkCommand(result, 'Failed to install Flask dependencies');

  // Update root package.json for concurrent development
  setupRootConcurrentDev(targetDir);
}
