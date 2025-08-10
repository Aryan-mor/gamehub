import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRoom } from '@/actions/games/poker/room/services/roomService';
import { encodeAction } from '@/modules/core/route-alias';
import { createHandlerTestContext } from '@/__tests__/helpers/context';
import { HandlerContext } from '@/modules/core/handler';

// Mock the roomService
vi.mock('@/actions/games/poker/room/services/roomService', () => ({
  createRoom: vi.fn(),
}));

// Mock the steps module
vi.mock('./steps', () => ({
  default: vi.fn(),
}));

describe('Poker Room Create E2E', () => {
  let context: HandlerContext;
  let mockCreateRoom: any;
  let mockHandleCreateFlow: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    context = createHandlerTestContext();
    mockCreateRoom = vi.mocked(createRoom);
    mockHandleCreateFlow = vi.mocked((await import('./steps')).default);
  });

  describe('Initial Room Type Selection', () => {
    it('should show room type selection with public and private options', async () => {
      // Arrange
      const { default: handleCreate } = await import('./index');
      
      // Act
      await handleCreate(context);
      
      // Assert
      expect(context.ctx.replySmart).toHaveBeenCalledWith(
        'poker.form.step1.roomType',
        expect.objectContaining({
          parse_mode: 'HTML'
        })
      );
    });

    it('should handle privacy selection and call create flow', async () => {
      // Arrange
      const { default: handleCreate } = await import('./index');
      context._query = { s: 'privacy', v: 'true' };
      
      // Act
      await handleCreate(context);
      
      // Assert
      expect(mockHandleCreateFlow).toHaveBeenCalledWith(context, { s: 'privacy', v: 'true' });
    });

    it('should handle public selection and call create flow', async () => {
      // Arrange
      const { default: handleCreate } = await import('./index');
      context._query = { s: 'privacy', v: 'false' };
      
      // Act
      await handleCreate(context);
      
      // Assert
      expect(mockHandleCreateFlow).toHaveBeenCalledWith(context, { s: 'privacy', v: 'false' });
    });

    it('should handle other step parameters and call create flow', async () => {
      // Arrange
      const { default: handleCreate } = await import('./index');
      context._query = { s: 'players', v: '4' };
      
      // Act
      await handleCreate(context);
      
      // Assert
      expect(mockHandleCreateFlow).toHaveBeenCalledWith(context, { s: 'players', v: '4' });
    });
  });



  describe('Error Handling', () => {
    it('should handle missing query gracefully', async () => {
      // Arrange
      const { default: handleCreate } = await import('./index');
      context._query = undefined;
      
      // Act & Assert
      await expect(handleCreate(context)).resolves.not.toThrow();
    });

    it('should handle empty query gracefully', async () => {
      // Arrange
      const { default: handleCreate } = await import('./index');
      context._query = {};
      
      // Act & Assert
      await expect(handleCreate(context)).resolves.not.toThrow();
    });
  });
});


