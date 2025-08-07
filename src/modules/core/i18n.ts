import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import { Context } from 'grammy';
import { logFunctionStart, logFunctionEnd, logError } from './logger';
import { SmartContext } from '../../types';

export interface I18nContext extends SmartContext {
  t: (key: string, options?: Record<string, unknown>) => string;
}

export async function initializeI18n(): Promise<void> {
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
    
    logFunctionEnd('initializeI18n', {});
  } catch (error) {
    logError('initializeI18n', error as Error);
    throw error;
  }
}

export function i18nMiddleware(): (ctx: Context, next: () => Promise<void>) => Promise<void> {
  return async (ctx: Context, next: () => Promise<void>) => {
    try {
      logFunctionStart('i18nMiddleware', {
        userId: ctx.from?.id?.toString(),
        languageCode: ctx.from?.language_code
      });
      
      const userLanguage = ctx.from?.language_code || 'en';
      const language = i18next.languages.includes(userLanguage) ? userLanguage : 'en';
      
      (ctx as I18nContext).t = (key: string, options?: Record<string, unknown>): string => {
        const result = i18next.t(key, { lng: language, ...options });
        return typeof result === 'string' ? result : key;
      };
      
      await next();
      
      logFunctionEnd('i18nMiddleware', {});
    } catch (error) {
      logError('i18nMiddleware', error as Error);
      await next();
    }
  };
}

export function t(key: string, language: string = 'en', options?: Record<string, unknown>): string {
  const result = i18next.t(key, { lng: language, ...options });
  return typeof result === 'string' ? result : key;
}

export { i18next }; 