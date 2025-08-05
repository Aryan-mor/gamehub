import { POKER_ACTIONS } from '../compact-codes';
import { RoomId } from '@/utils/types';

/**
 * Helper function to create poker action callback data
 * This ensures we always use POKER_ACTIONS constants
 */
export function createPokerActionCallback(action: keyof typeof POKER_ACTIONS, roomId: RoomId, additionalParams?: Record<string, string>): string {
  const baseAction = POKER_ACTIONS[action];
  
  if (!baseAction) {
    throw new Error(`Invalid poker action: ${action}`);
  }
  
  let callbackData = `${baseAction}?roomId=${roomId}`;
  
  if (additionalParams) {
    const paramString = Object.entries(additionalParams)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    callbackData += `&${paramString}`;
  }
  
  return callbackData;
}

/**
 * Helper function to create poker action callback data with custom parameters
 */
export function createPokerActionCallbackWithParams(action: keyof typeof POKER_ACTIONS, params: Record<string, string>): string {
  const baseAction = POKER_ACTIONS[action];
  
  if (!baseAction) {
    throw new Error(`Invalid poker action: ${action}`);
  }
  
  const paramString = Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
    
  return `${baseAction}?${paramString}`;
} 