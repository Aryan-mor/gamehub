export interface FootballGameData {
    guess: number;
    diceResult: number;
    isWon: boolean;
    reward: number;
    fee: number;
}
export interface FootballGameState {
    gameId: string;
    playerId: string;
    stake: number;
    status: 'waiting' | 'playing' | 'finished';
    data: FootballGameData;
    createdAt: number;
    updatedAt: number;
}
export interface FootballGameResult {
    isWon: boolean;
    guess: number;
    diceResult: number;
    reward: number;
    fee: number;
    coinsWon: number;
    coinsLost: number;
}
export declare const FOOTBALL_STAKES: readonly [2, 5, 10, 20];
export type FootballStake = typeof FOOTBALL_STAKES[number];
export declare const FOOTBALL_DIRECTIONS: {
    readonly 1: "Top-Left";
    readonly 2: "Top-Right";
    readonly 3: "Center";
    readonly 4: "Bottom-Left";
    readonly 5: "Bottom-Right";
};
export declare const FOOTBALL_DIRECTION_KEYS: {
    readonly 'Top-Left': 1;
    readonly 'Top-Right': 2;
    readonly Center: 3;
    readonly 'Bottom-Left': 4;
    readonly 'Bottom-Right': 5;
};
//# sourceMappingURL=types.d.ts.map