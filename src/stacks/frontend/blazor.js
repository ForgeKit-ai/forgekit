import path from 'path';
import shell from 'shelljs';

export async function setupBlazor(config) {
  const { targetDir, projectName, backend } = config;
  
  // If there's a backend, create frontend in a subdirectory; otherwise create directly in targetDir
  const frontendDir = backend ? path.join(targetDir, 'frontend') : targetDir;
  const outputDir = backend ? 'frontend' : '.';
  const parentDir = backend ? targetDir : path.dirname(targetDir);

  console.log('\n▶️ Creating Blazor WebAssembly project...');
  let result = shell.exec(`dotnet new blazorwasm -o ${outputDir} -n ${projectName}`, { cwd: parentDir, silent: true });
  if (!result || result.code !== 0) throw new Error(`Failed to create Blazor project in ${frontendDir}: ${result.stderr || result.stdout}`);
}
