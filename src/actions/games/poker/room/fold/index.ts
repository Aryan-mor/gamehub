import { HandlerContext } from '@/modules/core/handler';
import { wrapWithMiddlewares } from '@/modules/core/middleware';
import { isJoined, isTurn } from '../_middleware';

/**
 * Handle Poker fold action
 */
async function handleFold(context: HandlerContext, query: Record<string, string>): Promise<void> {
  // Get room ID from query (already validated by middleware)
  const roomId = query.roomId;
  
  console.log(`Processing fold action for room ${roomId}`);
  
  // TODO: Implement fold logic
  // This would typically involve:
  // 1. Processing the fold action
  // 2. Updating game state
  // 3. Notifying other players
  // 4. Moving to next player's turn
  
  if (context.ctx && context.ctx.reply) {
    await context.ctx.reply(`Fold action processed for room ${roomId}`);
  }
}

// Export the handler wrapped with middleware
export default wrapWithMiddlewares(handleFold, [isJoined, isTurn]); 