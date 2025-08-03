import { Context } from 'grammy';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';
import { extractUserInfo } from '@/modules/core/telegramHelpers';
import { getPokerRoomsForPlayer } from '../../services/pokerService';
import { PlayerId } from '../../types';

interface PlayerState {
  gameType: 'poker';
  roomId: string;
  isActive: boolean;
  lastActivity: number;
}

/**
 * Middleware to redirect active game users to their current game
 * This should be called early in the middleware chain to intercept all messages
 */
export async function activeGameRedirect(ctx: Context): Promise<void> {
  try {
    const userInfo = extractUserInfo(ctx);
    const userId = userInfo.userId as PlayerId;
    
    logFunctionStart('activeGameRedirect', { userId });
    
    // Skip if this is a callback query (let it be handled normally)
    if (ctx.callbackQuery) {
      logFunctionEnd('activeGameRedirect', {}, { userId, reason: 'callback_query' });
      return;
    }
    
    // Skip if this is a command (let it be handled normally)
    if (ctx.message?.text?.startsWith('/')) {
      logFunctionEnd('activeGameRedirect', {}, { userId, reason: 'command' });
      return;
    }
    
    // Check if user is in any active poker rooms (only 'playing' status, not 'waiting')
    const userRooms = await getPokerRoomsForPlayer(userId);
    const activeRoom = userRooms.find(room => room.status === 'playing');
    
    if (!activeRoom) {
      logFunctionEnd('activeGameRedirect', {}, { userId, reason: 'no_active_game' });
      return;
    }
    
    // User is in an active game, redirect them
    console.log(`🎮 ACTIVE GAME REDIRECT: User ${userId} is in active poker game ${activeRoom.id}`);
    
    const playerState: PlayerState = {
      gameType: 'poker',
      roomId: activeRoom.id,
      isActive: true,
      lastActivity: Date.now()
    };
    
    // Import and call the appropriate game handler
    try {
      const { handlePokerActiveUser } = await import('../../_engine/activeUser');
      await handlePokerActiveUser(ctx, playerState, activeRoom);
      
      // Mark as handled to prevent further processing
      (ctx as any).handled = true;
      
      logFunctionEnd('activeGameRedirect', {}, { 
        userId, 
        gameType: 'poker', 
        roomId: activeRoom.id,
        action: 'redirected_to_game'
      });
      
    } catch (error) {
      logError('activeGameRedirect', error as Error, { userId, roomId: activeRoom.id });
      console.error('Error handling active poker user:', error);
    }
    
  } catch (error) {
    logError('activeGameRedirect', error as Error, {});
    console.error('Error in activeGameRedirect middleware:', error);
  }
}

/**
 * Check if a user is currently in an active game
 */
export async function isUserInActiveGame(userId: PlayerId): Promise<PlayerState | null> {
  try {
    const userRooms = await getPokerRoomsForPlayer(userId);
    const activeRoom = userRooms.find(room => room.status === 'playing');
    
    if (!activeRoom) {
      return null;
    }
    
    return {
      gameType: 'poker',
      roomId: activeRoom.id,
      isActive: true,
      lastActivity: Date.now()
    };
  } catch (error) {
    console.error('Error checking active game status:', error);
    return null;
  }
} 