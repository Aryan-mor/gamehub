import { PokerRoom, PlayerId, RoomId } from '../types';
import { createDeck, shuffleDeck, dealCards } from '../_utils/cardUtils';
import { getPokerRoom, updatePokerRoom } from '../services/pokerService';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';

/**
 * Validate game start conditions
 */
export function validateGameStart(room: PokerRoom, playerId: PlayerId): {
  isValid: boolean;
  error?: string;
} {
  // Check if player is the room creator
  if (room.createdBy !== playerId) {
    return {
      isValid: false,
      error: 'فقط سازنده روم می‌تواند بازی را شروع کند.'
    };
  }
  
  // Check if game is already started
  if (room.status !== 'waiting') {
    return {
      isValid: false,
      error: 'بازی قبلاً شروع شده است.'
    };
  }
  
  // Check minimum players (at least 2 players)
  if (room.players.length < 2) {
    return {
      isValid: false,
      error: 'حداقل ۲ بازیکن برای شروع بازی نیاز است.'
    };
  }
  
  // Check if all players have enough chips for blinds
  const smallBlind = room.smallBlind;
  const bigBlind = room.bigBlind;
  
  for (const player of room.players) {
    if (player.chips < bigBlind) {
      return {
        isValid: false,
        error: `بازیکن ${player.name} سکه کافی برای شروع بازی ندارد.`
      };
    }
  }
  
  return { isValid: true };
}

/**
 * Generate a shuffled deck of 52 cards
 */
export function generateDeck(): string[] {
  const deck = createDeck();
  const shuffled = shuffleDeck(deck);
  
  // Convert to string format (e.g., 'Ah', '7d', etc.)
  return shuffled.map(card => {
    const rank = card.rank;
    const suit = card.suit.charAt(0).toLowerCase(); // h, d, c, s
    return `${rank}${suit}`;
  });
}

/**
 * Deal cards to players
 */
export function dealCardsToPlayers(deck: string[], playerCount: number): {
  playerHands: string[][];
  remainingDeck: string[];
} {
  if (deck.length < playerCount * 2) {
    throw new Error('Not enough cards in deck');
  }
  
  const playerHands: string[][] = [];
  const remainingDeck = [...deck];
  
  // Deal 2 cards to each player
  for (let i = 0; i < playerCount; i++) {
    const hand = remainingDeck.splice(0, 2);
    playerHands.push(hand);
  }
  
  return { playerHands, remainingDeck };
}

/**
 * Determine initial game positions
 * Dealer, Small Blind, Big Blind, and starting player (after BB)
 */
export function determineGamePositions(playerCount: number): {
  dealerIndex: number;
  smallBlindIndex: number;
  bigBlindIndex: number;
  currentTurnIndex: number;
} {
  // Randomly assign dealer (for now, just use first player)
  const dealerIndex = 0;
  const smallBlindIndex = 1 % playerCount;
  const bigBlindIndex = 2 % playerCount;
  // Starting player is the one after Big Blind
  const currentTurnIndex = (bigBlindIndex + 1) % playerCount;
  
  return {
    dealerIndex,
    smallBlindIndex,
    bigBlindIndex,
    currentTurnIndex
  };
}

/**
 * Start the poker game
 * Assign cards to players, determine positions, set initial stacks and bets,
 * change room status to playing, and determine starting player
 */
export async function startPokerGame(roomId: RoomId, playerId: PlayerId): Promise<PokerRoom> {
  logFunctionStart('startPokerGame', { roomId, playerId });
  
  try {
    // Get room
    const room = await getPokerRoom(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    
    // Validate start conditions
    const validation = validateGameStart(room, playerId);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    // Generate deck and deal cards to players
    const deck = generateDeck();
    const { playerHands, remainingDeck } = dealCardsToPlayers(deck, room.players.length);
    
    // Determine game positions (dealer, small blind, big blind, starting player)
    const positions = determineGamePositions(room.players.length);
    
    // Update players with their hands and initial state
    const updatedPlayers = room.players.map((player, index) => ({
      ...player,
      hand: playerHands[index],
      cards: playerHands[index], // Also set cards for compatibility
      status: 'active',
      hasFolded: false,
      betAmount: 0,
      totalBet: 0,
      isFolded: false,
      isAllIn: false,
      isReady: true
    }));
    
    // Post blinds (set initial stacks and bets)
    const playersWithBlinds = postBlinds(updatedPlayers, positions, room.smallBlind, room.bigBlind);
    
    // Create updated room with playing status
    const updatedRoom: PokerRoom = {
      ...room,
      status: 'playing', // Change room status to playing
      deck: remainingDeck,
      players: playersWithBlinds,
      dealerIndex: positions.dealerIndex,
      smallBlindIndex: positions.smallBlindIndex,
      bigBlindIndex: positions.bigBlindIndex,
      currentPlayerIndex: positions.currentTurnIndex, // Determine starting player (after BB)
      round: 'pre-flop',
      pot: room.smallBlind + room.bigBlind, // Initial pot from blinds
      currentBet: room.bigBlind, // Current bet is big blind
      minRaise: room.bigBlind, // Minimum raise is big blind
      communityCards: [],
      bettingRound: 'preflop',
      startedAt: Date.now(),
      lastActionAt: Date.now(),
      updatedAt: Date.now()
    };
    
    // Save to database
    const savedRoom = await updatePokerRoom(roomId, updatedRoom);
    
    logFunctionEnd('startPokerGame', savedRoom, { roomId, playerId });
    return savedRoom;
    
  } catch (error) {
    logError('startPokerGame', error as Error, { roomId, playerId });
    throw error;
  }
}

/**
 * Post small and big blinds
 * Set initial stacks and bets
 */
function postBlinds(
  players: any[],
  positions: { smallBlindIndex: number; bigBlindIndex: number },
  smallBlindAmount: number,
  bigBlindAmount: number
): any[] {
  const updatedPlayers = [...players];
  
  // Post small blind
  const smallBlindPlayer = updatedPlayers[positions.smallBlindIndex];
  const smallBlindBet = Math.min(smallBlindAmount, smallBlindPlayer.chips);
  updatedPlayers[positions.smallBlindIndex] = {
    ...smallBlindPlayer,
    chips: smallBlindPlayer.chips - smallBlindBet,
    betAmount: smallBlindBet,
    totalBet: smallBlindBet,
    isAllIn: smallBlindBet === smallBlindPlayer.chips
  };
  
  // Post big blind
  const bigBlindPlayer = updatedPlayers[positions.bigBlindIndex];
  const bigBlindBet = Math.min(bigBlindAmount, bigBlindPlayer.chips);
  updatedPlayers[positions.bigBlindIndex] = {
    ...bigBlindPlayer,
    chips: bigBlindPlayer.chips - bigBlindBet,
    betAmount: bigBlindBet,
    totalBet: bigBlindBet,
    isAllIn: bigBlindBet === bigBlindPlayer.chips
  };
  
  return updatedPlayers;
}

/**
 * Determine next turn
 */
export function determineNextTurn(room: PokerRoom): number {
  const currentIndex = room.currentPlayerIndex;
  const playerCount = room.players.length;
  
  // Find next active player
  for (let i = 1; i <= playerCount; i++) {
    const nextIndex = (currentIndex + i) % playerCount;
    const player = room.players[nextIndex];
    
    if (!player.hasFolded && !player.isAllIn) {
      return nextIndex;
    }
  }
  
  // If all players are folded or all-in, return current index
  return currentIndex;
} 