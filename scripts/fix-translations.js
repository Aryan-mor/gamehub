#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Translation Fixer - Complete Solution
 * Flattens nested objects and removes duplicate keys from translation files
 * 
 * Usage: node scripts/fix-translations.js
 * 
 * This script combines both flattening and cleaning operations:
 * 1. First flattens any nested objects to flat structure
 * 2. Then removes any duplicate keys
 * 3. Creates backups at each step
 */

// Import functions from other scripts
const { flattenObject, hasNestedObjects } = require('./flatten-translations.js');
const { findDuplicateKeysInText, removeDuplicateKeysFromText } = require('./clean-translations.js');

function processTranslationFile(filePath) {
  try {
    console.log(`\n📁 Processing: ${filePath}`);
    
    // Step 1: Read the file
    const originalContent = fs.readFileSync(filePath, 'utf8');
    const originalTranslations = JSON.parse(originalContent);
    
    let currentTranslations = originalTranslations;
    let currentContent = originalContent;
    let step1Backup = null;
    let step2Backup = null;
    let flattenCount = 0;
    let duplicateCount = 0;
    
    // Step 1: Flatten nested objects
    if (hasNestedObjects(currentTranslations)) {
      console.log(`  🔄 Step 1: Flattening nested objects...`);
      
      const flattenedTranslations = flattenObject(currentTranslations);
      flattenCount = Object.keys(flattenedTranslations).length - Object.keys(currentTranslations).length;
      
      // Create backup for step 1
      step1Backup = filePath.replace('.json', '_backup_before_flatten.json');
      fs.writeFileSync(step1Backup, currentContent);
      console.log(`  💾 Step 1 backup created: ${step1Backup}`);
      
      // Update current state
      currentTranslations = flattenedTranslations;
      currentContent = JSON.stringify(flattenedTranslations, null, 2);
      
      console.log(`  ✅ Flattened ${flattenCount} nested keys`);
    } else {
      console.log(`  ✅ Step 1: No nested objects found`);
    }
    
    // Step 2: Remove duplicate keys
    const duplicateLines = findDuplicateKeysInText(currentContent);
    
    if (duplicateLines.length > 0) {
      console.log(`  🧹 Step 2: Removing duplicate keys...`);
      
      // Create backup for step 2
      step2Backup = filePath.replace('.json', '_backup_before_clean.json');
      fs.writeFileSync(step2Backup, currentContent);
      console.log(`  💾 Step 2 backup created: ${step2Backup}`);
      
      // Remove duplicates
      const { cleanedContent, removedCount } = removeDuplicateKeysFromText(currentContent);
      duplicateCount = removedCount;
      
      // Validate the cleaned JSON
      try {
        JSON.parse(cleanedContent);
      } catch (parseError) {
        console.error(`  ❌ Invalid JSON after cleanup: ${parseError.message}`);
        return { error: true };
      }
      
      // Update current state
      currentContent = cleanedContent;
      currentTranslations = JSON.parse(cleanedContent);
      
      console.log(`  ✅ Removed ${duplicateCount} duplicate keys`);
    } else {
      console.log(`  ✅ Step 2: No duplicate keys found`);
    }
    
    // Write final result
    fs.writeFileSync(filePath, currentContent);
    
    const originalCount = Object.keys(originalTranslations).length;
    const finalCount = Object.keys(currentTranslations).length;
    
    console.log(`  📊 Summary: ${originalCount} → ${finalCount} keys`);
    
    return {
      originalCount,
      finalCount,
      flattenCount,
      duplicateCount,
      step1Backup,
      step2Backup
    };
    
  } catch (error) {
    console.error(`  ❌ Error processing ${filePath}:`, error.message);
    return { error: true };
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
  console.log('🔧 Translation Fixer - Complete Solution');
  console.log('=======================================');
  console.log('This script will:');
  console.log('1. Flatten any nested translation objects');
  console.log('2. Remove any duplicate keys');
  console.log('3. Create backups at each step\n');
  
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
  
  let totalOriginal = 0;
  let totalFinal = 0;
  let totalFlattened = 0;
  let totalDuplicates = 0;
  let errorCount = 0;
  
  for (const file of translationFiles) {
    const result = processTranslationFile(file);
    
    if (result.error) {
      errorCount++;
    } else {
      totalOriginal += result.originalCount;
      totalFinal += result.finalCount;
      totalFlattened += result.flattenCount;
      totalDuplicates += result.duplicateCount;
    }
  }
  
  console.log('\n📊 Final Summary:');
  console.log('=================');
  console.log(`📁 Files processed: ${translationFiles.length}`);
  console.log(`❌ Files with errors: ${errorCount}`);
  console.log(`🔄 Total keys flattened: ${totalFlattened}`);
  console.log(`🗑️  Total duplicate keys removed: ${totalDuplicates}`);
  console.log(`📊 Total original keys: ${totalOriginal}`);
  console.log(`📊 Total final keys: ${totalFinal}`);
  
  if (totalFlattened > 0 || totalDuplicates > 0) {
    console.log('\n✅ Translation files fixed successfully!');
    console.log('💾 Backups created for each step');
    console.log('📝 Files are now flat and clean');
  } else {
    console.log('\n✅ All translation files are already clean and flat');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { 
  processTranslationFile, 
  findTranslationFiles 
};
