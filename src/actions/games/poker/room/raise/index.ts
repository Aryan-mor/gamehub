import { HandlerContext } from '@/modules/core/handler';
import { getRoomId } from '../../utils/getRoomId';
import { validateUser } from '../../utils/validateUser';

/**
 * Handle Poker raise action
 */
async function handleRaise(context: HandlerContext, query: Record<string, string>): Promise<void> {
  const user = validateUser(context);
  const roomId = getRoomId(query);
  const amount = query.amount;
  
  if (!amount) {
    throw new Error('Raise amount is required');
  }
  
  console.log(`User ${user.id} is raising ${amount} in room ${roomId}`);
  
  // TODO: Implement raise logic
  
  if (context.ctx && context.ctx.reply) {
    await context.ctx.reply(`Raise action processed for room ${roomId} with amount ${amount}`);
  }
}

export default handleRaise; 