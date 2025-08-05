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
 * Middleware to check if user is joined to the room
 */
export async function isJoinedMiddleware(ctx: HandlerContext, query: Record<string, string>): Promise<boolean> {
  try {
    const userInfo = extractUserInfo(ctx);
    const userId = userInfo.userId as PlayerId;
    const roomId = getRoomIdFromQuery(query) as RoomId;
    
    if (!roomId) {
      await ctx.ctx.reply('❌ Room ID is required');
      return false;
    }
    
    logFunctionStart('isJoinedMiddleware', { userId, roomId });
    
    // Get room information
    const room = await getPokerRoom(roomId);
    if (!room) {
      await ctx.ctx.reply('❌ Room not found');
      logFunctionEnd('isJoinedMiddleware', { isJoined: false, reason: 'room_not_found' }, { userId, roomId });
      return false;
    }
    
    // Check if user is in the room
    const player = room.players.find(p => p.id === userId);
    if (!player) {
      await ctx.ctx.reply('❌ You are not a member of this room');
      logFunctionEnd('isJoinedMiddleware', { isJoined: false, reason: 'not_member' }, { userId, roomId });
      return false;
    }
    
    logFunctionEnd('isJoinedMiddleware', { isJoined: true }, { userId, roomId });
    return true;
    
  } catch (error) {
    logError('isJoinedMiddleware', error as Error, {});
    await ctx.ctx.reply('❌ Error checking room membership');
    return false;
  }
} 