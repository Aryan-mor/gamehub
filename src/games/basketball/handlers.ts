import { Bot } from 'grammy';
import { logFunctionStart, logFunctionEnd, logError } from '../../core/logger';
import { extractUserInfo, sendMessage, createInlineKeyboard, parseCallbackData, answerCallbackQuery } from '../../core/telegramHelpers';
import { startBasketballGame, handleBasketballTurn } from './index';

export const registerBasketballHandlers = (bot: Bot): void => {
  logFunctionStart('registerBasketballHandlers', {});
  
  // Handle /basketball command
  bot.command('basketball', async (ctx) => {
    try {
      const userInfo = extractUserInfo(ctx);
      logFunctionStart('basketballCommand', { userId: userInfo.userId });
      
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
      
      logFunctionEnd('basketballCommand', {}, { userId: userInfo.userId });
    } catch (error) {
      logError('basketballCommand', error as Error, {});
      await ctx.reply('❌ Failed to start basketball game.');
    }
  });
  
  // Handle basketball stake selection
  bot.callbackQuery(/.*"action":"basketball_stake".*/, async (ctx) => {
    try {
      const userInfo = extractUserInfo(ctx);
      const data = parseCallbackData(ctx.callbackQuery.data || '');
      const stake = data.stake as number;
      
      logFunctionStart('basketballStakeCallback', { userId: userInfo.userId, stake });
      
      await answerCallbackQuery(bot, ctx.callbackQuery.id);
      
      const result = await startBasketballGame(userInfo.userId, stake as 2 | 5 | 10 | 20);
      
      if (!result.success) {
        await sendMessage(bot, userInfo.chatId, `❌ ${result.error}`);
        logFunctionEnd('basketballStakeCallback', { success: false }, { userId: userInfo.userId, stake });
        return;
      }
      
      // Use a compact callback data format
      const guessKeyboard = {
        inline_keyboard: [
          [{ text: '🏀 Score', callback_data: `basketball_guess_${result.gameId}_score` }],
          [{ text: '❌ Miss', callback_data: `basketball_guess_${result.gameId}_miss` }]
        ]
      };
      
      await sendMessage(bot, userInfo.chatId,
        `🏀 Basketball Game Started!\n\n💰 Stake: ${stake} Coins\n\nGuess your shot:`,
        { replyMarkup: guessKeyboard }
      );
      
      logFunctionEnd('basketballStakeCallback', { success: true }, { userId: userInfo.userId, stake });
    } catch (error) {
      logError('basketballStakeCallback', error as Error, {});
      await answerCallbackQuery(bot, ctx.callbackQuery.id, '❌ Failed to start game');
    }
  });
  
  // Handle basketball guess
  bot.callbackQuery(/^basketball_guess_.*/, async (ctx) => {
    try {
      const userInfo = extractUserInfo(ctx);
      const callbackData = ctx.callbackQuery.data || '';
      // Parse: basketball_guess_GAMEID_guess
      const match = callbackData.match(/^basketball_guess_(.+)_(score|miss)$/);
      if (!match) {
        await answerCallbackQuery(bot, ctx.callbackQuery.id, '❌ Invalid callback data');
        return;
      }
      
      const gameId = match[1];
      const guess = match[2] as 'score' | 'miss';
      
      logFunctionStart('basketballGuessCallback', { userId: userInfo.userId, gameId, guess });
      
      await answerCallbackQuery(bot, ctx.callbackQuery.id);
      
      const result = await handleBasketballTurn(gameId, guess);
      
      if (!result.success) {
        await sendMessage(bot, userInfo.chatId, `❌ ${result.error}`);
        logFunctionEnd('basketballGuessCallback', { success: false }, { userId: userInfo.userId, gameId, guess });
        return;
      }
      
      const basketballResult = result.result!;
      const emoji = basketballResult.isWon ? '🏀' : '😔';
      const guessText = basketballResult.guess === 'score' ? 'Score' : 'Miss';
      const resultText = basketballResult.diceResult >= 4 ? 'Score!' : 'Miss!';
      
      const message = basketballResult.isWon
        ? `${emoji} <b>You Won!</b>\n\n🏀 Your guess: ${guessText}\n🎲 Result: ${resultText} (${basketballResult.diceResult})\n💰 Winnings: +${basketballResult.coinsWon} Coins`
        : `${emoji} <b>You Lost!</b>\n\n🏀 Your guess: ${guessText}\n🎲 Result: ${resultText} (${basketballResult.diceResult})\n💰 Lost: ${basketballResult.coinsLost} Coins`;
      
      // Create play again keyboard
      const playAgainKeyboard = {
        inline_keyboard: [
          [{ text: '🔄 Same Stake & Guess', callback_data: `basketball_play_again_same_${gameId}_${guess}_${basketballResult.coinsLost || basketballResult.coinsWon}` }],
          [{ text: '🏀 New Guess', callback_data: `basketball_play_again_new_guess_${gameId}_${basketballResult.coinsLost || basketballResult.coinsWon}` }],
          [{ text: '🔄 Start Over', callback_data: 'basketball_play_again_restart' }]
        ]
      };
      
      await sendMessage(bot, userInfo.chatId, message, { 
        parseMode: 'HTML',
        replyMarkup: playAgainKeyboard
      });
      
      logFunctionEnd('basketballGuessCallback', { success: true }, { userId: userInfo.userId, gameId, guess });
    } catch (error) {
      logError('basketballGuessCallback', error as Error, {});
      await answerCallbackQuery(bot, ctx.callbackQuery.id, '❌ Failed to process guess');
    }
  });
  
  // Handle basketball play again
  bot.callbackQuery(/^basketball_play_again_.*/, async (ctx) => {
    try {
      const userInfo = extractUserInfo(ctx);
      const callbackData = ctx.callbackQuery.data || '';
      
      logFunctionStart('basketballPlayAgainCallback', { userId: userInfo.userId, callbackData });
      
      await answerCallbackQuery(bot, ctx.callbackQuery.id);
      
      if (callbackData === 'basketball_play_again_restart') {
        // Start over - show stake selection
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
      } else {
        // Parse callback data for same stake or new guess
        const match = callbackData.match(/^basketball_play_again_(same|new_guess)_(.+)_(.+)_(.+)$/);
        if (!match) {
          await answerCallbackQuery(bot, ctx.callbackQuery.id, '❌ Invalid callback data');
          return;
        }
        
        const type = match[1];
        const gameId = match[2];
        const guess = match[3];
        const stake = parseInt(match[4]);
        
        const result = await startBasketballGame(userInfo.userId, stake as 2 | 5 | 10 | 20);
        
        if (!result.success) {
          await sendMessage(bot, userInfo.chatId, `❌ ${result.error}`);
          return;
        }
        
        const guessKeyboard = {
          inline_keyboard: [
            [{ text: '🏀 Score', callback_data: `basketball_guess_${result.gameId}_score` }],
            [{ text: '❌ Miss', callback_data: `basketball_guess_${result.gameId}_miss` }]
          ]
        };
        
        await sendMessage(bot, userInfo.chatId,
          `🏀 Basketball Game Started!\n\n💰 Stake: ${stake} Coins\n\nGuess your shot:`,
          { replyMarkup: guessKeyboard }
        );
      }
      
      logFunctionEnd('basketballPlayAgainCallback', { success: true }, { userId: userInfo.userId });
    } catch (error) {
      logError('basketballPlayAgainCallback', error as Error, {});
      await answerCallbackQuery(bot, ctx.callbackQuery.id, '❌ Failed to start new game');
    }
  });
  
  logFunctionEnd('registerBasketballHandlers', {}, {});
}; 