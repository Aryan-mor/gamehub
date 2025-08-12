import { api } from '@/lib/api';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';

const preferredLanguageCache = new Map<string, string>();

export function getPreferredLanguageFromCache(userId: string): string | undefined {
  return preferredLanguageCache.get(userId);
}

export function setPreferredLanguageInCache(userId: string, language: string): void {
  preferredLanguageCache.set(userId, language);
}

export async function getPreferredLanguage(userId: string): Promise<string | undefined> {
  const cached = preferredLanguageCache.get(userId);
  if (cached) return cached;

  logFunctionStart('language.getPreferred', { userId });
  try {
    const user = await api.users.getByTelegramId(userId);
    // Try explicit language column; if missing, fallback to telegram language_code
    const lang = (user as unknown as { language?: string; language_code?: string } | null)?.language
      || (user as unknown as { language_code?: string } | null)?.language_code;
    if (lang && typeof lang === 'string') {
      preferredLanguageCache.set(userId, lang);
      logFunctionEnd('language.getPreferred', { language: lang }, { userId });
      return lang;
    }
    logFunctionEnd('language.getPreferred', { language: null }, { userId });
    return undefined;
  } catch (error) {
    logError('language.getPreferred', error as Error, { userId });
    return undefined;
  }
}

export async function updatePreferredLanguage(userId: string, language: 'en' | 'fa'): Promise<void> {
  logFunctionStart('language.updatePreferred', { userId, language });
  try {
    await api.users.updateByTelegramId(userId, { language });
    preferredLanguageCache.set(userId, language);
    logFunctionEnd('language.updatePreferred', {}, { userId, language });
  } catch (error) {
    const err = error as Error & { message?: string; code?: string };
    // Graceful fallback when DB schema lacks `language` column
    if (err?.message && err.message.includes("'language' column")) {
      // Cache-only fallback to avoid breaking user flow
      preferredLanguageCache.set(userId, language);
      logFunctionEnd('language.updatePreferred.cacheOnly', { fallback: true }, { userId, language });
      return;
    }
    logError('language.updatePreferred', err, { userId, language });
    throw err;
  }
}


