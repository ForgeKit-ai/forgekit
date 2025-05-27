# ForgeKit

ForgeKit is a modular scaffolding tool that helps you spin up full‑stack projects with your choice of frontend, backend and UI frameworks. It creates the initial directory structure, initializes Git and installs required dependencies so you can start coding right away.

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

## `forge login`

Run this command to authenticate the CLI with your ForgeKit account. Your web
browser will open to complete the login flow and the received token will be
stored in `~/.forgekit/config.json`.

Example config file:

```json
{
  "token": "USER_JWT"
}
```

## `forge deploy`

Run this command to publish your project. It will:

- Build the project.
- Bundle the project root into `bundle.tar.gz`, honoring patterns in `.dockerignore`.
- Auto-generate a `.dockerignore` based on your stack if one is missing.
- Upload the archive to ForgeKit hosting.

If you are not logged in, the command will open a browser and prompt you to
authenticate before deploying.

The deploy endpoint can be customized with the `FORGEKIT_DEPLOY_URL` environment variable.
The `projectName` or `slug` value in `forgekit.json` will be sent as the project slug during deployment.

## `forge secrets:set`

Upload environment variables for an existing project.
If the project does not exist on the secrets server, the command will fail
unless you pass the `--create` flag. The secrets endpoint can be customized
with the `FORGEKIT_SECRETS_URL` environment variable.

Example:

```bash
forge secrets:set .env.production --create
```

## Environment variables

ForgeKit scans `next.config.{js,ts,mjs,cjs}`, `vite.config.{js,ts,mjs,cjs}` and all files in `src/` for
occurrences of `process.env.VAR` or `import.meta.env.VAR` during `forge deploy`.
Any matching variables that exist in your local environment and start with
`VITE_` or `NEXT_PUBLIC_` are sent to the remote builder and injected at build
time. Runtime-only secrets should still be uploaded separately via
`forge secrets:set`.

When `forge deploy` executes it will also load environment variables from
`.env`, `.env.local` and `.env.production` if those files exist. They are read in
that order so later files override earlier ones, while existing shell variables
remain untouched. This ensures any detected variables are available for
injection during the build process.

## Purpose

ForgeKit aims to streamline bootstrapping modern JavaScript projects by providing a collection of ready‑to‑use stacks with minimal setup hassle.


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

