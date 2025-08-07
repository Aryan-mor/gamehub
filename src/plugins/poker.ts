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
              text: gameHubCtx.t('bot.poker.buttons.navigation.back'),
              callback_data: 'back'
            },
            backToMenu: {
              text: gameHubCtx.t('bot.poker.buttons.navigation.backToMenu'),
              callback_data: 'backToMenu'
            },

            // Room management buttons
            createRoom: {
              text: gameHubCtx.t('bot.poker.buttons.room.create'),
              callback_data: 'createRoom'
            },
            joinRoom: {
              text: gameHubCtx.t('bot.poker.buttons.room.join'),
              callback_data: 'joinRoom'
            },
            leaveRoom: {
              text: gameHubCtx.t('bot.poker.buttons.room.leave'),
              callback_data: 'leaveRoom'
            },
            startGame: {
              text: gameHubCtx.t('bot.poker.buttons.room.startGame'),
              callback_data: 'startGame'
            },
            ready: {
              text: gameHubCtx.t('bot.poker.buttons.room.ready'),
              callback_data: 'ready'
            },
            notReady: {
              text: gameHubCtx.t('bot.poker.buttons.room.notReady'),
              callback_data: 'notReady'
            },

            // Game action buttons
            call: {
              text: gameHubCtx.t('bot.poker.buttons.game.call'),
              callback_data: 'call'
            },
            fold: {
              text: gameHubCtx.t('bot.poker.buttons.game.fold'),
              callback_data: 'fold'
            },
            raise: {
              text: gameHubCtx.t('bot.poker.buttons.game.raise'),
              callback_data: 'raise'
            },
            check: {
              text: gameHubCtx.t('bot.poker.buttons.game.check'),
              callback_data: 'check'
            },
            allIn: {
              text: gameHubCtx.t('bot.poker.buttons.game.allIn'),
              callback_data: 'allIn'
            },

            // Stake buttons
            stake5: {
              text: gameHubCtx.t('bot.poker.buttons.stake.stake5'),
              callback_data: 'stake5'
            },
            stake10: {
              text: gameHubCtx.t('bot.poker.buttons.stake.stake10'),
              callback_data: 'stake10'
            },
            stake25: {
              text: gameHubCtx.t('bot.poker.buttons.stake.stake25'),
              callback_data: 'stake25'
            },
            stake50: {
              text: gameHubCtx.t('bot.poker.buttons.stake.stake50'),
              callback_data: 'stake50'
            },

            // Raise buttons
            raise10: {
              text: gameHubCtx.t('bot.poker.buttons.raise.raise10'),
              callback_data: 'raise10'
            },
            raise25: {
              text: gameHubCtx.t('bot.poker.buttons.raise.raise25'),
              callback_data: 'raise25'
            },
            raise50: {
              text: gameHubCtx.t('bot.poker.buttons.raise.raise50'),
              callback_data: 'raise50'
            },
            raise100: {
              text: gameHubCtx.t('bot.poker.buttons.raise.raise100'),
              callback_data: 'raise100'
            },

            // Utility buttons
            refresh: {
              text: gameHubCtx.t('bot.poker.buttons.utility.refresh'),
              callback_data: 'refresh'
            },
            help: {
              text: gameHubCtx.t('bot.poker.buttons.utility.help'),
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