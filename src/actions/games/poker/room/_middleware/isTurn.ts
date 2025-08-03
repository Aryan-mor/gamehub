import { HandlerContext } from '@/modules/core/handler';
import { Middleware } from '@/modules/core/middleware';
import { validateUser } from '@/actions/games/poker/_utils/validateUser';
import { getRoomId } from '@/actions/games/poker/_utils/getRoomId';
import { getPokerRoom } from '../../services/pokerService';
import { RoomId, PlayerId } from '../../types';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';

/**
 * Middleware to check if it's the user's turn in the current room
 */
export const isTurn: Middleware = async (ctx: HandlerContext, query: Record<string, string>, next: () => Promise<void>) => {
  logFunctionStart('isTurn', { query });
  
  try {
    const user = validateUser(ctx);
    const roomId = getRoomId(query);
    
    console.log(`Validating if it's user ${user.id}'s turn in room ${roomId}`);
    
    // Validate if it's user's turn
    const isUserTurn = await validateUserTurn(user.id as PlayerId, roomId as RoomId);
    
    if (!isUserTurn) {
      throw new Error('نوبت شما نیست');
    }
    
    logFunctionEnd('isTurn', {}, { userId: user.id, roomId });
    await next();
  } catch (error) {
    logError('isTurn', error as Error, { query });
    // Re-throw the error to stop middleware chain
    throw error;
  }
};

/**
 * Validate if it's the user's turn in the specified room
 */
async function validateUserTurn(userId: PlayerId, roomId: RoomId): Promise<boolean> {
  logFunctionStart('validateUserTurn', { userId, roomId });
  
  try {
    // Fetch the room from database
    const room = await getPokerRoom(roomId);
    
    if (!room) {
      logFunctionEnd('validateUserTurn', false, { userId, roomId });
      return false;
    }
    
    // Check if game is active and in playing state
    if (room.status !== 'playing') {
      logFunctionEnd('validateUserTurn', false, { userId, roomId, status: room.status });
      return false;
    }
    
    // Check if there are players in the room
    if (room.players.length === 0) {
      logFunctionEnd('validateUserTurn', false, { userId, roomId, playerCount: 0 });
      return false;
    }
    
    // Check if current player index is valid
    if (room.currentPlayerIndex < 0 || room.currentPlayerIndex >= room.players.length) {
      logFunctionEnd('validateUserTurn', false, { userId, roomId, currentPlayerIndex: room.currentPlayerIndex });
      return false;
    }
    
    // Get current player
    const currentPlayer = room.players[room.currentPlayerIndex];
    
    // Check if it's the user's turn
    const isUserTurn = currentPlayer.id === userId;
    
    logFunctionEnd('validateUserTurn', isUserTurn, { 
      userId, 
      roomId, 
      currentPlayerId: currentPlayer.id,
      currentPlayerIndex: room.currentPlayerIndex 
    });
    
    return isUserTurn;
  } catch (error) {
    logError('validateUserTurn', error as Error, { userId, roomId });
    return false;
  }
} 