import { Card, Suit, Rank, HandType, HandEvaluation } from '../types';

/**
 * Create a standard 52-card deck
 */
export function createDeck(): Card[] {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const deck: Card[] = [];
  
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({
        suit,
        rank,
        value: getCardValue(rank)
      });
    }
  }
  
  return deck;
}

/**
 * Get numeric value for a card rank
 */
export function getCardValue(rank: Rank): number {
  const valueMap: Record<Rank, number> = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 11, 'Q': 12, 'K': 13, 'A': 14
  };
  return valueMap[rank];
}

/**
 * Shuffle a deck of cards using Fisher-Yates algorithm
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Deal cards from deck
 */
export function dealCards(deck: Card[], count: number): { cards: Card[], remainingDeck: Card[] } {
  if (deck.length < count) {
    throw new Error(`Not enough cards in deck. Need ${count}, have ${deck.length}`);
  }
  
  const cards = deck.slice(0, count);
  const remainingDeck = deck.slice(count);
  
  return { cards, remainingDeck };
}

/**
 * Get card display string
 */
export function getCardDisplay(card: Card): string {
  const suitSymbols: Record<Suit, string> = {
    'hearts': '♥️',
    'diamonds': '♦️',
    'clubs': '♣️',
    'spades': '♠️'
  };
  
  return `${card.rank}${suitSymbols[card.suit]}`;
}

/**
 * Get hand display string
 */
export function getHandDisplay(cards: Card[]): string {
  return cards.map(getCardDisplay).join(' ');
}

/**
 * Evaluate a poker hand (5 cards)
 */
export function evaluateHand(cards: Card[]): HandEvaluation {
  if (cards.length !== 5) {
    throw new Error('Hand evaluation requires exactly 5 cards');
  }
  
  // Sort cards by value (descending)
  const sortedCards = [...cards].sort((a, b) => b.value - a.value);
  
  // Check for each hand type from highest to lowest
  const royalFlush = checkRoyalFlush(sortedCards);
  if (royalFlush) return royalFlush;
  
  const straightFlush = checkStraightFlush(sortedCards);
  if (straightFlush) return straightFlush;
  
  const fourOfAKind = checkFourOfAKind(sortedCards);
  if (fourOfAKind) return fourOfAKind;
  
  const fullHouse = checkFullHouse(sortedCards);
  if (fullHouse) return fullHouse;
  
  const flush = checkFlush(sortedCards);
  if (flush) return flush;
  
  const straight = checkStraight(sortedCards);
  if (straight) return straight;
  
  const threeOfAKind = checkThreeOfAKind(sortedCards);
  if (threeOfAKind) return threeOfAKind;
  
  const twoPair = checkTwoPair(sortedCards);
  if (twoPair) return twoPair;
  
  const pair = checkPair(sortedCards);
  if (pair) return pair;
  
  // High card
  return {
    type: 'high-card',
    value: 1,
    cards: sortedCards,
    kickers: sortedCards
  };
}

/**
 * Find the best 5-card hand from 7 cards (2 hole cards + 5 community cards)
 */
export function findBestHand(holeCards: Card[], communityCards: Card[]): HandEvaluation {
  const allCards = [...holeCards, ...communityCards];
  
  if (allCards.length < 5) {
    throw new Error('Need at least 5 cards to evaluate hand');
  }
  
  // Generate all possible 5-card combinations
  const combinations = generateCombinations(allCards, 5);
  
  // Evaluate each combination and find the best
  let bestHand = evaluateHand(combinations[0]);
  
  for (let i = 1; i < combinations.length; i++) {
    const currentHand = evaluateHand(combinations[i]);
    if (currentHand.value > bestHand.value) {
      bestHand = currentHand;
    }
  }
  
  return bestHand;
}

/**
 * Generate all possible combinations of n cards from a deck
 */
function generateCombinations(cards: Card[], n: number): Card[][] {
  if (n === 0) return [[]];
  if (cards.length === 0) return [];
  
  const [first, ...rest] = cards;
  const withoutFirst = generateCombinations(rest, n);
  const withFirst = generateCombinations(rest, n - 1).map(combo => [first, ...combo]);
  
  return [...withoutFirst, ...withFirst];
}

// Hand checking functions
function checkRoyalFlush(cards: Card[]): HandEvaluation | null {
  const straightFlush = checkStraightFlush(cards);
  if (straightFlush && cards[0].value === 14) { // Ace high
    return {
      type: 'royal-flush',
      value: 10,
      cards,
      kickers: []
    };
  }
  return null;
}

function checkStraightFlush(cards: Card[]): HandEvaluation | null {
  const flush = checkFlush(cards);
  const straight = checkStraight(cards);
  
  if (flush && straight) {
    return {
      type: 'straight-flush',
      value: 9,
      cards,
      kickers: []
    };
  }
  return null;
}

function checkFourOfAKind(cards: Card[]): HandEvaluation | null {
  const groups = groupByValue(cards);
  const fourOfAKind = Object.entries(groups).find(([, group]) => group.length === 4);
  
  if (fourOfAKind) {
    const fourCards = fourOfAKind[1];
    const kicker = cards.find(card => card.value !== fourCards[0].value);
    if (!kicker) return null;
    
    return {
      type: 'four-of-a-kind',
      value: 8,
      cards: [...fourCards, kicker],
      kickers: [kicker]
    };
  }
  return null;
}

function checkFullHouse(cards: Card[]): HandEvaluation | null {
  const groups = groupByValue(cards);
  const threeOfAKind = Object.entries(groups).find(([, group]) => group.length === 3);
  const pair = Object.entries(groups).find(([, group]) => group.length === 2);
  
  if (threeOfAKind && pair) {
    const threeCards = threeOfAKind[1];
    const twoCards = pair[1];
    
    return {
      type: 'full-house',
      value: 7,
      cards: [...threeCards, ...twoCards],
      kickers: []
    };
  }
  return null;
}

function checkFlush(cards: Card[]): HandEvaluation | null {
  const suit = cards[0].suit;
  if (cards.every(card => card.suit === suit)) {
    return {
      type: 'flush',
      value: 6,
      cards,
      kickers: cards
    };
  }
  return null;
}

function checkStraight(cards: Card[]): HandEvaluation | null {
  // Check for regular straight
  for (let i = 0; i < cards.length - 1; i++) {
    if (cards[i].value - cards[i + 1].value !== 1) {
      return null;
    }
  }
  
  return {
    type: 'straight',
    value: 5,
    cards,
    kickers: cards
  };
}

function checkThreeOfAKind(cards: Card[]): HandEvaluation | null {
  const groups = groupByValue(cards);
  const threeOfAKind = Object.entries(groups).find(([, group]) => group.length === 3);
  
  if (threeOfAKind) {
    const threeCards = threeOfAKind[1];
    const kickers = cards.filter(card => card.value !== threeCards[0].value);
    
    return {
      type: 'three-of-a-kind',
      value: 4,
      cards: [...threeCards, ...kickers.slice(0, 2)],
      kickers: kickers.slice(0, 2)
    };
  }
  return null;
}

function checkTwoPair(cards: Card[]): HandEvaluation | null {
  const groups = groupByValue(cards);
  const pairs = Object.entries(groups).filter(([, group]) => group.length === 2);
  
  if (pairs.length >= 2) {
    const [pair1, pair2] = pairs.slice(0, 2);
    const kicker = cards.find(card => 
      card.value !== pair1[1][0].value && card.value !== pair2[1][0].value
    );
    if (!kicker) return null;
    
    return {
      type: 'two-pair',
      value: 3,
      cards: [...pair1[1], ...pair2[1], kicker],
      kickers: [kicker]
    };
  }
  return null;
}

function checkPair(cards: Card[]): HandEvaluation | null {
  const groups = groupByValue(cards);
  const pair = Object.entries(groups).find(([, group]) => group.length === 2);
  
  if (pair) {
    const pairCards = pair[1];
    const kickers = cards.filter(card => card.value !== pairCards[0].value);
    
    return {
      type: 'pair',
      value: 2,
      cards: [...pairCards, ...kickers.slice(0, 3)],
      kickers: kickers.slice(0, 3)
    };
  }
  return null;
}

/**
 * Group cards by their value
 */
function groupByValue(cards: Card[]): Record<number, Card[]> {
  const groups: Record<number, Card[]> = {};
  
  for (const card of cards) {
    if (!groups[card.value]) {
      groups[card.value] = [];
    }
    groups[card.value].push(card);
  }
  
  return groups;
}

/**
 * Get hand type display name
 */
export function getHandTypeDisplay(type: HandType): string {
  const displayNames: Record<HandType, string> = {
    'high-card': 'High Card',
    'pair': 'Pair',
    'two-pair': 'Two Pair',
    'three-of-a-kind': 'Three of a Kind',
    'straight': 'Straight',
    'flush': 'Flush',
    'full-house': 'Full House',
    'four-of-a-kind': 'Four of a Kind',
    'straight-flush': 'Straight Flush',
    'royal-flush': 'Royal Flush'
  };
  
  return displayNames[type];
} 