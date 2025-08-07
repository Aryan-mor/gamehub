import { describe, it, expect, beforeEach } from 'vitest';
import { I18nPlugin } from '../src/plugins/i18n';
import { Context } from 'grammy';

describe('i18n Plugin', () => {
  let i18nPlugin: I18nPlugin;

  beforeEach(() => {
    i18nPlugin = new I18nPlugin();
  });

  it('should have correct plugin metadata', () => {
    expect(i18nPlugin.name).toBe('i18n');
    expect(i18nPlugin.version).toBe('1.0.0');
  });

  it('should build context with translation function', () => {
    const mockContext = {
      from: { language_code: 'en' }
    } as Context;

    const contextExtension = i18nPlugin.buildContext(mockContext);
    
    expect(contextExtension.t).toBeDefined();
    expect(typeof contextExtension.t).toBe('function');
  });

  it('should handle translation function calls', async () => {
    // Initialize i18next first
    await i18nPlugin.initialize();
    
    const mockContext = {
      from: { language_code: 'en' }
    } as Context;

    const contextExtension = i18nPlugin.buildContext(mockContext);
    const result = contextExtension.t!('test.key');
    
    // Should return the key if translation not found
    expect(result).toBe('test.key');
  });

  it('should handle different language codes', () => {
    const mockContextEn = {
      from: { language_code: 'en' }
    } as Context;

    const mockContextFa = {
      from: { language_code: 'fa' }
    } as Context;

    const contextExtensionEn = i18nPlugin.buildContext(mockContextEn);
    const contextExtensionFa = i18nPlugin.buildContext(mockContextFa);
    
    expect(contextExtensionEn.t).toBeDefined();
    expect(contextExtensionFa.t).toBeDefined();
  });

  it('should handle missing language code', async () => {
    // Initialize i18next first
    await i18nPlugin.initialize();
    
    const mockContext = {
      from: {}
    } as Context;

    const contextExtension = i18nPlugin.buildContext(mockContext);
    const result = contextExtension.t!('test.key');
    
    expect(result).toBe('test.key');
  });

  it('should provide middleware function', () => {
    expect(typeof i18nPlugin.middleware).toBe('function');
  });
}); 