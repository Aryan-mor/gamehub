import type { GameState } from "../../lib/game";
export declare function makeXoMove(gameId: string, playerId: string, position: number): Promise<{
    success: boolean;
    gameState?: GameState;
    error?: string;
}>;
export declare function restartXoGame(gameId: string): Promise<GameState | null>;
export declare function newXoGame(gameId: string): Promise<GameState | null>;
//# sourceMappingURL=logic.d.ts.map