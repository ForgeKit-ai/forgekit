# ForgeKit CLI - Supported Stacks

This document outlines all supported framework combinations in ForgeKit CLI.

---

## 🎨 Frontend Frameworks

| Framework | Key | Version | Description | Production Ready |
|-----------|-----|---------|-------------|------------------|
| **React (Vite)** | `react-vite` | 18+ | Modern React with Vite bundler | ✅ |
| **Next.js** | `nextjs` | 15+ | Full-stack React framework | ✅ |
| **Vue (Vite)** | `vue-vite` | 3+ | Progressive Vue.js framework | ✅ |
| **SvelteKit** | `sveltekit` | 2+ | The web development framework | ✅ |
| **Astro** | `astro` | 4+ | All-in-one web framework | ✅ |
| **Angular** | `angular` | 17+ | Full-featured TypeScript framework | ✅ |

### Frontend Features
- **Hot Module Replacement (HMR)**: All frameworks support instant updates during development
- **TypeScript Support**: Native TypeScript integration for all frameworks
- **Production Optimization**: Minification, tree-shaking, and code splitting
- **Progressive Web App**: Service worker and manifest generation
- **Build Verification**: Automatic validation of build output

---

## ⚙️ Backend Frameworks

| Framework | Key | Language | Description | Database Support |
|-----------|-----|----------|-------------|------------------|
| **Express** | `express` | Node.js | Fast, minimalist web framework | PostgreSQL, MongoDB, SQLite |
| **NestJS** | `nestjs` | Node.js | Production-ready TypeScript framework | PostgreSQL, MongoDB, SQLite |
| **FastAPI** | `fastapi` | Python | High-performance async API framework | PostgreSQL, SQLite |
| **Flask** | `flask` | Python | Lightweight WSGI web framework | PostgreSQL, SQLite |
| **Django** | `django` | Python | High-level Python web framework | PostgreSQL, SQLite |
| **Ruby on Rails** | `rails` | Ruby | Convention over configuration | PostgreSQL, MySQL, SQLite |
| **Go Fiber** | `gofiber` | Go | Express-inspired web framework | PostgreSQL |
| **Spring Boot** | `spring-boot` | Java | Production-ready Java framework | PostgreSQL, MySQL |
| **None** | `null` | - | Frontend-only project | SQLite, Supabase |

### Backend Features
- **RESTful APIs**: Standard REST endpoint scaffolding
- **Authentication Ready**: JWT and session-based auth patterns
- **Database Integration**: ORM/ODM setup for chosen database
- **Environment Configuration**: Development and production configs
- **Health Check Endpoints**: Built-in monitoring capabilities
- **Docker Configuration**: Production-ready containerization

---

## 🎨 UI Frameworks

| Framework | Key | Compatibility | Description | Components |
|-----------|-----|---------------|-------------|------------|
| **Tailwind CSS** | `Tailwind` | All frontends | Utility-first CSS framework | Complete CSS system |
| **Chakra UI** | `Chakra` | React, Next.js | Modular and accessible component library | 50+ components |
| **Material-UI** | `Material` | React, Next.js | React components implementing Google's Material Design | 100+ components |
| **Angular Material** | `Material` | Angular | Material Design components for Angular | 30+ components |
| **shadcn/ui** | `shadcn` | React, Next.js | Modern, customizable components built on Radix | Radix primitives |
| **None** | `None` | All frontends | No UI framework (vanilla CSS) | - |

### UI Framework Features

#### shadcn/ui (NEW)
- **Design System**: Complete Tailwind CSS foundation with design tokens
- **Component Library**: Pre-built Button, Card, Input, Label components
- **Customizable**: Easy theming with CSS variables
- **TypeScript**: Full type safety and IntelliSense
- **Accessibility**: Built on Radix UI primitives
- **Dark Mode**: Built-in dark mode support

#### Tailwind CSS
- **Utility Classes**: Comprehensive utility-first CSS system
- **Responsive Design**: Mobile-first responsive utilities
- **Custom Configuration**: Tailored config for each framework
- **PostCSS Integration**: Optimized build process
- **Purge CSS**: Unused style removal for production

#### Chakra UI
- **Component Library**: 50+ accessible components
- **Theme System**: Customizable design system
- **TypeScript**: Full type definitions
- **Responsive**: Built-in responsive design
- **Dark Mode**: Theme-aware color modes

#### Material-UI / Angular Material
- **Material Design**: Google's design language implementation
- **Component Ecosystem**: Comprehensive component library
- **Theming**: Powerful theming capabilities
- **Accessibility**: WCAG compliant components
- **Icons**: Extensive icon library

---

## 🗄️ Database Options

| Database | Key | Type | Description | Backend Compatibility |
|----------|-----|------|-------------|----------------------|
| **Supabase** | `supabase` | PostgreSQL + BaaS | Open source Firebase alternative | All backends |
| **PostgreSQL** | `postgresql` | SQL | Advanced open source relational database | Most backends |
| **SQLite** | `sqlite` | SQL | Lightweight embedded database | All backends |
| **MongoDB** | `mongodb` | NoSQL | Document-oriented NoSQL database | Express, NestJS |
| **MySQL** | `mysql` | SQL | Popular open source relational database | Rails, Spring Boot |

### Database Features
- **Connection Setup**: Automatic configuration and connection strings
- **Environment Variables**: Secure credential management
- **Migration Support**: Database schema evolution
- **Backup Integration**: Automated backup configurations
- **Development Seeds**: Sample data for development

---

## 🔗 Framework Compatibility Matrix

### Frontend + UI Framework Compatibility

| Frontend | Tailwind | Chakra | Material-UI | Angular Material | shadcn/ui |
|----------|----------|--------|-------------|------------------|-----------|
| **React (Vite)** | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Next.js** | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Vue (Vite)** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **SvelteKit** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Astro** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Angular** | ✅ | ❌ | ❌ | ✅ | ❌ |

### Frontend + Backend Compatibility

| Frontend | Express | NestJS | FastAPI | Flask | Django | Rails | Go Fiber | Spring Boot | None |
|----------|---------|--------|---------|-------|--------|-------|----------|-------------|------|
| **React (Vite)** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Next.js** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Vue (Vite)** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **SvelteKit** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Astro** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Angular** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

*Note: Next.js includes its own backend capabilities (API routes), so external backends are typically not needed.*

### Backend + Database Compatibility

| Backend | Supabase | PostgreSQL | SQLite | MongoDB | MySQL |
|---------|----------|------------|--------|---------|-------|
| **Express** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **NestJS** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **FastAPI** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Flask** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Django** | ❌ | ✅ | ✅ | ❌ | ❌ |
| **Rails** | ❌ | ✅ | ✅ | ❌ | ✅ |
| **Go Fiber** | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Spring Boot** | ❌ | ✅ | ❌ | ❌ | ✅ |
| **None** | ✅ | ❌ | ✅ | ❌ | ❌ |

---

## 🔨 Build Tools & Configuration

### Frontend Build Tools

| Framework | Build Tool | Config File | Dev Server | Production Build |
|-----------|------------|-------------|------------|------------------|
| **React (Vite)** | Vite | `vite.config.ts` | `npm run dev` | `npm run build` |
| **Next.js** | Next.js | `next.config.ts` | `npm run dev` | `npm run build` |
| **Vue (Vite)** | Vite | `vite.config.ts` | `npm run dev` | `npm run build` |
| **SvelteKit** | SvelteKit | `svelte.config.js` | `npm run dev` | `npm run build` |
| **Astro** | Astro | `astro.config.mjs` | `npm run dev` | `npm run build` |
| **Angular** | Angular CLI | `angular.json` | `ng serve` | `ng build` |

### Production Optimizations

#### All Frameworks Include:
- **Minification**: JavaScript and CSS compression
- **Tree Shaking**: Dead code elimination
- **Code Splitting**: Lazy loading and dynamic imports
- **Source Maps**: Debugging support (development only)
- **Asset Optimization**: Image and font optimization
- **Bundle Analysis**: Size monitoring and warnings

#### Framework-Specific Optimizations:
- **Vite**: Terser minification, rollup optimizations, ESM output
- **Next.js**: Standalone output, image optimization, automatic static optimization
- **Angular**: Ahead-of-time compilation, bundle budgets, differential loading
- **SvelteKit**: Compiler optimizations, prerendering, service workers

---

## 📦 Package Manager Support

ForgeKit CLI automatically detects and uses your preferred package manager:

| Package Manager | Detection | Command Examples |
|-----------------|-----------|------------------|
| **npm** | `package-lock.json` | `npm install`, `npm run dev` |
| **yarn** | `yarn.lock` | `yarn install`, `yarn dev` |
| **pnpm** | `pnpm-lock.yaml` | `pnpm install`, `pnpm dev` |
| **bun** | `bun.lockb` | `bun install`, `bun dev` |

### Auto-Detection Priority:
1. Existing lock file in current directory
2. Global package manager preference
3. Default to npm

---

## 🚀 Deployment Configuration

### Container Configuration

Every project includes production-ready Docker configuration:

```dockerfile
# Multi-stage build example (Node.js projects)
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS production
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### ForgeKit Configuration

Each project includes a `forgekit.json` with deployment metadata:

```json
{
  "version": "2.0",
  "project": {
    "name": "my-project",
    "type": "fullstack",
    "created": "2025-01-30T12:00:00Z"
  },
  "stack": {
    "frontend": "react-vite",
    "backend": "express", 
    "ui": "shadcn",
    "database": "postgresql"
  },
  "build": {
    "buildDir": "dist",
    "buildScript": "build",
    "buildEnv": "production",
    "outputType": "static"
  },
  "deployment": {
    "type": "container",
    "healthCheck": "/health",
    "port": 3000,
    "environment": "production"
  }
}
```

---

## 🔄 Development Workflow

### Local Development
1. **Project Creation**: `forge` → Interactive framework selection
2. **Dependency Installation**: Automatic package manager detection and installation
3. **Development Server**: Hot reload with framework-specific dev server
4. **Build Verification**: Pre-deployment build validation
5. **Deployment**: `forge deploy` → Production deployment to ForgeKit

### Production Deployment
1. **Build Process**: Framework-specific optimization and bundling
2. **Container Build**: Docker image creation with multi-stage builds
3. **Security Scanning**: Vulnerability assessment and validation
4. **Deployment**: Container deployment with automatic SSL and routing
5. **Monitoring**: Real-time logs, stats, and health monitoring

---

## 📋 Example Combinations

### Popular Stack Examples

#### Modern React Stack
```bash
forge --projectName modern-app \
      --frontend react-vite \
      --ui shadcn \
      --backend nestjs \
      --database postgresql
```

#### JAMstack Application
```bash
forge --projectName jamstack-site \
      --frontend nextjs \
      --ui tailwind \
      --database supabase
```

#### Full-Stack Angular Application
```bash
forge --projectName angular-app \
      --frontend angular \
      --ui material \
      --backend spring-boot \
      --database postgresql
```

#### Python API with Vue Frontend
```bash
forge --projectName python-vue-app \
      --frontend vue-vite \
      --ui tailwind \
      --backend fastapi \
      --database postgresql
```

#### Simple Static Site
```bash
forge --projectName portfolio-site \
      --frontend astro \
      --ui tailwind \
      --backend null \
      --database null
```

---

## 🎯 Getting Started

To explore all available options interactively:

```bash
# Install ForgeKit CLI
npm install -g @forgekit/cli

# Start interactive project creation
forge

# Or use non-interactive mode with specific options
forge --projectName my-app --frontend react-vite --ui shadcn --nonInteractive
```

The CLI will guide you through compatible combinations and automatically configure your chosen stack for immediate development and deployment.

---

*This documentation is automatically generated from the ForgeKit CLI codebase. Run `npm run generate-stack-docs` to update.*