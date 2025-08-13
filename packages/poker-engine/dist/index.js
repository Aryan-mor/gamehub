"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUITS = exports.RANKS = void 0;
exports.createDeck = createDeck;
exports.dealCards = dealCards;
exports.cardToString = cardToString;
exports.startHand = startHand;
exports.applyAction = applyAction;
exports.RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
exports.SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
function createDeck(seed) {
    const deck = [];
    for (const suit of exports.SUITS) {
        for (let i = 0; i < exports.RANKS.length; i++) {
            const rank = exports.RANKS[i];
            deck.push({
                rank,
                suit,
                value: i + 2
            });
        }
    }
    if (seed) {
        const seedNum = parseInt(seed, 10) || 0;
        for (let i = deck.length - 1; i > 0; i--) {
            const j = (seedNum + i) % (i + 1);
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }
    else {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }
    return deck;
}
function dealCards(deck, count) {
    if (count > deck.length) {
        throw new Error('Not enough cards in deck');
    }
    const cards = deck.slice(0, count);
    const remainingDeck = deck.slice(count);
    return { cards, remainingDeck };
}
function cardToString(card) {
    const suitSymbols = {
        hearts: '♥',
        diamonds: '♦',
        clubs: '♣',
        spades: '♠'
    };
    return `${card.rank}${suitSymbols[card.suit]}`;
}
function startHand(config, seats) {
    const deck = createDeck(config.rngSeed);
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
        { type: 'BLINDS_POSTED', sbPos, bbPos, sb: config.smallBlind, bb: config.bigBlind }
    ];
    let remainingDeck = deck;
    for (let i = 0; i < seats.length; i++) {
        const { cards, remainingDeck: newDeck } = dealCards(remainingDeck, 2);
        remainingDeck = newDeck;
        const cardStrings = cards.map(card => cardToString(card));
        events.push({ type: 'CARDS_DEALT', privateTo: i, cards: [cardStrings[0], cardStrings[1]] });
    }
    events.push({ type: 'BETTING_ROUND_STARTED', street: 'preflop' });
    return { nextState: state, events };
}
function applyAction(state, _pos, _action) {
    return { nextState: state, events: [] };
}
//# sourceMappingURL=index.js.map