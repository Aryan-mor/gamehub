import type { GameHubContext } from '@/plugins';
import { getRoom } from './roomStore';

export async function broadcastRoomInfo(ctx: GameHubContext, roomId: string): Promise<void> {
  const { dispatch } = await import('@/modules/core/smart-router');
  const room = getRoom(roomId);
  if (!room) return;
  
  ctx.log?.debug?.('broadcastRoomInfo', { roomId, players: room.players });
  
  for (const uid of room.players) {
    ctx.log?.debug?.('broadcastRoomInfo:sending', { uid });
    
    const context = { 
      ctx, 
      user: { id: uid as unknown as string, username: '' }, 
      _query: { roomId } 
    } as unknown as import('@/modules/core/handler').HandlerContext;
    
    await dispatch('games.poker.room.info', context);
  }
}



