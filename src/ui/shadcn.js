import path from 'path';
import fs from 'fs';
import shell from 'shelljs';

export async function setupShadcnUI(projectPath, projectName = 'Project') {
  console.log('  Installing shadcn/ui...');

  // First, ensure Tailwind CSS is installed
  console.log('  ↳ Setting up Tailwind CSS foundation...');
  let result = shell.exec('npm install -D tailwindcss postcss autoprefixer @types/node', { cwd: projectPath, silent: true });
  if (result.code !== 0) {
    throw new Error(`Failed to install Tailwind CSS dependencies: ${result.stderr}`);
  }

  // Install shadcn/ui CLI
  console.log('  ↳ Installing shadcn/ui CLI...');
  result = shell.exec('npx shadcn-ui@latest init --yes --defaults', { cwd: projectPath, silent: true });
  if (result.code !== 0) {
    console.warn('  ⚠️ shadcn/ui init failed, setting up manually...');
    
    // Manual setup if CLI fails
    result = shell.exec('npm install class-variance-authority clsx tailwind-merge lucide-react', { cwd: projectPath, silent: true });
    if (result.code !== 0) {
      throw new Error(`Failed to install shadcn/ui dependencies: ${result.stderr}`);
    }
  }

  // Create or update components.json for shadcn/ui configuration
  const componentsConfig = {
    "$schema": "https://ui.shadcn.com/schema.json",
    "style": "default",
    "rsc": false,
    "tsx": true,
    "tailwind": {
      "config": "tailwind.config.js",
      "css": "src/index.css",
      "baseColor": "slate",
      "cssVariables": true
    },
    "aliases": {
      "components": "./src/components",
      "utils": "./src/lib/utils"
    }
  };
  
  const componentsConfigPath = path.join(projectPath, 'components.json');
  fs.writeFileSync(componentsConfigPath, JSON.stringify(componentsConfig, null, 2));
  console.log('  ↳ Created components.json configuration');

  // Create lib/utils.ts for shadcn/ui utilities
  const libDir = path.join(projectPath, 'src', 'lib');
  if (!fs.existsSync(libDir)) {
    fs.mkdirSync(libDir, { recursive: true });
  }
  
  const utilsContent = `import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}`;
  
  fs.writeFileSync(path.join(libDir, 'utils.ts'), utilsContent);
  console.log('  ↳ Created lib/utils.ts');

  // Update or create tailwind.config.js
  const tailwindConfigPath = path.join(projectPath, 'tailwind.config.js');
  const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}`;

  fs.writeFileSync(tailwindConfigPath, tailwindConfig);
  console.log('  ↳ Created tailwind.config.js with shadcn/ui configuration');

  // Install additional dependencies for animations
  result = shell.exec('npm install tailwindcss-animate', { cwd: projectPath, silent: true });
  if (result.code !== 0) {
    console.warn('  ⚠️ Failed to install tailwindcss-animate, animations may not work');
  }

  // Update index.css with shadcn/ui CSS variables
  const indexCssPath = path.join(projectPath, 'src', 'index.css');
  const shadcnStyles = `@tailwind base;
@tailwind components;
@tailwind utilities;
 
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
 
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
 
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
 
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
 
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
 
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
 
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
 
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;

    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
 
    --radius: 0.5rem;
  }
 
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
 
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
 
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
 
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
 
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
 
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
 
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
 
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
 
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}
 
@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}`;

  fs.writeFileSync(indexCssPath, shadcnStyles);
  console.log('  ↳ Updated index.css with shadcn/ui design tokens');

  // Install basic shadcn/ui components
  console.log('  ↳ Installing basic components...');
  const basicComponents = ['button', 'card', 'input', 'label'];
  
  for (const component of basicComponents) {
    result = shell.exec(`npx shadcn-ui@latest add ${component} --yes`, { cwd: projectPath, silent: true });
    if (result.code !== 0) {
      console.warn(`  ⚠️ Failed to install ${component} component automatically`);
    }
  }

  console.log(`  ✅ shadcn/ui configured for ${projectName}`);
}