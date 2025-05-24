import { execSync } from 'child_process';
import path from 'path';
import process from 'process';

export function runDoctor() {
  console.log('\n🩺 Running ForgeKit doctor...');
  let ok = true;

  function check(cmd, name) {
    try {
      const output = execSync(cmd, { stdio: 'pipe' }).toString().trim();
      console.log(`✓ ${name}: ${output}`);
    } catch {
      console.error(`✖ ${name} not found in PATH`);
      ok = false;
    }
  }

  check('node -v', 'Node.js');
  check('npm -v', 'npm');
  check('git --version', 'git');

  try {
    const globalBin = execSync('npm bin -g').toString().trim();
    const paths = process.env.PATH.split(path.delimiter);
    if (!paths.includes(globalBin)) {
      console.warn(`⚠️  npm global bin directory not in PATH`);
      console.warn(`   Add it with: export PATH=\"$PATH:${globalBin}\"`);
      ok = false;
    } else {
      console.log('✓ npm global bin in PATH');
    }
  } catch {
    // ignore
  }

  if (ok) {
    console.log('\nForgeKit environment looks good!');
  } else {
    console.log('\nSome issues were detected. Please resolve them and try again.');
  }
}
