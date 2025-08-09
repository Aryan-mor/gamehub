import { HandlerContext, createHandler } from '@/modules/core/handler';

export const key = 'games.poker.room.call';

async function handleCall(context: HandlerContext): Promise<void> {
  const { ctx } = context;
  await ctx.replySmart(ctx.t('poker.game.action.call'));
}

export default createHandler(handleCall);


