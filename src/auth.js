import fs from 'fs';
import os from 'os';
import path from 'path';
import http from 'http';
import { spawn } from 'child_process';

const CONFIG_DIR = path.join(os.homedir(), '.forgekit');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');

function openBrowser(url) {
  let command;
  let args = [];
  if (process.platform === 'darwin') {
    command = 'open';
    args = [url];
  } else if (process.platform === 'win32') {
    command = 'cmd';
    args = ['/c', 'start', '', url];
  } else {
    command = 'xdg-open';
    args = [url];
  }
  const child = spawn(command, args, {
    detached: true,
    stdio: 'ignore'
  });
  child.unref();
}

export function getSavedToken() {
  if (process.env.FORGEKIT_TOKEN) return process.env.FORGEKIT_TOKEN;
  try {
    const data = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    const token = data.token;
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      if (!payload.exp || payload.exp * 1000 > Date.now()) {
        return token;
      }
    }
  } catch {}
  return null;
}

export async function login() {
  const loginUrl =
    'http://localhost:3000/login?cli=true&callback=http://localhost:3456';
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, 'http://localhost:3456');
      const token = url.searchParams.get('token');
      if (token) {
        try {
          fs.mkdirSync(CONFIG_DIR, { recursive: true });
          fs.writeFileSync(CONFIG_PATH, JSON.stringify({ token }, null, 2));
          res.end('Login successful. You can close this window.');
          console.log('✅ Logged in successfully');
          server.close();
          resolve(token);
        } catch (err) {
          res.statusCode = 500;
          res.end('Failed to save token');
          server.close();
          reject(err);
        }
      } else {
        res.statusCode = 400;
        res.end('Missing token');
      }
    });

    server.listen(3456, () => {
      console.log('Opening browser for login...');
      openBrowser(loginUrl);
    });
  });
}

export async function ensureLoggedIn() {
  let token = getSavedToken();
  if (token) return token;
  try {
    token = await login();
    return token;
  } catch (err) {
    console.error('❌ Login failed:', err.message || err);
    return null;
  }
}
