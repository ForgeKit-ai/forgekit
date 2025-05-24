import fs from 'fs';
import assert from 'assert';

const files = [
  'src/stacks/frontend/astro.js',
  'src/stacks/frontend/blazor.js',
  'src/stacks/frontend/godot.js',
  'src/stacks/frontend/sveltekit.js',
  'src/stacks/frontend/vue-vite.js',
  'src/stacks/backend/django.js',
  'src/stacks/backend/fastapi.js',
  'src/stacks/backend/flask.js',
  'src/stacks/backend/gofiber.js',
  'src/stacks/backend/rails.js',
  'src/stacks/backend/spring-boot.js'
];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  assert(!content.includes('// TODO:'), `${file} still contains TODO placeholder`);
});

console.log('All stack implementation tests passed.');
