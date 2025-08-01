# Poker Room Middleware System

This directory contains middleware functions for validating poker room actions before they are executed.

## Overview

The middleware system provides a clean separation between validation logic and business logic. Each action handler is wrapped with appropriate middleware functions that validate the request before the main action is executed.

## Middleware Functions

### `isJoined`
- **Purpose**: Validates that the user is a member of the specified room
- **Usage**: Applied to actions that require the user to be in the room (call, fold, raise, leave)
- **Validation**: Checks if user ID exists in the room's player list

### `isNotJoined`
- **Purpose**: Validates that the user is NOT already a member of the specified room
- **Usage**: Applied to join actions to prevent double-joining
- **Validation**: Ensures user is not already in the room's player list

### `isTurn`
- **Purpose**: Validates that it's the user's turn to act
- **Usage**: Applied to game actions that require turn order (call, fold, raise)
- **Validation**: Checks current game state and turn order

## Usage

### Basic Usage
```typescript
import { wrapWithMiddlewares } from '@/modules/core/middleware';
import { isJoined, isTurn } from './_middleware';

async function handleCall(context: HandlerContext, query: Record<string, string>): Promise<void> {
  // Business logic here
}

export default wrapWithMiddlewares(handleCall, [isJoined, isTurn]);
```

### Middleware Order
Middleware functions are executed in the order they are provided in the array. If any middleware throws an error, the execution stops and the error is propagated.

### Available Actions and Their Middleware

| Action | Middleware | Description |
|--------|------------|-------------|
| `call` | `[isJoined, isTurn]` | User must be in room and it must be their turn |
| `fold` | `[isJoined, isTurn]` | User must be in room and it must be their turn |
| `raise` | `[isJoined, isTurn]` | User must be in room and it must be their turn |
| `join` | `[isNotJoined]` | User must not already be in the room |
| `leave` | `[isJoined]` | User must be in the room (can leave anytime) |
| `create` | `[]` | No room-specific validation needed |

## Implementation Notes

### Current State
The middleware functions currently use placeholder implementations that always return `true` for validation. These need to be replaced with actual database/cache queries.

### TODO Items
1. **Database Integration**: Replace placeholder validation functions with actual database queries
2. **Room State Management**: Implement proper room state tracking
3. **Game State Management**: Implement proper game state and turn tracking
4. **Error Handling**: Add more specific error messages and error codes
5. **Performance**: Add caching for frequently accessed room data

### Example Implementation
```typescript
// TODO: Replace with actual implementation
async function validateUserJoined(userId: string, roomId: string): Promise<boolean> {
  const room = await getRoomFromDatabase(roomId);
  return room && room.players.includes(userId);
}
```

## Testing

Run the middleware tests with:
```bash
pnpm test src/actions/games/poker/room/_middleware/__tests__/middleware.test.ts
```

## Architecture Benefits

1. **Separation of Concerns**: Validation logic is separated from business logic
2. **Reusability**: Middleware functions can be reused across different actions
3. **Maintainability**: Easy to modify validation rules without touching action handlers
4. **Testability**: Middleware functions can be tested independently
5. **Consistency**: All actions follow the same validation pattern 