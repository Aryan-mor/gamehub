import { HandlerContext } from '@/modules/core/handler';
import { wrapWithMiddlewares } from '@/modules/core/middleware';
import { isJoined } from '../_middleware';

/**
 * Handle Poker room leave action
 */
async function handleLeave(context: HandlerContext, query: Record<string, string>): Promise<void> {
  // Get room ID from query (already validated by middleware)
  const roomId = query.roomId;
  
  console.log(`Processing leave action for room ${roomId}`);
  
  // TODO: Implement leave logic
  // This would typically involve:
  // 1. Removing user from the room
  // 2. Updating game state if game is in progress
  // 3. Notifying other players
  // 4. Handling game end if not enough players
  
  if (context.ctx && context.ctx.reply) {
    await context.ctx.reply(`Successfully left room ${roomId}`);
  }
}

// Export the handler wrapped with middleware
export default wrapWithMiddlewares(handleLeave, [isJoined]); 