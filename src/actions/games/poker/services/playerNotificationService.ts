import { Bot } from 'grammy';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';
import { PokerRoom, PlayerId } from '../types';
import { handlePokerActiveUser } from '../_engine/activeUser';

interface PlayerNotification {
  playerId: PlayerId;
  chatId: number;
  messageId?: number;
}

/**
 * Send notification to a specific player
 */
export async function notifyPlayer(
  bot: Bot,
  playerId: PlayerId,
  chatId: number,
  room: PokerRoom
): Promise<void> {
  try {
    logFunctionStart('notifyPlayer', { playerId, chatId, roomId: room.id });
    
    const playerState = {
      gameType: 'poker' as const,
      roomId: room.id,
      isActive: true,
      lastActivity: Date.now()
    };
    
    // Create a mock context for the player
    const mockCtx = {
      chat: { id: chatId },
      reply: async (text: string, options: any) => {
        return await bot.api.sendMessage(chatId, text, options);
      },
      editMessageText: async (text: string, options: any) => {
        // Try to edit existing message, fallback to new message
        try {
          return await bot.api.editMessageText(chatId, 0, text, options);
        } catch (error) {
          return await bot.api.sendMessage(chatId, text, options);
        }
      }
    } as any;
    
    await handlePokerActiveUser(mockCtx, playerState, room);
    logFunctionEnd('notifyPlayer', {}, { success: true });
  } catch (error) {
    logError('notifyPlayer', error);
  }
}

/**
 * Update messages for all players in a room
 */
export async function updateAllPlayersInRoom(
  bot: Bot,
  room: PokerRoom,
  excludePlayerId?: PlayerId
): Promise<void> {
  try {
    logFunctionStart('updateAllPlayersInRoom', { roomId: room.id, excludePlayerId });
    
    const playersToUpdate = excludePlayerId 
      ? room.players.filter(p => p.id !== excludePlayerId)
      : room.players;
    
    for (const player of playersToUpdate) {
      try {
        // For now, we'll use a default chat ID since we don't store it
        // In a real implementation, you'd store chat IDs for each player
        const defaultChatId = parseInt(player.id); // Assuming player ID is the chat ID
        
        await notifyPlayer(bot, player.id, defaultChatId, room);
      } catch (error) {
        console.error(`Failed to update message for player ${player.id}:`, error);
      }
    }
    
    logFunctionEnd('updateAllPlayersInRoom', {}, { updatedCount: playersToUpdate.length });
  } catch (error) {
    logError('updateAllPlayersInRoom', error);
  }
}

/**
 * Send room full notification to creator
 */
export async function notifyRoomFull(
  bot: Bot,
  room: PokerRoom
): Promise<void> {
  try {
    logFunctionStart('notifyRoomFull', { roomId: room.id });
    
    const creator = room.players.find(p => p.id === room.createdBy);
    if (!creator) {
      logFunctionEnd('notifyRoomFull', {}, { error: 'Creator not found' });
      return;
    }
    
    const chatId = parseInt(creator.id); // Assuming player ID is the chat ID
    const message = `🎉 <b>روم پر شد!</b>\n\n` +
      `✅ همه بازیکنان حاضر هستند (${room.players.length}/${room.maxPlayers})\n` +
      `🎮 می‌توانید بازی را شروع کنید!`;
    
    await bot.api.sendMessage(chatId, message, {
      parse_mode: 'HTML'
    });
    
    logFunctionEnd('notifyRoomFull', {}, { success: true });
  } catch (error) {
    logError('notifyRoomFull', error);
  }
} 