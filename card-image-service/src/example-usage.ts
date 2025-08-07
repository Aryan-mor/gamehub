import { InlineKeyboard } from 'grammy';
import { I18nContext } from './i18n';

// Example of using translation with inline keyboards
export function createExampleKeyboard(ctx: I18nContext): InlineKeyboard {
  return new InlineKeyboard()
    .text(ctx.t('🎴 Card Image Service Bot'), 'start_command')
    .text(ctx.t('✅ Card Image Service is running'), 'status_command')
    .row()
    .text(ctx.t('📊 Cache Statistics'), 'cache_command');
}

// Example of using translation in message replies
export function sendExampleMessage(ctx: I18nContext): void {
  ctx.reply(`${ctx.t('🎴 Card Image Service Bot')}\n\n${ctx.t('This bot is used for generating and sending card images.')}`);
}

// Example of using translation with interpolation
export function sendCacheStats(ctx: I18nContext, stats: { totalEntries: number; expiredEntries: number }): void {
  ctx.reply(
    `${ctx.t('📊 Cache Statistics')}:\n\n` +
    `${ctx.t('Total entries')}: ${stats.totalEntries}\n` +
    `${ctx.t('Expired entries')}: ${stats.expiredEntries}`
  );
}

// Example of using translation with error handling
export function sendError(ctx: I18nContext, errorType: 'stats' | 'clear'): void {
  ctx.reply(ctx.t(`❌ Error getting cache stats`));
} 