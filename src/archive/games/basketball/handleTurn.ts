import { logFunctionStart, logFunctionEnd, logError } from '../../../modules/core/logger';
import { getGame, updateGame, finishGame } from '../../../modules/core/gameService';
import { addCoins } from '../../../modules/core/userService';
import { GameStatus, GameResult } from '../../../modules/core/types';
import { BasketballGameData, BasketballGameResult } from './types';

export const handleBasketballTurn = async (
  gameId: string,
  guess: 'score' | 'miss'
): Promise<{
  success: boolean;
  result?: BasketballGameResult;
  error?: string;
}> => {
  logFunctionStart('handleBasketballTurn', { gameId, guess });
  
  try {
    // Validate guess
    if (guess !== 'score' && guess !== 'miss') {
      const result = { success: false, error: 'Invalid guess. Must be "score" or "miss".' };
      logFunctionEnd('handleBasketballTurn', result, { gameId, guess });
      return result;
    }
    
    // Get current game state
    const game = await getGame(gameId);
    if (!game) {
      const result = { success: false, error: 'Game not found.' };
      logFunctionEnd('handleBasketballTurn', result, { gameId, guess });
      return result;
    }
    
    if (game.status !== GameStatus.PLAYING) {
      const result = { success: false, error: 'Game is not in playing state.' };
      logFunctionEnd('handleBasketballTurn', result, { gameId, guess });
      return result;
    }
    
    // Generate dice result (1-6)
    const diceResult = Math.floor(Math.random() * 6) + 1;
    
    // Calculate winnings based on basketball rules
    const stake = game.stake;
    const { isWon, reward, fee } = calculateBasketballWinnings(guess, diceResult, stake);
    
    // Calculate final amounts
    const coinsWon = isWon ? reward : 0;
    const coinsLost = isWon ? 0 : stake;
    
    // Update game data
    const basketballData: BasketballGameData = {
      guess,
      diceResult,
      isWon,
      reward,
      fee,
    };
    
    await updateGame(gameId, {
      data: basketballData as unknown as Record<string, unknown>,
    });
    
    // Handle coin transactions
    const playerId = game.players[0].id;
    if (isWon) {
      await addCoins(playerId, coinsWon, 'basketball_game_win');
    }
    
    // Create game result
    const gameResult: GameResult = {
      winner: isWon ? playerId : undefined,
      loser: isWon ? undefined : playerId,
      isDraw: false,
      coinsWon,
      coinsLost,
    };
    
    // Finish the game
    await finishGame(gameId, gameResult);
    
    const result: BasketballGameResult = {
      isWon,
      guess,
      diceResult,
      reward,
      fee,
      coinsWon,
      coinsLost,
    };
    
    const response = { success: true, result };
    logFunctionEnd('handleBasketballTurn', response, { gameId, guess });
    return response;
  } catch (error) {
    logError('handleBasketballTurn', error as Error, { gameId, guess });
    return { success: false, error: 'Failed to process basketball turn.' };
  }
};

// Basketball winning calculation logic
function calculateBasketballWinnings(
  guess: 'score' | 'miss',
  diceResult: number,
  stake: number
): { isWon: boolean; reward: number; fee: number } {
  const fee = Math.floor(stake * 0.1); // 10% fee
  
  if (guess === 'score') {
    // Player guessed "score"
    if (diceResult >= 4) {
      // Score! (4, 5, 6)
      const reward = Math.floor(stake * 1.8); // 1.8x payout
      return { isWon: true, reward, fee };
    } else {
      // Miss (1, 2, 3)
      return { isWon: false, reward: 0, fee };
    }
  } else {
    // Player guessed "miss"
    if (diceResult <= 3) {
      // Miss! (1, 2, 3)
      const reward = Math.floor(stake * 1.8); // 1.8x payout
      return { isWon: true, reward, fee };
    } else {
      // Score (4, 5, 6)
      return { isWon: false, reward: 0, fee };
    }
  }
} 