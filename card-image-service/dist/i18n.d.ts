import i18next from 'i18next';
import { Context } from 'grammy';
export interface I18nContext extends Context {
    t: (key: string, options?: Record<string, unknown>) => string;
}
export declare function initializeI18n(): Promise<void>;
export declare function i18nMiddleware(): (ctx: Context, next: () => Promise<void>) => Promise<void>;
export declare function t(key: string, language?: string, options?: Record<string, unknown>): string;
export { i18next };
//# sourceMappingURL=i18n.d.ts.map