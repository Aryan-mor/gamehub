import { Bot } from 'grammy';
import { GameHubContext } from '@/plugins';
import { getActiveRoomId } from '@/modules/core/userRoomState';
import { HandlerContext } from '@/modules/core/handler';
import { UserId } from '@/utils/types';
import { logFunctionStart, logError } from '@/modules/core/logger';

export function registerActiveRoomRedirect(bot: Bot<GameHubContext>): void {
  bot.use(async (ctx, next) => {
    try {
      // Skip redirect for callback queries so action-specific handlers can process the button
      if (ctx.callbackQuery?.data) {
        return await next();
      }

      const userId = String(ctx.from?.id || '');
      if (!userId) return await next();

      const roomId = getActiveRoomId(userId);
      if (!roomId) return await next();

      // If user has an active room:
      // - For /start: redirect to current room step (preferred UX)
      // - For other bot commands (e.g., /help): let them pass
      // - For normal messages: redirect to current room step
      const text = ctx.message?.text || '';
      const hasBotCommandEntity = Array.isArray(ctx.message?.entities)
        ? ctx.message!.entities!.some((e) => e.type === 'bot_command')
        : false;
      const isStartCommand = hasBotCommandEntity && text.trim().startsWith('/start');
      const isOtherBotCommand = hasBotCommandEntity && !isStartCommand;

      if (isOtherBotCommand) {
        return await next();
      }

      // Dispatch a generic games.findStep handler to resolve current game
      const { dispatch } = await import('@/modules/core/smart-router');
      
      // Ensure ctx.chat is properly set for the context
      if (!ctx.chat && ctx.from) {
        // Create a new context with proper chat info
        (ctx as any).chat = { id: ctx.from.id, type: 'private' };
      }
      
      const context: HandlerContext = {
        ctx,
        user: { id: userId as UserId, username: ctx.from?.username || 'Unknown' }
      };
      logFunctionStart('activeRoomRedirect', { userId, roomId, trigger: ctx.update?.message ? (isStartCommand ? 'start' : 'message') : 'other' });
      // Attach roomId for the next handler
      (context as HandlerContext & { _query?: Record<string, string> })._query = { roomId };
      await dispatch('games.findStep', context);
      return; // handled
    } catch (error) {
      logError('activeRoomRedirect', error as Error, {});
      await next();
    }
  });
}


