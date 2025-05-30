import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';

const CONFIG_DIR = path.join(os.homedir(), '.forgekit');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');
const KEY_PATH = path.join(CONFIG_DIR, '.key');

// Constants for encryption
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

class TokenManager {
  constructor() {
    this.ensureConfigDir();
    this.masterKey = this.getMasterKey();
  }

  ensureConfigDir() {
    try {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
      // Set restrictive permissions on the config directory
      fs.chmodSync(CONFIG_DIR, 0o700);
    } catch (error) {
      console.warn('Warning: Could not set secure permissions on config directory');
    }
  }

  getMasterKey() {
    try {
      if (fs.existsSync(KEY_PATH)) {
        const keyData = fs.readFileSync(KEY_PATH);
        return keyData;
      } else {
        // Generate new master key
        const key = crypto.randomBytes(KEY_LENGTH);
        fs.writeFileSync(KEY_PATH, key);
        fs.chmodSync(KEY_PATH, 0o600); // Owner read/write only
        return key;
      }
    } catch (error) {
      console.error('Error managing master key:', error);
      // Fallback to environment-based key
      return crypto.createHash('sha256').update(os.userInfo().username + os.hostname()).digest();
    }
  }

  encryptToken(token) {
    try {
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv(ALGORITHM, this.masterKey, iv);
      
      let encrypted = cipher.update(token, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      // Combine IV, authTag, and encrypted data
      const combined = Buffer.concat([
        iv,
        authTag,
        Buffer.from(encrypted, 'hex')
      ]);
      
      return combined.toString('base64');
    } catch (error) {
      console.error('Encryption error:', error);
      // Fallback to plaintext (with warning)
      console.warn('Warning: Token encryption failed, storing in plaintext');
      return token;
    }
  }

  decryptToken(encryptedData) {
    try {
      const combined = Buffer.from(encryptedData, 'base64');
      
      // Extract components
      const iv = combined.slice(0, IV_LENGTH);
      const authTag = combined.slice(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
      const encrypted = combined.slice(IV_LENGTH + TAG_LENGTH);
      
      const decipher = crypto.createDecipheriv(ALGORITHM, this.masterKey, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, null, 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      // Might be plaintext token from older version
      console.warn('Token decryption failed, assuming plaintext format');
      return encryptedData;
    }
  }

  isValidJWT(token) {
    if (!token || typeof token !== 'string') return false;
    
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      
      // Check expiration
      if (payload.exp && payload.exp * 1000 <= Date.now()) {
        return false;
      }
      
      // Basic JWT structure validation
      return payload.sub || payload.user_id || payload.id;
    } catch (error) {
      return false;
    }
  }

  saveToken(token) {
    if (!this.isValidJWT(token)) {
      throw new Error('Invalid JWT token format');
    }
    
    try {
      const encryptedToken = this.encryptToken(token);
      const config = {
        token: encryptedToken,
        encrypted: true,
        timestamp: Date.now()
      };
      
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
      fs.chmodSync(CONFIG_PATH, 0o600); // Owner read/write only
      
      console.log('✅ Token saved securely');
    } catch (error) {
      console.error('Error saving token:', error);
      throw error;
    }
  }

  getToken() {
    // Check environment variable first
    if (process.env.FORGEKIT_TOKEN) {
      const envToken = process.env.FORGEKIT_TOKEN;
      if (this.isValidJWT(envToken)) {
        return envToken;
      }
    }
    
    try {
      if (!fs.existsSync(CONFIG_PATH)) {
        return null;
      }
      
      const configData = fs.readFileSync(CONFIG_PATH, 'utf-8');
      const config = JSON.parse(configData);
      
      if (!config.token) {
        return null;
      }
      
      let token;
      if (config.encrypted) {
        token = this.decryptToken(config.token);
      } else {
        // Handle legacy plaintext tokens
        token = config.token;
        // Re-save encrypted for next time
        this.saveToken(token);
      }
      
      if (this.isValidJWT(token)) {
        return token;
      } else {
        // Token is invalid, remove it
        this.clearToken();
        return null;
      }
    } catch (error) {
      console.error('Error reading token:', error);
      return null;
    }
  }

  clearToken() {
    try {
      if (fs.existsSync(CONFIG_PATH)) {
        fs.unlinkSync(CONFIG_PATH);
      }
      console.log('🗑️ Token cleared');
    } catch (error) {
      console.error('Error clearing token:', error);
    }
  }

  getTokenInfo() {
    const token = this.getToken();
    if (!token) return null;
    
    try {
      const parts = token.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      
      return {
        userId: payload.sub || payload.user_id || payload.id,
        email: payload.email,
        expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
        issuedAt: payload.iat ? new Date(payload.iat * 1000) : null
      };
    } catch (error) {
      return null;
    }
  }
}

// Export singleton instance
export const tokenManager = new TokenManager();

// Legacy exports for backward compatibility
export function getSavedToken() {
  return tokenManager.getToken();
}

export function saveToken(token) {
  return tokenManager.saveToken(token);
}