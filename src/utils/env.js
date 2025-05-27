import fs from 'fs';
import path from 'path';
import fg from 'fast-glob';

const ALLOWED_PREFIXES = ['VITE_', 'NEXT_PUBLIC_'];

function envAllowed(name) {
  return ALLOWED_PREFIXES.some(p => name.startsWith(p));
}

export async function detectEnvVars(cwd = process.cwd()) {
  const files = [];
  const configPatterns = [
    'next.config.{js,ts,mjs,cjs}',
    'vite.config.{js,ts,mjs,cjs}',
  ];
  const configFiles = await fg(configPatterns, { cwd, absolute: true });
  files.push(...configFiles);

  const srcFiles = await fg(['src/**/*.{js,jsx,ts,tsx}'], { cwd, absolute: true });
  files.push(...srcFiles);

  const vars = new Set();
  const regexes = [/process\.env\.([A-Z0-9_]+)/g, /import\.meta\.env\.([A-Z0-9_]+)/g];

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      for (const re of regexes) {
        let match;
        while ((match = re.exec(content))) {
          vars.add(match[1]);
        }
      }
    } catch {}
  }

  return Array.from(vars).filter(v =>
    Object.prototype.hasOwnProperty.call(process.env, v) && envAllowed(v)
  );
}
