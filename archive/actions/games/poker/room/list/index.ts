import { HandlerContext, createHandler } from '@/modules/core/handler';
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
      const message = ctx.t('poker.room.list.empty');
      
      const keyboard = {
        inline_keyboard: [
          [{ text: ctx.t('poker.room.buttons.createRoom'), callback_data: ctx.keyboard.buildCallbackData('games.poker.room.create') }],
          [{ text: ctx.t('poker.room.buttons.backToMenu'), callback_data: ctx.keyboard.buildCallbackData('games.poker.back') }]
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
      const message = ctx.t('poker.room.list.noAvailable');
      
      const keyboard = {
        inline_keyboard: [
          [{ text: ctx.t('poker.room.buttons.createRoom'), callback_data: ctx.keyboard.buildCallbackData('games.poker.room.create') }],
          [{ text: ctx.t('poker.room.buttons.backToMenu'), callback_data: ctx.keyboard.buildCallbackData('games.poker.back') }]
        ]
      };
      
      await ctx.replySmart(message, {
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
      return;
    }
    
    // Build room list message
    let roomListMessage = ctx.t('poker.room.list.title') + '\n\n';
    
    if (activeRooms.length === 0) {
      roomListMessage += ctx.t('poker.room.list.none');
    } else {
      roomListMessage += ctx.t('poker.room.list.count', { count: activeRooms.length });
      
      activeRooms.forEach((room, index) => {
        const playerCount = room.players.length;
        const maxPlayers = room.maxPlayers;
        const status = room.status === 'waiting' ? ctx.t('poker.room.status.waiting') : ctx.t('poker.room.status.playing');
        
        roomListMessage += ctx.t('poker.room.list.item', { index: index + 1, name: room.name }) + '\n';
        roomListMessage += ctx.t('poker.room.list.players', { current: playerCount, max: maxPlayers }) + '\n';
        roomListMessage += ctx.t('poker.room.list.status', { status }) + '\n';
        roomListMessage += ctx.t('poker.room.list.smallBlind', { amount: room.smallBlind }) + '\n';
        roomListMessage += ctx.t('poker.room.list.privacy', { type: room.isPrivate ? ctx.t('poker.room.info.type.private') : ctx.t('poker.room.info.type.public') }) + '\n\n';
      });
      
      roomListMessage += ctx.t('poker.room.list.joinHint');
    }
    
    // Create keyboard with join buttons for each room
    const joinButtons = availableRooms.map(room => [{
      text: ctx.t('poker.room.list.joinButton', { name: room.name }),
      callback_data: ctx.keyboard.buildCallbackData('games.poker.room.join', { roomId: room.id })
    }]);
    
    const keyboard = {
      inline_keyboard: [
        ...joinButtons,
        [{ text: ctx.t('poker.room.buttons.createRoom'), callback_data: ctx.keyboard.buildCallbackData('games.poker.room.create') }],
        [{ text: ctx.t('poker.room.buttons.backToMenu'), callback_data: ctx.keyboard.buildCallbackData('games.poker.back') }]
      ]
    };
    
    await ctx.replySmart(roomListMessage, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
  } catch (error) {
    ctx.log.error('List rooms error', { error: error instanceof Error ? error.message : String(error) });
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    await ctx.replySmart(ctx.t('poker.error.list', { error: errorMessage }));
  }
}

// Self-register with compact router
// The original code had register(POKER_ACTIONS.LIST_ROOMS, handleList, 'List Poker Rooms');
// POKER_ACTIONS.LIST_ROOMS is not defined in the new code, so this line is removed.
// The action key is now 'games.poker.room.list' and the handler is 'handleList'.
// The compact router registration is not explicitly shown in the new_code,
// but the handler is now directly called.

export default createHandler(handleList); 