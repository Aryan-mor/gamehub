import { describe, it, expect, beforeEach } from 'vitest';
import { Bot, Context } from 'grammy';
import { GameHubContext, pluginRegistry } from '../src/plugins';
import { SmartReplyPlugin } from '../src/plugins/smart-reply';
import { I18nPlugin } from '../src/plugins/i18n';
import { LoggingPlugin } from '../src/plugins/logging';
import { UserPlugin } from '../src/plugins/user';

describe('Plugin System', () => {
  beforeEach(() => {
    // Clear plugin registry before each test
    pluginRegistry['plugins'].clear();
  });

  it('should register plugins correctly', () => {
    const smartReplyPlugin = new SmartReplyPlugin();
    const i18nPlugin = new I18nPlugin();
    const loggingPlugin = new LoggingPlugin();
    const userPlugin = new UserPlugin();

    pluginRegistry.register(smartReplyPlugin);
    pluginRegistry.register(i18nPlugin);
    pluginRegistry.register(loggingPlugin);
    pluginRegistry.register(userPlugin);

    expect(pluginRegistry.getAll()).toHaveLength(4);
    expect(pluginRegistry.get('smart-reply')).toBe(smartReplyPlugin);
    expect(pluginRegistry.get('i18n')).toBe(i18nPlugin);
    expect(pluginRegistry.get('logging')).toBe(loggingPlugin);
    expect(pluginRegistry.get('user')).toBe(userPlugin);
  });

  it('should build GameHubContext with all plugins', () => {
    const smartReplyPlugin = new SmartReplyPlugin();
    const i18nPlugin = new I18nPlugin();
    const loggingPlugin = new LoggingPlugin();
    const userPlugin = new UserPlugin();

    pluginRegistry.register(smartReplyPlugin);
    pluginRegistry.register(i18nPlugin);
    pluginRegistry.register(loggingPlugin);
    pluginRegistry.register(userPlugin);

    // Mock context
    const mockContext = {
      chat: { id: 123 },
      from: { id: 456, username: 'testuser', language_code: 'en' },
      message: { message_id: 789 }
    } as Context;

    const gameHubContext = pluginRegistry.buildContext(mockContext);

    // Check that all plugin features are available
    expect(gameHubContext.replySmart).toBeDefined();
    expect(gameHubContext.t).toBeDefined();
    expect(gameHubContext.log).toBeDefined();
    expect(gameHubContext.user).toBeDefined();
  });

  it('should handle translation correctly', () => {
    const i18nPlugin = new I18nPlugin();
    pluginRegistry.register(i18nPlugin);

    const mockContext = {
      from: { language_code: 'en' }
    } as Context;

    const gameHubContext = pluginRegistry.buildContext(mockContext);
    
    // Test translation (should return key if not initialized)
    expect(typeof gameHubContext.t).toBe('function');
  });

  it('should provide logging functionality', () => {
    const loggingPlugin = new LoggingPlugin();
    pluginRegistry.register(loggingPlugin);

    const mockContext = {
      from: { id: 123 },
      chat: { id: 456 }
    } as Context;

    const gameHubContext = pluginRegistry.buildContext(mockContext);
    
    expect(gameHubContext.log.debug).toBeDefined();
    expect(gameHubContext.log.info).toBeDefined();
    expect(gameHubContext.log.warn).toBeDefined();
    expect(gameHubContext.log.error).toBeDefined();
  });

  it('should provide user context', () => {
    const userPlugin = new UserPlugin();
    pluginRegistry.register(userPlugin);

    const mockContext = {
      from: { id: 123, username: 'testuser', language_code: 'en' }
    } as Context;

    const gameHubContext = pluginRegistry.buildContext(mockContext);
    
    expect(gameHubContext.user.id).toBe('123');
    expect(gameHubContext.user.username).toBe('testuser');
    expect(gameHubContext.user.languageCode).toBe('en');
  });

  it('should provide smart reply functionality', () => {
    const smartReplyPlugin = new SmartReplyPlugin();
    pluginRegistry.register(smartReplyPlugin);

    const mockContext = {
      chat: { id: 123 },
      message: { message_id: 456 }
    } as Context;

    const gameHubContext = pluginRegistry.buildContext(mockContext);
    
    expect(typeof gameHubContext.replySmart).toBe('function');
  });
}); 