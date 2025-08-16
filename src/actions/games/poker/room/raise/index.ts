import { HandlerContext, createHandler } from '@/modules/core/handler';
import { getActiveRoomId, setActiveRoomId } from '@/modules/core/userRoomState';

export const key = 'games.poker.room.raise';

async function handleRaise(context: HandlerContext): Promise<void> {
  const { ctx, user } = context;
  const NS = 'poker.info';
  let roomId = context._query?.r || context._query?.roomId || getActiveRoomId(String(user.id)) || '';
  if (!roomId) {
    const saved = ctx.formState?.get<{ roomId?: string }>(NS, user.id);
    roomId = saved?.roomId || '';
  }
  if (roomId) {
    ctx.formState?.set?.(NS, user.id, { roomId });
    setActiveRoomId(user.id, roomId);
  }

  const amountRaw = context._query?.a;
  const amount = Number(amountRaw);
  const callbackVersionRaw = context._query?.v;
  const callbackVersion = Number(callbackVersionRaw);

  // Guard: only acting player can raise
  const ensureActing = async (): Promise<boolean> => {
    try {
      const usersApi = await import('@/api/users');
      const me = await usersApi.getByTelegramId(String(context.user.id));
      const userUuid = (me && (me as any).id) as string | undefined;
      if (!roomId || !userUuid) return false;
      const { supabaseFor } = await import('@/lib/supabase');
      const poker = supabaseFor('poker');
      const { data: hands } = await poker
        .from('hands')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(1);
      const hand = hands && (hands[0] as any);
      if (!hand) return false;
      const handId: string = String(hand.id);
      const { data: seats } = await poker
        .from('seats')
        .select('seat_pos,user_id')
        .eq('hand_id', handId)
        .order('seat_pos', { ascending: true });
      const mySeat = (seats || []).find((s: any) => String(s.user_id) === String(userUuid));
      return Number(mySeat?.seat_pos) === Number(hand.acting_pos);
    } catch {
      return false;
    }
  };

  // If no valid amount provided, show quick-raise options (dynamic by min_raise if available)
  if (!roomId || !Number.isFinite(amount) || amount <= 0) {
    const isActing = await ensureActing();
    if (!isActing) {
      (ctx as any).callbackToastText = ctx.t('poker.middleware.error.notYourTurn') || 'Not your turn';
      try {
        const { broadcastRoomInfo } = await import('../services/roomService');
        await broadcastRoomInfo(ctx, roomId || '');
      } catch {}
      return;
    }
    let minRaise = 0;
    let currentVersion = 0;
    try {
      const { supabaseFor } = await import('@/lib/supabase');
      const poker = supabaseFor('poker');
      const { data: hands } = await poker
        .from('hands')
        .select('id,min_raise,version')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(1);
      const hand = hands && (hands[0] as any);
      minRaise = Number(hand?.min_raise || 0);
      currentVersion = Number(hand?.version || 0);
    } catch {
      // ignore; fallback to defaults
    }
    const options = Number.isFinite(minRaise) && minRaise > 0
      ? [minRaise, minRaise * 2, minRaise * 3, minRaise * 4]
      : [10, 25, 50, 100];
    const kb = [
      [
        { text: ctx.t('poker.actions.raisePlus', { amount: options[0] }), callback_data: `g.pk.r.rs?r=${roomId}&a=${options[0]}&v=${currentVersion}` },
        { text: ctx.t('poker.actions.raisePlus', { amount: options[1] }), callback_data: `g.pk.r.rs?r=${roomId}&a=${options[1]}&v=${currentVersion}` },
      ],
      [
        { text: ctx.t('poker.actions.raisePlus', { amount: options[2] }), callback_data: `g.pk.r.rs?r=${roomId}&a=${options[2]}&v=${currentVersion}` },
        { text: ctx.t('poker.actions.raisePlus', { amount: options[3] }), callback_data: `g.pk.r.rs?r=${roomId}&a=${options[3]}&v=${currentVersion}` },
      ],
      [
        { text: ctx.t('bot.buttons.refresh'), callback_data: `g.pk.r.in?r=${roomId}` }
      ]
    ];
    await ctx.replySmart(ctx.t('poker.room.info.title'), {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: kb as any }
    });
    return;
  }

  try {
    const isActing = await ensureActing();
    if (!isActing) {
      (ctx as any).callbackToastText = ctx.t('poker.middleware.error.notYourTurn') || 'Not your turn';
      const { broadcastRoomInfo } = await import('../services/roomService');
      await broadcastRoomInfo(ctx, roomId);
      return;
    }
    // Stale guard: verify hand version if provided
    if (Number.isFinite(callbackVersion)) {
      try {
        const { supabaseFor } = await import('@/lib/supabase');
        const poker = supabaseFor('poker');
        const { data: hands } = await poker
          .from('hands')
          .select('version')
          .eq('room_id', roomId)
          .order('created_at', { ascending: false })
          .limit(1);
        const dbVersion = Number((hands && (hands[0] as any)?.version) || 0);
        if (dbVersion !== callbackVersion) {
          (ctx as any).callbackToastText = ctx.t('Action expired. Please use the latest message.');
          const { broadcastRoomInfo } = await import('../services/roomService');
          await broadcastRoomInfo(ctx, roomId);
          return;
        }
      } catch {
        // ignore, best-effort guard
      }
    }
    const { applyRaiseForUser } = await import('../services/actionFlow');
    await applyRaiseForUser(context, roomId, amount);
  } catch (err) {
    // Surface a toast explaining the error (e.g., raise_below_min)
    (ctx as any).callbackToastText = ctx.t('poker.error.raise', { error: (err as Error)?.message || 'error' });
  }
  try {
    const { broadcastRoomInfo } = await import('../services/roomService');
    await broadcastRoomInfo(ctx, roomId);
  } catch {}
}

export default createHandler(handleRaise);


