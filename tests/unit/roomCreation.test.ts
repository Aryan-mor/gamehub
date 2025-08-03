import { describe, it, expect } from 'vitest';
import { 
  validateRoomName, 
  validateSmallBlind, 
  validateTurnTimeout, 
  validateMaxPlayers,
  validateRoomForm 
} from '../../src/actions/games/poker/utils/roomValidation';

describe('Room Creation Validation', () => {
  describe('validateRoomName', () => {
    it('should accept valid room names', () => {
      expect(validateRoomName('My Poker Room')).toBeNull();
      expect(validateRoomName('   Valid Room   ')).toBeNull(); // Should trim
      expect(validateRoomName('123')).toBeNull(); // Minimum length
      expect(validateRoomName('A'.repeat(30))).toBeNull(); // Maximum length
    });

    it('should reject invalid room names', () => {
      expect(validateRoomName('')).toBe('نام روم نمی‌تواند خالی باشد');
      expect(validateRoomName('   ')).toBe('نام روم نمی‌تواند خالی باشد');
      expect(validateRoomName('12')).toBe('نام روم باید حداقل ۳ کاراکتر باشد');
      expect(validateRoomName('A'.repeat(31))).toBe('نام روم نمی‌تواند بیشتر از ۳۰ کاراکتر باشد');
    });
  });

  describe('validateSmallBlind', () => {
    it('should accept valid small blind amounts', () => {
      expect(validateSmallBlind(50)).toBeNull();
      expect(validateSmallBlind(100)).toBeNull();
      expect(validateSmallBlind(1000)).toBeNull(); // Maximum
    });

    it('should reject invalid small blind amounts', () => {
      expect(validateSmallBlind(0)).toBe('مقدار small blind باید عدد صحیح مثبت باشد');
      expect(validateSmallBlind(-10)).toBe('مقدار small blind باید عدد صحیح مثبت باشد');
      expect(validateSmallBlind(1001)).toBe('مقدار small blind نمی‌تواند بیشتر از ۱۰۰۰ باشد');
      expect(validateSmallBlind(50.5)).toBe('مقدار small blind باید عدد صحیح مثبت باشد');
    });
  });

  describe('validateTurnTimeout', () => {
    it('should accept valid timeout values', () => {
      expect(validateTurnTimeout(30)).toBeNull(); // Minimum
      expect(validateTurnTimeout(60)).toBeNull();
      expect(validateTurnTimeout(300)).toBeNull();
      expect(validateTurnTimeout(600)).toBeNull(); // Maximum
    });

    it('should reject invalid timeout values', () => {
      expect(validateTurnTimeout(0)).toBe('زمان تایم‌اوت باید عدد صحیح مثبت باشد');
      expect(validateTurnTimeout(-10)).toBe('زمان تایم‌اوت باید عدد صحیح مثبت باشد');
      expect(validateTurnTimeout(29)).toBe('زمان تایم‌اوت نمی‌تواند کمتر از ۳۰ ثانیه باشد');
      expect(validateTurnTimeout(601)).toBe('زمان تایم‌اوت نمی‌تواند بیشتر از ۶۰۰ ثانیه باشد');
    });
  });

  describe('validateMaxPlayers', () => {
    it('should accept valid max players values', () => {
      expect(validateMaxPlayers(2)).toBeNull();
      expect(validateMaxPlayers(4)).toBeNull();
      expect(validateMaxPlayers(6)).toBeNull();
      expect(validateMaxPlayers(8)).toBeNull();
    });

    it('should reject invalid max players values', () => {
      expect(validateMaxPlayers(1)).toBe('تعداد بازیکنان باید یکی از مقادیر ۲، ۴، ۶ یا ۸ باشد');
      expect(validateMaxPlayers(3)).toBe('تعداد بازیکنان باید یکی از مقادیر ۲، ۴، ۶ یا ۸ باشد');
      expect(validateMaxPlayers(5)).toBe('تعداد بازیکنان باید یکی از مقادیر ۲، ۴، ۶ یا ۸ باشد');
      expect(validateMaxPlayers(7)).toBe('تعداد بازیکنان باید یکی از مقادیر ۲، ۴، ۶ یا ۸ باشد');
      expect(validateMaxPlayers(9)).toBe('تعداد بازیکنان باید یکی از مقادیر ۲، ۴، ۶ یا ۸ باشد');
    });
  });

  describe('validateRoomForm', () => {
    it('should accept complete valid form data', () => {
      const formData = {
        name: 'Test Room',
        isPrivate: false,
        maxPlayers: 4,
        smallBlind: 100,
        turnTimeoutSec: 60
      };

      const result = validateRoomForm(formData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject incomplete form data', () => {
      const formData = {
        name: 'Test Room',
        isPrivate: false,
        // Missing maxPlayers, smallBlind, turnTimeoutSec
      };

      const result = validateRoomForm(formData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject form data with invalid values', () => {
      const formData = {
        name: '', // Invalid name
        isPrivate: false,
        maxPlayers: 3, // Invalid max players
        smallBlind: 0, // Invalid small blind
        turnTimeoutSec: 20 // Invalid timeout
      };

      const result = validateRoomForm(formData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      // Check that all expected errors are present
      const errorMessages = result.errors.map(e => e.message);
      expect(errorMessages).toContain('نام روم نمی‌تواند خالی باشد');
      expect(errorMessages).toContain('تعداد بازیکنان باید یکی از مقادیر ۲، ۴، ۶ یا ۸ باشد');
      expect(errorMessages).toContain('مقدار small blind باید عدد صحیح مثبت باشد');
      expect(errorMessages).toContain('زمان تایم‌اوت نمی‌تواند کمتر از ۳۰ ثانیه باشد');
    });
  });
}); 