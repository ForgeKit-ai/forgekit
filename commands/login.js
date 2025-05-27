import { login } from '../src/auth.js';

export const command = 'login';
export const describe = 'Authenticate with ForgeKit';
export const builder = {
  debug: {
    type: 'boolean',
    describe: 'Enable verbose output during login',
  },
};
export const handler = async argv => {
  await login({ debug: argv.debug });
};
