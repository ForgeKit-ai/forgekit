import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { detectEnvVars } from '../src/utils/env.js';

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fk-env-'));
  const srcDir = path.join(tmp, 'src');
  fs.mkdirSync(srcDir);
  // Create a file that references env vars
  fs.writeFileSync(
    path.join(srcDir, 'index.js'),
    `console.log(process.env.VITE_TOKEN, import.meta.env.VITE_OTHER, process.env.NEXT_PUBLIC_VAR, process.env.NOT_ALLOWED);`
  );

  // Set environment variables
  process.env.VITE_TOKEN = '';
  process.env.NEXT_PUBLIC_VAR = 'value';
  delete process.env.VITE_OTHER;

  const vars = await detectEnvVars(tmp);
  assert.deepStrictEqual(
    vars.sort(),
    ['NEXT_PUBLIC_VAR', 'VITE_TOKEN'].sort(),
    'should detect env vars even when value is empty'
  );
  console.log('env detect test passed');
})();
