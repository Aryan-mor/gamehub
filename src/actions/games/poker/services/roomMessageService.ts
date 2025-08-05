import { api } from '@/lib/api';
import { PokerRoom, RoomId, PlayerId } from '../types';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';

interface RoomMessage {
  roomId: RoomId;
  playerId: PlayerId;
  messageId: number;
  chatId: number;
  timestamp: number;
}

interface RoomNotification {
  roomId: RoomId;
  type: 'player_joined' | 'player_left' | 'room_full' | 'game_started' | 'player_action';
  data: Record<string, unknown>;
  timestamp: number;
}

/**
 * Store message ID for a player in a room
 */
export async function storePlayerMessage(
  roomId: RoomId,
  playerId: PlayerId,
  messageId: number,
  chatId: number
): Promise<void> {
  try {
    logFunctionStart('storePlayerMessage', { roomId, playerId, messageId, chatId });
    
    // Log the message data for debugging
    console.log('Storing player message:', {
      roomId,
      playerId,
      messageId,
      chatId,
      timestamp: Date.now()
    });
    
    await api.roomMessages.upsert({
      room_id: roomId,
      user_id: playerId,
      message_id: messageId,
      chat_id: chatId,
      timestamp: new Date().toISOString()
    });
    
    logFunctionEnd('storePlayerMessage', {}, { success: true });
  } catch (error) {
    logError('storePlayerMessage', error as Error);
    throw error;
  }
}

/**
 * Get message ID for a player in a room
 */
export async function getPlayerMessage(
  roomId: RoomId,
  playerId: PlayerId
): Promise<RoomMessage | null> {
  try {
    logFunctionStart('getPlayerMessage', { roomId, playerId });
    
    const data = await api.roomMessages.getByRoomAndUser(roomId, playerId);
    
    if (data) {
      const message: RoomMessage = {
        roomId: data.room_id as RoomId,
        playerId: data.user_id as PlayerId,
        messageId: data.message_id as number,
        chatId: data.chat_id as number,
        timestamp: new Date(data.timestamp as string).getTime()
      };
      logFunctionEnd('getPlayerMessage', {}, { message });
      return message;
    }
    
    logFunctionEnd('getPlayerMessage', {}, { message: null });
    return null;
  } catch (error) {
    logError('getPlayerMessage', error as Error);
    return null;
  }
}

/**
 * Get all message IDs for players in a room
 */
export async function getAllRoomMessages(roomId: RoomId): Promise<RoomMessage[]> {
  try {
    logFunctionStart('getAllRoomMessages', { roomId });
    
    const data = await api.roomMessages.getAllByRoom(roomId);
    
    const messages: RoomMessage[] = data.map((item: { room_id: string; user_id: string; message_id: number; chat_id: number; timestamp: string }) => ({
      roomId: item.room_id as RoomId,
      playerId: item.user_id as PlayerId,
      messageId: item.message_id,
      chatId: item.chat_id,
      timestamp: new Date(item.timestamp).getTime()
    }));
    
    logFunctionEnd('getAllRoomMessages', {}, { count: messages.length });
    return messages;
  } catch (error) {
    logError('getAllRoomMessages', error as Error);
    return [];
  }
}

/**
 * Remove message ID for a player when they leave the room
 */
export async function removePlayerMessage(
  roomId: RoomId,
  playerId: PlayerId
): Promise<void> {
  try {
    logFunctionStart('removePlayerMessage', { roomId, playerId });
    
    await api.roomMessages.deleteByRoomAndUser(roomId, playerId);
    
    logFunctionEnd('removePlayerMessage', {}, { success: true });
  } catch (error) {
    logError('removePlayerMessage', error as Error);
    throw error;
  }
}

/**
 * Store room notification
 */
export async function storeRoomNotification(
  roomId: RoomId,
  type: RoomNotification['type'],
  data: Record<string, unknown>
): Promise<void> {
  try {
    logFunctionStart('storeRoomNotification', { roomId, type });
    
    // For now, just log the notification since we don't have a notifications table
    console.log(`📢 Room Notification [${roomId}]: ${type}`, data);
    
    logFunctionEnd('storeRoomNotification', {}, { success: true });
  } catch (error) {
    logError('storeRoomNotification', error as Error);
    throw error;
  }
}

/**
 * Check if room is full and notify creator
 */
export async function checkRoomFullAndNotify(room: PokerRoom): Promise<boolean> {
  try {
    const isFull = room.players.length >= room.maxPlayers;
    
    if (isFull) {
      await storeRoomNotification(room.id, 'room_full', {
        roomId: room.id,
        playerCount: room.players.length,
        maxPlayers: room.maxPlayers
      });
    }
    
    return isFull;
  } catch (error) {
    logError('checkRoomFullAndNotify', error as Error);
    return false;
  }
}

/**
 * Notify when a player joins
 */
export async function notifyPlayerJoined(
  roomId: RoomId,
  playerId: PlayerId,
  playerName: string
): Promise<void> {
  try {
    await storeRoomNotification(roomId, 'player_joined', {
      playerId,
      playerName,
      timestamp: Date.now()
    });
  } catch (error) {
    logError('notifyPlayerJoined', error as Error);
    throw error;
  }
}

/**
 * Notify when a player leaves
 */
export async function notifyPlayerLeft(
  roomId: RoomId,
  playerId: PlayerId,
  playerName: string
): Promise<void> {
  try {
    await storeRoomNotification(roomId, 'player_left', {
      playerId,
      playerName,
      timestamp: Date.now()
    });
  } catch (error) {
    logError('notifyPlayerLeft', error as Error);
    throw error;
  }
}

/**
 * Notify when game starts
 */
export async function notifyGameStarted(roomId: RoomId): Promise<void> {
  try {
    await storeRoomNotification(roomId, 'game_started', {
      timestamp: Date.now()
    });
  } catch (error) {
    logError('notifyGameStarted', error as Error);
    throw error;
  }
} 

/**
 * Send new room information to all players in a room
 */
export async function sendNewRoomInfoToAllPlayers(
  room: PokerRoom,
  updateType: 'player_joined' | 'player_left' | 'room_full' | 'game_started'
): Promise<void> {
  try {
    logFunctionStart('sendNewRoomInfoToAllPlayers', { roomId: room.id, updateType });
    
    // Import bot instance
    const { bot } = await import('@/bot');
    const { getRoomInfoForUser, generateRoomInfoKeyboard } = await import('../_utils/roomInfoHelper');
    
    // Get all stored messages for this room
    const messages = await getAllRoomMessages(room.id);
    
    // Update each player's message
    for (const player of room.players) {
      try {
        // Get room info for this specific player
        const roomInfo = getRoomInfoForUser(room, player.id);
        const keyboard = generateRoomInfoKeyboard(room, player.id);
        
        // Check if we have a stored message for this player
        const existingMessage = messages.find(m => m.playerId === player.id);
        
        if (existingMessage) {
          // Delete old message first
          try {
            await bot.api.deleteMessage(existingMessage.chatId, existingMessage.messageId);
            console.log(`🗑️ Deleted old message for player ${player.id} in room ${room.id}`);
          } catch (deleteError) {
            console.log(`⚠️ Failed to delete old message for player ${player.id}:`, deleteError);
          }
          
          // Remove old message from database
          try {
            await api.roomMessages.deleteByRoomAndUser(room.id, player.id);
          } catch (error) {
            // Ignore error if no existing message
          }
        }
        
        // Send new message
        const sentMessage = await bot.api.sendMessage(
          player.chatId || parseInt(player.id),
          roomInfo,
          {
            parse_mode: 'HTML',
            reply_markup: keyboard as any
          }
        );
        
        // Store the new message ID
        await storePlayerMessage(room.id, player.id, sentMessage.message_id, player.chatId || parseInt(player.id));
        
        console.log(`✅ Sent new room info to player ${player.id} in room ${room.id}`);
      } catch (error) {
        console.error(`❌ Failed to send room info for player ${player.id}:`, error);
      }
    }
    
    logFunctionEnd('sendNewRoomInfoToAllPlayers', {}, { updatedPlayers: room.players.length });
  } catch (error) {
    logError('sendNewRoomInfoToAllPlayers', error as Error);
  }
}

/**
 * Update all players in a room with new room information (legacy function - kept for compatibility)
 */
export async function updateAllPlayersInRoom(
  room: PokerRoom,
  updateType: 'player_joined' | 'player_left' | 'room_full' | 'game_started'
): Promise<void> {
  try {
    logFunctionStart('updateAllPlayersInRoom', { roomId: room.id, updateType });
    
    // Get all stored messages for this room
    const messages = await getAllRoomMessages(room.id);
    
    // Import bot instance
    const { bot } = await import('@/bot');
    const { getRoomInfoForUser, generateRoomInfoKeyboard } = await import('../_utils/roomInfoHelper');
    
    // Update each player's message
    for (const message of messages) {
      try {
        // Get updated room info for this specific player
        const roomInfo = getRoomInfoForUser(room, message.playerId);
        const keyboard = generateRoomInfoKeyboard(room, message.playerId);
        
        // Try to edit the existing message first
        try {
          await bot.api.editMessageText(
            message.chatId,
            message.messageId,
            roomInfo,
            {
              parse_mode: 'HTML',
              reply_markup: keyboard as any
            }
          );
          
          console.log(`✅ Updated existing message for player ${message.playerId} in room ${room.id}`);
        } catch (editError) {
          // If edit fails, send new message and store it
          console.log(`⚠️ Failed to edit message for player ${message.playerId}, sending new message`);
          
          const sentMessage = await bot.api.sendMessage(
            message.chatId,
            roomInfo,
            {
              parse_mode: 'HTML',
              reply_markup: keyboard as any
            }
          );
          
          // Store the new message ID (remove old one first to avoid duplicate key error)
          try {
            await api.roomMessages.deleteByRoomAndUser(room.id, message.playerId);
          } catch (error) {
            // Ignore error if no existing message
          }
          await storePlayerMessage(room.id, message.playerId, sentMessage.message_id, message.chatId);
          
          console.log(`✅ Sent new message for player ${message.playerId} in room ${room.id}`);
        }
      } catch (error) {
        console.error(`❌ Failed to update/send message for player ${message.playerId}:`, error);
      }
    }
    
    logFunctionEnd('updateAllPlayersInRoom', {}, { updatedPlayers: messages.length });
  } catch (error) {
    logError('updateAllPlayersInRoom', error as Error);
  }
} 