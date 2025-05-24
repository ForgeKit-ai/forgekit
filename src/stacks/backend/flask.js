import path from 'path';
import fs from 'fs';
import shell from 'shelljs';

export async function setupFlask(config) {
  const { targetDir } = config;
  const backendDir = path.join(targetDir, 'backend');

  console.log('\n◀️ Setting up backend (Flask)...');
  fs.mkdirSync(backendDir, { recursive: true });

  fs.writeFileSync(path.join(backendDir, 'requirements.txt'), 'flask\n');
  const appPy = `from flask import Flask\napp = Flask(__name__)\n\n@app.route('/')\ndef index():\n    return 'Hello from Flask!'\n\nif __name__ == '__main__':\n    app.run(debug=True, port=3001)\n`;
  fs.writeFileSync(path.join(backendDir, 'app.py'), appPy);

  shell.exec('python3 -m venv venv', { cwd: backendDir, silent: true });
  shell.exec('venv/bin/pip install -r requirements.txt', { cwd: backendDir, silent: true });
}
