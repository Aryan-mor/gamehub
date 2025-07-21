export interface DiceGameData {
    playerGuess: number;
    diceResult: number;
    isWon: boolean;
}
export interface DiceGameState {
    gameId: string;
    playerId: string;
    stake: number;
    status: 'waiting' | 'playing' | 'finished';
    data: DiceGameData;
    createdAt: number;
    updatedAt: number;
}
export interface DiceGameResult {
    isWon: boolean;
    playerGuess: number;
    diceResult: number;
    coinsWon: number;
    coinsLost: number;
}
//# sourceMappingURL=types.d.ts.map