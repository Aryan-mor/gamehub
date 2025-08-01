import { HandlerContext } from '@/modules/core/handler';
import { wrapWithMiddlewares } from '@/modules/core/middleware';
import { isJoined, isTurn } from '../_middleware';

/**
 * Handle Poker raise action
 */
async function handleRaise(context: HandlerContext, query: Record<string, string>): Promise<void> {
  // Get room ID and amount from query (roomId already validated by middleware)
  const roomId = query.roomId;
  const amount = query.amount;
  
  if (!amount) {
    throw new Error('Raise amount is required');
  }
  
  console.log(`Processing raise action for room ${roomId} with amount ${amount}`);
  
  // TODO: Implement raise logic
  // This would typically involve:
  // 1. Validating the raise amount
  // 2. Processing the raise action
  // 3. Updating game state
  // 4. Notifying other players
  // 5. Moving to next player's turn
  
  if (context.ctx && context.ctx.reply) {
    await context.ctx.reply(`Raise action processed for room ${roomId} with amount ${amount}`);
  }
}

// Export the handler wrapped with middleware
export default wrapWithMiddlewares(handleRaise, [isJoined, isTurn]); 