import { Context } from 'grammy';
import { 
  PlayerId 
} from '../../types';
import { UserId } from '@/utils/types';
import { 
  getPokerRoomsForPlayer 
} from '../../services/pokerService';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';

/**
 * Extract user info from context
 */
function extractUserInfo(ctx: Context): { userId: string; chatId: number } {
  return {
    userId: ctx.from?.id?.toString() || '0',
    chatId: ctx.chat?.id || 0
  };
}

/**
 * Middleware to redirect users to their active game if they have one
 */
export async function activeGameRedirect(ctx: Context): Promise<boolean> {
  try {
    const userInfo = extractUserInfo(ctx);
    const userId = userInfo.userId as PlayerId;
    
    logFunctionStart('activeGameRedirect', { userId });
    
    // Skip redirect for callback queries (let them be handled by their specific handlers)
    if (ctx.callbackQuery) {
      console.log(`🚫 SKIPPING ACTIVE GAME REDIRECT FOR CALLBACK QUERY: ${ctx.callbackQuery.data}`);
      logFunctionEnd('activeGameRedirect', { skipped: true, reason: 'callbackQuery' }, { userId });
      return false; // Continue with normal flow
    }
    
    // Skip redirect for room join requests
    const startPayload = ctx.message?.text?.split(' ')[1];
    if (startPayload && (startPayload.startsWith('gpj-') || startPayload.startsWith('gprs_'))) {
      console.log(`🚫 SKIPPING ACTIVE GAME REDIRECT FOR ROOM JOIN REQUEST: ${startPayload}`);
      logFunctionEnd('activeGameRedirect', { skipped: true, reason: 'roomJoinRequest' }, { userId });
      return false; // Continue with normal flow
    }
    
    // Check if user has an active room
    const userRooms = await getPokerRoomsForPlayer(userId);
    const activeRoom = userRooms.find(room => 
      room.status === 'waiting' || room.status === 'playing'
    );
    
    if (activeRoom) {
      logFunctionEnd('activeGameRedirect', { hasActiveRoom: true, roomId: activeRoom.id }, { userId });
      
      // Call the room info handler directly to show room information
      const { default: handleRoomInfo } = await import('../../room/info');
      
      const context = {
        ctx,
        user: {
          id: userId as unknown as UserId,
          username: ctx.from?.username || 'Unknown'
        }
      };
      
      await handleRoomInfo(context, { roomId: activeRoom.id });
      
      // Mark as handled to prevent further processing
      (ctx as Context & { handled?: boolean }).handled = true;
      
      return true; // Stop further processing
    }
    
    logFunctionEnd('activeGameRedirect', { hasActiveRoom: false }, { userId });
    return false; // Continue with normal flow
    
  } catch (error) {
    logError('activeGameRedirect', error as Error, {});
    console.error('Error in active game redirect middleware:', error);
    return false; // Continue with normal flow on error
  }
}

/**
 * Check if user has active game and redirect if needed
 */
export async function checkAndRedirectToActiveGame(ctx: Context): Promise<boolean> {
  try {
    const userInfo = extractUserInfo(ctx);
    const userId = userInfo.userId as PlayerId;
    
    // Check if user has an active room
    const userRooms = await getPokerRoomsForPlayer(userId);
    const activeRoom = userRooms.find(room => 
      room.status === 'waiting' || room.status === 'playing'
    );
    
    if (activeRoom) {
      // Call the room info handler directly to show room information
      const { default: handleRoomInfo } = await import('../../room/info');
      
      const context = {
        ctx,
        user: {
          id: userId as unknown as UserId,
          username: ctx.from?.username || 'Unknown'
        }
      };
      
      await handleRoomInfo(context, { roomId: activeRoom.id });
      
      // Mark as handled to prevent further processing
      (ctx as Context & { handled?: boolean }).handled = true;
      
      return true; // Stop further processing
    }
    
    return false; // Continue with normal flow
    
  } catch (error) {
    logError('checkAndRedirectToActiveGame', error as Error, {});
    console.error('Error checking active game:', error);
    return false; // Continue with normal flow on error
  }
} 