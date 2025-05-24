import path from 'path';
import fs from 'fs';

export async function setupGodot(config) {
  const { targetDir, projectName } = config;
  const frontendDir = path.join(targetDir, 'frontend');

  console.log('\n▶️ Creating Godot project directory...');
  fs.mkdirSync(frontendDir, { recursive: true });
  const readmePath = path.join(frontendDir, 'README.md');
  const readme = `# ${projectName} (Godot)\n\nOpen this folder with Godot to start developing your game.`;
  fs.writeFileSync(readmePath, readme);
}
