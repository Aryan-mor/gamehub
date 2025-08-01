import { HandlerContext } from '@/modules/core/handler';
import { getRoomId } from '../../utils/getRoomId';
import { validateUser } from '../../utils/validateUser';

/**
 * Handle Poker room leave action
 */
async function handleLeave(context: HandlerContext, query: Record<string, string>): Promise<void> {
  const user = validateUser(context);
  const roomId = getRoomId(query);
  
  console.log(`User ${user.id} is leaving room ${roomId}`);
  
  // TODO: Implement leave logic
  
  if (context.ctx && context.ctx.reply) {
    await context.ctx.reply(`Successfully left room ${roomId}`);
  }
}

export default handleLeave; 