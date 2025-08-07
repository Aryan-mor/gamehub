// Core plugin system
export type { GameHubContext, GameHubPlugin, ContextBuilder } from './context';
export { PluginRegistry, pluginRegistry } from './context';

// Individual plugins
export { SmartReplyPlugin, smartReplyPluginInstance, smartReplyPlugin } from './smart-reply';
export { I18nPlugin, i18nPluginInstance, i18nMiddleware } from './i18n';
export { LoggingPlugin, loggingPluginInstance, loggingMiddleware } from './logging';
export { UserPlugin, userPluginInstance } from './user';

// Plugin instances for easy access
import { smartReplyPluginInstance } from './smart-reply';
import { i18nPluginInstance } from './i18n';
import { loggingPluginInstance } from './logging';
import { userPluginInstance } from './user';
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
export function buildGameHubContext(ctx: Context): any {
  return pluginRegistry.buildContext(ctx);
} 