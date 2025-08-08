import { HandlerContext, createHandler } from '@/modules/core/handler';
import { kickPlayerFromRoom, getPokerRoom } from '../../services/pokerService';
import { validateRoomId, validatePlayerId } from '../../_utils/typeGuards';
import { generateKickPlayerKeyboard, generateRoomInfoKeyboard } from '../../_utils/roomInfoHelper';

// Export the action key for consistency and debugging
export const key = 'games.poker.room.kick';

/**
 * Handle kicking a player from the room
 */
async function handleKick(context: HandlerContext, query: Record<string, string> = {}): Promise<void> {
  const { user, ctx } = context;
  const { roomId, r, targetPlayerId } = query;
  const roomIdParam = roomId || r;
  
  ctx.log.info('Processing kick player request', { userId: user.id, roomId: roomIdParam, targetPlayerId });
  
  if (!roomIdParam) {
    const message = ctx.t('poker.room.info.error.missingRoomId');
    
    await ctx.replySmart(message, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[
          { text: ctx.t('poker.room.buttons.backToMenu'), callback_data: ctx.keyboard.buildCallbackData('games.poker.back', {}) }
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
    
    // Check if user is the creator
    if (room.createdBy !== validatedPlayerId) {
      throw new Error('Only the room creator can kick players');
    }
    
    // Check if game is already started
    if (room.status !== 'waiting') {
      throw new Error('Cannot kick players when game is in progress');
    }
    
    // If no target player specified, show kick selection interface
    if (!targetPlayerId) {
      const kickablePlayers = room.players.filter(p => p.id !== validatedPlayerId);
      
      if (kickablePlayers.length === 0) {
        throw new Error('No players available to kick');
      }
      
    const message = ctx.t('poker.room.kick.select');
      
      const keyboard = generateKickPlayerKeyboard(room, kickablePlayers);
      
      await ctx.replySmart(message, {
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
      return;
    }
    
    // Validate target player ID
    const validatedTargetPlayerId = validatePlayerId(targetPlayerId);
    
    // Check if target player is in the room
    const targetPlayer = room.players.find(p => p.id === validatedTargetPlayerId);
    if (!targetPlayer) {
      throw new Error('Target player is not in this room');
    }
    
    // Check if trying to kick self
    if (validatedTargetPlayerId === validatedPlayerId) {
      throw new Error('You cannot kick yourself');
    }
    
    // Kick the player
    const updatedRoom = await kickPlayerFromRoom(validatedRoomId, validatedTargetPlayerId);
    
    // Use display name (first_name + last_name) instead of username for privacy
    const displayName = targetPlayer.name || targetPlayer.username || 'Unknown Player';
    
    const message = `👢 <b>بازیکن اخراج شد!</b>\n\n` +
      `✅ بازیکن <b>${displayName}</b> از روم اخراج شد.\n\n` +
      `🎯 <b>وضعیت روم:</b>\n` +
      `• بازیکنان: ${updatedRoom.players.length}/${updatedRoom.maxPlayers}\n` +
      `• وضعیت: ${updatedRoom.status}\n\n` +
      `📊 <b>مرحله بعد:</b>\n` +
      `• می‌توانید بازیکنان دیگر را اخراج کنید\n` +
      `• بازی را شروع کنید\n` +
      `• به اطلاعات روم بازگردید`;
    
    // Generate room info keyboard
    const keyboard = generateRoomInfoKeyboard(updatedRoom, validatedPlayerId);
    
    await ctx.replySmart(message, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
  } catch (error) {
    ctx.log.error('Kick player error', { error: error instanceof Error ? error.message : String(error) });
    
    const errorMessage = error instanceof Error ? error.message : 'خطای نامشخص رخ داده است';
    const message = ctx.t('poker.room.kick.error', { error: errorMessage });
    
    await ctx.replySmart(message, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: ctx.t('poker.room.buttons.backToRoomInfo'), callback_data: ctx.keyboard.buildCallbackData('games.poker.room.info', { roomId: roomIdParam }) }
          ],
          [
            { text: ctx.t('poker.room.buttons.backToMenu'), callback_data: ctx.keyboard.buildCallbackData('games.poker.back', {}) }
          ]
        ]
      }
    });
  }
}

// Self-register with compact router
// Registration is handled by smart-router auto-discovery

export default createHandler(handleKick); 