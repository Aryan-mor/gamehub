import { HandlerContext } from '@/modules/core/handler';
import { RoomId, UserId } from '@/utils/types';
import { createRoomId, isValidUserId } from '@/utils/typeGuards';

/**
 * Handle Poker room create action
 */
async function handleCreate(context: HandlerContext, query: Record<string, string>): Promise<void> {
  const { user } = context;
  const roomName = query.name || `Room by ${user.id}`;
  
  // Validate user ID using type guards
  if (!isValidUserId(user.id)) {
    throw new Error('Invalid user ID');
  }
  
  console.log(`User ${user.id} is creating room: ${roomName}`);
  
  // TODO: Implement room creation logic
  // - Validate room name
  // - Check user permissions
  // - Create room in database
  // - Return room information
  
  // Create properly typed room ID
  const roomId: RoomId = createRoomId(Date.now(), user.id);
  
  if (context.ctx && context.ctx.reply) {
    await context.ctx.reply(`Room created: ${roomName} (ID: ${roomId})`);
  }
}

export default handleCreate; 