import { Bot } from 'grammy';
import { logFunctionStart, logFunctionEnd, logError } from '../../../modules/core/logger';
import { extractUserInfo, sendMessage, createInlineKeyboard, parseCallbackData, answerCallbackQuery } from '../../../modules/core/telegramHelpers';
import { startBlackjackGame, handleBlackjackTurn } from './index';
import { getGame } from '../../../modules/core/gameService';

// Helper function to format cards for display
function formatCards(cards: Array<{ suit: string; displayValue: string }>): string {
  return cards.map(card => `${card.displayValue}${getSuitEmoji(card.suit)}`).join(' ');
}

function getSuitEmoji(suit: string): string {
  switch (suit) {
    case 'hearts': return '♥️';
    case 'diamonds': return '♦️';
    case 'clubs': return '♣️';
    case 'spades': return '♠️';
    default: return '';
  }
}

export const registerBlackjackHandlers = (bot: Bot): void => {
  logFunctionStart('registerBlackjackHandlers', {});
  
  // Handle /blackjack command
  bot.command('blackjack', async (ctx) => {
    try {
      const userInfo = extractUserInfo(ctx);
      logFunctionStart('blackjackCommand', { userId: userInfo.userId });
      
      const stakeKeyboard = createInlineKeyboard([
        { text: '2 Coins', callbackData: { action: 'blackjack_stake', stake: 2 } },
        { text: '5 Coins', callbackData: { action: 'blackjack_stake', stake: 5 } },
        { text: '10 Coins', callbackData: { action: 'blackjack_stake', stake: 10 } },
        { text: '20 Coins', callbackData: { action: 'blackjack_stake', stake: 20 } },
        { text: '30 Coins', callbackData: { action: 'blackjack_stake', stake: 30 } },
        { text: '50 Coins', callbackData: { action: 'blackjack_stake', stake: 50 } },
      ]);
      
      await sendMessage(bot, userInfo.chatId, 
        '🃏 Blackjack Game\n\nGet as close to 21 as possible without going over!\n\nChoose your stake amount:',
        { replyMarkup: stakeKeyboard }
      );
      
      logFunctionEnd('blackjackCommand', {}, { userId: userInfo.userId });
    } catch (error) {
      logError('blackjackCommand', error as Error, {});
      await ctx.reply('❌ Failed to start blackjack game.');
    }
  });
  
  // Handle blackjack stake selection
  bot.callbackQuery(/.*"action":"blackjack_stake".*/, async (ctx) => {
    try {
      const userInfo = extractUserInfo(ctx);
      const data = parseCallbackData(ctx.callbackQuery.data || '');
      const stake = data.stake as number;
      
      logFunctionStart('blackjackStakeCallback', { userId: userInfo.userId, stake });
      
      await answerCallbackQuery(bot, ctx.callbackQuery.id);
      
      const result = await startBlackjackGame(userInfo.userId, stake as 2 | 5 | 10 | 20 | 30 | 50);
      
      if (!result.success) {
        await sendMessage(bot, userInfo.chatId, `❌ ${result.error}`);
        logFunctionEnd('blackjackStakeCallback', { success: false }, { userId: userInfo.userId, stake });
        return;
      }
      
      // Get the game data to show initial cards
      const game = await getGame(result.gameId!);
      if (game && game.data) {
        const { playerHand, dealerHand } = game.data as any;
        
        const actionKeyboard = {
          inline_keyboard: [
            [{ text: '🎯 Hit', callback_data: `blackjack_action_${result.gameId}_hit` }],
            [{ text: '✋ Stand', callback_data: `blackjack_action_${result.gameId}_stand` }]
          ]
        };
        
        const message = `🃏 Blackjack Game Started!\n\n💰 Stake: ${stake} Coins\n\nYour hand: ${formatCards(playerHand)}\nDealer's hand: ${formatCards([dealerHand[0]])} [?]\n\nWhat would you like to do?`;
        
        await sendMessage(bot, userInfo.chatId, message, { replyMarkup: actionKeyboard });
      }
      
      logFunctionEnd('blackjackStakeCallback', { success: true }, { userId: userInfo.userId, stake });
    } catch (error) {
      logError('blackjackStakeCallback', error as Error, {});
      await answerCallbackQuery(bot, ctx.callbackQuery.id, '❌ Failed to start game');
    }
  });
  
  // Handle blackjack action (hit/stand)
  bot.callbackQuery(/^blackjack_action_.*/, async (ctx) => {
    try {
      const userInfo = extractUserInfo(ctx);
      const callbackData = ctx.callbackQuery.data || '';
      // Parse: blackjack_action_GAMEID_action
      const match = callbackData.match(/^blackjack_action_(.+)_(hit|stand)$/);
      if (!match) {
        await answerCallbackQuery(bot, ctx.callbackQuery.id, '❌ Invalid callback data');
        return;
      }
      
      const gameId = match[1];
      const action = match[2] as 'hit' | 'stand';
      
      logFunctionStart('blackjackActionCallback', { userId: userInfo.userId, gameId, action });
      
      await answerCallbackQuery(bot, ctx.callbackQuery.id);
      
      const result = await handleBlackjackTurn(gameId, action);
      
      if (!result.success) {
        await sendMessage(bot, userInfo.chatId, `❌ ${result.error}`);
        logFunctionEnd('blackjackActionCallback', { success: false }, { userId: userInfo.userId, gameId, action });
        return;
      }
      
      const blackjackResult = result.result!;
      const emoji = blackjackResult.isWon ? '🃏' : '😔';
      const resultText = blackjackResult.result === 'win' ? 'You Won!' : 
                        blackjackResult.result === 'push' ? 'Push!' : 'You Lost!';
      
      const message = `${emoji} <b>${resultText}</b>\n\n` +
        `Your hand: ${formatCards(blackjackResult.playerHand)} (${blackjackResult.playerScore})\n` +
        `Dealer's hand: ${formatCards(blackjackResult.dealerHand)} (${blackjackResult.dealerScore})\n\n` +
        `${blackjackResult.isWon ? `💰 Winnings: +${blackjackResult.coinsWon} Coins` : `💰 Lost: ${blackjackResult.coinsLost} Coins`}`;
      
      // Create play again keyboard
      const playAgainKeyboard = {
        inline_keyboard: [
          [{ text: '🔄 Same Stake', callback_data: `blackjack_play_again_same_${gameId}_${blackjackResult.coinsLost || blackjackResult.coinsWon}` }],
          [{ text: '🃏 New Game', callback_data: `blackjack_play_again_new_${gameId}_${blackjackResult.coinsLost || blackjackResult.coinsWon}` }],
          [{ text: '🔄 Start Over', callback_data: 'blackjack_play_again_restart' }]
        ]
      };
      
      await sendMessage(bot, userInfo.chatId, message, { 
        parseMode: 'HTML',
        replyMarkup: playAgainKeyboard
      });
      
      logFunctionEnd('blackjackActionCallback', { success: true }, { userId: userInfo.userId, gameId, action });
    } catch (error) {
      logError('blackjackActionCallback', error as Error, {});
      await answerCallbackQuery(bot, ctx.callbackQuery.id, '❌ Failed to process action');
    }
  });
  
  // Handle blackjack play again
  bot.callbackQuery(/^blackjack_play_again_.*/, async (ctx) => {
    try {
      const userInfo = extractUserInfo(ctx);
      const callbackData = ctx.callbackQuery.data || '';
      
      logFunctionStart('blackjackPlayAgainCallback', { userId: userInfo.userId, callbackData });
      
      await answerCallbackQuery(bot, ctx.callbackQuery.id);
      
      if (callbackData === 'blackjack_play_again_restart') {
        // Start over - show stake selection
        const stakeKeyboard = createInlineKeyboard([
          { text: '2 Coins', callbackData: { action: 'blackjack_stake', stake: 2 } },
          { text: '5 Coins', callbackData: { action: 'blackjack_stake', stake: 5 } },
          { text: '10 Coins', callbackData: { action: 'blackjack_stake', stake: 10 } },
          { text: '20 Coins', callbackData: { action: 'blackjack_stake', stake: 20 } },
          { text: '30 Coins', callbackData: { action: 'blackjack_stake', stake: 30 } },
          { text: '50 Coins', callbackData: { action: 'blackjack_stake', stake: 50 } },
        ]);
        
        await sendMessage(bot, userInfo.chatId, 
          '🃏 Blackjack Game\n\nGet as close to 21 as possible without going over!\n\nChoose your stake amount:',
          { replyMarkup: stakeKeyboard }
        );
      } else {
        // Parse callback data for same stake or new game
        const match = callbackData.match(/^blackjack_play_again_(same|new)_(.+)_(.+)$/);
        if (!match) {
          await answerCallbackQuery(bot, ctx.callbackQuery.id, '❌ Invalid callback data');
          return;
        }
        
        const stake = parseInt(match[3]);
        
        const result = await startBlackjackGame(userInfo.userId, stake as 2 | 5 | 10 | 20 | 30 | 50);
        
        if (!result.success) {
          await sendMessage(bot, userInfo.chatId, `❌ ${result.error}`);
          return;
        }
        
        // Get the game data to show initial cards
        const game = await getGame(result.gameId!);
        if (game && game.data) {
          const { playerHand, dealerHand } = game.data as any;
          
          const actionKeyboard = {
            inline_keyboard: [
              [{ text: '🎯 Hit', callback_data: `blackjack_action_${result.gameId}_hit` }],
              [{ text: '✋ Stand', callback_data: `blackjack_action_${result.gameId}_stand` }]
            ]
          };
          
          const message = `🃏 Blackjack Game Started!\n\n💰 Stake: ${stake} Coins\n\nYour hand: ${formatCards(playerHand)}\nDealer's hand: ${formatCards([dealerHand[0]])} [?]\n\nWhat would you like to do?`;
          
          await sendMessage(bot, userInfo.chatId, message, { replyMarkup: actionKeyboard });
        }
      }
      
      logFunctionEnd('blackjackPlayAgainCallback', { success: true }, { userId: userInfo.userId });
    } catch (error) {
      logError('blackjackPlayAgainCallback', error as Error, {});
      await answerCallbackQuery(bot, ctx.callbackQuery.id, '❌ Failed to start new game');
    }
  });
  
  logFunctionEnd('registerBlackjackHandlers', {}, {});
}; 