import { logFunctionStart, logFunctionEnd, logError } from '../../../modules/core/logger';
import { getGame, updateGame, finishGame } from '../../../modules/core/gameService';
import { addCoins } from '../../../modules/core/userService';
import { GameStatus, GameResult } from '../../../modules/core/types';
import { BlackjackGameData, BlackjackGameResult, Card } from './types';

// Calculate hand value
function calculateHandValue(hand: Card[]): number {
  let value = 0;
  let aces = 0;

  for (const card of hand) {
    if (card.value === 1) {
      aces++;
      value += 11;
    } else if (card.value >= 10) {
      value += 10;
    } else {
      value += card.value;
    }
  }

  // Adjust for aces
  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }

  return value;
}

// Deal a card from deck
function dealCard(deck: Card[]): { card: Card; remainingDeck: Card[] } {
  const card = deck.pop()!;
  return { card, remainingDeck: deck };
}

// Dealer AI - hit on 16 or less, stand on 17 or more
function dealerShouldHit(dealerHand: Card[]): boolean {
  const dealerValue = calculateHandValue(dealerHand);
  return dealerValue <= 16;
}

export const handleBlackjackTurn = async (
  gameId: string,
  action: 'hit' | 'stand'
): Promise<{
  success: boolean;
  result?: BlackjackGameResult;
  error?: string;
}> => {
  logFunctionStart('handleBlackjackTurn', { gameId, action });
  
  try {
    // Validate action
    if (action !== 'hit' && action !== 'stand') {
      const result = { success: false, error: 'Invalid action. Must be "hit" or "stand".' };
      logFunctionEnd('handleBlackjackTurn', result, { gameId, action });
      return result;
    }
    
    // Get current game state
    const game = await getGame(gameId);
    if (!game) {
      const result = { success: false, error: 'Game not found.' };
      logFunctionEnd('handleBlackjackTurn', result, { gameId, action });
      return result;
    }
    
    if (game.status !== GameStatus.PLAYING) {
      const result = { success: false, error: 'Game is not in playing state.' };
      logFunctionEnd('handleBlackjackTurn', result, { gameId, action });
      return result;
    }
    
    const gameData = game.data as unknown as BlackjackGameData;
    const { playerHand, dealerHand, deck } = gameData;
    const stake = game.stake;
    
    const updatedPlayerHand = [...playerHand];
    const updatedDealerHand = [...dealerHand];
    let updatedDeck = [...deck];
    let gameResult: 'win' | 'lose' | 'push' | undefined;
    
    if (action === 'hit') {
      // Player hits
      const { card, remainingDeck } = dealCard(updatedDeck);
      updatedPlayerHand.push(card);
      updatedDeck = remainingDeck;
      
      const playerValue = calculateHandValue(updatedPlayerHand);
      
      if (playerValue > 21) {
        // Player busts
        gameResult = 'lose';
      }
    } else {
      // Player stands, dealer plays
      while (dealerShouldHit(updatedDealerHand)) {
        const { card, remainingDeck } = dealCard(updatedDeck);
        updatedDealerHand.push(card);
        updatedDeck = remainingDeck;
      }
      
      const playerValue = calculateHandValue(updatedPlayerHand);
      const dealerValue = calculateHandValue(updatedDealerHand);
      
      if (dealerValue > 21) {
        // Dealer busts
        gameResult = 'win';
      } else if (playerValue > dealerValue) {
        gameResult = 'win';
      } else if (playerValue < dealerValue) {
        gameResult = 'lose';
      } else {
        gameResult = 'push';
      }
    }
    
    // Calculate winnings
    const fee = Math.floor(stake * 0.1); // 10% fee
    let reward = 0;
    let isWon = false;
    
    if (gameResult === 'win') {
      reward = Math.floor(stake * 2); // 2x payout for blackjack
      isWon = true;
    } else if (gameResult === 'push') {
      reward = stake; // Return stake for push
      isWon = true;
    }
    
    // Calculate final amounts
    const coinsWon = isWon ? reward : 0;
    const coinsLost = isWon ? 0 : stake;
    
    // Update game data
    const updatedBlackjackData: BlackjackGameData = {
      playerHand: updatedPlayerHand,
      dealerHand: updatedDealerHand,
      deck: updatedDeck,
      result: gameResult,
      reward,
      fee,
    };
    
    // Filter out undefined values before sending to Firebase
    const cleanData = Object.fromEntries(
      Object.entries(updatedBlackjackData).filter(([, value]) => value !== undefined)
    );
    
    await updateGame(gameId, {
      data: cleanData as unknown as Record<string, unknown>,
    });
    
    // Handle coin transactions
    const playerId = game.players[0].id;
    if (isWon) {
      await addCoins(playerId, coinsWon, 'blackjack_game_win');
    }
    
    // Create game result
    const finalGameResult: GameResult = {
      winner: isWon ? playerId : undefined,
      loser: isWon ? undefined : playerId,
      isDraw: gameResult === 'push',
      coinsWon,
      coinsLost,
    };
    
    // Finish the game
    await finishGame(gameId, finalGameResult);
    
    const result: BlackjackGameResult = {
      isWon,
      result: gameResult!,
      playerHand: updatedPlayerHand,
      dealerHand: updatedDealerHand,
      playerScore: calculateHandValue(updatedPlayerHand),
      dealerScore: calculateHandValue(updatedDealerHand),
      reward,
      fee,
      coinsWon,
      coinsLost,
    };
    
    const response = { success: true, result };
    logFunctionEnd('handleBlackjackTurn', response, { gameId, action });
    return response;
  } catch (error) {
    logError('handleBlackjackTurn', error as Error, { gameId, action });
    return { success: false, error: 'Failed to process blackjack turn.' };
  }
}; 