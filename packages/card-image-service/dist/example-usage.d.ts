import { InlineKeyboard } from 'grammy';
import { I18nContext } from './i18n';
export declare function createExampleKeyboard(ctx: I18nContext): InlineKeyboard;
export declare function sendExampleMessage(ctx: I18nContext): void;
export declare function sendCacheStats(ctx: I18nContext, stats: {
    totalEntries: number;
    expiredEntries: number;
}): void;
export declare function sendError(ctx: I18nContext, errorType: 'stats' | 'clear'): void;
//# sourceMappingURL=example-usage.d.ts.map