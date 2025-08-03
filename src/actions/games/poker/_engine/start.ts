import { PokerRoom, RoomId, PlayerId } from '../types';
import { getPokerRoom, updatePokerRoom } from '../services/pokerService';
import { initializeGameState, PokerGameState } from './state';
import { performInitialDeal } from './deal';
import { sendGameStartNotification, sendPrivateHandMessage, sendTurnNotification } from './notify';
import { determineGamePositions } from './gameStart';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';
import { Bot } from 'grammy';

/**
 * Start the poker game engine
 * Called by /room/start.ts after status = "playing" is set
 */
export async function startPokerGameEngine(
  roomId: RoomId,
  playerId: PlayerId,
  bot: Bot
): Promise<PokerGameState> {
  logFunctionStart('startPokerGameEngine', { roomId, playerId });
  
  try {
    // Get room information
    const room = await getPokerRoom(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    
    // Validate start conditions
    const validation = validateGameStartConditions(room, playerId);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    // Set room status to "playing"
    const roomWithPlayingStatus = await updatePokerRoom(roomId, {
      status: 'playing',
      startedAt: Date.now(),
      lastActionAt: Date.now(),
      updatedAt: Date.now()
    });
    
    // Fetch the updated room
    const updatedRoom = await getPokerRoom(roomId);
    if (!updatedRoom) {
      throw new Error('Failed to update room status');
    }
    
    // Determine game positions (dealer, blinds, turn order)
    const positions = determineGamePositions(updatedRoom.players.length);
    
    // Perform initial deal
    const { updatedPlayers, deck, communityCards } = performInitialDeal(updatedRoom.players);
    
    // Post blinds
    const playersWithBlinds = postBlinds(updatedPlayers, positions, updatedRoom.smallBlind, updatedRoom.bigBlind);
    
    // Create final room state with game data
    const finalRoom: PokerRoom = {
      ...updatedRoom,
      status: 'playing',
      players: playersWithBlinds,
      deck: deck,
      communityCards: [],
      dealerIndex: positions.dealerIndex,
      smallBlindIndex: positions.smallBlindIndex,
      bigBlindIndex: positions.bigBlindIndex,
      currentPlayerIndex: positions.currentTurnIndex,
      round: 'pre-flop',
      pot: updatedRoom.smallBlind + updatedRoom.bigBlind,
      currentBet: updatedRoom.bigBlind,
      minRaise: updatedRoom.bigBlind,
      bettingRound: 'preflop',
      startedAt: Date.now(),
      lastActionAt: Date.now(),
      updatedAt: Date.now()
    };
    
    // Save final room state to database
    const savedRoom = await updatePokerRoom(roomId, finalRoom);
    
    // Initialize game state
    const gameState = initializeGameState(savedRoom);
    
    // Send notifications to all players
    await sendGameStartNotification(bot, gameState);
    
    // Send private hand messages to each player
    for (const player of gameState.players) {
      await sendPrivateHandMessage(bot, gameState, player.id);
    }
    
    // Send turn notifications to all players
    for (const player of gameState.players) {
      await sendTurnNotification(bot, gameState, player.id);
    }
    
    logFunctionEnd('startPokerGameEngine', gameState, { roomId, playerId });
    return gameState;
    
  } catch (error) {
    logError('startPokerGameEngine', error as Error, { roomId, playerId });
    throw error;
  }
}

/**
 * Validate game start conditions
 */
function validateGameStartConditions(room: PokerRoom, playerId: PlayerId): {
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
  
  // Check minimum players
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
 * Post small and big blinds
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
 * Get game state for a specific room
 */
export async function getGameState(roomId: RoomId): Promise<PokerGameState | null> {
  logFunctionStart('getGameState', { roomId });
  
  try {
    const room = await getPokerRoom(roomId);
    if (!room || room.status === 'waiting') {
      return null;
    }
    
    const gameState = initializeGameState(room);
    
    logFunctionEnd('getGameState', gameState, { roomId });
    return gameState;
    
  } catch (error) {
    logError('getGameState', error as Error, { roomId });
    return null;
  }
}

/**
 * Update game state in database
 */
export async function updateGameStateInDatabase(
  roomId: RoomId,
  gameState: PokerGameState
): Promise<PokerRoom> {
  logFunctionStart('updateGameStateInDatabase', { roomId });
  
  try {
    const updatedRoom: PokerRoom = {
      id: gameState.roomId,
      name: gameState.roomName,
      status: gameState.status,
      players: gameState.players,
      currentPlayerIndex: gameState.currentTurnIndex,
      dealerIndex: gameState.dealerIndex,
      smallBlindIndex: gameState.smallBlindIndex,
      bigBlindIndex: gameState.bigBlindIndex,
      pot: gameState.pot,
      currentBet: gameState.currentBet,
      minRaise: gameState.minRaise,
      deck: gameState.deck,
      communityCards: gameState.communityCards,
      bettingRound: gameState.bettingRound,
      smallBlind: gameState.smallBlind,
      bigBlind: gameState.bigBlind,
      minPlayers: 2,
      maxPlayers: gameState.players.length,
      isPrivate: false, // This should come from original room
      turnTimeoutSec: gameState.turnTimeoutSec,
      createdBy: gameState.players[0]?.id || 'unknown',
      createdAt: gameState.startedAt,
      updatedAt: gameState.updatedAt,
      startedAt: gameState.startedAt,
      lastActionAt: gameState.lastActionAt
    };
    
    const savedRoom = await updatePokerRoom(roomId, updatedRoom);
    
    logFunctionEnd('updateGameStateInDatabase', savedRoom, { roomId });
    return savedRoom;
    
  } catch (error) {
    logError('updateGameStateInDatabase', error as Error, { roomId });
    throw error;
  }
} 