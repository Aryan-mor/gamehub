import { PokerPlayer, PlayerId } from '../types';
import { createDeck, shuffleDeck } from '../_utils/cardUtils';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';

/**
 * Generate a full shuffled deck of 52 cards
 */
export function generateShuffledDeck(): string[] {
  logFunctionStart('generateShuffledDeck');
  
  try {
    const deck = createDeck();
    const shuffled = shuffleDeck(deck);
    
    // Convert to string format (e.g., 'Ah', '7d', etc.)
    const stringDeck = shuffled.map(card => {
      const rank = card.rank;
      const suit = card.suit.charAt(0).toLowerCase(); // h, d, c, s
      return `${rank}${suit}`;
    });
    
    logFunctionEnd('generateShuffledDeck', { deckSize: stringDeck.length });
    return stringDeck;
  } catch (error) {
    logError('generateShuffledDeck', error as Error);
    throw error;
  }
}

/**
 * Deal cards to players
 * Deal 2 cards to each player
 */
export function dealCardsToPlayers(
  deck: string[],
  players: PokerPlayer[]
): {
  updatedPlayers: PokerPlayer[];
  remainingDeck: string[];
} {
  logFunctionStart('dealCardsToPlayers', { playerCount: players.length, deckSize: deck.length });
  
  try {
    if (deck.length < players.length * 2) {
      throw new Error('Not enough cards in deck for all players');
    }
    
    const updatedPlayers = players.map(player => ({
      ...player,
      cards: deck.splice(0, 2), // Deal 2 cards to each player
      hand: deck.splice(0, 2), // Also set hand for compatibility
      status: 'active',
      hasFolded: false,
      betAmount: 0,
      totalBet: 0,
      isFolded: false,
      isAllIn: false
    }));
    
    logFunctionEnd('dealCardsToPlayers', { 
      updatedPlayersCount: updatedPlayers.length, 
      remainingDeckSize: deck.length 
    });
    
    return {
      updatedPlayers,
      remainingDeck: deck
    };
  } catch (error) {
    logError('dealCardsToPlayers', error as Error, { playerCount: players.length });
    throw error;
  }
}

/**
 * Reserve community cards
 * Reserve 5 cards for community: [flop, turn, river]
 */
export function reserveCommunityCards(deck: string[]): {
  communityCards: string[];
  remainingDeck: string[];
} {
  logFunctionStart('reserveCommunityCards', { deckSize: deck.length });
  
  try {
    if (deck.length < 5) {
      throw new Error('Not enough cards to reserve for community cards');
    }
    
    // Reserve 5 cards for community (flop: 3, turn: 1, river: 1)
    const communityCards = deck.splice(0, 5);
    
    logFunctionEnd('reserveCommunityCards', { 
      communityCardsCount: communityCards.length, 
      remainingDeckSize: deck.length 
    });
    
    return {
      communityCards,
      remainingDeck: deck
    };
  } catch (error) {
    logError('reserveCommunityCards', error as Error);
    throw error;
  }
}

/**
 * Deal flop (first 3 community cards)
 */
export function dealFlop(deck: string[], communityCards: string[]): {
  flopCards: string[];
  remainingDeck: string[];
} {
  logFunctionStart('dealFlop', { deckSize: deck.length });
  
  try {
    if (deck.length < 3) {
      throw new Error('Not enough cards to deal flop');
    }
    
    const flopCards = deck.splice(0, 3);
    
    logFunctionEnd('dealFlop', { flopCardsCount: flopCards.length });
    
    return {
      flopCards,
      remainingDeck: deck
    };
  } catch (error) {
    logError('dealFlop', error as Error);
    throw error;
  }
}

/**
 * Deal turn (4th community card)
 */
export function dealTurn(deck: string[], communityCards: string[]): {
  turnCard: string;
  remainingDeck: string[];
} {
  logFunctionStart('dealTurn', { deckSize: deck.length });
  
  try {
    if (deck.length < 1) {
      throw new Error('Not enough cards to deal turn');
    }
    
    const turnCard = deck.splice(0, 1)[0];
    
    logFunctionEnd('dealTurn', { turnCard });
    
    return {
      turnCard,
      remainingDeck: deck
    };
  } catch (error) {
    logError('dealTurn', error as Error);
    throw error;
  }
}

/**
 * Deal river (5th community card)
 */
export function dealRiver(deck: string[], communityCards: string[]): {
  riverCard: string;
  remainingDeck: string[];
} {
  logFunctionStart('dealRiver', { deckSize: deck.length });
  
  try {
    if (deck.length < 1) {
      throw new Error('Not enough cards to deal river');
    }
    
    const riverCard = deck.splice(0, 1)[0];
    
    logFunctionEnd('dealRiver', { riverCard });
    
    return {
      riverCard,
      remainingDeck: deck
    };
  } catch (error) {
    logError('dealRiver', error as Error);
    throw error;
  }
}

/**
 * Complete initial deal process
 * Generate full shuffled deck, deal 2 cards to each player, reserve 5 cards for community
 */
export function performInitialDeal(players: PokerPlayer[]): {
  updatedPlayers: PokerPlayer[];
  deck: string[];
  communityCards: string[];
} {
  logFunctionStart('performInitialDeal', { playerCount: players.length });
  
  try {
    // Generate shuffled deck
    const fullDeck = generateShuffledDeck();
    
    // Deal cards to players
    const { updatedPlayers, remainingDeck } = dealCardsToPlayers(fullDeck, players);
    
    // Reserve community cards
    const { communityCards, remainingDeck: finalDeck } = reserveCommunityCards(remainingDeck);
    
    logFunctionEnd('performInitialDeal', { 
      updatedPlayersCount: updatedPlayers.length,
      finalDeckSize: finalDeck.length,
      communityCardsCount: communityCards.length
    });
    
    return {
      updatedPlayers,
      deck: finalDeck,
      communityCards
    };
  } catch (error) {
    logError('performInitialDeal', error as Error, { playerCount: players.length });
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