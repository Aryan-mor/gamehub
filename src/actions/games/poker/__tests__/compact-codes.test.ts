import { 
  POKER_ACTIONS, 
  calculateCallbackDataLength, 
  isCallbackDataTooLong,
  generateFormCallbackData,
  parseFormCallbackData,
  } from '../compact-codes';

describe('Poker Compact Codes', () => {
  describe('Action Codes', () => {
    it('should all start with "gp" prefix', () => {
      Object.values(POKER_ACTIONS).forEach(code => {
        expect(code).toMatch(/^gp/);
      });
    });

    it('should have unique codes', () => {
      const codes = Object.values(POKER_ACTIONS);
      const uniqueCodes = new Set(codes);
      expect(codes.length).toBe(uniqueCodes.size);
    });

    it('should have reasonable lengths', () => {
      Object.values(POKER_ACTIONS).forEach(code => {
        expect(code.length).toBeLessThanOrEqual(6); // Most codes should be 3-6 chars
      });
    });
  });

  describe('Callback Data Length', () => {
    it('should calculate correct lengths', () => {
      const length = calculateCallbackDataLength(POKER_ACTIONS.FORM_STEP, {
        s: 'privacy',
        v: 'true'
      });
      expect(length).toBe(22); // 'gpfst?s=privacy&v=true'
    });

    it('should detect when data is too long', () => {
      const isTooLong = isCallbackDataTooLong(POKER_ACTIONS.FORM_STEP, {
        s: 'privacy',
        v: 'true',
        r: 'a'.repeat(50) // Very long room ID
      });
      expect(isTooLong).toBe(true);
    });

    it('should stay within 64-byte limit for normal usage', () => {
      const length = calculateCallbackDataLength(POKER_ACTIONS.START_GAME, {
        r: 'room_123456789',
        p: 'player_987654321'
      });
      expect(length).toBeLessThanOrEqual(64);
    });
  });

  describe('Form Callback Data', () => {
    it('should generate compact form callback data', () => {
      const callbackData = generateFormCallbackData(
        POKER_ACTIONS.FORM_STEP,
        'privacy',
        'true'
      );
      expect(callbackData).toBe('gpfst?s=privacy&v=true');
    });

    it('should parse form callback data correctly', () => {
      const callbackData = 'gpfst?s=privacy&v=true&r=room123';
      const parsed = parseFormCallbackData(callbackData);
      
      expect(parsed.action).toBe('gpfst');
      expect(parsed.step).toBe('privacy');
      expect(parsed.value).toBe('true');
      expect(parsed.params.r).toBe('room123');
    });

    it('should handle form callback data without parameters', () => {
      const callbackData = 'gpfst';
      const parsed = parseFormCallbackData(callbackData);
      
      expect(parsed.action).toBe('gpfst');
      expect(parsed.step).toBeUndefined();
      expect(parsed.value).toBeUndefined();
    });
  });

  describe('Common Use Cases', () => {
    it('should handle room creation form steps', () => {
      const steps = [
        { step: 'privacy', value: 'true' },
        { step: 'maxPlayers', value: '4' },
        { step: 'smallBlind', value: '100' },
        { step: 'timeout', value: '120' }
      ];

      steps.forEach(({ step, value }) => {
        const callbackData = generateFormCallbackData(
          POKER_ACTIONS.FORM_STEP,
          step,
          value
        );
        
        expect(callbackData.length).toBeLessThanOrEqual(64);
        
        const parsed = parseFormCallbackData(callbackData);
        expect(parsed.step).toBe(step);
        expect(parsed.value).toBe(value);
      });
    });

    it('should handle game actions with room ID', () => {
      const actions = [
        POKER_ACTIONS.FOLD,
        POKER_ACTIONS.CALL,
        POKER_ACTIONS.RAISE,
        POKER_ACTIONS.ALL_IN
      ];

      actions.forEach(action => {
        const callbackData = `${action}?r=room_123456789`;
        expect(callbackData.length).toBeLessThanOrEqual(64);
      });
    });

    it('should handle stake selection', () => {
      const stakes = [
        POKER_ACTIONS.STAKE_2,
        POKER_ACTIONS.STAKE_5,
        POKER_ACTIONS.STAKE_10,
        POKER_ACTIONS.STAKE_20,
        POKER_ACTIONS.STAKE_50
      ];

      stakes.forEach(stake => {
        const callbackData = `${stake}?amount=50`;
        expect(callbackData.length).toBeLessThanOrEqual(64);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in values', () => {
      const callbackData = generateFormCallbackData(
        POKER_ACTIONS.FORM_STEP,
        'name',
        'Room & Game (Special)'
      );
      
      const parsed = parseFormCallbackData(callbackData);
      expect(parsed.value).toBe('Room & Game (Special)');
    });

    it('should handle multiple parameters', () => {
      const callbackData = generateFormCallbackData(
        POKER_ACTIONS.FORM_STEP,
        'privacy',
        'true',
        { r: 'room123', p: 'player456' }
      );
      
      const parsed = parseFormCallbackData(callbackData);
      expect(parsed.params.r).toBe('room123');
      expect(parsed.params.p).toBe('player456');
    });
  });
}); 