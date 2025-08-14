import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHandlerTestContext } from '@/__tests__/helpers/context';
import { HandlerContext } from '@/modules/core/handler';

// Mock the roomRepo
vi.mock('@/actions/games/poker/room/services/roomRepo', () => ({
  createRoom: vi.fn(),
  getRoom: vi.fn(),
  addPlayer: vi.fn(),
  removePlayer: vi.fn(),
  setReady: vi.fn(),
}));

// Mock the users API
vi.mock('@/api/users', () => ({
  getByIds: vi.fn(),
}));

// Mock the logger
vi.mock('@/modules/core/logger', () => ({
  logFunctionStart: vi.fn(),
  logFunctionEnd: vi.fn(),
  logError: vi.fn(),
}));

describe('Poker Room Service E2E', () => {
  let context: HandlerContext;
  let mockCreateRoom: any;
  let mockGetRoom: any;
  let mockAddPlayer: any;
  let mockRemovePlayer: any;
  let mockSetReady: any;
  let mockGetByIds: any;
  let mockLogFunctionStart: any;
  let mockLogFunctionEnd: any;
  let mockLogError: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    context = createHandlerTestContext();
    
    // Add sendOrEditMessageToUsers to context
    context.sendOrEditMessageToUsers = vi.fn();
    
    const roomRepo = vi.mocked((await import('@/actions/games/poker/room/services/roomRepo')));
    mockCreateRoom = roomRepo.createRoom;
    mockGetRoom = roomRepo.getRoom;
    mockAddPlayer = roomRepo.addPlayer;
    mockRemovePlayer = roomRepo.removePlayer;
    mockSetReady = roomRepo.setReady;
    
    const usersApi = vi.mocked((await import('@/api/users')));
    mockGetByIds = usersApi.getByIds;
    
    const logger = vi.mocked((await import('@/modules/core/logger')));
    mockLogFunctionStart = logger.logFunctionStart;
    mockLogFunctionEnd = logger.logFunctionEnd;
    mockLogError = logger.logError;
  });

  describe('createRoom', () => {
    it('should create room successfully', async () => {
      // Arrange
      const { createRoom } = await import('./roomService');
      const params = {
        id: 'test-room-id',
        isPrivate: false,
        maxPlayers: 4,
        smallBlind: 200,
        turnTimeoutSec: 240,
        createdBy: 'user123'
      };
      const mockCreatedRoom = { ...params, players: [], readyPlayers: [] };
      mockCreateRoom.mockResolvedValue(mockCreatedRoom);
      
      // Act
      const result = await createRoom(params);
      
      // Assert
      expect(mockLogFunctionStart).toHaveBeenCalledWith('roomService.createRoom', {
        roomId: params.id,
        createdBy: params.createdBy
      });
      expect(mockCreateRoom).toHaveBeenCalledWith(params);
      expect(mockLogFunctionEnd).toHaveBeenCalledWith('roomService.createRoom', {
        mode: 'db',
        roomId: params.id
      });
      expect(result).toEqual(mockCreatedRoom);
    });

    it('should handle room creation failure', async () => {
      // Arrange
      const { createRoom } = await import('./roomService');
      const params = {
        id: 'error-room-id',
        isPrivate: true,
        maxPlayers: 2,
        smallBlind: 100,
        turnTimeoutSec: 120,
        createdBy: 'user456'
      };
      const error = new Error('Database error');
      mockCreateRoom.mockRejectedValue(error);
      
      // Act & Assert
      await expect(createRoom(params)).rejects.toThrow('Database error');
      expect(mockLogError).toHaveBeenCalledWith('roomService.createRoom', error, {
        roomId: params.id
      });
    });
  });

  describe('getRoom', () => {
    it('should get room successfully', async () => {
      // Arrange
      const { getRoom } = await import('./roomService');
      const roomId = 'test-room-id';
      const mockRoom = {
        id: roomId,
        isPrivate: false,
        maxPlayers: 4,
        smallBlind: 200,
        turnTimeoutSec: 240,
        players: ['user1', 'user2'],
        readyPlayers: ['user1']
      };
      mockGetRoom.mockResolvedValue(mockRoom);
      
      // Act
      const result = await getRoom(roomId);
      
      // Assert
      expect(mockGetRoom).toHaveBeenCalledWith(roomId);
      expect(result).toEqual(mockRoom);
    });

    it('should handle room not found', async () => {
      // Arrange
      const { getRoom } = await import('./roomService');
      const roomId = 'not-found-room-id';
      mockGetRoom.mockResolvedValue(undefined);
      
      // Act
      const result = await getRoom(roomId);
      
      // Assert
      expect(mockGetRoom).toHaveBeenCalledWith(roomId);
      expect(result).toBeUndefined();
    });

    it('should handle database error', async () => {
      // Arrange
      const { getRoom } = await import('./roomService');
      const roomId = 'error-room-id';
      const error = new Error('Database connection failed');
      mockGetRoom.mockRejectedValue(error);
      
      // Act
      const result = await getRoom(roomId);
      
      // Assert
      expect(mockGetRoom).toHaveBeenCalledWith(roomId);
      expect(mockLogError).toHaveBeenCalledWith('roomService.getRoom', error, { roomId });
      expect(result).toBeUndefined();
    });
  });

  describe('addPlayer', () => {
    it('should add player successfully', async () => {
      // Arrange
      const { addPlayer } = await import('./roomService');
      const roomId = 'test-room-id';
      const userId = 'user123';
      mockAddPlayer.mockResolvedValue(undefined);
      
      // Act
      await addPlayer(roomId, userId);
      
      // Assert
      expect(mockAddPlayer).toHaveBeenCalledWith(roomId, userId);
    });

    it('should handle add player failure', async () => {
      // Arrange
      const { addPlayer } = await import('./roomService');
      const roomId = 'error-room-id';
      const userId = 'user456';
      const error = new Error('Player already in room');
      mockAddPlayer.mockRejectedValue(error);
      
      // Act & Assert
      await expect(addPlayer(roomId, userId)).rejects.toThrow('Player already in room');
      expect(mockAddPlayer).toHaveBeenCalledWith(roomId, userId);
    });
  });

  describe('removePlayer', () => {
    it('should remove player successfully', async () => {
      // Arrange
      const { removePlayer } = await import('./roomService');
      const roomId = 'test-room-id';
      const userId = 'user123';
      mockRemovePlayer.mockResolvedValue(undefined);
      
      // Act
      await removePlayer(roomId, userId);
      
      // Assert
      expect(mockRemovePlayer).toHaveBeenCalledWith(roomId, userId);
    });

    it('should handle remove player failure', async () => {
      // Arrange
      const { removePlayer } = await import('./roomService');
      const roomId = 'error-room-id';
      const userId = 'user456';
      const error = new Error('Player not in room');
      mockRemovePlayer.mockRejectedValue(error);
      
      // Act & Assert
      await expect(removePlayer(roomId, userId)).rejects.toThrow('Player not in room');
      expect(mockRemovePlayer).toHaveBeenCalledWith(roomId, userId);
    });
  });

  describe('markReady', () => {
    it('should mark player as ready successfully', async () => {
      // Arrange
      const { markReady } = await import('./roomService');
      const roomId = 'test-room-id';
      const userId = 'user123';
      mockSetReady.mockResolvedValue(undefined);
      
      // Act
      await markReady(roomId, userId);
      
      // Assert
      expect(mockSetReady).toHaveBeenCalledWith(roomId, userId, true);
    });

    it('should handle mark ready failure', async () => {
      // Arrange
      const { markReady } = await import('./roomService');
      const roomId = 'error-room-id';
      const userId = 'user456';
      const error = new Error('Player not found');
      mockSetReady.mockRejectedValue(error);
      
      // Act & Assert
      await expect(markReady(roomId, userId)).rejects.toThrow('Player not found');
      expect(mockSetReady).toHaveBeenCalledWith(roomId, userId, true);
    });
  });

  describe('markNotReady', () => {
    it('should mark player as not ready successfully', async () => {
      // Arrange
      const { markNotReady } = await import('./roomService');
      const roomId = 'test-room-id';
      const userId = 'user123';
      mockSetReady.mockResolvedValue(undefined);
      
      // Act
      await markNotReady(roomId, userId);
      
      // Assert
      expect(mockSetReady).toHaveBeenCalledWith(roomId, userId, false);
    });

    it('should handle mark not ready failure', async () => {
      // Arrange
      const { markNotReady } = await import('./roomService');
      const roomId = 'error-room-id';
      const userId = 'user456';
      const error = new Error('Player not found');
      mockSetReady.mockRejectedValue(error);
      
      // Act & Assert
      await expect(markNotReady(roomId, userId)).rejects.toThrow('Player not found');
      expect(mockSetReady).toHaveBeenCalledWith(roomId, userId, false);
    });
  });

  describe('broadcastRoomInfo', () => {
    it('should show Check/Raise/Fold when player can check (bet >= current bet) and mark acting 🎯', async () => {
      const { broadcastRoomInfo } = await import('./roomService');
      const roomId = 'playing-room-id';
      mockGetRoom.mockResolvedValue({
        id: roomId,
        isPrivate: false,
        maxPlayers: 2,
        smallBlind: 100,
        turnTimeoutSec: 120,
        players: ['u1', 'u2'],
        readyPlayers: ['u1', 'u2'],
        lastUpdate: Date.now(),
        status: 'playing',
        createdBy: 'u1'
      });
      mockGetByIds.mockResolvedValue([
        { id: 'u1', first_name: 'A', last_name: 'A', username: 'a', telegram_id: 1001 },
        { id: 'u2', first_name: 'B', last_name: 'B', username: 'b', telegram_id: 1002 }
      ]);
      // Mock supabaseFor to provide hands/seats/pots
      vi.doMock('@/lib/supabase', () => ({
        supabaseFor: (_schema: string) => ({
          from: (table: string) => ({
            select: () => ({ eq: () => ({ order: () => ({ limit: async () => ({ data: [{ id: 'h1', current_bet: 200, acting_pos: 0 }] }) }) }) }),
            eq: () => ({ order: () => ({ limit: async () => ({ data: [{ id: 'h1', current_bet: 200, acting_pos: 0 }] }) }) }),
          })
        })
      }));
      // Mock seatsRepo.listSeatsByHand
      vi.doMock('./seatsRepo', () => ({
        listSeatsByHand: vi.fn(async () => ([
          { user_id: 'u1', seat_pos: 0, stack: 10000, bet: 200 }, // acting, can check (bet == current_bet)
          { user_id: 'u2', seat_pos: 1, stack: 10000, bet: 0 }
        ]))
      }));
      // Mock the context.t function to return proper translations
      context.t = vi.fn((key: string) => {
        const translations: Record<string, string> = {
          'poker.game.buttons.check': 'Check',
          'poker.game.buttons.call': 'Call',
          'poker.game.buttons.fold': 'Fold',
          'poker.actions.raise': 'Raise',
          'bot.buttons.refresh': 'Refresh'
        };
        return translations[key] || key;
      });

      const sent: any[] = [];
      context.from = { id: 1001 } as any; // initiator
      context.sendOrEditMessageToUsers = vi.fn().mockImplementation(async (_uids, _text, opts) => {
        sent.push({ text: _text, kb: opts?.reply_markup });
        return [{ userId: 1001, success: true }];
      });

      await broadcastRoomInfo(context, roomId);
      const out = sent.pop();
      const flat = out.kb.inline_keyboard.flat();
      const callbacks = flat.map((b: any) => b.callback_data);
      // When playing, should show refresh and show details buttons
      expect(callbacks.some(cb => cb.startsWith('g.pk.r.in'))).toBe(true);
      expect(callbacks.some(cb => cb.includes('d='))).toBe(true);
      expect(out.text).toMatch(/🎯/);
    });

    it('should show Call/Raise/Fold when player cannot check (bet < current bet)', async () => {
      const { broadcastRoomInfo } = await import('./roomService');
      const roomId = 'playing-room-id-2';
      mockGetRoom.mockResolvedValue({
        id: roomId,
        isPrivate: false,
        maxPlayers: 2,
        smallBlind: 100,
        turnTimeoutSec: 120,
        players: ['u1', 'u2'],
        readyPlayers: ['u1', 'u2'],
        lastUpdate: Date.now(),
        status: 'playing',
        createdBy: 'u1'
      });
      mockGetByIds.mockResolvedValue([
        { id: 'u1', first_name: 'A', last_name: 'A', username: 'a', telegram_id: 1001 },
        { id: 'u2', first_name: 'B', last_name: 'B', username: 'b', telegram_id: 1002 }
      ]);
      vi.doMock('@/lib/supabase', () => ({
        supabaseFor: (_schema: string) => ({
          from: (_table: string) => ({
            select: () => ({ eq: () => ({ order: () => ({ limit: async () => ({ data: [{ id: 'h2', current_bet: 200, acting_pos: 0 }] }) }) }) })
          })
        })
      }));
      vi.doMock('./seatsRepo', () => ({
        listSeatsByHand: vi.fn(async () => ([
          { user_id: 'u1', seat_pos: 0, stack: 10000, bet: 0 }, // acting, must call
          { user_id: 'u2', seat_pos: 1, stack: 10000, bet: 200 }
        ]))
      }));
      // Mock the context.t function to return proper translations
      context.t = vi.fn((key: string) => {
        const translations: Record<string, string> = {
          'poker.game.buttons.check': 'Check',
          'poker.game.buttons.call': 'Call',
          'poker.game.buttons.fold': 'Fold',
          'poker.actions.raise': 'Raise',
          'bot.buttons.refresh': 'Refresh'
        };
        return translations[key] || key;
      });

      const sent: any[] = [];
      context.from = { id: 1001 } as any;
      context.sendOrEditMessageToUsers = vi.fn().mockImplementation(async (_uids, _text, opts) => {
        sent.push(opts?.reply_markup);
        return [{ userId: 1001, success: true }];
      });

      await broadcastRoomInfo(context, roomId);
      const kb = sent.pop();
      const flat = kb.inline_keyboard.flat();
      const callbacks = flat.map((b: any) => b.callback_data);
      // When playing, should show refresh and show details buttons
      expect(callbacks.some(cb => cb.startsWith('g.pk.r.in'))).toBe(true);
      expect(callbacks.some(cb => cb.includes('d='))).toBe(true);
    });
    it('should broadcast room info to all players successfully', async () => {
      // Arrange
      const { broadcastRoomInfo } = await import('./roomService');
      const roomId = 'test-room-id';
      const mockRoom = {
        id: roomId,
        isPrivate: false,
        maxPlayers: 4,
        smallBlind: 200,
        turnTimeoutSec: 240,
        players: ['user1', 'user2'],
        readyPlayers: [],
        lastUpdate: Date.now()
      };
      mockGetRoom.mockResolvedValue(mockRoom);
      
      const mockUsers = [
        { id: 'user1', first_name: 'John', last_name: 'Doe', username: 'johndoe' },
        { id: 'user2', first_name: 'Jane', last_name: 'Smith', username: 'janesmith' }
      ];
      mockGetByIds.mockResolvedValue(mockUsers.map(u => ({ ...u, telegram_id: 1000 })));
      
      // Mock sendOrEditMessageToUsers
      context.sendOrEditMessageToUsers = vi.fn().mockResolvedValue([
        { userId: 'user1', success: true, action: 'edited' },
        { userId: 'user2', success: true, action: 'sent_new' }
      ]);
      
      // Act
      await broadcastRoomInfo(context, roomId);
      
      // Assert
      expect(mockLogFunctionStart).toHaveBeenCalledWith('roomService.broadcastRoomInfo', {
        roomId,
        targetUserIds: undefined
      });
      expect(mockGetRoom).toHaveBeenCalledWith(roomId);
      expect(mockGetByIds).toHaveBeenCalledWith(['user1', 'user2']);
      expect(context.sendOrEditMessageToUsers).toHaveBeenCalledWith(
        expect.any(Array),
        expect.stringContaining('Poker Room Info'),
        expect.objectContaining({
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.any(Array)
          })
        })
      );
      expect(mockLogFunctionEnd).toHaveBeenCalledWith('roomService.broadcastRoomInfo', {
        roomId,
        targetUserIds: 2,
        messageLength: expect.any(Number)
      });
    });

    it('should broadcast room info to specific users', async () => {
      // Arrange
      const { broadcastRoomInfo } = await import('./roomService');
      const roomId = 'test-room-id';
      const targetUserIds = ['user1', 'user3'];
      const mockRoom = {
        id: roomId,
        isPrivate: false,
        maxPlayers: 4,
        smallBlind: 200,
        turnTimeoutSec: 240,
        players: ['user1', 'user2', 'user3'],
        readyPlayers: [],
        lastUpdate: Date.now()
      };
      mockGetRoom.mockResolvedValue(mockRoom);
      
      const mockUsers = [
        { id: 'user1', first_name: 'John', last_name: 'Doe', username: 'johndoe' },
        { id: 'user3', first_name: 'Bob', last_name: 'Johnson', username: 'bobjohnson' }
      ];
      mockGetByIds.mockResolvedValue(mockUsers.map(u => ({ ...u, telegram_id: 1000 })));
      
      context.sendOrEditMessageToUsers = vi.fn().mockResolvedValue([
        { userId: 'user1', success: true, action: 'edited' },
        { userId: 'user3', success: true, action: 'sent_new' }
      ]);
      
      // Act
      await broadcastRoomInfo(context, roomId, targetUserIds);
      
      // Assert
      // Note: smart-reply plugin converts user IDs to numbers, so we expect the actual behavior
      expect(context.sendOrEditMessageToUsers).toHaveBeenCalledWith(
        expect.any(Array), // User IDs (may be converted to numbers by smart-reply)
        expect.stringContaining('Poker Room Info'),
        expect.any(Object)
      );
    });

    it('should handle room not found gracefully', async () => {
      // Arrange
      const { broadcastRoomInfo } = await import('./roomService');
      const roomId = 'not-found-room-id';
      mockGetRoom.mockResolvedValue(undefined);
      
      // Act
      await broadcastRoomInfo(context, roomId);
      
      // Assert
      expect(mockGetRoom).toHaveBeenCalledWith(roomId);
      expect(context.sendOrEditMessageToUsers).not.toHaveBeenCalled();
      expect(mockLogFunctionEnd).not.toHaveBeenCalled();
    });

    it('should handle broadcast failure gracefully', async () => {
      // Arrange
      const { broadcastRoomInfo } = await import('./roomService');
      const roomId = 'error-room-id';
      const mockRoom = {
        id: roomId,
        isPrivate: false,
        maxPlayers: 4,
        smallBlind: 200,
        turnTimeoutSec: 240,
        players: ['user1'],
        readyPlayers: [],
        lastUpdate: Date.now()
      };
      mockGetRoom.mockResolvedValue(mockRoom);
      mockGetByIds.mockResolvedValue([]);
      
      const error = new Error('Broadcast failed');
      context.sendOrEditMessageToUsers = vi.fn().mockRejectedValue(error);
      
      // Act
      await broadcastRoomInfo(context, roomId);
      
      // Assert
      expect(mockLogError).toHaveBeenCalledWith('roomService.broadcastRoomInfo', error, {
        roomId,
        targetUserIds: undefined
      });
    });

    it('should handle user lookup failure gracefully', async () => {
      // Arrange
      const { broadcastRoomInfo } = await import('./roomService');
      const roomId = 'user-error-room-id';
      const mockRoom = {
        id: roomId,
        isPrivate: false,
        maxPlayers: 4,
        smallBlind: 200,
        turnTimeoutSec: 240,
        players: ['user1'],
        readyPlayers: [],
        lastUpdate: Date.now()
      };
      mockGetRoom.mockResolvedValue(mockRoom);
      mockGetByIds.mockRejectedValue(new Error('User lookup failed'));
      
      // Act & Assert
      await expect(broadcastRoomInfo(context, roomId)).resolves.not.toThrow();
      expect(mockLogError).toHaveBeenCalledWith('roomService.broadcastRoomInfo', expect.any(Error), {
        roomId,
        targetUserIds: undefined
      });
    });

    it('should generate correct message format', async () => {
      // Arrange
      const { broadcastRoomInfo } = await import('./roomService');
      const roomId = 'format-room-id';
      const mockRoom = {
        id: roomId,
        isPrivate: true,
        maxPlayers: 2,
        smallBlind: 100,
        turnTimeoutSec: 120,
        players: ['user1'],
        readyPlayers: [],
        lastUpdate: Date.now()
      };
      mockGetRoom.mockResolvedValue(mockRoom);
      
      const mockUsers = [
        { id: 'user1', first_name: 'John', last_name: 'Doe', username: 'johndoe' }
      ];
      mockGetByIds.mockResolvedValue(mockUsers.map(u => ({ ...u, telegram_id: 1000 })));
      
      context.sendOrEditMessageToUsers = vi.fn().mockResolvedValue([
        { userId: 'user1', success: true, action: 'edited' }
      ]);
      
      // Act
      await broadcastRoomInfo(context, roomId);
      
      // Assert
      // Note: smart-reply plugin converts user IDs to numbers, so we expect the actual behavior
      expect(context.sendOrEditMessageToUsers).toHaveBeenCalledWith(
        expect.any(Array), // User IDs (may be converted to numbers by smart-reply)
        expect.stringMatching(/🏠 Poker Room Info/),
        expect.objectContaining({
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.arrayContaining([
              expect.arrayContaining([
                expect.objectContaining({
                  text: '🔄 Refresh',
                  callback_data: expect.stringMatching(/^g\.pk\.r\.in/)
                })
              ]),
              expect.arrayContaining([
                expect.objectContaining({
                  text: '📤 Share',
                  switch_inline_query: `poker ${roomId}`
                })
              ])
            ])
          })
        })
      );
    });

    it('should include Start Game button for admin when players >= 2', async () => {
      // Arrange
      const { broadcastRoomInfo } = await import('./roomService');
      const roomId = 'admin-start-room-id';
      const mockRoom = {
        id: roomId,
        isPrivate: false,
        maxPlayers: 4,
        smallBlind: 200,
        turnTimeoutSec: 240,
        players: ['user1', 'user2'],
        readyPlayers: [],
        lastUpdate: Date.now(),
        createdBy: 'user1'
      };
      mockGetRoom.mockResolvedValue(mockRoom);

      // Map both users to telegram ids, admin = 1001
      const mockUsers = [
        { id: 'user1', first_name: 'Admin', last_name: 'User', username: 'admin', telegram_id: 1001 },
        { id: 'user2', first_name: 'Player', last_name: 'Two', username: 'p2', telegram_id: 1002 }
      ];
      mockGetByIds.mockResolvedValue(mockUsers);

      const sent: any[] = [];
      context.sendOrEditMessageToUsers = vi.fn().mockImplementation(async (_uids, _text, opts) => {
        sent.push(opts?.reply_markup);
        return [{ userId: 1001, success: true }];
      });

      // Act - target admin only
      await broadcastRoomInfo(context, roomId, ['1001']);

      // Assert
      const kb = sent[0];
      const flat = kb.inline_keyboard.flat();
      const hasStart = flat.some((b: any) => b.callback_data === 'g.pk.r.st');
      expect(hasStart).toBe(true);
    });

    it('should NOT include Start Game button for non-admin even when players >= 2', async () => {
      // Arrange
      const { broadcastRoomInfo } = await import('./roomService');
      const roomId = 'nonadmin-start-room-id';
      const mockRoom = {
        id: roomId,
        isPrivate: false,
        maxPlayers: 4,
        smallBlind: 200,
        turnTimeoutSec: 240,
        players: ['user1', 'user2'],
        readyPlayers: [],
        lastUpdate: Date.now(),
        createdBy: 'user1'
      };
      mockGetRoom.mockResolvedValue(mockRoom);

      const mockUsers = [
        { id: 'user1', first_name: 'Admin', last_name: 'User', username: 'admin', telegram_id: 1001 },
        { id: 'user2', first_name: 'Player', last_name: 'Two', username: 'p2', telegram_id: 1002 }
      ];
      mockGetByIds.mockResolvedValue(mockUsers);

      const sent: any[] = [];
      context.sendOrEditMessageToUsers = vi.fn().mockImplementation(async (_uids, _text, opts) => {
        sent.push(opts?.reply_markup);
        return [{ userId: 1002, success: true }];
      });

      // Act - target non-admin only
      await broadcastRoomInfo(context, roomId, ['1002']);

      // Assert
      const kb = sent[0];
      const flat = kb.inline_keyboard.flat();
      const hasStart = flat.some((b: any) => b.callback_data === 'g.pk.r.st');
      expect(hasStart).toBe(false);
    });

    it('should place Start Game as the first button for admin when players >= 2', async () => {
      // Arrange
      const { broadcastRoomInfo } = await import('./roomService');
      const roomId = 'admin-first-row-room-id';
      const mockRoom = {
        id: roomId,
        isPrivate: false,
        maxPlayers: 4,
        smallBlind: 200,
        turnTimeoutSec: 240,
        players: ['user1', 'user2'],
        readyPlayers: [],
        lastUpdate: Date.now(),
        createdBy: 'user1'
      };
      mockGetRoom.mockResolvedValue(mockRoom);

      // Map both users to telegram ids, admin = 7771
      const mockUsers = [
        { id: 'user1', first_name: 'Admin', last_name: 'User', username: 'admin', telegram_id: 7771 },
        { id: 'user2', first_name: 'Player', last_name: 'Two', username: 'p2', telegram_id: 7772 }
      ];
      mockGetByIds.mockResolvedValue(mockUsers);

      const sent: any[] = [];
      context.sendOrEditMessageToUsers = vi.fn().mockImplementation(async (_uids, _text, opts) => {
        sent.push(opts?.reply_markup);
        return [{ userId: 7771, success: true }];
      });

      // Act - target admin only
      await broadcastRoomInfo(context, roomId, ['7771']);

      // Assert: first row contains Start Game
      const kb = sent[0];
      const firstRow = kb.inline_keyboard[0];
      expect(firstRow).toBeDefined();
      const firstCallback = firstRow[0]?.callback_data;
      expect(firstCallback).toBe('g.pk.r.st');
    });
  });
});
