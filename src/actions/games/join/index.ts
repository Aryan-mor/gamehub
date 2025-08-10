import { HandlerContext, createHandler } from '@/modules/core/handler';
import { getActiveRoomId, setActiveRoomId } from '@/modules/core/userRoomState';
import { getRoom, addPlayer } from '@/actions/games/poker/services/roomService';

export const key = 'games.join';

async function handleJoin(context: HandlerContext, query: Record<string, string> = {}): Promise<void> {
  const { ctx, user } = context;
  const targetRoomId = query.roomId || context._query?.roomId || '';
  const activeRoomId = getActiveRoomId(user.id);

  if (!activeRoomId) {
    // Validate room capacity and join
    const room = getRoom(targetRoomId);
    if (!room) {
      await ctx.replySmart(ctx.t('poker.room.error.notFound'));
      return;
    }
    const isAlreadyMember = room.players.includes(user.id as unknown as string);
    if (!isAlreadyMember && room.players.length >= room.maxPlayers) {
      await ctx.replySmart(ctx.t('poker.room.error.full') || '❌ Room is full');
      return;
    }
    if (!isAlreadyMember) {
      // Build display name from ctx.from if available
      const firstName = (ctx.from as any)?.first_name as string | undefined;
      const lastName = (ctx.from as any)?.last_name as string | undefined;
      const displayName = [firstName, lastName].filter(Boolean).join(' ').trim() || undefined;
      addPlayer(targetRoomId, user.id, displayName);
    }
    setActiveRoomId(user.id, targetRoomId);
    
    // Get all players except current user for broadcasting
    const otherPlayers = room.players.filter(p => String(p) !== String(user.id));
    
    // Broadcast updated info to all other participants
    for (const uid of otherPlayers) {
      const { dispatch } = await import('@/modules/core/smart-router');
      const broadcastContext = { 
        ctx, 
        user: { id: uid as unknown as string, username: '' }, 
        _query: { roomId: targetRoomId, chatId: String(uid) } 
      } as unknown as HandlerContext;
      
      await dispatch('games.poker.room.info', broadcastContext);
    }
    
    // Show room info to current user
    const { dispatch } = await import('@/modules/core/smart-router');
    (context as unknown as { _query?: Record<string, string> })._query = { roomId: targetRoomId };
    await dispatch('games.poker.room.info', context);
    return;
  }

  if (activeRoomId === targetRoomId) {
    // User is already in this room, just show current info
    const { dispatch } = await import('@/modules/core/smart-router');
    (context as unknown as { _query?: Record<string, string> })._query = { roomId: activeRoomId };
    await dispatch('games.poker.room.info', context);
    return;
  }

  const R = (await import('@/modules/core/routes.generated')).ROUTES;
  const rows = [
    [{ text: ctx.t('poker.join.continueActive'), callback_data: ctx.keyboard.buildCallbackData(R.games.findStep, { roomId: activeRoomId }) }],
    [{ text: ctx.t('poker.join.leaveAndJoinNew'), callback_data: ctx.keyboard.buildCallbackData(R.games.join, { s: 'switch', roomId: targetRoomId }) }],
    [{ text: ctx.t('poker.join.leaveActive'), callback_data: ctx.keyboard.buildCallbackData(R.games.start, { s: 'leaveActive', roomId: activeRoomId }) }],
  ];
  await ctx.replySmart(ctx.t('poker.join.conflictTitle'), { reply_markup: { inline_keyboard: rows } });
}

export default createHandler(handleJoin);


