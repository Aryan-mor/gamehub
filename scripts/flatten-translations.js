#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Translation Flattener
 * Converts nested translation objects to flat structure
 * 
 * Usage: node scripts/flatten-translations.js
 * 
 * Features:
 * - Converts nested objects to flat key-value pairs
 * - Uses dot notation for nested keys (e.g., "bot.poker.room.create")
 * - Preserves existing flat translations
 * - Creates backups before making changes
 * - Handles multiple locale directories
 */

function flattenObject(obj, prefix = '') {
  const flattened = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Recursively flatten nested objects
      Object.assign(flattened, flattenObject(value, newKey));
    } else {
      // Add flat key-value pair
      flattened[newKey] = value;
    }
  }
  
  return flattened;
}

function hasNestedObjects(obj) {
  for (const value of Object.values(obj)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return true;
    }
  }
  return false;
}

function processTranslationFile(filePath) {
  try {
    console.log(`\n📁 Processing: ${filePath}`);
    
    // Read the file
    const content = fs.readFileSync(filePath, 'utf8');
    const translations = JSON.parse(content);
    
    // Check if file has nested objects
    if (!hasNestedObjects(translations)) {
      console.log(`  ✅ File is already flat`);
      return { flattenedCount: 0, originalCount: 0, cleanedCount: 0 };
    }
    
    console.log(`  🔍 Found nested objects, flattening...`);
    
    // Flatten the object
    const flattenedTranslations = flattenObject(translations);
    
    // Count changes
    const originalCount = Object.keys(translations).length;
    const flattenedCount = Object.keys(flattenedTranslations).length;
    
    // Show what was flattened
    console.log(`  📊 Original keys: ${originalCount} → Flattened keys: ${flattenedCount}`);
    
    // Find nested keys that were flattened
    const nestedKeys = [];
    for (const [key, value] of Object.entries(translations)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        nestedKeys.push(key);
      }
    }
    
    if (nestedKeys.length > 0) {
      console.log(`  🔄 Flattened nested keys:`);
      nestedKeys.forEach(key => {
        console.log(`    - "${key}" → "${key}.*"`);
      });
    }
    
    // Create backup
    const backupPath = filePath.replace('.json', '_backup_before_flatten.json');
    fs.writeFileSync(backupPath, content);
    console.log(`  💾 Backup created: ${backupPath}`);
    
    // Write flattened file
    const formattedContent = JSON.stringify(flattenedTranslations, null, 2);
    fs.writeFileSync(filePath, formattedContent);
    console.log(`  ✅ Successfully flattened translation file`);
    
    return { flattenedCount, originalCount, cleanedCount: flattenedCount };
    
  } catch (error) {
    console.error(`  ❌ Error processing ${filePath}:`, error.message);
    return { flattenedCount: 0, originalCount: 0, cleanedCount: 0, error: true };
  }
}

function findTranslationFiles(localesDir) {
  const translationFiles = [];
  
  if (!fs.existsSync(localesDir)) {
    console.error(`❌ Locales directory not found: ${localesDir}`);
    return translationFiles;
  }
  
  const localeDirs = fs.readdirSync(localesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  for (const localeDir of localeDirs) {
    const translationPath = path.join(localesDir, localeDir, 'translation.json');
    
    if (fs.existsSync(translationPath)) {
      translationFiles.push(translationPath);
    }
  }
  
  return translationFiles;
}

function main() {
  console.log('🔄 Translation Flattener');
  console.log('========================');
  console.log('This script will convert nested translation objects to flat structure');
  console.log('using dot notation for nested keys (e.g., "bot.poker.room.create")\n');
  
  const localesDir = path.join(process.cwd(), 'locales');
  const translationFiles = findTranslationFiles(localesDir);
  
  if (translationFiles.length === 0) {
    console.log('❌ No translation.json files found');
    return;
  }
  
  console.log(`📂 Found ${translationFiles.length} translation file(s):`);
  translationFiles.forEach(file => {
    console.log(`  - ${file}`);
  });
  
  let totalFlattened = 0;
  let totalOriginal = 0;
  let totalCleaned = 0;
  let errorCount = 0;
  
  for (const file of translationFiles) {
    const result = processTranslationFile(file);
    
    if (result.error) {
      errorCount++;
    } else {
      totalFlattened += result.flattenedCount;
      totalOriginal += result.originalCount;
      totalCleaned += result.cleanedCount;
    }
  }
  
  console.log('\n📊 Summary:');
  console.log('===========');
  console.log(`📁 Files processed: ${translationFiles.length}`);
  console.log(`❌ Files with errors: ${errorCount}`);
  console.log(`🔄 Total keys flattened: ${totalFlattened}`);
  console.log(`📊 Total original keys: ${totalOriginal}`);
  console.log(`📊 Total cleaned keys: ${totalCleaned}`);
  
  if (totalFlattened > 0) {
    console.log('\n✅ Flattening completed successfully!');
    console.log('💾 Backups created for modified files');
    console.log('📝 Nested keys are now using dot notation');
  } else {
    console.log('\n✅ All files are already flat');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { 
  flattenObject, 
  hasNestedObjects, 
  processTranslationFile, 
  findTranslationFiles 
};
