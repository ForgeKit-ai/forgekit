import path from 'path';
import shell from 'shelljs';

export async function setupBlazor(config) {
  const { targetDir, projectName } = config;
  const frontendDir = path.join(targetDir, 'frontend');

  console.log('\n▶️ Creating Blazor WebAssembly project...');
  let result = shell.exec(`dotnet new blazorwasm -o frontend -n ${projectName}`, { cwd: targetDir, silent: true });
  if (!result || result.code !== 0) throw new Error(`Failed to create Blazor project in ${frontendDir}: ${result.stderr || result.stdout}`);
}
