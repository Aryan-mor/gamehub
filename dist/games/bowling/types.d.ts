export interface BowlingGameData {
    diceResult: number;
    isWon: boolean;
    reward: number;
    fee: number;
}
export interface BowlingGameState {
    gameId: string;
    playerId: string;
    stake: number;
    status: 'waiting' | 'playing' | 'finished';
    data: BowlingGameData;
    createdAt: number;
    updatedAt: number;
}
export interface BowlingGameResult {
    isWon: boolean;
    diceResult: number;
    outcome: string;
    reward: number;
    fee: number;
    coinsWon: number;
    coinsLost: number;
}
export declare const BOWLING_STAKES: readonly [2, 5, 10, 20];
export type BowlingStake = typeof BOWLING_STAKES[number];
//# sourceMappingURL=types.d.ts.map