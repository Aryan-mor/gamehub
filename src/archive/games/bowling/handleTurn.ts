import { logFunctionStart, logFunctionEnd, logError } from '../../../modules/core/logger';
import { getGame, updateGame, finishGame } from '../../../modules/core/gameService';
import { addCoins } from '../../../modules/core/userService';
import { GameStatus, GameResult } from '../../../modules/core/types';
import { BowlingGameData, BowlingGameResult } from './types';

// Get bowling outcome description
function getBowlingOutcome(diceResult: number): string {
  if (diceResult === 6) return 'Strike! 🎯';
  if (diceResult === 4 || diceResult === 5) return 'Great Roll! 🎳';
  if (diceResult === 2 || diceResult === 3) return 'Moderate Hit';
  return 'Weak Hit';
}

// Calculate bowling winnings
function calculateBowlingWinnings(
  diceResult: number,
  stake: number
): { isWon: boolean; reward: number } {
  let isWon = false;
  let reward = 0;

  if (diceResult === 6) {
    // Strike - Jackpot Win: 4× stake
    isWon = true;
    reward = stake * 4;
  } else if (diceResult === 4 || diceResult === 5) {
    // Great Roll - Win: 2× stake
    isWon = true;
    reward = stake * 2;
  } else if (diceResult === 2 || diceResult === 3) {
    // Moderate - Refund: Return stake
    isWon = false;
    reward = stake;
  } else {
    // Weak Hit - Lose: No reward
    isWon = false;
    reward = 0;
  }

  return { isWon, reward };
}

export const handleBowlingTurn = async (
  gameId: string
): Promise<{
  success: boolean;
  result?: BowlingGameResult;
  error?: string;
}> => {
  logFunctionStart('handleBowlingTurn', { gameId });
  
  try {
    // Get current game state
    const game = await getGame(gameId);
    if (!game) {
      const result = { success: false, error: 'Game not found.' };
      logFunctionEnd('handleBowlingTurn', result, { gameId });
      return result;
    }
    
    if (game.status !== GameStatus.PLAYING) {
      const result = { success: false, error: 'Game is not in playing state.' };
      logFunctionEnd('handleBowlingTurn', result, { gameId });
      return result;
    }
    
    // Generate dice result (1-6)
    const diceResult = Math.floor(Math.random() * 6) + 1;
    
    // Calculate winnings based on bowling rules
    const stake = game.stake;
    const { isWon, reward } = calculateBowlingWinnings(diceResult, stake);
    const fee = Math.floor(stake * 0.1); // 10% fee
    
    // Calculate final amounts
    const coinsWon = isWon ? reward : 0;
    const coinsLost = isWon ? 0 : stake;
    
    // Update game data
    const bowlingData: BowlingGameData = {
      diceResult,
      isWon,
      reward,
      fee,
    };
    
    await updateGame(gameId, {
      data: bowlingData as unknown as Record<string, unknown>,
    });
    
    // Handle coin transactions
    const playerId = game.players[0].id;
    if (isWon && reward > 0) {
      await addCoins(playerId, coinsWon, 'bowling_game_win');
    } else if (reward > 0) {
      // Refund case
      await addCoins(playerId, reward, 'bowling_game_refund');
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
    
    const result: BowlingGameResult = {
      isWon,
      diceResult,
      outcome: getBowlingOutcome(diceResult),
      reward,
      fee,
      coinsWon,
      coinsLost,
    };
    
    const response = { success: true, result };
    logFunctionEnd('handleBowlingTurn', response, { gameId });
    return response;
  } catch (error) {
    logError('handleBowlingTurn', error as Error, { gameId });
    return { success: false, error: 'Failed to process bowling turn.' };
  }
}; 