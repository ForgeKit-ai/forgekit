import http from 'http';
import { exec } from 'child_process';
import { tokenManager } from './tokenManager.js';

export function getSavedToken() {
  return tokenManager.getToken();
}

export async function login() {
  // Use environment variables for configuration
  const loginBaseUrl = process.env.FORGEKIT_LOGIN_URL || 'https://forgekit.ai/login';
  const preferredPort = parseInt(process.env.FORGEKIT_CALLBACK_PORT || '3456');
  const callbackHost = process.env.FORGEKIT_CALLBACK_HOST || 'localhost';
  const timeoutMs = parseInt(process.env.FORGEKIT_LOGIN_TIMEOUT || '120000'); // 2 minutes default
  
  return new Promise((resolve, reject) => {
    let server = null;
    let loginTimeout = null;
    let actualPort = null;

    // Cleanup function
    const cleanup = () => {
      if (loginTimeout) {
        clearTimeout(loginTimeout);
        loginTimeout = null;
      }
      if (server) {
        try {
          server.close();
        } catch (err) {
          // Ignore errors during cleanup
        }
        server = null;
      }
    };

    // Set up timeout
    loginTimeout = setTimeout(() => {
      cleanup();
      reject(new Error(`Login timeout after ${timeoutMs / 1000} seconds. Please try again.`));
    }, timeoutMs);

    const handleLoginRequest = (req, res) => {
      try {
        const url = new URL(req.url, `http://${callbackHost}:${actualPort}`);
        const token = url.searchParams.get('token');
        const error = url.searchParams.get('error');
        
        // Handle error responses
        if (error) {
          const errorDescription = url.searchParams.get('error_description') || 'Unknown error';
          res.statusCode = 400;
          res.setHeader('Content-Type', 'text/html');
          res.end(`
            <html>
              <head><title>Login Failed</title></head>
              <body>
                <h2>❌ Login Failed</h2>
                <p><strong>Error:</strong> ${error}</p>
                <p><strong>Description:</strong> ${errorDescription}</p>
                <p>You can close this window and try again.</p>
              </body>
            </html>
          `);
          cleanup();
          reject(new Error(`Login failed: ${error} - ${errorDescription}`));
          return;
        }

        if (token) {
          try {
            // Validate token before saving
            if (!tokenManager.isValidJWT(token)) {
              throw new Error('Invalid token format received');
            }

            tokenManager.saveToken(token);
            res.setHeader('Content-Type', 'text/html');
            res.end(`
              <html>
                <head><title>Login Successful</title></head>
                <body>
                  <h2>✅ Login Successful</h2>
                  <p>You have been successfully authenticated with ForgeKit.</p>
                  <p>You can now close this window and return to your terminal.</p>
                  <script>
                    setTimeout(() => window.close(), 3000);
                  </script>
                </body>
              </html>
            `);
            console.log('✅ Logged in successfully');
            cleanup();
            resolve(token);
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'text/html');
            res.end(`
              <html>
                <head><title>Login Error</title></head>
                <body>
                  <h2>❌ Login Error</h2>
                  <p>Failed to save authentication token: ${err.message}</p>
                  <p>You can close this window and try again.</p>
                </body>
              </html>
            `);
            cleanup();
            reject(err);
          }
        } else {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'text/html');
          res.end(`
            <html>
              <head><title>Invalid Request</title></head>
              <body>
                <h2>❌ Invalid Request</h2>
                <p>No authentication token received.</p>
                <p>You can close this window and try again.</p>
              </body>
            </html>
          `);
        }
      } catch (err) {
        console.error('Error handling login request:', err);
        res.statusCode = 500;
        res.end('Internal server error');
        cleanup();
        reject(err);
      }
    };

    // Try to find an available port starting from the preferred port
    const tryPort = (port, maxTries = 10) => {
      if (maxTries <= 0) {
        cleanup();
        reject(new Error(`Could not find an available port after trying ${10 - maxTries + 1} ports starting from ${preferredPort}`));
        return;
      }

      server = http.createServer(handleLoginRequest);
      
      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`Port ${port} is in use, trying port ${port + 1}...`);
          tryPort(port + 1, maxTries - 1);
        } else {
          cleanup();
          reject(new Error(`Failed to start callback server: ${err.message}`));
        }
      });

      server.listen(port, callbackHost, () => {
        actualPort = port;
        const callbackUrl = `http://${callbackHost}:${actualPort}`;
        const loginUrl = `${loginBaseUrl}?cli=true&callback=${encodeURIComponent(callbackUrl)}`;
        
        console.log(`🔗 Starting login flow...`);
        console.log(`   Callback server: ${callbackUrl}`);
        console.log(`   Timeout: ${timeoutMs / 1000} seconds`);
        console.log('🌐 Opening browser for authentication...');
        
        // Open browser
        const cmd = process.platform === 'darwin' ? 'open' :
                   process.platform === 'win32' ? 'start' : 'xdg-open';
        
        exec(`${cmd} "${loginUrl}"`, (error) => {
          if (error) {
            console.warn('⚠️ Could not automatically open browser. Please visit this URL manually:');
            console.log(`   ${loginUrl}`);
          }
        });
      });
    };

    // Start trying ports
    tryPort(preferredPort);
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
