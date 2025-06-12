import fs from 'fs';
import path from 'path';
import { minimatch } from 'minimatch';

/**
 * Default exclusion patterns for deployment bundles
 * These are always excluded regardless of .dockerignore
 */
const DEFAULT_EXCLUSIONS = [
  'node_modules',
  'node_modules/**',
  '**/node_modules',
  '**/node_modules/**',
  '.git',
  '.git/**',
  '.gitignore',
  '.gitattributes',
  '**/.DS_Store',
  'Thumbs.db',
  '*.log',
  'npm-debug.log*',
  'yarn-debug.log*',
  'yarn-error.log*',
  'pnpm-debug.log*',
  '.npm',
  '.yarn',
  '.pnpm',
  '.env',
  '.env.local',
  '.env.development.local',
  '.env.test.local',
  '.env.production.local',
  '**/*.tmp',
  '**/*.temp',
  '**/coverage',
  '**/.nyc_output',
  '**/.coverage',
  '**/test',
  '**/tests',
  '**/__tests__',
  '**/*.test.js',
  '**/*.test.ts',
  '**/*.spec.js',
  '**/*.spec.ts',
  '**/.eslintrc*',
  '**/.prettierrc*',
  '**/jest.config.*',
  '**/webpack.config.*',
  '**/vite.config.*',
  '**/rollup.config.*',
  '**/.babelrc*',
  'README.md',
  'CHANGELOG.md',
  'LICENSE',
  'LICENSE.txt',
  '**/*.md',
  '.vscode',
  '.idea',
  '*.iml',
  '.editorconfig'
];

/**
 * Get framework-specific inclusions that override default exclusions
 */
function getFrameworkInclusions(projectRoot) {
  const inclusions = [];
  
  // Check if this is a Next.js project with a Dockerfile
  try {
    const forgekitPath = path.join(projectRoot, 'forgekit.json');
    if (fs.existsSync(forgekitPath)) {
      const config = JSON.parse(fs.readFileSync(forgekitPath, 'utf-8'));
      const isNextjs = config.stack?.frontend === 'nextjs';
      const hasDockerfile = fs.existsSync(path.join(projectRoot, 'Dockerfile'));
      
      if (isNextjs && hasDockerfile) {
        // Include Next.js config files that are normally excluded
        inclusions.push('tsconfig.json', 'next.config.*', 'tailwind.config.*', 'postcss.config.*', 'next-env.d.ts');
      }
    }
  } catch (error) {
    // Ignore errors, just don't add inclusions
  }
  
  return inclusions;
}

/**
 * Read and parse .dockerignore file
 */
function readDockerignore(projectRoot) {
  const dockerignorePath = path.join(projectRoot, '.dockerignore');
  if (!fs.existsSync(dockerignorePath)) {
    return [];
  }
  
  try {
    const content = fs.readFileSync(dockerignorePath, 'utf-8');
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#')); // Remove empty lines and comments
  } catch (error) {
    console.warn(`Warning: Could not read .dockerignore: ${error.message}`);
    return [];
  }
}

/**
 * Check if a file should be excluded based on patterns
 */
function shouldExclude(filePath, patterns, inclusions = []) {
  // Normalize path for consistent matching
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  // Check if this file is explicitly included (overrides exclusions)
  const isIncluded = inclusions.some(inclusion => {
    return minimatch(normalizedPath, inclusion, {
      dot: true,
      matchBase: true
    });
  });
  
  if (isIncluded) {
    return false; // Don't exclude if explicitly included
  }
  
  return patterns.some(pattern => {
    // Handle negation patterns (starting with !)
    if (pattern.startsWith('!')) {
      return false; // Don't exclude if it matches a negation pattern
    }
    
    // Use minimatch for glob pattern matching
    return minimatch(normalizedPath, pattern, { 
      dot: true,  // Match dotfiles
      matchBase: true // Match basename
    });
  });
}

/**
 * Get all files recursively, respecting exclusion patterns
 */
function getFilesToBundle(directories, projectRoot, verbose = false) {
  const dockerignorePatterns = readDockerignore(projectRoot);
  const frameworkInclusions = getFrameworkInclusions(projectRoot);
  const allPatterns = [...DEFAULT_EXCLUSIONS, ...dockerignorePatterns];
  
  if (verbose) {
    console.log(`📋 Exclusion patterns: ${allPatterns.length} patterns`);
    if (dockerignorePatterns.length > 0) {
      console.log(`   • From .dockerignore: ${dockerignorePatterns.length} patterns`);
    }
    console.log(`   • Default exclusions: ${DEFAULT_EXCLUSIONS.length} patterns`);
    if (frameworkInclusions.length > 0) {
      console.log(`   • Framework inclusions: ${frameworkInclusions.length} patterns`);
    }
  }
  
  const filesToBundle = [];
  
  for (const dir of directories) {
    const fullPath = path.resolve(projectRoot, dir);
    
    if (!fs.existsSync(fullPath)) {
      if (verbose) {
        console.log(`⚠️ Skipping non-existent path: ${dir}`);
      }
      continue;
    }
    
    const stat = fs.statSync(fullPath);
    
    if (stat.isFile()) {
      // Single file - check if it should be excluded
      const relativePath = path.relative(projectRoot, fullPath);
      if (!shouldExclude(relativePath, allPatterns, frameworkInclusions)) {
        filesToBundle.push(dir);
        if (verbose) {
          console.log(`✅ Including file: ${dir}`);
        }
      } else if (verbose) {
        console.log(`❌ Excluding file: ${dir}`);
      }
    } else if (stat.isDirectory()) {
      // Directory - check if the directory itself should be excluded
      const relativePath = path.relative(projectRoot, fullPath);
      if (shouldExclude(relativePath, allPatterns, frameworkInclusions)) {
        if (verbose) {
          console.log(`❌ Excluding directory: ${dir}`);
        }
        continue;
      }
      
      // Directory is included, add it to the bundle
      filesToBundle.push(dir);
      if (verbose) {
        console.log(`✅ Including directory: ${dir}`);
      }
    }
  }
  
  return filesToBundle;
}

/**
 * Create a filtered bundle excluding node_modules and other unwanted files
 */
export function createFilteredBundle(tar, bundlePath, directories, projectRoot, verbose = false) {
  const filesToBundle = getFilesToBundle(directories, projectRoot, verbose);
  const frameworkInclusions = getFrameworkInclusions(projectRoot);
  
  if (verbose) {
    console.log(`📦 Final bundle contents: ${filesToBundle.join(', ')}`);
  }
  
  if (filesToBundle.length === 0) {
    throw new Error('No files to bundle after applying exclusion filters');
  }
  
  return tar.c({ 
    gzip: true, 
    file: bundlePath,
    filter: (path, stat) => {
      // Additional runtime filtering for individual files within included directories
      const relativePath = path.replace(/^\.\//, ''); // Remove leading ./
      const shouldInclude = !shouldExclude(relativePath, [...DEFAULT_EXCLUSIONS, ...readDockerignore(projectRoot)], frameworkInclusions);
      
      if (!shouldInclude && verbose) {
        console.log(`  ❌ Filtering out: ${relativePath}`);
      }
      
      return shouldInclude;
    }
  }, filesToBundle);
}

/**
 * Estimate bundle size without node_modules for user feedback
 */
export function estimateBundleSize(directories, projectRoot) {
  const filesToBundle = getFilesToBundle(directories, projectRoot, false);
  let totalSize = 0;
  let fileCount = 0;
  
  for (const dir of filesToBundle) {
    const fullPath = path.resolve(projectRoot, dir);
    
    if (fs.existsSync(fullPath)) {
      const stat = fs.statSync(fullPath);
      if (stat.isFile()) {
        totalSize += stat.size;
        fileCount++;
      } else if (stat.isDirectory()) {
        // Recursively calculate directory size (simplified)
        const dirSize = calculateDirectorySize(fullPath);
        totalSize += dirSize.size;
        fileCount += dirSize.files;
      }
    }
  }
  
  return { size: totalSize, files: fileCount };
}

function calculateDirectorySize(dirPath) {
  let totalSize = 0;
  let fileCount = 0;
  
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isFile()) {
        totalSize += stat.size;
        fileCount++;
      } else if (stat.isDirectory()) {
        const subDir = calculateDirectorySize(itemPath);
        totalSize += subDir.size;
        fileCount += subDir.files;
      }
    }
  } catch (error) {
    // Skip directories we can't read
  }
  
  return { size: totalSize, files: fileCount };
}