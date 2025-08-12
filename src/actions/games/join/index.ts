import { HandlerContext, createHandler } from '@/modules/core/handler';
import { getActiveRoomId, setActiveRoomId } from '@/modules/core/userRoomState';
import { getRoom, addPlayer } from '@/actions/games/poker/room/services/roomService';

export const key = 'games.join';

async function handleJoin(context: HandlerContext, query: Record<string, string> = {}): Promise<void> {
  const { ctx, user } = context;
  const targetRoomId = query.roomId || context._query?.roomId || '';
  const activeRoomId = getActiveRoomId(user.id);

  if (!activeRoomId) {
    // Validate room capacity and join
    const room = await getRoom(targetRoomId);
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
      await addPlayer(targetRoomId, user.id);
      // Update DB profile names for joining user
      try {
        const usersApi = await import('@/api/users');
        await usersApi.upsert({
          telegram_id: Number(user.id),
          username: (ctx as any)?.from?.username,
          first_name: (ctx as any)?.from?.first_name,
          last_name: (ctx as any)?.from?.last_name,
        });
      } catch {
        // ignore profile update errors
      }
    }
    setActiveRoomId(user.id, targetRoomId);
    
    // Get updated room data after joining
    const updated = await getRoom(targetRoomId);
    if (!updated) return;
    
    // Get user UUID for broadcasting
            const { ensureUserUuid } = await import('@/actions/games/poker/room/services/roomRepo');
    await ensureUserUuid(user.id);
    
    // Get all players for broadcasting (updated.players already includes the new user)
    const allPlayers = updated.players; // Don't add userUuid again since it's already in updated.players
    const usersApi = await import('@/api/users');
    const dbUsers = await usersApi.getByIds(allPlayers); // Fetch user details by UUIDs
    const userTelegramIdMap = new Map(dbUsers.map(u => [u.id, u.telegram_id])); // Map UUID to Telegram ID

    // Get room info message text
    // const { dispatch } = await import('@/modules/core/smart-router');
    
    // Get all user IDs for broadcasting
    const allUserIds = Array.from(userTelegramIdMap.values()).map(String);
    
    // For each user, dispatch room.info with their chatId
    const { logFunctionStart } = await import('@/modules/core/logger');
    logFunctionStart('join.broadcast.start', { allUserIds, targetRoomId, currentUserId: user.id });
    
    for (const userId of allUserIds) {
      logFunctionStart('join.broadcast.toUser', { userId, isCurrentUser: userId === String(user.id), currentUserTelegramId: user.id });
      
      try {
        // Import usersMessageHistory from smart-reply plugin
        const { usersMessageHistory } = await import('@/plugins/smart-reply');
        
        // Get chatId from usersMessageHistory for this user
        const userMessageHistory = usersMessageHistory[userId];
        const userChatId = userMessageHistory?.chatId || userId;
        
        logFunctionStart('join.user.chatInfo', { userId, userChatId, hasMessageHistory: !!userMessageHistory });
        
        // Use the central roomService to broadcast room info
        const { broadcastRoomInfo } = await import('@/actions/games/poker/room/services/roomService');
        await broadcastRoomInfo(ctx, targetRoomId, [userId]);
      } catch (err) {
        const { logError } = await import('@/modules/core/logger');
        logError('join.broadcast.failed', err as Error, { userId });
      }
    }
    return;
  }

  if (activeRoomId === targetRoomId) {
    // User may already be in this room; verify membership against DB
    const room = await getRoom(targetRoomId);
    if (room) {
      try {
        const { ensureUserUuid } = await import('@/actions/games/poker/room/services/roomRepo');
        const userUuid = await ensureUserUuid(String(user.id));
        const isMember = room.players.includes(userUuid);
        if (!isMember) {
          // Re-join silently if user left previously but active state still points here
          await addPlayer(targetRoomId, String(user.id));
        }
      } catch {
        // ignore membership repair errors; we'll still show info
      }
    }
    // Show current info
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


