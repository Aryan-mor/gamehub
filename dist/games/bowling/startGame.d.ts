import { BowlingStake } from './types';
export declare const startBowlingGame: (userId: string, stake: BowlingStake) => Promise<{
    success: boolean;
    gameId?: string;
    error?: string;
}>;
//# sourceMappingURL=startGame.d.ts.map