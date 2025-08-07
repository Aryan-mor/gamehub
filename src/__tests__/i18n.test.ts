import { describe, it, expect } from 'vitest';

describe('Translation Structure Tests', () => {
  it('should have flat translation structure', () => {
    const fs = require('fs');
    const path = require('path');
    
    const enTranslationPath = path.join(process.cwd(), 'locales', 'en', 'translation.json');
    const enContent = fs.readFileSync(enTranslationPath, 'utf-8');
    const enTranslations = JSON.parse(enContent);
    
    // Check that all values are strings (flat structure)
    for (const [key, value] of Object.entries(enTranslations)) {
      expect(typeof value).toBe('string');
    }
  });

  it('should have valid JSON structure', () => {
    const fs = require('fs');
    const path = require('path');
    
    const enTranslationPath = path.join(process.cwd(), 'locales', 'en', 'translation.json');
    const faTranslationPath = path.join(process.cwd(), 'locales', 'fa', 'translation.json');
    
    // Test that files can be parsed as JSON
    expect(() => {
      const enContent = fs.readFileSync(enTranslationPath, 'utf-8');
      JSON.parse(enContent);
    }).not.toThrow();
    
    expect(() => {
      const faContent = fs.readFileSync(faTranslationPath, 'utf-8');
      JSON.parse(faContent);
    }).not.toThrow();
  });

  it('should have translation files', () => {
    const fs = require('fs');
    const path = require('path');
    
    const enTranslationPath = path.join(process.cwd(), 'locales', 'en', 'translation.json');
    const faTranslationPath = path.join(process.cwd(), 'locales', 'fa', 'translation.json');
    
    expect(fs.existsSync(enTranslationPath)).toBe(true);
    expect(fs.existsSync(faTranslationPath)).toBe(true);
  });

  it('should have reasonable number of translations', () => {
    const fs = require('fs');
    const path = require('path');
    
    const enTranslationPath = path.join(process.cwd(), 'locales', 'en', 'translation.json');
    const enContent = fs.readFileSync(enTranslationPath, 'utf-8');
    const enTranslations = JSON.parse(enContent);
    
    // Should have at least 50 translations
    expect(Object.keys(enTranslations).length).toBeGreaterThan(50);
  });
});
