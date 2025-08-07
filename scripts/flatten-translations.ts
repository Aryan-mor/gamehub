import fs from 'fs';
import path from 'path';

interface TranslationData {
  [key: string]: string | TranslationData;
}

/**
 * Recursively flattens a nested translation object
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
 * Converts translation files from nested to flat structure
 */
function flattenTranslationFiles(): void {
  try {
    console.log('🔄 Converting translation files from nested to flat structure...\n');
    
    const locales = ['en', 'fa'];
    
    for (const locale of locales) {
      const translationPath = path.join(process.cwd(), 'locales', locale, 'translation.json');
      
      if (!fs.existsSync(translationPath)) {
        console.warn(`⚠️  Translation file not found for locale ${locale}: ${translationPath}`);
        continue;
      }
      
      console.log(`📝 Processing ${locale} translations...`);
      
      // Read the current translation file
      const translationContent = fs.readFileSync(translationPath, 'utf-8');
      const translationData: TranslationData = JSON.parse(translationContent);
      
      // Create backup
      const backupPath = path.join(process.cwd(), 'locales', locale, 'translation_backup.json');
      fs.writeFileSync(backupPath, translationContent);
      console.log(`💾 Backup created: ${backupPath}`);
      
      // Flatten the translations
      const flattenedTranslations = flattenTranslations(translationData);
      
      // Write the flattened structure
      const formattedContent = JSON.stringify(flattenedTranslations, null, 2);
      fs.writeFileSync(translationPath, formattedContent);
      
      console.log(`✅ ${locale} translations flattened: ${Object.keys(flattenedTranslations).length} keys`);
    }
    
    console.log('\n🎉 Translation files converted to flat structure!');
    console.log('📁 Backups saved as translation_backup.json in each locale folder');
    
  } catch (error) {
    console.error('❌ Error converting translation files:', error);
    process.exit(1);
  }
}

/**
 * Validates that all translation keys used in code exist in translation files
 */
function validateTranslationKeys(): void {
  try {
    console.log('\n🔍 Validating translation keys...');
    
    // Extract keys from code
    const codeKeys = new Set<string>();
    
    try {
      const result = require('child_process').execSync(
        'grep -r "ctx\\.t(" src/ --include="*.ts" --include="*.tsx"',
        { encoding: 'utf8' }
      );
      
      const lines = result.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        const match = line.match(/ctx\.t\(['"`]([^'"`]+)['"`]/);
        if (match) {
          codeKeys.add(match[1]);
        }
      }
    } catch (error) {
      console.warn('⚠️  Could not extract keys from code:', error);
    }
    
    // Check English translations
    const enTranslationPath = path.join(process.cwd(), 'locales', 'en', 'translation.json');
    if (fs.existsSync(enTranslationPath)) {
      const enContent = fs.readFileSync(enTranslationPath, 'utf-8');
      const enTranslations: Record<string, string> = JSON.parse(enContent);
      const enKeys = new Set(Object.keys(enTranslations));
      
      const missingKeys = Array.from(codeKeys).filter(key => !enKeys.has(key));
      
      if (missingKeys.length > 0) {
        console.error('❌ Missing translation keys in English file:');
        for (const key of missingKeys) {
          console.error(`   - ${key}`);
        }
        process.exit(1);
      } else {
        console.log('✅ All translation keys found in English file');
      }
    }
    
    console.log(`📊 Found ${codeKeys.size} translation keys in code`);
    
  } catch (error) {
    console.error('❌ Error validating translation keys:', error);
    process.exit(1);
  }
}

/**
 * Main function
 */
function main(): void {
  const command = process.argv[2];
  
  switch (command) {
    case 'flatten':
      flattenTranslationFiles();
      break;
    case 'validate':
      validateTranslationKeys();
      break;
    case 'all':
      flattenTranslationFiles();
      validateTranslationKeys();
      break;
    default:
      console.log('Usage:');
      console.log('  tsx scripts/flatten-translations.ts flatten  # Convert to flat structure');
      console.log('  tsx scripts/flatten-translations.ts validate # Validate keys');
      console.log('  tsx scripts/flatten-translations.ts all      # Flatten and validate');
      break;
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { flattenTranslationFiles, validateTranslationKeys, flattenTranslations };
