import { describe, it, expect } from 'vitest';
import type { EngineState, PlayerAction, Seat } from './index';
import { applyAction } from './index';

function createState(partial?: Partial<EngineState>): EngineState {
  const seats: Seat[] = [
    { seatPos: 0, userRef: 'u1', stack: 10000, inHand: true, isAllIn: false, bet: 0 },
    { seatPos: 1, userRef: 'u2', stack: 10000, inHand: true, isAllIn: false, bet: 0 },
  ];
  return {
    handId: 'h1',
    street: 'preflop',
    dealerPos: 0,
    smallBlindPos: 0,
    bigBlindPos: 1,
    actingPos: 0,
    minRaise: 200,
    currentBet: 200,
    pots: [{ amount: 0, eligible: [0, 1] }],
    board: [],
    seats,
    ...(partial ?? {})
  };
}

describe('poker-engine.applyAction', () => {
  it('CALL: matches current bet, decreases stack, increases pot, advances acting', () => {
    const state = createState({
      actingPos: 0,
      currentBet: 200,
      seats: [
        { seatPos: 0, userRef: 'u1', stack: 10000, inHand: true, isAllIn: false, bet: 0 },
        { seatPos: 1, userRef: 'u2', stack: 10000, inHand: true, isAllIn: false, bet: 200 },
      ]
    });

    const action: PlayerAction = { type: 'CALL' };
    const { nextState, events } = applyAction(state, 0, action);

    // Seat 0 calls 200
    expect(nextState.seats[0].bet).toBe(200);
    expect(nextState.seats[0].stack).toBe(9800);
    expect(nextState.pots[0].amount).toBe(200);
    // Acting advances to next seat (1)
    expect(nextState.actingPos).toBe(1);
    // Event emitted with toCall
    const evt = events.find((e) => e.type === 'ACTION_APPLIED');
    expect(evt).toBeDefined();
    if (evt && evt.type === 'ACTION_APPLIED') {
      expect(evt.pos).toBe(0);
      expect(evt.action.type).toBe('CALL');
      expect(evt.toCall).toBe(200);
    }
  });

  it('CHECK: allowed when toCall == 0 and advances acting', () => {
    const state = createState({
      currentBet: 0,
      actingPos: 0,
      seats: [
        { seatPos: 0, userRef: 'u1', stack: 10000, inHand: true, isAllIn: false, bet: 0 },
        { seatPos: 1, userRef: 'u2', stack: 10000, inHand: true, isAllIn: false, bet: 0 },
      ]
    });

    const action: PlayerAction = { type: 'CHECK' };
    const { nextState, events } = applyAction(state, 0, action);
    expect(nextState.seats[0].bet).toBe(0);
    expect(nextState.seats[0].stack).toBe(10000);
    expect(nextState.actingPos).toBe(1);
    const evt = events.find((e) => e.type === 'ACTION_APPLIED');
    expect(evt).toBeDefined();
  });

  it('CHECK: throws when toCall > 0', () => {
    const state = createState({
      currentBet: 200,
      actingPos: 0,
      seats: [
        { seatPos: 0, userRef: 'u1', stack: 10000, inHand: true, isAllIn: false, bet: 0 },
        { seatPos: 1, userRef: 'u2', stack: 10000, inHand: true, isAllIn: false, bet: 200 },
      ]
    });

    expect(() => applyAction(state, 0, { type: 'CHECK' })).toThrowError();
  });

  it('RAISE: increases currentBet and minRaise, advances acting', () => {
    const state = createState({
      actingPos: 0,
      currentBet: 200,
      minRaise: 200,
      seats: [
        { seatPos: 0, userRef: 'u1', stack: 10000, inHand: true, isAllIn: false, bet: 0 },
        { seatPos: 1, userRef: 'u2', stack: 10000, inHand: true, isAllIn: false, bet: 200 },
      ]
    });
    const { nextState } = applyAction(state, 0, { type: 'RAISE', amount: 200 });
    expect(nextState.currentBet).toBe(400);
    expect(nextState.minRaise).toBeGreaterThanOrEqual(200);
    expect(nextState.actingPos).toBe(1);
  });

  it('ALL_IN: moves all stack, may update currentBet, marks all-in', () => {
    const state = createState({
      actingPos: 0,
      currentBet: 200,
      minRaise: 200,
      seats: [
        { seatPos: 0, userRef: 'u1', stack: 500, inHand: true, isAllIn: false, bet: 0 },
        { seatPos: 1, userRef: 'u2', stack: 10000, inHand: true, isAllIn: false, bet: 200 },
      ]
    });
    const { nextState } = applyAction(state, 0, { type: 'ALL_IN' });
    expect(nextState.seats[0].stack).toBe(0);
    expect(nextState.seats[0].isAllIn).toBe(true);
    expect(nextState.actingPos).toBe(1);
  });
});



