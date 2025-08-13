import { logFunctionStart, logFunctionEnd } from '@/modules/core/logger';

export interface Card {
  rank: string;
  suit: string;
  value: number;
}

export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;
export const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'] as const;

export function createDeck(seed?: string): Card[] {
  logFunctionStart('cardUtils.createDeck', { seed });
  const deck: Card[] = [];
  
  for (const suit of SUITS) {
    for (let i = 0; i < RANKS.length; i++) {
      const rank = RANKS[i];
      deck.push({
        rank,
        suit,
        value: i + 2 // 2 = 2, A = 14
      });
    }
  }
  
  // Simple shuffle using seed
  if (seed) {
    const seedNum = parseInt(seed, 10) || 0;
    for (let i = deck.length - 1; i > 0; i--) {
      const j = (seedNum + i) % (i + 1);
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  } else {
    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }
  
  logFunctionEnd('cardUtils.createDeck', { deckSize: deck.length });
  return deck;
}

export function dealCards(deck: Card[], count: number): { cards: Card[], remainingDeck: Card[] } {
  logFunctionStart('cardUtils.dealCards', { count, deckSize: deck.length });
  
  if (count > deck.length) {
    throw new Error('Not enough cards in deck');
  }
  
  const cards = deck.slice(0, count);
  const remainingDeck = deck.slice(count);
  
  logFunctionEnd('cardUtils.dealCards', { dealtCount: cards.length, remainingCount: remainingDeck.length });
  return { cards, remainingDeck };
}

export function cardToString(card: Card): string {
  const suitSymbols: Record<string, string> = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠'
  };
  
  return `${card.rank}${suitSymbols[card.suit]}`;
}

export function cardsToString(cards: Card[]): string {
  return cards.map(cardToString).join(' ');
}
