import { registerXoTelegramHandlers } from "./handlers";

/**
 * Registers all X/O (Tic-Tac-Toe) handlers with the provided bot instance.
 *
 * @param bot - The Telegraf or TelegramBot instance to register handlers on.
 * @param deps - Shared dependencies (game store, logger, timer helpers, etc).
 *
 * Call this from your bot entry to enable X/O game support.
 *
 * Example:
 *   import { registerXoHandlers } from 'src/games/xo';
 *   registerXoHandlers(bot, deps);
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
export function registerXoHandlers(bot: any, deps: any): void {
  // Handlers will be implemented here.
  // Console log for confirmation:
  console.log(
    "[XO] registerXoHandlers called. Registering X/O game handlers..."
  );
  registerXoTelegramHandlers(bot, deps);
}
