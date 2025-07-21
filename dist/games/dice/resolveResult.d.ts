import { DiceGameResult } from './types';
export declare const resolveDiceResult: (gameId: string) => Promise<{
    success: boolean;
    result?: DiceGameResult;
    error?: string;
}>;
//# sourceMappingURL=resolveResult.d.ts.map