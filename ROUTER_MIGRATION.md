# 🎮 GameHub Hierarchical Router Migration

## 📋 Overview

This document describes the new hierarchical routing system implemented for the GameHub project, starting with the Poker game as the primary example.

## 🏗️ New Project Structure

```
src/
├── core/
│   ├── router.ts              # Main routing system with hierarchical support
│   ├── handler.ts             # Base handler utilities
│   └── utils/
│       └── parseMessageKey.ts # Message key parser
├── games/
│   ├── index.ts               # Main games handler
│   └── poker/                 # Active game (Poker)
│       ├── room/
│       │   ├── call/
│       │   │   └── index.ts   # Call action handler
│       │   ├── join/
│       │   │   └── index.ts   # Join action handler
│       │   ├── leave/
│       │   │   └── index.ts   # Leave action handler
│       │   ├── create/
│       │   │   └── index.ts   # Create action handler
│       │   ├── fold/
│       │   │   └── index.ts   # Fold action handler
│       │   ├── raise/
│       │   │   └── index.ts   # Raise action handler
│       │   └── index.ts       # Room module handler
│       ├── utils/
│       │   ├── getRoomId.ts   # Room ID validation
│       │   └── validateUser.ts # User validation
│       └── index.ts           # Poker game handler
├── global/
│   └── index.ts               # Global utilities and configs
├── financial/
│   └── user-wallet/
│       └── index.ts           # User wallet management
├── main-router.ts             # Main router setup and entry point
└── archive/
    └── games/                 # Archived games
        ├── basketball/
        ├── blackjack/
        ├── bowling/
        ├── dice/
        ├── football/
        └── trivia/
```

## 🔧 Hierarchical Router System

### Message Format
Messages follow the hierarchical pattern: `games.poker.room.call?roomId=123&lang=en`

- **Path**: `games.poker.room.call` (dot-separated)
- **Hierarchy**: `games` → `poker` → `room` → `call`
- **Query**: `roomId=123&lang=en` (URLSearchParams format)

### Routing Flow
```
games.poker.room.call?roomId=123
    ↓
games handler (src/games/index.ts)
    ↓
poker handler (src/games/poker/index.ts)
    ↓
room handler (src/games/poker/room/index.ts)
    ↓
call handler (src/games/poker/room/call/index.ts)
```

### Key Features

1. **Hierarchical Routing**: Each level routes to the next level
2. **Module Handlers**: Each module can handle its own sub-routes
3. **Query Parameter Parsing**: Automatic extraction of URLSearchParams
4. **Error Handling**: Graceful error messages at each level
5. **Type Safety**: Full TypeScript support
6. **Scalable**: Easy to add new games and modules

### Usage Example

```typescript
import { registerModule, dispatch } from '@/core/router';

// Register a module handler
registerModule('games', handleGamesMessage);

// Dispatch a message (automatically routes through hierarchy)
await dispatch('games.poker.room.call?roomId=123', context);
```

## 🎯 Games System Implementation

### Main Games Routes

| Route | Description |
|-------|-------------|
| `games.start` | Show available active games |
| `games.list` | List all games with status |

### Poker Game Routes

| Route | Description |
|-------|-------------|
| `games.poker.start` | Show poker game options |
| `games.poker.help` | Show poker help and rules |
| `games.poker.room.create` | Create a new poker room |
| `games.poker.room.join` | Join an existing room |
| `games.poker.room.leave` | Leave current room |
| `games.poker.room.list` | List available rooms |
| `games.poker.room.call` | Call the current bet |
| `games.poker.room.fold` | Fold current hand |
| `games.poker.room.raise` | Raise the bet |

### Example Usage

```typescript
// Show available games
await handleMessage('games.start', context);

// Show poker options
await handleMessage('games.poker.start', context);

// Create a room
await handleMessage('games.poker.room.create?name=My Room', context);

// Join a room
await handleMessage('games.poker.room.join?roomId=room_123', context);

// Make a call
await handleMessage('games.poker.room.call?roomId=room_123', context);

// Raise with amount
await handleMessage('games.poker.room.raise?roomId=room_123&amount=50', context);
```

## 🧪 Testing

### Router Tests
```bash
npm test src/core/router.test.ts
```

### Poker Game Tests
```bash
npm test src/games/poker/poker.test.ts
```

### Demo Script
```bash
npx tsx src/demo-router.ts
```

## 📦 Migration Notes

### Archived Games
All existing games (basketball, blackjack, bowling, dice, football, trivia) have been moved to `src/archive/games/` with the following comment added:

```typescript
// Archived as part of migration to unified router system (2025-08-01)
```

### Breaking Changes
- Old game handlers are no longer active
- New routing system must be used for all game interactions
- Message format has changed to dot-separated paths with query parameters

## 🚀 Next Steps

1. **Implement Real Poker Logic**: Replace TODO comments with actual game logic
2. **Add Database Integration**: Connect to real database for room and user management
3. **Migrate Other Games**: Gradually migrate archived games to new system
4. **Add Authentication**: Implement proper user authentication and authorization
5. **Add WebSocket Support**: Real-time game updates for multiplayer games

## 🔍 Key Benefits

1. **Hierarchical Architecture**: Each level routes to the next level
2. **Unified Structure**: All modules follow the same folder structure pattern
3. **Modular Design**: Each module handles its own sub-routes
4. **Scalable**: Easy to add new games and modules
5. **Maintainable**: Clear separation of concerns at each level
6. **Testable**: Comprehensive test coverage for each module
7. **Type Safe**: Full TypeScript support throughout
8. **Flexible**: Support for both exact routes and module handlers

## 📝 API Reference

### Router Functions

#### `registerModule(modulePath: string, handler: Function)`
Register a module handler for hierarchical routing.

#### `register(route: string, handler: Function)`
Register a handler for a specific route.

#### `dispatch(messageKey: string, context: HandlerContext)`
Dispatch a message to the appropriate handler through the hierarchy.

#### `parseMessageKey(messageKey: string): ParsedKey`
Parse a message key into path, action, and query components.

### Types

#### `ParsedKey`
```typescript
type ParsedKey = {
  path: string[];         // ['games', 'poker', 'room', 'call']
  action?: string;        // 'call'
  query: Record<string, string>; // { roomId: '123' }
}
```

#### `HandlerContext`
```typescript
interface HandlerContext {
  ctx: Context;
  user: any;
  [key: string]: any;
}
``` 