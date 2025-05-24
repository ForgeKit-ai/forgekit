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

Running `forge` will prompt you for a project name and desired stack. The
project is created in the directory where you executed the command, and when
scaffolding finishes you will be dropped into a shell inside the new project
folder.

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

## Purpose

ForgeKit aims to streamline bootstrapping modern JavaScript projects by providing a collection of ready‑to‑use stacks with minimal setup hassle.

