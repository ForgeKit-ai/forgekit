import assert from 'assert';
import { generateDockerignore } from '../src/utils/dockerignore.js';

const output = generateDockerignore('nextjs', { nextStandalone: true });
assert.ok(output.includes('.next'), 'should include .next when standalone');
assert.ok(output.includes('node_modules'), 'should ignore node_modules');
console.log('dockerignore util test passed');
