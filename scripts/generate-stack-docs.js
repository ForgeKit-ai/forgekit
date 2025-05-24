import fs from 'fs';
import path from 'path';
import { stacks } from '../src/registries/stackRegistry.js';

const lines = ['# Supported Stacks', ''];
for (const [key, s] of Object.entries(stacks)) {
  lines.push(`- **${s.label}** (key: \`${key}\`)`);
  lines.push(`  - Frontend: ${s.frontend}`);
  lines.push(`  - Backend: ${s.backend ? s.backend : 'none'}`);
  lines.push(`  - Database: ${s.database || 'none'}`);
  lines.push('');
}

const outPath = path.join(process.cwd(), 'STACKS.md');
fs.writeFileSync(outPath, lines.join('\n'));
console.log(`Generated ${outPath}`);

