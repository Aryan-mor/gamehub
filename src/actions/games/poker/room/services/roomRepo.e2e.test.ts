import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHandlerTestContext } from '@/__tests__/helpers/context';
import { HandlerContext } from '@/modules/core/handler';

// Mock the API modules
vi.mock('@/api/users', () => ({
  getByTelegramId: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock('@/api/rooms', () => ({
  getById: vi.fn(),
  create: vi.fn(),
}));

vi.mock('@/api', () => ({
  roomPlayers: {
    listByRoom: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
    setReady: vi.fn(),
  },
}));

// Mock the logger
vi.mock('@/modules/core/logger', () => ({
  logFunctionStart: vi.fn(),
  logFunctionEnd: vi.fn(),
  logError: vi.fn(),
}));

describe('Poker Room Repository E2E', () => {
  let context: HandlerContext;
  let mockGetByTelegramId: any;
  let mockUpsert: any;
  let mockGetById: any;
  let mockCreate: any;
  let mockListByRoom: any;
  let mockAdd: any;
  let mockRemove: any;
  let mockSetReady: any;
  let mockLogFunctionStart: any;
  let mockLogFunctionEnd: any;
  let mockLogError: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    context = createHandlerTestContext();
    
    const usersApi = vi.mocked((await import('@/api/users')));
    mockGetByTelegramId = usersApi.getByTelegramId;
    mockUpsert = usersApi.upsert;
    
    const roomsApi = vi.mocked((await import('@/api/rooms')));
    mockGetById = roomsApi.getById;
    mockCreate = roomsApi.create;
    
    const api = vi.mocked((await import('@/api')));
    mockListByRoom = api.roomPlayers.listByRoom;
    mockAdd = api.roomPlayers.add;
    mockRemove = api.roomPlayers.remove;
    mockSetReady = api.roomPlayers.setReady;
    
    const logger = vi.mocked((await import('@/modules/core/logger')));
    mockLogFunctionStart = logger.logFunctionStart;
    mockLogFunctionEnd = logger.logFunctionEnd;
    mockLogError = logger.logError;
  });

  describe('ensureUserUuid', () => {
    it('should return existing user UUID when user exists', async () => {
      // Arrange
      const { ensureUserUuid } = await import('./roomRepo');
      const telegramId = '123456789';
      const existingUser = { id: 'existing-user-uuid', telegram_id: 123456789 };
      mockGetByTelegramId.mockResolvedValue(existingUser);
      
      // Act
      const result = await ensureUserUuid(telegramId);
      
      // Assert
      expect(mockGetByTelegramId).toHaveBeenCalledWith(telegramId);
      expect(result).toBe('existing-user-uuid');
      expect(mockUpsert).not.toHaveBeenCalled();
    });

    it('should create new user when user does not exist', async () => {
      // Arrange
      const { ensureUserUuid } = await import('./roomRepo');
      const telegramId = '987654321';
      const newUser = { id: 'new-user-uuid', telegram_id: 987654321 };
      mockGetByTelegramId.mockResolvedValue(null);
      mockUpsert.mockResolvedValue(newUser);
      
      // Act
      const result = await ensureUserUuid(telegramId);
      
      // Assert
      expect(mockGetByTelegramId).toHaveBeenCalledWith(telegramId);
      expect(mockUpsert).toHaveBeenCalledWith({ telegram_id: 987654321 });
      expect(result).toBe('new-user-uuid');
    });

    it('should normalize numeric telegram ID', async () => {
      // Arrange
      const { ensureUserUuid } = await import('./roomRepo');
      const telegramId = '123456789';
      const existingUser = { id: 'existing-user-uuid', telegram_id: 123456789 };
      mockGetByTelegramId.mockResolvedValue(existingUser);
      
      // Act
      const result = await ensureUserUuid(telegramId);
      
      // Assert
      expect(mockGetByTelegramId).toHaveBeenCalledWith('123456789');
      expect(result).toBe('existing-user-uuid');
    });

    it('should normalize non-numeric telegram ID', async () => {
      // Arrange
      const { ensureUserUuid } = await import('./roomRepo');
      const telegramId = 'user123';
      const newUser = { id: 'new-user-uuid', telegram_id: 123456789 };
      mockGetByTelegramId.mockResolvedValue(null);
      mockUpsert.mockResolvedValue(newUser);
      
      // Act
      const result = await ensureUserUuid(telegramId);
      
      // Assert
      expect(mockGetByTelegramId).toHaveBeenCalledWith(expect.any(String));
      expect(mockUpsert).toHaveBeenCalledWith({ telegram_id: expect.any(Number) });
      expect(result).toBe('new-user-uuid');
    });
  });

  describe('getRoom', () => {
    it('should get room successfully with players', async () => {
      // Arrange
      const { getRoom } = await import('./roomRepo');
      const roomId = 'test-room-id';
      const dbRoom = {
        id: roomId,
        name: 'Test Room',
        game_type: 'poker',
        status: 'waiting',
        created_by: 'creator-uuid',
        max_players: 4,
        stake_amount: 200,
        settings: { turnTimeoutSec: 240 },
        is_private: false
      };
      const players = [
        { user_id: 'player1-uuid', ready: true },
        { user_id: 'player2-uuid', ready: false }
      ];
      
      mockGetById.mockResolvedValue(dbRoom);
      mockListByRoom.mockResolvedValue(players);
      
      // Act
      const result = await getRoom(roomId);
      
      // Assert
      expect(mockLogFunctionStart).toHaveBeenCalledWith('roomRepo.getRoom', { roomId });
      expect(mockGetById).toHaveBeenCalledWith(roomId);
      expect(mockListByRoom).toHaveBeenCalledWith(roomId);
      expect(mockLogFunctionEnd).toHaveBeenCalledWith('roomRepo.getRoom', { found: true, roomId });
      
      expect(result).toEqual({
        id: roomId,
        isPrivate: false,
        maxPlayers: 4,
        smallBlind: 200,
        createdBy: 'creator-uuid',
        players: ['player1-uuid', 'player2-uuid'],
        readyPlayers: ['player1-uuid'],
        status: 'waiting',
        turnTimeoutSec: 240,
        lastUpdate: expect.any(Number),
        playerNames: {}
      });
    });

    it('should return undefined when room not found', async () => {
      // Arrange
      const { getRoom } = await import('./roomRepo');
      const roomId = 'not-found-room-id';
      mockGetById.mockResolvedValue(null);
      
      // Act
      const result = await getRoom(roomId);
      
      // Assert
      expect(mockGetById).toHaveBeenCalledWith(roomId);
      expect(mockListByRoom).not.toHaveBeenCalled();
      expect(mockLogFunctionEnd).toHaveBeenCalledWith('roomRepo.getRoom', { found: false, roomId });
      expect(result).toBeUndefined();
    });

    it('should handle database error gracefully', async () => {
      // Arrange
      const { getRoom } = await import('./roomRepo');
      const roomId = 'error-room-id';
      const error = new Error('Database connection failed');
      mockGetById.mockRejectedValue(error);
      
      // Act
      const result = await getRoom(roomId);
      
      // Assert
      expect(mockGetById).toHaveBeenCalledWith(roomId);
      expect(mockLogError).toHaveBeenCalledWith('roomRepo.getRoom', error, { roomId });
      expect(result).toBeUndefined();
    });

    it('should map room with default values when fields are missing', async () => {
      // Arrange
      const { getRoom } = await import('./roomRepo');
      const roomId = 'minimal-room-id';
      const dbRoom = {
        id: roomId,
        name: '',
        game_type: 'poker',
        status: 'waiting',
        created_by: 'creator-uuid'
        // Missing optional fields
      };
      const players = [];
      
      mockGetById.mockResolvedValue(dbRoom);
      mockListByRoom.mockResolvedValue(players);
      
      // Act
      const result = await getRoom(roomId);
      
      // Assert
      expect(result).toEqual({
        id: roomId,
        isPrivate: false, // default
        maxPlayers: 0, // default
        smallBlind: 0, // default
        createdBy: 'creator-uuid',
        players: [],
        readyPlayers: [],
        status: 'waiting',
        turnTimeoutSec: 240, // default
        lastUpdate: expect.any(Number),
        playerNames: {}
      });
    });
  });

  describe('createRoom', () => {
    it('should create room successfully', async () => {
      // Arrange
      const { createRoom } = await import('./roomRepo');
      const params = {
        id: 'test-room-id',
        isPrivate: false,
        maxPlayers: 4,
        smallBlind: 200,
        turnTimeoutSec: 240,
        createdBy: 'creator123',
        name: 'Test Room'
      };
      
      const creatorUuid = 'creator-uuid';
      const dbRoom = {
        id: 'generated-room-uuid',
        name: 'Test Room',
        game_type: 'poker',
        status: 'waiting',
        created_by: creatorUuid,
        max_players: 4,
        stake_amount: 200,
        settings: { turnTimeoutSec: 240 },
        is_private: false
      };
      
      mockGetByTelegramId.mockResolvedValue(null);
      mockUpsert.mockResolvedValue({ id: creatorUuid });
      mockCreate.mockResolvedValue(dbRoom);
      mockAdd.mockResolvedValue(undefined);
      
      // Act
      const result = await createRoom(params);
      
      // Assert
      expect(mockLogFunctionStart).toHaveBeenCalledWith('roomRepo.createRoom', {
        roomId: params.id,
        createdBy: params.createdBy
      });
      expect(mockUpsert).toHaveBeenCalledWith({ telegram_id: 1379286662 });
      expect(mockCreate).toHaveBeenCalledWith({
        id: undefined, // Not a valid UUID
        name: 'Test Room',
        game_type: 'poker',
        status: 'waiting',
        created_by: creatorUuid,
        max_players: 4,
        stake_amount: 200,
        settings: { turnTimeoutSec: 240 },
        is_private: false
      });
      expect(mockAdd).toHaveBeenCalledWith('generated-room-uuid', creatorUuid, false);
      expect(mockLogFunctionEnd).toHaveBeenCalledWith('roomRepo.createRoom', {
        ok: true,
        roomId: params.id
      });
      
      expect(result).toEqual({
        id: 'generated-room-uuid',
        isPrivate: false,
        maxPlayers: 4,
        smallBlind: 200,
        createdBy: creatorUuid,
        players: [creatorUuid],
        readyPlayers: [],
        status: 'waiting',
        turnTimeoutSec: 240,
        lastUpdate: expect.any(Number),
        playerNames: {}
      });
    });

    it('should use provided UUID when valid', async () => {
      // Arrange
      const { createRoom } = await import('./roomRepo');
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      const params = {
        id: validUuid,
        isPrivate: true,
        maxPlayers: 2,
        smallBlind: 100,
        turnTimeoutSec: 120,
        createdBy: 'creator456',
        name: 'Private Room'
      };
      
      const creatorUuid = 'creator-uuid';
      const dbRoom = {
        id: validUuid,
        name: 'Private Room',
        game_type: 'poker',
        status: 'waiting',
        created_by: creatorUuid,
        max_players: 2,
        stake_amount: 100,
        settings: { turnTimeoutSec: 120 },
        is_private: true
      };
      
      mockGetByTelegramId.mockResolvedValue({ id: creatorUuid });
      mockCreate.mockResolvedValue(dbRoom);
      mockAdd.mockResolvedValue(undefined);
      
      // Act
      const result = await createRoom(params);
      
      // Assert
      expect(mockCreate).toHaveBeenCalledWith({
        id: validUuid, // Use provided UUID
        name: 'Private Room',
        game_type: 'poker',
        status: 'waiting',
        created_by: creatorUuid,
        max_players: 2,
        stake_amount: 100,
        settings: { turnTimeoutSec: 120 },
        is_private: true
      });
    });

    it('should handle room creation failure', async () => {
      // Arrange
      const { createRoom } = await import('./roomRepo');
      const params = {
        id: 'error-room-id',
        isPrivate: false,
        maxPlayers: 4,
        smallBlind: 200,
        turnTimeoutSec: 240,
        createdBy: 'creator789'
      };
      
      const error = new Error('Room creation failed');
      mockGetByTelegramId.mockResolvedValue({ id: 'creator-uuid' });
      mockCreate.mockRejectedValue(error);
      
      // Act & Assert
      await expect(createRoom(params)).rejects.toThrow('Room creation failed');
      expect(mockLogError).toHaveBeenCalledWith('roomRepo.createRoom', error, {
        roomId: params.id
      });
    });

    it('should use default timeout when not provided', async () => {
      // Arrange
      const { createRoom } = await import('./roomRepo');
      const params = {
        id: 'default-timeout-room-id',
        isPrivate: false,
        maxPlayers: 4,
        smallBlind: 200,
        createdBy: 'creator123'
        // turnTimeoutSec not provided
      };
      
      const creatorUuid = 'creator-uuid';
      const dbRoom = {
        id: 'generated-room-uuid',
        name: '',
        game_type: 'poker',
        status: 'waiting',
        created_by: creatorUuid,
        max_players: 4,
        stake_amount: 200,
        settings: { turnTimeoutSec: 240 }, // Default value
        is_private: false
      };
      
      mockGetByTelegramId.mockResolvedValue({ id: creatorUuid });
      mockCreate.mockResolvedValue(dbRoom);
      mockAdd.mockResolvedValue(undefined);
      
      // Act
      const result = await createRoom(params);
      
      // Assert
      expect(mockCreate).toHaveBeenCalledWith({
        id: undefined,
        name: '',
        game_type: 'poker',
        status: 'waiting',
        created_by: creatorUuid,
        max_players: 4,
        stake_amount: 200,
        settings: { turnTimeoutSec: 240 }, // Default value
        is_private: false
      });
    });
  });

  describe('addPlayer', () => {
    it('should add player successfully', async () => {
      // Arrange
      const { addPlayer } = await import('./roomRepo');
      const roomId = 'test-room-id';
      const userId = 'player-uuid';
      const dbRoom = { id: 'room-uuid' };
      
      mockGetById.mockResolvedValue(dbRoom);
      mockAdd.mockResolvedValue(undefined);
      
      // Act
      await addPlayer(roomId, userId);
      
      // Assert
      expect(mockLogFunctionStart).toHaveBeenCalledWith('roomRepo.addPlayer', { roomId, userId });
      expect(mockGetById).toHaveBeenCalledWith(roomId);
      expect(mockAdd).toHaveBeenCalledWith('room-uuid', 'creator-uuid', false);
      expect(mockLogFunctionEnd).toHaveBeenCalledWith('roomRepo.addPlayer', { ok: true, roomId, userId });
    });

    it('should handle room not found', async () => {
      // Arrange
      const { addPlayer } = await import('./roomRepo');
      const roomId = 'not-found-room-id';
      const userId = 'player-uuid';
      
      mockGetById.mockResolvedValue(null);
      
      // Act & Assert
      await expect(addPlayer(roomId, userId)).rejects.toThrow('Room not found');
      expect(mockAdd).not.toHaveBeenCalled();
    });

    it('should handle add player failure', async () => {
      // Arrange
      const { addPlayer } = await import('./roomRepo');
      const roomId = 'error-room-id';
      const userId = 'player-uuid';
      const dbRoom = { id: 'room-uuid' };
      const error = new Error('Player already in room');
      
      mockGetById.mockResolvedValue(dbRoom);
      mockAdd.mockRejectedValue(error);
      
      // Act & Assert
      await expect(addPlayer(roomId, userId)).rejects.toThrow('Player already in room');
      expect(mockLogError).toHaveBeenCalledWith('roomRepo.addPlayer', error, { roomId, userId });
    });
  });

  describe('removePlayer', () => {
    it('should remove player successfully', async () => {
      // Arrange
      const { removePlayer } = await import('./roomRepo');
      const roomId = 'test-room-id';
      const userId = 'player-uuid';
      const dbRoom = { id: 'room-uuid' };
      
      mockGetById.mockResolvedValue(dbRoom);
      mockRemove.mockResolvedValue(undefined);
      
      // Act
      await removePlayer(roomId, userId);
      
      // Assert
      expect(mockLogFunctionStart).toHaveBeenCalledWith('roomRepo.removePlayer', { roomId, userId });
      expect(mockGetById).toHaveBeenCalledWith(roomId);
      expect(mockRemove).toHaveBeenCalledWith('room-uuid', 'creator-uuid');
      expect(mockLogFunctionEnd).toHaveBeenCalledWith('roomRepo.removePlayer', { ok: true, roomId, userId });
    });

    it('should handle room not found', async () => {
      // Arrange
      const { removePlayer } = await import('./roomRepo');
      const roomId = 'not-found-room-id';
      const userId = 'player-uuid';
      
      mockGetById.mockResolvedValue(null);
      
      // Act & Assert
      await expect(removePlayer(roomId, userId)).rejects.toThrow('Room not found');
      expect(mockRemove).not.toHaveBeenCalled();
    });

    it('should handle remove player failure', async () => {
      // Arrange
      const { removePlayer } = await import('./roomRepo');
      const roomId = 'error-room-id';
      const userId = 'player-uuid';
      const dbRoom = { id: 'room-uuid' };
      const error = new Error('Player not in room');
      
      mockGetById.mockResolvedValue(dbRoom);
      mockRemove.mockRejectedValue(error);
      
      // Act & Assert
      await expect(removePlayer(roomId, userId)).rejects.toThrow('Player not in room');
      expect(mockLogError).toHaveBeenCalledWith('roomRepo.removePlayer', error, { roomId, userId });
    });
  });

  describe('setReady', () => {
    it('should set player ready successfully', async () => {
      // Arrange
      const { setReady } = await import('./roomRepo');
      const roomId = 'test-room-id';
      const userId = 'player-uuid';
      const ready = true;
      const dbRoom = { id: 'room-uuid' };
      
      mockGetById.mockResolvedValue(dbRoom);
      mockSetReady.mockResolvedValue(undefined);
      
      // Act
      await setReady(roomId, userId, ready);
      
      // Assert
      expect(mockLogFunctionStart).toHaveBeenCalledWith('roomRepo.setReady', { roomId, userId, ready });
      expect(mockGetById).toHaveBeenCalledWith(roomId);
      expect(mockSetReady).toHaveBeenCalledWith('room-uuid', 'creator-uuid', ready);
      expect(mockLogFunctionEnd).toHaveBeenCalledWith('roomRepo.setReady', { ok: true, roomId, userId, ready });
    });

    it('should set player not ready successfully', async () => {
      // Arrange
      const { setReady } = await import('./roomRepo');
      const roomId = 'test-room-id';
      const userId = 'player-uuid';
      const ready = false;
      const dbRoom = { id: 'room-uuid' };
      
      mockGetById.mockResolvedValue(dbRoom);
      mockSetReady.mockResolvedValue(undefined);
      
      // Act
      await setReady(roomId, userId, ready);
      
      // Assert
      expect(mockSetReady).toHaveBeenCalledWith('room-uuid', 'creator-uuid', false);
    });

    it('should handle room not found', async () => {
      // Arrange
      const { setReady } = await import('./roomRepo');
      const roomId = 'not-found-room-id';
      const userId = 'player-uuid';
      const ready = true;
      
      mockGetById.mockResolvedValue(null);
      
      // Act & Assert
      await expect(setReady(roomId, userId, ready)).rejects.toThrow('Room not found');
      expect(mockSetReady).not.toHaveBeenCalled();
    });

    it('should handle set ready failure', async () => {
      // Arrange
      const { setReady } = await import('./roomRepo');
      const roomId = 'error-room-id';
      const userId = 'player-uuid';
      const ready = true;
      const dbRoom = { id: 'room-uuid' };
      const error = new Error('Player not found');
      
      mockGetById.mockResolvedValue(dbRoom);
      mockSetReady.mockRejectedValue(error);
      
      // Act & Assert
      await expect(setReady(roomId, userId, ready)).rejects.toThrow('Player not found');
      expect(mockLogError).toHaveBeenCalledWith('roomRepo.setReady', error, { roomId, userId, ready });
    });
  });
});
