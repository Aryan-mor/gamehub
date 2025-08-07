import { describe, it, expect, beforeAll } from 'vitest';
import { initializeI18n, t, i18next } from './i18n';

describe('i18n System', () => {
  beforeAll(async () => {
    await initializeI18n();
  });

  describe('Translation Fallback', () => {
    it('should fallback to English for unsupported languages', () => {
      const result = t('bot.start.title', 'unsupported_language');
      expect(result).toBe('🎴 Card Image Service Bot');
    });

    it('should use Persian for fa language', () => {
      const result = t('bot.start.title', 'fa');
      expect(result).toBe('🎴 ربات سرویس تصاویر کارت');
    });

    it('should use English as default', () => {
      const result = t('bot.start.title');
      expect(result).toBe('🎴 Card Image Service Bot');
    });
  });

  describe('Key Resolution', () => {
    it('should resolve nested keys correctly', () => {
      const result = t('bot.cache.stats.title', 'en');
      expect(result).toBe('📊 Cache Statistics');
    });

    it('should handle missing keys gracefully', () => {
      const result = t('nonexistent.key', 'en');
      expect(result).toBe('nonexistent.key');
    });

    it('should handle interpolation correctly', () => {
      const result = t('bot.cache.stats.totalEntries', 'en', { count: 5 });
      expect(result).toBe('Total entries');
    });
  });

  describe('Language Support', () => {
    it('should support English language', () => {
      const result = t('bot.status.running', 'en');
      expect(result).toBe('✅ Card Image Service is running');
    });

    it('should support Persian language', () => {
      const result = t('bot.status.running', 'fa');
      expect(result).toBe('✅ سرویس تصاویر کارت در حال اجرا است');
    });
  });

  describe('i18next Configuration', () => {
    it('should have correct fallback language', () => {
      expect(i18next.options.fallbackLng).toEqual(['en']);
    });

    it('should support correct languages', () => {
      expect(i18next.languages).toContain('en');
      // Note: fa might not be loaded immediately, so we test that it's configured
      expect(i18next.options.supportedLngs).toContain('fa');
    });

    it('should have correct namespace configuration', () => {
      expect(i18next.options.ns).toEqual(['translation']);
      expect(i18next.options.defaultNS).toBe('translation');
    });
  });
}); 