import { ensureLoggedIn } from '../src/auth.js';
import { secureClient } from '../src/secureClient.js';

export const command = 'list';
export const describe = 'List all your deployments';
export const aliases = ['ls'];
export const builder = {
  format: {
    type: 'string',
    choices: ['table', 'json'],
    default: 'table',
    describe: 'Output format'
  },
  verbose: {
    type: 'boolean',
    alias: 'v',
    default: false,
    describe: 'Show detailed information'
  }
};

export const handler = async (argv = {}) => {
  const token = await ensureLoggedIn();
  if (!token) {
    console.error('❌ Unable to authenticate. Please run `forge login` first.');
    process.exit(1);
  }

  try {
    console.log('📋 Fetching your deployments...');
    
    const apiBaseUrl = process.env.FORGEKIT_API_BASE_URL || 'https://api.forgekit.ai';
    const res = await secureClient.get(`${apiBaseUrl}/deployments`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const deployments = res.data.deployments || [];

    if (deployments.length === 0) {
      console.log('📭 No deployments found. Deploy your first project with `forge deploy`');
      process.exit(0);
    }

    if (argv.format === 'json') {
      console.log(JSON.stringify(deployments, null, 2));
      process.exit(0);
    }

    // Table format
    console.log(`\n📦 Your Deployments (${deployments.length}):\n`);
    
    for (const deployment of deployments) {
      const status = deployment.status || 'unknown';
      const statusIcon = status === 'running' ? '🟢' : status === 'stopped' ? '🔴' : '🟡';
      
      console.log(`${statusIcon} ${deployment.slug || deployment.name}`);
      console.log(`   URL: ${deployment.url || 'Not available'}`);
      
      if (argv.verbose) {
        console.log(`   Status: ${status}`);
        console.log(`   Created: ${deployment.created_at ? new Date(deployment.created_at).toLocaleString() : 'Unknown'}`);
        console.log(`   Resources: ${deployment.memory || '?'}MB RAM, ${deployment.cpu || '?'} CPU`);
        if (deployment.domain) {
          console.log(`   Custom Domain: ${deployment.domain}`);
        }
      }
      console.log('');
    }

    console.log(`Total: ${deployments.length} deployment${deployments.length === 1 ? '' : 's'}`);
    process.exit(0);

  } catch (err) {
    if (err.response && err.response.status === 401) {
      console.error('❌ Authentication failed. Try running `forge login` again.');
    } else if (err.response && err.response.status === 403) {
      console.error('❌ Access denied. Check your permissions.');
    } else {
      console.error('❌ Failed to fetch deployments:', err.message || err);
    }
    process.exit(1);
  }
};