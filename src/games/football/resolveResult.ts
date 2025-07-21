import { logFunctionStart, logFunctionEnd, logError } from '../../core/logger';
import { getGame } from '../../core/gameService';
import { FootballGameResult } from './types';

export const resolveFootballResult = async (
  gameId: string
): Promise<{
  success: boolean;
  result?: FootballGameResult;
  error?: string;
}> => {
  logFunctionStart('resolveFootballResult', { gameId });
  
  try {
    const game = await getGame(gameId);
    if (!game) {
      const result = { success: false, error: 'Game not found.' };
      logFunctionEnd('resolveFootballResult', result, { gameId });
      return result;
    }
    
    if (game.status !== 'finished') {
      const result = { success: false, error: 'Game is not finished.' };
      logFunctionEnd('resolveFootballResult', result, { gameId });
      return result;
    }
    
    const gameData = game.data as unknown as {
      guess: number;
      diceResult: number;
      isWon: boolean;
      reward: number;
      fee: number;
    };
    
    if (!gameData) {
      const result = { success: false, error: 'Game data not found.' };
      logFunctionEnd('resolveFootballResult', result, { gameId });
      return result;
    }
    
    const result: FootballGameResult = {
      isWon: gameData.isWon,
      guess: gameData.guess,
      diceResult: gameData.diceResult,
      reward: gameData.reward,
      fee: gameData.fee,
      coinsWon: game.result?.coinsWon || 0,
      coinsLost: game.result?.coinsLost || 0,
    };
    
    const response = { success: true, result };
    logFunctionEnd('resolveFootballResult', response, { gameId });
    return response;
  } catch (error) {
    logError('resolveFootballResult', error as Error, { gameId });
    return { success: false, error: 'Failed to resolve football result.' };
  }
}; 