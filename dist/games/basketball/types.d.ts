export interface BasketballGameData {
    guess: 'score' | 'miss';
    diceResult: number;
    isWon: boolean;
    reward: number;
    fee: number;
}
export interface BasketballGameState {
    gameId: string;
    playerId: string;
    stake: number;
    status: 'waiting' | 'playing' | 'finished';
    data: BasketballGameData;
    createdAt: number;
    updatedAt: number;
}
export interface BasketballGameResult {
    isWon: boolean;
    guess: 'score' | 'miss';
    diceResult: number;
    reward: number;
    fee: number;
    coinsWon: number;
    coinsLost: number;
}
export declare const BASKETBALL_STAKES: readonly [2, 5, 10, 20];
export type BasketballStake = typeof BASKETBALL_STAKES[number];
//# sourceMappingURL=types.d.ts.map