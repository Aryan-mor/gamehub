import { logFunctionStart, logFunctionEnd, logError } from '../../../modules/core/logger';
import { getGame, updateGame, finishGame } from '../../../modules/core/gameService';
import { addCoins } from '../../../modules/core/userService';
import { GameStatus, GameResult } from '../../../modules/core/types';
import { DiceGameData, DiceGameResult } from './types';

export const handleDiceTurn = async (
  gameId: string,
  playerGuess: number
): Promise<{
  success: boolean;
  result?: DiceGameResult;
  error?: string;
}> => {
  logFunctionStart('handleDiceTurn', { gameId, playerGuess });
  
  try {
    // Validate guess
    if (playerGuess < 1 || playerGuess > 6) {
      const result = { success: false, error: 'Invalid guess. Must be between 1 and 6.' };
      logFunctionEnd('handleDiceTurn', result, { gameId, playerGuess });
      return result;
    }
    
    // Get current game state
    const game = await getGame(gameId);
    if (!game) {
      const result = { success: false, error: 'Game not found.' };
      logFunctionEnd('handleDiceTurn', result, { gameId, playerGuess });
      return result;
    }
    
    if (game.status !== GameStatus.PLAYING) {
      const result = { success: false, error: 'Game is not in playing state.' };
      logFunctionEnd('handleDiceTurn', result, { gameId, playerGuess });
      return result;
    }
    
    // Generate dice result
    const diceResult = Math.floor(Math.random() * 6) + 1;
    const isWon = playerGuess === diceResult;
    
    // Calculate winnings
    const stake = game.stake;
    const coinsWon = isWon ? stake * 5 : 0; // 5x payout for correct guess
    const coinsLost = isWon ? 0 : stake;
    
    // Update game data
    const diceData: DiceGameData = {
      playerGuess,
      diceResult,
      isWon,
    };
    
    await updateGame(gameId, {
      data: diceData as unknown as Record<string, unknown>,
    });
    
    // Handle coin transactions
    const playerId = game.players[0].id;
    if (isWon) {
      await addCoins(playerId, coinsWon, 'dice_game_win');
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
    
    const result: DiceGameResult = {
      isWon,
      playerGuess,
      diceResult,
      coinsWon,
      coinsLost,
    };
    
    const response = { success: true, result };
    logFunctionEnd('handleDiceTurn', response, { gameId, playerGuess });
    return response;
  } catch (error) {
    logError('handleDiceTurn', error as Error, { gameId, playerGuess });
    return { success: false, error: 'Failed to process dice turn.' };
  }
}; 