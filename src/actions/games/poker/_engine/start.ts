import { PokerRoom, RoomId, PlayerId } from '../types';
import { getPokerRoom, updatePokerRoom } from '../services/pokerService';
import { startPokerGame } from './gameStart';
import { notifyAllPlayers, notifyPlayer } from './notify';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';

/**
 * Start the poker game engine
 * Called by /room/start.ts after status = "playing" is set
 */
export async function startPokerGameEngine(
  roomId: RoomId,
  playerId: PlayerId
): Promise<PokerRoom> {
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
    
    // Start the poker game using the new startPokerGame function
    const gameRoom = await startPokerGame(roomId);
    
    // Send notifications to all players
    await notifyAllPlayers(gameRoom, '🎮 Game started!');
    
    // Send private notifications to each player
    for (const player of gameRoom.players) {
      await notifyPlayer(player, `🎮 Game started! Your cards: ${player.cards.map(card => `${card.rank}${card.suit.charAt(0)}`).join(' ')}`);
    }
    
    logFunctionEnd('startPokerGameEngine', gameRoom, { roomId, playerId });
    return gameRoom;
    
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
      error: 'Only the room creator can start the game.'
    };
  }
  
  // Check if game is already started
  if (room.status !== 'waiting') {
    return {
      isValid: false,
      error: 'Game is already started.'
    };
  }
  
  // Check minimum players (at least 2 players)
  if (room.players.length < 2) {
    return {
      isValid: false,
      error: 'Need at least 2 players to start.'
    };
  }
  
  // Check if all players have enough chips for blinds
  const bigBlind = room.bigBlind;
  
  for (const player of room.players) {
    if (player.chips < bigBlind) {
      return {
        isValid: false,
        error: `Player ${player.name} doesn't have enough chips to start.`
      };
    }
  }
  
  return { isValid: true };
}

/**
 * Get current game state
 */
export async function getGameState(roomId: RoomId): Promise<PokerRoom | null> {
  logFunctionStart('getGameState', { roomId });
  
  try {
    const room = await getPokerRoom(roomId);
    
    if (!room) {
      logFunctionEnd('getGameState', null, { roomId });
      return null;
    }
    
    logFunctionEnd('getGameState', room, { roomId });
    return room;
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
  gameState: PokerRoom
): Promise<PokerRoom> {
  logFunctionStart('updateGameStateInDatabase', { roomId });
  
  try {
    const updatedRoom = await updatePokerRoom(roomId, gameState);
    
    logFunctionEnd('updateGameStateInDatabase', updatedRoom, { roomId });
    return updatedRoom;
  } catch (error) {
    logError('updateGameStateInDatabase', error as Error, { roomId });
    throw error;
  }
} 