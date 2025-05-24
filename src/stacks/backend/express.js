import path from 'path';
import fs from 'fs';
import shell from 'shelljs';
import { setupRootConcurrentDev } from '../../utils.js';

export async function setupExpressBackend(config) {
  const { targetDir, useNodemon } = config;
  const backendDir = path.join(targetDir, 'backend');

  console.log("\n◀️ Setting up backend (Express + TS)...");
  fs.mkdirSync(backendDir, { recursive: true });

  console.log(`  Initializing backend package in ${backendDir}...`);
  let result = shell.exec('npm init -y', { cwd: backendDir, silent: true });
  if (result.code !== 0) throw new Error(`Failed to initialize backend npm package in ${backendDir}`);

  console.log("  Installing backend dependencies...");
  const backendDeps = ['express', 'cors', 'dotenv'];
  const backendDevDeps = ['typescript', '@types/express', '@types/cors', '@types/node', 'ts-node'];
  if (useNodemon) backendDevDeps.push('nodemon');

  result = shell.exec(`npm install ${backendDeps.join(' ')}`, { cwd: backendDir, silent: true });
  if (result.code !== 0) throw new Error(`Failed to install backend dependencies in ${backendDir}`);
  result = shell.exec(`npm install -D ${backendDevDeps.join(' ')}`, { cwd: backendDir, silent: true });
  if (result.code !== 0) throw new Error(`Failed to install backend dev dependencies in ${backendDir}`);

  const tsconfigContent = `{
  "compilerOptions": {
    "target": "ES2016",
    "module": "CommonJS",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "sourceMap": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}`;
  fs.writeFileSync(path.join(backendDir, 'tsconfig.json'), tsconfigContent);
  console.log(`↳ Created tsconfig.json in backend`);

  const backendSrcDir = path.join(backendDir, 'src');
  fs.mkdirSync(backendSrcDir, { recursive: true });
  const indexTsContent = `import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3001;

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from the Express Backend!');
});

app.get('/api/message', (req: Request, res: Response) => {
  res.json({ message: 'This is a message from your API' });
});

app.listen(port, () => {
  console.log(\`🚀 Backend server listening on http://localhost:\${port}\`);
});`;
  fs.writeFileSync(path.join(backendSrcDir, 'index.ts'), indexTsContent);
  console.log(`↳ Created src/index.ts in backend`);

  const backendPkgPath = path.join(backendDir, 'package.json');
  const backendPkg = JSON.parse(fs.readFileSync(backendPkgPath, 'utf-8'));
  backendPkg.main = 'dist/index.js';
  backendPkg.scripts = {
    build: 'tsc',
    start: 'node dist/index.js',
    dev: useNodemon
      ? 'nodemon --watch src --ext ts --exec ts-node src/index.ts'
      : 'ts-node src/index.ts'
  };
  fs.writeFileSync(backendPkgPath, JSON.stringify(backendPkg, null, 2));
  console.log(`↳ Updated package.json scripts in backend`);

  const backendEnvExamplePath = path.join(backendDir, '.env.example');
  const backendEnvContent = `PORT=3001\n# Add other backend-specific environment variables here\n# Example: DATABASE_URL=your_db_connection_string`;
  fs.writeFileSync(backendEnvExamplePath, backendEnvContent);
  console.log(`↳ Created .env.example in backend`);

  setupRootConcurrentDev(targetDir);
}
