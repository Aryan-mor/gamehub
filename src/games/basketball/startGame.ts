import { logFunctionStart, logFunctionEnd, logError } from '../../core/logger';
import { getUser, deductCoins } from '../../core/userService';
import { createGame, updateGame } from '../../core/gameService';
import { Player, GameType, GameStatus } from '../../core/types';
import { BasketballGameData, BasketballStake } from './types';

export const startBasketballGame = async (
  userId: string,
  stake: BasketballStake
): Promise<{
  success: boolean;
  gameId?: string;
  error?: string;
}> => {
  logFunctionStart('startBasketballGame', { userId, stake });
  
  try {
    // Validate stake amount
    if (![2, 5, 10, 20].includes(stake)) {
      const result = { success: false, error: 'Invalid stake amount. Must be 2, 5, 10, or 20 coins.' };
      logFunctionEnd('startBasketballGame', result, { userId, stake });
      return result;
    }
    
    // Check if user has enough coins
    const user = await getUser(userId);
    if (user.coins < stake) {
      const result = { success: false, error: 'Insufficient coins for this stake.' };
      logFunctionEnd('startBasketballGame', result, { userId, stake });
      return result;
    }
    
    // Deduct coins from user
    const deductionSuccess = await deductCoins(userId, stake, 'basketball_game_stake');
    if (!deductionSuccess) {
      const result = { success: false, error: 'Failed to deduct coins.' };
      logFunctionEnd('startBasketballGame', result, { userId, stake });
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
    const game = await createGame(GameType.BASKETBALL, player, stake);
    
    // Initialize basketball game data
    const basketballData: BasketballGameData = {
      guess: 'miss', // Default value, will be set by user
      diceResult: 0,
      isWon: false,
      reward: 0,
      fee: 0,
    };
    
    // Update game with basketball-specific data
    await updateGame(game.id, {
      status: GameStatus.PLAYING,
      data: basketballData as unknown as Record<string, unknown>,
    });
    
    const result = { success: true, gameId: game.id };
    logFunctionEnd('startBasketballGame', result, { userId, stake });
    return result;
  } catch (error) {
    logError('startBasketballGame', error as Error, { userId, stake });
    return { success: false, error: 'Failed to start basketball game.' };
  }
}; 