import { Context } from 'grammy';
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import { GameHubContext, GameHubPlugin, ContextBuilder } from './context';
import { logFunctionStart, logFunctionEnd, logError } from '../modules/core/logger';

/**
 * i18n Plugin
 * Provides internationalization support for the bot
 */
export class I18nPlugin implements GameHubPlugin {
  name = 'i18n';
  version = '1.0.0';
  private initialized = false;

  /**
   * Initialize i18next
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      logFunctionStart('initializeI18n');
      
      await i18next
        .use(Backend)
        .init({
          backend: {
            loadPath: './locales/{{lng}}/{{ns}}.json',
          },
          fallbackLng: 'en',
          debug: false,
          interpolation: {
            escapeValue: false,
          },
          supportedLngs: ['en', 'fa'],
          ns: ['translation'],
          defaultNS: 'translation',
          preload: ['en', 'fa'],
        });
      
      this.initialized = true;
      logFunctionEnd('initializeI18n', {});
    } catch (error) {
      logError('initializeI18n', error as Error);
      throw error;
    }
  }

  buildContext: ContextBuilder = (ctx: Context): Partial<GameHubContext> => {
    return {
      t: (key: string, options?: Record<string, unknown>): string => {
        const userLanguage = ctx.from?.language_code || 'en';
        const language = i18next.languages.includes(userLanguage) ? userLanguage : 'en';
        const result = i18next.t(key, { lng: language, ...options });
        return typeof result === 'string' ? result : key;
      }
    };
  };

  middleware = async (ctx: GameHubContext, next: () => Promise<void>): Promise<void> => {
    try {
      logFunctionStart('i18nMiddleware', {
        userId: ctx.from?.id?.toString(),
        languageCode: ctx.from?.language_code
      });
      
      // Ensure i18n is initialized
      if (!this.initialized) {
        await this.initialize();
      }
      
      await next();
      
      logFunctionEnd('i18nMiddleware', {});
    } catch (error) {
      logError('i18nMiddleware', error as Error);
      await next();
    }
  };
}

// Export plugin instance
export const i18nPluginInstance = new I18nPlugin();

// Legacy function for backward compatibility
export function i18nMiddleware(): (ctx: GameHubContext, next: () => Promise<void>) => Promise<void> {
  return i18nPluginInstance.middleware;
}

// Export i18next instance for direct access
export { i18next }; 