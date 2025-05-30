import axios from 'axios';
import { ensureLoggedIn, getSavedUserId } from '../src/auth.js';

export const command = 'deployments:list';
export const describe = 'List all deployments for the current user';
export const builder = {};

function formatDate(dateString) {
  const date = new Date(dateString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()} ${date.getFullYear()}`;
}

function getStatusEmoji(status) {
  switch (status?.toLowerCase()) {
    case 'deployed':
    case 'active':
    case 'running':
      return '🟢';
    case 'deploying':
    case 'building':
    case 'pending':
      return '🟡';
    case 'failed':
    case 'error':
      return '🔴';
    default:
      return '⚪';
  }
}

export const handler = async (argv = {}) => {
  const token = await ensureLoggedIn();
  if (!token) {
    console.error('❌ Unable to authenticate. Please run `forge login` first.');
    return;
  }
  
  const userId = getSavedUserId();
  if (!userId) {
    console.error('❌ User ID not found. Please run `forge login` again.');
    return;
  }
  
  try {
    console.log('🔍 Fetching deployments...\n');
    
    const deploymentsUrl = process.env.FORGEKIT_API_URL || 'http://178.156.171.10:3001';
    const response = await axios.get(`${deploymentsUrl}/deployments`, {
      headers: { 
        Authorization: `Bearer ${token}` 
      }
    });
    
    const deployments = response.data;
    
    if (!deployments || deployments.length === 0) {
      console.log('📭 No deployments found.');
      return;
    }
    
    console.log('📦 Deployed Projects:');
    console.log('──────────────────────────────────────────────────────────────');
    
    // Sort by deployedAt date (newest first)
    deployments.sort((a, b) => new Date(b.deployedAt || b.created_at) - new Date(a.deployedAt || a.created_at));
    
    // Display deployments in a formatted table
    deployments.forEach(deployment => {
      const status = deployment.status || 'active';
      const statusEmoji = getStatusEmoji(status);
      const projectName = deployment.projectName || deployment.slug || 'Unknown';
      const subdomain = deployment.subdomain || deployment.url || 'N/A';
      const deployedAt = deployment.deployedAt || deployment.created_at || deployment.updated_at;
      const formattedDate = deployedAt ? formatDate(deployedAt) : 'Unknown';
      
      // Format subdomain to show just the URL
      let displayUrl = subdomain;
      if (subdomain.includes('://')) {
        displayUrl = subdomain.split('://')[1];
      }
      if (displayUrl.endsWith('/')) {
        displayUrl = displayUrl.slice(0, -1);
      }
      
      // Pad projectName to ensure alignment
      const paddedName = projectName.padEnd(20, ' ');
      
      console.log(`${statusEmoji}  ${paddedName} ${displayUrl.padEnd(25, ' ')} ${formattedDate}`);
    });
    
    console.log('\n');
    console.log(`Total deployments: ${deployments.length}`);
    
  } catch (err) {
    if (err.response && err.response.status === 401) {
      console.error('❌ Authentication failed. Try running `forge login` again.');
    } else if (err.response && err.response.status === 404) {
      console.error('❌ Deployments endpoint not found. The API may have changed.');
    } else {
      console.error('❌ Failed to fetch deployments:', err.message || err);
      if (err.response?.data) {
        console.error('Server response:', err.response.data);
      }
    }
  }
};