import { logFunctionStart, logFunctionEnd, logError } from '../../../modules/core/logger';
import { createGame, updateGame } from '../../../modules/core/gameService';
import { getUser, deductCoins } from '../../../modules/core/userService';
import { Player, GameType, GameStatus } from '../../../modules/core/types';
import { BlackjackGameData, BlackjackStake, Card } from './types';

// Create a new deck of cards
function createDeck(): Card[] {
  const suits: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const deck: Card[] = [];

  for (const suit of suits) {
    for (let value = 1; value <= 13; value++) {
      let displayValue: string;
      if (value === 1) displayValue = 'A';
      else if (value === 11) displayValue = 'J';
      else if (value === 12) displayValue = 'Q';
      else if (value === 13) displayValue = 'K';
      else displayValue = value.toString();

      deck.push({
        suit,
        value,
        displayValue,
      });
    }
  }

  // Shuffle the deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

// Deal initial cards
function dealInitialCards(deck: Card[]): { playerHand: Card[]; dealerHand: Card[]; remainingDeck: Card[] } {
  const playerHand = [deck.pop()!, deck.pop()!];
  const dealerHand = [deck.pop()!, deck.pop()!];
  
  return {
    playerHand,
    dealerHand,
    remainingDeck: deck,
  };
}

export const startBlackjackGame = async (
  userId: string,
  stake: BlackjackStake
): Promise<{
  success: boolean;
  gameId?: string;
  error?: string;
}> => {
  logFunctionStart('startBlackjackGame', { userId, stake });
  
  try {
    // Validate stake amount
    if (![2, 5, 10, 20, 30, 50].includes(stake)) {
      const result = { success: false, error: 'Invalid stake amount. Must be 2, 5, 10, 20, 30, or 50 coins.' };
      logFunctionEnd('startBlackjackGame', result, { userId, stake });
      return result;
    }
    
    // Check if user has enough coins
    const user = await getUser(userId);
    if (user.coins < stake) {
      const result = { success: false, error: 'Insufficient coins for this stake.' };
      logFunctionEnd('startBlackjackGame', result, { userId, stake });
      return result;
    }
    
    // Deduct coins from user
    const deductionSuccess = await deductCoins(userId, stake, 'blackjack_game_stake');
    if (!deductionSuccess) {
      const result = { success: false, error: 'Failed to deduct coins.' };
      logFunctionEnd('startBlackjackGame', result, { userId, stake });
      return result;
    }
    
    // Create player object
    const player: Player = {
      id: userId,
      name: user.name || user.username || 'Unknown',
      username: user.username,
      coins: user.coins - stake,
    };
    
    // Create game
    const game = await createGame(GameType.BLACKJACK, player, stake);
    
    // Create deck and deal initial cards
    const deck = createDeck();
    const { playerHand, dealerHand, remainingDeck } = dealInitialCards(deck);
    
    // Initialize blackjack game data
    const blackjackData: BlackjackGameData = {
      playerHand,
      dealerHand,
      deck: remainingDeck,
      result: undefined,
      reward: 0,
      fee: 0,
    };
    
    // Update game with blackjack-specific data
    const cleanData = Object.fromEntries(
      Object.entries(blackjackData).filter(([, value]) => value !== undefined)
    );
    
    await updateGame(game.id, {
      status: GameStatus.PLAYING,
      data: cleanData as unknown as Record<string, unknown>,
    });
    
    const result = { success: true, gameId: game.id };
    logFunctionEnd('startBlackjackGame', result, { userId, stake });
    return result;
  } catch (error) {
    logError('startBlackjackGame', error as Error, { userId, stake });
    return { success: false, error: 'Failed to start blackjack game.' };
  }
}; 