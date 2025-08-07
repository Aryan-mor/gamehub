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
      
      // If game is playing, show game state. If waiting, show room info
      if (activeRoom.status === 'playing') {
        // Show current game state
        await showCurrentGameState(ctx, activeRoom, userId);
      } else {
        // Show room info for waiting rooms
        const { default: handleRoomInfo } = await import('../../room/info');
        
        // Ensure we have proper context information
        if (!ctx.chat?.id) {
          console.error('❌ Missing chat ID in context for active game redirect');
          return false;
        }
        
        const context = {
          ctx,
          user: {
            id: userId as unknown as UserId,
            username: ctx.from?.username || 'Unknown'
          }
        };
        
        try {
          await handleRoomInfo(context, { roomId: activeRoom.id });
        } catch (error) {
          console.error('Error calling room info handler from active game redirect:', error);
          // Fallback to simple message
          await ctx.reply(`🏠 شما در روم "${activeRoom.name}" هستید.\n\nبرای مشاهده جزئیات روم، از دکمه‌های زیر استفاده کنید.`, {
            parse_mode: 'HTML'
          });
        }
      }
      
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
 * Show current game state to the user
 */
async function showCurrentGameState(ctx: Context, room: any, userId: PlayerId): Promise<void> {
  try {
    const player = room.players.find((p: any) => p.id === userId);
    if (!player) {
      console.log(`❌ Player ${userId} not found in room ${room.id}`);
      return;
    }
    
    console.log(`🎮 Showing current game state for player ${userId} in room ${room.id}`);
    
    // Get game state display
    const { getGameStateDisplay } = await import('../../services/gameStateService');
    const gameStateMessage = getGameStateDisplay(room, userId);
    
    // Generate keyboard for the current player
    const { generateGameActionKeyboard } = await import('../../_utils/gameActionKeyboardGenerator');
    const isCurrentPlayer = room.players[room.currentPlayerIndex].id === userId;
    console.log(`🔍 Generating keyboard for player ${userId}, isCurrentPlayer: ${isCurrentPlayer}`);
    const keyboard = generateGameActionKeyboard(room, userId, isCurrentPlayer);
    console.log(`🔍 Generated keyboard:`, keyboard);
    
    // Send the game state message with keyboard for all players
    await ctx.reply(gameStateMessage, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
    console.log(`✅ Sent current game state to player ${userId}`);
    
  } catch (error) {
    console.error(`❌ Error showing current game state to player ${userId}:`, error);
    
    // Fallback to simple message
    await ctx.reply(`🎮 شما در حال حاضر در بازی "${room.name}" هستید.\n\nبرای مشاهده جزئیات بازی، از دکمه‌های زیر استفاده کنید.`, {
      parse_mode: 'HTML'
    });
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
      // If game is playing, show game state. If waiting, show room info
      if (activeRoom.status === 'playing') {
        // Show current game state
        await showCurrentGameState(ctx, activeRoom, userId);
      } else {
        // Show room info for waiting rooms
        const { default: handleRoomInfo } = await import('../../room/info');
        
        // Ensure we have proper context information
        if (!ctx.chat?.id) {
          console.error('❌ Missing chat ID in context for active game redirect');
          return false;
        }
        
        const context = {
          ctx,
          user: {
            id: userId as unknown as UserId,
            username: ctx.from?.username || 'Unknown'
          }
        };
        
        try {
          await handleRoomInfo(context, { roomId: activeRoom.id });
        } catch (error) {
          console.error('Error calling room info handler from checkAndRedirectToActiveGame:', error);
          // Fallback to simple message
          await ctx.reply(`🏠 شما در روم "${activeRoom.name}" هستید.\n\nبرای مشاهده جزئیات روم، از دکمه‌های زیر استفاده کنید.`, {
            parse_mode: 'HTML'
          });
        }
      }
      
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