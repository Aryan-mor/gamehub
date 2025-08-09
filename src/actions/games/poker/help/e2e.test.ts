import { describe, it, expect } from 'vitest';
import type { BaseHandler } from '@/modules/core/handler';
import { runHandlerAndGetActions, expectActionsToContainRoute, expectActionsUnder64Bytes } from '@/__tests__/helpers/context';
import { ROUTES } from '@/modules/core/routes.generated';

describe('games.poker.help e2e', () => {
  it('should show poker help with Back to games.poker.start', async () => {
    const mod: { default: BaseHandler } = await import('./index');
    const { actions } = await runHandlerAndGetActions(mod.default);
    expect(actions.length).toBe(1);
    expectActionsToContainRoute(actions, ROUTES.games.poker.start);
    expectActionsUnder64Bytes(actions);
  });
});


