import { tokenManager } from '../src/tokenManager.js';

export const command = 'logout';
export const describe = 'Clear stored authentication token';

export const handler = async () => {
  try {
    const tokenInfo = tokenManager.getTokenInfo();
    
    if (!tokenInfo) {
      console.log('ℹ️  No active session found');
      return;
    }
    
    console.log(`🔓 Logging out user: ${tokenInfo.email || tokenInfo.userId}`);
    tokenManager.clearToken();
    console.log('✅ Successfully logged out');
  } catch (error) {
    console.error('❌ Logout failed:', error.message);
    process.exit(1);
  }
};