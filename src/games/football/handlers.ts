import { Bot } from 'grammy';
import { logFunctionStart, logFunctionEnd, logError } from '../../core/logger';
import { extractUserInfo, sendMessage, createInlineKeyboard, parseCallbackData, answerCallbackQuery } from '../../core/telegramHelpers';
import { startFootballGame, handleFootballTurn, FOOTBALL_DIRECTIONS } from './index';

export const registerFootballHandlers = (bot: Bot): void => {
  logFunctionStart('registerFootballHandlers', {});
  
  // Handle /football command
  bot.command('football', async (ctx) => {
    try {
      const userInfo = extractUserInfo(ctx);
      logFunctionStart('footballCommand', { userId: userInfo.userId });
      
      const stakeKeyboard = createInlineKeyboard([
        { text: '2 Coins', callbackData: { action: 'football_stake', stake: 2 } },
        { text: '5 Coins', callbackData: { action: 'football_stake', stake: 5 } },
        { text: '10 Coins', callbackData: { action: 'football_stake', stake: 10 } },
        { text: '20 Coins', callbackData: { action: 'football_stake', stake: 20 } },
      ]);
      
      await sendMessage(bot, userInfo.chatId, 
        '⚽️ Football Game\n\nGuess where the ball will go!\n\nChoose your stake amount:',
        { replyMarkup: stakeKeyboard }
      );
      
      logFunctionEnd('footballCommand', {}, { userId: userInfo.userId });
    } catch (error) {
      logError('footballCommand', error as Error, {});
      await ctx.reply('❌ Failed to start football game.');
    }
  });
  
  // Handle football stake selection
  bot.callbackQuery(/.*"action":"football_stake".*/, async (ctx) => {
    try {
      const userInfo = extractUserInfo(ctx);
      const data = parseCallbackData(ctx.callbackQuery.data || '');
      const stake = data.stake as number;
      
      logFunctionStart('footballStakeCallback', { userId: userInfo.userId, stake });
      
      await answerCallbackQuery(bot, ctx.callbackQuery.id);
      
      const result = await startFootballGame(userInfo.userId, stake as 2 | 5 | 10 | 20);
      
      if (!result.success) {
        await sendMessage(bot, userInfo.chatId, `❌ ${result.error}`);
        logFunctionEnd('footballStakeCallback', { success: false }, { userId: userInfo.userId, stake });
        return;
      }
      
      const directionKeyboard = {
        inline_keyboard: [
          [{ text: '↖️ Top-Left', callback_data: `football_guess_${result.gameId}_1` }],
          [{ text: '↗️ Top-Right', callback_data: `football_guess_${result.gameId}_2` }],
          [{ text: '🎯 Center', callback_data: `football_guess_${result.gameId}_3` }],
          [{ text: '↙️ Bottom-Left', callback_data: `football_guess_${result.gameId}_4` }],
          [{ text: '↘️ Bottom-Right', callback_data: `football_guess_${result.gameId}_5` }]
        ]
      };
      
      await sendMessage(bot, userInfo.chatId,
        `⚽️ Football Game Started!\n\n💰 Stake: ${stake} Coins\n\nGuess where the ball will go:`,
        { replyMarkup: directionKeyboard }
      );
      
      logFunctionEnd('footballStakeCallback', { success: true }, { userId: userInfo.userId, stake });
    } catch (error) {
      logError('footballStakeCallback', error as Error, {});
      await answerCallbackQuery(bot, ctx.callbackQuery.id, '❌ Failed to start game');
    }
  });
  
  // Handle football guess
  bot.callbackQuery(/^football_guess_.*/, async (ctx) => {
    try {
      const userInfo = extractUserInfo(ctx);
      const callbackData = ctx.callbackQuery.data || '';
      // Parse: football_guess_GAMEID_guess
      const match = callbackData.match(/^football_guess_(.+)_(\d+)$/);
      if (!match) {
        await answerCallbackQuery(bot, ctx.callbackQuery.id, '❌ Invalid callback data');
        return;
      }
      
      const gameId = match[1];
      const guess = parseInt(match[2]) as number;
      
      logFunctionStart('footballGuessCallback', { userId: userInfo.userId, gameId, guess });
      
      await answerCallbackQuery(bot, ctx.callbackQuery.id);
      
      const result = await handleFootballTurn(gameId, guess);
      
      if (!result.success) {
        await sendMessage(bot, userInfo.chatId, `❌ ${result.error}`);
        logFunctionEnd('footballGuessCallback', { success: false }, { userId: userInfo.userId, gameId, guess });
        return;
      }
      
      const footballResult = result.result!;
      const emoji = footballResult.isWon ? '⚽️' : '😔';
      const guessDirection = FOOTBALL_DIRECTIONS[footballResult.guess as keyof typeof FOOTBALL_DIRECTIONS];
      const resultDirection = FOOTBALL_DIRECTIONS[footballResult.diceResult as keyof typeof FOOTBALL_DIRECTIONS];
      
      const message = footballResult.isWon
        ? `${emoji} <b>You Won!</b>\n\n⚽️ Your guess: ${guessDirection}\n🎲 Result: ${resultDirection}\n💰 Winnings: +${footballResult.coinsWon} Coins`
        : `${emoji} <b>You Lost!</b>\n\n⚽️ Your guess: ${guessDirection}\n🎲 Result: ${resultDirection}\n💰 Lost: ${footballResult.coinsLost} Coins`;
      
      await sendMessage(bot, userInfo.chatId, message, { parseMode: 'HTML' });
      
      logFunctionEnd('footballGuessCallback', { success: true }, { userId: userInfo.userId, gameId, guess });
    } catch (error) {
      logError('footballGuessCallback', error as Error, {});
      await answerCallbackQuery(bot, ctx.callbackQuery.id, '❌ Failed to process guess');
    }
  });
  
  logFunctionEnd('registerFootballHandlers', {}, {});
}; 