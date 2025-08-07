import { HandlerContext } from '@/modules/core/handler';
import { Context } from 'grammy';
import { 
  validateRoomIdWithError,
  validatePlayerIdWithError,
  handlePokerActiveUser
} from '../../_utils/pokerUtils';
import { updatePlayerReadyStatus, } from '../../services/pokerService';
import { } from '../../_utils/typeGuards';
import { } from '../../_engine/activeUser';
import { register } from '@/modules/core/compact-router';
import { POKER_ACTIONS } from '../../compact-codes';

// Export the action key for consistency and debugging
export const key = 'games.poker.room.ready';

// Register with compact router
register(POKER_ACTIONS.READY_TOGGLE, handleReady);

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
        console.log(`⚠️ No chatId stored for player ${otherPlayer.id}, skipping update`);
        continue;
      }
      
      try {
        console.log(`📢 Updating message for player ${otherPlayer.id} (chatId: ${otherPlayer.chatId})`);
        
        // Create a mock context for other player using stored chatId
        const otherPlayerContext = {
          ...ctx,
          chat: { id: otherPlayer.chatId },
          from: { id: parseInt(otherPlayer.id) }
        } as unknown as Context;
        
        const playerState = {
          gameType: 'poker' as const,
          roomId: updatedRoom.id,
          isActive: true,
          lastActivity: Date.now()
        };
        
        // Send updated room state to other players
        await handlePokerActiveUser(otherPlayerContext, playerState, updatedRoom);
        console.log(`✅ Updated message for player ${otherPlayer.id}`);
      } catch (error) {
        console.error(`❌ Failed to update message for player ${otherPlayer.id}:`, error);
      }
    }
    
  } catch (error) {
    console.error('Ready action error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    await ctx.replySmart(`❌ Failed to set ready status: ${errorMessage}`);
  }
}

export default handleReady; 