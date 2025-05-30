import path from 'path';
import fs from 'fs';
import shell from 'shelljs';
import { setupSupabase, setupUIFramework } from '../../utils.js';

export async function setupAngular(config) {
  const { targetDir, projectName, ui, backend } = config;
  
  // If there's a backend, create frontend in a subdirectory; otherwise create directly in targetDir
  const frontendDir = backend ? path.join(targetDir, 'frontend') : targetDir;
  const createCommand = backend ? 
    `npx @angular/cli@latest new frontend --routing --style=scss --skip-git --package-manager=npm` : 
    `npx @angular/cli@latest new . --routing --style=scss --skip-git --package-manager=npm`;
  const parentDir = backend ? targetDir : path.dirname(targetDir);

  console.log('\n▶️ Creating Angular frontend...');
  let result = shell.exec(createCommand, { cwd: parentDir, silent: true });
  if (!result || result.code !== 0) throw new Error(`Failed to create Angular project in ${frontendDir}: ${result.stderr || result.stdout}`);

  // Clean up default files that conflict with ForgeKit structure
  try { fs.rmSync(path.join(frontendDir, '.gitignore'), { force: true }); } catch {}
  try { fs.rmSync(path.join(frontendDir, 'README.md'), { force: true }); } catch {}

  console.log('  Installing frontend dependencies...');
  result = shell.exec('npm install', { cwd: frontendDir, silent: true });
  if (result.code !== 0) throw new Error(`Failed to install frontend dependencies in ${frontendDir}: ${result.stderr || result.stdout}`);

  // Verify and ensure build script exists
  console.log('  Verifying build configuration...');
  const pkgJsonPath = path.join(frontendDir, 'package.json');
  if (fs.existsSync(pkgJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
    if (!pkg.scripts || !pkg.scripts.build) {
      pkg.scripts = pkg.scripts || {};
      pkg.scripts.build = 'ng build --configuration production';
      pkg.scripts.serve = 'ng serve';
      fs.writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2));
      console.log('  ↳ Added missing build script to package.json');
    } else {
      console.log('  ↳ Build script verified in package.json');
    }
  }

  // Configure Angular for production optimization
  console.log('  Configuring Angular for production...');
  const angularJsonPath = path.join(frontendDir, 'angular.json');
  if (fs.existsSync(angularJsonPath)) {
    const angularConfig = JSON.parse(fs.readFileSync(angularJsonPath, 'utf-8'));
    const projectKey = Object.keys(angularConfig.projects)[0];
    
    if (angularConfig.projects[projectKey]) {
      // Enhance production build configuration
      const prodConfig = angularConfig.projects[projectKey].architect.build.configurations.production;
      prodConfig.optimization = true;
      prodConfig.outputHashing = 'all';
      prodConfig.sourceMap = false;
      prodConfig.namedChunks = false;
      prodConfig.extractLicenses = true;
      prodConfig.vendorChunk = false;
      prodConfig.budgets = [
        {
          type: 'initial',
          maximumWarning: '2mb',
          maximumError: '5mb'
        },
        {
          type: 'anyComponentStyle',
          maximumWarning: '6kb',
          maximumError: '10kb'
        }
      ];
      
      fs.writeFileSync(angularJsonPath, JSON.stringify(angularConfig, null, 2));
      console.log('  ↳ Configured Angular for optimized production builds');
    }
  }

  // Create enhanced app component
  const appComponentPath = path.join(frontendDir, 'src', 'app', 'app.component.ts');
  if (fs.existsSync(appComponentPath)) {
    let appContent = `import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: \`
    <div class="container">
      <h1>{{title}}</h1>
      <p>Welcome to your ${projectName} Angular application!</p>
      <p>Edit <code>src/app/app.component.ts</code> to get started.</p>
    </div>
  \`,
  styles: [\`
    .container {
      text-align: center;
      padding: 2rem;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    h1 {
      color: #dd0031;
      margin-bottom: 1rem;
    }
    p {
      margin: 0.5rem 0;
    }
    code {
      background-color: #f1f1f1;
      padding: 2px 4px;
      border-radius: 3px;
    }
  \`]
})
export class AppComponent {
  title = '${projectName}';
}`;

    if (ui === 'Material') {
      appContent = `import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: \`
    <mat-toolbar color="primary">
      <span>{{title}}</span>
    </mat-toolbar>
    <div class="container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Welcome to ${projectName}!</mat-card-title>
          <mat-card-subtitle>Angular + Material UI</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>Your Angular application is ready. Edit <code>src/app/app.component.ts</code> to get started.</p>
          <mat-chip-set>
            <mat-chip>Angular</mat-chip>
            <mat-chip>Material UI</mat-chip>
            <mat-chip>TypeScript</mat-chip>
          </mat-chip-set>
        </mat-card-content>
      </mat-card>
    </div>
  \`,
  styles: [\`
    .container {
      padding: 2rem;
      max-width: 600px;
      margin: 0 auto;
    }
    code {
      background-color: #f1f1f1;
      padding: 2px 4px;
      border-radius: 3px;
    }
  \`]
})
export class AppComponent {
  title = '${projectName}';
}`;
    }

    fs.writeFileSync(appComponentPath, appContent);
    console.log('  ↳ Created enhanced app component');
  }

  // Configure app.module.ts for UI frameworks
  const appModulePath = path.join(frontendDir, 'src', 'app', 'app.module.ts');
  if (fs.existsSync(appModulePath) && ui === 'Material') {
    const moduleContent = `import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    MatCardModule,
    MatChipsModule,
    MatButtonModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }`;
    
    fs.writeFileSync(appModulePath, moduleContent);
    console.log('  ↳ Configured app.module.ts for Material UI');
  }

  if (config.database === 'supabase') {
    await setupSupabase(frontendDir, 'NG');
  }
  await setupUIFramework(frontendDir, ui, 'angular');
}