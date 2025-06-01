import path from 'path';
import fs from 'fs';
import shell from 'shelljs';
import { checkCommand } from '../../utils.js';

export async function setupGoFiber(config) {
  const { targetDir, projectName } = config;
  const backendDir = path.join(targetDir, 'backend');

  console.log('\n◀️ Setting up backend (Go Fiber)...');
  fs.mkdirSync(backendDir, { recursive: true });

  // Create package.json for deployment compatibility
  const packageJson = {
    name: `${projectName}-backend`,
    version: '1.0.0',
    description: `Go Fiber backend for ${projectName}`,
    scripts: {
      build: 'go mod download && go build -o main .',
      start: './main',
      dev: 'go run main.go'
    },
    main: 'main.go'
  };
  fs.writeFileSync(path.join(backendDir, 'package.json'), JSON.stringify(packageJson, null, 2));
  console.log('↳ Created package.json for deployment');

  let result = shell.exec(`go mod init ${projectName}`, { cwd: backendDir, silent: true });
  checkCommand(result, 'Failed to initialize Go module');

  result = shell.exec('go get github.com/gofiber/fiber/v2', { cwd: backendDir, silent: true });
  checkCommand(result, 'Failed to get Go Fiber dependency');

  result = shell.exec('go get github.com/gofiber/fiber/v2/middleware/cors', { cwd: backendDir, silent: true });
  checkCommand(result, 'Failed to get Go Fiber CORS middleware');

  // Create enhanced main.go with CORS support
  const mainGo = `package main

import (
    "encoding/json"
    "log"
    "os"

    "github.com/gofiber/fiber/v2"
    "github.com/gofiber/fiber/v2/middleware/cors"
)

type Response struct {
    Message string \`json:"message"\`
    Status  string \`json:"status"\`
}

func main() {
    app := fiber.New()

    // Enable CORS
    app.Use(cors.New(cors.Config{
        AllowOrigins: "*",
        AllowMethods: "GET,POST,HEAD,PUT,DELETE,PATCH,OPTIONS",
        AllowHeaders: "*",
    }))

    app.Get("/", func(c *fiber.Ctx) error {
        response := Response{
            Message: "Hello from ${projectName} Go Fiber backend",
            Status:  "running",
        }
        return c.JSON(response)
    })

    app.Get("/health", func(c *fiber.Ctx) error {
        response := Response{Status: "healthy"}
        return c.JSON(response)
    })

    port := os.Getenv("PORT")
    if port == "" {
        port = "3000"
    }

    log.Printf("Server starting on port %s", port)
    log.Fatal(app.Listen(":" + port))
}`;
  fs.writeFileSync(path.join(backendDir, 'main.go'), mainGo);
  console.log('↳ Created main.go with CORS support');

}
