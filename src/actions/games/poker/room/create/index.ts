import { HandlerContext, createHandler } from '@/modules/core/handler';

export const key = 'games.poker.room.create';

async function handle(context: HandlerContext): Promise<void> {
  const { ctx } = context;
  await ctx.replySmart(ctx.t('bot.start.welcome'));
}

export default createHandler(handle);
