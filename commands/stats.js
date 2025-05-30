import { ensureLoggedIn } from '../src/auth.js';
import { secureClient } from '../src/secureClient.js';

export const command = 'stats [slug]';
export const describe = 'Show resource usage statistics';
export const builder = {
  slug: {
    type: 'string',
    describe: 'Deployment slug to get stats for (optional - shows all if omitted)'
  },
  format: {
    type: 'string',
    choices: ['table', 'json'],
    default: 'table',
    describe: 'Output format'
  },
  watch: {
    type: 'boolean',
    alias: 'w',
    default: false,
    describe: 'Watch stats and update every 5 seconds'
  },
  interval: {
    type: 'number',
    default: 5,
    describe: 'Update interval in seconds (when using --watch)'
  }
};

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatCpuPercent(value) {
  if (value === null || value === undefined) return 'N/A';
  return `${parseFloat(value).toFixed(1)}%`;
}

function formatUptime(seconds) {
  if (!seconds) return 'N/A';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function displayStats(data, format, isWatch = false) {
  if (format === 'json') {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (isWatch) {
    // Clear screen for watch mode
    console.clear();
    console.log(`📊 ForgeKit Resource Stats - ${new Date().toLocaleTimeString()}`);
    console.log('─'.repeat(60));
  }

  if (data.deployment) {
    // Single deployment stats
    const stats = data.deployment;
    console.log(`\n📦 ${stats.slug || 'Unknown'}`);
    console.log(`   Status: ${stats.status || 'unknown'} ${stats.status === 'running' ? '🟢' : '🔴'}`);
    console.log(`   URL: ${stats.url || 'Not available'}`);
    console.log(`   Uptime: ${formatUptime(stats.uptime)}`);
    console.log('');
    console.log('💾 Memory Usage:');
    console.log(`   Current: ${formatBytes(stats.memory_usage)} / ${formatBytes(stats.memory_limit)}`);
    console.log(`   Usage: ${stats.memory_percent ? stats.memory_percent.toFixed(1) + '%' : 'N/A'}`);
    console.log('');
    console.log('⚡ CPU Usage:');
    console.log(`   Current: ${formatCpuPercent(stats.cpu_percent)}`);
    console.log(`   Limit: ${stats.cpu_limit || 'Unlimited'}`);
    console.log('');
    console.log('💽 Storage:');
    console.log(`   Used: ${formatBytes(stats.disk_usage)}`);
    console.log(`   Available: ${formatBytes(stats.disk_available)}`);
    console.log('');
    console.log('🌐 Network:');
    console.log(`   Traffic In: ${formatBytes(stats.network_rx)}`);
    console.log(`   Traffic Out: ${formatBytes(stats.network_tx)}`);
    
    if (stats.custom_domain) {
      console.log('');
      console.log('🔗 Custom Domain:');
      console.log(`   Domain: ${stats.custom_domain}`);
      console.log(`   SSL: ${stats.ssl_status || 'Unknown'}`);
    }
  } else if (data.deployments) {
    // Multiple deployments overview
    console.log(`\n📊 All Deployments (${data.deployments.length}):\n`);
    
    data.deployments.forEach(deployment => {
      const status = deployment.status || 'unknown';
      const statusIcon = status === 'running' ? '🟢' : '🔴';
      
      console.log(`${statusIcon} ${deployment.slug}`);
      console.log(`   Memory: ${formatBytes(deployment.memory_usage)} / ${formatBytes(deployment.memory_limit)} (${formatCpuPercent(deployment.memory_percent)})`);
      console.log(`   CPU: ${formatCpuPercent(deployment.cpu_percent)}`);
      console.log(`   Uptime: ${formatUptime(deployment.uptime)}`);
      console.log('');
    });

    // Summary
    if (data.summary) {
      console.log('📈 Account Summary:');
      console.log(`   Total Deployments: ${data.summary.total_deployments}`);
      console.log(`   Running: ${data.summary.running_deployments}`);
      console.log(`   Total Memory Used: ${formatBytes(data.summary.total_memory_used)} / ${formatBytes(data.summary.total_memory_limit)}`);
      console.log(`   Total CPU Used: ${formatCpuPercent(data.summary.total_cpu_percent)}`);
      console.log(`   Plan: ${data.summary.plan || 'Free'}`);
      
      if (data.summary.quota) {
        console.log(`   Deployments: ${data.summary.quota.used_deployments}/${data.summary.quota.max_deployments}`);
        console.log(`   Storage: ${formatBytes(data.summary.quota.used_storage)} / ${formatBytes(data.summary.quota.max_storage)}`);
      }
    }
  } else {
    console.log('📭 No stats available.');
  }

  if (isWatch) {
    console.log('\n💡 Press Ctrl+C to stop watching');
  }
}

export const handler = async (argv = {}) => {
  const token = await ensureLoggedIn();
  if (!token) {
    console.error('❌ Unable to authenticate. Please run `forge login` first.');
    return;
  }

  const { slug, format, watch, interval } = argv;

  // Validate inputs
  if (slug && !/^[a-z0-9-]+$/.test(slug)) {
    console.error('❌ Invalid slug format. Must contain only lowercase letters, numbers, and hyphens.');
    return;
  }

  if (interval < 1 || interval > 60) {
    console.error('❌ Interval must be between 1 and 60 seconds.');
    return;
  }

  const fetchStats = async () => {
    try {
      const apiBaseUrl = process.env.FORGEKIT_API_BASE_URL || 'https://api.forgekit.ai';
      
      let statsUrl;
      if (slug) {
        statsUrl = `${apiBaseUrl}/deployment/${slug}/stats`;
      } else {
        statsUrl = `${apiBaseUrl}/stats`;
      }

      const res = await secureClient.get(statsUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });

      return res.data;
    } catch (err) {
      if (err.response && err.response.status === 401) {
        console.error('❌ Authentication failed. Try running `forge login` again.');
      } else if (err.response && err.response.status === 403) {
        console.error('❌ Access denied. You may not have permission to view stats.');
      } else if (err.response && err.response.status === 404) {
        if (slug) {
          console.error(`❌ Deployment '${slug}' not found.`);
        } else {
          console.error('❌ Stats endpoint not found.');
        }
      } else {
        console.error('❌ Failed to fetch stats:', err.message || err);
      }
      throw err;
    }
  };

  try {
    if (watch) {
      // Watch mode - update every interval
      const updateStats = async () => {
        try {
          const data = await fetchStats();
          displayStats(data, format, true);
        } catch (err) {
          console.log(`\n❌ Error fetching stats: ${err.message}`);
          console.log('💡 Retrying in next interval...');
        }
      };

      // Initial fetch
      await updateStats();

      // Set up interval
      const intervalId = setInterval(updateStats, interval * 1000);

      // Handle Ctrl+C gracefully
      process.on('SIGINT', () => {
        clearInterval(intervalId);
        console.log('\n\n👋 Stopped watching stats.');
        process.exit(0);
      });

    } else {
      // Single fetch
      if (!slug && format === 'table') {
        console.log('📊 Fetching resource usage statistics...');
      }
      
      const data = await fetchStats();
      displayStats(data, format);
    }

  } catch (err) {
    process.exit(1);
  }
};