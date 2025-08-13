export interface EngineConfig {
  smallBlind: number;
  bigBlind: number;
  maxPlayers: number;
  rngSeed?: string;
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
  // placeholder deterministic minimal state; full logic to be implemented
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
    { type: 'BLINDS_POSTED', sbPos, bbPos, sb: config.smallBlind, bb: config.bigBlind },
    { type: 'BETTING_ROUND_STARTED', street: 'preflop' }
  ];
  return { nextState: state, events };
}

export function applyAction(state: EngineState, _pos: number, _action: PlayerAction): ApplyResult {
  // placeholder no-op for now
  return { nextState: state, events: [] };
}


