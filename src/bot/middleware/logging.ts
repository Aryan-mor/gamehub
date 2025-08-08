import { Bot } from 'grammy';
import { GameHubContext } from '@/plugins';

export function registerLogging(bot: Bot<GameHubContext>): void {
  bot.use(async (ctx, next) => {
    ctx.log?.debug?.('Incoming update', {
      type: ctx.update.message ? 'message' : ctx.update.callback_query ? 'callback_query' : 'other',
      userId: ctx.from?.id,
      username: ctx.from?.username,
      chatId: ctx.chat?.id,
    });

    if (ctx.callbackQuery) {
      ctx.log?.debug?.('Callback data', { data: ctx.callbackQuery.data || 'No data' });
    }

    if (ctx.message?.text) {
      ctx.log?.debug?.('Message text', { text: ctx.message.text });
    }

    if (ctx.message?.from) {
      ctx.log?.debug?.('Message from', { firstName: ctx.message.from.first_name, lastName: ctx.message.from.last_name, username: ctx.message.from.username });
    }

    await next();
  });
}


