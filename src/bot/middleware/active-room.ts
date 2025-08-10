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

      // Dispatch a generic games.findStep handler to resolve current game
      const { dispatch } = await import('@/modules/core/smart-router');
      const context: HandlerContext = {
        ctx,
        user: { id: userId as UserId, username: ctx.from?.username || 'Unknown' }
      };
      logFunctionStart('activeRoomRedirect', { userId, roomId, trigger: ctx.update?.message ? 'message' : 'other' });
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


