import { describe, it, expect, beforeAll } from 'vitest';
import { initializeI18n, t, i18next } from '../i18n';

describe('i18n System', () => {
  beforeAll(async () => {
    await initializeI18n();
  });

  describe('Translation Fallback', () => {
    it('should fallback to English for unsupported languages', () => {
      const result = t('bot.start.title', 'unsupported_language');
      expect(result).toBe('🎮 GameHub Bot');
    });

    it('should use Persian for fa language', () => {
      const result = t('bot.start.title', 'fa');
      expect(result).toBe('🎮 ربات GameHub');
    });

    it('should use English as default', () => {
      const result = t('bot.start.title');
      expect(result).toBe('🎮 GameHub Bot');
    });
  });

  describe('Key Resolution', () => {
    it('should resolve nested keys', () => {
      const result = t('bot.poker.start.title', 'en');
      expect(result).toBe('🃏 Poker Game');
    });

    it('should return key for missing translations', () => {
      const result = t('bot.missing.key', 'en');
      expect(result).toBe('bot.missing.key');
    });

    it('should handle interpolation', () => {
      const result = t('bot.common.success', 'en');
      expect(result).toBe('✅ Success');
    });
  });

  describe('Language Support', () => {
    it('should support English', () => {
      const result = t('bot.help.title', 'en');
      expect(result).toBe('📖 GameHub Help');
    });

    it('should support Persian', () => {
      const result = t('bot.help.title', 'fa');
      expect(result).toBe('📖 راهنمای GameHub');
    });
  });

  describe('i18next Configuration', () => {
    it('should have correct fallback language', () => {
      expect(i18next.options.fallbackLng).toEqual(['en']);
    });

    it('should support correct languages', () => {
      expect(i18next.languages).toContain('en');
      expect(i18next.options.supportedLngs).toContain('fa');
    });

    it('should have correct namespace', () => {
      expect(i18next.options.defaultNS).toBe('translation');
    });
  });
}); 