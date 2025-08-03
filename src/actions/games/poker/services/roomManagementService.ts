import { 
  PokerRoom, 
  RoomId, 
  PlayerId, 
  CreateRoomRequest, 
  JoinRoomRequest,
  RoomStatus 
} from '../types';
import { 
  createPokerRoom, 
  getPokerRoom, 
  updatePokerRoom, 
  joinPokerRoom, 
  leavePokerRoom,
  deletePokerRoom,
  getActivePokerRooms,
  getPokerRoomsForPlayer,
  updatePlayerReadyStatus,
  kickPlayerFromRoom
} from './pokerService';
import { startPokerGame } from '../engine/gameStart';
import { trackGameStatistics } from './gameResultService';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';

/**
 * Room Management Service
 * Provides comprehensive room management functionality
 */
export class RoomManagementService {
  
  /**
   * Create a new poker room
   */
  static async createRoom(
    request: CreateRoomRequest,
    creatorId: PlayerId,
    creatorName: string,
    creatorUsername?: string
  ): Promise<PokerRoom> {
    logFunctionStart('RoomManagementService.createRoom', { request, creatorId });
    
    try {
      const room = await createPokerRoom(request, creatorId, creatorName, creatorUsername);
      
      logFunctionEnd('RoomManagementService.createRoom', room, { creatorId });
      return room;
    } catch (error) {
      logError('RoomManagementService.createRoom', error as Error, { request, creatorId });
      throw error;
    }
  }
  
  /**
   * Join a poker room
   */
  static async joinRoom(request: JoinRoomRequest): Promise<PokerRoom> {
    logFunctionStart('RoomManagementService.joinRoom', { request });
    
    try {
      const room = await joinPokerRoom(request);
      
      logFunctionEnd('RoomManagementService.joinRoom', room, { playerId: request.playerId });
      return room;
    } catch (error) {
      logError('RoomManagementService.joinRoom', error as Error, { request });
      throw error;
    }
  }
  
  /**
   * Leave a poker room
   */
  static async leaveRoom(roomId: RoomId, playerId: PlayerId): Promise<PokerRoom> {
    logFunctionStart('RoomManagementService.leaveRoom', { roomId, playerId });
    
    try {
      const room = await leavePokerRoom(roomId, playerId);
      
      logFunctionEnd('RoomManagementService.leaveRoom', room, { roomId, playerId });
      return room;
    } catch (error) {
      logError('RoomManagementService.leaveRoom', error as Error, { roomId, playerId });
      throw error;
    }
  }
  
  /**
   * Start a poker game
   */
  static async startGame(roomId: RoomId, playerId: PlayerId): Promise<PokerRoom> {
    logFunctionStart('RoomManagementService.startGame', { roomId, playerId });
    
    try {
      const room = await startPokerGame(roomId, playerId);
      
      logFunctionEnd('RoomManagementService.startGame', room, { roomId, playerId });
      return room;
    } catch (error) {
      logError('RoomManagementService.startGame', error as Error, { roomId, playerId });
      throw error;
    }
  }
  
  /**
   * End a poker game and track statistics
   */
  static async endGame(roomId: RoomId): Promise<PokerRoom> {
    logFunctionStart('RoomManagementService.endGame', { roomId });
    
    try {
      const room = await getPokerRoom(roomId);
      
      if (!room) {
        throw new Error('Room not found');
      }
      
      if (room.status !== 'playing') {
        throw new Error('Game is not in playing state');
      }
      
      // Track statistics for all players
      const trackPromises = room.players.map(player => 
        trackGameStatistics(room, player.id)
      );
      
      await Promise.all(trackPromises);
      
      // Update room status to finished
      const updatedRoom = await updatePokerRoom(roomId, {
        status: 'finished' as RoomStatus,
        endedAt: Date.now()
      });
      
      logFunctionEnd('RoomManagementService.endGame', updatedRoom, { roomId });
      return updatedRoom;
    } catch (error) {
      logError('RoomManagementService.endGame', error as Error, { roomId });
      throw error;
    }
  }
  
  /**
   * Kick a player from room
   */
  static async kickPlayer(roomId: RoomId, targetPlayerId: PlayerId): Promise<PokerRoom> {
    logFunctionStart('RoomManagementService.kickPlayer', { roomId, targetPlayerId });
    
    try {
      const room = await kickPlayerFromRoom(roomId, targetPlayerId);
      
      logFunctionEnd('RoomManagementService.kickPlayer', room, { roomId, targetPlayerId });
      return room;
    } catch (error) {
      logError('RoomManagementService.kickPlayer', error as Error, { roomId, targetPlayerId });
      throw error;
    }
  }
  
  /**
   * Update player ready status
   */
  static async updateReadyStatus(
    roomId: RoomId, 
    playerId: PlayerId, 
    isReady: boolean
  ): Promise<PokerRoom> {
    logFunctionStart('RoomManagementService.updateReadyStatus', { roomId, playerId, isReady });
    
    try {
      const room = await updatePlayerReadyStatus(roomId, playerId, isReady);
      
      logFunctionEnd('RoomManagementService.updateReadyStatus', room, { roomId, playerId, isReady });
      return room;
    } catch (error) {
      logError('RoomManagementService.updateReadyStatus', error as Error, { roomId, playerId, isReady });
      throw error;
    }
  }
  
  /**
   * Get room information
   */
  static async getRoom(roomId: RoomId): Promise<PokerRoom | null> {
    logFunctionStart('RoomManagementService.getRoom', { roomId });
    
    try {
      const room = await getPokerRoom(roomId);
      
      logFunctionEnd('RoomManagementService.getRoom', room, { roomId });
      return room;
    } catch (error) {
      logError('RoomManagementService.getRoom', error as Error, { roomId });
      throw error;
    }
  }
  
  /**
   * Get active rooms
   */
  static async getActiveRooms(): Promise<PokerRoom[]> {
    logFunctionStart('RoomManagementService.getActiveRooms');
    
    try {
      const rooms = await getActivePokerRooms();
      
      logFunctionEnd('RoomManagementService.getActiveRooms', rooms);
      return rooms;
    } catch (error) {
      logError('RoomManagementService.getActiveRooms', error as Error);
      throw error;
    }
  }
  
  /**
   * Get rooms for a specific player
   */
  static async getPlayerRooms(playerId: PlayerId): Promise<PokerRoom[]> {
    logFunctionStart('RoomManagementService.getPlayerRooms', { playerId });
    
    try {
      const rooms = await getPokerRoomsForPlayer(playerId);
      
      logFunctionEnd('RoomManagementService.getPlayerRooms', rooms, { playerId });
      return rooms;
    } catch (error) {
      logError('RoomManagementService.getPlayerRooms', error as Error, { playerId });
      throw error;
    }
  }
  
  /**
   * Delete a room
   */
  static async deleteRoom(roomId: RoomId): Promise<void> {
    logFunctionStart('RoomManagementService.deleteRoom', { roomId });
    
    try {
      await deletePokerRoom(roomId);
      
      logFunctionEnd('RoomManagementService.deleteRoom', {}, { roomId });
    } catch (error) {
      logError('RoomManagementService.deleteRoom', error as Error, { roomId });
      throw error;
    }
  }
  
  /**
   * Check if user can perform action in room
   */
  static async canPerformAction(
    roomId: RoomId, 
    playerId: PlayerId, 
    action: 'join' | 'leave' | 'kick' | 'start' | 'play'
  ): Promise<{ can: boolean; error?: string }> {
    logFunctionStart('RoomManagementService.canPerformAction', { roomId, playerId, action });
    
    try {
      const room = await getPokerRoom(roomId);
      
      if (!room) {
        return { can: false, error: 'روم یافت نشد' };
      }
      
      const player = room.players.find(p => p.id === playerId);
      
      switch (action) {
        case 'join':
          if (room.status !== 'waiting') {
            return { can: false, error: 'روم در حال بازی است' };
          }
          if (room.players.length >= room.maxPlayers) {
            return { can: false, error: 'روم پر است' };
          }
          if (player) {
            return { can: false, error: 'شما قبلاً عضو این روم هستید' };
          }
          break;
          
        case 'leave':
          if (!player) {
            return { can: false, error: 'شما عضو این روم نیستید' };
          }
          break;
          
        case 'kick':
          if (room.createdBy !== playerId) {
            return { can: false, error: 'فقط سازنده روم می‌تواند بازیکنان را اخراج کند' };
          }
          if (room.status !== 'waiting') {
            return { can: false, error: 'نمی‌توان در حین بازی بازیکن اخراج کرد' };
          }
          break;
          
        case 'start':
          if (room.createdBy !== playerId) {
            return { can: false, error: 'فقط سازنده روم می‌تواند بازی را شروع کند' };
          }
          if (room.status !== 'waiting') {
            return { can: false, error: 'بازی قبلاً شروع شده است' };
          }
          if (room.players.length < 2) {
            return { can: false, error: 'حداقل ۲ بازیکن برای شروع بازی نیاز است' };
          }
          break;
          
        case 'play':
          if (!player) {
            return { can: false, error: 'شما عضو این روم نیستید' };
          }
          if (room.status !== 'playing') {
            return { can: false, error: 'بازی در حال انجام نیست' };
          }
          break;
      }
      
      logFunctionEnd('RoomManagementService.canPerformAction', { can: true }, { roomId, playerId, action });
      return { can: true };
    } catch (error) {
      logError('RoomManagementService.canPerformAction', error as Error, { roomId, playerId, action });
      return { can: false, error: 'خطا در بررسی مجوز' };
    }
  }
} 