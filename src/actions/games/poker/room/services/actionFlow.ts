import type { HandlerContext } from '@/modules/core/handler';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';

/**
 * Apply a CALL (or CHECK when toCall <= 0) for the acting user in the latest hand of the room.
 * Updates seats (bet/stack), pots (amount), hands (acting_pos/version), and records the action.
 */
export async function applyCallForUser(context: HandlerContext, roomId: string): Promise<{ ok: boolean; toCall: number; callAmount: number; nextPos: number } | void> {
  logFunctionStart('actionFlow.applyCallForUser', { roomId, userId: context.user.id });
  try {
    const { supabaseFor } = await import('@/lib/supabase');
    const poker = supabaseFor('poker');
    const usersApi = await import('@/api/users');
    const me = await usersApi.getByTelegramId(String(context.user.id));
    const userUuid = (me && (me as any).id) as string | undefined;
    if (!userUuid) {
      logFunctionEnd('actionFlow.applyCallForUser', { skipped: 'no_user_uuid' });
      return;
    }

    // Latest hand for room
    const { data: hands } = await poker
      .from('hands')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(1);
    const hand = hands && (hands[0] as any);
    if (!hand) {
      logFunctionEnd('actionFlow.applyCallForUser', { skipped: 'no_hand' });
      return;
    }
    const handId: string = String(hand.id);

    // Seats for hand
    const { data: seats } = await poker.from('seats').select('*').eq('hand_id', handId).order('seat_pos', { ascending: true });
    const mySeat = (seats || []).find((s: any) => String(s.user_id) === String(userUuid));
    if (!mySeat) {
      logFunctionEnd('actionFlow.applyCallForUser', { skipped: 'no_seat' });
      return;
    }
    // Must be acting
    if (Number(mySeat.seat_pos) !== Number(hand.acting_pos)) {
      logFunctionEnd('actionFlow.applyCallForUser', { skipped: 'not_acting' });
      return;
    }

    const currentBet = Number(hand.current_bet || 0);
    const myBet = Number(mySeat.bet || 0);
    const myStack = Number(mySeat.stack || 0);
    const toCall = Math.max(0, currentBet - myBet);
    const isCheck = toCall <= 0;
    const callAmount = isCheck ? 0 : Math.min(toCall, myStack);

    // Update seat bet/stack
    if (callAmount > 0) {
      // Update bet
      await poker
        .from('seats')
        .update({ bet: myBet + callAmount })
        .eq('hand_id', handId)
        .eq('seat_pos', mySeat.seat_pos);
      // Update stack and all-in flag if needed
      const newStack = Math.max(0, myStack - callAmount);
      await poker
        .from('seats')
        .update({ stack: newStack, is_all_in: newStack === 0 })
        .eq('hand_id', handId)
        .eq('seat_pos', mySeat.seat_pos);

      // Increment main pot by call amount (first pot)
      const { data: pots } = await poker.from('pots').select('*').eq('hand_id', handId).order('created_at', { ascending: true }).limit(1);
      const pot = pots && (pots[0] as any);
      if (pot) {
        await poker
          .from('pots')
          .update({ amount: Number(pot.amount || 0) + callAmount })
          .eq('id', pot.id);
      }
    }

    // Record action
    const { data: existingActions } = await poker.from('actions').select('*').eq('hand_id', handId);
    const seq = Array.isArray(existingActions) ? existingActions.length + 1 : 1;
    const resultingVersion = Number(hand.version || 0) + 1;
    await poker.from('actions').insert({
      hand_id: handId,
      seq,
      actor_pos: mySeat.seat_pos,
      type: isCheck ? 'CHECK' : 'CALL',
      amount: callAmount > 0 ? callAmount : null,
      resulting_version: resultingVersion,
    });

    // Advance acting_pos to next in-hand seat (simple circular)
    const orderedSeats: any[] = (seats || []).sort((a: any, b: any) => Number(a.seat_pos) - Number(b.seat_pos));
    let nextPos = Number(hand.acting_pos);
    const len = orderedSeats.length;
    for (let i = 0; i < len; i++) {
      nextPos = (nextPos + 1) % len;
      const s = orderedSeats[nextPos];
      if (s && s.in_hand && !s.is_all_in) break;
    }
    await poker.from('hands').update({ acting_pos: nextPos, version: resultingVersion }).eq('id', handId);

    // Verify acting_pos was actually updated in DB
    const { data: verifyHand } = await poker.from('hands').select('acting_pos, version').eq('id', handId);
    const verifiedHand = verifyHand && (verifyHand[0] as any);
    logFunctionStart('actionFlow.applyCallForUser.verification', { 
      handId, 
      nextPos, 
      resultingVersion,
      dbActingPos: verifiedHand?.acting_pos,
      dbVersion: verifiedHand?.version,
      match: verifiedHand?.acting_pos === nextPos && verifiedHand?.version === resultingVersion
    });

    // If betting round is complete, use engine to progress street and update DB
    try {
      const { data: acts } = await poker
        .from('actions')
        .select('seq,type,actor_pos')
        .eq('hand_id', handId)
        .order('seq', { ascending: true });

      const engine = await import('@gamehub/poker-engine');
      const { data: pots } = await poker.from('pots').select('*').eq('hand_id', handId);
      const engineState = engine.reconstructStateFromDb({
        config: { smallBlind: Number(hand.min_raise || 100) / 2, bigBlind: Number(hand.min_raise || 200), maxPlayers: orderedSeats.length },
        hand: {
          id: handId,
          street: String(hand.street || 'preflop') as any,
          button_pos: Number(hand.button_pos || 0),
          acting_pos: Number(hand.acting_pos || 0),
          min_raise: Number(hand.min_raise || 200),
          current_bet: Number(hand.current_bet || 0),
          deck_seed: String(hand.deck_seed || ''),
          board: Array.isArray(hand.board) ? (hand.board as string[]) : [],
        },
        seats: (seats || []).map((s: any) => ({
          hand_id: handId,
          seat_pos: Number(s.seat_pos),
          user_id: String(s.user_id),
          stack: Number(s.stack || 0),
          bet: Number(s.bet || 0),
          in_hand: Boolean(s.in_hand !== false),
          is_all_in: Boolean(s.is_all_in === true),
          hole: (s.hole as [string, string] | null) ?? null,
        })),
        pots: (pots || []).map((p: any) => ({ hand_id: handId, amount: Number(p.amount || 0), eligible_seats: Array.isArray(p.eligible_seats) ? p.eligible_seats : [] })),
      });

      const lastBoundaryIdx = (() => {
        let idx = -1;
        (acts || []).forEach((a: any, i: number) => { if (a?.type === 'DEAL') idx = i; });
        return idx;
      })();
      const roundActions = (acts || []).slice(lastBoundaryIdx + 1) as Array<{ seq: number; type: string; actor_pos?: number }>; 
      const roundDone = engine.isBettingRoundComplete(engineState, roundActions);
      if (roundDone) {
        const { nextState } = engine.progressStreet(engineState, String(hand.deck_seed || Date.now()));
        // Reset bets for new betting round
        await poker.from('seats').update({ bet: 0 }).eq('hand_id', handId);
        // Update hands: street, board, acting_pos, current_bet
        await poker
          .from('hands')
          .update({ street: nextState.street, board: nextState.board, acting_pos: nextState.actingPos, current_bet: nextState.currentBet })
          .eq('id', handId);
        // Insert DEAL boundary if not showdown
        if (nextState.street !== 'showdown') {
          const { data: last } = await poker.from('actions').select('seq').eq('hand_id', handId).order('seq', { ascending: false }).limit(1);
          const nextSeq = Array.isArray(last) && (last as any[])[0]?.seq ? Number((last as any[])[0].seq) + 1 : seq + 1;
          await poker.from('actions').insert({ hand_id: handId, seq: nextSeq, type: 'DEAL' });
        }
      }
    } catch (e) {
      logError('actionFlow.applyCallForUser.roundEndCheck', e as Error, { handId });
    }

    const result = { ok: true, toCall, callAmount, nextPos };
    logFunctionEnd('actionFlow.applyCallForUser', result);
    return result;
  } catch (err) {
    logError('actionFlow.applyCallForUser', err as Error, { roomId, userId: context.user.id });
  }
}

/**
 * Apply a RAISE for the acting user in the latest hand of the room.
 */
export async function applyRaiseForUser(context: HandlerContext, roomId: string, raiseAmount: number): Promise<void> {
  logFunctionStart('actionFlow.applyRaiseForUser', { roomId, userId: context.user.id, raiseAmount });
  try {
    const { supabaseFor } = await import('@/lib/supabase');
    const poker = supabaseFor('poker');
    const usersApi = await import('@/api/users');
    const me = await usersApi.getByTelegramId(String(context.user.id));
    const userUuid = (me && (me as any).id) as string | undefined;
    if (!userUuid) return;

    const { data: hands } = await poker.from('hands').select('*').eq('room_id', roomId).order('created_at', { ascending: false }).limit(1);
    const hand = hands && (hands[0] as any);
    if (!hand) return;
    const handId: string = String(hand.id);

    const { data: seats } = await poker.from('seats').select('*').eq('hand_id', handId).order('seat_pos', { ascending: true });
    const mySeat = (seats || []).find((s: any) => String(s.user_id) === String(userUuid));
    if (!mySeat) return;
    if (Number(mySeat.seat_pos) !== Number(hand.acting_pos)) return;

    // Use engine to validate and compute new state locally
    const engine = await import('@gamehub/poker-engine');
    const { data: pots } = await poker.from('pots').select('*').eq('hand_id', handId);
    const engineState = engine.reconstructStateFromDb({
      config: { smallBlind: Number(hand.min_raise || 100) / 2, bigBlind: Number(hand.min_raise || 200), maxPlayers: (seats || []).length },
      hand: {
        id: handId,
        street: String(hand.street || 'preflop') as any,
        button_pos: Number(hand.button_pos || 0),
        acting_pos: Number(hand.acting_pos || 0),
        min_raise: Number(hand.min_raise || 200),
        current_bet: Number(hand.current_bet || 0),
        deck_seed: String(hand.deck_seed || ''),
        board: Array.isArray(hand.board) ? (hand.board as string[]) : [],
      },
      seats: (seats || []).map((s: any) => ({
        hand_id: handId,
        seat_pos: Number(s.seat_pos),
        user_id: String(s.user_id),
        stack: Number(s.stack || 0),
        bet: Number(s.bet || 0),
        in_hand: Boolean(s.in_hand !== false),
        is_all_in: Boolean(s.is_all_in === true),
        hole: (s.hole as [string, string] | null) ?? null,
      })),
      pots: (pots || []).map((p: any) => ({ hand_id: handId, amount: Number(p.amount || 0), eligible_seats: Array.isArray(p.eligible_seats) ? p.eligible_seats : [] })),
    });

    // Apply raise in engine (throws on invalid)
    const pos = Number(mySeat.seat_pos);
    engine.applyAction(engineState, pos, { type: 'RAISE', amount: Number(raiseAmount) });

    // Persist DB deltas: similar به CALL ولی با raiseAmount
    const currentBet = Number(hand.current_bet || 0);
    const myBet = Number(mySeat.bet || 0);
    const toCall = Math.max(0, currentBet - myBet);
    const total = toCall + Number(raiseAmount);
    const newBet = myBet + total;
    const newStack = Math.max(0, Number(mySeat.stack || 0) - total);

    await poker.from('seats').update({ bet: newBet }).eq('hand_id', handId).eq('seat_pos', mySeat.seat_pos);
    await poker.from('seats').update({ stack: newStack, is_all_in: newStack === 0 }).eq('hand_id', handId).eq('seat_pos', mySeat.seat_pos);
    const { data: firstPotRows } = await poker.from('pots').select('*').eq('hand_id', handId).order('created_at', { ascending: true }).limit(1);
    const firstPot = firstPotRows && (firstPotRows[0] as any);
    if (firstPot) {
      await poker.from('pots').update({ amount: Number(firstPot.amount || 0) + total }).eq('id', firstPot.id);
    }
    const { data: existingActions } = await poker.from('actions').select('*').eq('hand_id', handId);
    const seq = Array.isArray(existingActions) ? existingActions.length + 1 : 1;
    await poker.from('actions').insert({ hand_id: handId, seq, actor_pos: mySeat.seat_pos, type: 'RAISE', amount: Number(raiseAmount), resulting_version: Number(hand.version || 0) + 1 });
    // Update table state
    await poker.from('hands').update({ acting_pos: (pos + 1) % (seats || []).length, current_bet: newBet, min_raise: Math.max(Number(hand.min_raise || 200), Number(raiseAmount)) }).eq('id', handId);

    // Progress round if needed (reuse existing logic)
    await applyCallForUser(context, roomId); // noop path will run round-complete check
  } catch (err) {
    logError('actionFlow.applyRaiseForUser', err as Error, { roomId, userId: context.user.id });
  }
}

/**
 * Apply a FOLD for the acting user in the latest hand of the room.
 */
export async function applyFoldForUser(context: HandlerContext, roomId: string): Promise<void> {
  logFunctionStart('actionFlow.applyFoldForUser', { roomId, userId: context.user.id });
  try {
    const { supabaseFor } = await import('@/lib/supabase');
    const poker = supabaseFor('poker');
    const usersApi = await import('@/api/users');
    const me = await usersApi.getByTelegramId(String(context.user.id));
    const userUuid = (me && (me as any).id) as string | undefined;
    if (!userUuid) {
      logFunctionEnd('actionFlow.applyFoldForUser', { skipped: 'no_user_uuid' });
      return;
    }

    const { data: hands } = await poker.from('hands').select('*').eq('room_id', roomId).order('created_at', { ascending: false }).limit(1);
    const hand = hands && (hands[0] as any);
    if (!hand) {
      logFunctionEnd('actionFlow.applyFoldForUser', { skipped: 'no_hand' });
      return;
    }
    const handId: string = String(hand.id);
    const { data: seats } = await poker.from('seats').select('*').eq('hand_id', handId).order('seat_pos', { ascending: true });
    const mySeat = (seats || []).find((s: any) => String(s.user_id) === String(userUuid));
    if (!mySeat) {
      logFunctionEnd('actionFlow.applyFoldForUser', { skipped: 'no_seat' });
      return;
    }
    if (Number(mySeat.seat_pos) !== Number(hand.acting_pos)) {
      logFunctionEnd('actionFlow.applyFoldForUser', { skipped: 'not_acting' });
      return;
    }

    // Mark out of hand
    await poker
      .from('seats')
      .update({ in_hand: false })
      .eq('hand_id', handId)
      .eq('seat_pos', mySeat.seat_pos);

    // Record fold action
    const { data: existingActions } = await poker.from('actions').select('*').eq('hand_id', handId);
    const seq = Array.isArray(existingActions) ? existingActions.length + 1 : 1;
    const resultingVersion = Number(hand.version || 0) + 1;
    await poker.from('actions').insert({
      hand_id: handId,
      seq,
      actor_pos: mySeat.seat_pos,
      type: 'FOLD',
      resulting_version: resultingVersion,
    });

    // Advance acting_pos to next active seat
    const orderedSeats: any[] = (seats || []).sort((a: any, b: any) => Number(a.seat_pos) - Number(b.seat_pos));
    let nextPos = Number(hand.acting_pos);
    const len = orderedSeats.length;
    for (let i = 0; i < len; i++) {
      nextPos = (nextPos + 1) % len;
      const s = orderedSeats[nextPos];
      if (s && s.in_hand && !s.is_all_in) break;
    }
    await poker.from('hands').update({ acting_pos: nextPos, version: resultingVersion }).eq('id', handId);

    logFunctionEnd('actionFlow.applyFoldForUser', { ok: true, nextPos });
  } catch (err) {
    logError('actionFlow.applyFoldForUser', err as Error, { roomId, userId: context.user.id });
  }
}


