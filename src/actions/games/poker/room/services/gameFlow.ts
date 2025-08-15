import type { HandlerContext } from '@/modules/core/handler';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';
import { createHand } from './handRepo';
import { bulkCreateSeats, postBlind } from './seatsRepo';

async function updateSeatHoleCards(handId: string, seatPos: number, cards: [string, string]): Promise<void> {
  logFunctionStart('gameFlow.updateSeatHoleCards', { handId, seatPos, cards });
  try {
    const { supabaseFor } = await import('@/lib/supabase');
    const poker = supabaseFor('poker');
    const { error } = await poker
      .from('seats')
      .update({ hole: cards })
      .eq('hand_id', handId)
      .eq('seat_pos', seatPos);
    if (error) throw error;
    logFunctionEnd('gameFlow.updateSeatHoleCards', { ok: true });
  } catch (err) {
    logError('gameFlow.updateSeatHoleCards', err as Error, { handId, seatPos, cards });
    throw err;
  }
}
import { createAction } from './actionsRepo';
import { createMainPot } from './potsRepo';
import { getRoom } from './roomRepo';
import { startHand, type EngineConfig, type Seat } from '@gamehub/poker-engine';

export async function startHandForRoom(context: HandlerContext, roomId: string): Promise<void> {
  logFunctionStart('gameFlow.startHandForRoom', { roomId, userId: context.user.id });
  // Load room and players (user UUIDs) from DB
  const room = await getRoom(roomId);
  if (!room) {
    throw new Error('room_not_found');
  }
  const players = room.players;
  if (!players || players.length < 2) {
    throw new Error('not_enough_players');
  }

  // Blinds and positions
  const sb = Math.max(1, Number(room.smallBlind || 100));
  const len = players.length;
  const dealerPos = 0; // TODO: rotate based on previous hand
  const sbPos = len === 2 ? dealerPos : ((dealerPos + 1) % len);
  const bbPos = len === 2 ? ((dealerPos + 1) % len) : ((dealerPos + 2) % len);
  const bb = sb * 2;
  const actingPos = (bbPos + 1) % len; // UTG preflop (SB in HU)

  const hand = await createHand({
    roomId,
    buttonPos: dealerPos,
    street: 'preflop',
    actingPos,
    minRaise: bb,
    currentBet: bb,
    deckSeed: `${Date.now()}`,
  });

  // Create seats for all players with placeholder stacks
  const seatParams = players.map((userUuid, idx) => ({ handId: hand.id, seatPos: idx, userId: userUuid, stack: 10000 }));
  await bulkCreateSeats(seatParams);

  // Create main pot with all active seats
  await createMainPot(hand.id, players.map((_, idx) => idx));

  // Use poker-engine to start hand and deal cards
  const engineConfig: EngineConfig = {
    smallBlind: room.smallBlind,
    bigBlind: room.smallBlind * 2, // Big blind is always 2x small blind
    maxPlayers: room.maxPlayers,
    rngSeed: hand.deck_seed
  };

  const engineSeats: Seat[] = players.map((player, index) => ({
    seatPos: index,
    userRef: player,
    stack: 10000, // TODO: Get actual stack from database
    inHand: true,
    isAllIn: false,
    bet: 0
  }));

  const { events } = startHand(engineConfig, engineSeats);

  // Process events to deal cards and update database
  for (const event of events) {
    if (event.type === 'CARDS_DEALT') {
      const { privateTo, cards } = event;
      // Store cards in database
      await updateSeatHoleCards(hand.id, privateTo, cards);
    }
  }

  // Post blinds and record actions
  await postBlind(hand.id, sbPos, sb);
  await createAction({ handId: hand.id, seq: 1, actorPos: sbPos, type: 'POST_SB', amount: sb, resultingVersion: 1 });
  await postBlind(hand.id, bbPos, bb);
  await createAction({ handId: hand.id, seq: 2, actorPos: bbPos, type: 'POST_BB', amount: bb, resultingVersion: 2 });

  // Mark start of preflop betting round as a boundary for round-completion logic using DEAL
  await createAction({ handId: hand.id, seq: 3, actorPos: dealerPos, type: 'DEAL', resultingVersion: 2 });

  // Set room status to playing so info broadcast shows it
  try {
    const rooms = await import('@/api/rooms');
    const dbRoom: any = await rooms.getById(roomId);
    const uuid = (dbRoom && (dbRoom as any).id) as string | undefined;
    if (uuid) {
      await rooms.update(uuid, { status: 'playing' });
    } else {
      await rooms.update(roomId, { status: 'playing' });
    }
  } catch (e) {
    (context.ctx as any)?.log?.warn?.('gameFlow.startHandForRoom:updateRoomFailed', { roomId, err: (e as Error)?.message });
  }
  logFunctionEnd('gameFlow.startHandForRoom', { ok: true, roomId });
}


