import { Context } from 'grammy';
import { GameHubContext, GameHubPlugin, ContextBuilder } from './context';
import type { ActionRoute } from '@/modules/core/routes.generated';

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
              text: gameHubCtx.t('poker.room.buttons.back'),
              callback_data: gameHubCtx.keyboard.buildCallbackData('games.poker.back' as ActionRoute)
            },
            backToMenu: {
              text: gameHubCtx.t('poker.room.buttons.backToMenu'),
              callback_data: gameHubCtx.keyboard.buildCallbackData('games.poker.back' as ActionRoute)
            },

            // Room management buttons
            createRoom: {
              text: gameHubCtx.t('poker.room.buttons.createRoom'),
              callback_data: gameHubCtx.keyboard.buildCallbackData('games.poker.room.create' as ActionRoute)
            },
            joinRoom: {
              text: gameHubCtx.t('poker.room.buttons.joinRoom'),
              callback_data: gameHubCtx.keyboard.buildCallbackData('games.poker.room.join' as ActionRoute)
            },
            leaveRoom: {
              text: gameHubCtx.t('poker.room.buttons.leave'),
              callback_data: gameHubCtx.keyboard.buildCallbackData('games.poker.room.leave' as ActionRoute)
            },
            startGame: {
              text: gameHubCtx.t('poker.room.buttons.startGame'),
              callback_data: gameHubCtx.keyboard.buildCallbackData('games.poker.room.start' as ActionRoute)
            },
            ready: {
              text: gameHubCtx.t('poker.room.buttons.ready'),
              callback_data: gameHubCtx.keyboard.buildCallbackData('games.poker.room.ready' as ActionRoute)
            },
            notReady: {
              text: gameHubCtx.t('poker.room.buttons.notReady'),
              callback_data: gameHubCtx.keyboard.buildCallbackData('games.poker.room.notready' as ActionRoute)
            },

            // Game action buttons
            call: {
              text: gameHubCtx.t('poker.actions.call'),
              callback_data: gameHubCtx.keyboard.buildCallbackData('games.poker.room.call' as ActionRoute)
            },
            fold: {
              text: gameHubCtx.t('poker.actions.fold'),
              callback_data: gameHubCtx.keyboard.buildCallbackData('games.poker.room.fold' as ActionRoute)
            },
            raise: {
              text: gameHubCtx.t('poker.actions.raise'),
              callback_data: gameHubCtx.keyboard.buildCallbackData('games.poker.room.raise' as ActionRoute)
            },
            check: {
              text: gameHubCtx.t('poker.actions.check'),
              callback_data: gameHubCtx.keyboard.buildCallbackData('games.poker.room.check' as ActionRoute)
            },
            allIn: {
              text: gameHubCtx.t('poker.actions.allIn'),
              callback_data: gameHubCtx.keyboard.buildCallbackData('games.poker.room.allin' as ActionRoute)
            },

            // Stake buttons
            stake5: {
              text: gameHubCtx.t('poker.room.buttons.stake5'),
              callback_data: gameHubCtx.keyboard.buildCallbackData('games.poker.stake' as ActionRoute, { amount: '5' })
            },
            stake10: {
              text: gameHubCtx.t('poker.room.buttons.stake10'),
              callback_data: gameHubCtx.keyboard.buildCallbackData('games.poker.stake' as ActionRoute, { amount: '10' })
            },
            stake25: {
              text: gameHubCtx.t('poker.room.buttons.stake25'),
              callback_data: gameHubCtx.keyboard.buildCallbackData('games.poker.stake' as ActionRoute, { amount: '25' })
            },
            stake50: {
              text: gameHubCtx.t('poker.room.buttons.stake50'),
              callback_data: gameHubCtx.keyboard.buildCallbackData('games.poker.stake' as ActionRoute, { amount: '50' })
            },

            // Raise buttons
            raise10: {
              text: gameHubCtx.t('poker.room.buttons.raise10'),
              callback_data: gameHubCtx.keyboard.buildCallbackData('games.poker.room.raise' as ActionRoute, { amount: '10' })
            },
            raise25: {
              text: gameHubCtx.t('poker.room.buttons.raise25'),
              callback_data: gameHubCtx.keyboard.buildCallbackData('games.poker.room.raise' as ActionRoute, { amount: '25' })
            },
            raise50: {
              text: gameHubCtx.t('poker.room.buttons.raise50'),
              callback_data: gameHubCtx.keyboard.buildCallbackData('games.poker.room.raise' as ActionRoute, { amount: '50' })
            },
            raise100: {
              text: gameHubCtx.t('poker.room.buttons.raise100'),
              callback_data: gameHubCtx.keyboard.buildCallbackData('games.poker.room.raise' as ActionRoute, { amount: '100' })
            },

            // Utility buttons
            refresh: {
              text: gameHubCtx.t('poker.room.buttons.refresh'),
              callback_data: gameHubCtx.keyboard.buildCallbackData('games.poker.room.refresh' as ActionRoute)
            },
            help: {
              text: gameHubCtx.t('poker.room.buttons.help'),
              callback_data: gameHubCtx.keyboard.buildCallbackData('games.poker.help' as ActionRoute)
            }
            ,
            // Form buttons (room create flow)
            // Privacy
            private: {
              text: gameHubCtx.t('poker.form.option.private'),
              callback_data: gameHubCtx.keyboard.buildCallbackData('games.poker.room.create' as ActionRoute, { s: 'privacy', v: 'true' })
            },
            public: {
              text: gameHubCtx.t('poker.form.option.public'),
              callback_data: gameHubCtx.keyboard.buildCallbackData('games.poker.room.create' as ActionRoute, { s: 'privacy', v: 'false' })
            },
            // Max players
            maxPlayers2: {
              text: gameHubCtx.t('poker.form.option.players2'),
              callback_data: gameHubCtx.keyboard.buildCallbackData('games.poker.room.create' as ActionRoute, { s: 'maxPlayers', v: '2' })
            },
            maxPlayers4: {
              text: gameHubCtx.t('poker.form.option.players4'),
              callback_data: gameHubCtx.keyboard.buildCallbackData('games.poker.room.create' as ActionRoute, { s: 'maxPlayers', v: '4' })
            },
            maxPlayers6: {
              text: gameHubCtx.t('poker.form.option.players6'),
              callback_data: gameHubCtx.keyboard.buildCallbackData('games.poker.room.create' as ActionRoute, { s: 'maxPlayers', v: '6' })
            },
            maxPlayers8: {
              text: gameHubCtx.t('poker.form.option.players8'),
              callback_data: gameHubCtx.keyboard.buildCallbackData('games.poker.room.create' as ActionRoute, { s: 'maxPlayers', v: '8' })
            },
            // Small blind
            smallBlind50: {
              text: gameHubCtx.t('poker.form.option.sb50'),
              callback_data: gameHubCtx.keyboard.buildCallbackData('games.poker.room.create' as ActionRoute, { s: 'smallBlind', v: '50' })
            },
            smallBlind100: {
              text: gameHubCtx.t('poker.form.option.sb100'),
              callback_data: gameHubCtx.keyboard.buildCallbackData('games.poker.room.create' as ActionRoute, { s: 'smallBlind', v: '100' })
            },
            smallBlind200: {
              text: gameHubCtx.t('poker.form.option.sb200'),
              callback_data: gameHubCtx.keyboard.buildCallbackData('games.poker.room.create' as ActionRoute, { s: 'smallBlind', v: '200' })
            },
            smallBlind500: {
              text: gameHubCtx.t('poker.form.option.sb500'),
              callback_data: gameHubCtx.keyboard.buildCallbackData('games.poker.room.create' as ActionRoute, { s: 'smallBlind', v: '500' })
            },
            // Timeout
            timeout60: {
              text: gameHubCtx.t('poker.form.option.t60'),
              callback_data: gameHubCtx.keyboard.buildCallbackData('games.poker.room.create' as ActionRoute, { s: 'timeout', v: '60' })
            },
            timeout120: {
              text: gameHubCtx.t('poker.form.option.t120'),
              callback_data: gameHubCtx.keyboard.buildCallbackData('games.poker.room.create' as ActionRoute, { s: 'timeout', v: '120' })
            },
            timeout300: {
              text: gameHubCtx.t('poker.form.option.t300'),
              callback_data: gameHubCtx.keyboard.buildCallbackData('games.poker.room.create' as ActionRoute, { s: 'timeout', v: '300' })
            },
            timeout600: {
              text: gameHubCtx.t('poker.form.option.t600'),
              callback_data: gameHubCtx.keyboard.buildCallbackData('games.poker.room.create' as ActionRoute, { s: 'timeout', v: '600' })
            },
            // Confirmation
            confirmCreate: {
              text: gameHubCtx.t('poker.form.action.confirm'),
              callback_data: gameHubCtx.keyboard.buildCallbackData('games.poker.room.create' as ActionRoute, { s: 'confirmation', v: 'create' })
            },
            editForm: {
              text: gameHubCtx.t('poker.form.action.edit'),
              callback_data: gameHubCtx.keyboard.buildCallbackData('games.poker.room.create' as ActionRoute, { s: 'name', v: 'edit' })
            }
          };
        },

        // Generate poker-specific keyboards
        generateMainMenuKeyboard: (): { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> } => {
          const gameHubCtx = ctx as GameHubContext;
          const templates = gameHubCtx.poker.createButtonTemplates();
          const layout = [
            ['createRoom', 'joinRoom'],
            ['help']
          ];
          return gameHubCtx.keyboard.createCustomKeyboard(layout, templates);
        },

        generateRoomManagementKeyboard: (roomId: string): { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> } => {
          const gameHubCtx = ctx as GameHubContext;
          const templates = gameHubCtx.poker.createButtonTemplates();
          const layout = [
            ['startGame', 'ready', 'notReady'],
            ['leaveRoom', 'back']
          ];
          return gameHubCtx.keyboard.createCustomKeyboard(layout, templates, { roomId });
        },

        generateGameActionKeyboard: (roomId: string, includeAllIn = false): { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> } => {
          const gameHubCtx = ctx as GameHubContext;
          const templates = gameHubCtx.poker.createButtonTemplates();
          const layout = includeAllIn 
            ? [['call', 'fold'], ['raise', 'allIn'], ['back']]
            : [['call', 'fold'], ['raise', 'check'], ['back']];
          return gameHubCtx.keyboard.createCustomKeyboard(layout, templates, { roomId });
        },

        generateStakeSelectionKeyboard: (): { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> } => {
          const gameHubCtx = ctx as GameHubContext;
          const templates = gameHubCtx.poker.createButtonTemplates();
          const layout = [
            ['stake5', 'stake10'],
            ['stake25', 'stake50'],
            ['back']
          ];
          return gameHubCtx.keyboard.createCustomKeyboard(layout, templates);
        },

        generateRaiseAmountKeyboard: (roomId: string): { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> } => {
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