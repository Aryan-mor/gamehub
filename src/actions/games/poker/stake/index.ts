import { HandlerContext } from '@/modules/core/handler';
import { tryEditMessageText } from '@/modules/core/telegramHelpers';
import { generateMainMenuKeyboard } from '../buttonHelpers';
import { getUser, deductCoins } from '@/modules/core/userService';
import { validateUser } from '../_utils/validateUser';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';

// Export the action key for consistency and debugging
export const key = 'games.poker.stake';

/**
 * Handle stake selection for poker games
 */
async function handleStake(context: HandlerContext, query: Record<string, string> = {}): Promise<void> {
  logFunctionStart('handleStake', { query });
  
  const { ctx } = context;
  const { amount } = query;
  
  try {
    const user = validateUser(ctx);
    
    if (!amount) {
      throw new Error('مبلغ شرط مشخص نشده است');
    }
    
    const stakeAmount = parseInt(amount, 10);
    
    if (isNaN(stakeAmount) || stakeAmount <= 0) {
      throw new Error('مبلغ شرط نامعتبر است');
    }
    
    // Get user's current balance
    const userData = await getUser(user.id);
    
    if (!userData) {
      throw new Error('اطلاعات کاربر یافت نشد');
    }
    
    if (userData.coins < stakeAmount) {
      throw new Error(`سکه کافی ندارید. موجودی شما: ${userData.coins} سکه`);
    }
    
    // Deduct coins from user's balance
    await deductCoins(user.id, stakeAmount);
    
    const message = `💰 <b>شرط تنظیم شد!</b>\n\n` +
      `🎯 مبلغ: <b>${stakeAmount} سکه</b>\n` +
      `💳 موجودی جدید: <b>${userData.coins - stakeAmount} سکه</b>\n\n` +
      `🎮 آماده شروع بازی!`;
    
    const keyboard = generateMainMenuKeyboard();
    
    await tryEditMessageText(ctx, message, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
    logFunctionEnd('handleStake', { stakeAmount }, { userId: user.id });
    
  } catch (error) {
    logError('handleStake', error as Error, { query });
    
    const errorMessage = error instanceof Error ? error.message : 'خطا در تنظیم شرط. لطفاً دوباره تلاش کنید.';
    
    await tryEditMessageText(ctx, `❌ ${errorMessage}`);
  }
}

export default handleStake; 