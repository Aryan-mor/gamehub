import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface TranslationData {
  [key: string]: string;
}

/**
 * Tests the flat translation structure
 */
function testFlatTranslations(): void {
  try {
    console.log('🧪 Testing flat translation structure...\n');
    
    // Test 1: Check if translation files are flat
    console.log('📋 Test 1: Checking translation file structure...');
    const enTranslationPath = path.join(process.cwd(), 'locales', 'en', 'translation.json');
    const enContent = fs.readFileSync(enTranslationPath, 'utf-8');
    const enTranslations: TranslationData = JSON.parse(enContent);
    
    let hasNestedStructure = false;
    for (const [key, value] of Object.entries(enTranslations)) {
      if (typeof value === 'object' && value !== null) {
        hasNestedStructure = true;
        console.error(`❌ Found nested structure in key: ${key}`);
      }
    }
    
    if (!hasNestedStructure) {
      console.log('✅ Translation file is properly flat');
    } else {
      console.error('❌ Translation file still contains nested structure');
      process.exit(1);
    }
    
    // Test 2: Check if all keys use dot notation
    console.log('\n📋 Test 2: Checking key format...');
    const keys = Object.keys(enTranslations);
    const invalidKeys = keys.filter(key => !key.includes('.'));
    
    if (invalidKeys.length === 0) {
      console.log('✅ All keys use proper dot notation');
    } else {
      console.error('❌ Found keys without dot notation:', invalidKeys);
      process.exit(1);
    }
    
    // Test 3: Check if all translation keys from code exist in translation file
    console.log('\n📋 Test 3: Validating translation keys...');
    const codeKeys = extractKeysFromCode();
    const translationKeys = new Set(Object.keys(enTranslations));
    const missingKeys = Array.from(codeKeys).filter(key => !translationKeys.has(key));
    
    if (missingKeys.length === 0) {
      console.log('✅ All code translation keys exist in translation file');
    } else {
      console.error('❌ Missing translation keys:', missingKeys);
      process.exit(1);
    }
    
    // Test 4: Check for empty values
    console.log('\n📋 Test 4: Checking for empty values...');
    const emptyKeys = Object.entries(enTranslations)
      .filter(([key, value]) => value === '')
      .map(([key]) => key);
    
    if (emptyKeys.length === 0) {
      console.log('✅ No empty translation values found');
    } else {
      console.warn(`⚠️  Found ${emptyKeys.length} empty translation values`);
      console.warn('Empty keys:', emptyKeys.slice(0, 10).join(', '));
      if (emptyKeys.length > 10) {
        console.warn(`... and ${emptyKeys.length - 10} more`);
      }
    }
    
    // Test 5: Check for duplicate values
    console.log('\n📋 Test 5: Checking for duplicate values...');
    const valueToKeys: Record<string, string[]> = {};
    
    for (const [key, value] of Object.entries(enTranslations)) {
      if (!valueToKeys[value]) {
        valueToKeys[value] = [];
      }
      valueToKeys[value].push(key);
    }
    
    const duplicates = Object.entries(valueToKeys)
      .filter(([value, keys]) => keys.length > 1 && value !== '')
      .map(([value, keys]) => ({ value, keys }));
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicate values found');
    } else {
      console.warn(`⚠️  Found ${duplicates.length} duplicate values`);
      for (const { value, keys } of duplicates.slice(0, 3)) {
        console.warn(`   Value: "${value}"`);
        console.warn(`   Keys: ${keys.join(', ')}`);
      }
      if (duplicates.length > 3) {
        console.warn(`   ... and ${duplicates.length - 3} more`);
      }
    }
    
    // Test 6: Check i18next-parser configuration
    console.log('\n📋 Test 6: Checking i18next-parser configuration...');
    const configPath = path.join(process.cwd(), 'i18next-parser.config.js');
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf-8');
      if (configContent.includes('keySeparator: \'.\'') && configContent.includes('namespaceSeparator: \':\'')) {
        console.log('✅ i18next-parser configuration is correct');
      } else {
        console.error('❌ i18next-parser configuration is incorrect');
        process.exit(1);
      }
    } else {
      console.error('❌ i18next-parser.config.js not found');
      process.exit(1);
    }
    
    // Test 7: Check if Persian translations are also flat
    console.log('\n📋 Test 7: Checking Persian translations...');
    const faTranslationPath = path.join(process.cwd(), 'locales', 'fa', 'translation.json');
    if (fs.existsSync(faTranslationPath)) {
      const faContent = fs.readFileSync(faTranslationPath, 'utf-8');
      const faTranslations: TranslationData = JSON.parse(faContent);
      
      let faHasNestedStructure = false;
      for (const [key, value] of Object.entries(faTranslations)) {
        if (typeof value === 'object' && value !== null) {
          faHasNestedStructure = true;
          console.error(`❌ Found nested structure in Persian key: ${key}`);
        }
      }
      
      if (!faHasNestedStructure) {
        console.log('✅ Persian translation file is properly flat');
      } else {
        console.error('❌ Persian translation file still contains nested structure');
        process.exit(1);
      }
    } else {
      console.warn('⚠️  Persian translation file not found');
    }
    
    console.log('\n🎉 All tests passed! Flat translation structure is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

/**
 * Extracts translation keys from source code
 */
function extractKeysFromCode(): Set<string> {
  const keys = new Set<string>();
  
  try {
    const result = execSync('grep -r "ctx\\.t(" src/ --include="*.ts" --include="*.tsx"', { encoding: 'utf8' });
    
    const lines = result.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const match = line.match(/ctx\.t\(['"`]([^'"`]+)['"`]/);
      if (match) {
        keys.add(match[1]);
      }
    }
  } catch (error) {
    console.warn('⚠️  Could not extract keys from code:', error);
  }
  
  return keys;
}

// Run if called directly
if (require.main === module) {
  testFlatTranslations();
}

export { testFlatTranslations };
