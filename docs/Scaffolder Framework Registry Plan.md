## 🎯 Goal

Build a modular project scaffolding tool that:

- Supports multiple frontend and backend frameworks
    
- Allows for independent or bundled UI framework integration
    
- Is extensible, cleanly decoupled, and npm-publishable
    

## 🏗️ Structure Overview

```
/src/
  ├─ registries/       # Maps stack names to setup functions
  │    ├─ frontend.js
  │    ├─ backend.js
  │    └─ ui.js
  ├─ stacks/           # Actual setup logic per framework
  │    ├─ frontend/
  │    │    ├─ react-vite.js
  │    │    ├─ nextjs.js
  │    │    └─ svelte-vite.js 
  │    └─ backend/
  │         ├─ express.js
  │         ├─ fastify.js
  │         └─ nestjs.js 
  ├─ ui/               # Setup logic for UI frameworks
  │    ├─ tailwind.js
  │    └─ chakra.js
  └─ scaffold.js       # Central dispatcher
```

## ⚙️ scaffold.js

```ts
import { frontendStacks } from "./registries/frontend.js";
import { backendStacks } from "./registries/backend.js";
import { uiFrameworks } from "./registries/ui.js";

export async function scaffoldProject(config) {
  const { frontend, backend, ui, targetDir } = config;

  if (frontendStacks[frontend]) await frontendStacks[frontend].setup(config);
  if (uiFrameworks[ui]) await uiFrameworks[ui].install(targetDir, ui, frontend);
  if (backendStacks[backend]) await backendStacks[backend].setup(config);
}
```

## 💡 Example Config Input

```ts
{
  projectName: "acme-site",
  frontend: "react-vite",
  backend: "express",
  ui: "tailwind",
  targetDir: "./acme-site"
}
```

## 📦 NPM Support Plan

- Move CLI entry point to `/bin/create.js`
    
- Add shebang: `#!/usr/bin/env node`
    
- Reference it in package.json:
    

```json
"bin": {
  "create-devforge": "./bin/create.js"
}
```

- Prepare for `npx create-forgekit my-app`
    

## ✅ Next Steps

- Migrate existing `create.mjs` logic into `stacks/frontend` and `stacks/backend`
    
- Add support for Svelte (frontend) and Fastify (backend)
    
- Start CLI refactor for prompt-based registry selection
    
- Add test scaffolds and CI hooks