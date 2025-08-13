import { Context } from 'grammy';
import { GameHubContext, GameHubPlugin, ContextBuilder } from './context';
import { getUser, setUserProfile } from '../modules/core/userService';

/**
 * Extract user information from context
 */
export const extractUserInfo = (ctx: Context): {
  userId: string;
  chatId: number;
  username: string | undefined;
  name: string | undefined;
} => {
  const from = ctx.from;
  if (!from) {
    throw new Error('User information not available');
  }
  
  return {
    userId: from.id.toString(),
    chatId: ctx.chat?.id || from.id,
    username: from.username || undefined,
    name: from.first_name || from.last_name ? 
      `${from.first_name || ''} ${from.last_name || ''}`.trim() : 
      undefined,
  };
};

/**
 * User Plugin
 * Provides user management and user-related context
 */
export class UserPlugin implements GameHubPlugin {
  name = 'user';
  version = '1.0.0';
  // kept for future use if we need to re-introduce a soft timeout
  // private static readonly USER_PLUGIN_TIMEOUT_MS = 2500;

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

      // Get or create user profile in background to avoid blocking the pipeline
      const work = (async (): Promise<void> => {
        try {
          await getUser(userId);
          ctx.user.isNewUser = false;
        } catch {
          try {
            await setUserProfile(
              userId,
              ctx.from?.username,
              ctx.from?.first_name || undefined,
              ctx.from?.last_name || undefined
            );
            await getUser(userId);
            ctx.user.isNewUser = true;
          } catch (innerError) {
            ctx.log?.warn?.('User plugin create/fetch failed', {
              error: innerError instanceof Error ? innerError.message : String(innerError),
            });
          }
        }
      })();
      // Do not await; let it run in background
      void work.catch((e) => ctx.log?.warn?.('User plugin background task error', { error: e instanceof Error ? e.message : String(e) }));

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