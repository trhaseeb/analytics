#!/usr/bin/env node
// Component Standards Validation Script
// Run with: npm run validate-components

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Forbidden patterns
const FORBIDDEN_PATTERNS = {
  'Save buttons': [
    // Save buttons - specifically looking for actual save buttons
    /<button[^>]*>.*save.*<\/button>/i,
    /<button[^>]*onClick.*save.*>/i,
    // Submit buttons with save intent
    /<button[^>]*type=["']submit["'][^>]*>.*save/i,
    /<input[^>]*type=["']submit["'][^>]*value.*save/i,
    // Save handlers (but not auto-save functions)
    /onClick.*save|onSave(?!Project\(\))|handleSave(?!Project)/i,
    // Common save button text patterns
    /<.*>.*save\s+(project|changes|data|settings).*<\/.*>/i,
    /<.*>.*save\s*&\s*(close|exit).*<\/.*>/i
  ]
};
// Required patterns
const REQUIRED_PATTERNS = {
  'StorageManager usage': [
    /storageManager\./,
    /storageManager\.save/,
    /storageManager\.load/
  ],
  
  'Event dispatching': [
    /window\.dispatchEvent/,
    /new CustomEvent/,
    /componentUpdated|layersUpdated|basemapsUpdated/
  ],
  
  'Error handling': [
    /try\s*{[\s\S]*catch/,
    /\.catch\(/,
    /error.*state/i
  ]
};

function validateFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const results = {
    file: path.basename(filePath),
    errors: [],
    warnings: [],
    passed: []
  };

  console.log(`\n🔍 Validating: ${results.file}`);

  // Check forbidden patterns
  Object.entries(FORBIDDEN_PATTERNS).forEach(([name, patterns]) => {
    const found = patterns.some(pattern => pattern.test(content));
    if (found) {
      results.errors.push(`❌ FORBIDDEN: ${name} detected`);
      console.error(`  ❌ FORBIDDEN: ${name}`);
    } else {
      results.passed.push(`✅ No ${name.toLowerCase()}`);
      console.log(`  ✅ No ${name.toLowerCase()}`);
    }
  });

  // Check required patterns
  Object.entries(REQUIRED_PATTERNS).forEach(([name, patterns]) => {
    const found = patterns.some(pattern => pattern.test(content));
    if (!found) {
      results.warnings.push(`⚠️  MISSING: ${name}`);
      console.warn(`  ⚠️  MISSING: ${name}`);
    } else {
      results.passed.push(`✅ Has ${name.toLowerCase()}`);
      console.log(`  ✅ Has ${name.toLowerCase()}`);
    }
  });

  return results;
}

function main() {
  console.log('🛡️  COMPONENT STANDARDS VALIDATION');
  console.log('=====================================');

  const componentsDir = path.join(__dirname, '..', 'src', 'components', 'domain');
  
  console.log('Looking for components in:', componentsDir);
  
  if (!fs.existsSync(componentsDir)) {
    console.error('❌ Components directory not found:', componentsDir);
    process.exit(1);
  }

  const allFiles = fs.readdirSync(componentsDir);
  console.log('All files found:', allFiles);

  const componentFiles = allFiles
    .filter(file => file.endsWith('.tsx') && !file.includes('_legacy') && !file.includes('_fixed'))
    .map(file => path.join(componentsDir, file));

  console.log('Component files to validate:', componentFiles.map(f => path.basename(f)));

  if (componentFiles.length === 0) {
    console.log('No component files found to validate');
    return;
  }

  const allResults = componentFiles.map(validateFile);
  
  // Summary
  console.log('\n📊 VALIDATION SUMMARY');
  console.log('=====================');
  
  const totalFiles = allResults.length;
  const filesWithErrors = allResults.filter(r => r.errors.length > 0).length;
  const filesWithWarnings = allResults.filter(r => r.warnings.length > 0).length;
  
  console.log(`Total files validated: ${totalFiles}`);
  console.log(`Files with errors: ${filesWithErrors}`);
  console.log(`Files with warnings: ${filesWithWarnings}`);
  
  if (filesWithErrors > 0) {
    console.log('\n❌ COMPONENTS WITH ERRORS:');
    allResults
      .filter(r => r.errors.length > 0)
      .forEach(r => {
        console.log(`\n  ${r.file}:`);
        r.errors.forEach(error => console.log(`    ${error}`));
      });
  }
  
  if (filesWithWarnings > 0) {
    console.log('\n⚠️  COMPONENTS WITH WARNINGS:');
    allResults
      .filter(r => r.warnings.length > 0)
      .forEach(r => {
        console.log(`\n  ${r.file}:`);
        r.warnings.forEach(warning => console.log(`    ${warning}`));
      });
  }
  
  if (filesWithErrors === 0) {
    console.log('\n🎉 ALL COMPONENTS PASS VALIDATION!');
  } else {
    console.log('\n🚫 SOME COMPONENTS FAILED VALIDATION');
    process.exit(1);
  }
}

// Call main function
main();
