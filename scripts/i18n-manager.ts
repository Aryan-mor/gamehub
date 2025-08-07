import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface TranslationData {
  [key: string]: string | TranslationData;
}

interface TranslationStats {
  totalKeys: number;
  emptyKeys: number;
  duplicateValues: number;
  unusedKeys: number;
  missingKeys: number;
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
 * Extracts translation keys from source code
 */
function extractKeysFromCode(): Set<string> {
  const keys = new Set<string>();
  
  try {
    // Use grep to find ctx.t() calls
    const result = execSync('grep -r "ctx\\.t(" src/ --include="*.ts" --include="*.tsx"', { encoding: 'utf8' });
    
    const lines = result.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      // Extract the key from ctx.t('key')
      const match = line.match(/ctx\.t\(['"`]([^'"`]+)['"`]/);
      if (match) {
        keys.add(match[1]);
      }
    }
  } catch (error) {
    console.warn('Warning: Could not extract keys from code:', error);
  }
  
  return keys;
}

/**
 * Analyzes translation files and provides statistics
 */
function analyzeTranslations(): TranslationStats {
  const translationPath = path.join(process.cwd(), 'locales', 'en', 'translation.json');
  
  if (!fs.existsSync(translationPath)) {
    throw new Error('Translation file not found: ' + translationPath);
  }
  
  const translationContent = fs.readFileSync(translationPath, 'utf-8');
  const translationData: TranslationData = JSON.parse(translationContent);
  
  // Flatten the nested structure
  const flattenedTranslations = flattenTranslations(translationData);
  
  // Find duplicates
  const duplicates = findDuplicateValues(flattenedTranslations);
  
  // Count empty keys
  const emptyKeys = Object.values(flattenedTranslations).filter(value => value === '').length;
  
  // Extract keys from code
  const codeKeys = extractKeysFromCode();
  
  // Find unused keys (in translation but not in code)
  const translationKeys = new Set(Object.keys(flattenedTranslations));
  const unusedKeys = Array.from(translationKeys).filter(key => !codeKeys.has(key)).length;
  
  // Find missing keys (in code but not in translation)
  const missingKeys = Array.from(codeKeys).filter(key => !translationKeys.has(key)).length;
  
  return {
    totalKeys: Object.keys(flattenedTranslations).length,
    emptyKeys,
    duplicateValues: Object.keys(duplicates).length,
    unusedKeys,
    missingKeys
  };
}

/**
 * Main function to manage i18n
 */
function manageI18n(): void {
  try {
    console.log('🔧 i18n Management Tool\n');
    
    // Analyze current state
    console.log('📊 Analyzing current translations...');
    const stats = analyzeTranslations();
    
    console.log('📈 Translation Statistics:');
    console.log(`   Total keys: ${stats.totalKeys}`);
    console.log(`   Empty keys: ${stats.emptyKeys}`);
    console.log(`   Duplicate values: ${stats.duplicateValues}`);
    console.log(`   Unused keys: ${stats.unusedKeys}`);
    console.log(`   Missing keys: ${stats.missingKeys}`);
    console.log('');
    
    // Check for duplicates
    const translationPath = path.join(process.cwd(), 'locales', 'en', 'translation.json');
    const translationContent = fs.readFileSync(translationPath, 'utf-8');
    const translationData: TranslationData = JSON.parse(translationContent);
    const flattenedTranslations = flattenTranslations(translationData);
    const duplicates = findDuplicateValues(flattenedTranslations);
    
    if (Object.keys(duplicates).length > 0) {
      console.log('⚠️  Found duplicate values:');
      for (const [value, keys] of Object.entries(duplicates)) {
        console.log(`   Value: "${value}"`);
        console.log('   Keys:');
        for (const key of keys) {
          console.log(`     - ${key}`);
        }
        console.log('');
      }
    }
    
    // Run i18next-parser
    console.log('🔄 Running i18next-parser...');
    try {
      execSync('npx i18next-parser', { stdio: 'inherit' });
      console.log('✅ i18next-parser completed successfully');
    } catch (error) {
      console.error('❌ i18next-parser failed:', error);
    }
    
    console.log('\n✅ i18n management completed!');
    
  } catch (error) {
    console.error('❌ Error in i18n management:', error);
    process.exit(1);
  }
}

// Run the management if this file is executed directly
if (require.main === module) {
  manageI18n();
}

export { manageI18n, analyzeTranslations, findDuplicateValues, flattenTranslations };
