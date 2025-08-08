import { Context } from 'grammy';
import { GameHubContext, GameHubPlugin, ContextBuilder } from './context';

/**
 * Button definition interface
 */
export interface ButtonDefinition {
  text: string;
  callback_data: string;
}

/**
 * Keyboard layout type
 */
export type KeyboardLayout = string[][];

/**
 * Keyboard Plugin
 * Provides keyboard generation and button management
 */
export class KeyboardPlugin implements GameHubPlugin {
  name = 'keyboard';
  version = '1.0.0';

  buildContext: ContextBuilder = (ctx: Context): Partial<GameHubContext> => {
    return {
      keyboard: {
        // Generate a single button
        generateButton: (
          action: string,
          params: Record<string, string> = {},
          templates: Record<string, ButtonDefinition> = {}
        ): ButtonDefinition => {
          const template = templates[action];
          if (!template) {
            throw new Error(`Button template not found for action: ${action}`);
          }

          // Use template's callback_data as the base (already namespaced), then merge params
          let base: Record<string, string>;
          try {
            base = JSON.parse(template.callback_data) as Record<string, string>;
          } catch {
            base = { action: template.callback_data };
          }
          const callbackData = JSON.stringify({ ...base, ...params });
          return { text: template.text, callback_data: callbackData };
        },

        // Generate multiple buttons
        generateButtons: (
          actions: string[],
          params: Record<string, string> = {},
          templates: Record<string, ButtonDefinition> = {}
        ): ButtonDefinition[] => {
          const built = this.buildContext(ctx).keyboard;
          if (!built) {
            throw new Error('Keyboard plugin not initialized');
          }
          return actions.map(action => built.generateButton(action, params, templates));
        },

        // Create inline keyboard from button definitions
        createInlineKeyboard: (buttons: ButtonDefinition[]): { inline_keyboard: ButtonDefinition[][] } => {
          return {
            inline_keyboard: buttons.map(button => [button])
          };
        },

        // Create custom keyboard with layout
        createCustomKeyboard: (
          layout: KeyboardLayout,
          templates: Record<string, ButtonDefinition>,
          params: Record<string, string> = {}
        ): { inline_keyboard: ButtonDefinition[][] } => {
          const built = this.buildContext(ctx).keyboard;
          if (!built) {
            throw new Error('Keyboard plugin not initialized');
          }
          const keyboard: ButtonDefinition[][] = [];

          for (const row of layout) {
            const keyboardRow: ButtonDefinition[] = [];
            for (const action of row) {
              const button = built.generateButton(action, params, templates);
              keyboardRow.push(button);
            }
            keyboard.push(keyboardRow);
          }

          return { inline_keyboard: keyboard };
        },

        // Build callback data string
        buildCallbackData: (action: string, params: Record<string, string> = {}): string => {
          const data = { action, ...params };
          return JSON.stringify(data);
        },

        // Parse callback data
        parseCallbackData: (data: string): Record<string, unknown> => {
          try {
            return JSON.parse(data) as Record<string, unknown>;
          } catch {
            return { action: data };
          }
        }
      }
    };
  };

  middleware = async (_ctx: GameHubContext, next: () => Promise<void>): Promise<void> => {
    await next();
  };

  // Helper method for building callback data
  private buildCallbackData(action: string, params: Record<string, string> = {}): string {
    const data = { action, ...params };
    return JSON.stringify(data);
  }
}

// Export plugin instance
export const keyboardPluginInstance = new KeyboardPlugin(); 