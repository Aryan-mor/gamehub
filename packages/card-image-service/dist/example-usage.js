"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExampleKeyboard = createExampleKeyboard;
exports.sendExampleMessage = sendExampleMessage;
exports.sendCacheStats = sendCacheStats;
exports.sendError = sendError;
const grammy_1 = require("grammy");
function createExampleKeyboard(ctx) {
    return new grammy_1.InlineKeyboard()
        .text(ctx.t('bot.start.title'), 'start_command')
        .text(ctx.t('bot.status.running'), 'status_command')
        .row()
        .text(ctx.t('bot.cache.stats.title'), 'cache_command');
}
function sendExampleMessage(ctx) {
    ctx.reply(`${ctx.t('bot.start.title')}\n\n${ctx.t('bot.start.description')}`);
}
function sendCacheStats(ctx, stats) {
    ctx.reply(`${ctx.t('bot.cache.stats.title')}:\n\n` +
        `${ctx.t('bot.cache.stats.totalEntries')}: ${stats.totalEntries}\n` +
        `${ctx.t('bot.cache.stats.expiredEntries')}: ${stats.expiredEntries}`);
}
function sendError(ctx, errorType) {
    ctx.reply(ctx.t(`bot.cache.error.${errorType}`));
}
//# sourceMappingURL=example-usage.js.map