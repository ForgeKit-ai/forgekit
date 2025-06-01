import path from 'path';
import fs from 'fs';
import shell from 'shelljs';
import { checkCommand } from '../../utils.js';

export async function setupNestJS(config) {
  const { targetDir, projectName } = config;
  const backendDir = path.join(targetDir, 'backend');

  console.log('\n◀️ Setting up backend (NestJS)...');
  fs.mkdirSync(backendDir, { recursive: true });

  // Create package.json for deployment compatibility
  const packageJson = {
    name: `${projectName}-backend`,
    version: '1.0.0',
    description: `NestJS backend for ${projectName}`,
    scripts: {
      build: 'nest build',
      start: 'node dist/main',
      'start:prod': 'node dist/main',
      'start:dev': 'nest start --watch',
      dev: 'nest start --watch'
    },
    main: 'dist/main.js'
  };
  fs.writeFileSync(path.join(backendDir, 'package.json'), JSON.stringify(packageJson, null, 2));
  console.log('↳ Created package.json for deployment');

  // Install NestJS CLI globally first, then create project
  console.log('  Installing NestJS CLI and creating project...');
  let result = shell.exec('npm install -g @nestjs/cli', { silent: true });
  if (result.code !== 0) {
    console.warn('⚠️ Could not install NestJS CLI globally, using npx instead');
  }

  // Create NestJS project
  result = shell.exec(`npx @nestjs/cli new . --package-manager npm --skip-git`, { cwd: backendDir, silent: true });
  checkCommand(result, 'Failed to create NestJS project');

  // Install additional production dependencies
  console.log('  Installing additional dependencies...');
  result = shell.exec('npm install @nestjs/config @nestjs/swagger class-validator class-transformer', { cwd: backendDir, silent: true });
  checkCommand(result, 'Failed to install additional NestJS dependencies');

  // Create enhanced main.ts with CORS and production configuration
  const mainTsPath = path.join(backendDir, 'src', 'main.ts');
  const mainContent = `import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: '*', // Configure this for production
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: '*',
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // API documentation with Swagger
  const config = new DocumentBuilder()
    .setTitle('${projectName} API')
    .setDescription('API documentation for ${projectName}')
    .setVersion('1.0')
    .addTag('${projectName.toLowerCase()}')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Health check endpoint
  app.getHttpAdapter().get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(\`🚀 ${projectName} NestJS backend running on http://localhost:\${port}\`);
  console.log(\`📚 API documentation available at http://localhost:\${port}/api\`);
}

bootstrap();`;
  fs.writeFileSync(mainTsPath, mainContent);
  console.log('↳ Enhanced main.ts with CORS, validation, and Swagger');

  // Create enhanced app.controller.ts
  const appControllerPath = path.join(backendDir, 'src', 'app.controller.ts');
  const appControllerContent = `import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get welcome message' })
  @ApiResponse({ status: 200, description: 'Welcome message returned successfully' })
  getHello(): object {
    return {
      message: this.appService.getHello(),
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  getHealth(): object {
    return {
      status: 'healthy',
      service: '${projectName} Backend',
      timestamp: new Date().toISOString()
    };
  }
}`;
  fs.writeFileSync(appControllerPath, appControllerContent);
  console.log('↳ Enhanced app.controller.ts with API documentation and health checks');

  // Update app.service.ts
  const appServicePath = path.join(backendDir, 'src', 'app.service.ts');
  const appServiceContent = `import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello from ${projectName} NestJS backend!';
  }
}`;
  fs.writeFileSync(appServicePath, appServiceContent);
  console.log('↳ Updated app.service.ts with project-specific message');

  // Create environment configuration
  const envExampleContent = `# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration (add your database URL here)
# DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# JWT Configuration (add your secret key for production)
# JWT_SECRET=your-secret-key-here

# CORS Configuration
# CORS_ORIGIN=http://localhost:3000`;
  fs.writeFileSync(path.join(backendDir, '.env.example'), envExampleContent);
  console.log('↳ Created .env.example for environment configuration');

  // Create production-ready Dockerfile
  const dockerfileContent = `FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY --from=development /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]`;
  fs.writeFileSync(path.join(backendDir, 'Dockerfile'), dockerfileContent);
  console.log('↳ Created production-ready Dockerfile');

}