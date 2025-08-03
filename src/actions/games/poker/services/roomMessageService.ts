import { supabase } from '@/lib/supabase';
import { PokerRoom, PlayerId, RoomId } from '../types';
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
  data: any;
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
    
    const message: RoomMessage = {
      roomId,
      playerId,
      messageId,
      chatId,
      timestamp: Date.now()
    };
    
    const { error } = await supabase
      .from('room_messages')
      .upsert({
        room_id: roomId,
        user_id: playerId,
        message_id: messageId,
        chat_id: chatId, // Use BIGINT directly
        timestamp: new Date().toISOString()
      });
    
    if (error) throw error;
    
    logFunctionEnd('storePlayerMessage', {}, { success: true });
  } catch (error) {
    logError('storePlayerMessage', error);
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
    
    const { data, error } = await supabase
      .from('room_messages')
      .select('*')
      .eq('room_id', roomId)
      .eq('user_id', playerId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    if (data) {
      const message: RoomMessage = {
        roomId: data.room_id,
        playerId: data.user_id,
        messageId: data.message_id,
        chatId: data.chat_id,
        timestamp: new Date(data.timestamp).getTime()
      };
      logFunctionEnd('getPlayerMessage', {}, { message });
      return message;
    }
    
    logFunctionEnd('getPlayerMessage', {}, { message: null });
    return null;
  } catch (error) {
    logError('getPlayerMessage', error);
    return null;
  }
}

/**
 * Get all message IDs for players in a room
 */
export async function getAllRoomMessages(roomId: RoomId): Promise<RoomMessage[]> {
  try {
    logFunctionStart('getAllRoomMessages', { roomId });
    
    const { data, error } = await supabase
      .from('room_messages')
      .select('*')
      .eq('room_id', roomId);
    
    if (error) throw error;
    
    const messages: RoomMessage[] = data.map(item => ({
      roomId: item.room_id,
      playerId: item.user_id,
      messageId: item.message_id,
      chatId: item.chat_id,
      timestamp: new Date(item.timestamp).getTime()
    }));
    
    logFunctionEnd('getAllRoomMessages', {}, { count: messages.length });
    return messages;
  } catch (error) {
    logError('getAllRoomMessages', error);
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
    
    const { error } = await supabase
      .from('room_messages')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', playerId);
    
    if (error) throw error;
    
    logFunctionEnd('removePlayerMessage', {}, { success: true });
  } catch (error) {
    logError('removePlayerMessage', error);
    throw error;
  }
}

/**
 * Store room notification
 */
export async function storeRoomNotification(
  roomId: RoomId,
  type: RoomNotification['type'],
  data: any
): Promise<void> {
  try {
    logFunctionStart('storeRoomNotification', { roomId, type });
    
    // For now, just log the notification since we don't have a notifications table
    console.log(`📢 Room Notification [${roomId}]: ${type}`, data);
    
    logFunctionEnd('storeRoomNotification', {}, { success: true });
  } catch (error) {
    logError('storeRoomNotification', error);
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
    logError('checkRoomFullAndNotify', error);
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
    logError('notifyPlayerJoined', error);
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
    logError('notifyPlayerLeft', error);
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
    logError('notifyGameStarted', error);
  }
} 