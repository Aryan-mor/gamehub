import { Table } from 'poker-ts';
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
  const table = new Table({ smallBlind: config.smallBlind, bigBlind: config.bigBlind, ante: 0 }, seats.length);

  // Sit players with their stacks in their specified seat positions
  for (const seat of seats) {
    table.sitDown(seat.seatPos, seat.stack);
  }

  // Start the hand (let table choose button automatically based on first occupied seat)
  table.startHand();

  // Helper to produce an ordered list of occupied seat indices
  const seatIsOccupied: boolean[] = table.seats().map((p: unknown) => p !== null);
  const occupiedSeats: number[] = seatIsOccupied
    .map((occupied, idx) => (occupied ? idx : -1))
    .filter((idx: number) => idx >= 0);

  const buttonPos: number = table.button();

  // Compute SB/BB positions according to standard rules
  const nextOccupiedFrom = (from: number): number => {
    if (occupiedSeats.length === 0) return from;
    let i = (from + 1) % seats.length;
    while (!seatIsOccupied[i]) {
      i = (i + 1) % seats.length;
    }
    return i;
  };

  let sbPos: number;
  let bbPos: number;
  if (occupiedSeats.length === 2) {
    // Heads-up: button is small blind, other is big blind
    sbPos = buttonPos;
    bbPos = occupiedSeats.find((i) => i !== sbPos) as number;
  } else {
    sbPos = nextOccupiedFrom(buttonPos);
    bbPos = nextOccupiedFrom(sbPos);
  }

  const events: EngineEvent[] = [];
  events.push({ type: 'BLINDS_POSTED', sbPos, bbPos, sb: config.smallBlind, bb: config.bigBlind });

  // Emit CARDS_DEALT for each seat using poker-ts dealt cards
  const suitSymbols: Record<string, string> = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
  const holes: Array<Array<{ rank: string; suit: string }> | null> = table.holeCards();
  holes.forEach((cards, seatIndex) => {
    if (cards && cards.length === 2) {
      const c1 = `${cards[0].rank}${suitSymbols[cards[0].suit]}`;
      const c2 = `${cards[1].rank}${suitSymbols[cards[1].suit]}`;
      events.push({ type: 'CARDS_DEALT', privateTo: seatIndex, cards: [c1, c2] });
    }
  });

  // Emit betting round started (preflop)
  events.push({ type: 'BETTING_ROUND_STARTED', street: 'preflop' });

  const actingPos = table.playerToAct();
  const nextState: EngineState = {
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

export function applyAction(state: EngineState, _pos: number, _action: PlayerAction): ApplyResult {
  // placeholder no-op for now
  return { nextState: state, events: [] };
}


