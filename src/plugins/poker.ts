import { Context } from 'grammy';
import { GameHubContext, GameHubPlugin, ContextBuilder } from './context';

/**
 * Poker button templates interface
 */
export interface PokerButtonTemplates {
  [key: string]: {
    text: string;
    callback_data: string;
  };
}

/**
 * Poker Plugin
 * Provides poker-specific functionality and button templates
 */
export class PokerPlugin implements GameHubPlugin {
  name = 'poker';
  version = '1.0.0';

  buildContext: ContextBuilder = (ctx: Context): Partial<GameHubContext> => {
    return {
      poker: {
        // Create poker button templates with i18n support
        createButtonTemplates: (): PokerButtonTemplates => {
          const gameHubCtx = ctx as GameHubContext;
          return {
            // Navigation buttons
            back: {
              text: gameHubCtx.t('🔙 Back'),
              callback_data: 'back'
            },
            backToMenu: {
              text: gameHubCtx.t('🔙 Back to Menu'),
              callback_data: 'backToMenu'
            },

            // Room management buttons
            createRoom: {
              text: gameHubCtx.t('🏠 Create Room'),
              callback_data: 'createRoom'
            },
            joinRoom: {
              text: gameHubCtx.t('🚪 Join Room'),
              callback_data: 'joinRoom'
            },
            leaveRoom: {
              text: gameHubCtx.t('🚪 Leave Room'),
              callback_data: 'leaveRoom'
            },
            startGame: {
              text: gameHubCtx.t('▶️ Start Game'),
              callback_data: 'startGame'
            },
            ready: {
              text: gameHubCtx.t('✅ Ready'),
              callback_data: 'ready'
            },
            notReady: {
              text: gameHubCtx.t('❌ Not Ready'),
              callback_data: 'notReady'
            },

            // Game action buttons
            call: {
              text: gameHubCtx.t('📞 Call'),
              callback_data: 'call'
            },
            fold: {
              text: gameHubCtx.t('⬇️ Fold'),
              callback_data: 'fold'
            },
            raise: {
              text: gameHubCtx.t('⬆️ Raise'),
              callback_data: 'raise'
            },
            check: {
              text: gameHubCtx.t('✅ Check'),
              callback_data: 'check'
            },
            allIn: {
              text: gameHubCtx.t('💥 All In'),
              callback_data: 'allIn'
            },

            // Stake buttons
            stake5: {
              text: gameHubCtx.t('🪙 Stake 5'),
              callback_data: 'stake5'
            },
            stake10: {
              text: gameHubCtx.t('🪙 Stake 10'),
              callback_data: 'stake10'
            },
            stake25: {
              text: gameHubCtx.t('🪙 Stake 25'),
              callback_data: 'stake25'
            },
            stake50: {
              text: gameHubCtx.t('🪙 Stake 50'),
              callback_data: 'stake50'
            },

            // Raise buttons
            raise10: {
              text: gameHubCtx.t('💰 Raise 10'),
              callback_data: 'raise10'
            },
            raise25: {
              text: gameHubCtx.t('💰 Raise 25'),
              callback_data: 'raise25'
            },
            raise50: {
              text: gameHubCtx.t('💰 Raise 50'),
              callback_data: 'raise50'
            },
            raise100: {
              text: gameHubCtx.t('💰 Raise 100'),
              callback_data: 'raise100'
            },

            // Utility buttons
            refresh: {
              text: gameHubCtx.t('🔄 Refresh'),
              callback_data: 'refresh'
            },
            help: {
              text: gameHubCtx.t('❓ Help'),
              callback_data: 'help'
            }
          };
        },

        // Generate poker-specific keyboards
        generateMainMenuKeyboard: () => {
          const gameHubCtx = ctx as GameHubContext;
          const templates = gameHubCtx.poker.createButtonTemplates();
          const layout = [
            ['createRoom', 'joinRoom'],
            ['help']
          ];
          return gameHubCtx.keyboard.createCustomKeyboard(layout, templates);
        },

        generateRoomManagementKeyboard: (roomId: string) => {
          const gameHubCtx = ctx as GameHubContext;
          const templates = gameHubCtx.poker.createButtonTemplates();
          const layout = [
            ['startGame', 'ready', 'notReady'],
            ['leaveRoom', 'back']
          ];
          return gameHubCtx.keyboard.createCustomKeyboard(layout, templates, { roomId });
        },

        generateGameActionKeyboard: (roomId: string, includeAllIn = false) => {
          const gameHubCtx = ctx as GameHubContext;
          const templates = gameHubCtx.poker.createButtonTemplates();
          const layout = includeAllIn 
            ? [['call', 'fold'], ['raise', 'allIn'], ['back']]
            : [['call', 'fold'], ['raise', 'check'], ['back']];
          return gameHubCtx.keyboard.createCustomKeyboard(layout, templates, { roomId });
        },

        generateStakeSelectionKeyboard: () => {
          const gameHubCtx = ctx as GameHubContext;
          const templates = gameHubCtx.poker.createButtonTemplates();
          const layout = [
            ['stake5', 'stake10'],
            ['stake25', 'stake50'],
            ['back']
          ];
          return gameHubCtx.keyboard.createCustomKeyboard(layout, templates);
        },

        generateRaiseAmountKeyboard: (roomId: string) => {
          const gameHubCtx = ctx as GameHubContext;
          const templates = gameHubCtx.poker.createButtonTemplates();
          const layout = [
            ['raise10', 'raise25'],
            ['raise50', 'raise100'],
            ['back']
          ];
          return gameHubCtx.keyboard.createCustomKeyboard(layout, templates, { roomId });
        }
      }
    };
  };

  middleware = async (_ctx: GameHubContext, next: () => Promise<void>): Promise<void> => {
    await next();
  };
}

// Export plugin instance
export const pokerPluginInstance = new PokerPlugin(); 