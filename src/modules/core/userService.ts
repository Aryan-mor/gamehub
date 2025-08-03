import { User } from './types';
import { logFunctionStart, logFunctionEnd, logError } from './logger';
import { api } from '@/lib/api';

export const getUser = async (userId: string): Promise<User> => {
  logFunctionStart('getUser', { userId });
  
  try {
    // First try to get user from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', userId)
      .single();
    
    if (userError && userError.code !== 'PGRST116') {
      throw userError;
    }
    
    if (!userData) {
      // Create new user
      const newUser = {
        telegram_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const { data: createdUser, error: createError } = await supabase
        .from('users')
        .insert(newUser)
        .select()
        .single();
      
      if (createError) throw createError;
      
      // Create wallet for new user
      const { error: walletError } = await supabase
        .from('wallets')
        .insert({
          user_id: createdUser.id,
          balance: 0,
        });
      
      if (walletError) throw walletError;
      
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
    const { data: walletData, error: walletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userData.id)
      .single();
    
    if (walletError && walletError.code !== 'PGRST116') {
      throw walletError;
    }
    
    const user: User = {
      id: userId,
      coins: walletData?.balance || 0,
      createdAt: new Date(userData.created_at).getTime(),
      updatedAt: new Date(userData.updated_at).getTime(),
      username: userData.username,
      name: userData.first_name,
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
        transaction_type: 'credit',
        amount: amount,
        balance_before: currentBalance,
        balance_after: newBalance,
        description: reason,
      });
    
    if (transactionError) throw transactionError;
    
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
    
    if (currentBalance >= amount) {
      const newBalance = currentBalance - amount;
      
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
          transaction_type: 'debit',
          amount: amount,
          balance_before: currentBalance,
          balance_after: newBalance,
          description: reason,
        });
      
      if (transactionError) throw transactionError;
      
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
    const { data: userData, error } = await supabase
      .from('users')
      .select('last_free_coin_at')
      .eq('telegram_id', userId)
      .single();
    
    if (error) throw error;
    
    const now = Date.now();
    const lastClaim = userData?.last_free_coin_at ? new Date(userData.last_free_coin_at).getTime() : 0;
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
    const { error } = await supabase
      .from('users')
      .update({
        last_free_coin_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('telegram_id', userId);
    
    if (error) throw error;
    
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
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    
    if (username !== undefined) updateData.username = username;
    if (name !== undefined) updateData.first_name = name;
    
    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('telegram_id', userId);
    
    if (error) throw error;
    
    logFunctionEnd('setUserProfile', {}, { userId, username, name });
  } catch (error) {
    logError('setUserProfile', error as Error, { userId, username, name });
    throw error;
  }
}; 