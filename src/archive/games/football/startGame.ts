import { logFunctionStart, logFunctionEnd, logError } from '../../../modules/core/logger';
import { createGame, updateGame } from '../../../modules/core/gameService';
import { getUser, deductCoins } from '../../../modules/core/userService';
import { Player, GameType, GameStatus } from '../../../modules/core/types';
import { FootballGameData, FootballStake } from './types';

export const startFootballGame = async (
  userId: string,
  stake: FootballStake
): Promise<{
  success: boolean;
  gameId?: string;
  error?: string;
}> => {
  logFunctionStart('startFootballGame', { userId, stake });
  
  try {
    // Validate stake amount
    if (![2, 5, 10, 20].includes(stake)) {
      const result = { success: false, error: 'Invalid stake amount. Must be 2, 5, 10, or 20 coins.' };
      logFunctionEnd('startFootballGame', result, { userId, stake });
      return result;
    }
    
    // Check if user has enough coins
    const user = await getUser(userId);
    if (user.coins < stake) {
      const result = { success: false, error: 'Insufficient coins for this stake.' };
      logFunctionEnd('startFootballGame', result, { userId, stake });
      return result;
    }
    
    // Deduct coins from user
    const deductionSuccess = await deductCoins(userId, stake, 'football_game_stake');
    if (!deductionSuccess) {
      const result = { success: false, error: 'Failed to deduct coins.' };
      logFunctionEnd('startFootballGame', result, { userId, stake });
      return result;
    }
    
    // Create player object
    const player: Player = {
      id: userId,
      name: user.name || user.username || 'Unknown',
      username: user.username,
      coins: user.coins - stake,
    };
    
    // Create game
    const game = await createGame(GameType.FOOTBALL, player, stake);
    
    // Initialize football game data
    const footballData: FootballGameData = {
      guess: 0, // Will be set by user
      diceResult: 0,
      isWon: false,
      reward: 0,
      fee: 0,
    };
    
    // Update game with football-specific data
    await updateGame(game.id, {
      status: GameStatus.PLAYING,
      data: footballData as unknown as Record<string, unknown>,
    });
    
    const result = { success: true, gameId: game.id };
    logFunctionEnd('startFootballGame', result, { userId, stake });
    return result;
  } catch (error) {
    logError('startFootballGame', error as Error, { userId, stake });
    return { success: false, error: 'Failed to start football game.' };
  }
}; 