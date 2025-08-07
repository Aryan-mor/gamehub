#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Removes duplicate keys from translation.json files
 * Keeps the first occurrence of each key and removes subsequent duplicates
 */

function removeDuplicateKeys(obj) {
  const seen = new Set();
  const result = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (!seen.has(key)) {
      seen.add(key);
      result[key] = value;
    } else {
      console.log(`  🗑️  Removing duplicate key: "${key}"`);
    }
  }
  
  return result;
}

function processTranslationFile(filePath) {
  try {
    console.log(`\n📁 Processing: ${filePath}`);
    
    // Read the file
    const content = fs.readFileSync(filePath, 'utf8');
    const translations = JSON.parse(content);
    
    // Count original keys
    const originalCount = Object.keys(translations).length;
    
    // Remove duplicates
    const cleanedTranslations = removeDuplicateKeys(translations);
    
    // Count cleaned keys
    const cleanedCount = Object.keys(cleanedTranslations).length;
    const removedCount = originalCount - cleanedCount;
    
    if (removedCount > 0) {
      // Create backup
      const backupPath = filePath.replace('.json', '_backup_before_cleanup.json');
      fs.writeFileSync(backupPath, content);
      console.log(`  💾 Backup created: ${backupPath}`);
      
      // Write cleaned file
      fs.writeFileSync(filePath, JSON.stringify(cleanedTranslations, null, 2));
      console.log(`  ✅ Removed ${removedCount} duplicate keys`);
      console.log(`  📊 Original: ${originalCount} keys → Cleaned: ${cleanedCount} keys`);
    } else {
      console.log(`  ✅ No duplicate keys found`);
    }
    
    return { removedCount, originalCount, cleanedCount };
    
  } catch (error) {
    console.error(`  ❌ Error processing ${filePath}:`, error.message);
    return { removedCount: 0, originalCount: 0, cleanedCount: 0, error: true };
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
    // Look for translation.json and translation_test.json files
    const translationPath = path.join(localesDir, localeDir, 'translation.json');
    const testTranslationPath = path.join(localesDir, localeDir, 'translation_test.json');
    
    if (fs.existsSync(translationPath)) {
      translationFiles.push(translationPath);
    }
    if (fs.existsSync(testTranslationPath)) {
      translationFiles.push(testTranslationPath);
    }
  }
  
  return translationFiles;
}

function main() {
  console.log('🧹 Translation Duplicate Key Cleaner');
  console.log('====================================');
  
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
  
  let totalRemoved = 0;
  let totalOriginal = 0;
  let totalCleaned = 0;
  let errorCount = 0;
  
  for (const file of translationFiles) {
    const result = processTranslationFile(file);
    
    if (result.error) {
      errorCount++;
    } else {
      totalRemoved += result.removedCount;
      totalOriginal += result.originalCount;
      totalCleaned += result.cleanedCount;
    }
  }
  
  console.log('\n📊 Summary:');
  console.log('===========');
  console.log(`📁 Files processed: ${translationFiles.length}`);
  console.log(`❌ Files with errors: ${errorCount}`);
  console.log(`🗑️  Total duplicate keys removed: ${totalRemoved}`);
  console.log(`📊 Total original keys: ${totalOriginal}`);
  console.log(`📊 Total cleaned keys: ${totalCleaned}`);
  
  if (totalRemoved > 0) {
    console.log('\n✅ Cleanup completed successfully!');
    console.log('💾 Backups created for modified files');
  } else {
    console.log('\n✅ No duplicate keys found in any files');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { removeDuplicateKeys, processTranslationFile, findTranslationFiles };
