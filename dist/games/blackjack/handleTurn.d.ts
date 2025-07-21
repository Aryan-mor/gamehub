import { BlackjackGameResult } from './types';
export declare const handleBlackjackTurn: (gameId: string, action: "hit" | "stand") => Promise<{
    success: boolean;
    result?: BlackjackGameResult;
    error?: string;
}>;
//# sourceMappingURL=handleTurn.d.ts.map