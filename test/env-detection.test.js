import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { detectEnvVars } from '../src/utils/env.js';

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fk-env-'));
  fs.writeFileSync(path.join(tmp, 'next.config.mjs'), 'console.log(process.env.VITE_TEST_VAR);');
  fs.writeFileSync(path.join(tmp, 'vite.config.js'), 'console.log(import.meta.env.VITE_OTHER_VAR);');
  process.env.VITE_TEST_VAR = '1';
  process.env.VITE_OTHER_VAR = '2';
  const vars = await detectEnvVars(tmp);
  assert.ok(vars.includes('VITE_TEST_VAR'), 'should detect var from next.config.mjs');
  assert.ok(vars.includes('VITE_OTHER_VAR'), 'should detect var from vite.config.js');
})();
console.log('env detection test passed');
