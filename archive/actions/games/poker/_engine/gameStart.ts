import { 
  PokerRoom, 
  RoomId
} from '../types';
import { 
  createDeck, 
  shuffleDeck, 
  dealCards 
} from '../_utils/cardUtils';
import { getPokerRoom } from '../services/pokerService';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';

/**
 * Start a poker game in a room
 */
export async function startPokerGame(roomId: RoomId): Promise<PokerRoom> {
  logFunctionStart('startPokerGame', { roomId });
  
  try {
    const room = await getPokerRoom(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    
    if (room.status !== 'waiting') {
      throw new Error('Room is not in waiting status');
    }
    
    if (room.players.length < room.minPlayers) {
      throw new Error(`Need at least ${room.minPlayers} players to start`);
    }
    
    const readyPlayers = room.players.filter(p => p.isReady);
    if (readyPlayers.length < room.minPlayers) {
      throw new Error(`Need at least ${room.minPlayers} ready players to start`);
    }
    
    // Create and shuffle deck
    const deck = shuffleDeck(createDeck());
    
    // Deal 2 cards to each player
    const updatedPlayers = room.players.map((player) => {
      const { cards } = dealCards(deck, 2);
      return {
        ...player,
        cards,
        betAmount: 0,
        totalBet: 0,
        isFolded: false,
        isAllIn: false
      };
    });
    
    // Set up initial game state
    const updatedRoom: PokerRoom = {
      ...room,
      status: 'playing',
      players: updatedPlayers,
      deck: deck.slice(room.players.length * 2), // Remove dealt cards
      communityCards: [],
      pot: 0,
      currentBet: 0,
      minRaise: room.bigBlind,
      bettingRound: 'preflop',
      dealerIndex: 0,
      smallBlindIndex: 1 % room.players.length,
      bigBlindIndex: 2 % room.players.length,
      currentPlayerIndex: (room.bigBlindIndex + 1) % room.players.length,
      startedAt: Date.now(),
      updatedAt: Date.now()
    };
    
    // Post blinds
    const roomWithBlinds = await postBlinds(updatedRoom);
    
    logFunctionEnd('startPokerGame', roomWithBlinds, { roomId });
    return roomWithBlinds;
  } catch (error) {
    logError('startPokerGame', error as Error, { roomId });
    throw error;
  }
}

/**
 * Post small and big blinds
 */
async function postBlinds(room: PokerRoom): Promise<PokerRoom> {
  const updatedPlayers = [...room.players];
  
  // Post small blind
  const smallBlindPlayer = updatedPlayers[room.smallBlindIndex];
  const smallBlindAmount = Math.min(room.smallBlind, smallBlindPlayer.chips);
  updatedPlayers[room.smallBlindIndex] = {
    ...smallBlindPlayer,
    chips: smallBlindPlayer.chips - smallBlindAmount,
    betAmount: smallBlindAmount,
    totalBet: smallBlindAmount,
    isAllIn: smallBlindAmount === smallBlindPlayer.chips
  };
  
  // Post big blind
  const bigBlindPlayer = updatedPlayers[room.bigBlindIndex];
  const bigBlindAmount = Math.min(room.bigBlind, bigBlindPlayer.chips);
  updatedPlayers[room.bigBlindIndex] = {
    ...bigBlindPlayer,
    chips: bigBlindPlayer.chips - bigBlindAmount,
    betAmount: bigBlindAmount,
    totalBet: bigBlindAmount,
    isAllIn: bigBlindAmount === bigBlindPlayer.chips
  };
  
  const updatedRoom = {
    ...room,
    players: updatedPlayers,
    pot: smallBlindAmount + bigBlindAmount,
    currentBet: bigBlindAmount,
    minRaise: room.bigBlind
  };
  
  return updatedRoom;
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