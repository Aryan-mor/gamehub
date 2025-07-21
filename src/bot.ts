import 'dotenv/config';
import { Bot } from 'grammy';
import { logFunctionStart, logFunctionEnd, logError } from './core/logger';
import { extractUserInfo, sendMessage, createInlineKeyboard, answerCallbackQuery, parseCallbackData } from './core/telegramHelpers';
import { getUser, addCoins, canClaimDaily, setLastFreeCoinAt, setUserProfile } from './core/userService';
import { getActiveGamesForUser } from './core/gameService';
import { registerDiceHandlers } from './games/dice';
import { registerBasketballHandlers } from './games/basketball';
import { registerFootballHandlers } from './games/football';
import { registerBlackjackHandlers } from './games/blackjack';
import { registerBowlingHandlers } from './games/bowling';


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
registerDiceHandlers(bot);
registerBasketballHandlers(bot);
registerFootballHandlers(bot);
registerBlackjackHandlers(bot);
registerBowlingHandlers(bot);

// Handle /start command
bot.command('start', async (ctx) => {
  try {
    const userInfo = extractUserInfo(ctx);
    logFunctionStart('startCommand', { userId: userInfo.userId });
    
    // Save user profile
    await setUserProfile(userInfo.userId, userInfo.username, userInfo.name);
    
    // Get user data
    const user = await getUser(userInfo.userId);
    
    let welcome = `🎮 Welcome to GameHub!\n\n💰 Earn and claim daily Coins with /freecoin!\n\n🎯 Choose an action below:`;
    
    if (user.coins === 0 && !user.lastFreeCoinAt) {
      await addCoins(userInfo.userId, 100, 'initial grant');
      welcome = `🎉 You received 100\u202FCoins for joining!\n\n` + welcome;
    }
    
    const keyboard = createInlineKeyboard([
      { text: '🎮 Start Game', callbackData: { action: 'startgame' } },
      { text: '🪙 Free Coin', callbackData: { action: 'freecoin' } },
      { text: '❓ Help', callbackData: { action: 'help' } },
      { text: '💰 Balance', callbackData: { action: 'balance' } },
    ]);
    
    await sendMessage(bot, userInfo.chatId, welcome, { replyMarkup: keyboard });
    
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
    
    const helpText = `Available commands:\n` +
      `/start - Start the bot\n` +
      `/startgame - Start a new game\n` +
      `/freecoin - Claim your daily free coins\n` +
      `/help - Show this help message\n` +
      `/newgame - Create a new game\n` +
      `/games - Show your unfinished games\n` +
      `/stats - Show your game statistics\n` +
      `/balance - Show your coin balance\n` +
      `/dice - Play dice game\n` +
      `/basketball - Play basketball game\n` +
      `/football - Play football game`;
    
    await sendMessage(bot, userInfo.chatId, helpText);
    
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
    
    const user = await getUser(userInfo.userId);
    await sendMessage(bot, userInfo.chatId, `💰 Your balance: <b>${user.coins}</b> Coins`, {
      parseMode: 'HTML'
    });
    
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
    
    const { canClaim, nextClaimIn } = await canClaimDaily(userInfo.userId);
    
    if (canClaim) {
      await addCoins(userInfo.userId, 20, 'daily free coin');
      await setLastFreeCoinAt(userInfo.userId);
      await sendMessage(bot, userInfo.chatId, 
        `🪙 You claimed <b>+20</b> daily Coins! Come back tomorrow.`,
        { parseMode: 'HTML' }
      );
    } else {
      const timeRemaining = formatTimeRemaining(nextClaimIn);
      await sendMessage(bot, userInfo.chatId,
        `⏰ You already claimed today. Come back in ${timeRemaining}.`
      );
    }
    
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

bot.callbackQuery(/.*"action":"newgame".*/, async (ctx) => {
  try {
    const userInfo = extractUserInfo(ctx);
    const data = parseCallbackData(ctx.callbackQuery.data || '');
    
    logFunctionStart('menu_newgame', { 
      userId: userInfo.userId, 
      action: 'newgame',
      context: 'main_menu',
      gameType: data.gameType || 'none'
    });
    
    await answerCallbackQuery(bot, ctx.callbackQuery.id);
    await handleNewGame(bot, userInfo, data);
    
    logFunctionEnd('menu_newgame', {}, { 
      userId: userInfo.userId, 
      action: 'newgame',
      context: 'main_menu'
    });
  } catch (error) {
    logError('menu_newgame', error as Error, {});
    await answerCallbackQuery(bot, ctx.callbackQuery.id, '❌ Processing failed');
  }
});

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
// Game trigger functions
const triggerDiceGame = async (bot: Bot, userInfo: { userId: string; chatId: number }) => {
  logFunctionStart('triggerDiceGame', { 
    userId: userInfo.userId, 
    context: 'dice_game',
    step: 'stake_selection'
  });
  
  const stakeKeyboard = createInlineKeyboard([
    { text: '2 Coins', callbackData: { action: 'dice_stake', stake: 2 } },
    { text: '5 Coins', callbackData: { action: 'dice_stake', stake: 5 } },
    { text: '10 Coins', callbackData: { action: 'dice_stake', stake: 10 } },
    { text: '20 Coins', callbackData: { action: 'dice_stake', stake: 20 } },
  ]);
  
  await sendMessage(bot, userInfo.chatId, 
    '🎲 Dice Guess Game\n\nChoose your stake amount:',
    { replyMarkup: stakeKeyboard }
  );
  
  logFunctionEnd('triggerDiceGame', { success: true }, { 
    userId: userInfo.userId, 
    context: 'dice_game',
    step: 'stake_selection'
  });
};

const triggerBasketballGame = async (bot: Bot, userInfo: { userId: string; chatId: number }) => {
  logFunctionStart('triggerBasketballGame', { 
    userId: userInfo.userId, 
    context: 'basketball_game',
    step: 'stake_selection'
  });
  
  const stakeKeyboard = createInlineKeyboard([
    { text: '2 Coins', callbackData: { action: 'basketball_stake', stake: 2 } },
    { text: '5 Coins', callbackData: { action: 'basketball_stake', stake: 5 } },
    { text: '10 Coins', callbackData: { action: 'basketball_stake', stake: 10 } },
    { text: '20 Coins', callbackData: { action: 'basketball_stake', stake: 20 } },
  ]);
  
  await sendMessage(bot, userInfo.chatId, 
    '🏀 Basketball Game\n\nGuess if you will score or miss!\n\nChoose your stake amount:',
    { replyMarkup: stakeKeyboard }
  );
  
  logFunctionEnd('triggerBasketballGame', { success: true }, { 
    userId: userInfo.userId, 
    context: 'basketball_game',
    step: 'stake_selection'
  });
};

const triggerFootballGame = async (bot: Bot, userInfo: { userId: string; chatId: number }) => {
  const stakeKeyboard = createInlineKeyboard([
    { text: '2 Coins', callbackData: { action: 'football_stake', stake: 2 } },
    { text: '5 Coins', callbackData: { action: 'football_stake', stake: 5 } },
    { text: '10 Coins', callbackData: { action: 'football_stake', stake: 10 } },
    { text: '20 Coins', callbackData: { action: 'football_stake', stake: 20 } },
  ]);
  
  await sendMessage(bot, userInfo.chatId, 
    '⚽️ Football Game\n\nPredict the ball direction!\n\nChoose your stake amount:',
    { replyMarkup: stakeKeyboard }
  );
};

const triggerBlackjackGame = async (bot: Bot, userInfo: { userId: string; chatId: number }) => {
  const stakeKeyboard = createInlineKeyboard([
    { text: '2 Coins', callbackData: { action: 'blackjack_stake', stake: 2 } },
    { text: '5 Coins', callbackData: { action: 'blackjack_stake', stake: 5 } },
    { text: '10 Coins', callbackData: { action: 'blackjack_stake', stake: 10 } },
    { text: '20 Coins', callbackData: { action: 'blackjack_stake', stake: 20 } },
    { text: '30 Coins', callbackData: { action: 'blackjack_stake', stake: 30 } },
    { text: '50 Coins', callbackData: { action: 'blackjack_stake', stake: 50 } },
  ]);
  
  await sendMessage(bot, userInfo.chatId, 
    '🃏 Blackjack Game\n\nBeat the dealer to 21!\n\nChoose your stake amount:',
    { replyMarkup: stakeKeyboard }
  );
};

const triggerBowlingGame = async (bot: Bot, userInfo: { userId: string; chatId: number }) => {
  const stakeKeyboard = {
    inline_keyboard: [
      [{ text: '2 Coins', callback_data: 'bowling_stake_2' }],
      [{ text: '5 Coins', callback_data: 'bowling_stake_5' }],
      [{ text: '10 Coins', callback_data: 'bowling_stake_10' }],
      [{ text: '20 Coins', callback_data: 'bowling_stake_20' }]
    ]
  };
  
  await sendMessage(bot, userInfo.chatId, 
    '🎳 Bowling Game\n\nRoll the dice to knock down pins!\n\nChoose your stake amount:',
    { replyMarkup: stakeKeyboard }
  );
};

const handleNewGame = async (bot: Bot, userInfo: { userId: string; chatId: number }, data: any) => {
  const gameType = data.gameType;
  
  logFunctionStart('handleNewGame', { 
    userId: userInfo.userId, 
    gameType: gameType || 'unknown',
    context: 'game_selection'
  });
  
  if (!gameType) {
    await sendMessage(bot, userInfo.chatId, '❌ Invalid game selection.');
    logFunctionEnd('handleNewGame', { success: false, error: 'No game type' }, { 
      userId: userInfo.userId, 
      gameType: 'none',
      context: 'game_selection'
    });
    return;
  }
  
  // Directly trigger the game's stake selection
  switch (gameType) {
    case 'dice':
      await triggerDiceGame(bot, userInfo);
      break;
    case 'basketball':
      await triggerBasketballGame(bot, userInfo);
      break;
    case 'football':
      await triggerFootballGame(bot, userInfo);
      break;
    case 'blackjack':
      await triggerBlackjackGame(bot, userInfo);
      break;
    case 'bowling':
      await triggerBowlingGame(bot, userInfo);
      break;
    default:
      await sendMessage(bot, userInfo.chatId, '❌ Unknown game type.');
      logFunctionEnd('handleNewGame', { success: false, error: 'Unknown game type' }, { 
        userId: userInfo.userId, 
        gameType,
        context: 'game_selection'
      });
      return;
  }
  
  logFunctionEnd('handleNewGame', { success: true }, { 
    userId: userInfo.userId, 
    gameType,
    context: 'game_selection'
  });
};

const handleStartGame = async (bot: Bot, userInfo: { userId: string; chatId: number }) => {
  const singlePlayerKeyboard = createInlineKeyboard([
    { text: '🎲 Dice Game', callbackData: { action: 'newgame', gameType: 'dice' } },
    { text: '🏀 Basketball Game', callbackData: { action: 'newgame', gameType: 'basketball' } },
    { text: '⚽️ Football Game', callbackData: { action: 'newgame', gameType: 'football' } },
    { text: '🃏 Blackjack Game', callbackData: { action: 'newgame', gameType: 'blackjack' } },
    { text: '🎳 Bowling Game', callbackData: { action: 'newgame', gameType: 'bowling' } },
  ]);
  
  await sendMessage(bot, userInfo.chatId, 
    '🎮 Choose a game to play:\n\n*Single-player games available in bot chat*',
    { replyMarkup: singlePlayerKeyboard, parseMode: 'Markdown' }
  );
};

const handleFreeCoin = async (bot: Bot, userInfo: { userId: string; chatId: number }) => {
  const { canClaim, nextClaimIn } = await canClaimDaily(userInfo.userId);
  
  if (canClaim) {
    await addCoins(userInfo.userId, 20, 'daily free coin');
    await setLastFreeCoinAt(userInfo.userId);
    await sendMessage(bot, userInfo.chatId, 
      `🪙 You claimed <b>+20</b> daily Coins! Come back tomorrow.`,
      { parseMode: 'HTML' }
    );
  } else {
    const timeRemaining = formatTimeRemaining(nextClaimIn);
    await sendMessage(bot, userInfo.chatId,
      `⏰ You already claimed today. Come back in ${timeRemaining}.`
    );
  }
};

const handleHelp = async (bot: Bot, userInfo: { userId: string; chatId: number }) => {
  const helpText = `Available commands:\n` +
    `/start - Start the bot\n` +
    `/startgame - Start a new game\n` +
    `/freecoin - Claim your daily free coins\n` +
    `/help - Show this help message\n` +
    `/newgame - Create a new game\n` +
    `/games - Show your unfinished games\n` +
    `/stats - Show your game statistics\n` +
    `/balance - Show your coin balance\n` +
    `/dice - Play dice game\n` +
    `/basketball - Play basketball game\n` +
    `/football - Play football game\n` +
    `/blackjack - Play blackjack game\n` +
    `/bowling - Play bowling game`;
  
  await sendMessage(bot, userInfo.chatId, helpText);
};

const handleBalance = async (bot: Bot, userInfo: { userId: string; chatId: number }) => {
  const user = await getUser(userInfo.userId);
  await sendMessage(bot, userInfo.chatId, `💰 Your balance: <b>${user.coins}</b> Coins`, {
    parseMode: 'HTML'
  });
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
    
    // Start polling
    await bot.start();
    console.log('🎮 GameHub bot is running!');
    
    logFunctionEnd('startBot', {}, {});
  } catch (error) {
    logError('startBot', error as Error, {});
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.once('SIGINT', () => bot.stop());
process.once('SIGTERM', () => bot.stop());

// Start the bot
startBot(); 