import { HandlerContext } from '@/modules/core/handler';
import { getActivePokerRooms } from '../../services/pokerService';

// Export the action key for consistency and debugging
export const key = 'games.poker.room.list';

/**
 * Handle listing available poker rooms
 */
async function handleList(context: HandlerContext): Promise<void> {
  const { ctx } = context;
  
  try {
    // Get active rooms
    const activeRooms = await getActivePokerRooms();
    
    if (activeRooms.length === 0) {
      const message = `📋 <b>No Active Rooms</b>\n\n` +
        `❌ There are no active poker rooms at the moment.\n\n` +
        `🎮 <b>What would you like to do?</b>\n` +
        `• Create a new room\n` +
        `• Check back later\n` +
        `• Return to main menu`;
      
      const keyboard = {
        inline_keyboard: [
          [{ text: '🏠 Create New Room', callback_data: 'games.poker.room.create' }],
          [{ text: '🔙 Back to Menu', callback_data: 'games.poker.room.list' }]
        ]
      };
      
      await ctx.replySmart(message, {
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
      return;
    }
    
    // Filter rooms that are waiting and not full
    const availableRooms = activeRooms.filter(room => 
      room.status === 'waiting' && room.players.length < room.maxPlayers
    );
    
    if (availableRooms.length === 0) {
      const message = `📋 <b>No Available Rooms</b>\n\n` +
        `❌ All active rooms are either full or already in progress.\n\n` +
        `🎮 <b>What would you like to do?</b>\n` +
        `• Create a new room\n` +
        `• Check back later\n` +
        `• Return to main menu`;
      
      const keyboard = {
        inline_keyboard: [
          [{ text: '🏠 Create New Room', callback_data: 'games.poker.room.create' }],
          [{ text: '🔙 Back to Menu', callback_data: 'games.poker.room.list' }]
        ]
      };
      
      await ctx.replySmart(message, {
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
      return;
    }
    
    // Build room list message
    let roomListMessage = `🏠 <b>لیست روم‌های فعال</b>\n\n`;
    
    if (activeRooms.length === 0) {
      roomListMessage += `❌ هیچ روم فعالی یافت نشد.\n\n`;
      roomListMessage += `🏠 <b>روم جدید بسازید:</b>`;
    } else {
      roomListMessage += `📊 <b>تعداد روم‌ها:</b> ${activeRooms.length}\n\n`;
      
      activeRooms.forEach((room, index) => {
        const playerCount = room.players.length;
        const maxPlayers = room.maxPlayers;
        const status = room.status === 'waiting' ? '⏳ منتظر' : '🎮 در حال بازی';
        
        roomListMessage += `${index + 1}. <b>${room.name}</b>\n`;
        roomListMessage += `   👥 ${playerCount}/${maxPlayers} بازیکن\n`;
        roomListMessage += `   📊 ${status}\n`;
        roomListMessage += `   💰 Small Blind: ${room.smallBlind}\n`;
        roomListMessage += `   🔒 ${room.isPrivate ? 'خصوصی' : 'عمومی'}\n\n`;
      });
      
      roomListMessage += `🎮 <b>برای ورود به روم:</b>`;
    }
    
    // Create keyboard with join buttons for each room
    const joinButtons = availableRooms.map(room => [{
      text: `🚪 Join ${room.name}`,
      callback_data: `games.poker.room.join?r=${room.id}`
    }]);
    
    const keyboard = {
      inline_keyboard: [
        ...joinButtons,
        [{ text: '🏠 Create New Room', callback_data: 'games.poker.room.create' }],
        [{ text: '🔙 Back to Menu', callback_data: 'games.poker.room.list' }]
      ]
    };
    
    await ctx.replySmart(roomListMessage, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
  } catch (error) {
    console.error('List rooms error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    await ctx.replySmart(`❌ Failed to list rooms: ${errorMessage}`);
  }
}

// Self-register with compact router
// The original code had register(POKER_ACTIONS.LIST_ROOMS, handleList, 'List Poker Rooms');
// POKER_ACTIONS.LIST_ROOMS is not defined in the new code, so this line is removed.
// The action key is now 'games.poker.room.list' and the handler is 'handleList'.
// The compact router registration is not explicitly shown in the new_code,
// but the handler is now directly called.

export default handleList; 