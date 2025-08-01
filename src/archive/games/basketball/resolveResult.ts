import { logFunctionStart, logFunctionEnd, logError } from '../../../modules/core/logger';
import { getGame } from '../../../modules/core/gameService';
import { BasketballGameResult } from './types';

export const resolveBasketballResult = async (
  gameId: string
): Promise<{
  success: boolean;
  result?: BasketballGameResult;
  error?: string;
}> => {
  logFunctionStart('resolveBasketballResult', { gameId });
  
  try {
    const game = await getGame(gameId);
    if (!game) {
      const result = { success: false, error: 'Game not found.' };
      logFunctionEnd('resolveBasketballResult', result, { gameId });
      return result;
    }
    
    if (game.status !== 'finished') {
      const result = { success: false, error: 'Game is not finished.' };
      logFunctionEnd('resolveBasketballResult', result, { gameId });
      return result;
    }
    
    const gameData = game.data as unknown as {
      guess: 'score' | 'miss';
      diceResult: number;
      isWon: boolean;
      reward: number;
      fee: number;
    };
    
    if (!gameData) {
      const result = { success: false, error: 'Game data not found.' };
      logFunctionEnd('resolveBasketballResult', result, { gameId });
      return result;
    }
    
    const result: BasketballGameResult = {
      isWon: gameData.isWon,
      guess: gameData.guess,
      diceResult: gameData.diceResult,
      reward: gameData.reward,
      fee: gameData.fee,
      coinsWon: game.result?.coinsWon || 0,
      coinsLost: game.result?.coinsLost || 0,
    };
    
    const response = { success: true, result };
    logFunctionEnd('resolveBasketballResult', response, { gameId });
    return response;
  } catch (error) {
    logError('resolveBasketballResult', error as Error, { gameId });
    return { success: false, error: 'Failed to resolve basketball result.' };
  }
}; 