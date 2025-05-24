import { setupExpressBackend } from '../stacks/backend/express.js';
import { setupFastAPI } from '../stacks/backend/fastapi.js';
import { setupFlask } from '../stacks/backend/flask.js';
import { setupDjango } from '../stacks/backend/django.js';
import { setupRails } from '../stacks/backend/rails.js';
import { setupGoFiber } from '../stacks/backend/gofiber.js';
import { setupSpringBoot } from '../stacks/backend/spring-boot.js';

export const backendStacks = {
  'express': { setup: setupExpressBackend },
  'fastapi': { setup: setupFastAPI },
  'flask': { setup: setupFlask },
  'django': { setup: setupDjango },
  'rails': { setup: setupRails },
  'gofiber': { setup: setupGoFiber },
  'spring-boot': { setup: setupSpringBoot }
};
