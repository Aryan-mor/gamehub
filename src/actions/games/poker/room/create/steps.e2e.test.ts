import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRoom } from '@/actions/games/poker/room/services/roomService';
import { setActiveRoomId } from '@/modules/core/userRoomState';
import { createHandlerTestContext } from '@/__tests__/helpers/context';
import { HandlerContext } from '@/modules/core/handler';

// Mock the roomService
vi.mock('@/actions/games/poker/room/services/roomService', () => ({
  createRoom: vi.fn(),
}));

// Mock the userRoomState
vi.mock('@/modules/core/userRoomState', () => ({
  setActiveRoomId: vi.fn(),
}));

// Mock the smart-router
vi.mock('@/modules/core/smart-router', () => ({
  dispatch: vi.fn(),
}));

describe('Poker Room Create Steps E2E', () => {
  let context: HandlerContext;
  let mockCreateRoom: any;
  let mockSetActiveRoomId: any;
  let mockDispatch: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    context = createHandlerTestContext();
    mockCreateRoom = vi.mocked(createRoom);
    mockSetActiveRoomId = vi.mocked(setActiveRoomId);
    mockDispatch = vi.mocked((await import('@/modules/core/smart-router')).dispatch);
  });

  describe('Privacy Selection Step', () => {
    it('should handle private room selection and show player count options', async () => {
      // Arrange
      const { handleCreateFlow } = await import('./steps');
      const query = { s: 'privacy', v: 'true' };
      
      // Act
      await handleCreateFlow(context, query);
      
      // Assert
      expect(context.ctx.formState.set).toHaveBeenCalledWith(
        'poker.room.create',
        context.user.id,
        expect.objectContaining({ isPrivate: true })
      );
      
      expect(context.ctx.replySmart).toHaveBeenCalledWith(
        'poker.form.step2.playerCount',
        expect.objectContaining({
          parse_mode: 'HTML'
        })
      );
    });

    it('should handle public room selection and show player count options', async () => {
      // Arrange
      const { handleCreateFlow } = await import('./steps');
      const query = { s: 'privacy', v: 'false' };
      
      // Act
      await handleCreateFlow(context, query);
      
      // Assert
      expect(context.ctx.formState.set).toHaveBeenCalledWith(
        'poker.room.create',
        context.user.id,
        expect.objectContaining({ isPrivate: false })
      );
    });
  });

  describe('Max Players Selection Step', () => {
    it('should handle max players selection and show small blind options', async () => {
      // Arrange
      const { handleCreateFlow } = await import('./steps');
      const query = { s: 'maxPlayers', v: '4' };
      
      // Act
      await handleCreateFlow(context, query);
      
      // Assert
      expect(context.ctx.formState.set).toHaveBeenCalledWith(
        'poker.room.create',
        context.user.id,
        expect.objectContaining({ maxPlayers: 4 })
      );
      
      expect(context.ctx.replySmart).toHaveBeenCalledWith(
        'poker.form.step3.smallBlind',
        expect.objectContaining({
          parse_mode: 'HTML'
        })
      );
    });
  });

  describe('Small Blind Selection Step', () => {
    it('should handle small blind selection and show timeout options', async () => {
      // Arrange
      const { handleCreateFlow } = await import('./steps');
      const query = { s: 'smallBlind', v: '200' };
      
      // Act
      await handleCreateFlow(context, query);
      
      // Assert
      expect(context.ctx.formState.set).toHaveBeenCalledWith(
        'poker.room.create',
        context.user.id,
        expect.objectContaining({ smallBlind: 200 })
      );
      
      expect(context.ctx.replySmart).toHaveBeenCalledWith(
        'poker.form.step5.turnTimeout',
        expect.objectContaining({
          parse_mode: 'HTML'
        })
      );
    });
  });

  describe('Timeout Selection and Room Creation', () => {
    it.skip('should create room successfully and navigate to room info', async () => {
      // Arrange
      const { handleCreateFlow } = await import('./steps');
      const query = { s: 'timeout', v: '120' };
      mockCreateRoom.mockResolvedValue({ id: 'test-room-id' } as any);
      
      // Act
      await handleCreateFlow(context, query);
      
      // Assert
      expect(mockCreateRoom).toHaveBeenCalled();
      expect(mockSetActiveRoomId).toHaveBeenCalledWith(context.user.id, 'test-room-id');
      expect(mockDispatch).toHaveBeenCalledWith(
        'games.poker.room.info',
        expect.objectContaining({ roomId: 'test-room-id' })
      );
    });

    it.skip('should handle room creation failure gracefully', async () => {
      // Arrange
      const { handleCreateFlow } = await import('./steps');
      const query = { s: 'timeout', v: '120' };
      mockCreateRoom.mockRejectedValue(new Error('Database error'));
      
      // Act & Assert
      await expect(handleCreateFlow(context, query)).rejects.toThrow('Database error');
      expect(mockSetActiveRoomId).not.toHaveBeenCalled();
    });
  });

  describe('Form State Management', () => {
    it('should retrieve existing state from formState', async () => {
      // Arrange
      const { handleCreateFlow } = await import('./steps');
      const existingState = { isPrivate: true, maxPlayers: 4 };
      context.ctx.formState.get.mockResolvedValue(existingState);
      
      // Act
      await handleCreateFlow(context, { s: 'smallBlind', v: '200' });
      
      // Assert
      expect(context.ctx.formState.get).toHaveBeenCalledWith('poker.room.create', context.user.id);
    });

    it('should handle empty state gracefully', async () => {
      // Arrange
      const { handleCreateFlow } = await import('./steps');
      context.ctx.formState.get.mockResolvedValue(null);
      
      // Act
      await handleCreateFlow(context, { s: 'privacy', v: 'true' });
      
      // Assert
      expect(context.ctx.formState.get).toHaveBeenCalledWith('poker.room.create', context.user.id);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing step parameter gracefully', async () => {
      // Arrange
      const { handleCreateFlow } = await import('./steps');
      const query = { v: 'true' };
      
      // Act & Assert
      await expect(handleCreateFlow(context, query)).resolves.not.toThrow();
    });

    it('should handle missing value parameter gracefully', async () => {
      // Arrange
      const { handleCreateFlow } = await import('./steps');
      const query = { s: 'privacy' };
      
      // Act & Assert
      await expect(handleCreateFlow(context, query)).resolves.not.toThrow();
    });

    it('should handle invalid step gracefully', async () => {
      // Arrange
      const { handleCreateFlow } = await import('./steps');
      const query = { s: 'invalid', v: 'true' };
      
      // Act & Assert
      await expect(handleCreateFlow(context, query)).resolves.not.toThrow();
    });
  });
});
