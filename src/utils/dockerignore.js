function generateDockerignore(stack, options = {}) {
  const primary = stack.split(' + ')[0].toLowerCase();
  const lines = [
    'node_modules',
    '.git',
    '.env',
    '.env.*',
    '*.env',
    '*.env.*',
    'uploads',
    'deployed',
    '*.tar.gz',
    'coverage'
  ];

  switch (primary) {
    case 'nextjs':
      lines.push('.env.local');
      if (options.nextStandalone) lines.push('.next');
      break;
    case 'react-vite':
    case 'vue-vite':
      lines.push('dist');
      break;
    case 'sveltekit':
      lines.push('.svelte-kit');
      break;
    default:
      break;
  }
  return Array.from(new Set(lines)).join('\n') + '\n';
}

export { generateDockerignore };
