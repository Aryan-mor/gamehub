import { Context } from 'grammy';
import { GameHubContext, GameHubPlugin, ContextBuilder } from './context';

/**
 * Utility Plugin
 * Provides utility functions for formatting and common operations
 */
export class UtilsPlugin implements GameHubPlugin {
  name = 'utils';
  version = '1.0.0';

  buildContext: ContextBuilder = (_ctx: Context): Partial<GameHubContext> => {
    return {
      utils: {
        formatCoins: (amount: number): string => {
          return `${amount} Coins`;
        },
        formatTimeRemaining: (milliseconds: number): string => {
          const hours = Math.floor(milliseconds / 3600000);
          const minutes = Math.floor((milliseconds % 3600000) / 60000);
          const seconds = Math.floor((milliseconds % 60000) / 1000);
          
          const pad = (n: number): string => n.toString().padStart(2, '0');
          return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
        }
      }
    };
  };

  middleware = async (_ctx: GameHubContext, next: () => Promise<void>): Promise<void> => {
    await next();
  };
}

// Export plugin instance
export const utilsPluginInstance = new UtilsPlugin(); 