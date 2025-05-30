import http from 'http';
import { exec } from 'child_process';
import { tokenManager } from './tokenManager.js';

export function getSavedToken() {
  return tokenManager.getToken();
}

export async function login() {
  // Use environment variables for configuration
  const loginBaseUrl = process.env.FORGEKIT_LOGIN_URL || 'https://forgekit.ai/login';
  const callbackPort = process.env.FORGEKIT_CALLBACK_PORT || '3456';
  const callbackHost = process.env.FORGEKIT_CALLBACK_HOST || 'localhost';
  const callbackUrl = `http://${callbackHost}:${callbackPort}`;
  const loginUrl = `${loginBaseUrl}?cli=true&callback=${encodeURIComponent(callbackUrl)}`;
  
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, callbackUrl);
      const token = url.searchParams.get('token');
      if (token) {
        try {
          tokenManager.saveToken(token);
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

    server.listen(parseInt(callbackPort), () => {
      console.log('Opening browser for login...');
      const cmd =
        process.platform === 'darwin'
          ? 'open'
          : process.platform === 'win32'
          ? 'start'
          : 'xdg-open';
      exec(`${cmd} "${loginUrl}"`);
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
