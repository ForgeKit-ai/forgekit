import path from 'path';
import fs from 'fs';
import shell from 'shelljs';
import { createProjectStructure, setupSupabase, setupUIFramework } from '../../utils.js';

export async function setupNextJS(config) {
  const { targetDir, projectName, ui, stackLabel } = config;

  console.log("\n🚀 Setting up Next.js + Supabase...");
  console.log("\n▶️ Creating project with create-next-app...");
  let cnaFlags = `--ts --eslint --app --src-dir --import-alias "@/*" --use-npm`;
  if (ui === 'Tailwind') {
      cnaFlags += ' --tailwind';
  } else {
      cnaFlags += ' --no-tailwind';
  }

  const parentDir = path.dirname(targetDir);
  fs.mkdirSync(parentDir, { recursive: true });

  const createCommand = `npx create-next-app@latest "${projectName}" ${cnaFlags}`;
  let result = shell.exec(createCommand, { cwd: parentDir });
  if (result.code !== 0) throw new Error(`Failed to create Next.js project '${projectName}': ${result.stderr || result.stdout}`);

  console.log("\n📝 Adding DevForge structure files...");
  createProjectStructure(targetDir, projectName, stackLabel, ui, config.database, config.gitInit);

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
