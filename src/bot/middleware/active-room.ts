import { Bot } from 'grammy';
import { GameHubContext } from '@/plugins';
import { getActiveRoomId, setActiveRoomId } from '@/modules/core/userRoomState';
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

      // Allow deep-link join via /start gprj<roomId> to pass through to start handler
      const messageText = ctx.message?.text || '';
      if (messageText.startsWith('/start ')) {
        const startPayload = messageText.split(' ')[1] || '';
        const isJoinDeepLink = /^gprj(.+)$/i.test(startPayload);
        if (isJoinDeepLink) {
          return await next();
        }
      }

      // Ignore inline queries and other non-message updates where chat may be absent
      if (ctx.inlineQuery || ctx.chosenInlineResult) {
        return await next();
      }

      const userId = String(ctx.from?.id || '');
      if (!userId) return await next();

      // Try to resolve active room from in-memory cache first
      let roomId = getActiveRoomId(userId);
      
      // If not found, resolve from DB membership and cache it
      if (!roomId) {
        try {
          const users = await import('@/api/users');
          const dbUser = await users.getByTelegramId(userId);
          const dbUserId = (dbUser && (dbUser as unknown as { id?: string }).id) as string | undefined;
          if (dbUserId) {
            const roomPlayers = await import('@/api/roomPlayers');
            // Prefer open rooms (waiting/playing); fallback to any membership if none
            const open = await roomPlayers.listOpenRoomsByUser(dbUserId);
            const first = (open[0]?.room_id) || (await roomPlayers.listActiveRoomsByUser(dbUserId))[0]?.room_id;
            if (first) {
              roomId = first;
              setActiveRoomId(userId, roomId);
            }
          }
        } catch (resolveErr) {
          logError('activeRoom.resolveFromDb', resolveErr as Error, { userId });
        }
      }
      if (!roomId) return await next();

      // If user has an active room:
      // - For /start: redirect to current room step (preferred UX)
      // - For other bot commands (e.g., /help): let them pass
      // - For normal messages: redirect to current room step
      const hasBotCommandEntity = Array.isArray(ctx.message?.entities)
        ? ctx.message!.entities!.some((e) => e.type === 'bot_command')
        : false;
      // Redirect ALL non-callback messages (including /start and other commands) when active room exists

      // Dispatch a generic games.findStep handler to resolve current game
      const { dispatch } = await import('@/modules/core/smart-router');
      
      // Do not attempt to mutate ctx.chat; rely on existing context
      
      const context: HandlerContext = {
        ctx,
        user: { id: userId as UserId, username: ctx.from?.username || 'Unknown' }
      };
      logFunctionStart('activeRoomRedirect', { userId, roomId, trigger: ctx.update?.message ? (hasBotCommandEntity ? 'bot_command' : 'message') : 'other' });
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


