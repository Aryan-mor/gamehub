import { RoomId } from '@/utils/types';
import { GameHubContext } from '@/plugins';

/**
 * Helper function to create poker action callback data
 * This ensures we always use POKER_ACTIONS constants
 */
export function createPokerActionCallback(_action: string, _roomId: RoomId, _additionalParams?: Record<string, string>, _ctx?: GameHubContext): string {
  throw new Error('createPokerActionCallback is deprecated. Use ctx.keyboard.buildCallbackData("games.poker.*", params)');
}

/**
 * Helper function to create poker action callback data with custom parameters
 */
export function createPokerActionCallbackWithParams(_action: string, _params: Record<string, string>, _ctx?: GameHubContext): string {
  throw new Error('createPokerActionCallbackWithParams is deprecated. Use ctx.keyboard.buildCallbackData("games.poker.*", params)');
}