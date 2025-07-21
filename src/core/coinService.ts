import { logFunctionStart, logFunctionEnd, logError } from './logger';
import { ref, get, update, push } from 'firebase/database';
import { database } from './firebase';

export const adjustCoins = async (
  userId: string,
  amount: number,
  reason: string,
  gameId?: string
): Promise<void> => {
  logFunctionStart('adjustCoins', { userId, amount, reason, gameId });
  
  try {
    if (!database) throw new Error('Firebase not initialized');
    
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    const currentCoins = snapshot.exists() ? (snapshot.val()?.coins || 0) : 0;
    const newCoins = currentCoins + amount;
    
    if (newCoins < 0) {
      throw new Error('Insufficient balance');
    }
    
    await update(userRef, {
      coins: newCoins,
      updatedAt: Date.now(),
    });
    
    logFunctionEnd('adjustCoins', { newBalance: newCoins }, { userId, amount, reason, gameId });
  } catch (error) {
    logError('adjustCoins', error as Error, { userId, amount, reason, gameId });
    throw error;
  }
};

export const getUserCoins = async (userId: string): Promise<number> => {
  logFunctionStart('getUserCoins', { userId });
  
  try {
    if (!database) throw new Error('Firebase not initialized');
    
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      return 0;
    }
    
    const coins = snapshot.val()?.coins || 0;
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
    if (!database) throw new Error('Firebase not initialized');
    
    const transfersRef = ref(database, 'transfers');
    await push(transfersRef, {
      ...transfer,
      timestamp: Date.now(),
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