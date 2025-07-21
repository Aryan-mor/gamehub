import { logFunctionStart, logFunctionEnd, logError } from '../../core/logger';
import { createGame, updateGame } from '../../core/gameService';
import { getUser, deductCoins } from '../../core/userService';
import { Player, GameType, GameStatus } from '../../core/types';
import { DiceGameData } from './types';

export const startDiceGame = async (
  userId: string,
  stake: number
): Promise<{
  success: boolean;
  gameId?: string;
  error?: string;
}> => {
  logFunctionStart('startDiceGame', { userId, stake });
  
  try {
    // Validate stake amount
    if (stake < 1 || stake > 1000) {
      const result = { success: false, error: 'Invalid stake amount. Must be between 1 and 1000 coins.' };
      logFunctionEnd('startDiceGame', result, { userId, stake });
      return result;
    }
    
    // Check if user has enough coins
    const user = await getUser(userId);
    if (user.coins < stake) {
      const result = { success: false, error: 'Insufficient coins for this stake.' };
      logFunctionEnd('startDiceGame', result, { userId, stake });
      return result;
    }
    
    // Deduct coins from user
    const deductionSuccess = await deductCoins(userId, stake, 'dice_game_stake');
    if (!deductionSuccess) {
      const result = { success: false, error: 'Failed to deduct coins.' };
      logFunctionEnd('startDiceGame', result, { userId, stake });
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
    const game = await createGame(GameType.DICE, player, stake);
    
    // Initialize dice game data
    const diceData: DiceGameData = {
      playerGuess: 0,
      diceResult: 0,
      isWon: false,
    };
    
    // Update game with dice-specific data and set to playing status
    await updateGame(game.id, {
      status: GameStatus.PLAYING,
      data: diceData as unknown as Record<string, unknown>,
    });
    
    const result = { success: true, gameId: game.id };
    logFunctionEnd('startDiceGame', result, { userId, stake });
    return result;
  } catch (error) {
    logError('startDiceGame', error as Error, { userId, stake });
    return { success: false, error: 'Failed to start dice game.' };
  }
}; 