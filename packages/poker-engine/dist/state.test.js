"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const state_1 = require("./state");
(0, vitest_1.describe)('engine.state helpers', () => {
    (0, vitest_1.it)('reconstructs state and computes allowed actions', () => {
        const state = (0, state_1.reconstructStateFromDb)({
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
                { hand_id: 'h1', seat_pos: 0, user_id: 'u1', stack: 10000, bet: 0, in_hand: true, is_all_in: false, hole: ['Ah', 'Ad'] },
                { hand_id: 'h1', seat_pos: 1, user_id: 'u2', stack: 10000, bet: 200, in_hand: true, is_all_in: false, hole: ['Kh', 'Kd'] },
            ],
            pots: [{ hand_id: 'h1', amount: 0, eligible_seats: [0, 1] }],
        });
        const allowed = (0, state_1.computeAllowedActions)(state, 0);
        (0, vitest_1.expect)(allowed.includes('CALL')).toBe(true);
        (0, vitest_1.expect)(allowed.includes('CHECK')).toBe(false);
    });
    (0, vitest_1.it)('detects betting round complete and progresses to flop with 3 cards', () => {
        const state = (0, state_1.reconstructStateFromDb)({
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
                { hand_id: 'h1', seat_pos: 0, user_id: 'u1', stack: 9800, bet: 200, in_hand: true, is_all_in: false, hole: ['Ah', 'Ad'] },
                { hand_id: 'h1', seat_pos: 1, user_id: 'u2', stack: 10000, bet: 200, in_hand: true, is_all_in: false, hole: ['Kh', 'Kd'] },
            ],
            pots: [{ hand_id: 'h1', amount: 200, eligible_seats: [0, 1] }],
        });
        const roundActions = [
            { seq: 1, type: 'CALL', actor_pos: 0 },
            { seq: 2, type: 'CALL', actor_pos: 1 },
        ];
        (0, vitest_1.expect)((0, state_1.isBettingRoundComplete)(state, roundActions)).toBe(true);
        const { nextState, boardDelta } = (0, state_1.progressStreet)(state, '42');
        (0, vitest_1.expect)(nextState.street).toBe('flop');
        (0, vitest_1.expect)(boardDelta.length).toBe(3);
        (0, vitest_1.expect)(nextState.board.length).toBe(3);
    });
});
//# sourceMappingURL=state.test.js.map