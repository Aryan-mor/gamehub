import { ref, set, get, remove } from 'firebase/database';
import { database } from '@/modules/core/firebase';
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
    
    const messageRef = ref(database, `roomMessages/${roomId}/${playerId}`);
    const message: RoomMessage = {
      roomId,
      playerId,
      messageId,
      chatId,
      timestamp: Date.now()
    };
    
    await set(messageRef, message);
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
    
    const messageRef = ref(database, `roomMessages/${roomId}/${playerId}`);
    const snapshot = await get(messageRef);
    
    if (snapshot.exists()) {
      const message = snapshot.val() as RoomMessage;
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
    
    const messagesRef = ref(database, `roomMessages/${roomId}`);
    const snapshot = await get(messagesRef);
    
    if (snapshot.exists()) {
      const messages = Object.values(snapshot.val()) as RoomMessage[];
      logFunctionEnd('getAllRoomMessages', {}, { count: messages.length });
      return messages;
    }
    
    logFunctionEnd('getAllRoomMessages', {}, { count: 0 });
    return [];
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
    
    const messageRef = ref(database, `roomMessages/${roomId}/${playerId}`);
    await remove(messageRef);
    
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
    
    const notificationRef = ref(database, `roomNotifications/${roomId}/${Date.now()}`);
    const notification: RoomNotification = {
      roomId,
      type,
      data,
      timestamp: Date.now()
    };
    
    await set(notificationRef, notification);
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