import { HandlerContext } from '@/modules/core/handler';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';
import { getPokerRoom } from '../../services/pokerService';
import { PlayerId, RoomId } from '../../types';

/**
 * Extract user info from context
 */
function extractUserInfo(ctx: HandlerContext): { userId: string; chatId: number } {
  return {
    userId: ctx.user.id.toString(),
    chatId: ctx.ctx.chat?.id || 0
  };
}

/**
 * Extract room ID from query parameters
 */
function getRoomIdFromQuery(query: Record<string, string>): string | null {
  return query.roomId || null;
}

/**
 * Middleware to check if user is NOT joined to the room
 */
export async function isNotJoinedMiddleware(ctx: HandlerContext, query: Record<string, string>): Promise<boolean> {
  try {
    const userInfo = extractUserInfo(ctx);
    const userId = userInfo.userId as PlayerId;
    const roomId = getRoomIdFromQuery(query) as RoomId;
    
    if (!roomId) {
      await ctx.ctx.reply('❌ Room ID is required');
      return false;
    }
    
    logFunctionStart('isNotJoinedMiddleware', { userId, roomId });
    
    // Get room information
    const room = await getPokerRoom(roomId);
    if (!room) {
      await ctx.ctx.reply('❌ Room not found');
      logFunctionEnd('isNotJoinedMiddleware', { isNotJoined: false, reason: 'room_not_found' }, { userId, roomId });
      return false;
    }
    
    // Check if user is already in the room
    const existingPlayer = room.players.find(player => player.id === userId);
    if (existingPlayer) {
      await ctx.ctx.reply('❌ You are already a member of this room');
      logFunctionEnd('isNotJoinedMiddleware', { isNotJoined: false, reason: 'already_member' }, { userId, roomId });
      return false;
    }
    
    logFunctionEnd('isNotJoinedMiddleware', { isNotJoined: true }, { userId, roomId });
    return true;
    
  } catch (error) {
    logError('isNotJoinedMiddleware', error as Error, {});
    await ctx.ctx.reply('❌ Error checking room membership');
    return false;
  }
} 