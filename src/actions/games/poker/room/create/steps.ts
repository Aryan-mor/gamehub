import { HandlerContext, createHandler } from '@/modules/core/handler';
import { setActiveRoomId } from '@/modules/core/userRoomState';
import { createRoom } from '../../services/roomStore';

const NS = 'poker.room.create';

interface CreateState {
  isPrivate?: boolean;
  maxPlayers?: number;
  smallBlind?: number;
}

export async function handleCreateFlow(context: HandlerContext, query: Record<string, string>): Promise<void> {
  const { ctx, user } = context;
  const state = (ctx.formState.get<CreateState>(NS, user.id) ?? {}) as CreateState;

  const s = query.s;
  const v = query.v;

  if (!s) return; // initial screen handled by index.ts

  if (s === 'privacy') {
    state.isPrivate = v === 'true';
    ctx.formState.set(NS, user.id, state);
    const ROUTES = (await import('@/modules/core/routes.generated')).ROUTES;
    const templates = {
      p2: { text: ctx.t('poker.form.option.players2'), callback_data: ctx.keyboard.buildCallbackData(ROUTES.games.poker.room.create, { s: 'maxPlayers', v: '2' }) },
      p4: { text: ctx.t('poker.form.option.players4'), callback_data: ctx.keyboard.buildCallbackData(ROUTES.games.poker.room.create, { s: 'maxPlayers', v: '4' }) },
      p6: { text: ctx.t('poker.form.option.players6'), callback_data: ctx.keyboard.buildCallbackData(ROUTES.games.poker.room.create, { s: 'maxPlayers', v: '6' }) },
      p8: { text: ctx.t('poker.form.option.players8'), callback_data: ctx.keyboard.buildCallbackData(ROUTES.games.poker.room.create, { s: 'maxPlayers', v: '8' }) },
    } as const;
    const keyboard = ctx.keyboard.createCustomKeyboard([
      ['p2', 'p4'],
      ['p6', 'p8'],
    ], templates as Record<string, { text: string; callback_data: string }>);
    await ctx.replySmart(ctx.t('poker.form.step2.playerCount'), { parse_mode: 'HTML', reply_markup: keyboard });
    return;
  }

  if (s === 'maxPlayers') {
    state.maxPlayers = Number(v);
    ctx.formState.set(NS, user.id, state);
    const ROUTES2 = (await import('@/modules/core/routes.generated')).ROUTES;
    const templates = {
      sb100: { text: ctx.t('poker.form.option.sb100'), callback_data: ctx.keyboard.buildCallbackData(ROUTES2.games.poker.room.create, { s: 'smallBlind', v: '100' }) },
      sb200: { text: ctx.t('poker.form.option.sb200'), callback_data: ctx.keyboard.buildCallbackData(ROUTES2.games.poker.room.create, { s: 'smallBlind', v: '200' }) },
      sb400: { text: ctx.t('poker.form.option.sb400'), callback_data: ctx.keyboard.buildCallbackData(ROUTES2.games.poker.room.create, { s: 'smallBlind', v: '400' }) },
      sb800: { text: ctx.t('poker.form.option.sb800'), callback_data: ctx.keyboard.buildCallbackData(ROUTES2.games.poker.room.create, { s: 'smallBlind', v: '800' }) },
    } as const;
    const keyboard = ctx.keyboard.createCustomKeyboard([
      ['sb100', 'sb200'],
      ['sb400', 'sb800'],
    ], templates as Record<string, { text: string; callback_data: string }>);
    await ctx.replySmart(ctx.t('poker.form.step3.smallBlind'), { parse_mode: 'HTML', reply_markup: keyboard });
    return;
  }

  if (s === 'smallBlind') {
    state.smallBlind = Number(v);
    ctx.formState.set(NS, user.id, state);
    // Create room (in-memory) and set active
    const roomId = `room_${Date.now()}_${user.id}`;
    createRoom({ id: roomId, isPrivate: !!state.isPrivate, maxPlayers: state.maxPlayers ?? 2, smallBlind: state.smallBlind ?? 100, createdBy: user.id });
    setActiveRoomId(user.id, roomId);

    const ROUTES3 = (await import('@/modules/core/routes.generated')).ROUTES;
    const templates = {
      share: { text: ctx.t('poker.room.buttons.share'), callback_data: ctx.keyboard.buildCallbackData(ROUTES3.games.poker.findRoom, { s: 'share' }) },
      back: { text: ctx.t('poker.room.buttons.backToMenu'), callback_data: ctx.keyboard.buildCallbackData(ROUTES3.games.poker.start) },
    } as const;
    const keyboard = ctx.keyboard.createCustomKeyboard([
      ['share'],
      ['back'],
    ], templates as Record<string, { text: string; callback_data: string }>);

    await ctx.replySmart(ctx.t('poker.form.step4.created'), { parse_mode: 'HTML', reply_markup: keyboard });
    return;
  }
}

export default createHandler(handleCreateFlow);


