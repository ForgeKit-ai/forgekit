import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { detectEnvVars } from '../src/utils/env.js';

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fk-env-'));
  const srcDir = path.join(tmp, 'src');
  fs.mkdirSync(srcDir, { recursive: true });

  fs.writeFileSync(path.join(srcDir, 'file.js'), `
    console.log(process.env.VITE_ALLOWED);
    console.log(import.meta.env.NEXT_PUBLIC_ALLOWED2);
    console.log(process.env.SECRET_EXCLUDED);
    console.log(import.meta.env.OTHER_EXCLUDED);
  `);

  fs.writeFileSync(path.join(tmp, 'next.config.js'), 'process.env.VITE_FROM_NEXT;');
  fs.writeFileSync(path.join(tmp, 'vite.config.ts'), 'console.log(import.meta.env.NEXT_PUBLIC_FROM_VITE);');

  process.env.VITE_ALLOWED = 'yes';
  process.env.NEXT_PUBLIC_ALLOWED2 = 'ok';
  process.env.VITE_FROM_NEXT = 'next';
  process.env.NEXT_PUBLIC_FROM_VITE = 'vite';
  process.env.SECRET_EXCLUDED = 'secret';
  process.env.OTHER_EXCLUDED = 'excl';
  process.env.NEXT_PUBLIC_EMPTY = '';

  const vars = await detectEnvVars(tmp);

  assert.ok(vars.includes('VITE_ALLOWED'), 'detects allowed process.env var');
  assert.ok(vars.includes('NEXT_PUBLIC_ALLOWED2'), 'detects allowed import.meta.env var');
  assert.ok(vars.includes('VITE_FROM_NEXT'), 'detects var in next.config.js');
  assert.ok(vars.includes('NEXT_PUBLIC_FROM_VITE'), 'detects var in vite.config.ts');

  assert.ok(!vars.includes('SECRET_EXCLUDED'), 'excludes disallowed prefix');
  assert.ok(!vars.includes('OTHER_EXCLUDED'), 'excludes disallowed import.meta prefix');

  // TODO: enable when issue #1 is fixed
  // assert.ok(vars.includes('NEXT_PUBLIC_EMPTY'), 'detects vars with empty string value');
  console.log('env detection test passed');
})();
