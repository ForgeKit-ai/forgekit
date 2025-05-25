import fs from 'fs';
import path from 'path';
import { frontendOptions, backendOptions, uiOptions, databaseOptions } from '../src/registries/modularOptions.js';
const lines = ['# Supported Options', '', '## Frontends'];
for (const [key, val] of Object.entries(frontendOptions)) {
  lines.push(`- ${val} (\`${key}\`)`);
}
lines.push('', '## Backends');
for (const [key, val] of Object.entries(backendOptions)) {
  lines.push(`- ${val} (\`${key}\`)`);
}
lines.push('', '## UI Libraries');
for (const val of Object.values(uiOptions)) {
  lines.push(`- ${val}`);
}
lines.push('', '## Databases');
for (const val of Object.values(databaseOptions)) {
  lines.push(`- ${val}`);
}

const outPath = path.join(process.cwd(), 'STACKS.md');
fs.writeFileSync(outPath, lines.join('\n'));
console.log(`Generated ${outPath}`);

