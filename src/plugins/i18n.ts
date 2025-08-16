import { Context } from 'grammy';
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import { GameHubContext, GameHubPlugin, ContextBuilder } from './context';
import { getPreferredLanguageFromCache, getPreferredLanguage, getRuntimeUserLanguage, setRuntimeUserLanguage } from '@/modules/global/language';
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
            loadPath: process.cwd() + '/locales/{{lng}}/{{ns}}.json',
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
        // Prefer cached preferred language if available
        const preferred = ctx.from?.id ? (getRuntimeUserLanguage(String(ctx.from.id)) || getPreferredLanguageFromCache(String(ctx.from.id))) : undefined;
        // Normalize telegram language_code heuristically
        const tgCode = ctx.from?.language_code?.toLowerCase();
        const normalizedTg = tgCode?.startsWith('fa') ? 'fa' : tgCode?.startsWith('en') ? 'en' : undefined;
        const language = (preferred || normalizedTg || 'en');
        const result = i18next.t(key, { lng: language, ...options });
        // Log missing Persian translations to surface why English might appear
        try {
          if (language === 'fa' && !i18next.exists(key, { lng: 'fa' })) {
            logFunctionStart('i18n.missingFaTranslation', { key });
          }
        } catch {}
        
        // If result is empty string and language is English, return the key itself
        if (language === 'en' && result === '') {
          return key;
        }
        
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

      // Best-effort warm cache for user preferred language on each update (non-blocking)
      try {
        const userId = ctx.from?.id ? String(ctx.from.id) : undefined;
        if (userId) {
          // If neither runtime nor preferred cache has value, warm from DB once
          if (!getRuntimeUserLanguage(userId) && !getPreferredLanguageFromCache(userId)) {
            void getPreferredLanguage(userId);
          }
          // Also, if telegram gives us a strong hint, set runtime cache immediately
          const tgCode = ctx.from?.language_code?.toLowerCase();
          const normalizedTg = tgCode?.startsWith('fa') ? 'fa' : tgCode?.startsWith('en') ? 'en' : undefined;
          // Do NOT override explicit user selection; only set from Telegram when no preference is known
          if (normalizedTg && !getRuntimeUserLanguage(userId) && !getPreferredLanguageFromCache(userId)) {
            setRuntimeUserLanguage(userId, normalizedTg);
          }
        }
      } catch {}

      // Log the selected language and its source for visibility
      try {
        const userId = ctx.from?.id ? String(ctx.from.id) : undefined;
        if (userId) {
          const runtime = getRuntimeUserLanguage(userId);
          const preferred = getPreferredLanguageFromCache(userId);
          const tgCode = ctx.from?.language_code?.toLowerCase();
          const normalizedTg = tgCode?.startsWith('fa') ? 'fa' : tgCode?.startsWith('en') ? 'en' : undefined;
          const language = (runtime || preferred || normalizedTg || 'en');
          const source = runtime ? 'runtime' : preferred ? 'preferred-cache' : normalizedTg ? 'telegram' : 'fallback-en';
          logFunctionStart('i18n.languageSelected', { userId, language, source });
        }
      } catch {}
      
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