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
  hole?: [string, string] | null;
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

export function applyAction(state: EngineState, pos: number, action: PlayerAction): ApplyResult {
  // Basic betting logic for CHECK and CALL; placeholders for others
  const events: EngineEvent[] = [];
  const nextState: EngineState = {
    ...state,
    seats: state.seats.map((s) => ({ ...s })),
    pots: state.pots.map((p) => ({ amount: p.amount, eligible: [...p.eligible] })),
  };

  if (pos !== nextState.actingPos) {
    throw new Error('not_players_turn');
  }
  const seat = nextState.seats[pos];
  if (!seat || !seat.inHand) {
    throw new Error('seat_not_in_hand');
  }

  const toCall = Math.max(0, nextState.currentBet - seat.bet);

  switch (action.type) {
    case 'CHECK': {
      if (toCall > 0) {
        throw new Error('cannot_check_when_behind');
      }
      // No chip movement
      events.push({ type: 'ACTION_APPLIED', pos, action, toCall });
      // Advance acting position
      nextState.actingPos = (pos + 1) % nextState.seats.length;
      return { nextState, events };
    }
    case 'CALL': {
      const callAmount = Math.min(toCall, seat.stack);
      // Update seat
      seat.stack -= callAmount;
      seat.bet += callAmount;
      if (seat.stack === 0) seat.isAllIn = true;
      // Put into main pot (simple model)
      nextState.pots[0].amount += callAmount;
      events.push({ type: 'ACTION_APPLIED', pos, action, toCall });
      // Advance acting position
      nextState.actingPos = (pos + 1) % nextState.seats.length;
      return { nextState, events };
    }
    case 'RAISE': {
      const toCall = Math.max(0, nextState.currentBet - seat.bet);
      const raiseAmount = Math.max(0, Number(action.amount || 0));
      if (toCall > seat.stack) throw new Error('cannot_call_full_amount');
      if (raiseAmount <= 0) throw new Error('invalid_raise_amount');
      if (raiseAmount < nextState.minRaise) throw new Error('raise_below_min');
      const totalCost = toCall + raiseAmount;
      if (totalCost > seat.stack) throw new Error('insufficient_stack_for_raise');
      // Call first
      seat.stack -= toCall;
      seat.bet += toCall;
      nextState.pots[0].amount += toCall;
      // Then raise
      seat.stack -= raiseAmount;
      seat.bet += raiseAmount;
      nextState.pots[0].amount += raiseAmount;
      // Update current bet and minRaise
      const previousBet = nextState.currentBet;
      nextState.currentBet = seat.bet;
      nextState.minRaise = Math.max(nextState.minRaise, nextState.currentBet - previousBet);
      events.push({ type: 'ACTION_APPLIED', pos, action, toCall });
      // Advance acting
      nextState.actingPos = (pos + 1) % nextState.seats.length;
      return { nextState, events };
    }
    case 'ALL_IN': {
      const toCall = Math.max(0, nextState.currentBet - seat.bet);
      const commit = Math.min(seat.stack, seat.stack); // commit all stack
      // Move all-in: first cover call portion, then extra counts as raise if exceeds
      const callPortion = Math.min(toCall, commit);
      seat.stack -= callPortion;
      seat.bet += callPortion;
      nextState.pots[0].amount += callPortion;
      const remaining = commit - callPortion;
      if (remaining > 0) {
        const previousBet = nextState.currentBet;
        seat.stack -= remaining;
        seat.bet += remaining;
        nextState.pots[0].amount += remaining;
        if (seat.bet > previousBet) {
          nextState.minRaise = Math.max(nextState.minRaise, seat.bet - previousBet);
          nextState.currentBet = seat.bet;
        }
      }
      seat.isAllIn = true;
      events.push({ type: 'ACTION_APPLIED', pos, action, toCall });
      nextState.actingPos = (pos + 1) % nextState.seats.length;
      return { nextState, events };
    }
    default: {
      // For now, do not change state for unimplemented actions
      events.push({ type: 'ACTION_APPLIED', pos, action, toCall });
      return { nextState, events };
    }
  }
}

// Re-export state helpers for external use
export {
  reconstructStateFromDb,
  computeAllowedActions,
  computeToCall,
  isBettingRoundComplete,
  progressStreet,
} from './state';


