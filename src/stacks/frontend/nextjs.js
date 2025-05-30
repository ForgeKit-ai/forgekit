import path from 'path';
import fs from 'fs';
import shell from 'shelljs';
import { spawnSync } from 'child_process';
import { createProjectStructure, setupSupabase, setupUIFramework } from '../../utils.js';

export async function setupNextJS(config) {
  const { targetDir, projectName, ui, stackLabel } = config;

  console.log("\n🚀 Setting up Next.js + Supabase...");
  console.log("\n▶️ Creating project with create-next-app...");
  let cnaFlags = `--ts --eslint --app --src-dir --import-alias "@/*" --use-npm --no-turbo`;
  if (ui === 'Tailwind') {
      cnaFlags += ' --tailwind';
  } else {
      cnaFlags += ' --no-tailwind';
  }

  const parentDir = path.dirname(targetDir);
  fs.mkdirSync(parentDir, { recursive: true });

  const createCommand = `npx create-next-app@latest "${projectName}" ${cnaFlags}`;
  const result = spawnSync(createCommand, { cwd: parentDir, stdio: 'inherit', shell: true });
  if (result.status !== 0) {
    const errMsg = result.error ? result.error.message : `exit code ${result.status}`;
    throw new Error(`Failed to create Next.js project '${projectName}': ${errMsg}`);
  }

  console.log("\n📝 Adding DevForge structure files...");
  createProjectStructure(targetDir, projectName, stackLabel, ui, config.database, config.gitInit);

  // Configure Next.js for production deployment
  console.log("\n⚙️ Configuring Next.js for production...");
  const nextConfigPath = path.join(targetDir, 'next.config.ts');
  if (fs.existsSync(nextConfigPath)) {
    const productionConfig = `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  experimental: {
    optimizePackageImports: ['lucide-react']
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true
};

export default nextConfig;`;
    fs.writeFileSync(nextConfigPath, productionConfig);
    console.log('↳ Configured Next.js for standalone deployment');
  }

  if (config.database === 'supabase') {
    await setupSupabase(targetDir, 'NEXT_PUBLIC');
  }
  if (ui !== 'Tailwind') {
     await setupUIFramework(targetDir, ui, 'nextjs');
  }

  const pageTsxPath = path.join(targetDir, 'src', 'app', 'page.tsx');
  if (fs.existsSync(pageTsxPath)) {
      try {
          let pageContent = fs.readFileSync(pageTsxPath, 'utf-8');
          if (ui === 'Chakra') {
            pageContent = `import { Box, Heading, Text } from '@chakra-ui/react';\n\nexport default function Home() {\n  return (\n    <Box p={4}>\n      <Heading mb={4}>${projectName} (Next.js + Chakra)</Heading>\n      <Text>Welcome! Your Next.js project is running.</Text>\n    </Box>\n  );\n}`;
            console.warn('⚠️ Remember to wrap src/app/layout.tsx with <ChakraProvider> for Chakra.');
            fs.writeFileSync(pageTsxPath, pageContent);
            console.log(`↳ Updated src/app/page.tsx for Chakra example.`);
          } else if (ui === 'shadcn') {
            pageContent = `'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const [count, setCount] = useState(0);
  
  return (
    <main className="container mx-auto p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">${projectName}</CardTitle>
          <CardDescription>Next.js + shadcn/ui</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Edit <code className="bg-muted px-2 py-1 rounded">src/app/page.tsx</code> and save to test HMR
          </p>
          <Button onClick={() => setCount(count + 1)} variant="default">
            Count: {count}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}`;
            fs.writeFileSync(pageTsxPath, pageContent);
            console.log(`↳ Updated src/app/page.tsx for shadcn/ui example.`);
          } else if (pageContent.includes('<main')) {
              pageContent = pageContent.replace(
                /(<main.*?>)/,
                `$1\n      <h1 className="text-2xl font-bold mb-4">${projectName}</h1>\n      <p>Welcome! Your Next.js project is running.</p>\n`
              );
              fs.writeFileSync(pageTsxPath, pageContent);
              console.log(`↳ Updated src/app/page.tsx with initial content.`);
          }
      } catch (err) {
          console.warn(`⚠️ Could not modify ${pageTsxPath}: ${err.message}`);
      }
  }

}
