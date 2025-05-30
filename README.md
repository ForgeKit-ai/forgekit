# ForgeKit

ForgeKit is a modular full-stack scaffolding and hosting platform that helps you build and deploy modern web applications. Create projects with your choice of frontend, backend and UI frameworks, then deploy them to production with a single command.

## Prerequisites

- Node.js (version 18 or later recommended)
- npm or yarn
- Git installed and available in your PATH

## Example Usage

Install the package globally and run the CLI:

```bash
npm install -g @forgekit/cli
forge
```

Running `forge` will prompt you step‑by‑step for a frontend, UI library, backend
and optional database. Choices are filtered so only compatible combinations are
shown. The project is created in the directory where you executed the command
and when scaffolding finishes you will be dropped into a shell inside the new
project folder.

The tool can also be configured programmatically. Example configuration from the project plan:

```ts
{
  projectName: "acme-site",
  frontend: "react-vite",
  backend: "express",
  ui: "tailwind",
  targetDir: "./acme-site"
}
```

You can also use `npx` without installing globally:

```bash
npx @forgekit/cli
```
This behaves the same as the global install, prompting for details and placing
you in the newly created project directory when finished.

If the `forge` command is not found after a global install, ensure your npm
global bin directory is in your `PATH`.
You can typically add it with:

```bash
$env:Path += ";$(npm bin -g)"
```

You can verify your environment at any time with the built in doctor command:

```bash
forge --doctor
```

## Commands

ForgeKit provides several commands for project management and deployment:

### `forge login`

Authenticate the CLI with your ForgeKit account. Opens your web browser to complete the login flow and stores authentication credentials locally.

**What it stores:**
- Session token for API authentication  
- User ID (full UUID from Supabase)
- Safe User ID (first 8 alphanumeric characters for container naming)

Example `~/.forgekit/config.json`:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "c87df195-2d1f-493e-8093-2fc5b5a52a5e",
  "safeUserId": "c87df195"
}
```

### `forge build`

Build your project and create a deployment bundle without deploying. This command:

- Auto-detects your project stack (Next.js, Vite, SvelteKit, etc.)
- Runs the appropriate build command (`npm run build`, `yarn build`, etc.)
- Creates a `bundle.tar.gz` file in the `.forgekit/` directory
- Validates bundle contents to ensure deployment compatibility

**Supported stacks:**
- Next.js (`next build`)
- React/Vue/Svelte with Vite (`vite build`) 
- SvelteKit (`svelte-kit build`)
- Astro (`astro build`)
- Blazor (`dotnet publish`)
- Godot (`godot --export-release`)

```bash
forge build
```

### `forge deployments:list`

View all your deployed projects with their current status and URLs.

```bash
forge deployments:list
```

**Sample output:**
```
📦 Deployed Projects:
──────────────────────────────────────────────────────────────
🟢  acme-site           8jezdu.forgekit.ai       May 29 2025
🟡  docs-landing        3n04fv.forgekit.ai       May 22 2025

Total deployments: 2
```

**Status indicators:**
- 🟢 Active/deployed
- 🟡 Building/pending  
- 🔴 Failed/error

### `forge deploy`

Build and deploy your project to ForgeKit hosting. This command:

- **Auto-generates `forgekit.json`** if missing (prompts for project name and slug)
- Builds the project using the appropriate build command
- Bundles the project root into `bundle.tar.gz` (respects `.dockerignore`)
- Auto-generates `.dockerignore` and `Dockerfile` if missing
- Uploads and deploys to ForgeKit hosting

**Project Configuration:**

Before first deploy, you'll be prompted to create a `forgekit.json` file:

```json
{
  "userId": "c87df195-2d1f-493e-8093-2fc5b5a52a5e",
  "safeUserId": "c87df195",
  "slug": "my-awesome-app", 
  "projectName": "My Awesome App"
}
```

- **userId**: Full UUID for API authentication
- **safeUserId**: 8-character safe ID for container naming (`forgekit-c87df195-my-awesome-app`)
- **slug**: URL-safe project identifier  
- **projectName**: Human-readable project name

**Environment Variables:**
The deploy command automatically detects and injects build-time environment variables that match:
- `VITE_*` (for Vite projects)
- `NEXT_PUBLIC_*` (for Next.js projects)

```bash
forge deploy
```

### `forge secrets:set`

Upload runtime environment variables for an existing deployed project. These are separate from build-time variables and are securely injected at runtime.

**Usage:**
```bash
forge secrets:set .env.production --create
```

**Options:**
- `--create`: Create the project on the secrets server if it doesn't exist
- Custom endpoint via `FORGEKIT_SECRETS_URL` environment variable

## Environment Variables

ForgeKit handles environment variables in two ways:

### Build-time Variables (Automatic)
During `forge deploy`, ForgeKit automatically:

1. **Scans your code** for `process.env.VAR` or `import.meta.env.VAR` usage in:
   - `next.config.{js,ts,mjs,cjs}` 
   - `vite.config.{js,ts,mjs,cjs}`
   - All files in `src/`

2. **Detects public variables** that start with:
   - `VITE_*` (for Vite projects)
   - `NEXT_PUBLIC_*` (for Next.js projects)

3. **Auto-loads from files** in this order (later files override earlier ones):
   - `.env`
   - `.env.local`  
   - `.env.production`

4. **Injects at build time** during remote deployment

### Runtime Variables (Manual)
Use `forge secrets:set` for sensitive environment variables that should only be available at runtime, not embedded in the build.

## Typical Workflow

1. **Create a new project:**
   ```bash
   forge
   # Follow prompts to select frontend, backend, UI library
   ```

2. **Develop your application:**
   ```bash
   # Install dependencies, write code, test locally
   npm run dev
   ```

3. **Test the build:**
   ```bash
   forge build
   # Verify bundle creation in .forgekit/bundle.tar.gz
   ```

4. **Deploy to production:**
   ```bash
   forge login    # First time only
   forge deploy   # Builds and deploys automatically
   ```

5. **Manage deployments:**
   ```bash
   forge deployments:list  # View all your projects
   forge secrets:set .env.production --create  # Add runtime secrets
   ```

## Architecture

ForgeKit uses a **containerized hosting platform** with:

- **Traefik-based routing** for automatic HTTPS and load balancing
- **Isolated containers** per user project (`forgekit-{safeUserId}-{slug}`)
- **Supabase authentication** for secure user management
- **Docker-based builds** with automatic Dockerfile generation


## Development

Run tests with:

```bash
npm test
```

To update the stack documentation after modifying the available options run:


```bash
npm run generate-stack-docs
```

This will regenerate `STACKS.md` based on the registry files.

There is currently no formal CONTRIBUTING guide, but pull requests and issues are welcome.

