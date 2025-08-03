import { GameState, GameType, GameStatus, Player, GameResult } from './types';
import { logFunctionStart, logFunctionEnd, logError } from './logger';
import { api } from '@/lib/api';

export const createGame = async (
  gameType: GameType,
  creator: Player,
  stake: number
): Promise<GameState> => {
  logFunctionStart('createGame', { gameType, creatorId: creator.id, stake });
  
  try {
    const gameId = `${gameType}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    // Create game record
    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .insert({
        game_id: gameId,
        game_type: gameType,
        status: GameStatus.WAITING,
        stake_amount: stake,
        game_data: {
          players: [creator],
          currentPlayerIndex: 0,
          data: {},
        },
      })
      .select()
      .single();
    
    if (gameError) throw gameError;
    
    // Add creator as player
    const { error: playerError } = await supabase
      .from('game_players')
      .insert({
        game_id: gameData.id,
        user_id: creator.id,
        player_data: creator,
      });
    
    if (playerError) throw playerError;
    
    const game: GameState = {
      id: gameId,
      type: gameType,
      status: GameStatus.WAITING,
      players: [creator],
      currentPlayerIndex: 0,
      stake,
      createdAt: new Date(gameData.created_at).getTime(),
      updatedAt: new Date(gameData.updated_at).getTime(),
      data: {},
    };
    
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
    // Get game
    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('game_id', gameId)
      .single();
    
    if (gameError) throw gameError;
    
    if (gameData.status !== GameStatus.WAITING) {
      throw new Error('Game is not waiting for players');
    }
    
    // Check if player is already in game
    const { data: existingPlayer, error: playerCheckError } = await supabase
      .from('game_players')
      .select('id')
      .eq('game_id', gameData.id)
      .eq('user_id', player.id)
      .single();
    
    if (existingPlayer) {
      throw new Error('Player already in game');
    }
    
    // Get current players count
    const { data: currentPlayers, error: countError } = await supabase
      .from('game_players')
      .select('id')
      .eq('game_id', gameData.id);
    
    if (countError) throw countError;
    
    if (currentPlayers.length >= 2) {
      throw new Error('Game is full');
    }
    
    // Add player to game
    const { error: addPlayerError } = await supabase
      .from('game_players')
      .insert({
        game_id: gameData.id,
        user_id: player.id,
        player_data: player,
      });
    
    if (addPlayerError) throw addPlayerError;
    
    // Update game status to playing
    const { error: updateError } = await supabase
      .from('games')
      .update({
        status: GameStatus.PLAYING,
        updated_at: new Date().toISOString(),
      })
      .eq('game_id', gameId);
    
    if (updateError) throw updateError;
    
    // Get updated game
    const updatedGame = await getGame(gameId);
    if (!updatedGame) {
      throw new Error('Game not found after update');
    }
    
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
    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('game_id', gameId)
      .single();
    
    if (gameError && gameError.code !== 'PGRST116') {
      throw gameError;
    }
    
    if (!gameData) {
      logFunctionEnd('getGame', null, { gameId });
      return null;
    }
    
    // Get players
    const { data: playersData, error: playersError } = await supabase
      .from('game_players')
      .select('player_data')
      .eq('game_id', gameData.id);
    
    if (playersError) throw playersError;
    
    const players = playersData.map(p => p.player_data as Player);
    const gameDataObj = gameData.game_data as any;
    
    const game: GameState = {
      id: gameId,
      type: gameData.game_type as GameType,
      status: gameData.status as GameStatus,
      players,
      currentPlayerIndex: gameDataObj?.currentPlayerIndex || 0,
      stake: gameData.stake_amount,
      createdAt: new Date(gameData.created_at).getTime(),
      updatedAt: new Date(gameData.updated_at).getTime(),
      data: gameDataObj?.data || {},
      result: gameData.result_data,
    };
    
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
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.stake !== undefined) updateData.stake_amount = updates.stake;
    if (updates.data !== undefined) updateData.game_data = updates.data;
    if (updates.result !== undefined) updateData.result_data = updates.result;
    
    // Update current player index in game_data
    if (updates.currentPlayerIndex !== undefined) {
      const { data: currentGame } = await supabase
        .from('games')
        .select('game_data')
        .eq('game_id', gameId)
        .single();
      
      if (currentGame) {
        const gameData = currentGame.game_data as any || {};
        gameData.currentPlayerIndex = updates.currentPlayerIndex;
        updateData.game_data = gameData;
      }
    }
    
    const { error } = await supabase
      .from('games')
      .update(updateData)
      .eq('game_id', gameId);
    
    if (error) throw error;
    
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
    // Filter out undefined values
    const cleanResult = {
      winner: result.winner || null,
      loser: result.loser || null,
      isDraw: result.isDraw,
      coinsWon: result.coinsWon,
      coinsLost: result.coinsLost,
    };
    
    const { error } = await supabase
      .from('games')
      .update({
        status: GameStatus.FINISHED,
        updated_at: new Date().toISOString(),
        result_data: cleanResult,
        ended_at: new Date().toISOString(),
      })
      .eq('game_id', gameId);
    
    if (error) throw error;
    
    logFunctionEnd('finishGame', {}, { gameId, result });
  } catch (error) {
    logError('finishGame', error as Error, { gameId, result });
    throw error;
  }
};

export const cancelGame = async (gameId: string): Promise<void> => {
  logFunctionStart('cancelGame', { gameId });
  
  try {
    const { error } = await supabase
      .from('games')
      .update({
        status: GameStatus.CANCELLED,
        updated_at: new Date().toISOString(),
      })
      .eq('game_id', gameId);
    
    if (error) throw error;
    
    logFunctionEnd('cancelGame', {}, { gameId });
  } catch (error) {
    logError('cancelGame', error as Error, { gameId });
    throw error;
  }
};

export const deleteGame = async (gameId: string): Promise<void> => {
  logFunctionStart('deleteGame', { gameId });
  
  try {
    const { error } = await supabase
      .from('games')
      .delete()
      .eq('game_id', gameId);
    
    if (error) throw error;
    
    logFunctionEnd('deleteGame', {}, { gameId });
  } catch (error) {
    logError('deleteGame', error as Error, { gameId });
    throw error;
  }
};

export const getActiveGamesForUser = async (userId: string): Promise<GameState[]> => {
  logFunctionStart('getActiveGamesForUser', { userId });
  
  try {
    // Get user's active games
    const { data: gamePlayers, error: playersError } = await supabase
      .from('game_players')
      .select(`
        game_id,
        games!inner(
          game_id,
          game_type,
          status,
          stake_amount,
          game_data,
          result_data,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId);
    
    if (playersError) throw playersError;
    
    if (!gamePlayers || gamePlayers.length === 0) {
      logFunctionEnd('getActiveGamesForUser', [], { userId });
      return [];
    }
    
    const activeGames = gamePlayers
      .filter(gp => {
        const game = gp.games;
        return game.status !== GameStatus.FINISHED && 
               game.status !== GameStatus.CANCELLED;
      })
      .map(gp => {
        const game = gp.games;
        const gameData = game.game_data as any;
        
        return {
          id: game.game_id,
          type: game.game_type as GameType,
          status: game.status as GameStatus,
          players: gameData?.players || [],
          currentPlayerIndex: gameData?.currentPlayerIndex || 0,
          stake: game.stake_amount,
          createdAt: new Date(game.created_at).getTime(),
          updatedAt: new Date(game.updated_at).getTime(),
          data: gameData?.data || {},
          result: game.result_data,
        } as GameState;
      });
    
    logFunctionEnd('getActiveGamesForUser', activeGames, { userId });
    return activeGames;
  } catch (error) {
    logError('getActiveGamesForUser', error as Error, { userId });
    throw error;
  }
}; 