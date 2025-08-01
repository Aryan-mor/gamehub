import { logFunctionStart, logFunctionEnd, logError } from '../../../modules/core/logger';
import { getGame, updateGame, finishGame } from '../../../modules/core/gameService';
import { addCoins } from '../../../modules/core/userService';
import { GameStatus, GameResult } from '../../../modules/core/types';
import { FootballGameData, FootballGameResult } from './types';

export const handleFootballTurn = async (
  gameId: string,
  guess: number
): Promise<{
  success: boolean;
  result?: FootballGameResult;
  error?: string;
}> => {
  logFunctionStart('handleFootballTurn', { gameId, guess });
  
  try {
    // Validate guess
    if (guess < 1 || guess > 5) {
      const result = { success: false, error: 'Invalid guess. Must be between 1 and 5.' };
      logFunctionEnd('handleFootballTurn', result, { gameId, guess });
      return result;
    }
    
    // Get current game state
    const game = await getGame(gameId);
    if (!game) {
      const result = { success: false, error: 'Game not found.' };
      logFunctionEnd('handleFootballTurn', result, { gameId, guess });
      return result;
    }
    
    if (game.status !== GameStatus.PLAYING) {
      const result = { success: false, error: 'Game is not in playing state.' };
      logFunctionEnd('handleFootballTurn', result, { gameId, guess });
      return result;
    }
    
    // Generate dice result (1-5)
    const diceResult = Math.floor(Math.random() * 5) + 1;
    
    // Calculate winnings based on football rules
    const stake = game.stake;
    const { isWon, reward } = calculateFootballWinnings(guess, diceResult, stake);
    const fee = Math.floor(stake * 0.1); // 10% fee
    
    // Calculate final amounts
    const coinsWon = isWon ? reward : 0;
    const coinsLost = isWon ? 0 : stake;
    
    // Update game data
    const footballData: FootballGameData = {
      guess,
      diceResult,
      isWon,
      reward,
      fee,
    };
    
    await updateGame(gameId, {
      data: footballData as unknown as Record<string, unknown>,
    });
    
    // Handle coin transactions
    const playerId = game.players[0].id;
    if (isWon) {
      await addCoins(playerId, coinsWon, 'football_game_win');
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
    
    const result: FootballGameResult = {
      isWon,
      guess,
      diceResult,
      reward,
      fee,
      coinsWon,
      coinsLost,
    };
    
    const response = { success: true, result };
    logFunctionEnd('handleFootballTurn', response, { gameId, guess });
    return response;
  } catch (error) {
    logError('handleFootballTurn', error as Error, { gameId, guess });
    return { success: false, error: 'Failed to process football turn.' };
  }
};

// Football winning calculation logic
function calculateFootballWinnings(
  guess: number,
  diceResult: number,
  stake: number
): { isWon: boolean; reward: number } {
  if (guess === diceResult) {
    // Exact match - 3x payout
    const reward = Math.floor(stake * 3);
    return { isWon: true, reward };
  } else if (Math.abs(guess - diceResult) === 1) {
    // Close guess - 1.5x payout
    const reward = Math.floor(stake * 1.5);
    return { isWon: true, reward };
  } else {
    // Wrong guess
    return { isWon: false, reward: 0 };
  }
} 