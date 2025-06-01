import path from 'path';
import fs from 'fs';

export async function setupGodot(config) {
  const { targetDir, projectName, backend } = config;
  
  // If there's a backend, create frontend in a subdirectory; otherwise create directly in targetDir
  const frontendDir = backend ? path.join(targetDir, 'frontend') : targetDir;

  console.log('\n▶️ Creating Godot project directory...');
  fs.mkdirSync(frontendDir, { recursive: true });
  
  // Create basic project.godot file
  const projectGodotContent = `; Engine configuration file.
; It's best edited using the editor UI and not directly,
; since the parameters that go here are not all obvious.
;
; Format:
;   [section] ; section goes between []
;   param=value ; assign values to parameters

config_version=5

[application]

config/name="${projectName}"
config/features=PackedStringArray("4.2", "Forward Plus")
config/icon="res://icon.svg"

[rendering]

textures/canvas_textures/default_texture_filter=2`;
  
  const projectGodotPath = path.join(frontendDir, 'project.godot');
  fs.writeFileSync(projectGodotPath, projectGodotContent);
  
  // Create package.json for deployment compatibility
  console.log('  Creating package.json for deployment...');
  const packageJson = {
    name: projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    version: '1.0.0',
    private: true,
    scripts: {
      build: 'echo "Godot projects need to be exported manually from the Godot editor" && mkdir -p dist && cp -r . dist/',
      dev: 'echo "Open this project in Godot editor to run"',
      serve: 'echo "Use Godot editor to run the project"'
    },
    description: `${projectName} - Godot game project`
  };
  
  const pkgJsonPath = path.join(frontendDir, 'package.json');
  fs.writeFileSync(pkgJsonPath, JSON.stringify(packageJson, null, 2));
  
  const readmePath = path.join(frontendDir, 'README.md');
  const readme = `# ${projectName} (Godot)

## Development
1. Open this folder with Godot editor to start developing your game
2. Configure export settings in Godot for web deployment
3. Export to HTML5 for deployment

## Deployment
Run \`npm run build\` to prepare for deployment (after configuring Godot export settings).`;
  fs.writeFileSync(readmePath, readme);
  console.log('  ↳ Created package.json and project files for deployment');
}
