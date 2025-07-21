export interface Card {
    suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
    value: number;
    displayValue: string;
}
export interface BlackjackGameData {
    playerHand: Card[];
    dealerHand: Card[];
    deck: Card[];
    result: 'win' | 'lose' | 'push' | undefined;
    reward: number;
    fee: number;
}
export interface BlackjackGameState {
    gameId: string;
    playerId: string;
    stake: number;
    status: 'waiting' | 'playing' | 'finished';
    data: BlackjackGameData;
    createdAt: number;
    updatedAt: number;
}
export interface BlackjackGameResult {
    isWon: boolean;
    result: 'win' | 'lose' | 'push';
    playerHand: Card[];
    dealerHand: Card[];
    playerScore: number;
    dealerScore: number;
    reward: number;
    fee: number;
    coinsWon: number;
    coinsLost: number;
}
export declare const BLACKJACK_STAKES: readonly [2, 5, 10, 20, 30, 50];
export type BlackjackStake = typeof BLACKJACK_STAKES[number];
//# sourceMappingURL=types.d.ts.map