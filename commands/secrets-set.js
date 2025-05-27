import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import { ensureLoggedIn } from '../src/auth.js'; // Assuming auth.js is in src

export const command = 'secrets:set <file>';
export const describe = 'Upload a .env file for deployment';

export const builder = (yargs) => {
  yargs.positional('file', {
    describe: 'Path to the .env file to upload (e.g., .env, .env.local, .env.production)',
    type: 'string',
  }).option('create', {
    type: 'boolean',
    default: false,
    describe: 'Create the project on the secrets server if it does not exist',
  });
};

export const handler = async (argv) => {
  const { file, create } = argv;
  const validEnvFiles = ['.env', '.env.local', '.env.production'];
  const ext = path.extname(file);
  const basename = path.basename(file);
  const isValidExt = validEnvFiles.includes(basename) || (ext === '' && validEnvFiles.some(vf => basename.startsWith(vf)));


  console.log(`🔐 Uploading ${file}...`);

  // 1. Validate input file
  if (!fs.existsSync(file)) {
    console.error(`❌ File not found: ${file}`);
    process.exit(1);
  }

  const fileName = path.basename(file);
  if (!validEnvFiles.some(validFile => fileName === validFile || fileName.startsWith(validFile + '.'))) {
    // A more robust check might be needed if files like .env.production.local are possible
    // For now, we check direct matches or .env.production, .env.local etc.
    // A simple check for .env*
    if (!fileName.startsWith('.env')) {
        console.error(`❌ Invalid file type: ${file}. Must be a .env, .env.local, or .env.production style file.`);
        process.exit(1);
    }
  }


  // 2. Determine slug
  let slug;
  const forgeConfigPath = path.resolve(process.cwd(), 'forgekit.json');
  if (!fs.existsSync(forgeConfigPath)) {
    console.error('❌ Cannot detect project slug—missing forgekit.json in the project root.');
    process.exit(1);
  }
  try {
    const forgeConfig = JSON.parse(fs.readFileSync(forgeConfigPath, 'utf-8'));
    slug = forgeConfig.projectName || forgeConfig.slug;
    if (!slug) {
      console.error('❌ Project slug not found in forgekit.json.');
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Error reading or parsing forgekit.json: ${error.message}`);
    process.exit(1);
  }

  // 3. Authenticate
  let token;
  try {
    token = await ensureLoggedIn();
  } catch (error) {
    console.error(`❌ Authentication failed: ${error.message}. Try running forge login again.`);
    process.exit(1);
  }

  const baseUrl = process.env.FORGEKIT_SECRETS_URL || 'http://178.156.171.10:3001';

  // Check if project exists before uploading
  try {
    await axios.get(`${baseUrl}/projects/${slug}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    if (error.response && error.response.status === 404) {
      if (!create) {
        console.error(`❌ Project "${slug}" does not exist on the secrets server.`);
        console.error('Run `forge deploy` first or use the --create flag to create it automatically.');
        process.exit(1);
      }
      try {
        await axios.post(`${baseUrl}/projects`, { slug }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log(`✅ Project "${slug}" created on secrets server.`);
      } catch (err) {
        console.error(`❌ Failed to create project: ${err.response?.data?.message || err.message}`);
        process.exit(1);
      }
    } else {
      console.error(`❌ Failed to verify project: ${error.response?.data?.message || error.message}`);
      process.exit(1);
    }
  }

  // 4. Send POST to deploy server
  const form = new FormData();
  form.append('file', fs.createReadStream(file));
  const deployServerUrl = `${baseUrl}/env/${slug}`;

  try {
    await axios.post(deployServerUrl, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`,
      },
    });
    console.log(`✅ Secrets uploaded for project "${slug}"`);
  } catch (error) {
    let errorMessage = 'Unknown error';
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      switch (error.response.status) {
        case 401:
          errorMessage = 'Invalid token. Try running forge login again.';
          break;
        case 403:
          errorMessage = `Access denied for project "${slug}".`;
          break;
        case 404:
          errorMessage = `Project "${slug}" not found on the server or invalid endpoint.`;
          break;
        case 500:
          errorMessage = 'Server error during upload.';
          break;
        default:
          errorMessage = error.response.data?.message || error.response.statusText || `Server responded with status ${error.response.status}`;
      }
    } else if (error.request) {
      // The request was made but no response was received
      errorMessage = 'No response from server. Check your network connection or the server status.';
    } else {
      // Something happened in setting up the request that triggered an Error
      errorMessage = error.message;
    }
    console.error(`❌ Failed to upload secrets: ${errorMessage}`);
    process.exit(1);
  }
};