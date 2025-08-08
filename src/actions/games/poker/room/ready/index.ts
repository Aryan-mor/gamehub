import { HandlerContext, createHandler } from '@/modules/core/handler';
import { GameHubContext } from '@/plugins';
import { 
  validateRoomIdWithError,
  validatePlayerIdWithError,
  handlePokerActiveUser
} from '../../_utils/pokerUtils';
import { updatePlayerReadyStatus, } from '../../services/pokerService';
import { } from '../../_utils/typeGuards';
import { } from '../../_engine/activeUser';

// Export the action key for consistency and debugging
export const key = 'games.poker.room.ready';

// Register with compact router
// Registration is handled by smart-router auto-discovery

/**
 * Handle player ready status in a poker room
 */
async function handleReady(context: HandlerContext, query: Record<string, string> = {}): Promise<void> {
  const { user, ctx } = context;
  const { roomId, r } = query;
  const roomIdParam = roomId || r;
  
  if (!roomIdParam) {
    throw new Error('Room ID is required');
  }
  
  try {
    // Validate IDs
    const validatedRoomId = validateRoomIdWithError(roomIdParam);
    const validatedPlayerId = validatePlayerIdWithError(user.id.toString());
    
    // Update player ready status
    const updatedRoom = await updatePlayerReadyStatus(validatedRoomId, validatedPlayerId, true);
    
    // Count ready players
    const readyPlayers = updatedRoom.players.filter(p => p.isReady).length;
    const totalPlayers = updatedRoom.players.length;
    
    const message = `✅ <b>آماده شدید!</b>\n\n` +
      `🏠 روم: <code>${updatedRoom.id}</code>\n` +
      `📊 نام: ${updatedRoom.name}\n\n` +
      `👥 <b>بازیکنان:</b> ${readyPlayers}/${totalPlayers} آماده\n` +
      `🎯 <b>وضعیت:</b> ${updatedRoom.status}\n` +
      `💰 <b>شرط‌ها:</b> ${updatedRoom.smallBlind}/${updatedRoom.bigBlind} سکه\n\n` +
      `⏳ منتظر آماده شدن سایر بازیکنان...`;
    
    const keyboard = ctx.poker.generateRoomManagementKeyboard(updatedRoom.id);
    
    await ctx.replySmart(message, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
    // Update messages for all other players in the room
    const otherPlayers = updatedRoom.players.filter(p => p.id !== validatedPlayerId);
    for (const otherPlayer of otherPlayers) {
      if (!otherPlayer.chatId) {
        ctx.log.warn('No chatId stored for player, skipping update', { playerId: otherPlayer.id });
        continue;
      }
      
      try {
        ctx.log.info('Updating message for player', { playerId: otherPlayer.id, chatId: otherPlayer.chatId });
        
        // Create a mock context for other player using stored chatId
          const otherPlayerContext: GameHubContext = {
            ...ctx,
            chat: { id: otherPlayer.chatId } as unknown as GameHubContext['chat'],
            from: { id: Number(otherPlayer.id) } as unknown as GameHubContext['from'],
          } as GameHubContext;
        
        const playerState = {
          gameType: 'poker' as const,
          roomId: updatedRoom.id,
          isActive: true,
          lastActivity: Date.now()
        };
        
        // Send updated room state to other players
        await handlePokerActiveUser(otherPlayerContext, playerState, updatedRoom);
        ctx.log.info('Updated message for player', { playerId: otherPlayer.id });
      } catch (error) {
        ctx.log.error('Failed to update message for player', { playerId: otherPlayer.id, error: error instanceof Error ? error.message : String(error) });
      }
    }
    
  } catch (error) {
    ctx.log.error('Ready action error', { error: error instanceof Error ? error.message : String(error) });
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    await ctx.replySmart(ctx.t('poker.error.ready', { error: errorMessage }));
  }
}

export default createHandler(handleReady); 