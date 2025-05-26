import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { handler } from '../commands/deploy.js';

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fk-test-'));
  fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({ scripts: { build: 'echo build' } }));
  process.chdir(tmp);
  process.env.FORGEKIT_TOKEN = 'test';
  await handler({ buildDir: 'dist' });
  assert.ok(!fs.existsSync(path.join(tmp, 'bundle.tar.gz')));
  console.log('deploy missing dir test passed');
})();
