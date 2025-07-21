import { GameState, GameType, Player, GameResult } from './types';
export declare const createGame: (gameType: GameType, creator: Player, stake: number) => Promise<GameState>;
export declare const joinGame: (gameId: string, player: Player) => Promise<GameState>;
export declare const getGame: (gameId: string) => Promise<GameState | null>;
export declare const updateGame: (gameId: string, updates: Partial<GameState>) => Promise<GameState>;
export declare const finishGame: (gameId: string, result: GameResult) => Promise<void>;
export declare const cancelGame: (gameId: string) => Promise<void>;
export declare const deleteGame: (gameId: string) => Promise<void>;
export declare const getActiveGamesForUser: (userId: string) => Promise<GameState[]>;
//# sourceMappingURL=gameService.d.ts.map