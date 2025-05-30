import { tokenManager } from '../src/tokenManager.js';

export const command = 'whoami';
export const describe = 'Show current authentication status';

export const handler = async () => {
  try {
    const token = tokenManager.getToken();
    
    if (!token) {
      console.log('❌ Not authenticated');
      console.log('Run `forge login` to authenticate');
      return;
    }
    
    const tokenInfo = tokenManager.getTokenInfo();
    
    if (!tokenInfo) {
      console.log('❌ Invalid token found');
      console.log('Run `forge login` to re-authenticate');
      return;
    }
    
    console.log('✅ Authenticated as:');
    console.log(`   Email: ${tokenInfo.email || 'Unknown'}`);
    console.log(`   User ID: ${tokenInfo.userId}`);
    
    if (tokenInfo.expiresAt) {
      const now = new Date();
      const timeLeft = tokenInfo.expiresAt.getTime() - now.getTime();
      
      if (timeLeft > 0) {
        const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
        const daysLeft = Math.floor(hoursLeft / 24);
        
        if (daysLeft > 0) {
          console.log(`   Token expires: in ${daysLeft} days`);
        } else if (hoursLeft > 0) {
          console.log(`   Token expires: in ${hoursLeft} hours`);
        } else {
          console.log(`   Token expires: in ${Math.floor(timeLeft / (1000 * 60))} minutes`);
        }
      } else {
        console.log('⚠️  Token has expired - run `forge login` to re-authenticate');
      }
    }
    
    if (tokenInfo.issuedAt) {
      console.log(`   Logged in: ${tokenInfo.issuedAt.toLocaleDateString()}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking authentication status:', error.message);
    console.log('Run `forge login` to re-authenticate');
  }
};