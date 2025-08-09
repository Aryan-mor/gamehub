import { HandlerContext, createHandler } from '@/modules/core/handler';
import handleCreateFlow from './steps';

export const key = 'games.poker.room.create';

async function handle(context: HandlerContext): Promise<void> {
  const { ctx } = context;
  const q = (context as HandlerContext & { _query?: Record<string, string> })._query || {};
  if (q.s && q.v) {
    await handleCreateFlow(context, q);
    return;
  }

  const ROUTES = (await import('@/modules/core/routes.generated')).ROUTES;
  const templates = {
    public: { text: ctx.t('poker.form.option.public'), callback_data: ctx.keyboard.buildCallbackData(ROUTES.games.poker.room.create, { s: 'privacy', v: 'false' }) },
    private: { text: ctx.t('poker.form.option.private'), callback_data: ctx.keyboard.buildCallbackData(ROUTES.games.poker.room.create, { s: 'privacy', v: 'true' }) },
    back: { text: ctx.t('poker.room.buttons.back'), callback_data: ctx.keyboard.buildCallbackData(ROUTES.games.poker.start) },
  } as const;

  const keyboard = ctx.keyboard.createCustomKeyboard([
    ['public', 'private'],
    ['back'],
  ], templates as Record<string, { text: string; callback_data: string }>);

  await ctx.replySmart(ctx.t('poker.form.step1.roomType'), {
    parse_mode: 'HTML',
    reply_markup: keyboard,
  });
}

export default createHandler(handle);
export { default as handleCreateFlow } from './steps';
