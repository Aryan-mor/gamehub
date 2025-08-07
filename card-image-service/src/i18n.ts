import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import { Context } from 'grammy';
import { logger } from './logger';

// Extend the Context type to include the translation function
export interface I18nContext extends Context {
  t: (key: string, options?: Record<string, unknown>) => string;
}

// Initialize i18next
export async function initializeI18n(): Promise<void> {
  try {
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

    logger.info('i18n initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize i18n', error as Error);
    throw error;
  }
}

// Middleware to inject translation function into context
export function i18nMiddleware(): (ctx: Context, next: () => Promise<void>) => Promise<void> {
  return async (ctx: Context, next: () => Promise<void>) => {
    // Get user language from Telegram context, fallback to 'en'
    const userLanguage = ctx.from?.language_code || 'en';
    
    // Ensure the language is supported, fallback to 'en' if not
    const language = i18next.languages.includes(userLanguage) ? userLanguage : 'en';
    
    // Inject the translation function into the context
    (ctx as I18nContext).t = (key: string, options?: Record<string, unknown>): string => {
      const result = i18next.t(key, { lng: language, ...options });
      return typeof result === 'string' ? result : key;
    };

    await next();
  };
}

// Helper function to get translation
export function t(key: string, language: string = 'en', options?: Record<string, unknown>): string {
  const result = i18next.t(key, { lng: language, ...options });
  return typeof result === 'string' ? result : key;
}

// Export the i18next instance for testing
export { i18next }; 