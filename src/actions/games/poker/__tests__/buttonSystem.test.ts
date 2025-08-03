import { describe, it, expect, vi } from 'vitest';
import { 
  replaceParams, 
  generateButton, 
  generateButtons,
  createInlineKeyboard 
} from '@/modules/core/buttonHelpers';
import { 
  generatePokerButton, 
  generatePokerButtons,
  generatePokerKeyboard,
  generateMainMenuKeyboard,
  generateGameActionKeyboard,
  generateRoomManagementKeyboard
} from '../buttonHelpers';
import { pokerButtonTemplates } from '../room/_button/buttonTemplates';
import { roomControls } from '../room/management/buttonSets';
import { gameActions } from '../room/game/buttonSets';

describe('Poker Dynamic Button System', () => {
  describe('Core Button Helpers', () => {
    it('should replace parameters in button callback_data', () => {
      const buttonTemplate = {
        text: 'Test Button',
        callback_data: 'games.poker.room.call?roomId={roomId}&userId={userId}'
      };
      
      const params = {
        roomId: 'room_123',
        userId: 'user_456'
      };
      
      const result = replaceParams(buttonTemplate, params);
      
      expect(result).toEqual({
        text: 'Test Button',
        callback_data: 'games.poker.room.call?roomId=room_123&userId=user_456'
      });
    });

    it('should generate a single button from template', () => {
      const params = { roomId: 'room_123' };
      const result = generateButton('call', params, pokerButtonTemplates);
      
      expect(result).toEqual({
        text: '🃏 Call',
        callback_data: 'games.poker.room.call?roomId=room_123'
      });
    });

    it('should generate multiple buttons from templates', () => {
      const params = { roomId: 'room_123' };
      const actions = ['call', 'fold', 'raise'];
      const result = generateButtons(actions, params, pokerButtonTemplates);
      
      expect(result).toHaveLength(3);
      expect(result[0].text).toBe('🃏 Call');
      expect(result[0].callback_data).toBe('games.poker.room.call?roomId=room_123');
      expect(result[1].text).toBe('❌ Fold');
      expect(result[1].callback_data).toBe('games.poker.room.fold?roomId=room_123');
      expect(result[2].text).toBe('💰 Raise');
      // The raise button should have roomId replaced but amount should remain as placeholder
      expect(result[2].callback_data).toBe('games.poker.room.raise?roomId=room_123&amount={amount}');
    });

    it('should create inline keyboard from button definitions', () => {
      const buttons = [
        { text: 'Button 1', callback_data: 'action1' },
        { text: 'Button 2', callback_data: 'action2' },
        { text: 'Long Button Text', callback_data: 'action3' }
      ];
      
      const result = createInlineKeyboard(buttons);
      
      expect(result.inline_keyboard).toHaveLength(2);
      expect(result.inline_keyboard[0]).toHaveLength(2); // Short buttons in first row
      expect(result.inline_keyboard[1]).toHaveLength(1); // Long button in second row
    });
  });

  describe('Poker Button Helpers', () => {
    it('should generate a single poker button', () => {
      const params = { roomId: 'room_123' };
      const result = generatePokerButton('call', params);
      
      expect(result).toEqual({
        text: '🃏 Call',
        callback_data: 'games.poker.room.call?roomId=room_123'
      });
    });

    it('should generate multiple poker buttons', () => {
      const params = { roomId: 'room_123' };
      const actions = ['call', 'fold'];
      const result = generatePokerButtons(actions, params);
      
      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('🃏 Call');
      expect(result[1].text).toBe('❌ Fold');
    });

    it('should generate main menu keyboard with custom layout (2 buttons per row)', () => {
      const result = generateMainMenuKeyboard();
      
      expect(result.inline_keyboard).toHaveLength(3); // 3 rows
      
      // Row 1: Create Room | Join Room
      expect(result.inline_keyboard[0]).toHaveLength(2);
      expect(result.inline_keyboard[0][0].text).toBe('🏠 Create Room');
      expect(result.inline_keyboard[0][1].text).toBe('🚪 Join Room');
      
      // Row 2: List Rooms | Poker Help
      expect(result.inline_keyboard[1]).toHaveLength(2);
      expect(result.inline_keyboard[1][0].text).toBe('📋 List Rooms');
      expect(result.inline_keyboard[1][1].text).toBe('❓ Poker Help');
      
      // Row 3: Back to Menu (centered)
      expect(result.inline_keyboard[2]).toHaveLength(1);
      expect(result.inline_keyboard[2][0].text).toBe('🔙 Back to Menu');
    });

    it('should have correct callback_data for main menu buttons', () => {
      const result = generateMainMenuKeyboard();
      
      // Check callback_data for each button (now in JSON format)
      expect(result.inline_keyboard[0][0].callback_data).toBe('{"action":"games.poker.room.create"}');
      expect(result.inline_keyboard[0][1].callback_data).toBe('{"action":"games.poker.room.join?roomId={roomId}"}');
      expect(result.inline_keyboard[1][0].callback_data).toBe('{"action":"games.poker.room.list"}');
      expect(result.inline_keyboard[1][1].callback_data).toBe('{"action":"games.poker.help"}');
      expect(result.inline_keyboard[2][0].callback_data).toBe('{"action":"back"}');
    });

    it('should generate create button with correct callback_data', () => {
      const createButton = generatePokerButton('create');
      
      expect(createButton).toEqual({
        text: '🏠 Create Room',
        callback_data: 'games.poker.room.create'
      });
    });

    it('should generate room management keyboard with custom layout', () => {
      const roomId = 'room_123';
      const result = generateRoomManagementKeyboard(roomId);
      
      expect(result.inline_keyboard).toBeDefined();
      expect(result.inline_keyboard.length).toBeGreaterThan(0);
      
      // Check that it uses custom layout (3 buttons per row for first row)
      expect(result.inline_keyboard[0]).toHaveLength(3); // First row should have 3 buttons
      expect(result.inline_keyboard[1]).toHaveLength(2); // Second row should have 2 buttons
      
      // Check that buttons have the correct room ID
      const firstButton = result.inline_keyboard[0][0];
      expect(firstButton.callback_data).toContain(`roomId=${roomId}`);
    });

    it('should have correct function signature for smart router compatibility', async () => {
      // Import the create action to test its signature
      const { default: createAction } = await import('../room/create');
      
      // The function should accept context and query parameters
      expect(typeof createAction).toBe('function');
      
      // Test that it can be called with the expected signature
      const mockContext = {
        user: { id: '123', username: 'test' },
        ctx: { reply: vi.fn() }
      };
      
      const mockQuery = {};
      
      // Should not throw when called with correct signature
      expect(() => {
        createAction(mockContext, mockQuery);
      }).not.toThrow();
    });

    it('should generate game action keyboard with room ID', () => {
      const roomId = 'room_123';
      const result = generateGameActionKeyboard(roomId, false);
      
      expect(result.inline_keyboard).toBeDefined();
      expect(result.inline_keyboard.length).toBeGreaterThan(0);
      
      // Check that buttons have the correct room ID
      const firstButton = result.inline_keyboard[0][0];
      expect(firstButton.callback_data).toContain(`roomId=${roomId}`);
    });

    it('should generate game action keyboard with all-in option', () => {
      const roomId = 'room_123';
      const result = generateGameActionKeyboard(roomId, true);
      
      expect(result.inline_keyboard).toBeDefined();
      
      // Check that it includes the all-in button
      const allButtons = result.inline_keyboard.flat();
      const allInButton = allButtons.find(btn => btn.text === '🔥 All In');
      expect(allInButton).toBeDefined();
      expect(allInButton?.callback_data).toContain(`roomId=${roomId}`);
    });

    it('should generate poker keyboard from button set with custom layout', () => {
      const params = { roomId: 'room_123' };
      const result = generatePokerKeyboard(gameActions.standard, params);
      
      expect(result.inline_keyboard).toBeDefined();
      expect(result.inline_keyboard.length).toBeGreaterThan(0);
      
      // Check that it uses custom layout (2 buttons per row)
      expect(result.inline_keyboard[0]).toHaveLength(2); // First row should have 2 buttons
      expect(result.inline_keyboard[1]).toHaveLength(2); // Second row should have 2 buttons
    });
  });

  describe('Button Template Validation', () => {
    it('should have all required button templates', () => {
      const requiredButtons = [
        'call', 'fold', 'raise', 'check', 'allIn',
        'create', 'join', 'leave', 'list',
        'start', 'ready', 'notReady',
        'help'
      ];
      
      for (const button of requiredButtons) {
        expect(pokerButtonTemplates[button]).toBeDefined();
        expect(pokerButtonTemplates[button].text).toBeDefined();
        expect(pokerButtonTemplates[button].callback_data).toBeDefined();
      }
    });

    it('should have all required button sets', () => {
      // Check room management button sets
      expect(roomControls.mainMenu).toBeDefined();
      expect(roomControls.roomManagement).toBeDefined();
      
      // Check game button sets
      expect(gameActions.standard).toBeDefined();
      expect(gameActions.withAllIn).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should throw error for non-existent button template', () => {
      expect(() => {
        generatePokerButton('nonExistentButton');
      }).toThrow('Button template not found for action: nonExistentButton');
    });

    it('should handle empty parameters gracefully', () => {
      const result = generatePokerButton('help');
      
      expect(result).toEqual({
        text: '❓ Poker Help',
        callback_data: 'games.poker.help'
      });
    });

    it('should handle parameters that are not in template', () => {
      const params = { roomId: 'room_123', extraParam: 'extra' };
      const result = generatePokerButton('call', params);
      
      // Should only replace {roomId}, ignore extraParam
      expect(result.callback_data).toBe('games.poker.room.call?roomId=room_123');
    });
  });
}); 