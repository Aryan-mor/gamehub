import { Bot } from 'grammy';
import { GameHubContext } from '@/plugins';
import { HandlerContext } from '@/modules/core/handler';
import { UserId } from '@/utils/types';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';

export function registerStartCommand(bot: Bot<GameHubContext>): void {
  bot.command('start', async (ctx) => {
    try {
      const userId = String(ctx.from?.id || '');
      const username = ctx.from?.username;
      const startPayload = ctx.message?.text?.split(' ')[1];

      ctx.log?.info?.('START command received', { userId, username, text: ctx.message?.text, startPayload });
      logFunctionStart('startCommand', { userId, startPayload });

      // Use auto-discovery router for regular start action
      const { dispatch } = await import('@/modules/core/smart-router');
      const context: HandlerContext = {
        ctx,
        user: {
          id: userId as UserId,
          username: username || 'Unknown'
        }
      };
      await dispatch('start', context);

      logFunctionEnd('startCommand', {}, { userId, action: 'regular' });
    } catch (error) {
      logError('startCommand', error as Error, {});
      await ctx.replySmart(ctx.t('bot.start.welcome'));
    }
  });
}


