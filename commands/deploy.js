import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const tar = require('tar');
import axios from 'axios';
import FormData from 'form-data';

const asyncExec = promisify(exec);

export const command = 'deploy';
export const describe = 'Build, bundle, and deploy to ForgeKit hosting';
export const builder = {};
export const handler = async () => {
  const bundlePath = path.join(process.cwd(), 'bundle.tar.gz');
  try {
    const useYarn = fs.existsSync('yarn.lock');
    const buildCmd = useYarn ? 'yarn build' : 'npm run build';
    console.log('🏗️ Building project...');
    await asyncExec(buildCmd);

    console.log('📦 Bundling dist/ into bundle.tar.gz...');
    await tar.c({ gzip: true, file: bundlePath }, ['dist']);

    console.log('🚀 Uploading bundle...');
    const form = new FormData();
    form.append('file', fs.createReadStream(bundlePath));
    const res = await axios.post('http://178.156.171.10:3001/deploy_cli', form, {
      headers: form.getHeaders(),
    });
    const url = res.data && res.data.url;
    console.log(`Deployed at: ${url}`);
  } catch (err) {
    console.error('❌ Deployment failed:', err.message || err);
  } finally {
    try {
      fs.unlinkSync(bundlePath);
    } catch {}
  }
};
