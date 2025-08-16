import type { GameHubContext } from '@/plugins';

export interface EngineContext {
  handId?: string;
  engineState?: any;
  seatInfoByUser: Record<string, { stack: number; bet: number; hole?: string[] | null; inHand: boolean }>;
  potTotal?: number;
  actingUuid?: string;
  currentBetGlobal: number;
  seatPosByUuid: Record<string, number>;
  boardCards: string[];
  isShowdown: boolean;
}

export async function buildEngineContext(
  ctxApp: GameHubContext,
  roomId: string,
  room: { smallBlind?: number; maxPlayers?: number },
  overrideActingPos?: number
): Promise<EngineContext> {
  const ctx: EngineContext = {
    seatInfoByUser: {},
    currentBetGlobal: 0,
    seatPosByUuid: {},
    boardCards: [],
    isShowdown: false,
  };

  const { supabaseFor } = await import('@/lib/supabase');
  const poker = supabaseFor('poker');
  const { data: hands } = await poker.from('hands').select('*').eq('room_id', roomId).order('created_at', { ascending: false }).limit(1);
  const hand = hands && (hands[0] as any);
  const handId = hand?.id as string | undefined;
  ctx.handId = handId;
  ctx.isShowdown = String(hand?.street || '') === 'showdown';
  ctxApp.log?.debug?.('roomService.handFromDb', {
    roomId,
    handId,
    acting_pos: hand?.acting_pos,
    street: hand?.street,
    current_bet: hand?.current_bet,
    version: hand?.version
  });
  ctx.boardCards = Array.isArray(hand?.board) ? (hand?.board as string[]) : [];
  if (!handId) return ctx;

  const { listSeatsByHand } = await import('./seatsRepo');
  const seats = await listSeatsByHand(String(handId));
  for (const s of seats) ctx.seatInfoByUser[s.user_id] = { stack: s.stack, bet: s.bet, hole: s.hole, inHand: s.in_hand === true };
  const actingPos = overrideActingPos !== undefined ? overrideActingPos : Number(hand?.acting_pos || 0);
  if (typeof actingPos === 'number') {
    const actingSeat = seats.find((s) => Number(s.seat_pos) === actingPos);
    ctx.actingUuid = actingSeat?.user_id;
  }
  const { data: pots } = await poker.from('pots').select('*').eq('hand_id', handId);
  ctx.potTotal = (pots || []).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
  ctx.currentBetGlobal = Number(hand?.current_bet || 0);
  ctx.seatPosByUuid = Object.fromEntries(seats.map((s: any) => [String(s.user_id), Number(s.seat_pos)]));

  try {
    const engine = await import('@gamehub/poker-engine');
    const handForEngine = {
      id: String(handId),
      street: String(hand?.street || 'preflop') as any,
      button_pos: Number(hand?.button_pos || 0),
      acting_pos: overrideActingPos !== undefined ? overrideActingPos : Number(hand?.acting_pos || 0),
      min_raise: Number(hand?.min_raise || Number(room.smallBlind || 100) * 2),
      current_bet: Number(hand?.current_bet || 0),
      deck_seed: String(hand?.deck_seed || ''),
      board: Array.isArray(hand?.board) ? (hand?.board as string[]) : [],
    };
    ctxApp.log?.debug?.('roomService.handForEngine', {
      roomId,
      handId,
      acting_pos: handForEngine.acting_pos,
      street: handForEngine.street,
      current_bet: handForEngine.current_bet
    });
    ctx.engineState = engine.reconstructStateFromDb({
      config: { smallBlind: Number(room.smallBlind || 100), bigBlind: Number(room.smallBlind || 100) * 2, maxPlayers: Number(room.maxPlayers || seats.length || 2) },
      hand: handForEngine,
      seats: seats.map((s: any) => ({
        hand_id: String(handId),
        seat_pos: Number(s.seat_pos),
        user_id: String(s.user_id),
        stack: Number(s.stack || 0),
        bet: Number(s.bet || 0),
        in_hand: Boolean(s.in_hand !== false),
        is_all_in: Boolean(s.is_all_in === true),
        hole: (s.hole as string[] | null) as any,
      })),
      pots: (pots as any[])?.map((p: any) => ({ hand_id: String(handId), amount: Number(p.amount || 0), eligible_seats: Array.isArray(p.eligible_seats) ? p.eligible_seats : [] })) || [],
    });
    ctxApp.log?.debug?.('roomService.engineState', {
      roomId,
      street: ctx.engineState?.street,
      actingPos: ctx.engineState?.actingPos,
      actingUuid: ctx.actingUuid,
      board: ctx.engineState?.board,
      currentBet: ctx.engineState?.currentBet
    });
  } catch {}

  return ctx;
}


