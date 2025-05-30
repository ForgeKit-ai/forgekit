import inquirer from 'inquirer';
import { ensureLoggedIn } from '../src/auth.js';
import { secureClient } from '../src/secureClient.js';

export const command = 'delete <slug>';
export const describe = 'Delete a deployment';
export const aliases = ['remove', 'rm'];
export const builder = {
  slug: {
    type: 'string',
    describe: 'Deployment slug to delete'
  },
  force: {
    type: 'boolean',
    alias: 'f',
    default: false,
    describe: 'Skip confirmation prompt'
  },
  'keep-data': {
    type: 'boolean',
    default: false,
    describe: 'Keep persistent data (volumes) when deleting'
  }
};

export const handler = async (argv = {}) => {
  const token = await ensureLoggedIn();
  if (!token) {
    console.error('❌ Unable to authenticate. Please run `forge login` first.');
    return;
  }

  const { slug, force, keepData } = argv;

  if (!slug) {
    console.error('❌ Deployment slug is required. Usage: forge delete <slug>');
    return;
  }

  try {
    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      console.error('❌ Invalid slug format. Must contain only lowercase letters, numbers, and hyphens.');
      return;
    }

    // Get deployment info first
    console.log(`🔍 Checking deployment: ${slug}`);
    const apiBaseUrl = process.env.FORGEKIT_API_BASE_URL || 'https://api.forgekit.ai';
    
    let deploymentInfo;
    try {
      const res = await secureClient.get(`${apiBaseUrl}/deployment/${slug}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      deploymentInfo = res.data;
    } catch (err) {
      if (err.response && err.response.status === 404) {
        console.error(`❌ Deployment '${slug}' not found.`);
        return;
      }
      throw err;
    }

    // Show deployment info
    console.log(`\n📦 Deployment Details:`);
    console.log(`   Slug: ${deploymentInfo.slug}`);
    console.log(`   URL: ${deploymentInfo.url || 'Not available'}`);
    console.log(`   Status: ${deploymentInfo.status || 'unknown'}`);
    console.log(`   Created: ${deploymentInfo.created_at ? new Date(deploymentInfo.created_at).toLocaleString() : 'Unknown'}`);

    // Confirmation prompt (unless --force is used)
    if (!force) {
      const answers = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmDelete',
          message: `Are you sure you want to delete deployment '${slug}'?`,
          default: false
        }
      ]);

      if (!answers.confirmDelete) {
        console.log('🚫 Deletion cancelled.');
        return;
      }

      // Additional confirmation for production-looking deployments
      if (deploymentInfo.domain || deploymentInfo.url?.includes('forgekit.ai')) {
        const finalConfirm = await inquirer.prompt([
          {
            type: 'input',
            name: 'typeSlug',
            message: `This appears to be a production deployment. Type '${slug}' to confirm deletion:`,
            validate: (input) => input === slug || 'Please type the exact slug to confirm.'
          }
        ]);

        if (finalConfirm.typeSlug !== slug) {
          console.log('🚫 Deletion cancelled.');
          return;
        }
      }
    }

    // Perform deletion
    console.log(`🗑️ Deleting deployment: ${slug}...`);
    
    const deleteUrl = `${apiBaseUrl}/deployment/${slug}`;
    const deleteParams = keepData ? '?keep_data=true' : '';
    
    await secureClient.delete(`${deleteUrl}${deleteParams}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log(`✅ Deployment '${slug}' has been deleted successfully.`);
    
    if (keepData) {
      console.log('📁 Persistent data (volumes) have been preserved.');
    } else {
      console.log('🧹 All associated data has been removed.');
    }

  } catch (err) {
    if (err.response && err.response.status === 401) {
      console.error('❌ Authentication failed. Try running `forge login` again.');
    } else if (err.response && err.response.status === 403) {
      console.error('❌ Access denied. You may not have permission to delete this deployment.');
    } else if (err.response && err.response.status === 404) {
      console.error(`❌ Deployment '${slug}' not found.`);
    } else if (err.response && err.response.status === 409) {
      console.error(`❌ Cannot delete deployment '${slug}': ${err.response.data?.message || 'Deployment may be in use'}`);
    } else {
      console.error('❌ Failed to delete deployment:', err.message || err);
    }
    process.exit(1);
  }
};