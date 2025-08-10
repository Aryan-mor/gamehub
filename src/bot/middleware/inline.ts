import { Bot, InlineKeyboard } from 'grammy';
import type { GameHubContext } from '@/plugins';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';

export function registerInlineHandler(bot: Bot<GameHubContext>): void {
  // Accept both legacy human-readable IDs and UUIDs
  bot.inlineQuery(/^(?:poker)\s+([A-Za-z0-9_\-]{6,}|[0-9a-fA-F-]{36})/i, async (ctx) => {
    try {
      const query = ctx.inlineQuery.query;
      logFunctionStart('inlineQuery', { query });
      // Fix regex to handle both @botname poker roomId and poker roomId formats
      const match = query.match(/(?:poker)\s+([A-Za-z0-9_\-]{6,}|[0-9a-fA-F-]{36})/i);
      const roomId = match?.[1] ?? '';

      const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'playonhub_bot';
      const deepLink = `https://t.me/${botUsername}?start=gprj${roomId}`;

      const title = ctx.t('poker.room.share.invite') || '🎮 Join Poker Game';
      const description = ctx.t('poker.room.share.inlineQuery')?.replace('{{name}}', roomId).replace('{{link}}', deepLink) || `Join room ${roomId}`;

      const joinButton = new InlineKeyboard().url(ctx.t('poker.room.buttons.joinRoom') || 'Join to Room', deepLink);

      const results = [
        {
          type: 'article' as const,
          id: `invite_${roomId}`,
          title,
          input_message_content: { message_text: description, parse_mode: 'HTML' as const },
          reply_markup: joinButton,
          description,
        },
      ];

      await ctx.answerInlineQuery(results, { cache_time: 0, is_personal: true });
      logFunctionEnd('inlineQuery', { count: results.length });
    } catch (error) {
      logError('inlineQuery', error as Error, {});
    }
  });
}



