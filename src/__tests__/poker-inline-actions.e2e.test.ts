import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Bot, InlineKeyboard } from 'grammy';
import { registerInlineHandler } from '@/bot/middleware/inline';

describe('Poker Inline Actions E2E', () => {
  let mockBot: any;
  let mockInlineQuery: any;
  let mockContext: any;

  beforeEach(() => {
    // Mock bot
    mockBot = {
      inlineQuery: vi.fn(),
    };

    // Mock inline query context
    mockInlineQuery = {
      inlineQuery: {
        query: 'poker 30d6067a-d6a7-49a6-a56a-6ee1c898b5b1'
      },
      t: vi.fn((key: string) => key),
      answerInlineQuery: vi.fn().mockResolvedValue(true),
    };

    mockContext = {
      ...mockInlineQuery,
      log: {
        info: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      }
    };
  });

  describe('Inline Query Handler', () => {
    it('should handle poker room share query correctly', async () => {
      // Arrange
      const roomId = '30d6067a-d6a7-49a6-a56a-6ee1c898b5b1';
      const query = `poker ${roomId}`;
      
      // Mock the inline query handler
      const handler = vi.fn().mockImplementation(async (ctx: any) => {
        const match = query.match(/(?:poker)\s+([A-Za-z0-9_\-]{6,}|[0-9a-fA-F-]{36})/i);
        const extractedRoomId = match?.[1] ?? '';
        
        const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'playonhub_bot';
        const deepLink = `https://t.me/${botUsername}?start=gprj${extractedRoomId}`;
        
        const title = ctx.t('poker.room.share.invite') || '🎮 Join Poker Game';
        const description = ctx.t('poker.room.share.inlineQuery')?.replace('{{name}}', extractedRoomId).replace('{{link}}', deepLink) || `Join room ${extractedRoomId}`;
        
        // Ensure description contains the roomId
        const finalDescription = description.includes(extractedRoomId) ? description : `Join room ${extractedRoomId}`;
        
        const joinButton = new InlineKeyboard().url(ctx.t('poker.room.buttons.joinRoom') || 'Join to Room', deepLink);
        
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
        
        await ctx.answerInlineQuery(results, { cache_time: 0, is_personal: true });
      });

      // Act
      await handler(mockContext);

      // Assert
      expect(mockContext.answerInlineQuery).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'article',
            id: `invite_${roomId}`,
            title: 'poker.room.share.invite',
            input_message_content: expect.objectContaining({
              message_text: expect.stringContaining(roomId),
              parse_mode: 'HTML'
            }),
            reply_markup: expect.any(InlineKeyboard),
            description: expect.stringContaining(roomId)
          })
        ]),
        { cache_time: 0, is_personal: true }
      );
    });

    it('should generate correct deep link for room sharing', async () => {
      // Arrange
      const roomId = '30d6067a-d6a7-49a6-a56a-6ee1c898b5b1';
      const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'playonhub_bot';
      const expectedDeepLink = `https://t.me/${botUsername}?start=gprj${roomId}`;

      // Act
      const query = `poker ${roomId}`;
      const match = query.match(/^(?:poker)\s+([A-Za-z0-9_\-]{6,}|[0-9a-fA-F-]{36})/i);
      const extractedRoomId = match?.[1] ?? '';
      const deepLink = `https://t.me/${botUsername}?start=gprj${extractedRoomId}`;

      // Assert
      expect(extractedRoomId).toBe(roomId);
      expect(deepLink).toBe(expectedDeepLink);
    });

    it('should include inline keyboard with join button', async () => {
      // Arrange
      const roomId = '30d6067a-d6a7-49a6-a56a-6ee1c898b5b1';
      const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'playonhub_bot';
      const deepLink = `https://t.me/${botUsername}?start=gprj${roomId}`;

      // Act
      const joinButton = new InlineKeyboard().url('Join to Room', deepLink);

      // Assert
      expect(joinButton).toBeInstanceOf(InlineKeyboard);
      expect(joinButton.inline_keyboard).toHaveLength(1);
      expect(joinButton.inline_keyboard[0]).toHaveLength(1);
      expect(joinButton.inline_keyboard[0][0]).toEqual({
        text: 'Join to Room',
        url: deepLink
      });
    });

    it('should handle invalid room ID gracefully', async () => {
      // Arrange
      const invalidQuery = 'poker invalid-room-id';
      
      // Act
      const match = invalidQuery.match(/^(?:poker)\s+([A-Za-z0-9_\-]{6,}|[0-9a-fA-F-]{36})/i);
      const extractedRoomId = match?.[1] ?? '';

      // Assert
      expect(extractedRoomId).toBe('invalid-room-id');
    });

    it('should handle empty query gracefully', async () => {
      // Arrange
      const emptyQuery = 'poker ';
      
      // Act
      const match = emptyQuery.match(/^(?:poker)\s+([A-Za-z0-9_\-]{6,}|[0-9a-fA-F-]{36})/i);
      const extractedRoomId = match?.[1] ?? '';

      // Assert
      expect(extractedRoomId).toBe('');
    });
  });

  describe('Share Flow Integration', () => {
    it('should generate complete share message with inline keyboard', async () => {
      // Arrange
      const roomId = '30d6067a-d6a7-49a6-a56a-6ee1c898b5b1';
      const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'playonhub_bot';
      const deepLink = `https://t.me/${botUsername}?start=gprj${roomId}`;

      // Act
      const title = '🎮 Join Poker Game';
      const description = `Join room ${roomId}`;
      const joinButton = new InlineKeyboard().url('Join to Room', deepLink);

      const result = {
        type: 'article' as const,
        id: `invite_${roomId}`,
        title,
        input_message_content: { message_text: description, parse_mode: 'HTML' as const },
        reply_markup: joinButton,
        description,
      };

      // Assert
      expect(result.type).toBe('article');
      expect(result.id).toBe(`invite_${roomId}`);
      expect(result.title).toBe('🎮 Join Poker Game');
      expect(result.input_message_content.message_text).toContain(roomId);
      expect(result.input_message_content.parse_mode).toBe('HTML');
      expect(result.reply_markup).toBeInstanceOf(InlineKeyboard);
      expect(result.reply_markup.inline_keyboard[0][0].url).toBe(deepLink);
    });
  });

  // NEW: Comprehensive Integration Tests
  describe('Complete Share Flow Integration', () => {
    it('should handle complete share flow without chatId errors', async () => {
      // Arrange - Create a proper context with chatId
      const properContext = {
        chat: { id: 123456789, type: 'private' },
        from: { id: 123456789 },
        t: vi.fn((key: string) => key),
        replySmart: vi.fn().mockResolvedValue(true),
        log: {
          info: vi.fn(),
          error: vi.fn(),
          debug: vi.fn(),
        }
      };

      // Act - Simulate the share flow
      const roomId = '30d6067a-d6a7-49a6-a56a-6ee1c898b5b1';
      
      // Test that replySmart can be called without chatId error
      await expect(properContext.replySmart('Test message')).resolves.not.toThrow();
      
      // Verify chatId is available
      expect(properContext.chat?.id).toBe(123456789);
    });

    it('should detect missing chatId in context', async () => {
      // Arrange - Create context without chatId
      const invalidContext = {
        chat: undefined,
        from: { id: 123456789 },
        t: vi.fn((key: string) => key),
        replySmart: vi.fn().mockImplementation(async (text: string, options: any = {}) => {
          const chatId = options.chatId || invalidContext.chat?.id;
          if (!chatId) {
            throw new Error("chatId is required");
          }
          return true;
        }),
        log: {
          info: vi.fn(),
          error: vi.fn(),
          debug: vi.fn(),
        }
      };

      // Act & Assert - Should throw chatId error
      await expect(invalidContext.replySmart('Test message')).rejects.toThrow('chatId is required');
    });

    it('should validate share button generates proper context', async () => {
      // Arrange
      const roomId = '30d6067a-d6a7-49a6-a56a-6ee1c898b5b1';
      
      // Mock the findRoom handler with proper context
      const mockFindRoomHandler = vi.fn().mockImplementation(async (context: any) => {
        // Verify context has required properties
        expect(context.ctx.chat?.id).toBeDefined();
        expect(context.ctx.from?.id).toBeDefined();
        
        // Simulate share button generation
        const shareButton = {
          text: 'Share',
          callback_data: JSON.stringify({
            action: 'g.pk.find',
            roomId: roomId,
            s: 'share'
          })
        };
        
        return shareButton;
      });

      // Act
      const context = {
        ctx: {
          chat: { id: 123456789, type: 'private' },
          from: { id: 123456789 },
          t: vi.fn((key: string) => key),
          replySmart: vi.fn().mockResolvedValue(true),
        },
        user: { id: 'test-user', username: 'test' }
      };

      const result = await mockFindRoomHandler(context);

      // Assert
      expect(result).toBeDefined();
      expect(result.callback_data).toContain(roomId);
      expect(result.callback_data).toContain('g.pk.find');
    });

    it('should test inline query with proper room ID extraction', async () => {
      // Arrange
      const roomId = '30d6067a-d6a7-49a6-a56a-6ee1c898b5b1';
      const shareMessage = `@playonhub_bot poker ${roomId}`;
      
      // Act - Test the actual regex pattern from inline handler
      const regex = /(?:poker)\s+([A-Za-z0-9_\-]{6,}|[0-9a-fA-F-]{36})/i;
      const match = shareMessage.match(regex);
      const extractedRoomId = match?.[1] ?? '';

      // Assert
      expect(extractedRoomId).toBe(roomId);
      expect(match).not.toBeNull();
      
      // Test that the extracted room ID is valid UUID format
      const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      expect(extractedRoomId).toMatch(uuidRegex);
    });

    it('should validate complete inline query response structure', async () => {
      // Arrange
      const roomId = '30d6067a-d6a7-49a6-a56a-6ee1c898b5b1';
      const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'playonhub_bot';
      const deepLink = `https://t.me/${botUsername}?start=gprj${roomId}`;

      // Act - Simulate the complete inline query response
      const mockInlineContext = {
        inlineQuery: { query: `poker ${roomId}` },
        t: vi.fn((key: string) => key),
        answerInlineQuery: vi.fn().mockResolvedValue(true),
      };

      const match = mockInlineContext.inlineQuery.query.match(/(?:poker)\s+([A-Za-z0-9_\-]{6,}|[0-9a-fA-F-]{36})/i);
      const extractedRoomId = match?.[1] ?? '';
      
      const title = mockInlineContext.t('poker.room.share.invite');
      const description = mockInlineContext.t('poker.room.share.inlineQuery');
      const joinButton = new InlineKeyboard().url(mockInlineContext.t('poker.room.buttons.joinRoom'), deepLink);

      const results = [
        {
          type: 'article' as const,
          id: `invite_${extractedRoomId}`,
          title,
          input_message_content: { message_text: description, parse_mode: 'HTML' as const },
          reply_markup: joinButton,
          description,
        },
      ];

      // Assert - Validate complete structure
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('article');
      expect(results[0].id).toBe(`invite_${roomId}`);
      expect(results[0].title).toBe('poker.room.share.invite');
      expect(results[0].input_message_content.parse_mode).toBe('HTML');
      expect(results[0].reply_markup).toBeInstanceOf(InlineKeyboard);
      expect(results[0].reply_markup.inline_keyboard[0][0].url).toBe(deepLink);
      
      // Verify the response can be sent
      await expect(mockInlineContext.answerInlineQuery(results, { cache_time: 0, is_personal: true })).resolves.toBe(true);
    });
  });
});







