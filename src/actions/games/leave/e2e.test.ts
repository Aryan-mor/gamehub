import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { BaseHandler } from '@/modules/core/handler';
import { createHandlerTestContext } from '@/__tests__/helpers/context';
import { ROUTES } from '@/modules/core/routes.generated';

// Mock userRoomState to observe clearActiveRoomId
vi.mock('@/modules/core/userRoomState', () => ({
  clearActiveRoomId: vi.fn(),
}));

describe('games.leave.active e2e', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should clear active room and show Back to Menu button', async () => {
    const mod: { default: BaseHandler } = await import('./active');
    const { clearActiveRoomId } = await import('@/modules/core/userRoomState');

    const context = createHandlerTestContext();

    await mod.default(context);

    // Assert active room is cleared for the current user
    expect(clearActiveRoomId).toHaveBeenCalledWith(context.user.id);

    // Assert replySmart was called with expected text and keyboard
    expect(context.ctx.replySmart).toHaveBeenCalled();
    const [text, opts] = (context.ctx.replySmart as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(text).toBe('poker.leave.done');

    const keyboard = opts?.reply_markup?.inline_keyboard;
    expect(Array.isArray(keyboard)).toBe(true);
    const firstBtn = keyboard[0][0];
    expect(firstBtn.text).toBe('poker.room.buttons.backToMenu');

    // Verify callback_data contains the correct action route
    const payload = JSON.parse(firstBtn.callback_data);
    expect(payload.action).toBe(ROUTES.games.poker.start);
  });

  it('should not throw on execution', async () => {
    const mod: { default: BaseHandler } = await import('./active');
    const context = createHandlerTestContext();
    await expect(mod.default(context)).resolves.not.toThrow();
  });
});


