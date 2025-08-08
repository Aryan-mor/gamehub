// Core plugin system
export type { GameHubContext, GameHubPlugin, ContextBuilder } from './context';
export { PluginRegistry, pluginRegistry } from './context';

// Individual plugins
export { SmartReplyPlugin, smartReplyPluginInstance, smartReplyPlugin } from './smart-reply';
export { I18nPlugin, i18nPluginInstance, i18nMiddleware } from './i18n';
export { LoggingPlugin, loggingPluginInstance, loggingMiddleware } from './logging';
export { UserPlugin, userPluginInstance } from './user';
export { UtilsPlugin, utilsPluginInstance } from './utils';
export { TelegramPlugin, telegramPluginInstance } from './telegram';
export { KeyboardPlugin, keyboardPluginInstance } from './keyboard';
export { PokerPlugin, pokerPluginInstance } from './poker';
export { FormStatePlugin, formStatePluginInstance } from './form-state';

// Plugin instances for easy access
import { smartReplyPluginInstance } from './smart-reply';
import { i18nPluginInstance } from './i18n';
import { loggingPluginInstance } from './logging';
import { userPluginInstance } from './user';
import { utilsPluginInstance } from './utils';
import { telegramPluginInstance } from './telegram';
import { keyboardPluginInstance } from './keyboard';
import { pokerPluginInstance } from './poker';
import { formStatePluginInstance } from './form-state';
import { pluginRegistry } from './context';
import { Context } from 'grammy';

/**
 * Initialize all core plugins
 * This function should be called during bot startup
 */
export function initializeCorePlugins(): void {
  // Register all core plugins
  pluginRegistry.register(loggingPluginInstance);
  pluginRegistry.register(i18nPluginInstance);
  pluginRegistry.register(smartReplyPluginInstance);
  pluginRegistry.register(userPluginInstance);
  pluginRegistry.register(utilsPluginInstance);
  pluginRegistry.register(telegramPluginInstance);
  pluginRegistry.register(keyboardPluginInstance);
  pluginRegistry.register(pokerPluginInstance);
  pluginRegistry.register(formStatePluginInstance);
}

/**
 * Get the complete middleware chain for all registered plugins
 */
export function getPluginMiddlewareChain(): ReturnType<typeof pluginRegistry.createMiddlewareChain> {
  return pluginRegistry.createMiddlewareChain();
}

/**
 * Build a complete GameHubContext from a grammY Context
 */
export function buildGameHubContext(ctx: Context): ReturnType<typeof pluginRegistry.buildContext> {
  return pluginRegistry.buildContext(ctx);
}