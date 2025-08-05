import { HandlerContext } from '@/modules/core/handler';
import { tryEditMessageText } from '@/modules/core/telegramHelpers';
import { generateMainMenuKeyboard } from '../buttonHelpers';
import { getPlayerStatistics } from '../services/gameResultService';
import { validatePlayerId } from '../_utils/typeGuards';

// Export the action key for consistency and debugging
export const key = 'games.poker.stats';

/**
 * Handle poker statistics display
 */
async function handleStats(context: HandlerContext): Promise<void> {
  const { user, ctx } = context;
  
  try {
    // Validate user ID
    const validatedPlayerId = validatePlayerId(user.id.toString());
    
    // Get player statistics
    const stats = await getPlayerStatistics(validatedPlayerId);
    
    // Calculate win rate percentage
    const winRatePercent = stats.gamesPlayed > 0 ? (stats.gamesWon / stats.gamesPlayed * 100).toFixed(1) : '0.0';
    
    // Format chip changes
    const chipsWonDisplay = stats.totalChipsWon > 0 ? `+${stats.totalChipsWon}` : `${stats.totalChipsWon}`;
    const chipsLostDisplay = stats.totalChipsLost < 0 ? `${stats.totalChipsLost}` : `-${stats.totalChipsLost}`;
    
    // Create display name from first_name + last_name for privacy
    let displayName = 'Unknown Player';
    if (ctx.from?.first_name) {
      displayName = ctx.from.first_name;
      if (ctx.from.last_name) {
        displayName += ` ${ctx.from.last_name}`;
      }
    } else if (user.username) {
      displayName = user.username;
    }
    
    const message = `📊 <b>Poker Statistics</b>\n\n` +
      `👤 <b>Player:</b> ${displayName}\n\n` +
      `🎮 <b>Game Stats:</b>\n` +
      `• Games Played: ${stats.gamesPlayed}\n` +
      `• Games Won: ${stats.gamesWon}\n` +
      `• Win Rate: ${winRatePercent}%\n\n` +
      `💰 <b>Chip Stats:</b>\n` +
      `• Total Chips Won: ${chipsWonDisplay}\n` +
      `• Total Chips Lost: ${chipsLostDisplay}\n` +
      `• Net Change: ${stats.totalChipsWon + stats.totalChipsLost}\n\n` +
      `🏆 <b>Best Hand:</b>\n` +
      `• ${stats.bestHand}\n\n` +
      `💡 <b>Tips:</b>\n` +
      `• Play more games to improve your stats\n` +
      `• Focus on position and pot odds\n` +
      `• Don't chase draws without proper odds`;
    
    const keyboard = generateMainMenuKeyboard();
    
    await tryEditMessageText(ctx, message, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
  } catch (error) {
    console.error('Statistics display error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    await tryEditMessageText(ctx, `❌ Failed to show statistics: ${errorMessage}`);
  }
}

export default handleStats; 