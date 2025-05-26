import { login } from '../src/auth.js';

export const command = 'login';
export const describe = 'Authenticate with ForgeKit';
export const builder = {};
export const handler = async () => {
  await login();
};
