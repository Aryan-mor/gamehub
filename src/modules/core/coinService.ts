import { api } from '@/lib/api';
import { logFunctionStart, logFunctionEnd, logError } from './logger';

export const adjustCoins = async (
  userId: string,
  amount: number,
  reason: string,
  gameId?: string
): Promise<void> => {
  logFunctionStart('adjustCoins', { userId, amount, reason, gameId });
  
  try {
    // Get user first
    const userData = await api.users.getByTelegramId(userId);
    
    // Get current wallet balance
    if (!userData) throw new Error('User not found');
    const walletData = await api.wallets.getByUserId(userData.id);
    
    const currentBalance = walletData?.balance || 0;
    const newBalance = currentBalance + amount;
    
    if (newBalance < 0) {
      throw new Error('Insufficient balance');
    }
    
    // Update wallet balance
    await api.wallets.updateBalance(userData.id, newBalance);
    
    // Record transaction
          await api.transactions.create({
        user_id: userData.id,
        transaction_type: amount > 0 ? 'credit' : 'debit',
        amount: Math.abs(amount),
        balance_before: currentBalance,
        balance_after: newBalance,
        description: reason,
      });
    
    logFunctionEnd('adjustCoins', { newBalance }, { userId, amount, reason, gameId });
  } catch (error) {
    logError('adjustCoins', error as Error, { userId, amount, reason, gameId });
    throw error;
  }
};

export const getUserCoins = async (userId: string): Promise<number> => {
  logFunctionStart('getUserCoins', { userId });
  
  try {
    let userData;
    try {
      userData = await api.users.getByTelegramId(userId);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code !== 'PGRST116') {
        throw error;
      }
      return 0;
    }
    
    let walletData;
    try {
      if (!userData) throw new Error('User not found');
      walletData = await api.wallets.getByUserId(userData.id);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code !== 'PGRST116') {
        throw error;
      }
      walletData = null;
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
    // Get user ID for to user (fromId can be 'system')
    if (transfer.fromId !== 'system') {
      try {
        await api.users.getByTelegramId(transfer.fromId);
      } catch (error: unknown) {
        throw error;
      }
    }
    
    const toUser = await api.users.getByTelegramId(transfer.toId);
    if (!toUser) throw new Error('To user not found');
    
    // Log transfer in transactions table
    await api.transactions.create({
      user_id: toUser.id,
              transaction_type: 'credit',
      amount: transfer.amount,
      balance_before: 0, // Will be calculated from wallet
      balance_after: 0,  // Will be calculated from wallet
      description: `${transfer.reason} from ${transfer.fromId}`,

    });
    
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