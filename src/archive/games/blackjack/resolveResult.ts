import { logFunctionStart, logFunctionEnd, logError } from '../../../modules/core/logger';
import { getGame } from '../../../modules/core/gameService';
import { BlackjackGameResult } from './types';

export const resolveBlackjackResult = async (
  gameId: string
): Promise<{
  success: boolean;
  result?: BlackjackGameResult;
  error?: string;
}> => {
  logFunctionStart('resolveBlackjackResult', { gameId });
  
  try {
    const game = await getGame(gameId);
    if (!game) {
      const result = { success: false, error: 'Game not found.' };
      logFunctionEnd('resolveBlackjackResult', result, { gameId });
      return result;
    }
    
    if (game.status !== 'finished') {
      const result = { success: false, error: 'Game is not finished.' };
      logFunctionEnd('resolveBlackjackResult', result, { gameId });
      return result;
    }
    
    const gameData = game.data as unknown as {
      playerHand: Array<{ suit: 'hearts' | 'diamonds' | 'clubs' | 'spades'; value: number; displayValue: string }>;
      dealerHand: Array<{ suit: 'hearts' | 'diamonds' | 'clubs' | 'spades'; value: number; displayValue: string }>;
      result: 'win' | 'lose' | 'push';
      reward: number;
      fee: number;
    };
    
    if (!gameData) {
      const result = { success: false, error: 'Game data not found.' };
      logFunctionEnd('resolveBlackjackResult', result, { gameId });
      return result;
    }
    
    const result: BlackjackGameResult = {
      isWon: gameData.result === 'win' || gameData.result === 'push',
      result: gameData.result,
      playerHand: gameData.playerHand,
      dealerHand: gameData.dealerHand,
      playerScore: 0, // Would need to recalculate
      dealerScore: 0, // Would need to recalculate
      reward: gameData.reward,
      fee: gameData.fee,
      coinsWon: game.result?.coinsWon || 0,
      coinsLost: game.result?.coinsLost || 0,
    };
    
    const response = { success: true, result };
    logFunctionEnd('resolveBlackjackResult', response, { gameId });
    return response;
  } catch (error) {
    logError('resolveBlackjackResult', error as Error, { gameId });
    return { success: false, error: 'Failed to resolve blackjack result.' };
  }
}; 