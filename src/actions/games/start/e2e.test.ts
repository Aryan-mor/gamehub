import { describe, it, expect } from 'vitest';
import { runHandlerAndGetActions, expectActionsToContainRoute } from '@/__tests__/helpers/context';
import { ROUTES } from '@/modules/core/routes.generated';
import type { BaseHandler } from '@/modules/core/handler';

describe('games.start e2e', () => {
  it('should show Poker and Back buttons', async () => {
    const mod: { default: BaseHandler } = await import('./index');
    const { actions } = await runHandlerAndGetActions(mod.default);
    expectActionsToContainRoute(actions, ROUTES.games.poker.start);
    expectActionsToContainRoute(actions, ROUTES.start);
  });
});


