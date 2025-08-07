import { HandlerContext } from '@/modules/core/handler';
import { 
  validateRoomIdWithError,
  validatePlayerIdWithError,
  generateRoomManagementKeyboard
} from '../../_utils/pokerUtils';
import { updatePlayerReadyStatus, } from '../../services/pokerService';
import { } from '../../_utils/typeGuards';
import { register } from '@/modules/core/compact-router';
import { POKER_ACTIONS } from '../../compact-codes';

// Export the action key for consistency and debugging
export const key = 'games.poker.room.notready';

// Register with compact router
register(POKER_ACTIONS.NOT_READY, handleNotReady);

/**
 * Handle player not ready status in a poker room
 */
async function handleNotReady(context: HandlerContext, query: Record<string, string> = {}): Promise<void> {
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
    const updatedRoom = await updatePlayerReadyStatus(validatedRoomId, validatedPlayerId, false);
    
    // Count ready players
    const readyPlayers = updatedRoom.players.filter(p => p.isReady).length;
    const totalPlayers = updatedRoom.players.length;
    
    const message = `⏸️ <b>آماده نیستید!</b>\n\n` +
      `🏠 روم: <code>${updatedRoom.id}</code>\n` +
      `📊 نام: ${updatedRoom.name}\n\n` +
      `👥 <b>بازیکنان:</b> ${readyPlayers}/${totalPlayers} آماده\n` +
      `🎯 <b>وضعیت:</b> ${updatedRoom.status}\n` +
      `💰 <b>شرط‌ها:</b> ${updatedRoom.smallBlind}/${updatedRoom.bigBlind} سکه\n\n` +
      `📋 سایر بازیکنان وضعیت شما را می‌بینند`;
    
    const keyboard = generateRoomManagementKeyboard(updatedRoom.id);
    
    await ctx.replySmart(message, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
  } catch (error) {
    console.error('Not ready action error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    await ctx.replySmart(`❌ Failed to set not ready status: ${errorMessage}`);
  }
}

export default handleNotReady; 