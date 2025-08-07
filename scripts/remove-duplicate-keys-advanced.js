#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Advanced script to remove duplicate keys from translation.json files
 * This script parses the JSON as text first to detect duplicates before JSON.parse()
 */

function findDuplicateKeysInText(content) {
  const lines = content.split('\n');
  const keyPattern = /^\s*"([^"]+)":\s*"[^"]*",?\s*$/;
  const seenKeys = new Set();
  const duplicateLines = [];
  
  lines.forEach((line, index) => {
    const match = line.match(keyPattern);
    if (match) {
      const key = match[1];
      if (seenKeys.has(key)) {
        duplicateLines.push({ line: index + 1, key });
      } else {
        seenKeys.add(key);
      }
    }
  });
  
  return duplicateLines;
}

function removeDuplicateKeysFromText(content) {
  const lines = content.split('\n');
  const keyPattern = /^\s*"([^"]+)":\s*"[^"]*",?\s*$/;
  const seenKeys = new Set();
  const cleanedLines = [];
  let removedCount = 0;
  
  lines.forEach((line) => {
    const match = line.match(keyPattern);
    if (match) {
      const key = match[1];
      if (seenKeys.has(key)) {
        console.log(`  🗑️  Removing duplicate key: "${key}"`);
        removedCount++;
        return; // Skip this line
      } else {
        seenKeys.add(key);
      }
    }
    cleanedLines.push(line);
  });
  
  return { cleanedContent: cleanedLines.join('\n'), removedCount };
}

function processTranslationFile(filePath) {
  try {
    console.log(`\n📁 Processing: ${filePath}`);
    
    // Read the file as text
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Find duplicates in text
    const duplicateLines = findDuplicateKeysInText(content);
    
    if (duplicateLines.length === 0) {
      console.log(`  ✅ No duplicate keys found`);
      return { removedCount: 0, originalCount: 0, cleanedCount: 0 };
    }
    
    console.log(`  🔍 Found ${duplicateLines.length} duplicate keys:`);
    duplicateLines.forEach(({ line, key }) => {
      console.log(`    Line ${line}: "${key}"`);
    });
    
    // Remove duplicates
    const { cleanedContent, removedCount } = removeDuplicateKeysFromText(content);
    
    // Parse to count keys
    const originalTranslations = JSON.parse(content);
    const cleanedTranslations = JSON.parse(cleanedContent);
    
    const originalCount = Object.keys(originalTranslations).length;
    const cleanedCount = Object.keys(cleanedTranslations).length;
    
    // Create backup
    const backupPath = filePath.replace('.json', '_backup_before_cleanup.json');
    fs.writeFileSync(backupPath, content);
    console.log(`  💾 Backup created: ${backupPath}`);
    
    // Write cleaned file
    fs.writeFileSync(filePath, cleanedContent);
    console.log(`  ✅ Removed ${removedCount} duplicate keys`);
    console.log(`  📊 Original: ${originalCount} keys → Cleaned: ${cleanedCount} keys`);
    
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
  console.log('🧹 Advanced Translation Duplicate Key Cleaner');
  console.log('=============================================');
  
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

module.exports = { 
  removeDuplicateKeysFromText, 
  findDuplicateKeysInText, 
  processTranslationFile, 
  findTranslationFiles 
};
