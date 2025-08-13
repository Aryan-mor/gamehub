export interface EngineConfig {
  smallBlind: number;
  bigBlind: number;
  maxPlayers: number;
  rngSeed?: string;
}

export interface Card {
  rank: string;
  suit: string;
  value: number;
}

export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;
export const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'] as const;

export function createDeck(seed?: string): Card[] {
  const deck: Card[] = [];
  
  for (const suit of SUITS) {
    for (let i = 0; i < RANKS.length; i++) {
      const rank = RANKS[i];
      deck.push({
        rank,
        suit,
        value: i + 2 // 2 = 2, A = 14
      });
    }
  }
  
  // Simple shuffle using seed
  if (seed) {
    const seedNum = parseInt(seed, 10) || 0;
    for (let i = deck.length - 1; i > 0; i--) {
      const j = (seedNum + i) % (i + 1);
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  } else {
    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }
  
  return deck;
}

export function dealCards(deck: Card[], count: number): { cards: Card[], remainingDeck: Card[] } {
  if (count > deck.length) {
    throw new Error('Not enough cards in deck');
  }
  
  const cards = deck.slice(0, count);
  const remainingDeck = deck.slice(count);
  
  return { cards, remainingDeck };
}

export function cardToString(card: Card): string {
  const suitSymbols: Record<string, string> = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠'
  };
  
  return `${card.rank}${suitSymbols[card.suit]}`;
}

export type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

export interface Seat {
  seatPos: number;
  userRef: string;
  stack: number;
  inHand: boolean;
  isAllIn: boolean;
  bet: number;
  hole?: [string, string];
}

export interface EngineState {
  handId: string;
  street: Street;
  dealerPos: number;
  smallBlindPos: number;
  bigBlindPos: number;
  actingPos: number;
  minRaise: number;
  currentBet: number;
  pots: Array<{ amount: number; eligible: number[] }>;
  board: string[];
  seats: Seat[];
}

export type PlayerAction =
  | { type: 'CHECK' }
  | { type: 'CALL' }
  | { type: 'FOLD' }
  | { type: 'RAISE'; amount: number }
  | { type: 'ALL_IN' };

export type EngineEvent =
  | { type: 'BLINDS_POSTED'; sbPos: number; bbPos: number; sb: number; bb: number }
  | { type: 'CARDS_DEALT'; privateTo: number; cards: [string, string] }
  | { type: 'BETTING_ROUND_STARTED'; street: Street }
  | { type: 'ACTION_APPLIED'; pos: number; action: PlayerAction; toCall: number }
  | { type: 'STREET_CHANGED'; to: Street; boardDelta?: string[] }
  | { type: 'SHOWDOWN_RESULTS'; winners: Array<{ pos: number; amount: number; hand: string }> };

export interface ApplyResult {
  nextState: EngineState;
  events: EngineEvent[];
}

export function startHand(config: EngineConfig, seats: Seat[]): ApplyResult {
  // Create a deterministic deck
  const deck = createDeck(config.rngSeed);
  
  const dealerPos = 0;
  const sbPos = 1 % seats.length;
  const bbPos = 2 % seats.length;
  const state: EngineState = {
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
  
  const events: EngineEvent[] = [
    { type: 'BLINDS_POSTED', sbPos, bbPos, sb: config.smallBlind, bb: config.bigBlind }
  ];
  
  // Deal hole cards to each player
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

export function applyAction(state: EngineState, _pos: number, _action: PlayerAction): ApplyResult {
  // placeholder no-op for now
  return { nextState: state, events: [] };
}


