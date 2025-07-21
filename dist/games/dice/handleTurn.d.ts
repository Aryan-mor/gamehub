import { DiceGameResult } from './types';
export declare const handleDiceTurn: (gameId: string, playerGuess: number) => Promise<{
    success: boolean;
    result?: DiceGameResult;
    error?: string;
}>;
//# sourceMappingURL=handleTurn.d.ts.map