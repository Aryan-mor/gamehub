import fs from 'fs';
import path from 'path';

interface TranslationData {
  [key: string]: string | TranslationData;
}

/**
 * Recursively flattens a nested translation object into key-value pairs
 */
function flattenTranslations(obj: TranslationData, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'string') {
      result[fullKey] = value;
    } else if (typeof value === 'object' && value !== null) {
      Object.assign(result, flattenTranslations(value, fullKey));
    }
  }
  
  return result;
}

/**
 * Finds duplicate values in translation data
 */
function findDuplicateValues(translations: Record<string, string>): Record<string, string[]> {
  const valueToKeys: Record<string, string[]> = {};
  
  for (const [key, value] of Object.entries(translations)) {
    if (!valueToKeys[value]) {
      valueToKeys[value] = [];
    }
    valueToKeys[value].push(key);
  }
  
  // Filter only values that have multiple keys
  const duplicates: Record<string, string[]> = {};
  for (const [value, keys] of Object.entries(valueToKeys)) {
    if (keys.length > 1) {
      duplicates[value] = keys;
    }
  }
  
  return duplicates;
}

/**
 * Main function to check for duplicate values in translation files
 */
function checkDuplicateValues(): void {
  try {
    console.log('🔍 Checking for duplicate values in translation files...\n');
    
    const translationPath = path.join(process.cwd(), 'locales', 'en', 'translation.json');
    
    if (!fs.existsSync(translationPath)) {
      console.error('❌ Translation file not found:', translationPath);
      process.exit(1);
    }
    
    const translationContent = fs.readFileSync(translationPath, 'utf-8');
    const translationData: TranslationData = JSON.parse(translationContent);
    
    // Flatten the nested structure
    const flattenedTranslations = flattenTranslations(translationData);
    
    // Find duplicates
    const duplicates = findDuplicateValues(flattenedTranslations);
    
    if (Object.keys(duplicates).length === 0) {
      console.log('✅ No duplicate values found in translation file.');
      return;
    }
    
    console.log('⚠️  Found duplicate values in translation file:\n');
    
    for (const [value, keys] of Object.entries(duplicates)) {
      console.log(`📝 Value: "${value}"`);
      console.log('   Keys:');
      for (const key of keys) {
        console.log(`   - ${key}`);
      }
      console.log('');
    }
    
    console.log(`📊 Summary: Found ${Object.keys(duplicates).length} duplicate values affecting ${Object.values(duplicates).flat().length} keys.`);
    
  } catch (error) {
    console.error('❌ Error checking duplicate values:', error);
    process.exit(1);
  }
}

// Run the check if this file is executed directly
if (require.main === module) {
  checkDuplicateValues();
}

export { checkDuplicateValues, flattenTranslations, findDuplicateValues };
