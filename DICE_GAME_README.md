# 🎲 Dice Guess Game Implementation

## Overview

A new 1-player dice game has been added to the Telegram bot using Telegram's 🎲 emoji dice.

## Game Rules

- User guesses the outcome of a Telegram dice roll
- Winnings depend on the accuracy and type of guess:
  - **Exact values (1-6)**: 4× reward
  - **Ranges (ODD/EVEN/1-3/4-6)**: 2× reward
- 10% bot fee applied to winnings

## Commands

- `/dice_game` - Start a new dice game
- `/dice_stats` - Show your dice game statistics

## Game Flow

1. User chooses stake: 2, 5, 10, or 20 Coins
2. User selects their guess from available options
3. Bot sends 🎲 emoji using `ctx.replyWithDice('🎲')`
4. Telegram responds with dice value (1-6)
5. Result is calculated and displayed
6. Winnings are credited (minus 10% fee)

## Database Structure

- **diceGames** table: Stores game state, guesses, results, and rewards
- **transfers** table: Logs all coin transactions (stake, win, fee)
- **users** table: Updated with new balances

## Files Added/Modified

- `src/bot/games/dice.ts` - Core dice game logic and database operations
- `src/bot/games/diceHandlers.ts` - Command handlers for dice game
- `src/games/xo/handlers.ts` - Added dice callback handlers to existing X/O handler
- `src/bot/index.ts` - Added dice game registration and commands

## Integration

The dice game is fully integrated with the existing coin system and follows the same patterns as the X/O game:

- Uses `adjustCoins()` for balance management
- Logs transfers to the TRANSFERS table
- Follows the same error handling patterns
- Compatible with inline queries and private chats

## Testing

The game can be tested by:

1. Running `/dice_game` in the bot
2. Using inline queries with "dice" or "🎲"
3. Checking `/dice_stats` for statistics

## Future Enhancements

- Add more dice game variants
- Implement leaderboards
- Add achievements for winning streaks
