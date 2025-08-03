import { supabase } from '@/lib/supabase';
import { nanoid } from 'nanoid';
import { 
  PokerRoom, 
  RoomId, 
  PlayerId, 
  PokerPlayer, 
  CreateRoomRequest, 
  JoinRoomRequest,
  RoomStatus 
} from '../types';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';

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
        created_by: creatorId,
        max_players: request.maxPlayers,
        stake_amount: request.smallBlind,
        settings: {
          smallBlind: request.smallBlind,
          bigBlind: request.smallBlind * 2,
          isPrivate: request.isPrivate,
          turnTimeoutSec: request.turnTimeoutSec,
          room: room
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
        user_id: creatorId,
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
      .select('*')
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
    const settings = roomData.settings as any;
    const room = settings?.room as PokerRoom;
    
    if (room) {
      room.players = players;
      room.status = roomData.status as RoomStatus;
      room.updatedAt = new Date(roomData.updated_at).getTime();
    }
    
    logFunctionEnd('getPokerRoom', room, { roomId });
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
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('settings')
      .eq('room_id', roomId)
      .single();
    
    if (roomError) throw roomError;
    
    const settings = roomData.settings as any;
    const currentRoom = settings?.room as PokerRoom;
    
    const updatedRoom = { ...currentRoom, ...updates, updatedAt: Date.now() };
    
    const { error: updateError } = await supabase
      .from('rooms')
      .update({
        status: updates.status || roomData.status,
        settings: {
          ...settings,
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
      username: request.playerUsername,
      chips: 1000,
      betAmount: 0,
      totalBet: 0,
      isReady: false,
      isFolded: false,
      isAllIn: false,
      isDealer: false,
      cards: [],
      joinedAt: Date.now(),
      chatId: request.playerChatId
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
          user_id: request.playerId,
          is_ready: false,
          player_data: newPlayer
        });
      
      if (playerError) throw playerError;
    }
    
    const updatedRoom = await updatePokerRoom(request.roomId, {
      players: [...room.players, newPlayer]
    });
    
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
  
  try {
    const room = await getPokerRoom(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    
    const updatedPlayers = room.players.filter(p => p.id !== playerId);
    
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
        .eq('user_id', playerId);
      
      if (playerError) throw playerError;
    }
    
    const updatedRoom = await updatePokerRoom(roomId, {
      players: updatedPlayers
    });
    
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
      const settings = roomData.settings as any;
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
    const { data: playerRooms, error: playerRoomsError } = await supabase
      .from('room_players')
      .select(`
        room_id,
        rooms!inner(
          room_id,
          game_type,
          status,
          settings,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', playerId);
    
    if (playerRoomsError) throw playerRoomsError;
    
    const rooms: PokerRoom[] = [];
    
    for (const playerRoom of playerRooms) {
      const roomData = playerRoom.rooms;
      const settings = roomData.settings as any;
      const room = settings?.room as PokerRoom;
      
      if (room && roomData.game_type === 'poker') {
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
    
    const updatedRoom = await updatePokerRoom(roomId, {
      players: updatedPlayers
    });
    
    logFunctionEnd('updatePlayerInfo', updatedRoom, { roomId, playerId, updates });
    return updatedRoom;
  } catch (error) {
    logError('updatePlayerInfo', error as Error, { roomId, playerId, updates });
    throw error;
  }
}; 