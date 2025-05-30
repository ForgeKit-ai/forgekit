# ForgeKit CLI

**Production-ready full-stack project scaffolding with instant deployment capabilities.**

ForgeKit CLI is an open-source scaffolding tool that creates production-ready full-stack projects with your choice of modern frameworks, complete with deployment configurations, security best practices, and instant hosting capabilities.

🎯 **Perfect for**: Indie developers, weekend hackers, prototyping, and production applications  
🚀 **From idea to production**: Complete project scaffolding with instant deployment to ForgeKit hosting  
⚡ **Modern stack support**: Latest frameworks with production-optimized configurations

---

## 🚀 Quick Start

```bash
# Install globally
npm install -g @forgekit/cli

# Create a new project (interactive)
forge

# Or create directly with npx
npx @forgekit/cli
```

### One-Command Deployment
```bash
# Deploy your project instantly
forge deploy

# Manage your deployments
forge list
forge logs my-app
forge stats my-app
```

---

## ✨ Features

### 🎯 **Interactive Scaffolding**
- **Frontend Frameworks**: React (Vite), Next.js, Vue (Vite), SvelteKit, Astro, Angular
- **Backend Frameworks**: Express, NestJS, FastAPI, Flask, Django, Ruby on Rails, Go Fiber, Spring Boot
- **UI Frameworks**: Tailwind CSS, Chakra UI, Material-UI/Angular Material, **shadcn/ui**, or None
- **Database Options**: Supabase, PostgreSQL, SQLite, MongoDB, MySQL
- **Package Managers**: npm, yarn, pnpm, bun (auto-detected)

### 🔐 **Enterprise Security**
- **AES-256-GCM Token Encryption**: Secure credential storage in `~/.forgekit/config.json`
- **Certificate Validation**: Prevents MITM attacks with strict TLS verification
- **Response Integrity**: Content validation and suspicious pattern detection
- **Secure Authentication**: OAuth flow with port conflict resolution

### 📦 **Production-Ready Deployment**
- **Progressive Deployment**: Step-by-step indicators with detailed feedback
- **Build Verification**: Automatic validation before deployment
- **Bundle Analysis**: Size monitoring with optimization warnings
- **Multi-Environment**: Development, staging, and production configurations

### 🛠️ **Developer Experience**
- **Verbose Logging**: Detailed debugging with `--verbose` flag
- **Dry Run Mode**: Preview deployments with `--dry-run`
- **Environment Health**: Built-in diagnostics with `forge --doctor`
- **Auto-Configuration**: Dockerfile generation, Git initialization, dependency management

---

## 🏗️ Supported Stacks

### Frontend Frameworks

| Framework | Version | UI Libraries | Build Tool | Production Ready |
|-----------|---------|--------------|------------|------------------|
| **React (Vite)** | 18+ | Tailwind, Chakra, Material-UI, shadcn/ui | Vite | ✅ |
| **Next.js** | 15+ | Tailwind, Chakra, Material-UI, shadcn/ui | Next.js | ✅ |
| **Vue (Vite)** | 3+ | Tailwind CSS | Vite | ✅ |
| **SvelteKit** | 2+ | Tailwind CSS | SvelteKit | ✅ |
| **Astro** | 4+ | Tailwind CSS | Astro | ✅ |
| **Angular** | 17+ | Tailwind, Angular Material | Angular CLI | ✅ |

### Backend Frameworks

| Framework | Language | Features | Database Support | Production Ready |
|-----------|----------|----------|------------------|------------------|
| **Express** | Node.js | RESTful APIs, Middleware | PostgreSQL, MongoDB, SQLite | ✅ |
| **NestJS** | Node.js | TypeScript, Decorators, Swagger | PostgreSQL, MongoDB, SQLite | ✅ |
| **FastAPI** | Python | Async, Auto-docs, Type hints | PostgreSQL, SQLite | ✅ |
| **Flask** | Python | Lightweight, Flexible | PostgreSQL, SQLite | ✅ |
| **Django** | Python | ORM, Admin panel | PostgreSQL, SQLite | ✅ |
| **Ruby on Rails** | Ruby | Convention over configuration | PostgreSQL, MySQL, SQLite | ✅ |
| **Go Fiber** | Go | High performance, Express-like | PostgreSQL | ✅ |
| **Spring Boot** | Java | Enterprise features | PostgreSQL, MySQL | ✅ |

### UI Frameworks

| Framework | Compatibility | Features | Components |
|-----------|---------------|----------|------------|
| **Tailwind CSS** | All frontends | Utility-first, responsive design | Complete CSS framework |
| **Chakra UI** | React, Next.js | Component library, theme system | 50+ components |
| **Material-UI** | React, Next.js | Google Material Design | 100+ components |
| **Angular Material** | Angular | Material Design for Angular | 30+ components |
| **shadcn/ui** | React, Next.js | Modern, customizable components | Radix primitives |

---

## 🆕 New: shadcn/ui Support

ForgeKit now includes comprehensive support for **shadcn/ui**, the modern React component library that's taking the development world by storm:

### ✨ What You Get
- **Complete Tailwind Foundation**: Optimized Tailwind CSS setup with shadcn/ui design system
- **Pre-installed Components**: Button, Card, Input, Label, and more components ready to use
- **Design Token System**: Full CSS variable system for theming and customization
- **TypeScript Support**: Complete type definitions and utility functions
- **Interactive Examples**: Working components with React hooks integration

### 🎨 Example Generated Code
When you choose React + shadcn/ui, ForgeKit generates this production-ready code:

```tsx
import { useState } from 'react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';

export function App() {
  const [count, setCount] = useState(0);
  
  return (
    <div className="container mx-auto p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">My Awesome App</CardTitle>
          <CardDescription>React + shadcn/ui</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Edit <code className="bg-muted px-2 py-1 rounded">src/App.tsx</code> and save to test HMR
          </p>
          <Button onClick={() => setCount(count + 1)} variant="default">
            Count: {count}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 🛠️ What's Configured
- **tailwind.config.js**: Complete shadcn/ui configuration with design tokens
- **components.json**: shadcn/ui CLI configuration for adding more components
- **lib/utils.ts**: Utility functions including the essential `cn()` helper
- **CSS Variables**: Full design system with light/dark mode support
- **Component Library**: Easy to extend with `npx shadcn-ui@latest add [component]`

---

## 🔧 Commands

### Project Creation
```bash
# Interactive project creation
forge

# Non-interactive with options
forge --projectName my-app --frontend react-vite --ui shadcn --backend express

# Quick start with specific stack
forge --projectName todo-app --frontend nextjs --ui shadcn --nonInteractive
```

### Authentication
```bash
# Login to ForgeKit platform
forge login

# Check authentication status
forge whoami

# Logout and clear tokens
forge logout
```

### Deployment Management
```bash
# Deploy current project
forge deploy

# Deploy with options
forge deploy --verbose --skip-build
forge deploy --dry-run

# List all deployments
forge list
forge list --status running --framework react
```

### Monitoring & Debugging
```bash
# View container logs
forge logs my-app
forge logs my-app --follow --level error

# Monitor resource usage
forge stats my-app
forge stats my-app --watch

# System diagnostics
forge --doctor
```

### Project Management
```bash
# Delete deployment
forge delete my-app

# View deployment details
forge list my-app
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in your project or configure globally:

```env
# API Configuration
FORGEKIT_DEPLOY_URL=https://api.forgekit.ai/deploy_cli
FORGEKIT_API_BASE_URL=https://api.forgekit.ai
FORGEKIT_LOGIN_URL=https://forgekit.ai/login

# Authentication
FORGEKIT_TOKEN=your-token-here
FORGEKIT_CALLBACK_PORT=3456
FORGEKIT_CALLBACK_HOST=localhost
FORGEKIT_LOGIN_TIMEOUT=120000

# Development
DEBUG=1  # Enable verbose logging
```

### Project Configuration

Each project includes a `forgekit.json` file with deployment metadata:

```json
{
  "version": "2.0",
  "project": {
    "name": "my-awesome-app",
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
  },
  "optimization": {
    "minify": true,
    "treeshake": true,
    "compressionEnabled": true
  }
}
```

---

## 🏛️ Project Architecture

### Generated Project Structure
```
my-project/
├── frontend/              # React/Vue/Angular app
│   ├── src/
│   │   ├── components/    # UI components
│   │   │   └── ui/       # shadcn/ui components (if selected)
│   │   ├── lib/          # Utility functions
│   │   └── App.tsx       # Main application
│   ├── package.json
│   ├── tailwind.config.js # Tailwind configuration
│   ├── components.json   # shadcn/ui config (if selected)
│   └── vite.config.ts    # Build configuration
├── backend/              # Express/NestJS/etc API
│   ├── src/
│   ├── package.json
│   └── Dockerfile        # Production deployment
├── forgekit.json        # Deployment configuration
├── docker-compose.yml   # Local development
└── README.md            # Project documentation
```

### Build Process

1. **Framework Detection**: Identifies frontend/backend frameworks and configurations
2. **Dependency Installation**: Uses detected package manager (npm/yarn/pnpm/bun)
3. **UI Framework Setup**: Configures chosen UI library with optimal settings
4. **Production Optimization**: Minification, tree-shaking, code splitting
5. **Docker Configuration**: Multi-stage builds for efficient deployments
6. **Security Scanning**: Validates dependencies and configurations

---

## 🛡️ Security Features

### Token Management
- **AES-256-GCM Encryption**: Military-grade token storage in `~/.forgekit/config.json`
- **Secure Key Derivation**: PBKDF2 with salt for master key generation
- **Automatic Migration**: Seamless upgrade from legacy plaintext storage
- **Expiry Handling**: Automatic token refresh and cleanup

### Network Security
- **Certificate Validation**: Strict SSL/TLS verification for all API calls
- **Hostname Verification**: ForgeKit domain validation only
- **Response Integrity**: Content validation and XSS prevention
- **Request Timeout**: Configurable limits to prevent hanging requests

### Content Validation
- **Project Structure**: Validates required files and dependencies
- **Build Output**: Verifies successful compilation and bundle creation
- **Deployment Bundle**: Security scanning before upload to hosting
- **Response Format**: API response structure validation

---

## 🧪 Testing

### Run Test Suite
```bash
# Run all tests
npm test

# Test specific functionality
npm run test:stack-implementation
npm run test:deploy-missing-dir

# Update documentation
npm run generate-stack-docs
```

### Manual Testing Flow
```bash
# Test project creation with shadcn/ui
forge --projectName test-shadcn --frontend react-vite --ui shadcn --nonInteractive

# Test the generated project
cd test-shadcn
npm run dev  # Should show working React app with shadcn/ui

# Test deployment
forge deploy --dry-run
forge deploy --verbose

# Test other commands
forge list
forge stats test-shadcn
```

---

## 🐛 Troubleshooting

### Common Issues

**Build Failures:**
```bash
# Check build environment
forge --doctor

# Verbose deployment to see detailed logs
forge deploy --verbose

# Skip build step for testing
forge deploy --skip-build
```

**shadcn/ui Issues:**
```bash
# If shadcn/ui components aren't found
cd frontend
npx shadcn-ui@latest add button card

# Check Tailwind configuration
npm run build  # Should compile without errors
```

**Authentication Problems:**
```bash
# Check login status
forge whoami

# Re-authenticate
forge logout && forge login

# Manual token configuration
export FORGEKIT_TOKEN=your-token
```

**Network Issues:**
```bash
# Check API connectivity
curl -f https://api.forgekit.ai/health

# Use local development endpoints
export FORGEKIT_DEPLOY_URL=http://localhost:3001/deploy_cli
```

### Debug Mode
```bash
# Enable verbose logging
export DEBUG=1
forge deploy

# Create debug configuration
cp .env.example .env
# Edit .env with DEBUG=1
forge deploy --verbose
```

---

## 🔄 Development

### Setting Up for Development
```bash
# Clone repository
git clone https://github.com/your-org/forgekit-mono.git
cd forgekit-mono/forgekit

# Install dependencies
npm install

# Link for local development
npm link

# Run tests
npm test

# Generate updated documentation
npm run generate-stack-docs
```

### Adding New Stacks

1. **Create stack file**: `src/stacks/frontend/my-framework.js`
2. **Update registries**: Add to `src/registries/frontend.js`
3. **Update options**: Add to `src/registries/modularOptions.js`
4. **Add UI support**: Update compatibility in `modularOptions.js`
5. **Add tests**: Create test in `test/` directory
6. **Update docs**: Run `npm run generate-stack-docs`

### Contributing Guidelines
- Fork the repository and create a feature branch
- Write comprehensive tests for new functionality
- Follow existing code style and TypeScript patterns
- Update documentation and examples
- Submit a pull request with clear description

---

## 📚 Advanced Usage

### Non-Interactive Mode
```bash
# Perfect for CI/CD and automation
forge --projectName my-app \
      --frontend react-vite \
      --ui shadcn \
      --backend nestjs \
      --database postgresql \
      --nonInteractive

# Skip unnecessary prompts
forge deploy --nonInteractive --skip-confirmation
```

### Custom Build Configuration
```bash
# Use specific package manager
forge deploy --package-manager yarn

# Skip specific steps for faster iteration
forge deploy --skip-build --skip-validation

# Environment-specific deployment
forge deploy --env staging
```

### Multiple Environments
```bash
# Deploy to different environments
forge deploy --env development
forge deploy --env staging --domain staging.myapp.com
forge deploy --env production --domain myapp.com
```

---

## 🌐 ForgeKit Ecosystem

### Platform Integration
- **CLI Tool**: Project scaffolding and deployment (this package)
- **Web Dashboard**: [forgekit.ai](https://forgekit.ai) - Visual project management
- **Deploy API**: [api.forgekit.ai](https://api.forgekit.ai) - Containerized hosting infrastructure

### Complete Workflow
1. **Create**: `forge` → Scaffolds production-ready project with your chosen stack
2. **Develop**: Use generated project structure with hot reload and modern tooling
3. **Deploy**: `forge deploy` → Builds and deploys to ForgeKit's global infrastructure
4. **Manage**: Web dashboard or CLI commands for monitoring and management
5. **Scale**: Automatic SSL, custom domains, CDN, and resource monitoring

### Pricing & Plans
- **Free Tier**: 1 deployment, 512MB RAM, 7-day lifecycle
- **Builder Tier**: $5/month, 3 deployments, custom domains, secrets management
- **Pro Tier**: $15/month, 5 deployments, full logs, priority support

---

## 📊 What's New

### Latest Updates (January 2025)
- ✅ **shadcn/ui Support**: Complete integration for React and Next.js projects
- ✅ **Angular Framework**: Full Angular CLI integration with Material Design
- ✅ **NestJS Backend**: TypeScript backend with Swagger documentation
- ✅ **Enhanced Security**: AES-256-GCM token encryption and certificate validation
- ✅ **Production Optimization**: Advanced build configurations for all frameworks
- ✅ **CLI Commands**: Full deployment management with `list`, `logs`, `stats`, `delete`

### Coming Soon
- 🔄 **Svelte 5**: Updated SvelteKit integration with Svelte 5 features
- 🔄 **Vue 3 Composition**: Enhanced Vue.js scaffolding with Composition API
- 🔄 **Docker Compose**: Multi-service development environment
- 🔄 **Environment Variables**: UI for managing secrets and configuration

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with ❤️ for the indie developer community
- Powered by modern open-source frameworks and tools
- Special thanks to the shadcn/ui, React, Next.js, and Tailwind CSS communities
- Thanks to all contributors and early adopters

---

## 📞 Support

- **Documentation**: [forgekit.ai/docs](https://forgekit.ai/docs)
- **Issues**: [GitHub Issues](https://github.com/your-org/forgekit-mono/issues)
- **Email**: support@forgekit.ai
- **Community**: [Discord](https://discord.gg/forgekit)

---

**ForgeKit CLI** - From idea to production in minutes.

*Get started today:* `npm install -g @forgekit/cli && forge`