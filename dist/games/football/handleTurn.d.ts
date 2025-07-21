import { FootballGameResult } from './types';
export declare const handleFootballTurn: (gameId: string, guess: number) => Promise<{
    success: boolean;
    result?: FootballGameResult;
    error?: string;
}>;
//# sourceMappingURL=handleTurn.d.ts.map