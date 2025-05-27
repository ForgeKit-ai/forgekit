import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { generateDockerignore, filesFromDockerignore } from '../src/utils/dockerignore.js';

const output = generateDockerignore('nextjs', { nextStandalone: true });
assert.ok(output.includes('.next'), 'should include .next when standalone');
assert.ok(output.includes('node_modules'), 'should ignore node_modules');

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fk-di-'));
  fs.writeFileSync(path.join(tmp, '.dockerignore'), 'ignored.txt\n');
  fs.writeFileSync(path.join(tmp, 'ignored.txt'), '');
  fs.writeFileSync(path.join(tmp, 'keep.txt'), '');
  const list = await filesFromDockerignore(tmp);
  assert.ok(list.includes('keep.txt'), 'should include files not ignored');
  assert.ok(!list.includes('ignored.txt'), 'should exclude ignored files');
})();
console.log('dockerignore util test passed');
