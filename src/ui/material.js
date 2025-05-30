import { setupUIFramework } from '../utils.js';

export async function install(targetDir, stackType) {
  await setupUIFramework(targetDir, 'Material', stackType);
}