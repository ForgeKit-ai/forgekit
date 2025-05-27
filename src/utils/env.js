import fs from 'fs';
import path from 'path';
import fg from 'fast-glob';

// Load .env style files without requiring external dependencies
export function loadEnvFiles(cwd = process.cwd()) {
  const files = ['.env', '.env.local', '.env.production'];
  const combined = {};
  for (const file of files) {
    const filePath = path.join(cwd, file);
    if (!fs.existsSync(filePath)) continue;
    try {
      const lines = fs.readFileSync(filePath, 'utf-8').split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        let value = trimmed.slice(eqIdx + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        combined[key] = value;
      }
    } catch {}
  }
  for (const [k, v] of Object.entries(combined)) {
    if (!Object.prototype.hasOwnProperty.call(process.env, k)) {
      process.env[k] = v;
    }
  }
}

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
