import { HandlerContext } from '@/modules/core/handler';
import { wrapWithMiddlewares } from '@/modules/core/middleware';
import { isNotJoined } from '../_middleware';

/**
 * Handle Poker room join action
 */
async function handleJoin(context: HandlerContext, query: Record<string, string>): Promise<void> {
  // Get room ID from query (already validated by middleware)
  const roomId = query.roomId;
  
  // Log the action
  console.log(`Processing join action for room ${roomId}`);
  
  // TODO: Implement actual Poker join logic here
  // This would typically involve:
  // 1. Validating the room exists and has space
  // 2. Adding user to the room
  // 3. Notifying other players
  // 4. Starting game if enough players
  
  // For now, just acknowledge the action
  if (context.ctx && context.ctx.reply) {
    await context.ctx.reply(`Successfully joined room ${roomId}`);
  }
}

// Export the handler wrapped with middleware
export default wrapWithMiddlewares(handleJoin, [isNotJoined]); 