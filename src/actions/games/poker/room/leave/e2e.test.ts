import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRoom, removePlayer, broadcastRoomInfo } from '@/actions/games/poker/room/services/roomService';
import { ensureUserUuid } from '@/actions/games/poker/room/services/roomRepo';
import { getActiveRoomId } from '@/modules/core/userRoomState';
import { createHandlerTestContext } from '@/__tests__/helpers/context';
import { HandlerContext } from '@/modules/core/handler';
import { ROUTES } from '@/modules/core/routes.generated';

// Mock the roomService
vi.mock('@/actions/games/poker/room/services/roomService', () => ({
  getRoom: vi.fn(),
  removePlayer: vi.fn(),
  broadcastRoomInfo: vi.fn(),
}));

// Mock the roomRepo
vi.mock('@/actions/games/poker/room/services/roomRepo', () => ({
  ensureUserUuid: vi.fn(),
}));

// Mock the userRoomState
vi.mock('@/modules/core/userRoomState', () => ({
  getActiveRoomId: vi.fn(),
}));

// Mock the smart-router
vi.mock('@/modules/core/smart-router', () => ({
  dispatch: vi.fn(),
}));

describe('Poker Room Leave E2E', () => {
  let context: HandlerContext;
  let mockGetRoom: any;
  let mockRemovePlayer: any;
  let mockBroadcastRoomInfo: any;
  let mockEnsureUserUuid: any;
  let mockGetActiveRoomId: any;
  let mockDispatch: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    context = createHandlerTestContext();
    mockGetRoom = vi.mocked(getRoom);
    mockRemovePlayer = vi.mocked(removePlayer);
    mockBroadcastRoomInfo = vi.mocked(broadcastRoomInfo);
    mockEnsureUserUuid = vi.mocked(ensureUserUuid);
    mockGetActiveRoomId = vi.mocked(getActiveRoomId);
    mockDispatch = vi.mocked((await import('@/modules/core/smart-router')).dispatch);
  });

  describe('Room ID Resolution', () => {
    it('should resolve roomId from query parameter', async () => {
      // Arrange
      const { default: handleLeave } = await import('./index');
      const roomId = 'test-room-id';
      const userUuid = 'user-uuid-123';
      
      context._query = { roomId, c: '1' } as any;
      const mockRoom = { 
        id: roomId, 
        players: [userUuid], 
        readyPlayers: [] 
      };
      
      mockGetRoom.mockResolvedValue(mockRoom);
      mockEnsureUserUuid.mockResolvedValue(userUuid);
      mockRemovePlayer.mockResolvedValue(undefined);
      
      // Act
      await handleLeave(context);
      
      // Assert
      expect(mockGetRoom).toHaveBeenCalledWith(roomId);
      expect(mockEnsureUserUuid).toHaveBeenCalledWith(context.user.id.toString());
      expect(mockRemovePlayer).toHaveBeenCalledWith(roomId, context.user.id.toString());
      expect(mockDispatch).toHaveBeenCalledWith(ROUTES.games.start, context);
    });

    it('should resolve roomId from active room state when not in query', async () => {
      // Arrange
      const { default: handleLeave } = await import('./index');
      const roomId = 'active-room-id';
      const userUuid = 'user-uuid-123';
      
      context._query = { c: '1' } as any;
      mockGetActiveRoomId.mockReturnValue(roomId);
      const mockRoom = { 
        id: roomId, 
        players: [userUuid], 
        readyPlayers: [] 
      };
      
      mockGetRoom.mockResolvedValue(mockRoom);
      mockEnsureUserUuid.mockResolvedValue(userUuid);
      mockRemovePlayer.mockResolvedValue(undefined);
      
      // Act
      await handleLeave(context);
      
      // Assert
      expect(mockGetActiveRoomId).toHaveBeenCalledWith(context.user.id.toString());
      expect(mockGetRoom).toHaveBeenCalledWith(roomId);
      expect(mockRemovePlayer).toHaveBeenCalledWith(roomId, context.user.id.toString());
      expect(mockDispatch).toHaveBeenCalledWith(ROUTES.games.start, context);
    });

    it('should resolve roomId from form state as fallback', async () => {
      // Arrange
      const { default: handleLeave } = await import('./index');
      const roomId = 'form-room-id';
      const userUuid = 'user-uuid-123';
      
      context._query = { c: '1' } as any;
      mockGetActiveRoomId.mockReturnValue(null);
      context.ctx.formState.get = vi.fn().mockReturnValue({ roomId });
      
      const mockRoom = { 
        id: roomId, 
        players: [userUuid], 
        readyPlayers: [] 
      };
      
      mockGetRoom.mockResolvedValue(mockRoom);
      mockEnsureUserUuid.mockResolvedValue(userUuid);
      mockRemovePlayer.mockResolvedValue(undefined);
      
      // Act
      await handleLeave(context);
      
      // Assert
      expect(context.ctx.formState.get).toHaveBeenCalledWith('poker.info', context.user.id);
      expect(mockGetRoom).toHaveBeenCalledWith(roomId);
      expect(mockRemovePlayer).toHaveBeenCalledWith(roomId, context.user.id.toString());
      expect(mockDispatch).toHaveBeenCalledWith(ROUTES.games.start, context);
    });
  });

  describe('Leave Room Functionality', () => {
    it('should successfully leave room and redirect to games.start', async () => {
      // Arrange
      const { default: handleLeave } = await import('./index');
      const roomId = 'test-room-id';
      const userUuid = 'user-uuid-123';
      
      context._query = { roomId, c: '1' } as any;
      const mockRoom = { 
        id: roomId, 
        players: [userUuid], 
        readyPlayers: [] 
      };
      const updatedRoom = { 
        id: roomId, 
        players: [], 
        readyPlayers: [] 
      };
      
      mockGetRoom
        .mockResolvedValueOnce(mockRoom) // Initial room check
        .mockResolvedValueOnce(updatedRoom); // After removal
      mockEnsureUserUuid.mockResolvedValue(userUuid);
      mockRemovePlayer.mockResolvedValue(undefined);
      mockBroadcastRoomInfo.mockResolvedValue(undefined);
      
      // Act
      await handleLeave(context);
      
      // Assert
      expect(mockGetRoom).toHaveBeenCalledTimes(2);
      expect(mockEnsureUserUuid).toHaveBeenCalledWith(context.user.id.toString());
      expect(mockRemovePlayer).toHaveBeenCalledWith(roomId, context.user.id.toString());
      expect(mockDispatch).toHaveBeenCalledWith(ROUTES.games.start, context);
    });

    it('should broadcast room info to remaining players after user leaves', async () => {
      // Arrange
      const { default: handleLeave } = await import('./index');
      const roomId = 'test-room-id';
      const userUuid = 'user-uuid-123';
      const otherUserUuid = 'other-user-uuid';
      
      context._query = { roomId, c: '1' } as any;
      const mockRoom = { 
        id: roomId, 
        players: [userUuid, otherUserUuid], 
        readyPlayers: [] 
      };
      const updatedRoom = { 
        id: roomId, 
        players: [otherUserUuid], 
        readyPlayers: [] 
      };
      
      mockGetRoom
        .mockResolvedValueOnce(mockRoom) // Initial room check
        .mockResolvedValueOnce(updatedRoom); // After removal
      mockEnsureUserUuid.mockResolvedValue(userUuid);
      mockRemovePlayer.mockResolvedValue(undefined);
      mockBroadcastRoomInfo.mockResolvedValue(undefined);
      
      // Act
      await handleLeave(context);
      
      // Assert
      expect(mockBroadcastRoomInfo).toHaveBeenCalledWith(context.ctx, roomId);
      expect(mockDispatch).toHaveBeenCalledWith(ROUTES.games.start, context);
    });

    it('should not broadcast room info if no players remain', async () => {
      // Arrange
      const { default: handleLeave } = await import('./index');
      const roomId = 'test-room-id';
      const userUuid = 'user-uuid-123';
      
      context._query = { roomId, c: '1' } as any;
      const mockRoom = { 
        id: roomId, 
        players: [userUuid], 
        readyPlayers: [] 
      };
      const updatedRoom = { 
        id: roomId, 
        players: [], 
        readyPlayers: [] 
      };
      
      mockGetRoom
        .mockResolvedValueOnce(mockRoom) // Initial room check
        .mockResolvedValueOnce(updatedRoom); // After removal
      mockEnsureUserUuid.mockResolvedValue(userUuid);
      mockRemovePlayer.mockResolvedValue(undefined);
      
      // Act
      await handleLeave(context);
      
      // Assert
      expect(mockBroadcastRoomInfo).not.toHaveBeenCalled();
      expect(mockDispatch).toHaveBeenCalledWith(ROUTES.games.start, context);
    });

    it('should not broadcast room info if room no longer exists', async () => {
      // Arrange
      const { default: handleLeave } = await import('./index');
      const roomId = 'test-room-id';
      const userUuid = 'user-uuid-123';
      
      context._query = { roomId, c: '1' } as any;
      const mockRoom = { 
        id: roomId, 
        players: [userUuid], 
        readyPlayers: [] 
      };
      
      mockGetRoom
        .mockResolvedValueOnce(mockRoom) // Initial room check
        .mockResolvedValueOnce(null); // Room deleted after removal
      mockEnsureUserUuid.mockResolvedValue(userUuid);
      mockRemovePlayer.mockResolvedValue(undefined);
      
      // Act
      await handleLeave(context);
      
      // Assert
      expect(mockBroadcastRoomInfo).not.toHaveBeenCalled();
      expect(mockDispatch).toHaveBeenCalledWith(ROUTES.games.start, context);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing room ID', async () => {
      // Arrange
      const { default: handleLeave } = await import('./index');
      context._query = {};
      mockGetActiveRoomId.mockReturnValue(null);
      context.ctx.formState.get = vi.fn().mockReturnValue({});
      
      // Act
      await handleLeave(context);
      
      // Assert
      expect(context.ctx.replySmart).toHaveBeenCalledWith(
        'bot.error.generic'
      );
    });

    it('should handle room not found', async () => {
      // Arrange
      const { default: handleLeave } = await import('./index');
      const roomId = 'non-existent-room';
      
      context._query = { roomId, c: '1' } as any;
      mockGetRoom.mockResolvedValue(null);
      
      // Act
      await handleLeave(context);
      
      // Assert
      expect(context.ctx.replySmart).toHaveBeenCalledWith(
        'poker.room.leave.error',
        expect.objectContaining({
          parse_mode: 'HTML',
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.arrayContaining([
              expect.arrayContaining([
                 expect.objectContaining({
                   text: 'poker.room.buttons.back',
                  callback_data: expect.stringContaining('games.start')
                })
              ])
            ])
          })
        })
      );
    });

    it('should handle user not in room', async () => {
      // Arrange
      const { default: handleLeave } = await import('./index');
      const roomId = 'test-room-id';
      const userUuid = 'user-uuid-123';
      const otherUserUuid = 'other-user-uuid';
      
      context._query = { roomId, c: '1' } as any;
      const mockRoom = { 
        id: roomId, 
        players: [otherUserUuid], // User not in room
        readyPlayers: [] 
      };
      
      mockGetRoom.mockResolvedValue(mockRoom);
      mockEnsureUserUuid.mockResolvedValue(userUuid);
      
      // Act
      await handleLeave(context);
      
      // Assert
      expect(context.ctx.replySmart).toHaveBeenCalledWith(
        'poker.room.leave.error',
        expect.objectContaining({
          parse_mode: 'HTML',
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.arrayContaining([
              expect.arrayContaining([
                 expect.objectContaining({
                   text: 'poker.room.buttons.back',
                  callback_data: expect.stringContaining('games.start')
                })
              ])
            ])
          })
        })
      );
    });

    it('should handle removePlayer failure', async () => {
      // Arrange
      const { default: handleLeave } = await import('./index');
      const roomId = 'test-room-id';
      const userUuid = 'user-uuid-123';
      
      context._query = { roomId, c: '1' } as any;
      const mockRoom = { 
        id: roomId, 
        players: [userUuid], 
        readyPlayers: [] 
      };
      
      mockGetRoom.mockResolvedValue(mockRoom);
      mockEnsureUserUuid.mockResolvedValue(userUuid);
      mockRemovePlayer.mockRejectedValue(new Error('Database error'));
      
      // Act
      await handleLeave(context);
      
      // Assert
      expect(context.ctx.replySmart).toHaveBeenCalledWith(
        'poker.room.leave.error',
        expect.objectContaining({
          parse_mode: 'HTML',
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.arrayContaining([
              expect.arrayContaining([
                 expect.objectContaining({
                   text: 'poker.room.buttons.back',
                  callback_data: expect.stringContaining('games.start')
                })
              ])
            ])
          })
        })
      );
    });

    it('should handle invalid user ID', async () => {
      // Arrange
      const { default: handleLeave } = await import('./index');
      const roomId = 'test-room-id';
      
      context._query = { roomId, c: '1' } as any;
      context.user.id = null as any; // Invalid user ID
      
      // Act
      await handleLeave(context);
      
      // Assert
      expect(context.ctx.replySmart).toHaveBeenCalledWith(
        'bot.error.generic'
      );
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete leave flow with all steps', async () => {
      // Arrange
      const { default: handleLeave } = await import('./index');
      const roomId = 'integration-room-id';
      const userUuid = 'user-uuid-123';
      const otherUserUuid = 'other-user-uuid';
      
      context._query = { roomId, c: '1' } as any;
      const initialRoom = { 
        id: roomId, 
        players: [userUuid, otherUserUuid], 
        readyPlayers: [userUuid] 
      };
      const updatedRoom = { 
        id: roomId, 
        players: [otherUserUuid], 
        readyPlayers: [] 
      };
      
      mockGetRoom
        .mockResolvedValueOnce(initialRoom)
        .mockResolvedValueOnce(updatedRoom);
      mockEnsureUserUuid.mockResolvedValue(userUuid);
      mockRemovePlayer.mockResolvedValue(undefined);
      mockBroadcastRoomInfo.mockResolvedValue(undefined);
      
      // Act
      await handleLeave(context);
      
      // Assert - Verify the complete flow
      expect(mockGetRoom).toHaveBeenCalledWith(roomId);
      expect(mockEnsureUserUuid).toHaveBeenCalledWith(context.user.id.toString());
      expect(mockRemovePlayer).toHaveBeenCalledWith(roomId, context.user.id.toString());
      expect(mockBroadcastRoomInfo).toHaveBeenCalledWith(context.ctx, roomId);
      expect(mockDispatch).toHaveBeenCalledWith(ROUTES.games.start, context);
      
      // Verify no success message was sent
      expect(context.ctx.replySmart).not.toHaveBeenCalled();
    });
  });

  describe('Confirmation Step', () => {
    it('should show confirmation UI before leaving when not confirmed', async () => {
      // Arrange
      const { default: handleLeave } = await import('./index');
      const roomId = 'confirm-room-id';
      const userUuid = 'user-uuid-123';

      context._query = { roomId };
      const mockRoom = {
        id: roomId,
        players: [userUuid],
        readyPlayers: []
      };

      mockGetRoom.mockResolvedValue(mockRoom);
      mockEnsureUserUuid.mockResolvedValue(userUuid);
      mockRemovePlayer.mockResolvedValue(undefined);

      // Act
      await handleLeave(context);

      // Assert: should NOT remove yet; should show confirm keyboard
      expect(mockRemovePlayer).not.toHaveBeenCalled();
      expect(context.ctx.replySmart).toHaveBeenCalled();
      const call = (context.ctx.replySmart as any).mock.calls.pop();
      const options = call?.[1];
      const kb = options?.reply_markup?.inline_keyboard ?? [];
      const callbacks = kb.flat().map((b: any) => b.callback_data as string);
      const hasYes = callbacks.some((c: string) => c.startsWith('g.pk.r.lv') && c.includes('c=1'));
      const hasBack = callbacks.some((c: string) => c === 'g.pk.r.in');
      expect(hasYes).toBe(true);
      expect(hasBack).toBe(true);
    });

    it('should proceed to leave when confirmed (c=1)', async () => {
      // Arrange
      const { default: handleLeave } = await import('./index');
      const roomId = 'confirmed-room-id';
      const userUuid = 'user-uuid-123';

      context._query = { roomId, c: '1' } as any;
      const mockRoom = {
        id: roomId,
        players: [userUuid],
        readyPlayers: []
      };

      mockGetRoom.mockResolvedValue(mockRoom);
      mockEnsureUserUuid.mockResolvedValue(userUuid);
      mockRemovePlayer.mockResolvedValue(undefined);

      // Act
      await handleLeave(context);

      // Assert: should remove and dispatch
      expect(mockRemovePlayer).toHaveBeenCalledWith(roomId, context.user.id.toString());
      expect(mockDispatch).toHaveBeenCalledWith(ROUTES.games.start, context);
    });
  });
});
