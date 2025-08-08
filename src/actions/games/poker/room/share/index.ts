import { HandlerContext, createHandler } from '@/modules/core/handler';
import { PlayerId, RoomId } from '../../types';
import {
  validateRoomIdWithError,
  getPokerRoom
} from '../../_utils/pokerUtils';


// Export the action key for consistency and debugging
export const key = 'games.poker.room.share';

/**
 * Handle room sharing and invite generation
 */
async function handleShare(context: HandlerContext, query: Record<string, string> = {}): Promise<void> {
  const { user, ctx } = context;
  const { roomId, r } = query;
  const roomIdParam = roomId || r;
  
  ctx.log.info('Processing room share', { roomId: roomIdParam, userId: user.id });
  
  try {
    // If no roomId in query, try to get from user's active room
    let validRoomId = roomIdParam;
    if (!validRoomId) {
      // Get user's active room
      const { getPokerRoomsForPlayer } = await import('../../services/pokerService');
      const userRooms = await getPokerRoomsForPlayer(user.id.toString() as PlayerId);
      const activeRoom = userRooms.find(r => r.status === 'waiting' || r.status === 'playing');
      
      if (activeRoom) {
        validRoomId = activeRoom.id;
        ctx.log.debug('Found active room for user', { roomId: validRoomId, userId: user.id });
      } else {
        throw new Error('No active room found for user');
      }
    }
    
    // Validate room ID
    validRoomId = validateRoomIdWithError(validRoomId) as RoomId;
    
    // Get room information
    const room = await getPokerRoom(validRoomId as RoomId);
    if (!room) {
      const message = ctx.t('poker.room.share.error.notFound');
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
    
    // Generate invite message with direct link
    const inviteLink = `https://t.me/${process.env.TELEGRAM_BOT_USERNAME}?start=gprs_${room.id}`;
    const inviteMessage = ctx.t('poker.room.share.invite', {
      name: room.name,
      isPrivate: room.isPrivate ? ctx.t('poker.room.info.type.private') : ctx.t('poker.room.info.type.public'),
      playersCount: room.players.length,
      maxPlayers: room.maxPlayers,
      smallBlind: room.smallBlind,
      timeout: room.turnTimeoutSec,
      link: inviteLink
    });
    
    // Generate share keyboard with contacts list
    const keyboard = {
      inline_keyboard: [
        [
          { text: ctx.t('poker.room.share.shareWithContacts'), switch_inline_query: ctx.t('poker.room.share.inlineQuery', { name: room.name, link: inviteLink }) } as { text: string; switch_inline_query: string }
        ],
        [
          {
            text: ctx.t('poker.room.share.copyLink'),
            callback_data: ctx.keyboard.buildCallbackData('games.poker.room.share', { roomId: room.id })
          }
        ],
        [
          {
            text: ctx.t('poker.room.buttons.backToRoomInfo'),
            callback_data: ctx.keyboard.buildCallbackData('games.poker.room.info', { roomId: room.id })
          }
        ],
        [
          {
            text: ctx.t('poker.room.buttons.backToMenu'),
            callback_data: ctx.keyboard.buildCallbackData('games.poker.back', {})
          }
        ]
      ]
    };
    
    await ctx.replySmart(inviteMessage, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
  } catch (error) {
    ctx.log.error('Room share error', { error: error instanceof Error ? error.message : String(error) });
    
    const message = ctx.t('poker.room.share.error.generic');
    
    await ctx.replySmart(message, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[
          { text: ctx.t('poker.room.buttons.backToMenu'), callback_data: ctx.keyboard.buildCallbackData('games.poker.back', {}) }
        ]]
      }
    });
  }
}

// Self-register with compact router
// Registration is handled by smart-router auto-discovery

export default createHandler(handleShare); 