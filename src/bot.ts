import 'dotenv/config';
import { Bot } from 'grammy';
import { InlineQueryResult } from 'grammy/types';
import { logFunctionStart, logFunctionEnd, logError } from './core/logger';
import { extractUserInfo, sendMessage, answerCallbackQuery } from './core/telegramHelpers';
import { getUser, addCoins, canClaimDaily, setLastFreeCoinAt, setUserProfile } from './core/userService';
import { getActiveGamesForUser } from './core/gameService';
import { 
  createOptimizedKeyboard, 
  updateOrSendMessage
} from './core/interfaceHelpers';
import { registerTriviaHandlers } from './games/trivia';

/**
 * GameHub Telegram Bot
 * 
 * Signal Handling:
 * - SIGINT (Ctrl+C): Graceful shutdown
 * - SIGTERM: Graceful shutdown
 * - Exits immediately to prevent double signal issues
 */
// Temporarily disabled other games to focus on trivia
// import { registerDiceHandlers } from './games/dice';
// import { registerBasketballHandlers } from './games/basketball';
// import { registerFootballHandlers } from './games/football';
// import { registerBlackjackHandlers } from './games/blackjack';
// import { registerBowlingHandlers } from './games/bowling';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is required');
}

// Validate token format
if (!token.match(/^\d+:[A-Za-z0-9_-]+$/)) {
  throw new Error(
    'Invalid TELEGRAM_BOT_TOKEN format. Expected format: <bot_id>:<bot_token>'
  );
}

const bot = new Bot(token);

// Add logging middleware
bot.use(async (ctx, next) => {
  logFunctionStart('botMiddleware', {
    userId: ctx.from?.id?.toString(),
    chatId: ctx.chat?.id?.toString(),
    messageType: ctx.message ? 'message' : 'callback_query'
  });
  
  try {
    await next();
    logFunctionEnd('botMiddleware', {}, {
      userId: ctx.from?.id?.toString(),
      chatId: ctx.chat?.id?.toString()
    });
  } catch (error) {
    logError('botMiddleware', error as Error, {
      userId: ctx.from?.id?.toString(),
      chatId: ctx.chat?.id?.toString()
    });
    throw error;
  }
});

// Register game handlers
registerTriviaHandlers(bot);

// Simple callback logging (without interfering with handlers)
bot.use(async (ctx, next) => {
  if (ctx.callbackQuery) {
    console.log(`🔘 Callback received from ${ctx.from?.id} (${ctx.from?.username}): ${ctx.callbackQuery.data || 'No data'}`);
  }
  await next();
});
// Temporarily disabled other games to focus on trivia
// registerDiceHandlers(bot);
// registerBasketballHandlers(bot);
// registerFootballHandlers(bot);
// registerBlackjackHandlers(bot);
// registerBowlingHandlers(bot);



// Handle /start command
bot.command('start', async (ctx) => {
  try {
    const userInfo = extractUserInfo(ctx);
    logFunctionStart('startCommand', { userId: userInfo.userId });
    
    // Save user profile
    await setUserProfile(userInfo.userId, userInfo.username, userInfo.name);
    
    // Get user data
    const userData = await getUser(userInfo.userId);
    
    let welcome = `🧠 <b>Welcome to GameHub - Trivia Edition!</b>\n\n` +
      `🎯 Challenge your friends in competitive 2-player trivia games!\n\n` +
      `💰 Earn and claim daily Coins with /freecoin!\n\n` +
      `🎯 Choose an action below:`;
    
    if (userData.coins === 0 && !userData.lastFreeCoinAt) {
      await addCoins(userInfo.userId, 100, 'initial grant');
      welcome = `🎉 You received <b>100 Coins</b> for joining!\n\n` + welcome;
    }
    
    const buttons = [
      { text: '🧠 Start Trivia', callbackData: { action: 'startgame' } },
      { text: '🪙 Free Coin', callbackData: { action: 'freecoin' } },
      { text: '💰 Balance', callbackData: { action: 'balance' } },
      { text: '❓ Help', callbackData: { action: 'help' } },
    ];
    
    const keyboard = createOptimizedKeyboard(buttons);
    
    await updateOrSendMessage(bot, userInfo.chatId, welcome, keyboard, userInfo.userId, 'main_menu');
    
    logFunctionEnd('startCommand', {}, { userId: userInfo.userId });
  } catch (error) {
    logError('startCommand', error as Error, {});
    await ctx.reply('🎮 Welcome to GameHub!\n\nUse /help to see available commands.');
  }
});

// Handle /help command
bot.command('help', async (ctx) => {
  try {
    const userInfo = extractUserInfo(ctx);
    logFunctionStart('helpCommand', { userId: userInfo.userId });
    
    await handleHelp(bot, userInfo);
    
    logFunctionEnd('helpCommand', {}, { userId: userInfo.userId });
  } catch (error) {
    logError('helpCommand', error as Error, {});
    await ctx.reply('❌ Failed to show help.');
  }
});

// Handle /balance command
bot.command('balance', async (ctx) => {
  try {
    const userInfo = extractUserInfo(ctx);
    logFunctionStart('balanceCommand', { userId: userInfo.userId });
    
    await handleBalance(bot, userInfo);
    
    logFunctionEnd('balanceCommand', {}, { userId: userInfo.userId });
  } catch (error) {
    logError('balanceCommand', error as Error, {});
    await ctx.reply('❌ Failed to get balance.');
  }
});

// Handle /freecoin command
bot.command('freecoin', async (ctx) => {
  try {
    const userInfo = extractUserInfo(ctx);
    logFunctionStart('freecoinCommand', { userId: userInfo.userId });
    
    await handleFreeCoin(bot, userInfo);
    
    logFunctionEnd('freecoinCommand', {}, { userId: userInfo.userId });
  } catch (error) {
    logError('freecoinCommand', error as Error, {});
    await ctx.reply('❌ Failed to claim free coins.');
  }
});

// Handle /games command
bot.command('games', async (ctx) => {
  try {
    const userInfo = extractUserInfo(ctx);
    logFunctionStart('gamesCommand', { userId: userInfo.userId });
    
    const activeGames = await getActiveGamesForUser(userInfo.userId);
    
    if (activeGames.length === 0) {
      await sendMessage(bot, userInfo.chatId, '📋 You have no unfinished games.');
      logFunctionEnd('gamesCommand', {}, { userId: userInfo.userId });
      return;
    }
    
    let message = `📋 Your unfinished games (${activeGames.length}):\n\n`;
    
    for (const game of activeGames) {
      const status = game.status === 'waiting' ? '⏳ Waiting' : '🎮 Playing';
      const stake = game.stake || 0;
      const creatorName = game.players[0]?.name || 'Unknown';
      const joinerName = game.players[1]?.name || 'None';
      
      message += `🎮 Game: \`${game.id}\`\n`;
      message += `📊 Status: ${status}\n`;
      message += `💰 Stake: ${stake} Coins\n`;
      message += `👤 Creator: ${creatorName}\n`;
      message += `👥 Joiner: ${joinerName}\n\n`;
    }
    
    await sendMessage(bot, userInfo.chatId, message, { parseMode: 'Markdown' });
    
    logFunctionEnd('gamesCommand', {}, { userId: userInfo.userId });
  } catch (error) {
    logError('gamesCommand', error as Error, {});
    await ctx.reply('❌ Failed to fetch your games.');
  }
});

// Handle back button
bot.callbackQuery(/.*"action":"back".*/, async (ctx) => {
  try {
    const userInfo = extractUserInfo(ctx);
    logFunctionStart('menu_back', { 
      userId: userInfo.userId, 
      action: 'back'
    });
    
    await answerCallbackQuery(bot, ctx.callbackQuery.id);
    
    // Return to main menu
    let welcome = `🧠 <b>Welcome to GameHub - Trivia Edition!</b>\n\n🎯 Challenge your friends in competitive 2-player trivia games!\n\n💰 Earn and claim daily Coins with /freecoin!\n\n🎯 Choose an action below:`;
    
    const buttons = [
      { text: '🧠 Start Trivia', callbackData: { action: 'startgame' } },
      { text: '🪙 Free Coin', callbackData: { action: 'freecoin' } },
      { text: '💰 Balance', callbackData: { action: 'balance' } },
      { text: '❓ Help', callbackData: { action: 'help' } },
    ];
    
    const keyboard = createOptimizedKeyboard(buttons);
    
    await updateOrSendMessage(bot, userInfo.chatId, welcome, keyboard, userInfo.userId, 'main_menu');
    
    logFunctionEnd('menu_back', {}, { userId: userInfo.userId });
  } catch (error) {
    logError('menu_back', error as Error, {});
    await answerCallbackQuery(bot, ctx.callbackQuery.id, '❌ Processing failed');
  }
});

// Handle main menu callback queries with specific patterns
bot.callbackQuery(/.*"action":"startgame".*/, async (ctx) => {
  try {
    const userInfo = extractUserInfo(ctx);
    logFunctionStart('menu_startgame', { 
      userId: userInfo.userId, 
      action: 'startgame',
      context: 'main_menu'
    });
    
    await answerCallbackQuery(bot, ctx.callbackQuery.id);
    await handleStartGame(bot, userInfo);
    
    logFunctionEnd('menu_startgame', {}, { 
      userId: userInfo.userId, 
      action: 'startgame',
      context: 'main_menu'
    });
  } catch (error) {
    logError('menu_startgame', error as Error, {});
    await answerCallbackQuery(bot, ctx.callbackQuery.id, '❌ Processing failed');
  }
});

// Temporarily disabled to focus on trivia
// bot.callbackQuery(/.*"action":"newgame".*/, async (ctx) => {
//   try {
//     const userInfo = extractUserInfo(ctx);
//     const data = parseCallbackData(ctx.callbackQuery.data || '');
//     
//     logFunctionStart('menu_newgame', { 
//       userId: userInfo.userId, 
//       action: 'newgame',
//       context: 'main_menu',
//       gameType: data.gameType || 'none'
//     });
//     
//     await answerCallbackQuery(bot, ctx.callbackQuery.id);
//     await handleNewGame(bot, userInfo, data);
//     
//     logFunctionEnd('menu_newgame', {}, { 
//       userId: userInfo.userId, 
//       action: 'newgame',
//       context: 'main_menu'
//     });
//   } catch (error) {
//     logError('menu_newgame', error as Error, {});
//     await answerCallbackQuery(bot, ctx.callbackQuery.id, '❌ Processing failed');
//   }
// });

bot.callbackQuery(/.*"action":"freecoin".*/, async (ctx) => {
  try {
    const userInfo = extractUserInfo(ctx);
    logFunctionStart('menu_freecoin', { 
      userId: userInfo.userId, 
      action: 'freecoin',
      context: 'main_menu'
    });
    
    await answerCallbackQuery(bot, ctx.callbackQuery.id);
    await handleFreeCoin(bot, userInfo);
    
    logFunctionEnd('menu_freecoin', {}, { 
      userId: userInfo.userId, 
      action: 'freecoin',
      context: 'main_menu'
    });
  } catch (error) {
    logError('menu_freecoin', error as Error, {});
    await answerCallbackQuery(bot, ctx.callbackQuery.id, '❌ Processing failed');
  }
});

bot.callbackQuery(/.*"action":"help".*/, async (ctx) => {
  try {
    const userInfo = extractUserInfo(ctx);
    logFunctionStart('menu_help', { 
      userId: userInfo.userId, 
      action: 'help',
      context: 'main_menu'
    });
    
    await answerCallbackQuery(bot, ctx.callbackQuery.id);
    await handleHelp(bot, userInfo);
    
    logFunctionEnd('menu_help', {}, { 
      userId: userInfo.userId, 
      action: 'help',
      context: 'main_menu'
    });
  } catch (error) {
    logError('menu_help', error as Error, {});
    await answerCallbackQuery(bot, ctx.callbackQuery.id, '❌ Processing failed');
  }
});

bot.callbackQuery(/.*"action":"balance".*/, async (ctx) => {
  try {
    const userInfo = extractUserInfo(ctx);
    logFunctionStart('menu_balance', { 
      userId: userInfo.userId, 
      action: 'balance',
      context: 'main_menu'
    });
    
    await answerCallbackQuery(bot, ctx.callbackQuery.id);
    await handleBalance(bot, userInfo);
    
    logFunctionEnd('menu_balance', {}, { 
      userId: userInfo.userId, 
      action: 'balance',
      context: 'main_menu'
    });
  } catch (error) {
    logError('menu_balance', error as Error, {});
    await answerCallbackQuery(bot, ctx.callbackQuery.id, '❌ Processing failed');
  }
});

// Helper functions for callback handlers
// Temporarily disabled game trigger functions to focus on trivia
// const triggerDiceGame = async (bot: Bot, userInfo: { userId: string; chatId: number }) => {
//   logFunctionStart('triggerDiceGame', { 
//     userId: userInfo.userId, 
//     context: 'dice_game',
//     step: 'stake_selection'
//   });
//   
//           const buttons = [
//           { text: '2 Coins', callbackData: { action: 'dice_stake', stake: 2 } },
//           { text: '5 Coins', callbackData: { action: 'dice_stake', stake: 5 } },
//           { text: '10 Coins', callbackData: { action: 'dice_stake', stake: 10 } },
//           { text: '20 Coins', callbackData: { action: 'dice_stake', stake: 20 } },
//         ];
//         const stakeKeyboard = createOptimizedKeyboard(buttons, true);
//   
//   await updateGameMessage(bot, userInfo.chatId, 
//     '🎲 <b>Dice Game</b>\n\nGuess the dice number!\n\nChoose your stake amount:',
//     stakeKeyboard, userInfo.userId, 'dice', 'stake_selection'
//   );
//   
//   logFunctionEnd('triggerDiceGame', { success: true }, { 
//     userId: userInfo.userId, 
//     context: 'dice_game',
//     step: 'stake_selection'
//   });
// };

// const triggerBasketballGame = async (bot: Bot, userInfo: { userId: string; chatId: number }) => {
//   logFunctionStart('triggerBasketballGame', { 
//     userId: userInfo.userId, 
//     context: 'basketball_game',
//     step: 'stake_selection'
//   });
//   
//           const buttons = [
//           { text: '2 Coins', callbackData: { action: 'basketball_stake', stake: 2 } },
//           { text: '5 Coins', callbackData: { action: 'basketball_stake', stake: 5 } },
//           { text: '10 Coins', callbackData: { action: 'basketball_stake', stake: 10 } },
//           { text: '20 Coins', callbackData: { action: 'basketball_stake', stake: 20 } },
//         ];
//         const stakeKeyboard = createOptimizedKeyboard(buttons, true);
//   
//   await updateGameMessage(bot, userInfo.chatId, 
//     '🏀 <b>Basketball Game</b>\n\nGuess if you will score or miss!\n\nChoose your stake amount:',
//     stakeKeyboard, userInfo.userId, 'basketball', 'stake_selection'
//   );
//   
//   logFunctionEnd('triggerBasketballGame', { success: true }, { 
//     userId: userInfo.userId, 
//     context: 'basketball_game',
//     step: 'stake_selection'
//   });
// };

// const triggerFootballGame = async (bot: Bot, userInfo: { userId: string; chatId: number }) => {
//           const buttons = [
//           { text: '2 Coins', callbackData: { action: 'football_stake', stake: 2 } },
//           { text: '5 Coins', callbackData: { action: 'football_stake', stake: 5 } },
//           { text: '10 Coins', callbackData: { action: 'football_stake', stake: 10 } },
//           { text: '20 Coins', callbackData: { action: 'football_stake', stake: 20 } },
//         ];
//         const stakeKeyboard = createOptimizedKeyboard(buttons, true);
//   
//   await updateGameMessage(bot, userInfo.chatId, 
//     '⚽️ <b>Football Game</b>\n\nPredict the ball direction!\n\nChoose your stake amount:',
//     stakeKeyboard, userInfo.userId, 'football', 'stake_selection'
//   );
// };

// const triggerBlackjackGame = async (bot: Bot, userInfo: { userId: string; chatId: number }) => {
//   const buttons = [
//     { text: '2 Coins', callbackData: { action: 'blackjack_stake', stake: 2 } },
//     { text: '5 Coins', callbackData: { action: 'blackjack_stake', stake: 5 } },
//     { text: '10 Coins', callbackData: { action: 'blackjack_stake', stake: 10 } },
//     { text: '20 Coins', callbackData: { action: 'blackjack_stake', stake: 20 } },
//     { text: '30 Coins', callbackData: { action: 'blackjack_stake', stake: 30 } },
//     { text: '50 Coins', callbackData: { action: 'blackjack_stake', stake: 50 } },
//   ];
//   const stakeKeyboard = createOptimizedKeyboard(buttons, true);
//   
//   await updateGameMessage(bot, userInfo.chatId, 
//     '🃏 <b>Blackjack Game</b>\n\nBeat the dealer to 21!\n\nChoose your stake amount:',
//     stakeKeyboard, userInfo.userId, 'blackjack', 'stake_selection'
//   );
// };

// const triggerBowlingGame = async (bot: Bot, userInfo: { userId: string; chatId: number }) => {
//   const buttons = [
//     { text: '2 Coins', callbackData: { action: 'bowling_stake', stake: 2 } },
//     { text: '5 Coins', callbackData: { action: 'bowling_stake', stake: 5 } },
//     { text: '10 Coins', callbackData: { action: 'bowling_stake', stake: 10 } },
//     { text: '20 Coins', callbackData: { action: 'bowling_stake', stake: 20 } },
//   ];
//   const stakeKeyboard = createOptimizedKeyboard(buttons, true);
//   
//   await updateGameMessage(bot, userInfo.chatId, 
//     '🎳 <b>Bowling Game</b>\n\nRoll the dice to knock down pins!\n\nChoose your stake amount:',
//     stakeKeyboard, userInfo.userId, 'bowling', 'stake_selection'
//   );
// };

// Temporarily disabled to focus on trivia
// const handleNewGame = async (bot: Bot, userInfo: { userId: string; chatId: number }, data: any) => {
//   const gameType = data.gameType;
//   
//   logFunctionStart('handleNewGame', { 
//     userId: userInfo.userId, 
//     gameType: gameType || 'unknown',
//     context: 'game_selection'
//   });
//   
//   if (!gameType) {
//     await sendMessage(bot, userInfo.chatId, '❌ Invalid game selection.');
//     logFunctionEnd('handleNewGame', { success: false, error: 'No game type' }, { 
//       userId: userInfo.userId, 
//       gameType: 'none',
//       context: 'game_selection'
//     });
//     return;
//   }
//   
//   // Directly trigger the game's stake selection
//   switch (gameType) {
//     case 'dice':
//       await triggerDiceGame(bot, userInfo);
//       break;
//     case 'basketball':
//       await triggerBasketballGame(bot, userInfo);
//       break;
//     case 'football':
//       await triggerFootballGame(bot, userInfo);
//       break;
//     case 'blackjack':
//       await triggerBlackjackGame(bot, userInfo);
//       break;
//     case 'bowling':
//       await triggerBowlingGame(bot, userInfo);
//       break;
//     default:
//       await sendMessage(bot, userInfo.chatId, '❌ Unknown game type.');
//       logFunctionEnd('handleNewGame', { success: false, error: 'Unknown game type' }, { 
//         userId: userInfo.userId, 
//         gameType,
//         context: 'game_selection'
//       });
//       return;
//   }
//   
//   logFunctionEnd('handleNewGame', { success: true }, { 
//     userId: userInfo.userId, 
//     gameType,
//     context: 'game_selection'
//     });
// };

const handleStartGame = async (bot: Bot, userInfo: { userId: string; chatId: number }) => {
  const buttons = [
    { text: '🧠 Trivia Game', callbackData: { action: 'trivia_start' } },
  ];
  
  const keyboard = createOptimizedKeyboard(buttons, true);
  
  await updateOrSendMessage(bot, userInfo.chatId, 
    '🎮 <b>GameHub - Trivia Focus</b>\n\n🧠 Challenge your friends in a competitive 2-player trivia game!\n\n6 rounds, 3 questions per round. Test your knowledge across 10 categories.',
    keyboard, userInfo.userId, 'game_selection'
  );
};

const handleFreeCoin = async (bot: Bot, userInfo: { userId: string; chatId: number }) => {
  const { canClaim, nextClaimIn } = await canClaimDaily(userInfo.userId);
  
  let message: string;
  if (canClaim) {
    await addCoins(userInfo.userId, 20, 'daily free coin');
    await setLastFreeCoinAt(userInfo.userId);
    message = `🪙 You claimed <b>+20</b> daily Coins!\n\nCome back tomorrow for more.`;
  } else {
    const timeRemaining = formatTimeRemaining(nextClaimIn);
    message = `⏰ You already claimed today.\n\nCome back in <b>${timeRemaining}</b>.`;
  }
  
  const buttons = [
    { text: '🪙 Claim Again', callbackData: { action: 'freecoin' } },
  ];
  
  const keyboard = createOptimizedKeyboard(buttons, true);
  
  await updateOrSendMessage(bot, userInfo.chatId, message, keyboard, userInfo.userId, 'freecoin');
};

const handleHelp = async (bot: Bot, userInfo: { userId: string; chatId: number }) => {
  const helpText = `<b>GameHub - Trivia Game</b>\n\n` +
    `<b>Available Commands:</b>\n\n` +
    `/start - Start the bot\n` +
    `/trivia - Start a new trivia game\n` +
    `/startgame - Start a new game\n` +
    `/freecoin - Claim your daily free coins\n` +
    `/help - Show this help message\n` +
    `/balance - Show your coin balance\n\n` +
    `<b>How to Play Trivia:</b>\n` +
    `• 2 players compete in 6 rounds\n` +
    `• Each round has 3 questions from one category\n` +
    `• Players take turns choosing categories\n` +
    `• Fast-paced with 10-second time limits\n` +
    `• Win: +20 coins, Draw: +10 coins each\n\n` +
    `<b>Categories:</b>\n` +
    `🌍 Geography, 📚 Literature, ⚽ Sports,\n` +
    `🎬 Entertainment, 🔬 Science, 🎨 Art & Culture,\n` +
    `🍔 Food & Drink, 🌍 History, 🎵 Music, 💻 Technology`;
  
  const buttons = [
    { text: '📋 Commands', callbackData: { action: 'help' } },
  ];
  
  const keyboard = createOptimizedKeyboard(buttons, true);
  
  await updateOrSendMessage(bot, userInfo.chatId, helpText, keyboard, userInfo.userId, 'help');
};

const handleBalance = async (bot: Bot, userInfo: { userId: string; chatId: number }) => {
  const user = await getUser(userInfo.userId);
  const message = `💰 <b>Your Balance:</b>\n\n<b>${user.coins} Coins</b>`;
  
  const buttons = [
    { text: '🪙 Free Coin', callbackData: { action: 'freecoin' } },
    { text: '🎮 Start Game', callbackData: { action: 'startgame' } },
  ];
  
  const keyboard = createOptimizedKeyboard(buttons, true);
  
  await updateOrSendMessage(bot, userInfo.chatId, message, keyboard, userInfo.userId, 'balance');
};

// Helper function for formatting time
const formatTimeRemaining = (milliseconds: number): string => {
  const hours = Math.floor(milliseconds / 3600000);
  const minutes = Math.floor((milliseconds % 3600000) / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

// Error handler
bot.catch((err) => {
  logError('botError', err.error as Error, {});
  console.error('Bot error:', err.error);
});

// Start the bot
const startBot = async () => {
  logFunctionStart('startBot', {});
  
  try {
    console.log('🚀 Starting GameHub bot...');
    
    // Set bot commands
    await bot.api.setMyCommands([
      { command: 'start', description: 'Start the bot' },
      { command: 'startgame', description: 'Start a new game' },
      { command: 'freecoin', description: 'Claim your daily free coins' },
      { command: 'help', description: 'Show help information' },
      { command: 'newgame', description: 'Create a new game' },
      { command: 'games', description: 'Show your unfinished games' },
      { command: 'stats', description: 'Show your game statistics' },
      { command: 'balance', description: 'Show your coin balance' },
      { command: 'dice', description: 'Play dice game' },
      { command: 'basketball', description: 'Play basketball game' },
      { command: 'football', description: 'Play football game' },
      { command: 'blackjack', description: 'Play blackjack game' },
      { command: 'bowling', description: 'Play bowling game' },
    ]);
    
    console.log('✅ Bot commands set successfully');
    
    // Start polling - this will run until the bot is stopped
    console.log('🎮 GameHub bot is running!');
    logFunctionEnd('startBot', {}, {});
    
    await bot.start();
  } catch (error) {
    logError('startBot', error as Error, {});
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
let isShuttingDown = false;

const gracefulShutdown = (signal: string) => {
  if (isShuttingDown) {
    console.log(`🛑 Force shutting down due to ${signal}...`);
    process.exit(1);
  }
  
  isShuttingDown = true;
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  process.exit(0);
};

// Handle shutdown signals
process.once('SIGINT', () => gracefulShutdown('SIGINT'));
process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Start the bot
startBot(); 

bot.on('inline_query', async (ctx) => {
  const query = ctx.inlineQuery.query;
  if (query.startsWith('trivia_')) {
    const gameId = query.substring(7); // Remove "trivia_" prefix to get full game ID
    if (gameId) {
      const results: InlineQueryResult[] = [
        {
          type: 'article',
          id: `share_${gameId}`,
          title: '🧠 Share Trivia Game',
          input_message_content: {
            message_text: `🧠 <b>Trivia Challenge!</b>\n\nI've started a new trivia game. Click below to join and test your knowledge!`,
            parse_mode: 'HTML',
          },
          reply_markup: {
            inline_keyboard: [
              [{ text: '🎮 Join Game', callback_data: JSON.stringify({ a: 'tj', g: gameId }) }]
            ]
          }
        }
      ];
      await ctx.answerInlineQuery(results, { cache_time: 0 });
    }
  }
}); 