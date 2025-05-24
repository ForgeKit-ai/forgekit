import { execSync } from 'child_process';
import path from 'path';
import process from 'process';

try {
  const globalBin = execSync('npm bin -g').toString().trim();
  const paths = process.env.PATH.split(path.delimiter);
  if (!paths.includes(globalBin)) {
    console.warn('\n⚠️  The npm global bin directory is not in your PATH.');
    console.warn(`Add it permanently by appending this line to your shell profile:\n`);
    console.warn(`  export PATH=\"$PATH:${globalBin}\"`);
  }
} catch (err) {
  // swallow errors; this is a best-effort message
}
