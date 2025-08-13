"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUITS = exports.RANKS = void 0;
exports.createDeck = createDeck;
exports.dealCards = dealCards;
exports.cardToString = cardToString;
exports.startHand = startHand;
exports.applyAction = applyAction;
const poker_ts_1 = require("poker-ts");
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
    const table = new poker_ts_1.Table({ smallBlind: config.smallBlind, bigBlind: config.bigBlind, ante: 0 }, seats.length);
    for (const seat of seats) {
        table.sitDown(seat.seatPos, seat.stack);
    }
    table.startHand();
    const seatIsOccupied = table.seats().map((p) => p !== null);
    const occupiedSeats = seatIsOccupied
        .map((occupied, idx) => (occupied ? idx : -1))
        .filter((idx) => idx >= 0);
    const buttonPos = table.button();
    const nextOccupiedFrom = (from) => {
        if (occupiedSeats.length === 0)
            return from;
        let i = (from + 1) % seats.length;
        while (!seatIsOccupied[i]) {
            i = (i + 1) % seats.length;
        }
        return i;
    };
    let sbPos;
    let bbPos;
    if (occupiedSeats.length === 2) {
        sbPos = buttonPos;
        bbPos = occupiedSeats.find((i) => i !== sbPos);
    }
    else {
        sbPos = nextOccupiedFrom(buttonPos);
        bbPos = nextOccupiedFrom(sbPos);
    }
    const events = [];
    events.push({ type: 'BLINDS_POSTED', sbPos, bbPos, sb: config.smallBlind, bb: config.bigBlind });
    const suitSymbols = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
    const holes = table.holeCards();
    holes.forEach((cards, seatIndex) => {
        if (cards && cards.length === 2) {
            const c1 = `${cards[0].rank}${suitSymbols[cards[0].suit]}`;
            const c2 = `${cards[1].rank}${suitSymbols[cards[1].suit]}`;
            events.push({ type: 'CARDS_DEALT', privateTo: seatIndex, cards: [c1, c2] });
        }
    });
    events.push({ type: 'BETTING_ROUND_STARTED', street: 'preflop' });
    const actingPos = table.playerToAct();
    const nextState = {
        handId: 'hand-temp',
        street: 'preflop',
        dealerPos: buttonPos,
        smallBlindPos: sbPos,
        bigBlindPos: bbPos,
        actingPos,
        minRaise: config.bigBlind,
        currentBet: config.bigBlind,
        pots: [{ amount: 0, eligible: occupiedSeats }],
        board: [],
        seats: seats.map((s) => ({ ...s }))
    };
    return { nextState, events };
}
function applyAction(state, _pos, _action) {
    return { nextState: state, events: [] };
}
//# sourceMappingURL=index.js.map