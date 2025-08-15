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
    pots: Array<{
        amount: number;
        eligible: number[];
    }>;
    board: string[];
    seats: Seat[];
}
export type PlayerAction = {
    type: 'CHECK';
} | {
    type: 'CALL';
} | {
    type: 'FOLD';
} | {
    type: 'RAISE';
    amount: number;
} | {
    type: 'ALL_IN';
};
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
export declare function reconstructStateFromDb(input: ReconstructionInput): EngineState;
export declare function computeToCall(state: EngineState, pos: number): number;
export declare function computeAllowedActions(state: EngineState, pos: number): Array<PlayerAction['type']>;
export declare function isBettingRoundComplete(state: EngineState, actionsSinceBoundary: DbActionRow[]): boolean;
export interface ProgressResult {
    nextState: EngineState;
    boardDelta: string[];
}
export declare function progressStreet(state: EngineState, deckSeed: string): ProgressResult;
export declare function computeBoardDelta(state: EngineState, deckSeed: string, need: number): string[];
//# sourceMappingURL=state.d.ts.map