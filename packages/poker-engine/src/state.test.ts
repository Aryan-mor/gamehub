import { describe, it, expect } from 'vitest';
import { reconstructStateFromDb, computeAllowedActions, isBettingRoundComplete, progressStreet } from './state';

describe('engine.state helpers', () => {
  it('reconstructs state and computes allowed actions', () => {
    const state = reconstructStateFromDb({
      config: { smallBlind: 100, bigBlind: 200, maxPlayers: 2 },
      hand: {
        id: 'h1',
        street: 'preflop',
        button_pos: 0,
        acting_pos: 0,
        min_raise: 200,
        current_bet: 200,
        deck_seed: '42',
        board: [],
      },
      seats: [
        { hand_id: 'h1', seat_pos: 0, user_id: 'u1', stack: 10000, bet: 0, in_hand: true, is_all_in: false, hole: ['Ah', 'Ad'] as any },
        { hand_id: 'h1', seat_pos: 1, user_id: 'u2', stack: 10000, bet: 200, in_hand: true, is_all_in: false, hole: ['Kh', 'Kd'] as any },
      ],
      pots: [{ hand_id: 'h1', amount: 0, eligible_seats: [0, 1] }],
    });
    const allowed = computeAllowedActions(state, 0);
    expect(allowed.includes('CALL')).toBe(true);
    expect(allowed.includes('CHECK')).toBe(false);
  });

  it('detects betting round complete and progresses to flop with 3 cards', () => {
    const state = reconstructStateFromDb({
      config: { smallBlind: 100, bigBlind: 200, maxPlayers: 2 },
      hand: {
        id: 'h1',
        street: 'preflop',
        button_pos: 0,
        acting_pos: 1,
        min_raise: 200,
        current_bet: 200,
        deck_seed: '42',
        board: [],
      },
      seats: [
        { hand_id: 'h1', seat_pos: 0, user_id: 'u1', stack: 9800, bet: 200, in_hand: true, is_all_in: false, hole: ['Ah', 'Ad'] as any },
        { hand_id: 'h1', seat_pos: 1, user_id: 'u2', stack: 10000, bet: 200, in_hand: true, is_all_in: false, hole: ['Kh', 'Kd'] as any },
      ],
      pots: [{ hand_id: 'h1', amount: 200, eligible_seats: [0, 1] }],
    });
    const roundActions = [
      { seq: 1, type: 'CALL', actor_pos: 0 },
      { seq: 2, type: 'CALL', actor_pos: 1 },
    ];
    expect(isBettingRoundComplete(state, roundActions)).toBe(true);
    const { nextState, boardDelta } = progressStreet(state, '42');
    expect(nextState.street).toBe('flop');
    expect(boardDelta.length).toBe(3);
    expect(nextState.board.length).toBe(3);
  });
});


