import { BasketballGameResult } from './types';
export declare const handleBasketballTurn: (gameId: string, guess: "score" | "miss") => Promise<{
    success: boolean;
    result?: BasketballGameResult;
    error?: string;
}>;
//# sourceMappingURL=handleTurn.d.ts.map