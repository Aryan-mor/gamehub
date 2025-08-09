import { HandlerContext, createHandler } from '@/modules/core/handler';

export const key = 'games.poker.room.check';

async function handleCheck(context: HandlerContext): Promise<void> {
  const { ctx } = context;
  await ctx.replySmart(ctx.t('poker.game.action.check'));
}

export default createHandler(handleCheck);


