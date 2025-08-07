import { Context } from 'grammy';
import { GameHubContext, GameHubPlugin, ContextBuilder } from './context';
import { getUser, setUserProfile } from '../modules/core/userService';

/**
 * User Plugin
 * Provides user management and user-related context
 */
export class UserPlugin implements GameHubPlugin {
  name = 'user';
  version = '1.0.0';

  buildContext: ContextBuilder = (ctx: Context): Partial<GameHubContext> => {
    const userId = ctx.from?.id?.toString() || '';
    const username = ctx.from?.username;
    const languageCode = ctx.from?.language_code;

    return {
      user: {
        id: userId,
        username,
        languageCode,
        isNewUser: false // Will be updated in middleware
      }
    };
  };

  middleware = async (ctx: GameHubContext, next: () => Promise<void>): Promise<void> => {
    try {
      const userId = ctx.from?.id?.toString();
      if (!userId) {
        await next();
        return;
      }

      // Get or create user profile
      try {
        await getUser(userId);
        ctx.user.isNewUser = false;
      } catch {
        // User doesn't exist, create new profile
        await setUserProfile(userId, ctx.from?.username, ctx.from?.username || 'Unknown');
        await getUser(userId);
        ctx.user.isNewUser = true;
      }

      // Update user context with additional data
      ctx.user = {
        ...ctx.user,
        id: userId,
        username: ctx.from?.username,
        languageCode: ctx.from?.language_code,
        isNewUser: ctx.user.isNewUser
      };

      await next();
    } catch (error) {
      ctx.log?.error('User plugin error', { error: error instanceof Error ? error.message : String(error) });
      await next();
    }
  };
}

// Export plugin instance
export const userPluginInstance = new UserPlugin(); 