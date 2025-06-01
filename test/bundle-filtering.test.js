import fs from 'fs';
import path from 'path';
import { createFilteredBundle, estimateBundleSize } from '../src/bundleUtils.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const tar = require('tar');

// Test that node_modules and other unwanted files are excluded from deployment bundles
console.log('🧪 Testing bundle filtering...');

const testProjectDir = path.join(process.cwd(), 'test-project-temp');
const bundlePath = path.join(testProjectDir, 'test-bundle.tar.gz');

// Setup test project structure
function setupTestProject() {
  // Clean up previous test
  if (fs.existsSync(testProjectDir)) {
    fs.rmSync(testProjectDir, { recursive: true, force: true });
  }
  
  fs.mkdirSync(testProjectDir, { recursive: true });
  
  // Create test files
  fs.mkdirSync(path.join(testProjectDir, 'dist'));
  fs.writeFileSync(path.join(testProjectDir, 'dist', 'index.html'), '<html>Test</html>');
  fs.writeFileSync(path.join(testProjectDir, 'Dockerfile'), 'FROM nginx\nCOPY dist /usr/share/nginx/html');
  fs.writeFileSync(path.join(testProjectDir, 'package.json'), '{"name": "test"}');
  
  // Create node_modules (should be excluded)
  fs.mkdirSync(path.join(testProjectDir, 'node_modules', 'some-package'), { recursive: true });
  fs.writeFileSync(path.join(testProjectDir, 'node_modules', 'some-package', 'index.js'), 'module.exports = {}');
  
  // Create .git directory (should be excluded)
  fs.mkdirSync(path.join(testProjectDir, '.git'));
  fs.writeFileSync(path.join(testProjectDir, '.git', 'config'), '[core]');
  
  // Create test files that should be excluded
  fs.writeFileSync(path.join(testProjectDir, 'README.md'), '# Test Project');
  fs.writeFileSync(path.join(testProjectDir, '.env'), 'SECRET=test');
  fs.writeFileSync(path.join(testProjectDir, 'test.log'), 'log content');
  
  console.log(`✅ Created test project at ${testProjectDir}`);
}

function cleanupTestProject() {
  if (fs.existsSync(testProjectDir)) {
    fs.rmSync(testProjectDir, { recursive: true, force: true });
    console.log('✅ Cleaned up test project');
  }
}

async function testBundleFiltering() {
  try {
    setupTestProject();
    
    // Test bundle creation
    const filesToBundle = ['dist', 'Dockerfile', 'package.json', 'node_modules', '.git', 'README.md', '.env', 'test.log'];
    
    console.log('📦 Creating filtered bundle...');
    await createFilteredBundle(tar, bundlePath, filesToBundle, testProjectDir, true);
    
    if (!fs.existsSync(bundlePath)) {
      throw new Error('Bundle was not created');
    }
    
    // Extract and verify contents
    const extractDir = path.join(testProjectDir, 'extracted');
    fs.mkdirSync(extractDir);
    
    await tar.x({
      file: bundlePath,
      cwd: extractDir
    });
    
    console.log('🔍 Verifying bundle contents...');
    
    // Check what was included
    const extractedFiles = fs.readdirSync(extractDir);
    console.log(`Extracted files: ${extractedFiles.join(', ')}`);
    
    // Should include
    const expectedFiles = ['dist', 'Dockerfile', 'package.json'];
    for (const file of expectedFiles) {
      if (!extractedFiles.includes(file)) {
        throw new Error(`Expected file missing: ${file}`);
      }
    }
    
    // Should exclude
    const excludedFiles = ['node_modules', '.git', 'README.md', '.env', 'test.log'];
    for (const file of excludedFiles) {
      if (extractedFiles.includes(file)) {
        throw new Error(`Excluded file found in bundle: ${file}`);
      }
    }
    
    // Check bundle size
    const bundleStats = fs.statSync(bundlePath);
    const bundleSizeKB = (bundleStats.size / 1024).toFixed(2);
    console.log(`📊 Bundle size: ${bundleSizeKB} KB`);
    
    if (bundleStats.size > 50 * 1024) { // Should be very small without node_modules
      console.warn(`⚠️ Bundle larger than expected: ${bundleSizeKB} KB`);
    }
    
    console.log('✅ Bundle filtering test passed!');
    console.log('✅ node_modules and other unwanted files are correctly excluded');
    
  } catch (error) {
    console.error('❌ Bundle filtering test failed:', error.message);
    process.exit(1);
  } finally {
    cleanupTestProject();
  }
}

testBundleFiltering();