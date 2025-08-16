import { api } from '@/lib/api';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';

// Persistent-like preferred language cache (per-process)
const preferredLanguageCache = new Map<string, 'en' | 'fa'>();

// Runtime language cache reflecting the most recent language the bot should use
// This represents the user's current in-session language choice or suggestion
const runtimeUserLanguageCache = new Map<string, 'en' | 'fa'>();

function normalizeLanguageCode(language?: string | null): 'en' | 'fa' | undefined {
  if (!language) return undefined;
  const lower = language.toLowerCase();
  if (lower === 'fa' || lower.startsWith('fa-') || lower.startsWith('fa_')) return 'fa';
  if (lower === 'en' || lower.startsWith('en-') || lower.startsWith('en_')) return 'en';
  return undefined;
}

export function getPreferredLanguageFromCache(userId: string): 'en' | 'fa' | undefined {
  return preferredLanguageCache.get(userId);
}

export function setPreferredLanguageInCache(userId: string, language: 'en' | 'fa'): void {
  preferredLanguageCache.set(userId, language);
}

export function getRuntimeUserLanguage(userId: string): 'en' | 'fa' | undefined {
  return runtimeUserLanguageCache.get(userId);
}

export function setRuntimeUserLanguage(userId: string, language: 'en' | 'fa'): void {
  runtimeUserLanguageCache.set(userId, language);
}

export async function getPreferredLanguage(userId: string): Promise<'en' | 'fa' | undefined> {
  // First consult runtime (userLanguage) cache as the immediate source of truth
  const runtimeLang = runtimeUserLanguageCache.get(userId);
  if (runtimeLang) return runtimeLang;

  // Then consult preferred cache (persisted from DB)
  const cachedPreferred = preferredLanguageCache.get(userId);
  if (cachedPreferred) return cachedPreferred;

  logFunctionStart('language.getPreferred', { userId });
  try {
    const user = await api.users.getByTelegramId(userId);
    // Try explicit language column; if missing, fallback to telegram language_code
    const rawLang = (user as unknown as { language?: string; language_code?: string } | null)?.language
      || (user as unknown as { language_code?: string } | null)?.language_code;
    const normalized = normalizeLanguageCode(rawLang);
    if (normalized) {
      // Update both caches: runtime and preferred
      runtimeUserLanguageCache.set(userId, normalized);
      preferredLanguageCache.set(userId, normalized);
      logFunctionEnd('language.getPreferred', { language: normalized }, { userId });
      return normalized;
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
    // Network/Fetch errors: fallback to cache-only to avoid breaking UX
    if (
      (err?.message && (
        err.message.includes('fetch failed') ||
        err.message.includes('ECONNREFUSED') ||
        err.message.includes('ENOTFOUND') ||
        err.message.includes('ETIMEDOUT')
      )) ||
      err?.code === 'FETCH_ERROR'
    ) {
      preferredLanguageCache.set(userId, language);
      logFunctionEnd('language.updatePreferred.cacheOnly', { fallback: true, reason: 'network' }, { userId, language });
      return;
    }
    logError('language.updatePreferred', err, { userId, language });
    throw err;
  }
}


