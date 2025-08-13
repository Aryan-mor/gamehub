"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startHand = startHand;
exports.applyAction = applyAction;
function startHand(config, seats) {
    const dealerPos = 0;
    const sbPos = 1 % seats.length;
    const bbPos = 2 % seats.length;
    const state = {
        handId: 'hand-temp',
        street: 'preflop',
        dealerPos,
        smallBlindPos: sbPos,
        bigBlindPos: bbPos,
        actingPos: (bbPos + 1) % seats.length,
        minRaise: config.bigBlind,
        currentBet: config.bigBlind,
        pots: [{ amount: 0, eligible: seats.map((s) => s.seatPos) }],
        board: [],
        seats: seats.map((s) => ({ ...s }))
    };
    const events = [
        { type: 'BLINDS_POSTED', sbPos, bbPos, sb: config.smallBlind, bb: config.bigBlind },
        { type: 'BETTING_ROUND_STARTED', street: 'preflop' }
    ];
    return { nextState: state, events };
}
function applyAction(state, _pos, _action) {
    return { nextState: state, events: [] };
}
//# sourceMappingURL=index.js.map