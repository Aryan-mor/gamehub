export type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

export interface EngineConfig {
  smallBlind: number;
  bigBlind: number;
  maxPlayers: number;
  rngSeed?: string;
}

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
  pots: Array<{ amount: number; eligible: number[] }>; // simplified single main pot first
  board: string[];
  seats: Seat[];
}

export type PlayerAction =
  | { type: 'CHECK' }
  | { type: 'CALL' }
  | { type: 'FOLD' }
  | { type: 'RAISE'; amount: number }
  | { type: 'ALL_IN' };

// DB row shapes (minimal)
export interface DbHandRow {
  id: string;
  street: Street;
  button_pos: number;
  acting_pos: number;
  min_raise: number;
  current_bet: number;
  deck_seed: string;
  board?: string[] | null;
}

export interface DbSeatRow {
  hand_id: string;
  seat_pos: number;
  user_id: string;
  stack: number;
  bet: number;
  in_hand: boolean;
  is_all_in: boolean;
  hole?: [string, string] | null;
}

export interface DbPotRow {
  hand_id: string;
  amount: number;
  eligible_seats: number[];
}

export interface DbActionRow {
  seq: number;
  type: string;
  actor_pos?: number | null;
}

export interface ReconstructionInput {
  config: EngineConfig;
  hand: DbHandRow;
  seats: DbSeatRow[];
  pots: DbPotRow[];
}

export function reconstructStateFromDb(input: ReconstructionInput): EngineState {
  const { hand, seats, pots, config } = input;
  const mainPot = pots && pots[0] ? { amount: Number(pots[0].amount || 0), eligible: Array.isArray(pots[0].eligible_seats) ? pots[0].eligible_seats : [] } : { amount: 0, eligible: [] };
  const engineSeats: Seat[] = seats
    .sort((a, b) => Number(a.seat_pos) - Number(b.seat_pos))
    .map((s) => ({
      seatPos: Number(s.seat_pos),
      userRef: String(s.user_id),
      stack: Number(s.stack || 0),
      inHand: Boolean(s.in_hand),
      isAllIn: Boolean(s.is_all_in),
      bet: Number(s.bet || 0),
      hole: (s.hole ?? undefined) as [string, string] | undefined,
    }));

  return {
    handId: String(hand.id),
    street: hand.street,
    dealerPos: Number(hand.button_pos),
    smallBlindPos: -1, // not required for reconstruction logic
    bigBlindPos: -1,   // not required for reconstruction logic
    actingPos: Number(hand.acting_pos),
    minRaise: Math.max(Number(config.bigBlind || 0), Number(hand.min_raise || 0)),
    currentBet: Number(hand.current_bet || 0),
    pots: [mainPot],
    board: Array.isArray(hand.board) ? hand.board : [],
    seats: engineSeats,
  };
}

export function computeToCall(state: EngineState, pos: number): number {
  const seat = state.seats[pos];
  const toCall = Math.max(0, Number(state.currentBet || 0) - Number(seat?.bet || 0));
  return toCall;
}

export function computeAllowedActions(state: EngineState, pos: number): Array<PlayerAction['type']> {
  if (state.street === 'showdown') return [];
  const seat = state.seats[pos];
  if (!seat || !seat.inHand || seat.isAllIn) return [];
  const toCall = computeToCall(state, pos);
  const allowed: Array<PlayerAction['type']> = [];
  if (toCall === 0) {
    allowed.push('CHECK');
  } else if (seat.stack > 0) {
    allowed.push('CALL');
  }
  // Simplified raise allowance: if player can exceed current bet
  const canRaise = seat.stack + seat.bet > state.currentBet;
  if (canRaise) allowed.push('RAISE');
  allowed.push('FOLD');
  return allowed;
}

export function isBettingRoundComplete(state: EngineState, actionsSinceBoundary: DbActionRow[]): boolean {
  const active = state.seats.filter((s) => s.inHand);
  if (active.length <= 1) return true; // trivially complete
  const maxBet = active.reduce((m, s) => (s.bet > m ? s.bet : m), 0);
  const allMatched = active.every((s) => s.isAllIn || Number(s.bet) === Number(maxBet));
  const actorPositions = new Set<number>();
  for (const a of actionsSinceBoundary) {
    const t = String(a.type);
    if (t === 'CHECK' || t === 'CALL' || t === 'RAISE' || t === 'ALL_IN' || t === 'FOLD') {
      if (typeof a.actor_pos === 'number') actorPositions.add(Number(a.actor_pos));
    }
  }
  const everyoneActed = active.every((s) => s.isAllIn || actorPositions.has(s.seatPos));
  return allMatched && everyoneActed;
}

export interface ProgressResult {
  nextState: EngineState;
  boardDelta: string[];
}

export function progressStreet(state: EngineState, deckSeed: string): ProgressResult {
  const need = state.street === 'preflop' ? 3 : state.street === 'flop' ? 1 : state.street === 'turn' ? 1 : 0;
  const boardDelta = computeBoardDelta(state, deckSeed, need);
  const nextStreet: Street = state.street === 'preflop' ? 'flop' : state.street === 'flop' ? 'turn' : state.street === 'turn' ? 'river' : 'showdown';
  const nextBoard = [...state.board, ...boardDelta];
  // Reset bets/currentBet, set acting to first active to left of dealer
  const len = state.seats.length;
  let nextPos = Number(state.dealerPos ?? 0);
  for (let i = 0; i < len; i++) {
    nextPos = (nextPos + 1) % len;
    const s = state.seats[nextPos];
    if (s && s.inHand && !s.isAllIn) break;
  }
  const nextState: EngineState = {
    ...state,
    street: nextStreet,
    board: nextBoard,
    actingPos: nextPos,
    currentBet: 0,
    seats: state.seats.map((s) => ({ ...s, bet: 0 })),
  };
  return { nextState, boardDelta };
}

export function computeBoardDelta(state: EngineState, deckSeed: string, need: number): string[] {
  if (need <= 0) return [];
  // Inline minimal deck based on seed to avoid cyclic import during tests
  const RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  const SUITS = ['hearts','diamonds','clubs','spades'];
  const suitSymbols: Record<string, string> = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
  const createDeckLocal = (seed?: string) => {
    const deck: Array<{ rank: string; suit: string }> = [];
    for (const s of SUITS) for (const r of RANKS) deck.push({ rank: r, suit: s });
    if (seed) {
      const seedNum = parseInt(seed, 10) || 0;
      for (let i = deck.length - 1; i > 0; i--) {
        const j = (seedNum + i) % (i + 1);
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
    }
    return deck;
  };
  const cardToStringLocal = (card: { rank: string; suit: string }) => `${card.rank}${suitSymbols[card.suit]}`;
  const deck = createDeckLocal(String(deckSeed));
  const deckStrings = deck.map(cardToStringLocal);
  const used = new Set<string>();
  for (const s of state.seats) {
    const h = s.hole;
    if (h && Array.isArray(h)) {
      if (h[0]) used.add(h[0]);
      if (h[1]) used.add(h[1]);
    }
  }
  for (const b of state.board) used.add(b);
  const remaining = deckStrings.filter((c) => !used.has(c));
  return remaining.slice(0, need);
}


