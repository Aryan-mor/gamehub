import { InlineKeyboard } from 'grammy';
import { I18nContext } from './i18n';

// Example of using translation with inline keyboards
export function createExampleKeyboard(ctx: I18nContext): InlineKeyboard {
  return new InlineKeyboard()
    .text(ctx.t('bot.start.title'), 'start_command')
    .text(ctx.t('bot.status.running'), 'status_command')
    .row()
    .text(ctx.t('bot.cache.stats.title'), 'cache_command');
}

// Example of using translation in message replies
export function sendExampleMessage(ctx: I18nContext): void {
  ctx.reply(`${ctx.t('bot.start.title')}\n\n${ctx.t('bot.start.description')}`);
}

// Example of using translation with interpolation
export function sendCacheStats(ctx: I18nContext, stats: { totalEntries: number; expiredEntries: number }): void {
  ctx.reply(
    `${ctx.t('bot.cache.stats.title')}:\n\n` +
    `${ctx.t('bot.cache.stats.totalEntries')}: ${stats.totalEntries}\n` +
    `${ctx.t('bot.cache.stats.expiredEntries')}: ${stats.expiredEntries}`
  );
}

// Example of using translation with error handling
export function sendError(ctx: I18nContext, errorType: 'stats' | 'clear'): void {
  ctx.reply(ctx.t(`bot.cache.error.${errorType}`));
} 