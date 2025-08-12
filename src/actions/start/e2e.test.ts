import { describe, it, expect, vi } from 'vitest';
import { runHandlerAndGetActions, expectActionsToContainRoute, expectActionsUnder64Bytes } from '@/__tests__/helpers/context';
import { ROUTES } from '@/modules/core/routes.generated';
import type { BaseHandler } from '@/modules/core/handler';

// Mock userService to avoid external dependencies during handler execution
vi.mock('@/modules/core/userService', () => ({
  setUserProfile: vi.fn(async () => {}),
  getUser: vi.fn(async () => ({ 
    id: '123', 
    coins: 0, 
    createdAt: Date.now(), 
    updatedAt: Date.now(),
    username: 'test',
    name: 'test'
  })),
  addCoins: vi.fn(async () => {}),
}));

describe('start inline buttons', () => {
  it('should encode callbacks under 64 bytes (via handler output)', async () => {
    const mod: { default: BaseHandler } = await import('./index');
    const { actions } = await runHandlerAndGetActions(mod.default);
    expectActionsUnder64Bytes(actions);
  });

  it('should produce keyboard with Poker and Help actions', async () => {
    const mod: { default: BaseHandler } = await import('./index');
    // Ensure preferred language is set so main menu is shown (not language prompt)
    const { setPreferredLanguageInCache } = await import('@/modules/global/language');
    setPreferredLanguageInCache('123', 'en');
    const { actions } = await runHandlerAndGetActions(mod.default);
    expectActionsToContainRoute(actions, ROUTES.games.poker.start);
    expectActionsToContainRoute(actions, ROUTES.help);
  });
});


