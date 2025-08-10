import { User } from './types';
import { api } from '@/lib/api';
import { logFunctionStart, logFunctionEnd, logError } from './logger';

export const getUser = async (userId: string): Promise<User> => {
  logFunctionStart('getUser', { userId });
  
  try {
    // First try to get user from users table
    let userData;
    try {
      userData = await api.users.getByTelegramId(userId);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code !== 'PGRST116') {
        throw error;
      }
      userData = null;
    }
    
    if (!userData) {
      // Create new user
      const newUser = {
        telegram_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const createdUser = await api.users.create(newUser);
      
      // Create wallet for new user
      await api.wallets.create({
        user_id: createdUser.id,
        balance: 0,
      });
      
      const user: User = {
        id: userId,
        coins: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      logFunctionEnd('getUser', user, { userId });
      return user;
    }
    
    // Get wallet balance
    let walletData;
    try {
      walletData = await api.wallets.getByUserId(userData.id);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code !== 'PGRST116') {
        throw error;
      }
      walletData = null;
    }
    
    const user: User = {
      id: userId,
      coins: walletData?.balance || 0,
      createdAt: new Date(userData.created_at).getTime(),
      updatedAt: new Date(userData.updated_at).getTime(),
      username: userData.username,
      name: [userData.first_name, userData.last_name].filter(Boolean).join(' ').trim() || userData.first_name,
    };
    
    logFunctionEnd('getUser', user, { userId });
    return user;
  } catch (error) {
    logError('getUser', error as Error, { userId });
    throw error;
  }
};

export const addCoins = async (
  userId: string,
  amount: number,
  reason: string
): Promise<void> => {
  logFunctionStart('addCoins', { userId, amount, reason });
  
  try {
    // Get user first
    const userData = await api.users.getByTelegramId(userId);
    if (!userData) throw new Error('User not found');
    
    // Get current wallet balance
    const walletData = await api.wallets.getByUserId(userData.id);
    
    const currentBalance = walletData?.balance || 0;
    const newBalance = currentBalance + amount;
    
    // Update wallet balance
    await api.wallets.updateBalance(userData.id, newBalance);
    
    // Record transaction
    await api.transactions.create({
      user_id: userData.id,
      transaction_type: 'credit',
      amount: amount,
      balance_before: currentBalance,
      balance_after: newBalance,
      description: reason,
    });
    
    logFunctionEnd('addCoins', { newBalance }, { userId, amount, reason });
  } catch (error) {
    logError('addCoins', error as Error, { userId, amount, reason });
    throw error;
  }
};

export const deductCoins = async (
  userId: string,
  amount: number,
  reason: string
): Promise<boolean> => {
  logFunctionStart('deductCoins', { userId, amount, reason });
  
  try {
    // Get user first
    const userData = await api.users.getByTelegramId(userId);
    if (!userData) throw new Error('User not found');
    
    // Get current wallet balance
    const walletData = await api.wallets.getByUserId(userData.id);
    
    const currentBalance = walletData?.balance || 0;
    
    if (currentBalance >= amount) {
      const newBalance = currentBalance - amount;
      
      // Update wallet balance
      await api.wallets.updateBalance(userData.id, newBalance);
      
      // Record transaction
      await api.transactions.create({
        user_id: userData.id,
        transaction_type: 'debit',
        amount: amount,
        balance_before: currentBalance,
        balance_after: newBalance,
        description: reason,
      });
      
      logFunctionEnd('deductCoins', { success: true }, { userId, amount, reason });
      return true;
    }
    
    logFunctionEnd('deductCoins', { success: false }, { userId, amount, reason });
    return false;
  } catch (error) {
    logError('deductCoins', error as Error, { userId, amount, reason });
    throw error;
  }
};

export const canClaimDaily = async (userId: string): Promise<{
  canClaim: boolean;
  nextClaimIn: number;
}> => {
  logFunctionStart('canClaimDaily', { userId });
  
  try {
    const userData = await api.users.getLastFreeCoinAt(userId);
    
    const now = Date.now();
    const lastClaim = userData?.last_free_coin_at ? new Date(userData.last_free_coin_at as string).getTime() : 0;
    const dayInMs = 24 * 60 * 60 * 1000;
    const timeSinceLastClaim = now - lastClaim;
    const canClaim = timeSinceLastClaim >= dayInMs;
    const nextClaimIn = canClaim ? 0 : dayInMs - timeSinceLastClaim;
    
    const result = { canClaim, nextClaimIn };
    logFunctionEnd('canClaimDaily', result, { userId });
    return result;
  } catch (error) {
    logError('canClaimDaily', error as Error, { userId });
    throw error;
  }
};

export const setLastFreeCoinAt = async (userId: string): Promise<void> => {
  logFunctionStart('setLastFreeCoinAt', { userId });
  
  try {
    await api.users.updateByTelegramId(userId, {
      last_free_coin_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    
    logFunctionEnd('setLastFreeCoinAt', {}, { userId });
  } catch (error) {
    logError('setLastFreeCoinAt', error as Error, { userId });
    throw error;
  }
};

export const setUserProfile = async (
  userId: string,
  username?: string,
  name?: string
): Promise<void> => {
  logFunctionStart('setUserProfile', { userId, username, name });
  
  try {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    
    if (username !== undefined) updateData.username = username;
    if (name !== undefined) updateData.first_name = name;
    
    await api.users.updateByTelegramId(userId, updateData);
    
    logFunctionEnd('setUserProfile', {}, { userId, username, name });
  } catch (error) {
    logError('setUserProfile', error as Error, { userId, username, name });
    throw error;
  }
}; 