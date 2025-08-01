import { logFunctionStart, logFunctionEnd, logError } from '../../../modules/core/logger';
import { getGame } from '../../../modules/core/gameService';
import { DiceGameResult } from './types';

export const resolveDiceResult = async (
  gameId: string
): Promise<{
  success: boolean;
  result?: DiceGameResult;
  error?: string;
}> => {
  logFunctionStart('resolveDiceResult', { gameId });
  
  try {
    const game = await getGame(gameId);
    if (!game) {
      const result = { success: false, error: 'Game not found.' };
      logFunctionEnd('resolveDiceResult', result, { gameId });
      return result;
    }
    
    if (game.status !== 'finished') {
      const result = { success: false, error: 'Game is not finished.' };
      logFunctionEnd('resolveDiceResult', result, { gameId });
      return result;
    }
    
    const gameData = game.data as unknown as {
      playerGuess: number;
      diceResult: number;
      isWon: boolean;
    };
    
    if (!gameData) {
      const result = { success: false, error: 'Game data not found.' };
      logFunctionEnd('resolveDiceResult', result, { gameId });
      return result;
    }
    
    const result: DiceGameResult = {
      isWon: gameData.isWon,
      playerGuess: gameData.playerGuess,
      diceResult: gameData.diceResult,
      coinsWon: game.result?.coinsWon || 0,
      coinsLost: game.result?.coinsLost || 0,
    };
    
    const response = { success: true, result };
    logFunctionEnd('resolveDiceResult', response, { gameId });
    return response;
  } catch (error) {
    logError('resolveDiceResult', error as Error, { gameId });
    return { success: false, error: 'Failed to resolve dice result.' };
  }
}; 