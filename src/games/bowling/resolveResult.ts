import { logFunctionStart, logFunctionEnd, logError } from '../../core/logger';
import { getGame } from '../../core/gameService';
import { BowlingGameResult } from './types';

export const resolveBowlingResult = async (
  gameId: string
): Promise<{
  success: boolean;
  result?: BowlingGameResult;
  error?: string;
}> => {
  logFunctionStart('resolveBowlingResult', { gameId });
  
  try {
    const game = await getGame(gameId);
    if (!game) {
      const result = { success: false, error: 'Game not found.' };
      logFunctionEnd('resolveBowlingResult', result, { gameId });
      return result;
    }
    
    if (game.status !== 'finished') {
      const result = { success: false, error: 'Game is not finished.' };
      logFunctionEnd('resolveBowlingResult', result, { gameId });
      return result;
    }
    
    const gameData = game.data as unknown as {
      diceResult: number;
      isWon: boolean;
      reward: number;
      fee: number;
    };
    
    if (!gameData) {
      const result = { success: false, error: 'Game data not found.' };
      logFunctionEnd('resolveBowlingResult', result, { gameId });
      return result;
    }
    
    const result: BowlingGameResult = {
      isWon: gameData.isWon,
      diceResult: gameData.diceResult,
      outcome: gameData.diceResult === 6 ? 'Strike! 🎯' : 
               gameData.diceResult >= 4 ? 'Great Roll! 🎳' : 
               gameData.diceResult >= 2 ? 'Moderate Hit' : 'Weak Hit',
      reward: gameData.reward,
      fee: gameData.fee,
      coinsWon: game.result?.coinsWon || 0,
      coinsLost: game.result?.coinsLost || 0,
    };
    
    const response = { success: true, result };
    logFunctionEnd('resolveBowlingResult', response, { gameId });
    return response;
  } catch (error) {
    logError('resolveBowlingResult', error as Error, { gameId });
    return { success: false, error: 'Failed to resolve bowling result.' };
  }
}; 