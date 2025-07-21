# Development Guide

## Running the Bot

### Development Mode
```bash
pnpm run dev
```

This will start the bot in development mode with proper signal handling.

### Production Mode
```bash
pnpm run build
pnpm start
```

## Signal Handling

The bot has been configured to handle `CTRL+C` properly:

- **Single `CTRL+C`**: Stops the bot gracefully
- **No double `CTRL+C` needed**: The bot exits immediately when receiving a signal
- **Clean shutdown**: All processes are properly terminated

## How It Works

1. The `scripts/dev.sh` script uses `exec` to replace the shell process with the tsx process
2. This ensures that `CTRL+C` signals go directly to the bot process
3. The bot handles `SIGINT` and `SIGTERM` signals and exits immediately
4. No graceful shutdown delay prevents double signal issues

## Troubleshooting

If you still experience issues with double `CTRL+C`:

1. Make sure you're using `pnpm run dev` (not `tsx src/bot.ts` directly)
2. Check that `scripts/dev.sh` is executable: `chmod +x scripts/dev.sh`
3. Ensure no other bot processes are running: `pkill -f "tsx src/bot.ts"` 