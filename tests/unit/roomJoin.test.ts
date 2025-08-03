import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  isPlayerInActiveRoom,
  isRoomFull,
  isPlayerAlreadyInRoom,
  isRoomAccessible,
  canRoomAcceptPlayers,
  getRoomCapacityInfo,
  validateRoomJoinRequest
} from '../../src/actions/games/poker/utils/roomJoinValidation';
import { PokerRoom, PlayerId } from '../../src/actions/games/poker/types';

// Mock the poker service
vi.mock('../../src/actions/games/poker/services/pokerService', () => ({
  getPokerRoomsForPlayer: vi.fn()
}));

describe('Room Join Validation', () => {
  let mockRoom: PokerRoom;
  let mockPlayerId: PlayerId;
  
  beforeEach(() => {
    mockPlayerId = '123' as PlayerId;
    
    mockRoom = {
      id: 'room_test123' as any,
      name: 'Test Room',
      status: 'waiting',
      players: [
        {
          id: '456' as PlayerId,
          name: 'Player 1',
          username: 'player1',
          chips: 1000,
          betAmount: 0,
          totalBet: 0,
          isReady: true,
          isFolded: false,
          isAllIn: false,
          isDealer: true,
          cards: [],
          joinedAt: Date.now()
        }
      ],
      currentPlayerIndex: 0,
      dealerIndex: 0,
      smallBlindIndex: 0,
      bigBlindIndex: 0,
      pot: 0,
      currentBet: 0,
      minRaise: 10,
      deck: [],
      communityCards: [],
      bettingRound: 'preflop',
      smallBlind: 5,
      bigBlind: 10,
      minPlayers: 2,
      maxPlayers: 4,
      isPrivate: false,
      turnTimeoutSec: 60,
      createdBy: '456' as PlayerId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  });

  describe('isRoomFull', () => {
    it('should return true when room is full', () => {
      mockRoom.players = Array(4).fill(null).map((_, i) => ({
        id: `player${i}` as PlayerId,
        name: `Player ${i}`,
        username: `player${i}`,
        chips: 1000,
        betAmount: 0,
        totalBet: 0,
        isReady: true,
        isFolded: false,
        isAllIn: false,
        isDealer: i === 0,
        cards: [],
        joinedAt: Date.now()
      }));
      
      expect(isRoomFull(mockRoom)).toBe(true);
    });

    it('should return false when room has space', () => {
      expect(isRoomFull(mockRoom)).toBe(false);
    });
  });

  describe('isPlayerAlreadyInRoom', () => {
    it('should return true when player is in room', () => {
      const playerInRoom = '456' as PlayerId;
      expect(isPlayerAlreadyInRoom(mockRoom, playerInRoom)).toBe(true);
    });

    it('should return false when player is not in room', () => {
      const playerNotInRoom = '789' as PlayerId;
      expect(isPlayerAlreadyInRoom(mockRoom, playerNotInRoom)).toBe(false);
    });
  });

  describe('isRoomAccessible', () => {
    it('should return true for public rooms', () => {
      mockRoom.isPrivate = false;
      expect(isRoomAccessible(mockRoom, false)).toBe(true);
      expect(isRoomAccessible(mockRoom, true)).toBe(true);
    });

    it('should return true for private rooms with direct link', () => {
      mockRoom.isPrivate = true;
      expect(isRoomAccessible(mockRoom, true)).toBe(true);
    });

    it('should return false for private rooms without direct link', () => {
      mockRoom.isPrivate = true;
      expect(isRoomAccessible(mockRoom, false)).toBe(false);
    });
  });

  describe('canRoomAcceptPlayers', () => {
    it('should return true when room is waiting and not full', () => {
      expect(canRoomAcceptPlayers(mockRoom)).toBe(true);
    });

    it('should return false when room is not waiting', () => {
      mockRoom.status = 'playing';
      expect(canRoomAcceptPlayers(mockRoom)).toBe(false);
    });

    it('should return false when room is full', () => {
      mockRoom.players = Array(4).fill(null).map((_, i) => ({
        id: `player${i}` as PlayerId,
        name: `Player ${i}`,
        username: `player${i}`,
        chips: 1000,
        betAmount: 0,
        totalBet: 0,
        isReady: true,
        isFolded: false,
        isAllIn: false,
        isDealer: i === 0,
        cards: [],
        joinedAt: Date.now()
      }));
      expect(canRoomAcceptPlayers(mockRoom)).toBe(false);
    });
  });

  describe('getRoomCapacityInfo', () => {
    it('should return correct capacity information', () => {
      const capacity = getRoomCapacityInfo(mockRoom);
      
      expect(capacity.current).toBe(1);
      expect(capacity.max).toBe(4);
      expect(capacity.available).toBe(3);
      expect(capacity.isFull).toBe(false);
    });

    it('should return full capacity when room is full', () => {
      mockRoom.players = Array(4).fill(null).map((_, i) => ({
        id: `player${i}` as PlayerId,
        name: `Player ${i}`,
        username: `player${i}`,
        chips: 1000,
        betAmount: 0,
        totalBet: 0,
        isReady: true,
        isFolded: false,
        isAllIn: false,
        isDealer: i === 0,
        cards: [],
        joinedAt: Date.now()
      }));
      
      const capacity = getRoomCapacityInfo(mockRoom);
      
      expect(capacity.current).toBe(4);
      expect(capacity.max).toBe(4);
      expect(capacity.available).toBe(0);
      expect(capacity.isFull).toBe(true);
    });
  });

  describe('validateRoomJoinRequest', () => {
    it('should return valid for valid request', async () => {
      const { getPokerRoomsForPlayer } = await import('../../src/actions/games/poker/services/pokerService');
      vi.mocked(getPokerRoomsForPlayer).mockResolvedValue([]);
      
      const result = await validateRoomJoinRequest(mockRoom, mockPlayerId, false);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid when player is in active room', async () => {
      const { getPokerRoomsForPlayer } = await import('../../src/actions/games/poker/services/pokerService');
      vi.mocked(getPokerRoomsForPlayer).mockResolvedValue([mockRoom]);
      
      const result = await validateRoomJoinRequest(mockRoom, mockPlayerId, false);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('در حال حاضر در یک روم فعال هستید');
    });

    it('should return invalid when room is full', async () => {
      const { getPokerRoomsForPlayer } = await import('../../src/actions/games/poker/services/pokerService');
      vi.mocked(getPokerRoomsForPlayer).mockResolvedValue([]);
      
      mockRoom.players = Array(4).fill(null).map((_, i) => ({
        id: `player${i}` as PlayerId,
        name: `Player ${i}`,
        username: `player${i}`,
        chips: 1000,
        betAmount: 0,
        totalBet: 0,
        isReady: true,
        isFolded: false,
        isAllIn: false,
        isDealer: i === 0,
        cards: [],
        joinedAt: Date.now()
      }));
      
      const result = await validateRoomJoinRequest(mockRoom, mockPlayerId, false);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('پر شده');
    });

    it('should return invalid when player is already in room', async () => {
      const { getPokerRoomsForPlayer } = await import('../../src/actions/games/poker/services/pokerService');
      vi.mocked(getPokerRoomsForPlayer).mockResolvedValue([]);
      
      const playerInRoom = '456' as PlayerId;
      const result = await validateRoomJoinRequest(mockRoom, playerInRoom, false);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('قبلاً در این روم عضو هستید');
    });

    it('should return invalid for private room without direct link', async () => {
      const { getPokerRoomsForPlayer } = await import('../../src/actions/games/poker/services/pokerService');
      vi.mocked(getPokerRoomsForPlayer).mockResolvedValue([]);
      
      mockRoom.isPrivate = true;
      const result = await validateRoomJoinRequest(mockRoom, mockPlayerId, false);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('خصوصی است و فقط از طریق لینک مستقیم');
    });

    it('should return valid for private room with direct link', async () => {
      const { getPokerRoomsForPlayer } = await import('../../src/actions/games/poker/services/pokerService');
      vi.mocked(getPokerRoomsForPlayer).mockResolvedValue([]);
      
      mockRoom.isPrivate = true;
      const result = await validateRoomJoinRequest(mockRoom, mockPlayerId, true);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });
}); 