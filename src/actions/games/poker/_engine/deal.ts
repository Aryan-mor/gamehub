import { 
  Card, 
  PokerPlayer, 
  PokerRoom, 
  BettingRound
} from '../types';
import { 
  createDeck, 
  shuffleDeck, 
  dealCards, 
  findBestHand 
} from '../_utils/cardUtils';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';

/**
 * Deal initial cards to players
 */
export async function dealInitialCards(room: PokerRoom): Promise<PokerRoom> {
  logFunctionStart('dealInitialCards', { roomId: room.id });
  
  try {
    // Create and shuffle deck
    const deck = shuffleDeck(createDeck());
    
    // Deal 2 cards to each player
    const updatedPlayers: PokerPlayer[] = [];
    
    for (let i = 0; i < room.players.length; i++) {
      const player = room.players[i];
      const { cards } = dealCards(deck, 2);
      
      updatedPlayers.push({
        ...player,
        cards,
        betAmount: 0,
        totalBet: 0,
        isFolded: false,
        isAllIn: false
      });
    }
    
    const updatedRoom = {
      ...room,
      players: updatedPlayers,
      deck: deck.slice(room.players.length * 2), // Remove dealt cards
      communityCards: [],
      pot: 0,
      currentBet: 0,
      minRaise: room.bigBlind,
      bettingRound: 'preflop' as BettingRound
    };
    
    logFunctionEnd('dealInitialCards', updatedRoom, { roomId: room.id });
    return updatedRoom;
  } catch (error) {
    logError('dealInitialCards', error as Error, { roomId: room.id });
    throw error;
  }
}

/**
 * Deal flop (3 community cards)
 */
export async function dealFlop(room: PokerRoom): Promise<PokerRoom> {
  logFunctionStart('dealFlop', { roomId: room.id });
  
  try {
    const { cards: flopCards, remainingDeck } = dealCards(room.deck as Card[], 3);
    
    const updatedRoom = {
      ...room,
      communityCards: flopCards,
      deck: remainingDeck,
      bettingRound: 'flop' as BettingRound,
      currentBet: 0,
      minRaise: room.bigBlind
    };
    
    logFunctionEnd('dealFlop', updatedRoom, { roomId: room.id });
    return updatedRoom;
  } catch (error) {
    logError('dealFlop', error as Error, { roomId: room.id });
    throw error;
  }
}

/**
 * Deal turn (1 community card)
 */
export async function dealTurn(room: PokerRoom): Promise<PokerRoom> {
  logFunctionStart('dealTurn', { roomId: room.id });
  
  try {
    const { cards: turnCard, remainingDeck } = dealCards(room.deck as Card[], 1);
    
    const updatedRoom = {
      ...room,
      communityCards: [...room.communityCards, ...turnCard],
      deck: remainingDeck,
      bettingRound: 'turn' as BettingRound,
      currentBet: 0,
      minRaise: room.bigBlind
    };
    
    logFunctionEnd('dealTurn', updatedRoom, { roomId: room.id });
    return updatedRoom;
  } catch (error) {
    logError('dealTurn', error as Error, { roomId: room.id });
    throw error;
  }
}

/**
 * Deal river (1 community card)
 */
export async function dealRiver(room: PokerRoom): Promise<PokerRoom> {
  logFunctionStart('dealRiver', { roomId: room.id });
  
  try {
    const { cards: riverCard, remainingDeck } = dealCards(room.deck as Card[], 1);
    
    const updatedRoom = {
      ...room,
      communityCards: [...room.communityCards, ...riverCard],
      deck: remainingDeck,
      bettingRound: 'river' as BettingRound,
      currentBet: 0,
      minRaise: room.bigBlind
    };
    
    logFunctionEnd('dealRiver', updatedRoom, { roomId: room.id });
    return updatedRoom;
  } catch (error) {
    logError('dealRiver', error as Error, { roomId: room.id });
    throw error;
  }
}

/**
 * Evaluate player hands and determine winner
 */
export async function evaluateHands(room: PokerRoom): Promise<{
  winners: PokerPlayer[];
  winningHand: unknown;
  pot: number;
}> {
  logFunctionStart('evaluateHands', { roomId: room.id });
  
  try {
    const activePlayers = room.players.filter(p => !p.isFolded);
    
    if (activePlayers.length === 1) {
      // Only one player left, they win
      const winner = activePlayers[0];
      logFunctionEnd('evaluateHands', { winners: [winner], winningHand: null, pot: room.pot }, { roomId: room.id });
      return {
        winners: [winner],
        winningHand: null,
        pot: room.pot
      };
    }
    
    // Evaluate hands for all active players
    const playerHands = activePlayers.map(player => {
      const bestHand = findBestHand(player.cards, room.communityCards);
      return {
        player,
        hand: bestHand
      };
    });
    
    // Find winner(s)
    const sortedHands = playerHands.sort((a, b) => b.hand.value - a.hand.value);
    const winners = sortedHands.filter(hand => hand.hand.value === sortedHands[0].hand.value);
    
    const result = {
      winners: winners.map(w => w.player),
      winningHand: winners[0].hand,
      pot: room.pot
    };
    
    logFunctionEnd('evaluateHands', result, { roomId: room.id });
    return result;
  } catch (error) {
    logError('evaluateHands', error as Error, { roomId: room.id });
    throw error;
  }
}

/**
 * Get card display string
 */
export function getCardDisplay(card: string): string {
  const suitSymbols: Record<string, string> = {
    'h': '♥️',
    'd': '♦️',
    'c': '♣️',
    's': '♠️'
  };
  
  const rank = card.slice(0, -1);
  const suit = card.slice(-1);
  
  return `${rank}${suitSymbols[suit]}`;
}

/**
 * Get hand display string
 */
export function getHandDisplay(hand: string[]): string {
  return hand.map(getCardDisplay).join(' ');
}

/**
 * Get community cards display string
 */
export function getCommunityCardsDisplay(communityCards: string[]): string {
  return communityCards.map(getCardDisplay).join(' ');
}

/**
 * Validate card format
 */
export function isValidCard(card: string): boolean {
  const rank = card.slice(0, -1);
  const suit = card.slice(-1);
  
  const validRanks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const validSuits = ['h', 'd', 'c', 's'];
  
  return validRanks.includes(rank) && validSuits.includes(suit);
}

/**
 * Validate deck
 */
export function validateDeck(deck: string[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!deck || deck.length === 0) {
    errors.push('Deck is empty');
    return { isValid: false, errors };
  }
  
  if (deck.length !== 52) {
    errors.push(`Deck should have 52 cards, but has ${deck.length}`);
  }
  
  // Check for duplicate cards
  const uniqueCards = new Set(deck);
  if (uniqueCards.size !== deck.length) {
    errors.push('Deck contains duplicate cards');
  }
  
  // Check card format
  for (const card of deck) {
    if (!isValidCard(card)) {
      errors.push(`Invalid card format: ${card}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get deck statistics
 */
export function getDeckStats(deck: string[]): {
  totalCards: number;
  uniqueCards: number;
  validCards: number;
  invalidCards: number;
} {
  const uniqueCards = new Set(deck);
  const validCards = deck.filter(isValidCard).length;
  const invalidCards = deck.length - validCards;
  
  return {
    totalCards: deck.length,
    uniqueCards: uniqueCards.size,
    validCards,
    invalidCards
  };
} 