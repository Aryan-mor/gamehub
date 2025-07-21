import { GameState, createInitialGameState } from "../../lib/game";
export { createInitialGameState };
export declare const GAME_TYPE = "xo";
export declare const GAME_NAME = "X/O Game";
export declare const GAME_DESCRIPTION = "Classic TicTacToe game for 2 players";
export declare const VALID_STAKES: number[];
export declare function checkWinner(board: string[]): string | null;
export declare function isDraw(board: string[]): boolean;
export declare function getNextPlayer(currentPlayer: string): string;
export declare function createXoGame(creatorId: string, creatorName: string, stake: number): Promise<{
    gameId: string;
    gameState: GameState;
}>;
export declare function joinXoGame(gameId: string, joinerId: string, joinerName: string): Promise<GameState | null>;
export declare function getXoGame(gameId: string): GameState | undefined;
export declare function deleteXoGame(gameId: string): boolean;
export declare function isPlayerInXoGame(gameId: string, userId: string): boolean;
export declare function setXoGame(gameId: string, gameState: GameState): void;
export declare function formatXoBoard(board: string[]): string;
export declare function processGameCompletion(gameId: string): Promise<void>;
export declare function getUnfinishedGamesForUser(userId: string): Array<{
    gameId: string;
    gameState: GameState;
}>;
export declare function getAllUnfinishedGames(): Array<{
    gameId: string;
    gameState: GameState;
}>;
//# sourceMappingURL=game.d.ts.map