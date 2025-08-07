#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';

/**
 * Clean up extra i18n files created by i18next-parser
 */
function cleanupI18nFiles(): void {
  try {
    console.log('🧹 Cleaning up extra i18n files...\n');
    
    const localesDir = path.join(process.cwd(), 'locales');
    
    if (!fs.existsSync(localesDir)) {
      console.log('✅ No locales directory found');
      return;
    }
    
    const locales = fs.readdirSync(localesDir);
    let totalRemoved = 0;
    
    for (const locale of locales) {
      const localePath = path.join(localesDir, locale);
      
      if (!fs.statSync(localePath).isDirectory()) {
        continue;
      }
      
      console.log(`📁 Processing ${locale}...`);
      
      const files = fs.readdirSync(localePath);
      let removed = 0;
      
      for (const file of files) {
        // Keep only translation.json and translation_old.json
        if (file !== 'translation.json' && file !== 'translation_old.json') {
          const filePath = path.join(localePath, file);
          try {
            // Check if it's a file or directory
            const stats = fs.statSync(filePath);
            if (stats.isFile()) {
              fs.unlinkSync(filePath);
              console.log(`   🗑️  Removed file: ${file}`);
              removed++;
            } else if (stats.isDirectory()) {
              fs.rmSync(filePath, { recursive: true, force: true });
              console.log(`   🗑️  Removed directory: ${file}`);
              removed++;
            }
          } catch (error) {
            console.log(`   ⚠️  Error removing ${file}: ${error}`);
          }
        }
      }
      
      totalRemoved += removed;
      console.log(`   ✅ ${locale}: ${removed} files removed\n`);
    }
    
    console.log(`🎉 Cleanup completed! Total files removed: ${totalRemoved}`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  cleanupI18nFiles();
}

export { cleanupI18nFiles };
