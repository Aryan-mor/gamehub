import { HandlerContext } from '@/modules/core/handler';
import { tryEditMessageText } from '@/modules/core/telegramHelpers';
import { getPokerRoom } from '../../services/pokerService';
import { validateRoomId, validatePlayerId } from '../../_utils/typeGuards';
import { register } from '@/modules/core/compact-router';
import { POKER_ACTIONS } from '../../compact-codes';
import { getRoomInfoForUser, generateRoomInfoKeyboard } from '../../_utils/roomInfoHelper';

// Export the action key for consistency and debugging
export const key = 'games.poker.room.info';

/**
 * Handle displaying room information
 */
async function handleInfo(context: HandlerContext, query: Record<string, string> = {}): Promise<void> {
  const { user, ctx } = context;
  const { roomId, r } = query;
  const roomIdParam = roomId || r;
  
  console.log(`Processing room info request for user ${user.id}, roomId: ${roomIdParam}`);
  
  if (!roomIdParam) {
    const message = `❌ <b>خطا در نمایش اطلاعات روم</b>\n\n` +
      `شناسه روم مورد نیاز است.`;
    
    await tryEditMessageText(ctx, message, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[
          { text: '🔙 بازگشت به منو', callback_data: 'games.poker.backToMenu' }
        ]]
      }
    });
    return;
  }
  
  try {
    // Validate IDs
    const validatedRoomId = validateRoomId(roomIdParam);
    const validatedPlayerId = validatePlayerId(user.id.toString());
    
    // Get room information
    const room = await getPokerRoom(validatedRoomId);
    if (!room) {
      throw new Error('Room not found');
    }
    
    // Check if user is in the room
    const playerInRoom = room.players.find(p => p.id === validatedPlayerId);
    if (!playerInRoom) {
      throw new Error('You are not a member of this room');
    }
    
    // Get personalized room information
    const roomInfo = getRoomInfoForUser(room, validatedPlayerId);
    
    // Generate appropriate keyboard
    const keyboard = generateRoomInfoKeyboard(room, validatedPlayerId);
    
    await tryEditMessageText(ctx, roomInfo, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
  } catch (error) {
    console.error('Room info error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'خطای نامشخص رخ داده است';
    const message = `❌ <b>خطا در نمایش اطلاعات روم</b>\n\n${errorMessage}`;
    
    await tryEditMessageText(ctx, message, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[
          { text: '🔙 بازگشت به منو', callback_data: 'games.poker.backToMenu' }
        ]]
      }
    });
  }
}

// Self-register with compact router
register(POKER_ACTIONS.ROOM_INFO, handleInfo, 'Room Information');

export default handleInfo; 