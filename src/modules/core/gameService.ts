import { GameState, GameType, GameStatus, Player, GameResult } from './types';
import { logFunctionStart, logFunctionEnd, logError } from './logger';
import { ref, get, set, update, remove } from 'firebase/database';
import { database } from './firebase';

export const createGame = async (
  gameType: GameType,
  creator: Player,
  stake: number
): Promise<GameState> => {
  logFunctionStart('createGame', { gameType, creatorId: creator.id, stake });
  
  try {
    if (!database) throw new Error('Firebase not initialized');
    
    const gameId = `${gameType}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const game: GameState = {
      id: gameId,
      type: gameType,
      status: GameStatus.WAITING,
      players: [creator],
      currentPlayerIndex: 0,
      stake,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      data: {},
    };
    
    const gameRef = ref(database, `games/${gameId}`);
    await set(gameRef, game);
    
    logFunctionEnd('createGame', game, { gameType, creatorId: creator.id, stake });
    return game;
  } catch (error) {
    logError('createGame', error as Error, { gameType, creatorId: creator.id, stake });
    throw error;
  }
};

export const joinGame = async (
  gameId: string,
  player: Player
): Promise<GameState> => {
  logFunctionStart('joinGame', { gameId, playerId: player.id });
  
  try {
    if (!database) throw new Error('Firebase not initialized');
    
    const gameRef = ref(database, `games/${gameId}`);
    const snapshot = await get(gameRef);
    
    if (!snapshot.exists()) {
      throw new Error('Game not found');
    }
    
    const game = snapshot.val() as GameState;
    
    if (game.status !== GameStatus.WAITING) {
      throw new Error('Game is not waiting for players');
    }
    
    if (game.players.length >= 2) {
      throw new Error('Game is full');
    }
    
    if (game.players.some(p => p.id === player.id)) {
      throw new Error('Player already in game');
    }
    
    const updatedGame: GameState = {
      ...game,
      players: [...game.players, player],
      status: GameStatus.PLAYING,
      updatedAt: Date.now(),
    };
    
    await set(gameRef, updatedGame);
    
    logFunctionEnd('joinGame', updatedGame, { gameId, playerId: player.id });
    return updatedGame;
  } catch (error) {
    logError('joinGame', error as Error, { gameId, playerId: player.id });
    throw error;
  }
};

export const getGame = async (gameId: string): Promise<GameState | null> => {
  logFunctionStart('getGame', { gameId });
  
  try {
    if (!database) throw new Error('Firebase not initialized');
    
    const gameRef = ref(database, `games/${gameId}`);
    const snapshot = await get(gameRef);
    
    if (!snapshot.exists()) {
      logFunctionEnd('getGame', null, { gameId });
      return null;
    }
    
    const game = snapshot.val() as GameState;
    logFunctionEnd('getGame', game, { gameId });
    return game;
  } catch (error) {
    logError('getGame', error as Error, { gameId });
    throw error;
  }
};

export const updateGame = async (
  gameId: string,
  updates: Partial<GameState>
): Promise<GameState> => {
  logFunctionStart('updateGame', { gameId, updates });
  
  try {
    if (!database) throw new Error('Firebase not initialized');
    
    const gameRef = ref(database, `games/${gameId}`);
    const updateData = {
      ...updates,
      updatedAt: Date.now(),
    };
    
    await update(gameRef, updateData);
    
    const updatedGame = await getGame(gameId);
    if (!updatedGame) {
      throw new Error('Game not found after update');
    }
    
    logFunctionEnd('updateGame', updatedGame, { gameId, updates });
    return updatedGame;
  } catch (error) {
    logError('updateGame', error as Error, { gameId, updates });
    throw error;
  }
};

export const finishGame = async (
  gameId: string,
  result: GameResult
): Promise<void> => {
  logFunctionStart('finishGame', { gameId, result });
  
  try {
    if (!database) throw new Error('Firebase not initialized');
    
    // Filter out undefined values for Firebase
    const cleanResult = {
      winner: result.winner || null,
      loser: result.loser || null,
      isDraw: result.isDraw,
      coinsWon: result.coinsWon,
      coinsLost: result.coinsLost,
    };
    
    const gameRef = ref(database, `games/${gameId}`);
    await update(gameRef, {
      status: GameStatus.FINISHED,
      updatedAt: Date.now(),
      result: cleanResult,
    });
    
    logFunctionEnd('finishGame', {}, { gameId, result });
  } catch (error) {
    logError('finishGame', error as Error, { gameId, result });
    throw error;
  }
};

export const cancelGame = async (gameId: string): Promise<void> => {
  logFunctionStart('cancelGame', { gameId });
  
  try {
    if (!database) throw new Error('Firebase not initialized');
    
    const gameRef = ref(database, `games/${gameId}`);
    await update(gameRef, {
      status: GameStatus.CANCELLED,
      updatedAt: Date.now(),
    });
    
    logFunctionEnd('cancelGame', {}, { gameId });
  } catch (error) {
    logError('cancelGame', error as Error, { gameId });
    throw error;
  }
};

export const deleteGame = async (gameId: string): Promise<void> => {
  logFunctionStart('deleteGame', { gameId });
  
  try {
    if (!database) throw new Error('Firebase not initialized');
    
    const gameRef = ref(database, `games/${gameId}`);
    await remove(gameRef);
    
    logFunctionEnd('deleteGame', {}, { gameId });
  } catch (error) {
    logError('deleteGame', error as Error, { gameId });
    throw error;
  }
};

export const getActiveGamesForUser = async (userId: string): Promise<GameState[]> => {
  logFunctionStart('getActiveGamesForUser', { userId });
  
  try {
    if (!database) throw new Error('Firebase not initialized');
    
    const gamesRef = ref(database, 'games');
    const snapshot = await get(gamesRef);
    
    if (!snapshot.exists()) {
      logFunctionEnd('getActiveGamesForUser', [], { userId });
      return [];
    }
    
    const games = snapshot.val() as Record<string, GameState>;
    const userGames = Object.values(games).filter(
      game => game.players.some(p => p.id === userId) && 
              game.status !== GameStatus.FINISHED && 
              game.status !== GameStatus.CANCELLED
    );
    
    logFunctionEnd('getActiveGamesForUser', userGames, { userId });
    return userGames;
  } catch (error) {
    logError('getActiveGamesForUser', error as Error, { userId });
    throw error;
  }
}; 