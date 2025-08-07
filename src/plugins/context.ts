import { Context } from 'grammy';
import { SmartReplyOptions } from '../types';

/**
 * Comprehensive GameHub Context that includes all plugins and features
 * This context extends grammY's Context with all our custom functionality
 */
export interface GameHubContext extends Context {
  // Smart Reply Plugin
  replySmart(
    text: string,
    options?: SmartReplyOptions
  ): Promise<void>;

  // i18n Plugin
  t: (key: string, options?: Record<string, unknown>) => string;

  // Logging Plugin
  log: {
    debug: (message: string, context?: Record<string, unknown>) => void;
    info: (message: string, context?: Record<string, unknown>) => void;
    warn: (message: string, context?: Record<string, unknown>) => void;
    error: (message: string, context?: Record<string, unknown>) => void;
  };

  // User Plugin
  user: {
    id: string;
    username?: string;
    languageCode?: string;
    isNewUser: boolean;
  };

  // Utils Plugin
  utils: {
    formatCoins: (amount: number) => string;
    formatTimeRemaining: (milliseconds: number) => string;
  };

  // Telegram Plugin
  telegram: {
    sendMessage: (
      chatId: number,
      text: string,
      options?: {
        parseMode?: 'HTML' | 'Markdown';
        replyMarkup?: { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> };
      }
    ) => Promise<void>;
    editMessage: (
      chatId: number,
      messageId: number,
      text: string,
      options?: {
        parseMode?: 'HTML' | 'Markdown';
        replyMarkup?: { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> };
      }
    ) => Promise<void>;
    answerCallbackQuery: (callbackQueryId: string, text?: string) => Promise<void>;
  };

  // Room Plugin (for poker games)
  room?: {
    id: string;
    name: string;
    isCreator: boolean;
    isReady: boolean;
  };

  // Game Plugin (for active games)
  game?: {
    id: string;
    type: 'poker' | 'dice' | 'basketball' | 'football' | 'blackjack' | 'bowling';
    isActive: boolean;
    isPlayer: boolean;
    isSpectator: boolean;
  };
}

/**
 * Context builder function that creates a GameHubContext
 * This function should be called by each plugin to extend the context
 */
export type ContextBuilder = (ctx: Context) => Partial<GameHubContext>;

/**
 * Plugin interface that all GameHub plugins should implement
 */
export interface GameHubPlugin {
  name: string;
  version: string;
  buildContext: ContextBuilder;
  middleware: (ctx: GameHubContext, next: () => Promise<void>) => Promise<void>;
}

/**
 * Plugin registry for managing all GameHub plugins
 */
export class PluginRegistry {
  private plugins: Map<string, GameHubPlugin> = new Map();

  /**
   * Register a new plugin
   */
  register(plugin: GameHubPlugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} is already registered`);
    }
    this.plugins.set(plugin.name, plugin);
  }

  /**
   * Get a plugin by name
   */
  get(name: string): GameHubPlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Get all registered plugins
   */
  getAll(): GameHubPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Build complete context with all plugins
   */
  buildContext(ctx: Context): GameHubContext {
    const baseContext = ctx as GameHubContext;
    
    // Apply all plugin context builders
    for (const plugin of this.plugins.values()) {
      const pluginContext = plugin.buildContext(ctx);
      Object.assign(baseContext, pluginContext);
    }

    return baseContext;
  }

  /**
   * Create middleware chain for all plugins
   */
  createMiddlewareChain(): (ctx: GameHubContext, next: () => Promise<void>) => Promise<void> {
    return async (ctx: GameHubContext, next: () => Promise<void>): Promise<void> => {
      // Apply all plugin middlewares in order
      for (const plugin of this.plugins.values()) {
        await plugin.middleware(ctx, async () => {
          // Continue to next plugin or final handler
        });
      }
      
      await next();
    };
  }
}

// Global plugin registry instance
export const pluginRegistry = new PluginRegistry(); 