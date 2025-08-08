import { Context } from 'grammy';
import { GameHubContext } from '@/plugins';
import { PokerRoom, PlayerId } from '../../types';
import { UserId } from '@/utils/types';
import { 
  getPokerRoomsForPlayer 
} from '../../services/pokerService';
// duplicate import removed
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';

/**
 * Extract user info from context
 */
function extractUserInfo(ctx: GameHubContext): { userId: string; chatId: number } {
  return {
    userId: ctx.from?.id?.toString() || '0',
    chatId: ctx.chat?.id || 0
  };
}

/**
 * Middleware to redirect users to their active game if they have one
 */
export async function activeGameRedirect(ctx: GameHubContext): Promise<boolean> {
  try {
    const userInfo = extractUserInfo(ctx);
    const userId = userInfo.userId as PlayerId;
    
    logFunctionStart('activeGameRedirect', { userId });
    
    // Skip redirect for callback queries (let them be handled by their specific handlers)
    if (ctx.callbackQuery) {
      ctx.log.info('Skipping active game redirect for callback query', { data: ctx.callbackQuery.data });
      logFunctionEnd('activeGameRedirect', { skipped: true, reason: 'callbackQuery' }, { userId });
      return false; // Continue with normal flow
    }
    
    // Skip redirect for room join requests
    const startPayload = ctx.message?.text?.split(' ')[1];
    if (startPayload && (startPayload.startsWith('gpj-') || startPayload.startsWith('gprs_'))) {
      ctx.log.info('Skipping active game redirect for room join request', { startPayload });
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
          ctx.log.error('Missing chat ID in context for active game redirect');
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
          ctx.log.error('Error calling room info handler from active game redirect', { error: error instanceof Error ? error.message : String(error) });
          await ctx.replySmart(ctx.t('poker.active.redirect.roomInfo', { roomName: activeRoom.name }), {
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
    ctx.log.error('Error in active game redirect middleware', { error: error instanceof Error ? error.message : String(error) });
    return false; // Continue with normal flow on error
  }
}

/**
 * Show current game state to the user
 */
async function showCurrentGameState(ctx: GameHubContext, room: PokerRoom, userId: PlayerId): Promise<void> {
  try {
    const player = room.players.find((p) => p.id === userId);
    if (!player) {
      ctx.log.warn('Player not found in room', { userId, roomId: room.id });
      return;
    }
    
    ctx.log.info('Showing current game state', { userId, roomId: room.id });
    
    // Get game state display (i18n-aware)
    const { getGameStateForUser } = await import('../../_utils/roomInfoHelper');
    const gameStateMessage = getGameStateForUser(room, userId, ctx);
    
    // Generate keyboard for the current player
    const { default: PokerKeyboardService } = await import('../../services/pokerKeyboardService');
    const isCurrentPlayer = room.players[room.currentPlayerIndex].id === userId;
    ctx.log.debug('Generating keyboard for player', { userId, isCurrentPlayer });
    const keyboard = PokerKeyboardService.gameAction(room, userId, isCurrentPlayer, ctx);
    ctx.log.debug('Generated keyboard', { keyboard });
    
    // Send the game state message with keyboard for all players
    await ctx.replySmart(gameStateMessage, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
    ctx.log.info('Sent current game state', { userId });
    
  } catch (error) {
    ctx.log.error('Error showing current game state', { userId, error: error instanceof Error ? error.message : String(error) });
    
    await ctx.replySmart(ctx.t('poker.active.redirect.gameState', { roomName: room.name }), {
      parse_mode: 'HTML'
    });
  }
}

/**
 * Check if user has active game and redirect if needed
 */
export async function checkAndRedirectToActiveGame(ctx: GameHubContext): Promise<boolean> {
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
          ctx.log.error('Missing chat ID in context for active game redirect');
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
          ctx.log.error('Error calling room info handler from checkAndRedirectToActiveGame', { error: error instanceof Error ? error.message : String(error) });
          await ctx.replySmart(ctx.t('poker.active.redirect.roomInfo', { roomName: activeRoom.name }), {
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
    ctx.log.error('Error checking active game', { error: error instanceof Error ? error.message : String(error) });
    return false; // Continue with normal flow on error
  }
} 