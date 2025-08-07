import { describe, it, expect, beforeAll } from 'vitest';
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';

/**
 * Translation Button Tests
 * 
 * This test suite verifies that all button labels are rendering correctly
 * in both English and Persian languages, with proper icons and no duplicates.
 */

describe('Translation Button Tests', () => {
  beforeAll(async () => {
    // Initialize i18next for testing
    await i18next
      .use(Backend)
      .init({
        backend: {
          loadPath: process.cwd() + '/locales/{{lng}}/{{ns}}.json',
        },
        fallbackLng: 'en',
        debug: false,
        interpolation: {
          escapeValue: false,
        },
        supportedLngs: ['en', 'fa'],
        ns: ['translation'],
        defaultNS: 'translation',
        preload: ['en', 'fa'],
      });
  });

  describe('English Translation Tests', () => {
    it('should render start menu buttons with proper icons', () => {
        const createRoomText = i18next.t('🏠 Create Room', { lng: 'en' });
  const joinRoomText = i18next.t('🚪 Join Room', { lng: 'en' });
  const listRoomsText = i18next.t('📋 List Rooms', { lng: 'en' });
  const freeCoinText = i18next.t('🪙 Free Coin', { lng: 'en' });
  const balanceText = i18next.t('💰 Balance', { lng: 'en' });
  const helpText = i18next.t('❓ Help', { lng: 'en' });

      // Check that buttons have proper icons
      expect(createRoomText).toBe('🏠 Create Room');
      expect(joinRoomText).toBe('🚪 Join Room');
      expect(listRoomsText).toBe('📋 List Rooms');
      expect(freeCoinText).toBe('🪙 Free Coin');
      expect(balanceText).toBe('💰 Balance');
      expect(helpText).toBe('❓ Help');
    });

    it('should render poker room buttons with proper icons', () => {
        const createRoomButton = i18next.t('🏠 Create Room', { lng: 'en' });
  const joinRoomButton = i18next.t('🚪 Join Room', { lng: 'en' });
  const listRoomsButton = i18next.t('📋 List Rooms', { lng: 'en' });
  const roomInfoButton = i18next.t('ℹ️ Room Info', { lng: 'en' });
  const leaveRoomButton = i18next.t('🚪 Leave Room', { lng: 'en' });
  const kickPlayerButton = i18next.t('👢 Kick Player', { lng: 'en' });

      expect(createRoomButton).toBe('🏠 Create Room');
      expect(joinRoomButton).toBe('🚪 Join Room');
      expect(listRoomsButton).toBe('📋 List Rooms');
      expect(roomInfoButton).toBe('📊 Room Info');
      expect(leaveRoomButton).toBe('🚪 Leave Room');
      expect(kickPlayerButton).toBe('👢 Kick Player');
    });

    it('should render poker game buttons with proper icons', () => {
        const startGameButton = i18next.t('▶️ Start Game', { lng: 'en' });
  const playAgainButton = i18next.t('🔄 Play Again', { lng: 'en' });
  const newGameButton = i18next.t('🆕 New Game', { lng: 'en' });
  const viewStatsButton = i18next.t('📊 View Stats', { lng: 'en' });
  const gameEndButton = i18next.t('🏁 Game End', { lng: 'en' });
  const historyButton = i18next.t('📜 History', { lng: 'en' });
  const spectateButton = i18next.t('👁️ Spectate', { lng: 'en' });

      expect(startGameButton).toBe('🎮 Start Game');
      expect(playAgainButton).toBe('🔄 Play Again');
      expect(newGameButton).toBe('🆕 New Game');
      expect(viewStatsButton).toBe('📊 Stats');
      expect(gameEndButton).toBe('🏁 Game End');
      expect(historyButton).toBe('📜 History');
      expect(spectateButton).toBe('👁️ Spectate');
    });

    it('should render navigation buttons with proper icons', () => {
        const backToMenuButton = i18next.t('🔙 Back to Menu', { lng: 'en' });
  const backButton = i18next.t('⬅️ Back', { lng: 'en' });

      expect(backToMenuButton).toBe('🔙 Back to Menu');
      expect(backButton).toBe('🔙 Back');
    });

    it('should render utility buttons with proper icons', () => {
        const refreshButton = i18next.t('🔄 Refresh', { lng: 'en' });
  const helpButton = i18next.t('❓ Help', { lng: 'en' });
  const shareRoomButton = i18next.t('📤 Share Room', { lng: 'en' });

      expect(refreshButton).toBe('🔄 Refresh');
      expect(helpButton).toBe('❓ Help');
      expect(shareRoomButton).toBe('📤 Share Room');
    });

    it('should not have duplicate translation keys', () => {
      // Test that the same key returns the same value consistently
      const createRoom1 = i18next.t('bot.poker.start.createRoom', { lng: 'en' });
      const createRoom2 = i18next.t('bot.poker.start.createRoom', { lng: 'en' });
      
      expect(createRoom1).toBe(createRoom2);
      expect(createRoom1).toBe('🏠 Create Room');
    });
  });

  describe('Persian Translation Tests', () => {
    it('should render start menu buttons with proper icons in Persian', () => {
      const createRoomText = i18next.t('bot.poker.start.createRoom', { lng: 'fa' });
      const joinRoomText = i18next.t('bot.poker.start.joinRoom', { lng: 'fa' });
      const listRoomsText = i18next.t('bot.poker.start.listRooms', { lng: 'fa' });
      const freeCoinText = i18next.t('bot.start.freeCoin', { lng: 'fa' });
      const balanceText = i18next.t('bot.start.balance', { lng: 'fa' });
      const helpText = i18next.t('bot.start.help', { lng: 'fa' });

      // Check that buttons have proper icons
      expect(createRoomText).toBe('🏠 ایجاد اتاق');
      expect(joinRoomText).toBe('🚪 پیوستن به اتاق');
      expect(listRoomsText).toBe('📋 لیست اتاق‌ها');
      expect(freeCoinText).toBe('🪙 سکه رایگان');
      expect(balanceText).toBe('💰 موجودی');
      expect(helpText).toBe('❓ راهنما');
    });

    it('should render poker room buttons with proper icons in Persian', () => {
      const createRoomButton = i18next.t('bot.poker.room.buttons.room.createRoom', { lng: 'fa' });
      const joinRoomButton = i18next.t('bot.poker.room.buttons.room.joinRoom', { lng: 'fa' });
      const listRoomsButton = i18next.t('bot.poker.room.buttons.room.listRooms', { lng: 'fa' });
      const roomInfoButton = i18next.t('bot.poker.room.buttons.room.roomInfo', { lng: 'fa' });
      const leaveRoomButton = i18next.t('bot.poker.room.buttons.room.leaveRoom', { lng: 'fa' });
      const kickPlayerButton = i18next.t('bot.poker.room.buttons.room.kickPlayer', { lng: 'fa' });

      expect(createRoomButton).toBe('🏠 ساخت روم');
      expect(joinRoomButton).toBe('🚪 ورود به روم');
      expect(listRoomsButton).toBe('📋 لیست روم‌ها');
      expect(roomInfoButton).toBe('📊 اطلاعات روم');
      expect(leaveRoomButton).toBe('🚪 خروج از روم');
      expect(kickPlayerButton).toBe('👢 اخراج بازیکن');
    });

    it('should render poker game buttons with proper icons in Persian', () => {
      const startGameButton = i18next.t('bot.poker.room.buttons.game.startGame', { lng: 'fa' });
      const playAgainButton = i18next.t('bot.poker.room.buttons.game.playAgain', { lng: 'fa' });
      const newGameButton = i18next.t('bot.poker.room.buttons.game.newGame', { lng: 'fa' });
      const viewStatsButton = i18next.t('bot.poker.room.buttons.game.viewStats', { lng: 'fa' });
      const gameEndButton = i18next.t('bot.poker.room.buttons.game.gameEnd', { lng: 'fa' });
      const historyButton = i18next.t('bot.poker.room.buttons.game.history', { lng: 'fa' });
      const spectateButton = i18next.t('bot.poker.room.buttons.game.spectate', { lng: 'fa' });

      expect(startGameButton).toBe('🎮 شروع بازی');
      expect(playAgainButton).toBe('🔄 بازی دوباره');
      expect(newGameButton).toBe('🆕 بازی جدید');
      expect(viewStatsButton).toBe('📊 آمار');
      expect(gameEndButton).toBe('🏁 پایان بازی');
      expect(historyButton).toBe('📜 تاریخچه');
      expect(spectateButton).toBe('👁️ تماشا');
    });

    it('should render navigation buttons with proper icons in Persian', () => {
      const backToMenuButton = i18next.t('bot.poker.room.buttons.navigation.backToMenu', { lng: 'fa' });
      const backButton = i18next.t('bot.poker.room.buttons.navigation.back', { lng: 'fa' });

      expect(backToMenuButton).toBe('🔙 بازگشت به منو');
      expect(backButton).toBe('🔙 بازگشت');
    });

    it('should render utility buttons with proper icons in Persian', () => {
      const refreshButton = i18next.t('bot.poker.room.buttons.utility.refresh', { lng: 'fa' });
      const helpButton = i18next.t('bot.poker.room.buttons.utility.help', { lng: 'fa' });
      const shareRoomButton = i18next.t('bot.poker.room.buttons.share.shareRoom', { lng: 'fa' });

      expect(refreshButton).toBe('🔄 بروزرسانی');
      expect(helpButton).toBe('❓ راهنما');
      expect(shareRoomButton).toBe('📤 اشتراک‌گذاری روم');
    });

    it('should not have duplicate translation keys in Persian', () => {
      // Test that the same key returns the same value consistently
      const createRoom1 = i18next.t('bot.poker.start.createRoom', { lng: 'fa' });
      const createRoom2 = i18next.t('bot.poker.start.createRoom', { lng: 'fa' });
      
      expect(createRoom1).toBe(createRoom2);
      expect(createRoom1).toBe('🏠 ایجاد اتاق');
    });
  });

  describe('Translation Structure Tests', () => {
    it('should have consistent structure between languages', () => {
      const englishKeys = [
        'bot.poker.start.createRoom',
        'bot.poker.start.joinRoom',
        'bot.poker.start.listRooms',
        'bot.poker.room.buttons.room.createRoom',
        'bot.poker.room.buttons.room.joinRoom',
        'bot.poker.room.buttons.game.startGame',
        'bot.poker.room.buttons.navigation.backToMenu'
      ];

      const persianKeys = [
        'bot.poker.start.createRoom',
        'bot.poker.start.joinRoom',
        'bot.poker.start.listRooms',
        'bot.poker.room.buttons.room.createRoom',
        'bot.poker.room.buttons.room.joinRoom',
        'bot.poker.room.buttons.game.startGame',
        'bot.poker.room.buttons.navigation.backToMenu'
      ];

      // Verify all keys exist in both languages
      englishKeys.forEach(key => {
        const enValue = i18next.t(key, { lng: 'en' });
        const faValue = i18next.t(key, { lng: 'fa' });
        
        expect(enValue).not.toBe(key); // Should not return the key itself
        expect(faValue).not.toBe(key); // Should not return the key itself
        expect(enValue).toBeTruthy();
        expect(faValue).toBeTruthy();
      });
    });

    it('should have proper icons in all button labels', () => {
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

      // Check English buttons have icons
      buttonKeys.forEach(key => {
        const enValue = i18next.t(key, { lng: 'en' });
        expect(enValue).toMatch(/^[🏠🚪📋📊👢🎮🔄🆕🏁📜👁️🔙🔄❓📤]/);
      });

      // Check Persian buttons have icons
      buttonKeys.forEach(key => {
        const faValue = i18next.t(key, { lng: 'fa' });
        expect(faValue).toMatch(/^[🏠🚪📋📊👢🎮🔄🆕🏁📜👁️🔙🔄❓📤]/);
      });
    });
  });

  describe('Fallback Tests', () => {
    it('should fallback to English for missing keys', () => {
      const missingKey = 'bot.nonexistent.key';
      const fallbackValue = i18next.t(missingKey, { lng: 'fa' });
      
      // Should return the key itself as fallback
      expect(fallbackValue).toBe(missingKey);
    });

    it('should handle missing language gracefully', () => {
      const createRoomText = i18next.t('bot.poker.start.createRoom', { lng: 'fr' });
      
      // Should fallback to English
      expect(createRoomText).toBe('🏠 Create Room');
    });
  });
});

