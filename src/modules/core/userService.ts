import { User } from './types';
import { logFunctionStart, logFunctionEnd, logError } from './logger';
import { ref, get, set, update } from 'firebase/database';
import { database } from './firebase';

export const getUser = async (userId: string): Promise<User> => {
  logFunctionStart('getUser', { userId });
  
  try {
    if (!database) throw new Error('Firebase not initialized');
    
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      const newUser: User = {
        id: userId,
        coins: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      await set(userRef, newUser);
      logFunctionEnd('getUser', newUser, { userId });
      return newUser;
    }
    
    const userData = snapshot.val() as User;
    logFunctionEnd('getUser', userData, { userId });
    return userData;
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
    if (!database) throw new Error('Firebase not initialized');
    
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    const currentCoins = snapshot.exists() ? (snapshot.val()?.coins || 0) : 0;
    const newCoins = currentCoins + amount;
    
    await update(userRef, {
      coins: newCoins,
      updatedAt: Date.now(),
    });
    
    logFunctionEnd('addCoins', { newBalance: newCoins }, { userId, amount, reason });
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
    if (!database) throw new Error('Firebase not initialized');
    
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    const currentCoins = snapshot.exists() ? (snapshot.val()?.coins || 0) : 0;
    
    if (currentCoins >= amount) {
      const newCoins = currentCoins - amount;
      await update(userRef, {
        coins: newCoins,
        updatedAt: Date.now(),
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
    const user = await getUser(userId);
    const now = Date.now();
    const lastClaim = user.lastFreeCoinAt || 0;
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
    if (!database) throw new Error('Firebase not initialized');
    
    const userRef = ref(database, `users/${userId}`);
    await update(userRef, {
      lastFreeCoinAt: Date.now(),
      updatedAt: Date.now(),
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
    if (!database) throw new Error('Firebase not initialized');
    
    const updateData: Partial<User> = {
      updatedAt: Date.now(),
    };
    
    if (username !== undefined) updateData.username = username;
    if (name !== undefined) updateData.name = name;
    
    const userRef = ref(database, `users/${userId}`);
    await update(userRef, updateData);
    
    logFunctionEnd('setUserProfile', {}, { userId, username, name });
  } catch (error) {
    logError('setUserProfile', error as Error, { userId, username, name });
    throw error;
  }
}; 