import { HandlerContext } from '@/modules/core/handler';
import { tryEditMessageText } from '@/modules/core/telegramHelpers';
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
  
  console.log(`Processing room share for room ${roomIdParam} by user ${user.id}`);
  
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
        console.log(`Found active room for user: ${validRoomId}`);
      } else {
        throw new Error('No active room found for user');
      }
    }
    
    // Validate room ID
    validRoomId = validateRoomIdWithError(validRoomId) as RoomId;
    
    // Get room information
    const room = await getPokerRoom(validRoomId as RoomId);
    if (!room) {
      const message = `❌ <b>خطا در اشتراک‌گذاری</b>\n\n` +
        `روم مورد نظر یافت نشد.`;
      
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
    
    // Generate invite message with direct link
    const inviteLink = `https://t.me/${process.env.TELEGRAM_BOT_USERNAME}?start=gprs_${room.id}`;
    const inviteMessage = `🎮 <b>دعوت به بازی پوکر</b>\n\n` +
      `🏠 <b>${room.name}</b>\n\n` +
      `📊 <b>مشخصات روم:</b>\n` +
      `• نوع: ${room.isPrivate ? '🔒 خصوصی' : '🌐 عمومی'}\n` +
      `• بازیکنان: ${room.players.length}/${room.maxPlayers}\n` +
      `• Small Blind: ${room.smallBlind} سکه\n` +
      `• تایم‌اوت: ${room.turnTimeoutSec} ثانیه\n\n` +
      `🔗 <b>لینک دعوت:</b>\n` +
      `<code>${inviteLink}</code>\n\n` +
      `📋 <b>راهنمای استفاده:</b>\n` +
      `• روی لینک بالا کلیک کنید تا کپی شود\n` +
      `• یا از دکمه "اشتراک‌گذاری" استفاده کنید\n\n` +
      `🎯 <b>بیا این میز پوکر رو شروع کنیم ♠️</b>`;
    
    // Generate share keyboard with contacts list
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '📤 اشتراک‌گذاری با مخاطبین',
            switch_inline_query: `🎮 دعوت به بازی پوکر: ${room.name}\n\n${inviteLink}`
          } as { text: string; switch_inline_query: string }
        ],
        [
          {
            text: '📋 کپی لینک',
            callback_data: `copy_link?roomId=${room.id}`
          }
        ],
        [
          {
            text: '🔙 بازگشت به اطلاعات روم',
            callback_data: `games.poker.room.info?roomId=${room.id}`
          }
        ],
        [
          {
            text: '🔙 بازگشت به منو',
            callback_data: 'games.poker.backToMenu'
          }
        ]
      ]
    };
    
    await tryEditMessageText(ctx, inviteMessage, {
      parse_mode: 'HTML',
      reply_markup: keyboard as any
    });
    
  } catch (error) {
    console.error('Room share error:', error);
    
    const message = `❌ <b>خطا در اشتراک‌گذاری</b>\n\n` +
      `متأسفانه مشکلی در اشتراک‌گذاری روم پیش آمده.\n` +
      `لطفاً دوباره تلاش کنید.`;
    
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
import { register } from '@/modules/core/compact-router';
import { POKER_ACTIONS } from '../../compact-codes';

register(POKER_ACTIONS.SHARE, handleShare, 'Share Poker Room');

export default handleShare; 