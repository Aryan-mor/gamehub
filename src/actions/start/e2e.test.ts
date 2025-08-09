import { describe, it, expect, vi } from 'vitest';
import { encodeAction } from '../../modules/core/route-alias';
import { createHandlerTestContext, TestInlineKeyboard, extractActionsFromMarkup, expectActionsToContainRoute } from '@/__tests__/helpers/context';
import { ROUTES } from '@/modules/core/routes.generated';
import type { BaseHandler } from '@/modules/core/handler';
import type { SmartReplyOptions } from '@/types';

// Mock userService to avoid external dependencies during handler execution
vi.mock('@/modules/core/userService', () => ({
  setUserProfile: vi.fn(async () => {}),
  getUser: vi.fn(async () => ({ coins: 0, lastFreeCoinAt: null })),
  addCoins: vi.fn(async () => {}),
}));

describe('start inline buttons', () => {
  it('should encode callbacks under 64 bytes', () => {
    const actions = [
      'games.poker.start',
      'help',
    ];
    const payloads = actions.map(a => JSON.stringify({ action: encodeAction(a) }));
    for (const p of payloads) {
      expect(Buffer.byteLength(p, 'utf8')).toBeLessThan(64);
    }
  });

  it('should produce keyboard with compact actions via handler', async () => {
    const handlerModule: { default: BaseHandler } = await import('./index');
    const handleStart = handlerModule.default;

    const sent: any[] = [];
    const context = createHandlerTestContext({
      keyboard: {
        buildCallbackData: (action: string) => JSON.stringify({ action: encodeAction(action) }),
        createInlineKeyboard: (buttons: Array<{ text: string; callback_data: string }>) => ({ inline_keyboard: buttons.map(b => [b]) })
      },
    });
    context.ctx.replySmart = async (_: string, opts?: SmartReplyOptions) => { sent.push(opts?.reply_markup as TestInlineKeyboard); };

    await handleStart(context, {});

    expect(sent.length).toBe(1);
    const kb = (sent[0] ?? { inline_keyboard: [] }) as TestInlineKeyboard;
    expect(kb).toBeDefined();
    const actions = extractActionsFromMarkup(kb);
    expectActionsToContainRoute(actions, ROUTES.games.poker.start);
    expectActionsToContainRoute(actions, 'help');
  });
});


