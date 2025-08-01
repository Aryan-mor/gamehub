import { HandlerContext } from '@/modules/core/handler';
import { getRoomId } from '../../utils/getRoomId';
import { validateUser } from '../../utils/validateUser';

/**
 * Handle Poker call action
 */
async function handleCall(context: HandlerContext, query: Record<string, string>): Promise<void> {
  // Validate user
  const user = validateUser(context);
  
  // Get and validate room ID
  const roomId = getRoomId(query);
  
  // Log the action
  console.log(`User ${user.id} is calling in room ${roomId}`);
  
  // TODO: Implement actual Poker call logic here
  // This would typically involve:
  // 1. Validating the room exists
  // 2. Checking if it's the user's turn
  // 3. Processing the call action
  // 4. Updating game state
  // 5. Notifying other players
  
  // For now, just acknowledge the action
  if (context.ctx && context.ctx.reply) {
    await context.ctx.reply(`Call action processed for room ${roomId}`);
  }
}

export default handleCall; 