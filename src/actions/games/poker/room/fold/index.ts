import { HandlerContext, createHandler } from '@/modules/core/handler';

export const key = 'games.poker.room.fold';

async function handleFold(context: HandlerContext): Promise<void> {
  const { ctx } = context;
  await ctx.replySmart(ctx.t('poker.game.action.fold'));
}

export default createHandler(handleFold);


