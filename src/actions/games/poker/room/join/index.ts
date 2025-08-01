import { HandlerContext } from '@/modules/core/handler';
import { getRoomId } from '../../utils/getRoomId';
import { validateUser } from '../../utils/validateUser';

/**
 * Handle Poker room join action
 */
async function handleJoin(context: HandlerContext, query: Record<string, string>): Promise<void> {
  // Validate user
  const user = validateUser(context);
  
  // Get and validate room ID
  const roomId = getRoomId(query);
  
  // Log the action
  console.log(`User ${user.id} is joining room ${roomId}`);
  
  // TODO: Implement actual Poker join logic here
  // This would typically involve:
  // 1. Validating the room exists and has space
  // 2. Checking if user is already in the room
  // 3. Adding user to the room
  // 4. Notifying other players
  // 5. Starting game if enough players
  
  // For now, just acknowledge the action
  if (context.ctx && context.ctx.reply) {
    await context.ctx.reply(`Successfully joined room ${roomId}`);
  }
}

export default handleJoin; 