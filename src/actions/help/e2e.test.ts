import { describe, it, expect } from 'vitest';
import { encodeAction } from '@/modules/core/route-alias';
import { runHandlerAndGetActions, expectActionsToContainRoute } from '@/__tests__/helpers/context';
import type { BaseHandler } from '@/modules/core/handler';
import type { SmartReplyOptions } from '@/types';

describe('help action e2e', () => {
  it('should show a general bot help with only a Back button to start', async () => {
    const mod: { default: BaseHandler } = await import('./index');
    const { actions } = await runHandlerAndGetActions(mod.default);
    expect(actions.length).toBe(1);
    expectActionsToContainRoute(actions, 'start');
  });
});


