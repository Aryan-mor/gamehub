import { Bot } from 'grammy';
import { GameHubContext } from '@/plugins';
import { HandlerContext } from '@/modules/core/handler';
import { UserId } from '@/utils/types';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';
import { usersMessageHistory } from '@/plugins/smart-reply';

function parseActionAndParams(raw: string): { action?: string; params: Record<string, string> } {
  // Try JSON first
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>;
    const actionValue = (obj as { action?: unknown })?.action;
    if (obj && typeof obj === 'object' && typeof actionValue === 'string') {
      const { action, ...rest } = obj as Record<string, unknown> & { action: string };
      const params: Record<string, string> = {};
      for (const [k, v] of Object.entries(rest)) params[k] = String(v);
      return { action, params };
    }
  } catch {
    // ignore
  }
  // Support querystring style: action?x=y
  if (raw.includes('?')) {
    const [action, qs] = raw.split('?');
    const usp = new URLSearchParams(qs);
    const params: Record<string, string> = {};
    for (const [k, v] of usp.entries()) params[k] = v;
    return { action, params };
  }
  // Raw action string
  if (raw) return { action: raw, params: {} };
  return { action: undefined, params: {} };
}

export function registerCallbackDispatcher(bot: Bot<GameHubContext>): void {
  // Handle share_room legacy callbacks separately (kept as-is for compatibility)
  bot.callbackQuery(/^share_room_.*/, async (ctx) => {
    try {
      const callbackData = ctx.callbackQuery.data || '';
      logFunctionStart('share_room', { userId: String(ctx.from?.id || ''), callbackData, context: 'share_room' });
      await ctx.api.answerCallbackQuery(ctx.callbackQuery.id);
      const roomId = callbackData.replace('share_room_', '');
      ctx.log?.info?.('Skipping share handler (archived)', { roomId });
      logFunctionEnd('share_room', {}, { userId: String(ctx.from?.id || ''), roomId, context: 'share_room' });
    } catch (error) {
      ctx.log?.error?.('share_room error', { error: error instanceof Error ? error.message : String(error) });
      logError('share_room', error as Error, {});
      await ctx.api.answerCallbackQuery(ctx.callbackQuery.id, { text: ctx.t('bot.error.generic') });
    }
  });

  bot.on('callback_query:data', async (ctx) => {
    try {
      const raw = ctx.callbackQuery.data || '';
      const { action, params } = parseActionAndParams(raw);

      // Ignore legacy non-JSON share_room_ here; handled by its dedicated handler
      if (!action || raw.startsWith('share_room_')) {
        await ctx.api.answerCallbackQuery(ctx.callbackQuery.id);
        return;
      }

      logFunctionStart('callback_dispatch', {
        userId: String(ctx.from?.id || ''),
        action,
        params
      });

      // Security: Guard against actions from stale (non-latest) messages
      const fromUserId = String(ctx.from?.id ?? '');
      const history = fromUserId ? usersMessageHistory[fromUserId] : undefined;
      const cbMessageId = ctx.callbackQuery.message?.message_id;
      const cbChatId = ctx.callbackQuery.message?.chat?.id !== undefined ? String(ctx.callbackQuery.message.chat.id) : undefined;

      if (history && cbMessageId !== undefined && cbChatId !== undefined) {
        const isLatestForUser = history.messageId === cbMessageId && String(history.chatId) === cbChatId;
        if (!isLatestForUser) {
          logFunctionStart('callback_dispatch.stale_guard.block', {
            userId: fromUserId,
            cbMessageId,
            cbChatId,
            latestMessageId: history.messageId,
            latestChatId: history.chatId
          });
          // Answer the callback to avoid spinner; inform user action expired
          await ctx.api.answerCallbackQuery(ctx.callbackQuery.id, { text: ctx.t('Action expired. Please use the latest message.') });
          logFunctionEnd('callback_dispatch.stale_guard.block', {}, { userId: fromUserId });
          return;
        }
      }

      await ctx.api.answerCallbackQuery(ctx.callbackQuery.id);

      const { dispatch } = await import('@/modules/core/smart-router');
      const { decodeAction } = await import('@/modules/core/route-alias');

      const context: HandlerContext = {
        ctx,
        user: {
          id: String(ctx.from?.id) as UserId,
          username: ctx.from?.username || 'Unknown'
        }
      };

      (context as HandlerContext & { _query?: Record<string, string> })._query = params;

      const fullRoute = decodeAction(action);
      await dispatch(fullRoute, context);

      logFunctionEnd('callback_dispatch', {}, { userId: String(ctx.from?.id || ''), action });
    } catch (error) {
      logError('callback_dispatch', error as Error, {});
      await ctx.api.answerCallbackQuery(ctx.callbackQuery.id, { text: ctx.t('❌ An error occurred. Please try again.') });
    }
  });
}


