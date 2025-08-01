import { HandlerContext } from '@/modules/core/handler';
import { wrapWithMiddlewares } from '@/modules/core/middleware';
import { isJoined, isTurn } from '../_middleware';

/**
 * Handle Poker call action
 */
async function handleCall(context: HandlerContext, query: Record<string, string>): Promise<void> {
  // Get room ID from query (already validated by middleware)
  const roomId = query.roomId;
  
  // Log the action
  console.log(`Processing call action for room ${roomId}`);
  
  // TODO: Implement actual Poker call logic here
  // This would typically involve:
  // 1. Processing the call action
  // 2. Updating game state
  // 3. Notifying other players
  // 4. Moving to next player's turn
  
  // For now, just acknowledge the action
  if (context.ctx && context.ctx.reply) {
    await context.ctx.reply(`Call action processed for room ${roomId}`);
  }
}

// Export the handler wrapped with middleware
export default wrapWithMiddlewares(handleCall, [isJoined, isTurn]); 