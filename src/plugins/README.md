# Smart Reply Plugin

This plugin adds a `replySmart` method to the grammY context that intelligently handles message editing and sending.

## Features

- **Smart Message Editing**: Attempts to edit the current message if possible
- **Fallback to New Message**: If editing fails, sends a new message
- **Automatic Context Detection**: Automatically detects chat ID and message ID from context
- **Type Safety**: Fully typed with TypeScript interfaces

## Usage

### 1. Import and Register the Plugin

```typescript
import { Bot } from "grammy";
import { smartReplyPlugin } from "./plugins/smart-reply";
import { SmartContext } from "./types";

const bot = new Bot<SmartContext>("YOUR_BOT_TOKEN");
bot.use(smartReplyPlugin());
```

### 2. Use replySmart in Your Handlers

```typescript
// Basic usage
bot.command("start", async (ctx) => {
  await ctx.replySmart("Welcome to the bot!");
});

// With options
bot.callbackQuery("button", async (ctx) => {
  await ctx.replySmart("Button clicked!", {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [{ text: "New Button", callback_data: "new_action" }]
      ]
    }
  });
});
```

## API Reference

### SmartReplyOptions Interface

```typescript
interface SmartReplyOptions {
  chatId?: number | string;           // Chat ID (auto-detected if not provided)
  messageId?: number;                 // Message ID to edit (auto-detected if not provided)
  reply_markup?: InlineKeyboard;      // Inline keyboard markup
  parse_mode?: "HTML" | "Markdown" | "MarkdownV2"; // Text parsing mode
}
```

### SmartContext Interface

```typescript
interface SmartContext extends Context {
  replySmart(
    text: string,
    options?: SmartReplyOptions
  ): Promise<void>;
}
```

## How It Works

1. **Message ID Detection**: The plugin automatically detects the message ID from:
   - `options.messageId` (if provided)
   - `ctx.callbackQuery?.message?.message_id` (for callback queries)
   - `ctx.msg?.message_id` (for regular messages)

2. **Chat ID Detection**: The plugin automatically detects the chat ID from:
   - `options.chatId` (if provided)
   - `ctx.chat?.id` (from context)

3. **Smart Editing**: 
   - If a message ID is available, it attempts to edit the message
   - If editing fails (e.g., message is too old), it falls back to sending a new message
   - If no message ID is available, it sends a new message

## ESLint Rules

The project includes ESLint rules that enforce the use of `replySmart` instead of direct `ctx.reply()` and `ctx.editMessageText()` calls:

- `Use ctx.replySmart() instead of ctx.reply()`
- `Use ctx.replySmart() instead of ctx.editMessageText()`

These rules help maintain consistency across the codebase and ensure the smart reply functionality is used everywhere.

## Example

See `example-usage.ts` for a complete example of how to use the plugin. 