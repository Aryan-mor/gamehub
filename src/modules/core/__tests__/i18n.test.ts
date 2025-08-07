import { describe, it, expect, beforeAll } from 'vitest';
import { initializeI18n, t, i18next } from '../i18n';

describe('i18n System', () => {
  beforeAll(async () => {
    await initializeI18n();
  });

  describe('Translation Fallback', () => {
    it('should fallback to English for unsupported languages', () => {
      const result = t('🎮 <b>GameHub</b>\n\nWelcome to GameHub! Choose a game to start playing.', 'unsupported_language');
      expect(result).toBe('🎮 GameHub Bot');
    });

    it('should use Persian for fa language', () => {
      const result = t('🎮 <b>GameHub</b>\n\nWelcome to GameHub! Choose a game to start playing.', 'fa');
      expect(result).toBe('🎮 ربات GameHub');
    });

    it('should use English as default', () => {
      const result = t('🎮 <b>GameHub</b>\n\nWelcome to GameHub! Choose a game to start playing.');
      expect(result).toBe('🎮 GameHub Bot');
    });
  });

  describe('Key Resolution', () => {
    it('should resolve nested keys', () => {
      const result = t('🎴 <b>Poker</b>\n\nWelcome to Poker! Create or join a room to start playing.', 'en');
      expect(result).toBe('🃏 Poker Game');
    });

    it('should return key for missing translations', () => {
        const result = t('Missing translation key', 'en');
  expect(result).toBe('Missing translation key');
    });

    it('should handle interpolation', () => {
      const result = t('✅ Success!', 'en');
      expect(result).toBe('✅ Success');
    });
  });

  describe('Language Support', () => {
    it('should support English', () => {
      const result = t('❓ <b>Help</b>\n\nHow can I help you?', 'en');
      expect(result).toBe('📖 GameHub Help');
    });

    it('should support Persian', () => {
      const result = t('❓ <b>Help</b>\n\nHow can I help you?', 'fa');
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