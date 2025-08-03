import { logFunctionStart, logFunctionEnd, logError } from './logger';
import { supabase } from '@/lib/supabase';

export const adjustCoins = async (
  userId: string,
  amount: number,
  reason: string,
  gameId?: string
): Promise<void> => {
  logFunctionStart('adjustCoins', { userId, amount, reason, gameId });
  
  try {
    // Get user first
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', userId)
      .single();
    
    if (userError) throw userError;
    
    // Get current wallet balance
    const { data: walletData, error: walletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userData.id)
      .single();
    
    if (walletError) throw walletError;
    
    const currentBalance = walletData?.balance || 0;
    const newBalance = currentBalance + amount;
    
    if (newBalance < 0) {
      throw new Error('Insufficient balance');
    }
    
    // Update wallet balance
    const { error: updateError } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('user_id', userData.id);
    
    if (updateError) throw updateError;
    
    // Record transaction
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userData.id,
        transaction_type: amount > 0 ? 'credit' : 'debit',
        amount: Math.abs(amount),
        balance_before: currentBalance,
        balance_after: newBalance,
        description: reason,
        reference_id: gameId,
      });
    
    if (transactionError) throw transactionError;
    
    logFunctionEnd('adjustCoins', { newBalance }, { userId, amount, reason, gameId });
  } catch (error) {
    logError('adjustCoins', error as Error, { userId, amount, reason, gameId });
    throw error;
  }
};

export const getUserCoins = async (userId: string): Promise<number> => {
  logFunctionStart('getUserCoins', { userId });
  
  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', userId)
      .single();
    
    if (userError && userError.code !== 'PGRST116') {
      throw userError;
    }
    
    if (!userData) {
      return 0;
    }
    
    const { data: walletData, error: walletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userData.id)
      .single();
    
    if (walletError && walletError.code !== 'PGRST116') {
      throw walletError;
    }
    
    const coins = walletData?.balance || 0;
    logFunctionEnd('getUserCoins', { userId, coins });
    return coins;
  } catch (error) {
    logError('getUserCoins', error as Error, { userId });
    throw error;
  }
};

export const requireBalance = async (userId: string, amount: number): Promise<boolean> => {
  logFunctionStart('requireBalance', { userId, amount });
  
  try {
    const userCoins = await getUserCoins(userId);
    const hasBalance = userCoins >= amount;
    
    logFunctionEnd('requireBalance', { hasBalance }, { userId, amount });
    return hasBalance;
  } catch (error) {
    logError('requireBalance', error as Error, { userId, amount });
    return false;
  }
};

export const getBalance = async (userId: string): Promise<number> => {
  logFunctionStart('getBalance', { userId });
  
  try {
    const userCoins = await getUserCoins(userId);
    logFunctionEnd('getBalance', { balance: userCoins }, { userId });
    return userCoins;
  } catch (error) {
    logError('getBalance', error as Error, { userId });
    throw error;
  }
};

export const logTransfer = async (transfer: {
  fromId: string;
  toId: string;
  amount: number;
  reason: string;
  gameId?: string;
}): Promise<void> => {
  logFunctionStart('logTransfer', transfer);
  
  try {
    // Get user IDs for from and to
    const { data: fromUser, error: fromError } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', transfer.fromId)
      .single();
    
    const { data: toUser, error: toError } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', transfer.toId)
      .single();
    
    if (fromError && transfer.fromId !== 'system') throw fromError;
    if (toError) throw toError;
    
    // Log transfer in transactions table
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: toUser.id,
        transaction_type: 'transfer',
        amount: transfer.amount,
        balance_before: 0, // Will be calculated from wallet
        balance_after: 0,  // Will be calculated from wallet
        description: `${transfer.reason} from ${transfer.fromId}`,
        reference_id: transfer.gameId,
      });
    
    if (transactionError) throw transactionError;
    
    logFunctionEnd('logTransfer', {}, transfer);
  } catch (error) {
    logError('logTransfer', error as Error, transfer);
    throw error;
  }
};

export const processGamePayout = async (
  winnerId: string,
  amount: number,
  gameId: string
): Promise<{ payout: number; fee: number }> => {
  logFunctionStart('processGamePayout', { winnerId, amount, gameId });
  
  try {
    const fee = Math.floor(amount * 0.1); // 10% fee
    const payout = amount - fee;
    
    await adjustCoins(winnerId, payout, 'game_win', gameId);
    await logTransfer({
      fromId: 'system',
      toId: winnerId,
      amount: payout,
      reason: 'game_win',
      gameId,
    });
    
    logFunctionEnd('processGamePayout', { payout, fee }, { winnerId, amount, gameId });
    return { payout, fee };
  } catch (error) {
    logError('processGamePayout', error as Error, { winnerId, amount, gameId });
    throw error;
  }
};

export const processGameRefund = async (
  player1Id: string,
  player2Id: string,
  amount: number,
  gameId: string
): Promise<void> => {
  logFunctionStart('processGameRefund', { player1Id, player2Id, amount, gameId });
  
  try {
    await adjustCoins(player1Id, amount, 'game_refund', gameId);
    await adjustCoins(player2Id, amount, 'game_refund', gameId);
    
    await logTransfer({
      fromId: 'system',
      toId: player1Id,
      amount,
      reason: 'game_refund',
      gameId,
    });
    
    await logTransfer({
      fromId: 'system',
      toId: player2Id,
      amount,
      reason: 'game_refund',
      gameId,
    });
    
    logFunctionEnd('processGameRefund', {}, { player1Id, player2Id, amount, gameId });
  } catch (error) {
    logError('processGameRefund', error as Error, { player1Id, player2Id, amount, gameId });
    throw error;
  }
};

export const deductStake = async (
  userId: string,
  amount: number,
  gameId: string
): Promise<boolean> => {
  logFunctionStart('deductStake', { userId, amount, gameId });
  
  try {
    const hasBalance = await requireBalance(userId, amount);
    if (!hasBalance) {
      logFunctionEnd('deductStake', { success: false }, { userId, amount, gameId });
      return false;
    }
    
    await adjustCoins(userId, -amount, 'game_stake', gameId);
    
    logFunctionEnd('deductStake', { success: true }, { userId, amount, gameId });
    return true;
  } catch (error) {
    logError('deductStake', error as Error, { userId, amount, gameId });
    return false;
  }
}; 