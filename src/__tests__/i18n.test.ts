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

  it('should have identical keys in en and fa, and only string values', () => {
    const fs = require('fs');
    const path = require('path');
    const enPath = path.join(process.cwd(), 'locales', 'en', 'translation.json');
    const faPath = path.join(process.cwd(), 'locales', 'fa', 'translation.json');
    const en = JSON.parse(fs.readFileSync(enPath, 'utf-8')) as Record<string, string>;
    const fa = JSON.parse(fs.readFileSync(faPath, 'utf-8')) as Record<string, string>;

    const enKeys = Object.keys(en).sort();
    const faKeys = Object.keys(fa).sort();
    expect(enKeys).toEqual(faKeys);

    for (const [k, v] of Object.entries(en)) {
      expect(typeof v).toBe('string');
      expect(k).not.toMatch(/^\s|\s$/);
    }
    for (const [k, v] of Object.entries(fa)) {
      expect(typeof v).toBe('string');
      expect(k).not.toMatch(/^\s|\s$/);
    }
  });

  it('should use namespaced keys for poker actions/buttons', () => {
    const fs = require('fs');
    const path = require('path');
    const enPath = path.join(process.cwd(), 'locales', 'en', 'translation.json');
    const en = JSON.parse(fs.readFileSync(enPath, 'utf-8')) as Record<string, string>;
    const requiredKeys = [
      'poker.room.buttons.startGame',
      'poker.room.buttons.share',
      'poker.room.buttons.refresh',
      'poker.room.buttons.leave',
      'poker.room.buttons.backToMenu',
      'poker.room.buttons.backToRoomInfo',
      'poker.actions.callWithAmount',
      'poker.actions.check',
      'poker.actions.fold',
      'poker.actions.allIn',
      'poker.actions.raisePlus'
    ];
    for (const key of requiredKeys) {
      expect(en[key]).toBeDefined();
      expect(typeof en[key]).toBe('string');
    }
  });
});
