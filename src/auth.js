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

export function getSavedUserId() {
  try {
    const data = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    return data.userId || null;
  } catch {}
  return null;
}

export function getSavedSafeUserId() {
  try {
    const data = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    return data.safeUserId || null;
  } catch {}
  return null;
}

function computeSafeUserId(userId) {
  if (!userId) return null;
  // Extract first 8 alphanumeric characters from userId
  const alphanumeric = userId.replace(/[^a-zA-Z0-9]/g, '');
  return alphanumeric.substring(0, 8).toLowerCase();
}

export function decodeToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      return payload;
    }
  } catch {}
  return null;
}

export async function login(opts = {}) {
  const { debug = false } = opts;
  const loginUrl =
    'http://localhost:3000/login?cli=true&callback=http://localhost:3456';
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if (debug) console.log('Incoming request:', req.url);
      const url = new URL(req.url, 'http://localhost:3456');
      const token = url.searchParams.get('token');
      if (token) {
        try {
          fs.mkdirSync(CONFIG_DIR, { recursive: true });
          
          // Decode the token to extract user ID
          const payload = decodeToken(token);
          const userId = payload?.sub || payload?.user_id || payload?.id || null;
          
          const configData = { token };
          if (userId) {
            configData.userId = userId;
            configData.safeUserId = computeSafeUserId(userId);
          }
          
          fs.writeFileSync(CONFIG_PATH, JSON.stringify(configData, null, 2));
          res.end('Login successful. You can close this window.');
          console.log('✅ Logged in successfully');
          if (userId) {
            console.log(`👤 User ID: ${userId}`);
            console.log(`🔒 Safe User ID: ${configData.safeUserId}`);
          }
          clearTimeout(timeout);
          server.close();
          resolve(token);
        } catch (err) {
          res.statusCode = 500;
          res.end('Failed to save token');
          clearTimeout(timeout);
          server.close();
          reject(err);
        }
      } else {
        res.statusCode = 400;
        res.end('Missing token');
      }
    });

    server.listen(3456, () => {
      if (debug)
        console.log('✅ Login server listening at http://localhost:3456');
      console.log('Opening browser for login...');
      openBrowser(loginUrl);
    });

    const timeout = setTimeout(() => {
      console.error('❌ Login timeout. No request received on port 3456.');
      server.close();
      reject(new Error('Login timeout'));
    }, 180_000);
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
