import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Simple Translation Test
 * 
 * This test directly reads the translation files and verifies
 * that button labels have proper icons and no duplicates.
 */

describe('Simple Translation Tests', () => {
  let englishTranslations: any;
  let persianTranslations: any;

  beforeAll(() => {
    // Read translation files directly
    const enPath = resolve(__dirname, '../locales/en/translation.json');
    const faPath = resolve(__dirname, '../locales/fa/translation.json');
    
    englishTranslations = JSON.parse(readFileSync(enPath, 'utf-8'));
    persianTranslations = JSON.parse(readFileSync(faPath, 'utf-8'));
  });

  describe('English Translation Structure', () => {
    it('should have proper start menu buttons with icons', () => {
      const startButtons = englishTranslations['🏠 Create Room'];
      
      expect(startButtons.createRoom).toBe('🏠 Create Room');
      expect(startButtons.joinRoom).toBe('🚪 Join Room');
      expect(startButtons.listRooms).toBe('📋 List Rooms');
    });

    it('should have proper room buttons with icons', () => {
      const roomButtons = englishTranslations['🚪 Join Room'];
      
      expect(roomButtons.createRoom).toBe('🏠 Create Room');
      expect(roomButtons.joinRoom).toBe('🚪 Join Room');
      expect(roomButtons.listRooms).toBe('📋 List Rooms');
      expect(roomButtons.roomInfo).toBe('📊 Room Info');
      expect(roomButtons.leaveRoom).toBe('🚪 Leave Room');
      expect(roomButtons.kickPlayer).toBe('👢 Kick Player');
    });

    it('should have proper game buttons with icons', () => {
      const gameButtons = englishTranslations['▶️ Start Game'];
      
      expect(gameButtons.startGame).toBe('🎮 Start Game');
      expect(gameButtons.playAgain).toBe('🔄 Play Again');
      expect(gameButtons.newGame).toBe('🆕 New Game');
      expect(gameButtons.viewStats).toBe('📊 Stats');
      expect(gameButtons.gameEnd).toBe('🏁 Game End');
      expect(gameButtons.history).toBe('📜 History');
      expect(gameButtons.spectate).toBe('👁️ Spectate');
    });

    it('should have proper navigation buttons with icons', () => {
      const navButtons = englishTranslations['🔙 Back to Menu'];
      
      expect(navButtons.backToMenu).toBe('🔙 Back to Menu');
      expect(navButtons.back).toBe('🔙 Back');
    });

    it('should have proper utility buttons with icons', () => {
        const utilityButtons = englishTranslations['🔄 Refresh'];
  const shareButtons = englishTranslations['📤 Share Room'];
      
      expect(utilityButtons.refresh).toBe('🔄 Refresh');
      expect(utilityButtons.help).toBe('❓ Help');
      expect(shareButtons.shareRoom).toBe('📤 Share Room');
    });

    it('should not have duplicate poker sections', () => {
      // Check that there's only one poker section
      const pokerKeys = Object.keys(englishTranslations.bot).filter(key => key === 'poker');
      expect(pokerKeys.length).toBe(1);
    });

    it('should have all required button keys', () => {
      const requiredKeys = [
        '🏠 Create Room',
        '🚪 Join Room',
        '📋 List Rooms',
        '🏠 Create Room',
        '🚪 Join Room',
        '📋 List Rooms',
        'ℹ️ Room Info',
        '🚪 Leave Room',
        '👢 Kick Player',
        '▶️ Start Game',
        '🔄 Play Again',
        '🆕 New Game',
        '📊 View Stats',
        '🏁 Game End',
        '📜 History',
        '👁️ Spectate',
        '🔙 Back to Menu',
        '⬅️ Back',
        '🔄 Refresh',
        '❓ Help',
        '📤 Share Room'
      ];

      requiredKeys.forEach(key => {
        const keys = key.split('.');
        let value = englishTranslations;
        for (const k of keys) {
          expect(value).toHaveProperty(k);
          value = value[k];
        }
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Persian Translation Structure', () => {
    it('should have proper start menu buttons with icons in Persian', () => {
      const startButtons = persianTranslations['🏠 Create Room'];
      
      expect(startButtons.createRoom).toBe('🏠 ایجاد اتاق');
      expect(startButtons.joinRoom).toBe('🚪 پیوستن به اتاق');
      expect(startButtons.listRooms).toBe('📋 لیست اتاق‌ها');
    });

    it('should have proper room buttons with icons in Persian', () => {
      const roomButtons = persianTranslations['🚪 Join Room'];
      
      expect(roomButtons.createRoom).toBe('🏠 ساخت روم');
      expect(roomButtons.joinRoom).toBe('🚪 ورود به روم');
      expect(roomButtons.listRooms).toBe('📋 لیست روم‌ها');
      expect(roomButtons.roomInfo).toBe('📊 اطلاعات روم');
      expect(roomButtons.leaveRoom).toBe('🚪 خروج از روم');
      expect(roomButtons.kickPlayer).toBe('👢 اخراج بازیکن');
    });

    it('should have proper game buttons with icons in Persian', () => {
      const gameButtons = persianTranslations['▶️ Start Game'];
      
      expect(gameButtons.startGame).toBe('🎮 شروع بازی');
      expect(gameButtons.playAgain).toBe('🔄 بازی دوباره');
      expect(gameButtons.newGame).toBe('🆕 بازی جدید');
      expect(gameButtons.viewStats).toBe('📊 آمار');
      expect(gameButtons.gameEnd).toBe('🏁 پایان بازی');
      expect(gameButtons.history).toBe('📜 تاریخچه');
      expect(gameButtons.spectate).toBe('👁️ تماشا');
    });

    it('should have proper navigation buttons with icons in Persian', () => {
      const navButtons = persianTranslations['🔙 Back to Menu'];
      
      expect(navButtons.backToMenu).toBe('🔙 بازگشت به منو');
      expect(navButtons.back).toBe('🔙 بازگشت');
    });

    it('should have proper utility buttons with icons in Persian', () => {
        const utilityButtons = persianTranslations['🔄 Refresh'];
  const shareButtons = persianTranslations['📤 Share Room'];
      
      expect(utilityButtons.refresh).toBe('🔄 بروزرسانی');
      expect(utilityButtons.help).toBe('❓ راهنما');
      expect(shareButtons.shareRoom).toBe('📤 اشتراک‌گذاری روم');
    });

    it('should not have duplicate poker sections in Persian', () => {
      // Check that there's only one poker section
      const pokerKeys = Object.keys(persianTranslations.bot).filter(key => key === 'poker');
      expect(pokerKeys.length).toBe(1);
    });

    it('should have all required button keys in Persian', () => {
      const requiredKeys = [
        '🏠 Create Room',
        '🚪 Join Room',
        '📋 List Rooms',
        '🏠 Create Room',
        '🚪 Join Room',
        '📋 List Rooms',
        'ℹ️ Room Info',
        '🚪 Leave Room',
        '👢 Kick Player',
        '▶️ Start Game',
        '🔄 Play Again',
        '🆕 New Game',
        '📊 View Stats',
        '🏁 Game End',
        '📜 History',
        '👁️ Spectate',
        '🔙 Back to Menu',
        '⬅️ Back',
        '🔄 Refresh',
        '❓ Help',
        '📤 Share Room'
      ];

      requiredKeys.forEach(key => {
        const keys = key.split('.');
        let value = persianTranslations;
        for (const k of keys) {
          expect(value).toHaveProperty(k);
          value = value[k];
        }
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Icon Validation', () => {
    it('should have icons in all English button labels', () => {
      const buttonKeys = [
        'bot.poker.start.createRoom',
        'bot.poker.start.joinRoom',
        'bot.poker.start.listRooms',
        'bot.poker.room.buttons.room.createRoom',
        'bot.poker.room.buttons.room.joinRoom',
        'bot.poker.room.buttons.room.listRooms',
        'bot.poker.room.buttons.room.roomInfo',
        'bot.poker.room.buttons.room.leaveRoom',
        'bot.poker.room.buttons.room.kickPlayer',
        'bot.poker.room.buttons.game.startGame',
        'bot.poker.room.buttons.game.playAgain',
        'bot.poker.room.buttons.game.newGame',
        'bot.poker.room.buttons.game.viewStats',
        'bot.poker.room.buttons.game.gameEnd',
        'bot.poker.room.buttons.game.history',
        'bot.poker.room.buttons.game.spectate',
        'bot.poker.room.buttons.navigation.backToMenu',
        'bot.poker.room.buttons.navigation.back',
        'bot.poker.room.buttons.utility.refresh',
        'bot.poker.room.buttons.utility.help',
        'bot.poker.room.buttons.share.shareRoom'
      ];

      buttonKeys.forEach(key => {
        const keys = key.split('.');
        let value = englishTranslations;
        for (const k of keys) {
          value = value[k];
        }
        
        // Check that button text starts with an emoji icon
        expect(value).toMatch(/^[🏠🚪📋📊👢🎮🔄🆕🏁📜👁️🔙🔄❓📤]/);
      });
    });

    it('should have icons in all Persian button labels', () => {
      const buttonKeys = [
        'bot.poker.start.createRoom',
        'bot.poker.start.joinRoom',
        'bot.poker.start.listRooms',
        'bot.poker.room.buttons.room.createRoom',
        'bot.poker.room.buttons.room.joinRoom',
        'bot.poker.room.buttons.room.listRooms',
        'bot.poker.room.buttons.room.roomInfo',
        'bot.poker.room.buttons.room.leaveRoom',
        'bot.poker.room.buttons.room.kickPlayer',
        'bot.poker.room.buttons.game.startGame',
        'bot.poker.room.buttons.game.playAgain',
        'bot.poker.room.buttons.game.newGame',
        'bot.poker.room.buttons.game.viewStats',
        'bot.poker.room.buttons.game.gameEnd',
        'bot.poker.room.buttons.game.history',
        'bot.poker.room.buttons.game.spectate',
        'bot.poker.room.buttons.navigation.backToMenu',
        'bot.poker.room.buttons.navigation.back',
        'bot.poker.room.buttons.utility.refresh',
        'bot.poker.room.buttons.utility.help',
        'bot.poker.room.buttons.share.shareRoom'
      ];

      buttonKeys.forEach(key => {
        const keys = key.split('.');
        let value = persianTranslations;
        for (const k of keys) {
          value = value[k];
        }
        
        // Check that button text starts with an emoji icon
        expect(value).toMatch(/^[🏠🚪📋📊👢🎮🔄🆕🏁📜👁️🔙🔄❓📤]/);
      });
    });
  });

  describe('Consistency Tests', () => {
    it('should have consistent structure between languages', () => {
      const englishKeys = Object.keys(englishTranslations.bot.poker);
      const persianKeys = Object.keys(persianTranslations.bot.poker);
      
      // Both should have the same top-level keys
      expect(englishKeys.sort()).toEqual(persianKeys.sort());
    });

    it('should have no missing translations', () => {
      const englishPoker = englishTranslations.bot.poker;
      const persianPoker = persianTranslations.bot.poker;
      
      // Recursively check all keys exist in both languages
      function checkKeys(obj1: any, obj2: any, path: string = '') {
        for (const key in obj1) {
          const fullPath = path ? `${path}.${key}` : key;
          expect(obj2).toHaveProperty(key, `Missing key: ${fullPath} in Persian`);
          
          if (typeof obj1[key] === 'object' && obj1[key] !== null) {
            checkKeys(obj1[key], obj2[key], fullPath);
          }
        }
      }
      
      checkKeys(englishPoker, persianPoker);
    });
  });
});

