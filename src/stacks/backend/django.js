import path from 'path';
import fs from 'fs';
import shell from 'shelljs';
import { checkCommand, setupRootConcurrentDev } from '../../utils.js';

export async function setupDjango(config) {
  const { targetDir, projectName } = config;
  const backendDir = path.join(targetDir, 'backend');

  console.log('\n◀️ Setting up backend (Django)...');
  fs.mkdirSync(backendDir, { recursive: true });

  // Create package.json for deployment compatibility
  const packageJson = {
    name: `${projectName}-backend`,
    version: '1.0.0',
    description: `Django backend for ${projectName}`,
    scripts: {
      build: 'python3 -m venv venv && venv/bin/pip install -r requirements.txt && venv/bin/python manage.py collectstatic --noinput',
      start: 'venv/bin/python manage.py runserver 0.0.0.0:3000',
      dev: 'venv/bin/python manage.py runserver'
    },
    main: 'manage.py'
  };
  fs.writeFileSync(path.join(backendDir, 'package.json'), JSON.stringify(packageJson, null, 2));
  console.log('↳ Created package.json for deployment');

  let result = shell.exec('python3 -m venv venv', { cwd: backendDir, silent: true });
  checkCommand(result, 'Failed to create Python venv for Django');

  result = shell.exec('venv/bin/pip install django djangorestframework django-cors-headers', { cwd: backendDir, silent: true });
  checkCommand(result, 'Failed to install Django');

  result = shell.exec(`venv/bin/django-admin startproject ${projectName} .`, { cwd: backendDir, silent: true });
  checkCommand(result, 'Failed to start Django project');

  // Create production-ready requirements.txt
  const requirements = `django>=4.2.0
djangorestframework>=3.14.0
django-cors-headers>=4.0.0
gunicorn>=21.0.0`;
  fs.writeFileSync(path.join(backendDir, 'requirements.txt'), requirements);
  console.log('↳ Created requirements.txt for production');

  // Configure Django for API usage
  const settingsPath = path.join(backendDir, projectName, 'settings.py');
  if (fs.existsSync(settingsPath)) {
    let settings = fs.readFileSync(settingsPath, 'utf-8');
    settings = settings.replace(
      "INSTALLED_APPS = [",
      "INSTALLED_APPS = [\n    'rest_framework',\n    'corsheaders',"
    );
    settings = settings.replace(
      "MIDDLEWARE = [",
      "MIDDLEWARE = [\n    'corsheaders.middleware.CorsMiddleware',"
    );
    settings += "\n\n# CORS settings\nCORS_ALLOW_ALL_ORIGINS = True\n\n# Production settings\nALLOWED_HOSTS = ['*']\n";
    fs.writeFileSync(settingsPath, settings);
    console.log('↳ Configured Django for API usage');
  }

  // Update root package.json for concurrent development
  setupRootConcurrentDev(targetDir);
}
