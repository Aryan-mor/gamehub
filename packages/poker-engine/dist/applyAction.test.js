"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const index_1 = require("./index");
function createState(partial) {
    const seats = [
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
(0, vitest_1.describe)('poker-engine.applyAction', () => {
    (0, vitest_1.it)('CALL: matches current bet, decreases stack, increases pot, advances acting', () => {
        const state = createState({
            actingPos: 0,
            currentBet: 200,
            seats: [
                { seatPos: 0, userRef: 'u1', stack: 10000, inHand: true, isAllIn: false, bet: 0 },
                { seatPos: 1, userRef: 'u2', stack: 10000, inHand: true, isAllIn: false, bet: 200 },
            ]
        });
        const action = { type: 'CALL' };
        const { nextState, events } = (0, index_1.applyAction)(state, 0, action);
        (0, vitest_1.expect)(nextState.seats[0].bet).toBe(200);
        (0, vitest_1.expect)(nextState.seats[0].stack).toBe(9800);
        (0, vitest_1.expect)(nextState.pots[0].amount).toBe(200);
        (0, vitest_1.expect)(nextState.actingPos).toBe(1);
        const evt = events.find((e) => e.type === 'ACTION_APPLIED');
        (0, vitest_1.expect)(evt).toBeDefined();
        if (evt && evt.type === 'ACTION_APPLIED') {
            (0, vitest_1.expect)(evt.pos).toBe(0);
            (0, vitest_1.expect)(evt.action.type).toBe('CALL');
            (0, vitest_1.expect)(evt.toCall).toBe(200);
        }
    });
    (0, vitest_1.it)('CHECK: allowed when toCall == 0 and advances acting', () => {
        const state = createState({
            currentBet: 0,
            actingPos: 0,
            seats: [
                { seatPos: 0, userRef: 'u1', stack: 10000, inHand: true, isAllIn: false, bet: 0 },
                { seatPos: 1, userRef: 'u2', stack: 10000, inHand: true, isAllIn: false, bet: 0 },
            ]
        });
        const action = { type: 'CHECK' };
        const { nextState, events } = (0, index_1.applyAction)(state, 0, action);
        (0, vitest_1.expect)(nextState.seats[0].bet).toBe(0);
        (0, vitest_1.expect)(nextState.seats[0].stack).toBe(10000);
        (0, vitest_1.expect)(nextState.actingPos).toBe(1);
        const evt = events.find((e) => e.type === 'ACTION_APPLIED');
        (0, vitest_1.expect)(evt).toBeDefined();
    });
    (0, vitest_1.it)('CHECK: throws when toCall > 0', () => {
        const state = createState({
            currentBet: 200,
            actingPos: 0,
            seats: [
                { seatPos: 0, userRef: 'u1', stack: 10000, inHand: true, isAllIn: false, bet: 0 },
                { seatPos: 1, userRef: 'u2', stack: 10000, inHand: true, isAllIn: false, bet: 200 },
            ]
        });
        (0, vitest_1.expect)(() => (0, index_1.applyAction)(state, 0, { type: 'CHECK' })).toThrowError();
    });
    (0, vitest_1.it)('RAISE: increases currentBet and minRaise, advances acting', () => {
        const state = createState({
            actingPos: 0,
            currentBet: 200,
            minRaise: 200,
            seats: [
                { seatPos: 0, userRef: 'u1', stack: 10000, inHand: true, isAllIn: false, bet: 0 },
                { seatPos: 1, userRef: 'u2', stack: 10000, inHand: true, isAllIn: false, bet: 200 },
            ]
        });
        const { nextState } = (0, index_1.applyAction)(state, 0, { type: 'RAISE', amount: 200 });
        (0, vitest_1.expect)(nextState.currentBet).toBe(400);
        (0, vitest_1.expect)(nextState.minRaise).toBeGreaterThanOrEqual(200);
        (0, vitest_1.expect)(nextState.actingPos).toBe(1);
    });
    (0, vitest_1.it)('ALL_IN: moves all stack, may update currentBet, marks all-in', () => {
        const state = createState({
            actingPos: 0,
            currentBet: 200,
            minRaise: 200,
            seats: [
                { seatPos: 0, userRef: 'u1', stack: 500, inHand: true, isAllIn: false, bet: 0 },
                { seatPos: 1, userRef: 'u2', stack: 10000, inHand: true, isAllIn: false, bet: 200 },
            ]
        });
        const { nextState } = (0, index_1.applyAction)(state, 0, { type: 'ALL_IN' });
        (0, vitest_1.expect)(nextState.seats[0].stack).toBe(0);
        (0, vitest_1.expect)(nextState.seats[0].isAllIn).toBe(true);
        (0, vitest_1.expect)(nextState.actingPos).toBe(1);
    });
});
//# sourceMappingURL=applyAction.test.js.map