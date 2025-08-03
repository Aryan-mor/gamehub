import { HandlerContext } from '@/modules/core/handler';
import { tryEditMessageText } from '@/modules/core/telegramHelpers';
import { generateMainMenuKeyboard } from '../../buttonHelpers';
import { getActivePokerRooms } from '../../services/pokerService';
import { register } from '@/modules/core/compact-router';
import { POKER_ACTIONS } from '../../compact-codes';

// Export the action key for consistency and debugging
export const key = 'games.poker.room.list';

/**
 * Handle listing available poker rooms
 */
async function handleList(context: HandlerContext, _query: Record<string, string> = {}): Promise<void> {
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
      
      const keyboard = generateMainMenuKeyboard();
      
      await tryEditMessageText(ctx, message, {
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
      
      const keyboard = generateMainMenuKeyboard();
      
      await tryEditMessageText(ctx, message, {
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
      return;
    }
    
    // Create room list message
    let message = `📋 <b>Available Poker Rooms</b>\n\n` +
      `✅ Found ${availableRooms.length} room(s) you can join:\n\n`;
    
    availableRooms.forEach((room, index) => {
      const readyPlayers = room.players.filter(p => p.isReady).length;
      const totalPlayers = room.players.length;
      
      message += `${index + 1}. <b>${room.name}</b>\n` +
        `   🆔 <code>${room.id}</code>\n` +
        `   👥 ${totalPlayers}/${room.maxPlayers} players (${readyPlayers} ready)\n` +
        `   💰 Blinds: ${room.smallBlind}/${room.bigBlind} coins\n` +
        `   👤 Creator: ${room.players.find(p => p.id === room.createdBy)?.name || 'Unknown'}\n\n`;
    });
    
    message += `🎮 <b>Join a room or create your own:</b>`;
    
    // Create keyboard with join buttons for each room
    const joinButtons = availableRooms.map(room => [{
      text: `🚪 Join ${room.name}`,
      callback_data: `${POKER_ACTIONS.JOIN_ROOM}?r=${room.id}`
    }]);
    
    const keyboard = {
      inline_keyboard: [
        ...joinButtons,
        [{ text: '🏠 Create New Room', callback_data: POKER_ACTIONS.CREATE_ROOM }],
        [{ text: '🔙 Back to Menu', callback_data: POKER_ACTIONS.BACK_TO_MENU }]
      ]
    };
    
    await tryEditMessageText(ctx, message, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
  } catch (error) {
    console.error('List rooms error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    await tryEditMessageText(ctx, `❌ Failed to list rooms: ${errorMessage}`);
  }
}

// Self-register with compact router
register(POKER_ACTIONS.LIST_ROOMS, handleList, 'List Poker Rooms');

export default handleList; 