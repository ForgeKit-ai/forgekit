import path from 'path';
import fs from 'fs';
import shell from 'shelljs';
import { checkCommand } from '../../utils.js';

export async function setupGoFiber(config) {
  const { targetDir, projectName } = config;
  const backendDir = path.join(targetDir, 'backend');

  console.log('\n◀️ Setting up backend (Go Fiber)...');
  fs.mkdirSync(backendDir, { recursive: true });

  let result = shell.exec(`go mod init ${projectName}`, { cwd: backendDir, silent: true });
  checkCommand(result, 'Failed to initialize Go module');

  result = shell.exec('go get github.com/gofiber/fiber/v2', { cwd: backendDir, silent: true });
  checkCommand(result, 'Failed to get Go Fiber dependency');

  const mainGo = `package main\n\nimport \"github.com/gofiber/fiber/v2\"\n\nfunc main() {\n  app := fiber.New()\n  app.Get(\"/\", func(c *fiber.Ctx) error {\n    return c.SendString(\"Hello from Go Fiber!\")\n  })\n  app.Listen(\":3001\")\n}`;
  fs.writeFileSync(path.join(backendDir, 'main.go'), mainGo);
}
