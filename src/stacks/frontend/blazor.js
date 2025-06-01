import path from 'path';
import fs from 'fs';
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

  // Create package.json for deployment compatibility
  console.log('  Creating package.json for deployment...');
  const packageJson = {
    name: projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    version: '1.0.0',
    private: true,
    scripts: {
      build: 'dotnet publish -c Release -o wwwroot',
      dev: 'dotnet watch',
      serve: 'dotnet run'
    },
    description: `${projectName} - Blazor WebAssembly application`
  };
  
  const pkgJsonPath = path.join(frontendDir, 'package.json');
  fs.writeFileSync(pkgJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('  ↳ Created package.json with build script for deployment');
}
