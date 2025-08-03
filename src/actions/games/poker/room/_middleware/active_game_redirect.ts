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
    
    // For callback queries, only redirect if it's NOT a room-related action
    if (ctx.callbackQuery) {
      const callbackData = ctx.callbackQuery.data;
      console.log(`🔍 CALLBACK QUERY DEBUG: "${callbackData}" for user ${userId}`);
      
      // Allow room-related actions to be processed normally
      if (callbackData && (
        callbackData.startsWith('games.poker.room.leave') ||
        callbackData.startsWith('games.poker.room.start') ||
        callbackData.startsWith('games.poker.room.share') ||
        callbackData.startsWith('games.poker.room.kick') ||
        callbackData.startsWith('games.poker.room.ready') ||
        callbackData.startsWith('games.poker.room.notready') ||
        callbackData.startsWith('games.poker.backToMenu') ||
        // Compact codes
        callbackData.startsWith('gpl') || // Leave room
        callbackData.startsWith('gpsg') || // Start game
        callbackData.startsWith('gpsh') || // Share room
        callbackData.startsWith('gpk') || // Kick player
        callbackData.startsWith('gprd') || // Ready
        callbackData.startsWith('gpnr') || // Not ready
        callbackData.startsWith('gpbt') // Back to menu
      )) {
        console.log(`✅ ALLOWING ROOM ACTION: "${callbackData}" for user ${userId}`);
        logFunctionEnd('activeGameRedirect', {}, { userId, reason: 'room_action_callback' });
        return;
      }
      
      // For other callback queries, redirect to active room
      console.log(`🎮 ACTIVE GAME REDIRECT: Redirecting callback query "${callbackData}" for user ${userId}`);
    }
    
    // Don't skip commands anymore - redirect them too if user is in a room
    
    // Check if user is in any poker rooms (both 'waiting' and 'playing' status)
    const userRooms = await getPokerRoomsForPlayer(userId);
    const activeRoom = userRooms.find(room => room.status === 'waiting' || room.status === 'playing');
    
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
    const activeRoom = userRooms.find(room => room.status === 'waiting' || room.status === 'playing');
    
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