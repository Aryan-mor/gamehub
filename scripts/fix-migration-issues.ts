#!/usr/bin/env tsx

/**
 * Fix issues created by the i18n migration script
 */

import fs from 'fs';
import path from 'path';

// Find and fix common migration issues
const fixes = [
  // Fix incorrect quote wrapping
  {
    pattern: /text: 'ctx\.t\('([^']+)'\)',/g,
    replacement: "text: ctx.t('$1'),"
  },
  // Fix button text with quotes
  {
    pattern: /text: 'ctx\.t\("([^"]+)"\)',/g,
    replacement: "text: ctx.t('$1'),"
  },
  // Fix concatenated strings
  {
    pattern: /message \+= `ctx\.t\('([^']+)'\)/g,
    replacement: "message += ctx.t('$1')"
  },
  // Fix callback_data issues
  {
    pattern: /callback_data: 'ctx\.t\('([^']+)'\)',/g,
    replacement: "callback_data: '$1',"
  }
];

function fixFile(filePath: string): void {
  console.log(`\n🔧 Fixing: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let changes = 0;
  
  for (const fix of fixes) {
    const matches = content.match(fix.pattern);
    if (matches) {
      content = content.replace(fix.pattern, fix.replacement);
      changes += matches.length;
      console.log(`  ✅ Applied fix: ${matches.length} replacements`);
    }
  }
  
  if (changes > 0) {
    fs.writeFileSync(filePath, content);
    console.log(`  🎉 ${changes} fixes applied to ${filePath}`);
  } else {
    console.log(`  ℹ️  No fixes needed in ${filePath}`);
  }
}

function findPokerFiles(): string[] {
  const pokerDir = path.join(process.cwd(), 'src/actions/games/poker');
  const files: string[] = [];
  
  function scanDirectory(dir: string): void {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (item.endsWith('.ts') && !item.endsWith('.d.ts')) {
        files.push(fullPath);
      }
    }
  }
  
  scanDirectory(pokerDir);
  return files;
}

function main(): void {
  console.log('🔧 Starting migration fixes...\n');
  
  const files = findPokerFiles();
  console.log(`📁 Found ${files.length} TypeScript files to check`);
  
  for (const file of files) {
    try {
      fixFile(file);
    } catch (error) {
      console.error(`❌ Error fixing ${file}:`, error);
    }
  }
  
  console.log('\n✅ Migration fixes completed!');
}

if (require.main === module) {
  main();
}
