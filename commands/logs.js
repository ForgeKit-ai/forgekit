import { ensureLoggedIn } from '../src/auth.js';
import { secureClient } from '../src/secureClient.js';

export const command = 'logs <slug>';
export const describe = 'View container logs for a deployment';
export const builder = {
  slug: {
    type: 'string',
    describe: 'Deployment slug to get logs for'
  },
  lines: {
    type: 'number',
    alias: 'n',
    default: 100,
    describe: 'Number of lines to retrieve (max 1000)'
  },
  follow: {
    type: 'boolean',
    alias: 'f',
    default: false,
    describe: 'Follow log output (live streaming)'
  },
  since: {
    type: 'string',
    describe: 'Show logs since timestamp (e.g., "2h", "30m", "2023-01-01T00:00:00Z")'
  },
  level: {
    type: 'string',
    choices: ['all', 'error', 'warn', 'info', 'debug'],
    default: 'all',
    describe: 'Filter logs by level'
  },
  raw: {
    type: 'boolean',
    default: false,
    describe: 'Output raw logs without formatting'
  }
};

export const handler = async (argv = {}) => {
  const token = await ensureLoggedIn();
  if (!token) {
    console.error('❌ Unable to authenticate. Please run `forge login` first.');
    process.exit(1);
  }

  const { slug, lines, follow, since, level, raw } = argv;

  if (!slug) {
    console.error('❌ Deployment slug is required. Usage: forge logs <slug>');
    process.exit(1);
  }

  // Validate inputs
  if (lines > 1000) {
    console.error('❌ Maximum 1000 lines allowed.');
    process.exit(1);
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    console.error('❌ Invalid slug format. Must contain only lowercase letters, numbers, and hyphens.');
    process.exit(1);
  }

  try {
    const apiBaseUrl = process.env.FORGEKIT_API_BASE_URL || 'https://api.forgekit.ai';
    
    // Build query parameters
    const params = new URLSearchParams();
    params.append('lines', lines.toString());
    if (since) params.append('since', since);
    if (level !== 'all') params.append('level', level);
    if (follow) params.append('follow', 'true');

    const logsUrl = `${apiBaseUrl}/deployment/${slug}/logs?${params.toString()}`;

    if (!raw) {
      console.log(`📄 Fetching logs for deployment: ${slug}`);
      console.log(`   Lines: ${lines}, Level: ${level}${since ? `, Since: ${since}` : ''}`);
      console.log('─'.repeat(60));
    }

    if (follow) {
      // For follow mode, we'd need to implement WebSocket or Server-Sent Events
      // For now, we'll do polling with a warning
      console.log('⚠️ Follow mode not yet implemented. Showing latest logs...');
    }

    const res = await secureClient.get(logsUrl, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 30000 // Extended timeout for logs
    });

    const logs = res.data.logs || [];

    if (logs.length === 0) {
      if (!raw) {
        console.log('📭 No logs found for this deployment.');
        console.log('💡 The container may not have started yet or may not be producing logs.');
      }
      process.exit(0);
    }

    // Display logs
    logs.forEach(logEntry => {
      if (raw) {
        // Raw format - just the message
        console.log(typeof logEntry === 'string' ? logEntry : logEntry.message || logEntry);
      } else {
        // Formatted output
        if (typeof logEntry === 'string') {
          console.log(logEntry);
        } else {
          const timestamp = logEntry.timestamp ? 
            new Date(logEntry.timestamp).toISOString().substring(11, 23) : 
            '??:??:??.???';
          
          const level = logEntry.level || 'info';
          const levelIcon = {
            error: '🔴',
            warn: '🟡',
            info: '🔵',
            debug: '🟣'
          }[level] || '⚪';

          const source = logEntry.source ? `[${logEntry.source}] ` : '';
          const message = logEntry.message || logEntry;

          console.log(`${timestamp} ${levelIcon} ${source}${message}`);
        }
      }
    });

    if (!raw && logs.length === lines) {
      console.log('─'.repeat(60));
      console.log(`📄 Showing last ${lines} lines. Use --lines to see more.`);
    }

    if (follow && !raw) {
      console.log('\n💡 Live log following is not yet implemented.');
      console.log('   Run this command again to see newer logs.');
    }
    process.exit(0);

  } catch (err) {
    if (err.response && err.response.status === 401) {
      console.error('❌ Authentication failed. Try running `forge login` again.');
    } else if (err.response && err.response.status === 403) {
      console.error('❌ Access denied. You may not have permission to view logs for this deployment.');
    } else if (err.response && err.response.status === 404) {
      console.error(`❌ Deployment '${slug}' not found or has no logs available.`);
    } else {
      console.error('❌ Failed to fetch logs:', err.message || err);
    }
    process.exit(1);
  }
};