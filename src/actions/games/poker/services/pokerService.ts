import { nanoid } from 'nanoid';
import { 
  PokerRoom, 
  CreateRoomRequest, 
  JoinRoomRequest,
  RoomStatus,
  PokerPlayer,
  PlayerId,
  RoomId
} from '../types';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';
// eslint-disable-next-line no-restricted-imports
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';

interface RoomDataRaw {
  id: string;
  room_id: string;
  game_type: string;
  status: string;
  settings: Record<string, unknown>;
  updated_at: string;
  created_at: string;
  created_by: string;
  name: string;
  max_players: number;
}

/**
 * Create a new poker room
 */
export const createPokerRoom = async (
  request: CreateRoomRequest,
  creatorId: PlayerId,
  creatorName: string,
  creatorUsername?: string,
  creatorChatId?: number
): Promise<PokerRoom> => {
  logFunctionStart('createPokerRoom', { request, creatorId });
  
  try {
    // Get user UUID from telegram_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', creatorId)
      .single();
    
    if (userError) throw userError;
    
    const roomId = `room_${nanoid(12)}` as RoomId;
    const now = Date.now();
    
    const creator: PokerPlayer = {
      id: creatorId,
      name: creatorName,
      username: creatorUsername,
      chips: 1000, // Default starting chips
      betAmount: 0,
      totalBet: 0,
      isReady: true,
      isFolded: false,
      isAllIn: false,
      isDealer: true,
      cards: [],
      joinedAt: now,
      chatId: creatorChatId
    };
    
    const room: PokerRoom = {
      id: roomId,
      name: request.name,
      status: 'waiting',
      players: [creator],
      currentPlayerIndex: 0,
      dealerIndex: 0,
      smallBlindIndex: 0,
      bigBlindIndex: 0,
      pot: 0,
      currentBet: 0,
      minRaise: request.smallBlind * 2,
      deck: [],
      communityCards: [],
      bettingRound: 'preflop',
      smallBlind: request.smallBlind,
      bigBlind: request.smallBlind * 2,
      minPlayers: 2,
      maxPlayers: request.maxPlayers,
      isPrivate: request.isPrivate,
      turnTimeoutSec: request.turnTimeoutSec,
      createdBy: creatorId,
      createdAt: now,
      updatedAt: now
    };
    
    // Create room in database
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .insert({
        room_id: roomId,
        name: request.name,
        game_type: 'poker',
        status: 'waiting',
        created_by: userData.id, // Use UUID instead of telegram_id
        max_players: request.maxPlayers,
        stake_amount: request.smallBlind,
        settings: {
          smallBlind: request.smallBlind,
          bigBlind: request.smallBlind * 2,
          isPrivate: request.isPrivate,
          turnTimeoutSec: request.turnTimeoutSec
        },
        is_private: request.isPrivate
      })
      .select()
      .single();
    
    if (roomError) throw roomError;
    
    // Add creator as player
    const { error: playerError } = await supabase
      .from('room_players')
      .insert({
        room_id: roomData.id,
        user_id: userData.id, // Use UUID instead of telegram_id
        is_ready: true,
        player_data: creator
      });
    
    if (playerError) throw playerError;
    
    logFunctionEnd('createPokerRoom', room, { request, creatorId });
    return room;
  } catch (error) {
    logError('createPokerRoom', error as Error, { request, creatorId });
    throw error;
  }
};

/**
 * Get a poker room by ID
 */
export const getPokerRoom = async (roomId: RoomId): Promise<PokerRoom | null> => {
  logFunctionStart('getPokerRoom', { roomId });
  
  try {
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('*, is_private')
      .eq('room_id', roomId)
      .single();
    
    if (roomError && roomError.code !== 'PGRST116') {
      throw roomError;
    }
    
    if (!roomData) {
      logFunctionEnd('getPokerRoom', null, { roomId });
      return null;
    }
    
    // Get players
    const { data: playersData, error: playersError } = await supabase
      .from('room_players')
      .select('player_data')
      .eq('room_id', roomData.id);
    
    if (playersError) throw playersError;
    
    const players = playersData.map(p => p.player_data as PokerPlayer);
    const settings = roomData.settings as Record<string, unknown>;
    
    // Get creator's telegram_id
    const { data: creatorData, error: creatorError } = await supabase
      .from('users')
      .select('telegram_id')
      .eq('id', roomData.created_by)
      .single();
    
    if (creatorError) throw creatorError;
    
    // Check if there's a cached room object in settings
    const cachedRoom = settings?.room as PokerRoom | undefined;
    
    // Use cached room data if available and more recent, otherwise use database data
    let finalPlayers = players;
    let finalSettings = settings;
    
    if (cachedRoom && cachedRoom.players && cachedRoom.players.length >= players.length) {
      // Use cached data if it has more players (more up-to-date)
      finalPlayers = cachedRoom.players;
      finalSettings = {
        ...settings,
        smallBlind: cachedRoom.smallBlind,
        bigBlind: cachedRoom.bigBlind,
        turnTimeoutSec: cachedRoom.turnTimeoutSec
      };
    }
    
    // Reconstruct room from database data
    const room: PokerRoom = {
      id: roomData.room_id as RoomId,
      name: roomData.name,
      status: roomData.status as RoomStatus,
      players: finalPlayers,
      currentPlayerIndex: 0,
      dealerIndex: 0,
      smallBlindIndex: 0,
      bigBlindIndex: 0,
      pot: 0,
      currentBet: 0,
      minRaise: (finalSettings?.smallBlind as number) * 2 || 100,
      deck: [],
      communityCards: [],
      bettingRound: 'preflop',
      smallBlind: (finalSettings?.smallBlind as number) || 50,
      bigBlind: (finalSettings?.bigBlind as number) || 100,
      minPlayers: 2,
      maxPlayers: roomData.max_players,
      isPrivate: roomData.is_private,
      turnTimeoutSec: (finalSettings?.turnTimeoutSec as number) || 30,
      createdBy: creatorData.telegram_id.toString() as PlayerId,
      createdAt: new Date(roomData.created_at).getTime(),
      updatedAt: new Date(roomData.updated_at).getTime()
    };
    
    logFunctionEnd('getPokerRoom', room, { roomId, playerCount: room.players.length });
    return room;
  } catch (error) {
    logError('getPokerRoom', error as Error, { roomId });
    throw error;
  }
};

/**
 * Update a poker room
 */
export const updatePokerRoom = async (
  roomId: RoomId,
  updates: Partial<PokerRoom>
): Promise<PokerRoom> => {
  logFunctionStart('updatePokerRoom', { roomId, updates });
  
  try {
    // First get the current room to ensure we have all data
    const currentRoom = await getPokerRoom(roomId);
    if (!currentRoom) {
      throw new Error('Room not found');
    }
    
    const updatedRoom = { ...currentRoom, ...updates, updatedAt: Date.now() };
    
    const { error: updateError } = await supabase
      .from('rooms')
      .update({
        status: updates.status || currentRoom.status,
        settings: {
          ...currentRoom,
          room: updatedRoom
        },
        updated_at: new Date().toISOString()
      })
      .eq('room_id', roomId);
    
    if (updateError) throw updateError;
    
    logFunctionEnd('updatePokerRoom', updatedRoom, { roomId, updates });
    return updatedRoom;
  } catch (error) {
    logError('updatePokerRoom', error as Error, { roomId, updates });
    throw error;
  }
};

/**
 * Join a poker room
 */
export const joinPokerRoom = async (request: JoinRoomRequest): Promise<PokerRoom> => {
  logFunctionStart('joinPokerRoom', { request });
  
  try {
    // Get or create user first
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', request.playerId)
      .single();
    
    let userId: string;
    if (userError && userError.code === 'PGRST116') {
      // User doesn't exist, create new user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          telegram_id: request.playerId,
          username: request.playerName,
          first_name: request.playerName?.split(' ')[0] || 'Unknown',
          last_name: request.playerName?.split(' ').slice(1).join(' ') || 'User'
        })
        .select('id')
        .single();
      
      if (createError) throw createError;
      userId = newUser.id;
    } else if (userError) {
      throw userError;
    } else {
      userId = userData.id;
    }
    
    const room = await getPokerRoom(request.roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    
    if (room.status !== 'waiting') {
      throw new Error('Room is not waiting for players');
    }
    
    if (room.players.length >= room.maxPlayers) {
      throw new Error('Room is full');
    }
    
    if (room.players.some(p => p.id === request.playerId)) {
      throw new Error('Player already in room');
    }
    
    const newPlayer: PokerPlayer = {
      id: request.playerId,
      name: request.playerName,
      username: request.playerName,
      chips: 1000,
      betAmount: 0,
      totalBet: 0,
      isReady: true, // Automatically ready when joining
      isFolded: false,
      isAllIn: false,
      isDealer: false,
      cards: [],
      joinedAt: Date.now(),
      chatId: request.chatId
    };
    
    // Add player to room
    const { data: roomData } = await supabase
      .from('rooms')
      .select('id')
      .eq('room_id', request.roomId)
      .single();
    
    if (roomData) {
      const { error: playerError } = await supabase
        .from('room_players')
        .insert({
          room_id: roomData.id,
          user_id: userId, // Use UUID instead of telegram_id
          is_ready: true, // Automatically ready when joining
          player_data: newPlayer
        });
      
      if (playerError) throw playerError;
    }
    
    const updatedRoom = await updatePokerRoom(request.roomId, {
      players: [...room.players, newPlayer]
    });
    
    // Send notification to all players in the room
    try {
      const { notifyPlayerJoined, sendNewRoomInfoToAllPlayers } = await import('./roomMessageService');
      await notifyPlayerJoined(updatedRoom.id, newPlayer.id, newPlayer.name);
      await sendNewRoomInfoToAllPlayers(updatedRoom, 'player_joined');
    } catch (error) {
      console.error('Failed to send room update notification:', error);
    }
    
    logFunctionEnd('joinPokerRoom', updatedRoom, { request });
    return updatedRoom;
  } catch (error) {
    logError('joinPokerRoom', error as Error, { request });
    throw error;
  }
};

/**
 * Leave a poker room
 */
export const leavePokerRoom = async (roomId: RoomId, playerId: PlayerId): Promise<PokerRoom> => {
  logFunctionStart('leavePokerRoom', { roomId, playerId });
  
  console.log(`🚪 LEAVE POKER ROOM SERVICE CALLED:`);
  console.log(`  Room ID: ${roomId}`);
  console.log(`  Player ID: ${playerId}`);
  
  try {
    const room = await getPokerRoom(roomId);
    if (!room) {
      console.error(`❌ ROOM NOT FOUND: ${roomId}`);
      throw new Error('Room not found');
    }
    
    console.log(`✅ ROOM FOUND:`, {
      id: room.id,
      name: room.name,
      status: room.status,
      createdBy: room.createdBy,
      playerCount: room.players.length
    });
    
    const updatedPlayers = room.players.filter(p => p.id !== playerId);
    const isCreator = room.createdBy === playerId;
    
    // Get user UUID from telegram_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', playerId)
      .single();
    
    if (userError && userError.code !== 'PGRST116') {
      throw userError;
    }
    
    if (userData) {
      // Remove player from database
      const { data: roomData } = await supabase
        .from('rooms')
        .select('id')
        .eq('room_id', roomId)
        .single();
      
      if (roomData) {
        const { error: playerError } = await supabase
          .from('room_players')
          .delete()
          .eq('room_id', roomData.id)
          .eq('user_id', userData.id);
        
        if (playerError) throw playerError;
      }
    }
    
    // Prepare updates
    const updates: Partial<PokerRoom> = {
      players: updatedPlayers
    };
    
    // If creator left and there are remaining players, transfer ownership
    if (isCreator && updatedPlayers.length > 0) {
      const newCreator = updatedPlayers[0]; // First remaining player becomes creator
      updates.createdBy = newCreator.id;
      console.log(`🔄 Ownership transferred from ${playerId} to ${newCreator.id}`);
    }
    
    const updatedRoom = await updatePokerRoom(roomId, updates);
    
    // Send notification to all players in the room
    try {
      const { notifyPlayerLeft, sendNewRoomInfoToAllPlayers } = await import('./roomMessageService');
      const leavingPlayer = room.players.find(p => p.id === playerId);
      if (leavingPlayer) {
        await notifyPlayerLeft(updatedRoom.id, playerId, leavingPlayer.name);
      }
      // Send new room info to all remaining players
      await sendNewRoomInfoToAllPlayers(updatedRoom, 'player_left');
    } catch (error) {
      console.error('Failed to send room update notification:', error);
    }
    
    logFunctionEnd('leavePokerRoom', updatedRoom, { roomId, playerId });
    return updatedRoom;
  } catch (error) {
    logError('leavePokerRoom', error as Error, { roomId, playerId });
    throw error;
  }
};

/**
 * Delete a poker room
 */
export const deletePokerRoom = async (roomId: RoomId): Promise<void> => {
  logFunctionStart('deletePokerRoom', { roomId });
  
  try {
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('room_id', roomId);
    
    if (error) throw error;
    
    logFunctionEnd('deletePokerRoom', {}, { roomId });
  } catch (error) {
    logError('deletePokerRoom', error as Error, { roomId });
    throw error;
  }
};

/**
 * Get active poker rooms
 */
export const getActivePokerRooms = async (): Promise<PokerRoom[]> => {
  logFunctionStart('getActivePokerRooms', {});
  
  try {
    const { data: roomsData, error: roomsError } = await supabase
      .from('rooms')
      .select('*')
      .eq('game_type', 'poker')
      .in('status', ['waiting', 'playing'])
      .order('created_at', { ascending: false });
    
    if (roomsError) throw roomsError;
    
    const rooms: PokerRoom[] = [];
    
    for (const roomData of roomsData) {
      const settings = roomData.settings as Record<string, unknown>;
      const room = settings?.room as PokerRoom;
      
      if (room) {
        // Get players for this room
        const { data: playersData } = await supabase
          .from('room_players')
          .select('player_data')
          .eq('room_id', roomData.id);
        
        if (playersData) {
          room.players = playersData.map(p => p.player_data as PokerPlayer);
          room.status = roomData.status as RoomStatus;
          room.updatedAt = new Date(roomData.updated_at).getTime();
          rooms.push(room);
        }
      }
    }
    
    logFunctionEnd('getActivePokerRooms', rooms, {});
    return rooms;
  } catch (error) {
    logError('getActivePokerRooms', error as Error, {});
    throw error;
  }
};

/**
 * Get poker rooms for a specific player
 */
export const getPokerRoomsForPlayer = async (playerId: PlayerId): Promise<PokerRoom[]> => {
  logFunctionStart('getPokerRoomsForPlayer', { playerId });
  
  try {
    // First get user UUID from telegram_id
    const userData = await api.users.getByTelegramId(playerId);
    if (!userData) {
      logFunctionEnd('getPokerRoomsForPlayer', [], { playerId });
      return [];
    }

    const { data: playerRooms, error } = await supabase
      .from('room_players')
      .select('rooms:room_id(*)')
      .eq('user_id', userData.id);

    if (error) {
      // If no rooms found, return empty array instead of throwing error
      if (error.code === 'PGRST116') {
        logFunctionEnd('getPokerRoomsForPlayer', [], { playerId });
        return [];
      }
      throw error;
    }
    if (!playerRooms) return [];

    const rooms: PokerRoom[] = [];

    for (const playerRoom of playerRooms) {
      const roomData = playerRoom.rooms as unknown as RoomDataRaw;
      
      if (roomData.game_type === 'poker') {
        // Get players for this room
        const { data: playersData } = await supabase
          .from('room_players')
          .select('player_data')
          .eq('room_id', roomData.id);

        if (playersData) {
          const players = playersData.map(p => p.player_data as PokerPlayer);
          const settings = roomData.settings as Record<string, unknown>;
          
          // Get creator's telegram_id
          const { data: creatorData } = await supabase
            .from('users')
            .select('telegram_id')
            .eq('id', roomData.created_by)
            .single();
          
          // Reconstruct room from database data
          const room: PokerRoom = {
            id: roomData.room_id as RoomId,
            name: roomData.name,
            status: roomData.status as RoomStatus,
            players,
            currentPlayerIndex: 0,
            dealerIndex: 0,
            smallBlindIndex: 0,
            bigBlindIndex: 0,
            pot: 0,
            currentBet: 0,
            minRaise: (settings.smallBlind as number) * 2,
            deck: [],
            communityCards: [],
            bettingRound: 'preflop',
            smallBlind: settings.smallBlind as number,
            bigBlind: settings.bigBlind as number,
            minPlayers: 2,
            maxPlayers: roomData.max_players,
            isPrivate: settings.isPrivate as boolean,
            turnTimeoutSec: settings.turnTimeoutSec as number,
            createdBy: creatorData?.telegram_id as PlayerId,
            createdAt: new Date(roomData.created_at).getTime(),
            updatedAt: new Date(roomData.updated_at).getTime()
          };
          
          rooms.push(room);
        }
      }
    }

    logFunctionEnd('getPokerRoomsForPlayer', rooms, { playerId });
    return rooms;
  } catch (error) {
    logError('getPokerRoomsForPlayer', error as Error, { playerId });
    throw error;
  }
};

/**
 * Update player ready status
 */
export const updatePlayerReadyStatus = async (
  roomId: RoomId,
  playerId: PlayerId,
  isReady: boolean
): Promise<PokerRoom> => {
  logFunctionStart('updatePlayerReadyStatus', { roomId, playerId, isReady });
  
  try {
    const room = await getPokerRoom(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    
    const updatedPlayers = room.players.map(p => 
      p.id === playerId ? { ...p, isReady } : p
    );
    
    // Update player ready status in database
    const { data: roomData } = await supabase
      .from('rooms')
      .select('id')
      .eq('room_id', roomId)
      .single();
    
    if (roomData) {
      const { error: playerError } = await supabase
        .from('room_players')
        .update({ is_ready: isReady })
        .eq('room_id', roomData.id)
        .eq('user_id', playerId);
      
      if (playerError) throw playerError;
    }
    
    const updatedRoom = await updatePokerRoom(roomId, {
      players: updatedPlayers
    });
    
    logFunctionEnd('updatePlayerReadyStatus', updatedRoom, { roomId, playerId, isReady });
    return updatedRoom;
  } catch (error) {
    logError('updatePlayerReadyStatus', error as Error, { roomId, playerId, isReady });
    throw error;
  }
};

/**
 * Kick player from room
 */
export const kickPlayerFromRoom = async (roomId: RoomId, targetPlayerId: PlayerId): Promise<PokerRoom> => {
  logFunctionStart('kickPlayerFromRoom', { roomId, targetPlayerId });
  
  try {
    const room = await getPokerRoom(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    
    const updatedPlayers = room.players.filter(p => p.id !== targetPlayerId);
    
    // Remove player from database
    const { data: roomData } = await supabase
      .from('rooms')
      .select('id')
      .eq('room_id', roomId)
      .single();
    
    if (roomData) {
      const { error: playerError } = await supabase
        .from('room_players')
        .delete()
        .eq('room_id', roomData.id)
        .eq('user_id', targetPlayerId);
      
      if (playerError) throw playerError;
    }
    
    const updatedRoom = await updatePokerRoom(roomId, {
      players: updatedPlayers
    });
    
    logFunctionEnd('kickPlayerFromRoom', updatedRoom, { roomId, targetPlayerId });
    return updatedRoom;
  } catch (error) {
    logError('kickPlayerFromRoom', error as Error, { roomId, targetPlayerId });
    throw error;
  }
};

/**
 * Update player info
 */
export const updatePlayerInfo = async (
  roomId: RoomId,
  playerId: PlayerId,
  updates: Partial<Pick<PokerPlayer, 'name' | 'username' | 'chatId'>>
): Promise<PokerRoom> => {
  logFunctionStart('updatePlayerInfo', { roomId, playerId, updates });
  
  try {
    const room = await getPokerRoom(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    
    const updatedPlayers = room.players.map(p => 
      p.id === playerId ? { ...p, ...updates } : p
    );
    
    // Update player data in database
    const { data: roomData } = await supabase
      .from('rooms')
      .select('id')
      .eq('room_id', roomId)
      .single();
    
    if (roomData) {
      const { data: playerData } = await supabase
        .from('room_players')
        .select('player_data')
        .eq('room_id', roomData.id)
        .eq('user_id', playerId)
        .single();
      
      if (playerData) {
        const updatedPlayerData = { ...playerData.player_data, ...updates };
        
        const { error: playerError } = await supabase
          .from('room_players')
          .update({ player_data: updatedPlayerData })
          .eq('room_id', roomData.id)
          .eq('user_id', playerId);
        
        if (playerError) throw playerError;
      }
    }
    
    const _updatedRoom = await updatePokerRoom(roomId, {
      players: updatedPlayers
    });
    
    logFunctionEnd('updatePlayerInfo', _updatedRoom, { roomId, playerId, updates });
    return _updatedRoom;
  } catch (error) {
    logError('updatePlayerInfo', error as Error, { roomId, playerId, updates });
    throw error;
  }
}; 