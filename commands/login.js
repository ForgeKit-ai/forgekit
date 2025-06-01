import { login } from '../src/auth.js';

export const command = 'login';
export const describe = 'Authenticate with ForgeKit';
export const builder = {};
export const handler = async () => {
  try {
    await login();
    process.exit(0);
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    process.exit(1);
  }
};
