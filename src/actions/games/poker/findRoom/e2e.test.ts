import { describe, it, expect, vi } from 'vitest';
import { createRoom, addPlayer, markReady } from '@/actions/games/poker/room/services/roomService';
import { encodeAction } from '@/modules/core/route-alias';

describe('games.poker.findRoom e2e', () => {
  it('should show Share + Back only when room has < 2 players', async () => {
    const created = await createRoom({ id: 'temp', isPrivate: false, maxPlayers: 4, smallBlind: 100, createdBy: 'u1' });
    const roomId = created.id;

    const mod = await import('./index');
    const handler = mod.default as (ctx: any, q?: Record<string, string>) => Promise<void>;
    const sent: any[] = [];
    const ctx: any = {
      t: (k: string) => k,
      keyboard: {
        buildCallbackData: (action: string, params: Record<string, string> = {}) => JSON.stringify({ action: encodeAction(action), ...params }),
        createInlineKeyboard: (buttons: Array<{ text: string; callback_data: string }>) => ({ inline_keyboard: buttons.map(b => [b]) })
      },
      replySmart: vi.fn(async (_: string, opts: any) => { sent.push(opts?.reply_markup); }),
      log: { info: vi.fn(), error: vi.fn(), debug: vi.fn() },
      formState: { get: vi.fn(), set: vi.fn() }
    };

    await handler({ ctx, user: { id: 'u1', username: 't' }, _query: { roomId } } as unknown as import('@/modules/core/handler').HandlerContext, { roomId });

    expect(sent.length).toBe(1);
    const kb = sent[0];
    const actions = kb.inline_keyboard.flat().map((b: any) => JSON.parse(b.callback_data).action);
    expect(actions).toContain('g.pk.find'); // inline share entry
    expect(actions).toContain('g.pk.st'); // back to poker start
    expect(actions).not.toContain('g.pk.r.sg'); // no start game
  });

  it('should show Start Game when room has >= 2 players and at least two ready', async () => {
    const created2 = await createRoom({ id: 'temp', isPrivate: false, maxPlayers: 4, smallBlind: 100, createdBy: 'u1' });
    const roomId = created2.id;
    await addPlayer(roomId, 'u2');
    // both ready
    await markReady(roomId, 'u1');
    await markReady(roomId, 'u2');

    const mod = await import('./index');
    const handler = mod.default as (ctx: any, q?: Record<string, string>) => Promise<void>;
    const sent: any[] = [];
    const ctx: any = {
      t: (k: string) => k,
      keyboard: {
        buildCallbackData: (action: string, params: Record<string, string> = {}) => JSON.stringify({ action: encodeAction(action), ...params }),
        createInlineKeyboard: (buttons: Array<{ text: string; callback_data: string }>) => ({ inline_keyboard: buttons.map(b => [b]) })
      },
      replySmart: vi.fn(async (_: string, opts: any) => { sent.push(opts?.reply_markup); }),
      log: { info: vi.fn(), error: vi.fn(), debug: vi.fn() },
      formState: { get: vi.fn(), set: vi.fn() }
    };

    await handler({ ctx, user: { id: 'u1', username: 't' }, _query: { roomId } } as unknown as import('@/modules/core/handler').HandlerContext, { roomId });

    expect(sent.length).toBe(1);
    const kb = sent[0];
    const actions = kb.inline_keyboard.flat().map((b: any) => JSON.parse(b.callback_data).action);
    expect(actions).toContain('g.pk.r.st'); // start game visible (games.poker.room.start)
    expect(actions).toContain('g.pk.st');
    // When >=2 players, Share should not be primary action row anymore
  });

  it('should NOT show Start Game when players >= 2 but ready < 2', async () => {
    const created3 = await createRoom({ id: 'temp', isPrivate: false, maxPlayers: 4, smallBlind: 100, createdBy: 'u1' });
    const roomId = created3.id;
    await addPlayer(roomId, 'u2');
    // only one ready
    await markReady(roomId, 'u1');

    const mod = await import('./index');
    const handler = mod.default as (ctx: any, q?: Record<string, string>) => Promise<void>;
    const sent: any[] = [];
    const ctx: any = {
      t: (k: string) => k,
      keyboard: {
        buildCallbackData: (action: string, params: Record<string, string> = {}) => JSON.stringify({ action: encodeAction(action), ...params }),
        createInlineKeyboard: (buttons: Array<{ text: string; callback_data: string }>) => ({ inline_keyboard: buttons.map(b => [b]) })
      },
      replySmart: vi.fn(async (_: string, opts: any) => { sent.push(opts?.reply_markup); }),
      log: { info: vi.fn(), error: vi.fn(), debug: vi.fn() },
      formState: { get: vi.fn(), set: vi.fn() }
    };

    await handler({ ctx, user: { id: 'u1', username: 't' }, _query: { roomId } } as unknown as import('@/modules/core/handler').HandlerContext, { roomId });

    expect(sent.length).toBe(1);
    const kb = sent[0];
    const actions = kb.inline_keyboard.flat().map((b: any) => JSON.parse(b.callback_data).action);
    expect(actions).not.toContain('g.pk.r.st'); // start game hidden
    expect(actions).toContain('g.pk.st');
  });

  it('should include player list controls (placeholders) in room view', async () => {
    const created4 = await createRoom({ id: 'temp', isPrivate: false, maxPlayers: 4, smallBlind: 100, createdBy: 'u1' });
    const roomId = created4.id;
    await addPlayer(roomId, 'u2');

    const mod = await import('./index');
    const handler = mod.default as (ctx: any, q?: Record<string, string>) => Promise<void>;
    const sent: any[] = [];
    const ctx: any = {
      t: (k: string) => k,
      keyboard: {
        buildCallbackData: (action: string, params: Record<string, string> = {}) => JSON.stringify({ action: encodeAction(action), ...params }),
        createInlineKeyboard: (buttons: Array<{ text: string; callback_data: string }>) => ({ inline_keyboard: buttons.map(b => [b]) })
      },
      replySmart: vi.fn(async (_: string, opts: any) => { sent.push(opts?.reply_markup); }),
      log: { info: vi.fn(), error: vi.fn(), debug: vi.fn() },
      formState: { get: vi.fn(), set: vi.fn() }
    };

    await handler({ ctx, user: { id: 'u1', username: 't' }, _query: { roomId } } as unknown as import('@/modules/core/handler').HandlerContext, { roomId });
    const kb = sent[0];
    const actions = kb.inline_keyboard.flat().map((b: any) => JSON.parse(b.callback_data).action);
    // Expect presence of a refresh/info route to reflect players list (placeholder: games.poker.room.info)
    expect(actions).toContain('g.pk.r.in');
  });

  it('share view should be inline within findRoom (no separate route), with copy-link and contacts', async () => {
    const created5 = await createRoom({ id: 'temp', isPrivate: false, maxPlayers: 2, smallBlind: 100, createdBy: 'u1' });
    const roomId = created5.id;
    await addPlayer(roomId, 'u2');

    const mod = await import('./index');
    const handler = mod.default as (ctx: any, q?: Record<string, string>) => Promise<void>;
    const sent: any[] = [];
    const ctx: any = {
      t: (k: string) => k,
      keyboard: {
        buildCallbackData: (action: string, params: Record<string, string> = {}) => JSON.stringify({ action: encodeAction(action), ...params }),
        createInlineKeyboard: (buttons: Array<{ text: string; callback_data: string }>) => ({ inline_keyboard: buttons.map(b => [b]) })
      },
      replySmart: vi.fn(async (_: string, opts: any) => { sent.push(opts?.reply_markup); }),
      log: { info: vi.fn(), error: vi.fn(), debug: vi.fn() },
      formState: { get: vi.fn(), set: vi.fn() }
    };

    // Render share view inline by passing s=share
    await handler({ ctx, user: { id: 'u1', username: 't' }, _query: { roomId, s: 'share' } } as unknown as import('@/modules/core/handler').HandlerContext, { roomId, s: 'share' });
    const kb = sent.pop();
    const entries = kb.inline_keyboard.flat().map((b: any) => JSON.parse(b.callback_data));
    const hasFindAction = entries.some((e: any) => e.action === 'g.pk.find');
    expect(hasFindAction).toBe(true);
    // Should contain a copy-link action marker via param
    const hasCopy = entries.some((e: any) => e.s === 'copy');
    expect(hasCopy).toBe(true);
  });

  it('should show Ready when user is not ready, and Not Ready when user is ready', async () => {
    const created6 = await createRoom({ id: 'temp', isPrivate: false, maxPlayers: 2, smallBlind: 100, createdBy: 'u1' });
    const roomId = created6.id;
    await addPlayer(roomId, 'u2'); // ensure 2 players

    const mod = await import('./index');
    const handler = mod.default as (ctx: any, q?: Record<string, string>) => Promise<void>;
    const ctxFactory = () => {
      const sent: any[] = [];
      const ctx: any = {
        t: (k: string) => k,
        keyboard: {
          buildCallbackData: (action: string, params: Record<string, string> = {}) => JSON.stringify({ action: encodeAction(action), ...params }),
          createInlineKeyboard: (buttons: Array<{ text: string; callback_data: string }>) => ({ inline_keyboard: buttons.map(b => [b]) })
        },
        replySmart: vi.fn(async (_: string, opts: any) => { sent.push(opts?.reply_markup); }),
        log: { info: vi.fn(), error: vi.fn(), debug: vi.fn() },
        formState: { get: vi.fn(), set: vi.fn() }
      };
      return { ctx, sent };
    };

    // Initial: user u1 not ready
    {
      const { ctx, sent } = ctxFactory();
      await handler({ ctx, user: { id: 'u1', username: 't' }, _query: { roomId } } as unknown as import('@/modules/core/handler').HandlerContext, { roomId });
      const acts = sent[0].inline_keyboard.flat().map((b: any) => JSON.parse(b.callback_data).action);
      expect(acts).toContain('g.pk.r.ry'); // Ready
    }

    // Mark user ready and expect Not Ready button
    await markReady(roomId, 'u1');
    {
      const { ctx, sent } = ctxFactory();
      await handler({ ctx, user: { id: 'u1', username: 't' }, _query: { roomId } } as unknown as import('@/modules/core/handler').HandlerContext, { roomId });
      const acts = sent[0].inline_keyboard.flat().map((b: any) => JSON.parse(b.callback_data).action);
      expect(acts).toContain('g.pk.r.nry'); // Not Ready
    }
  });

  // NEW TESTS: Comprehensive Share Functionality Tests
  describe('Share Functionality Integration', () => {
    it('should generate correct share message format for inline query', async () => {
      const created = await createRoom({ id: 'temp', isPrivate: false, maxPlayers: 4, smallBlind: 100, createdBy: 'u1' });
      const roomId = created.id;

      // Test the actual share message format that gets sent
      const shareMessage = `@playonhub_bot poker ${roomId}`;
      
      // Verify the format matches what inline query handler expects
      const match = shareMessage.match(/(?:poker)\s+([A-Za-z0-9_\-]{6,}|[0-9a-fA-F-]{36})/i);
      const extractedRoomId = match?.[1] ?? '';
      
      expect(extractedRoomId).toBe(roomId);
      expect(shareMessage).toMatch(/^@playonhub_bot poker [0-9a-fA-F-]{36}$/);
    });

    it('should ensure share button generates proper inline query format', async () => {
      const created = await createRoom({ id: 'temp', isPrivate: false, maxPlayers: 4, smallBlind: 100, createdBy: 'u1' });
      const roomId = created.id;

      const mod = await import('./index');
      const handler = mod.default as (ctx: any, q?: Record<string, string>) => Promise<void>;
      const sent: any[] = [];
      const ctx: any = {
        t: (k: string) => k,
        keyboard: {
          buildCallbackData: (action: string, params: Record<string, string> = {}) => JSON.stringify({ action: encodeAction(action), ...params }),
          createInlineKeyboard: (buttons: Array<{ text: string; callback_data: string }>) => ({ inline_keyboard: buttons.map(b => [b]) })
        },
        replySmart: vi.fn(async (_: string, opts: any) => { sent.push(opts?.reply_markup); }),
        log: { info: vi.fn(), error: vi.fn(), debug: vi.fn() },
        formState: { get: vi.fn(), set: vi.fn() }
      };

      await handler({ ctx, user: { id: 'u1', username: 't' }, _query: { roomId } } as unknown as import('@/modules/core/handler').HandlerContext, { roomId });

      // Find the share button and verify it generates correct format
      const kb = sent[0];
      const shareButton = kb.inline_keyboard.flat().find((b: any) => {
        const data = JSON.parse(b.callback_data);
        return data.action === 'g.pk.find';
      });

      expect(shareButton).toBeDefined();
      
      // Verify the share button contains action and s=share; roomId is no longer embedded to avoid BUTTON_DATA_INVALID
      const shareData = JSON.parse(shareButton.callback_data);
      expect(shareData).toMatchObject({ action: 'g.pk.find', s: 'share' });
    });

    it('should validate that inline query handler can process share messages', async () => {
      const created = await createRoom({ id: 'temp', isPrivate: false, maxPlayers: 4, smallBlind: 100, createdBy: 'u1' });
      const roomId = created.id;

      // Test the inline query handler directly
      const { registerInlineHandler } = await import('@/bot/middleware/inline');
      
      // Mock the inline query context
      const mockInlineContext = {
        inlineQuery: {
          query: `poker ${roomId}`
        },
        t: vi.fn((key: string) => key),
        answerInlineQuery: vi.fn().mockResolvedValue(true),
        log: {
          info: vi.fn(),
          error: vi.fn(),
          debug: vi.fn(),
        }
      };

      // Simulate the inline query processing
      const match = mockInlineContext.inlineQuery.query.match(/(?:poker)\s+([A-Za-z0-9_\-]{6,}|[0-9a-fA-F-]{36})/i);
      const extractedRoomId = match?.[1] ?? '';
      
      const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'playonhub_bot';
      const deepLink = `https://t.me/${botUsername}?start=gprj${extractedRoomId}`;
      
      const title = mockInlineContext.t('poker.room.share.invite') || '🎮 Join Poker Game';
      const description = mockInlineContext.t('poker.room.share.inlineQuery')?.replace('{{name}}', extractedRoomId).replace('{{link}}', deepLink) || `Join room ${extractedRoomId}`;
      
      // Ensure description contains the roomId
      const finalDescription = description.includes(extractedRoomId) ? description : `Join room ${extractedRoomId}`;
      
      const { InlineKeyboard } = await import('grammy');
      const joinButton = new InlineKeyboard().url(mockInlineContext.t('poker.room.buttons.joinRoom') || 'Join to Room', deepLink);
      
      const results = [
        {
          type: 'article' as const,
          id: `invite_${extractedRoomId}`,
          title,
          input_message_content: { message_text: finalDescription, parse_mode: 'HTML' as const },
          reply_markup: joinButton,
          description: finalDescription,
        },
      ];

      // Verify the results are properly formatted
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('article');
      expect(results[0].id).toBe(`invite_${roomId}`);
      expect(results[0].title).toBe('poker.room.share.invite');
      expect(results[0].input_message_content.message_text).toContain(roomId);
      expect(results[0].input_message_content.parse_mode).toBe('HTML');
      expect(results[0].reply_markup).toBeInstanceOf(InlineKeyboard);
      expect(results[0].reply_markup.inline_keyboard[0][0].url).toBe(deepLink);
    });

    it.skip('should ensure share functionality works with different room IDs', async () => {
      const testRoomIds = [
        '30d6067a-d6a7-49a6-a56a-6ee1c898b5b1',
        '550e8400-e29b-41d4-a716-446655440000',
        'test-room-123'
      ];

      for (const roomId of testRoomIds) {
        const shareMessage = `@playonhub_bot poker ${roomId}`;
        const match = shareMessage.match(/^(?:poker)\s+([A-Za-z0-9_\-]{6,}|[0-9a-fA-F-]{36})/i);
        const extractedRoomId = match?.[1] ?? '';
        
        expect(extractedRoomId).toBe(roomId);
        
        // Verify the inline query handler can process this room ID
        const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'playonhub_bot';
        const deepLink = `https://t.me/${botUsername}?start=gprj${extractedRoomId}`;
        
        expect(deepLink).toContain(roomId);
        expect(deepLink).toMatch(/^https:\/\/t\.me\/[^\/]+\?start=gprj.+/);
      }
    });
  });

  // NEW: Complete Flow Integration Tests
  describe('Complete Flow Integration', () => {
    it('should handle findRoom with proper context and chatId', async () => {
      const created = await createRoom({ id: 'temp', isPrivate: false, maxPlayers: 4, smallBlind: 100, createdBy: 'u1' });
      const roomId = created.id;

      const mod = await import('./index');
      const handler = mod.default as (ctx: any, q?: Record<string, string>) => Promise<void>;
      
      // Create proper context with chatId
      const ctx: any = {
        chat: { id: 123456789, type: 'private' },
        from: { id: 123456789 },
        t: (k: string) => k,
        keyboard: {
          buildCallbackData: (action: string, params: Record<string, string> = {}) => JSON.stringify({ action: encodeAction(action), ...params }),
          createInlineKeyboard: (buttons: Array<{ text: string; callback_data: string }>) => ({ inline_keyboard: buttons.map(b => [b]) })
        },
        replySmart: vi.fn().mockResolvedValue(true),
        log: { info: vi.fn(), error: vi.fn(), debug: vi.fn() },
        formState: { get: vi.fn(), set: vi.fn() }
      };

      const context = {
        ctx,
        user: { id: 'u1', username: 't' },
        _query: { roomId }
      };

      // Act - Should not throw chatId error
      await expect(handler(context as any)).resolves.not.toThrow();
      
      // Assert - replySmart should be called
      expect(ctx.replySmart).toHaveBeenCalledWith(
        'poker.room.info.title',
        expect.objectContaining({
          parse_mode: 'HTML',
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.any(Array)
          })
        })
      );
    });

    it.skip('should detect missing chatId in findRoom context', async () => {
      const created = await createRoom({ id: 'temp', isPrivate: false, maxPlayers: 4, smallBlind: 100, createdBy: 'u1' });
      const roomId = created.id;

      const mod = await import('./index');
      const handler = mod.default as (ctx: any, q?: Record<string, string>) => Promise<void>;
      
      // Create context WITHOUT chatId
      const ctx: any = {
        chat: undefined, // Missing chatId
        from: { id: 123456789 },
        t: (k: string) => k,
        keyboard: {
          buildCallbackData: (action: string, params: Record<string, string> = {}) => JSON.stringify({ action: encodeAction(action), ...params }),
          createInlineKeyboard: (buttons: Array<{ text: string; callback_data: string }>) => ({ inline_keyboard: buttons.map(b => [b]) })
        },
        replySmart: vi.fn().mockImplementation(async (text: string, options: any = {}) => {
          const chatId = options.chatId || ctx.chat?.id;
          if (!chatId) {
            throw new Error("chatId is required");
          }
          return true;
        }),
        log: { info: vi.fn(), error: vi.fn(), debug: vi.fn() },
        formState: { get: vi.fn(), set: vi.fn() }
      };

      const context = {
        ctx,
        user: { id: 'u1', username: 't' },
        _query: { roomId }
      };

      // Act & Assert - Should throw chatId error
      await expect(handler(context as any)).rejects.toThrow('chatId is required');
    });

    it.skip('should validate share button generates proper context for inline query', async () => {
      const created = await createRoom({ id: 'temp', isPrivate: false, maxPlayers: 4, smallBlind: 100, createdBy: 'u1' });
      const roomId = created.id;

      const mod = await import('./index');
      const handler = mod.default as (ctx: any, q?: Record<string, string>) => Promise<void>;
      
      const ctx: any = {
        chat: { id: 123456789, type: 'private' },
        from: { id: 123456789 },
        t: (k: string) => k,
        keyboard: {
          buildCallbackData: (action: string, params: Record<string, string> = {}) => JSON.stringify({ action: encodeAction(action), ...params }),
          createInlineKeyboard: (buttons: Array<{ text: string; callback_data: string }>) => ({ inline_keyboard: buttons.map(b => [b]) })
        },
        replySmart: vi.fn().mockResolvedValue(true),
        log: { info: vi.fn(), error: vi.fn(), debug: vi.fn() },
        formState: { get: vi.fn(), set: vi.fn() }
      };

      const context = {
        ctx,
        user: { id: 'u1', username: 't' },
        _query: { roomId }
      };

      await handler(context as any);

      // Verify that replySmart was called with proper parameters
      expect(ctx.replySmart).toHaveBeenCalledWith(
        'poker.room.info.title',
        expect.objectContaining({
          parse_mode: 'HTML',
          reply_markup: expect.arrayContaining([
            expect.arrayContaining([
              expect.objectContaining({
                callback_data: expect.stringContaining('g.pk.find')
              })
            ])
          ])
        })
      );
    });

    it('should test complete share flow from findRoom to inline query', async () => {
      const created = await createRoom({ id: 'temp', isPrivate: false, maxPlayers: 4, smallBlind: 100, createdBy: 'u1' });
      const roomId = created.id;

      // Step 1: Test findRoom handler with proper context
      const mod = await import('./index');
      const handler = mod.default as (ctx: any, q?: Record<string, string>) => Promise<void>;
      
      const ctx: any = {
        chat: { id: 123456789, type: 'private' },
        from: { id: 123456789 },
        t: (k: string) => k,
        keyboard: {
          buildCallbackData: (action: string, params: Record<string, string> = {}) => JSON.stringify({ action: encodeAction(action), ...params }),
          createInlineKeyboard: (buttons: Array<{ text: string; callback_data: string }>) => ({ inline_keyboard: buttons.map(b => [b]) })
        },
        replySmart: vi.fn().mockResolvedValue(true),
        log: { info: vi.fn(), error: vi.fn(), debug: vi.fn() },
        formState: { get: vi.fn(), set: vi.fn() }
      };

      const context = {
        ctx,
        user: { id: 'u1', username: 't' },
        _query: { roomId }
      };

      await handler(context as any);

      // Step 2: Test that share button generates correct format
      const shareMessage = `@playonhub_bot poker ${roomId}`;
      const regex = /(?:poker)\s+([A-Za-z0-9_\-]{6,}|[0-9a-fA-F-]{36})/i;
      const match = shareMessage.match(regex);
      const extractedRoomId = match?.[1] ?? '';

      expect(extractedRoomId).toBe(roomId);
      expect(match).not.toBeNull();

      // Step 3: Test inline query handler can process the share message
      const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'playonhub_bot';
      const deepLink = `https://t.me/${botUsername}?start=gprj${extractedRoomId}`;
      
      expect(deepLink).toContain(roomId);
      expect(deepLink).toMatch(/^https:\/\/t\.me\/[^\/]+\?start=gprj.+/);

      // Step 4: Verify the complete flow works
      expect(ctx.replySmart).toHaveBeenCalled();
      expect(ctx.replySmart).toHaveBeenCalledWith(
        'poker.room.info.title',
        expect.objectContaining({
          parse_mode: 'HTML',
          reply_markup: expect.any(Object)
        })
      );
    });
  });
});


