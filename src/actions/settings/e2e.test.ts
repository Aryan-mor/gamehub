import { describe, it } from 'vitest';
import { runHandlerAndGetActions, expectActionsToContainRoute, expectActionsUnder64Bytes } from '@/__tests__/helpers/context';
import { ROUTES } from '@/modules/core/routes.generated';
import type { BaseHandler } from '@/modules/core/handler';

describe('settings e2e', () => {
  it('should include Language and Back to Menu actions', async () => {
    const mod: { default: BaseHandler } = await import('./index');
    const { actions } = await runHandlerAndGetActions(mod.default);

    // Language menu route
    expectActionsToContainRoute(actions, ROUTES.settings.language._self);
    // Back to start
    expectActionsToContainRoute(actions, ROUTES.start);

    expectActionsUnder64Bytes(actions);
  });
});


