import shell from 'shelljs';
import path from 'path';
import fs from 'fs';

export async function setupRails(config) {
  const { targetDir, projectName } = config;
  const backendDir = path.join(targetDir, 'backend');
  
  console.log('\n◀️ Setting up backend (Rails)...');
  let result = shell.exec(`rails new backend --api -T --database=postgresql`, { cwd: targetDir, silent: true });
  if (!result || result.code !== 0) throw new Error(`Failed to create Rails project: ${result.stderr || result.stdout}`);

  // Create package.json for deployment compatibility
  const packageJson = {
    name: `${projectName}-backend`,
    version: '1.0.0',
    description: `Rails backend for ${projectName}`,
    scripts: {
      build: 'bundle install && rails assets:precompile',
      start: 'rails server -b 0.0.0.0 -p 3000',
      dev: 'rails server'
    },
    main: 'config.ru'
  };
  fs.writeFileSync(path.join(backendDir, 'package.json'), JSON.stringify(packageJson, null, 2));
  console.log('↳ Created package.json for deployment');

  // Configure CORS in Rails application
  const corsConfigPath = path.join(backendDir, 'config', 'initializers', 'cors.rb');
  const corsConfig = `# Be sure to restart your server when you modify this file.

# Avoid CORS issues when API is called from the frontend app.
# Handle Cross-Origin Resource Sharing (CORS) in order to accept cross-origin AJAX requests.

# Read more: https://github.com/cyu/rack-cors

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins '*'

    resource '*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head]
  end
end
`;
  fs.writeFileSync(corsConfigPath, corsConfig);
  console.log('↳ Configured CORS for Rails API');

  // Update Gemfile to include rack-cors
  const gemfilePath = path.join(backendDir, 'Gemfile');
  if (fs.existsSync(gemfilePath)) {
    let gemfile = fs.readFileSync(gemfilePath, 'utf-8');
    if (!gemfile.includes('rack-cors')) {
      gemfile = gemfile.replace(
        '# gem "rack-cors"',
        'gem "rack-cors"'
      );
      fs.writeFileSync(gemfilePath, gemfile);
      console.log('↳ Enabled rack-cors gem in Gemfile');
    }
  }

}
