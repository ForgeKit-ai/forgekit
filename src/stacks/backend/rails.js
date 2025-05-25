import shell from 'shelljs';
import path from 'path';

export async function setupRails(config) {
  const { targetDir } = config;
  console.log('\n◀️ Setting up backend (Rails)...');
  let result = shell.exec(`rails new backend --api -T --database=postgresql`, { cwd: targetDir, silent: true });
  if (!result || result.code !== 0) throw new Error(`Failed to create Rails project: ${result.stderr || result.stdout}`);
}
