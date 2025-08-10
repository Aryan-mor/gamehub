# sendOrUpdateMessage Helper Function

## Overview

The `sendOrUpdateMessage` helper function provides intelligent message management for Telegram bots, allowing you to send new messages or update existing ones based on message tracking. This prevents message spam and provides a better user experience.

## Features

### ✅ Core Functionality
- **Smart Message Management**: Automatically edits existing messages or sends new ones
- **Message Tracking**: Uses database to track message IDs by unique keys
- **Force New Messages**: Option to delete old messages and send new ones
- **Multi-user Broadcasting**: Send messages to multiple users with individual tracking
- **Error Handling**: Graceful fallback when operations fail
- **Type Safety**: Full TypeScript support with proper interfaces

### ✅ Database Integration
- **Message Tracking Table**: Dedicated `message_tracking` table for efficient storage
- **Unique Message Keys**: Track different types of messages separately
- **Automatic Cleanup**: Remove old message references when needed

## Installation & Setup

### 1. Database Migration

Run the migration to create the message tracking table:

```sql
-- This is automatically applied via the migration file
-- supabase/migrations/20250811000000_add_message_tracking.sql
```

### 2. Import the Function

```typescript
import { 
  sendOrUpdateMessage, 
  sendOrUpdateMessageToUsers,
  createMessageKey,
  createGameMessageKey,
  createRoomMessageKey,
  createUserMessageKey,
  type SendPayload,
  type SendOptions,
  type SendResult,
  type BroadcastResult
} from '@/actions/utils/sendOrUpdateMessage';
```

## API Reference

### Interfaces

```typescript
interface SendPayload {
  text: string;
  extra?: {
    reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
    parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
    disable_web_page_preview?: boolean;
    disable_notification?: boolean;
    protect_content?: boolean;
  };
}

interface SendOptions {
  forceNew?: boolean;
  messageKey: string; // Required: Unique key to track message in DB
}

interface SendResult {
  success: boolean;
  messageId?: number;
  error?: string;
}

interface BroadcastResult {
  userId: number;
  success: boolean;
  messageId?: number;
  error?: string;
}
```

### Main Functions

#### `sendOrUpdateMessage(ctx, chatId, payload, options)`

Sends or updates a message for a single user.

**Parameters:**
- `ctx: Context` - grammY context
- `chatId: number` - Target chat ID
- `payload: SendPayload` - Message content and options
- `options: SendOptions` - Message tracking options

**Returns:** `Promise<SendResult>`

#### `sendOrUpdateMessageToUsers(ctx, users, payload, options?)`

Sends or updates messages to multiple users.

**Parameters:**
- `ctx: Context` - grammY context
- `users: number[]` - Array of user IDs
- `payload: SendPayload` - Message content and options
- `options?: SendOptions` - Optional message tracking options

**Returns:** `Promise<BroadcastResult[]>`

### Utility Functions

```typescript
// Create custom message keys
createMessageKey(prefix: string, identifier: string): string

// Predefined message key creators
createGameMessageKey(gameId: string, updateType: string): string
createRoomMessageKey(roomId: string, updateType: string): string
createUserMessageKey(userId: number, notificationType: string): string
```

## Usage Examples

### Basic Usage

```typescript
// Simple message update
const result = await sendOrUpdateMessage(ctx, chatId, {
  text: 'Game status: Waiting for players...'
}, {
  messageKey: 'game_status_123'
});

if (result.success) {
  console.log(`Message sent/updated with ID: ${result.messageId}`);
} else {
  console.error(`Failed to send message: ${result.error}`);
}
```

### Game Status Updates

```typescript
// Progressive game updates
async function updateGameStatus(ctx: Context, gameId: string, status: string) {
  const messageKey = createGameMessageKey(gameId, 'status');
  
  await sendOrUpdateMessage(ctx, chatId, {
    text: `Game ${gameId}: ${status}`,
    extra: {
      parse_mode: 'HTML',
      reply_markup: generateGameKeyboard()
    }
  }, {
    messageKey
  });
}

// Usage
await updateGameStatus(ctx, 'game123', 'Waiting for players...');
await updateGameStatus(ctx, 'game123', 'Game started!');
await updateGameStatus(ctx, 'game123', 'Game finished!');
```

### Force New Messages

```typescript
// Force new message for important notifications
await sendOrUpdateMessage(ctx, chatId, {
  text: '🎉 Congratulations! You won the game!',
  extra: {
    parse_mode: 'HTML',
    reply_markup: generateResultsKeyboard()
  }
}, {
  messageKey: 'game_result_123',
  forceNew: true // Delete old message and send new one
});
```

### Multi-user Broadcasting

```typescript
// Notify all players in a game
async function notifyGamePlayers(ctx: Context, playerIds: number[], message: string) {
  const results = await sendOrUpdateMessageToUsers(ctx, playerIds, {
    text: message,
    extra: {
      parse_mode: 'HTML',
      reply_markup: generateGameActionKeyboard()
    }
  }, {
    messageKey: 'game_notification_123'
  });

  // Check results
  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    console.log(`Failed to notify ${failures.length} players:`, failures);
  }

  return results;
}

// Usage
const playerIds = [123, 456, 789];
await notifyGamePlayers(ctx, playerIds, 'Your turn to play!');
```

### Room Management

```typescript
// Room status updates
async function updateRoomStatus(ctx: Context, roomId: string, status: string) {
  const messageKey = createRoomMessageKey(roomId, 'status');
  
  await sendOrUpdateMessage(ctx, chatId, {
    text: `Room ${roomId}: ${status}`,
    extra: {
      parse_mode: 'HTML',
      reply_markup: generateRoomKeyboard(roomId)
    }
  }, {
    messageKey
  });
}

// Usage
await updateRoomStatus(ctx, 'room456', 'Waiting for players...');
await updateRoomStatus(ctx, 'room456', '2/4 players joined');
await updateRoomStatus(ctx, 'room456', 'Game starting...');
```

### User Notifications

```typescript
// User-specific notifications
async function sendUserNotification(ctx: Context, userId: number, notification: string) {
  const messageKey = createUserMessageKey(userId, 'notification');
  
  return await sendOrUpdateMessage(ctx, userId, {
    text: notification,
    extra: {
      parse_mode: 'HTML'
    }
  }, {
    messageKey,
    forceNew: true // Always send new notification
  });
}

// Usage
await sendUserNotification(ctx, 123456, '🎁 You received 100 coins!');
```

## Best Practices

### 1. Message Key Naming

Use descriptive and unique message keys:

```typescript
// ✅ Good
'game_status_123'
'room_players_456'
'user_notification_789'

// ❌ Bad
'msg1'
'update'
'status'
```

### 2. Force New Messages

Use `forceNew: true` sparingly:

```typescript
// ✅ Use for important notifications
await sendOrUpdateMessage(ctx, chatId, payload, {
  messageKey: 'important_notification',
  forceNew: true
});

// ✅ Use for progressive updates
await sendOrUpdateMessage(ctx, chatId, payload, {
  messageKey: 'game_progress',
  forceNew: false // Default
});
```

### 3. Error Handling

Always check results:

```typescript
const result = await sendOrUpdateMessage(ctx, chatId, payload, options);

if (!result.success) {
  console.error(`Failed to send message: ${result.error}`);
  // Handle error appropriately
}
```

### 4. Broadcasting

Handle individual user failures:

```typescript
const results = await sendOrUpdateMessageToUsers(ctx, users, payload, options);

const failures = results.filter(r => !r.success);
if (failures.length > 0) {
  console.log(`Failed to send to ${failures.length} users:`, failures);
  // Consider retry logic for failed users
}
```

### 5. Message Key Management

Use utility functions for consistent naming:

```typescript
// ✅ Use utility functions
const gameKey = createGameMessageKey(gameId, 'status');
const roomKey = createRoomMessageKey(roomId, 'players');
const userKey = createUserMessageKey(userId, 'notification');

// ❌ Don't hardcode keys
const key = 'game_123_status'; // Hard to maintain
```

## Database Schema

### message_tracking Table

```sql
CREATE TABLE message_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id BIGINT NOT NULL,
  message_key VARCHAR(255) NOT NULL,
  message_id BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(chat_id, message_key)
);
```

### Indexes

```sql
CREATE INDEX idx_message_tracking_chat_id ON message_tracking(chat_id);
CREATE INDEX idx_message_tracking_message_key ON message_tracking(message_key);
CREATE INDEX idx_message_tracking_chat_message_key ON message_tracking(chat_id, message_key);
```

## Error Handling

The function handles various error scenarios:

### Database Errors
- Connection failures
- Constraint violations
- Missing records

### Telegram API Errors
- Message too old to edit
- Message not found
- User blocked bot
- Rate limiting

### Automatic Fallbacks
- Edit failures → Send new message
- Database errors → Continue with new message
- Individual user failures → Continue with other users

## Testing

Run the test suite:

```bash
# Run all tests
pnpm test

# Run specific tests
pnpm test src/__tests__/sendOrUpdateMessage.test.ts

# Run with coverage
pnpm test:coverage
```

## Migration from Existing Code

### From Simple sendMessage

**Before:**
```typescript
await ctx.api.sendMessage(chatId, 'Hello World');
```

**After:**
```typescript
await sendOrUpdateMessage(ctx, chatId, {
  text: 'Hello World'
}, {
  messageKey: 'greeting'
});
```

### From broadcastToUsers

**Before:**
```typescript
for (const userId of userIds) {
  await ctx.api.sendMessage(userId, 'Broadcast message');
}
```

**After:**
```typescript
const results = await sendOrUpdateMessageToUsers(ctx, userIds, {
  text: 'Broadcast message'
}, {
  messageKey: 'broadcast_123'
});
```

## Performance Considerations

- **Sequential Processing**: Multi-user broadcasts process users sequentially to avoid rate limiting
- **Database Indexes**: Proper indexing for fast message key lookups
- **Error Isolation**: Individual user failures don't affect others
- **Memory Efficiency**: No in-memory caching, all state in database

## Troubleshooting

### Common Issues

1. **Message not updating**: Check if `messageKey` is consistent
2. **Database errors**: Verify migration has been applied
3. **Rate limiting**: Consider delays between broadcasts
4. **Permission errors**: Ensure bot has proper permissions

### Debug Mode

Enable detailed logging:

```typescript
// Check the logs for detailed error information
// All errors are logged with context via logError
```

## Contributing

When extending this functionality:

1. Maintain backward compatibility
2. Add comprehensive tests
3. Update documentation
4. Follow TypeScript best practices
5. Handle errors gracefully
