# Smart Reply Plugin Enhancement

## Overview

The Smart Reply Plugin has been enhanced with new capabilities for better message management, multi-user broadcasting, and improved error handling.

## New Features

### 1. Force New Message Mode

The `replySmart` function now supports a `forceNewMessage` parameter that allows you to bypass the edit behavior and always send a new message.

```typescript
// Normal behavior - tries to edit existing message
await ctx.replySmart('Hello World');

// Force new message - deletes old message and sends new one
await ctx.replySmart('Hello World', { forceNewMessage: true });
```

### 2. Multi-user Broadcast Support

New `sendOrEditMessageToUsers` function for broadcasting messages to multiple users with individual message tracking.

```typescript
// Broadcast to multiple users
const userIds = [123, 456, 789];
const results = await ctx.sendOrEditMessageToUsers(
  userIds, 
  'Game starting in 5 minutes!',
  { parse_mode: 'HTML' },
  { forceNewMessage: true }
);

// Check results
results.forEach(result => {
  if (result.success) {
    console.log(`Message sent to user ${result.userId}`);
  } else {
    console.log(`Failed to send to user ${result.userId}: ${result.error}`);
  }
});
```

### 3. Enhanced Error Handling

The plugin now handles various error scenarios gracefully:

- **Edit failures**: Automatically falls back to sending new messages
- **Message deletion**: Attempts to delete old messages when forcing new ones
- **Broadcast failures**: Individual user failures don't stop other users from receiving messages

## Usage Examples

### Basic Usage

```typescript
// In a game action handler
async function handleGameUpdate(ctx: GameHubContext) {
  // Update game status - will edit existing message if available
  await ctx.replySmart('Game status: Waiting for players...', {
    reply_markup: generateGameKeyboard()
  });
  
  // Later, force a new message for important notifications
  await ctx.replySmart('Game starting now!', {
    forceNewMessage: true,
    reply_markup: generateStartGameKeyboard()
  });
}
```

### Multi-user Notifications

```typescript
// Notify all players in a room
async function notifyRoomPlayers(ctx: GameHubContext, roomId: string) {
  const players = await getRoomPlayers(roomId);
  const playerIds = players.map(p => p.userId);
  
  const results = await ctx.sendOrEditMessageToUsers(
    playerIds,
    'Your turn to play!',
    { parse_mode: 'HTML' },
    { forceNewMessage: true } // Force notification
  );
  
  // Log any failures
  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    console.log(`Failed to notify ${failures.length} players`);
  }
}
```

### Progressive Updates

```typescript
// Progressive game updates
async function updateGameProgress(ctx: GameHubContext) {
  // First update - creates new message
  await ctx.replySmart('Game started!', {
    reply_markup: generateGameControls()
  });
  
  // Second update - edits the same message
  await ctx.replySmart('Game started! Round 1...', {
    reply_markup: generateGameControls()
  });
  
  // Third update - edits the same message
  await ctx.replySmart('Game started! Round 1... Round 2...', {
    reply_markup: generateGameControls()
  });
  
  // Final notification - forces new message for attention
  await ctx.replySmart('Game finished! Check results below.', {
    forceNewMessage: true,
    reply_markup: generateResultsKeyboard()
  });
}
```

## API Reference

### `replySmart(text: string, options?: SmartReplyOptions): Promise<void>`

Sends or edits a message based on previous message history.

**Parameters:**
- `text`: Message text to send
- `options`: Optional configuration
  - `chatId?: string | number`: Target chat ID (defaults to current chat)
  - `userId?: string`: User ID for message tracking (defaults to current user)
  - `forceNewMessage?: boolean`: Force new message instead of editing (default: false)
  - `reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply`: Keyboard markup
  - `parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2'`: Text parsing mode

### `sendOrEditMessageToUsers(userIds: number[], text: string, messageOptions?: SmartReplyOptions, broadcastOptions?: BroadcastOptions): Promise<BroadcastResult[]>`

Broadcasts a message to multiple users with individual tracking.

**Parameters:**
- `userIds`: Array of user IDs to send messages to
- `text`: Message text to send
- `messageOptions`: Message-specific options
- `broadcastOptions`: Broadcast-specific options (excludes chatId and userId)

**Returns:**
- Array of `BroadcastResult` objects with success/failure status for each user

### `BroadcastResult`

```typescript
interface BroadcastResult {
  userId: number;
  success: boolean;
  error?: string;
}
```

## Migration Guide

### From Old `broadcastToUsers`

**Old way:**
```typescript
await ctx.broadcastToUsers(['123', '456'], 'Hello users!');
```

**New way:**
```typescript
const results = await ctx.sendOrEditMessageToUsers(
  [123, 456], 
  'Hello users!'
);
```

### Adding Force New Message

**Before:**
```typescript
// Always sent new message
await ctx.replySmart('Important notification!');
```

**After:**
```typescript
// Can control whether to edit or force new message
await ctx.replySmart('Important notification!', { forceNewMessage: true });
```

## Best Practices

1. **Use `forceNewMessage: true` for important notifications** that should grab user attention
2. **Use normal mode for progressive updates** to keep chat clean
3. **Handle broadcast results** to log failures and retry if needed
4. **Use appropriate parse modes** for rich text formatting
5. **Consider user experience** - don't spam with too many forced new messages

## Error Handling

The plugin automatically handles common error scenarios:

- **Message too old to edit**: Falls back to new message
- **Message deleted**: Attempts to delete old message, sends new one
- **User blocked bot**: Logs error, continues with other users
- **Network errors**: Retries automatically where appropriate

All errors are logged with context information for debugging.
