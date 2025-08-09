import { vi, expect } from 'vitest';
import type { GameHubContext } from '@/plugins';
import type { HandlerContext, BaseHandler } from '@/modules/core/handler';
import type { SmartReplyOptions } from '@/types';
import { encodeAction } from '@/modules/core/route-alias';
import type { ActionRoute } from '@/modules/core/routes.generated';

export interface TestKeyboard {
  buildCallbackData: (action: string, params?: Record<string, string>) => string;
  createInlineKeyboard: (buttons: Array<{ text: string; callback_data: string }>) => { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> };
  createCustomKeyboard?: (layout: string[][], templates: Record<string, { text: string; callback_data: string }>) => { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> };
}

export type TestInlineKeyboard = { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> };

export function extractActionsFromMarkup(markup: TestInlineKeyboard): string[] {
  return markup.inline_keyboard.flat().map((b) => {
    try {
      return JSON.parse(b.callback_data).action as string;
    } catch {
      return b.callback_data;
    }
  });
}

export function createTestGameHubContext(overrides?: Partial<GameHubContext & { keyboard: TestKeyboard }>): GameHubContext {
  const base: Partial<GameHubContext & { keyboard: TestKeyboard }> = {
    t: (k: string) => k,
    log: { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() },
    replySmart: vi.fn(async () => {}),
    keyboard: {
      generateButton: vi.fn(),
      generateButtons: vi.fn(),
      createInlineKeyboard: (buttons: Array<{ text: string; callback_data: string }>) => ({ inline_keyboard: buttons.map((b) => [b]) }),
      createCustomKeyboard: vi.fn(),
      buildCallbackData: (_action: string, _params: Record<string, string> = {}) => JSON.stringify({ action: _action, ..._params }),
      parseCallbackData: vi.fn(),
    } as unknown as GameHubContext['keyboard'],
    formState: {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      has: vi.fn(),
      clearNamespace: vi.fn(),
    },
  };
  const merged = { ...base, ...overrides } as unknown as GameHubContext;
  return merged;
}

export function createHandlerTestContext(overrides?: Partial<GameHubContext & { keyboard: TestKeyboard }>): HandlerContext {
  const ctx = createTestGameHubContext(overrides);
  return {
    ctx,
    user: { id: '123' as unknown as string, username: 'test' },
  } as unknown as HandlerContext;
}

/**
 * Build a full-featured test keyboard that encodes actions by default
 */
export function buildTestKeyboard(): GameHubContext['keyboard'] {
  return {
    generateButton: vi.fn(),
    generateButtons: vi.fn(),
    createInlineKeyboard: (buttons: Array<{ text: string; callback_data: string }>) => ({ inline_keyboard: buttons.map((b) => [b]) }),
    createCustomKeyboard: vi.fn(),
    buildCallbackData: (action: string, params: Record<string, string> = {}) => JSON.stringify({ action: encodeAction(action), ...params }),
    parseCallbackData: vi.fn(),
  } as unknown as GameHubContext['keyboard'];
}

export function createCapturedContext(overrides?: Partial<GameHubContext & { keyboard: TestKeyboard }>): { context: HandlerContext; sent: TestInlineKeyboard[] } {
  const sent: TestInlineKeyboard[] = [];
  const context = createHandlerTestContext({
    keyboard: buildTestKeyboard(),
    ...overrides,
  });
  context.ctx.replySmart = async (_: string, opts?: SmartReplyOptions) => {
    sent.push((opts?.reply_markup ?? { inline_keyboard: [] }) as TestInlineKeyboard);
  };
  return { context, sent };
}

export async function runHandlerAndGetActions(handler: BaseHandler, query: Record<string, string> = {}, overrides?: Partial<GameHubContext & { keyboard: TestKeyboard }>): Promise<{ actions: string[]; sent: TestInlineKeyboard[] }>{
  const { context, sent } = createCapturedContext(overrides);
  await handler(context, query);
  const first = sent[0] ?? { inline_keyboard: [] };
  return { actions: extractActionsFromMarkup(first), sent };
}

/**
 * Assertion helpers for route-based expectations
 */
export function expectActionsToContainRoute(actions: string[], route: ActionRoute | string): void {
  expect(actions).toContain(encodeAction(route as string));
}

export function expectActionsNotToContainRoute(actions: string[], route: ActionRoute | string): void {
  expect(actions).not.toContain(encodeAction(route as string));
}


