import { Bot } from 'grammy';
// import { getUser } from './userService';

// Interface state management
export interface InterfaceState {
  messageId?: number;
  currentView: 'main_menu' | 'game_selection' | 'help' | 'balance' | 'freecoin' | 'game_flow' | 'trivia_waiting' | 'trivia_playing' | 'trivia_question' | 'trivia_round_result' | 'trivia_finished' | 'trivia_waiting_answer';
  gameState?: {
    gameType: string;
    gameId?: string;
    stake?: number;
    step: 'stake_selection' | 'option_selection' | 'result' | 'play_again';
  };
}

export const userStates = new Map<string, InterfaceState>();

// Helper function to create optimized keyboard layout
export const createOptimizedKeyboard = (buttons: Array<{ text: string; callbackData: any }>, showBack = false) => {
  const rows: any[][] = [];
  let currentRow: any[] = [];
  
  // Group buttons by size (short buttons can fit 2-3 per row)
  const shortButtons = buttons.filter(btn => btn.text.length <= 8);
  const longButtons = buttons.filter(btn => btn.text.length > 8);
  
  // Add short buttons first (2-3 per row)
  for (let i = 0; i < shortButtons.length; i++) {
    currentRow.push({
      text: shortButtons[i].text,
      callback_data: JSON.stringify(shortButtons[i].callbackData)
    });
    
    if (currentRow.length === 3 || i === shortButtons.length - 1) {
      rows.push([...currentRow]);
      currentRow = [];
    }
  }
  
  // Add long buttons (1 per row)
  for (const button of longButtons) {
    rows.push([{
      text: button.text,
      callback_data: JSON.stringify(button.callbackData)
    }]);
  }
  
  // Add back button if needed
  if (showBack) {
    rows.push([{
      text: '⬅️ Back',
      callback_data: JSON.stringify({ action: 'back' })
    }]);
  }
  
  return { inline_keyboard: rows };
};

// Helper function to update or send message
export const updateOrSendMessage = async (
  bot: Bot, 
  chatId: number, 
  text: string, 
  keyboard: any, 
  userId: string,
  view: InterfaceState['currentView']
) => {
  const state = userStates.get(userId) || { currentView: 'main_menu' };
  
  if (state.messageId) {
    try {
      await bot.api.editMessageText(chatId, state.messageId, text, {
        reply_markup: keyboard,
        parse_mode: 'HTML'
      });
    } catch (error) {
      // If edit fails, send new message
      const message = await bot.api.sendMessage(chatId, text, {
        reply_markup: keyboard,
        parse_mode: 'HTML'
      });
      state.messageId = message.message_id;
    }
  } else {
    const message = await bot.api.sendMessage(chatId, text, {
      reply_markup: keyboard,
      parse_mode: 'HTML'
    });
    state.messageId = message.message_id;
  }
  
  state.currentView = view;
  userStates.set(userId, state);
};

// Helper function for game flow message updates
export const updateGameMessage = async (
  bot: Bot,
  chatId: number,
  text: string,
  keyboard: any,
  userId: string,
  gameType: string,
  step: 'stake_selection' | 'option_selection' | 'result' | 'play_again',
  gameId?: string,
  stake?: number
) => {
  const state = userStates.get(userId) || { currentView: 'main_menu' };
  
  // Update game state
  state.currentView = 'game_flow';
  state.gameState = {
    gameType,
    gameId,
    stake,
    step
  };
  
  if (state.messageId) {
    try {
      await bot.api.editMessageText(chatId, state.messageId, text, {
        reply_markup: keyboard,
        parse_mode: 'HTML'
      });
    } catch (error) {
      // If edit fails, send new message
      const message = await bot.api.sendMessage(chatId, text, {
        reply_markup: keyboard,
        parse_mode: 'HTML'
      });
      state.messageId = message.message_id;
    }
  } else {
    const message = await bot.api.sendMessage(chatId, text, {
      reply_markup: keyboard,
      parse_mode: 'HTML'
    });
    state.messageId = message.message_id;
  }
  
  userStates.set(userId, state);
};

// Helper function to get current game state
export const getGameState = (userId: string) => {
  const state = userStates.get(userId);
  return state?.gameState;
};

// Helper function to clear game state and return to main menu
export const returnToMainMenu = async (bot: Bot, userInfo: { userId: string; chatId: number }) => {
  let welcome = `🧠 <b>Welcome to GameHub - Trivia Edition!</b>\n\n🎯 Challenge your friends in competitive 2-player trivia games!\n\n💰 Earn and claim daily Coins with /freecoin!\n\n🎯 Choose an action below:`;
  
  const buttons = [
    { text: '🧠 Start Trivia', callbackData: { action: 'startgame' } },
    { text: '🪙 Free Coin', callbackData: { action: 'freecoin' } },
    { text: '💰 Balance', callbackData: { action: 'balance' } },
    { text: '❓ Help', callbackData: { action: 'help' } },
  ];
  
  const keyboard = createOptimizedKeyboard(buttons);
  
  const state = userStates.get(userInfo.userId) || { currentView: 'main_menu' };
  state.currentView = 'main_menu';
  delete state.gameState;
  userStates.set(userInfo.userId, state);
  
  await updateOrSendMessage(bot, userInfo.chatId, welcome, keyboard, userInfo.userId, 'main_menu');
}; 