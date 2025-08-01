# GameHub Architecture Documentation

## 🏗️ Overview

GameHub uses a modern, type-safe architecture with auto-discovery routing and custom ID types. This document outlines the key architectural decisions and patterns used throughout the project.

## 🎯 Core Principles

### 1. Type Safety First
- **No `any` types**: All code must be properly typed
- **No `as` casting**: Use type guards and validation instead
- **Custom ID types**: Never use raw strings for IDs
- **Strict TypeScript**: Enable all strict mode options

### 2. Auto-Discovery Router
- **Zero configuration**: Routes are automatically discovered
- **Folder-based**: Each action is a folder with `index.ts`
- **Export default**: All handlers use default exports
- **Caching**: Discovered handlers are cached for performance

### 3. Hierarchical Structure
- **Logical grouping**: Games → Modules → Actions
- **Scalable**: Easy to add new games and actions
- **Consistent**: Same pattern across all games

## 📁 Directory Structure

```
src/
├── core/                    # Core router and utilities
│   ├── smart-router.ts     # Auto-discovery router
│   ├── handler.ts          # Handler utilities and types
│   └── utils/
│       └── parseMessageKey.ts
├── games/                  # Game modules
│   ├── index.ts           # Main games handler
│   └── {game}/            # Individual games
│       ├── index.ts       # Game-specific handler
│       └── {module}/      # Game modules (room, lobby, etc.)
│           └── {action}/  # Action folders
│               └── index.ts # Action handler (export default)
├── types/                  # Type definitions
│   └── index.ts           # Custom ID types and interfaces
├── utils/                  # Utility functions
│   └── typeGuards.ts      # ID validation and type guards
├── global/                 # Global utilities and configs
├── financial/             # Financial/user wallet systems
└── archive/               # Archived/legacy code
```

## 🔧 Type System

### Custom ID Types
```typescript
// Base ID type - never use string directly for IDs
export type ID = string & {
  uuid: void;
};

// Specific ID types for different entities
export type UserId = ID & { User: void; };
export type RoomId = ID & { Room: void; };
export type GameId = ID & { Game: void; };
export type TransactionId = ID & { Transaction: void; };
```

### Type Guards
```typescript
// Runtime validation with type narrowing
export function isValidUserId(id: string): id is UserId {
  return /^\d+$/.test(id) && id.length > 0;
}

export function isValidRoomId(id: string): id is RoomId {
  return /^room_\d+_\d+$/.test(id);
}
```

### Entity Interfaces
```typescript
export interface Room {
  id: RoomId;
  name: string;
  game_type: string;
  created_by: UserId;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  max_players: number;
  current_players: number;
  status: 'waiting' | 'playing' | 'finished';
}
```

## 🚀 Router System

### Auto-Discovery
The router automatically discovers handlers based on the message key:

```
games.poker.room.call → src/games/poker/room/call/index.ts
games.poker.room.join → src/games/poker/room/join/index.ts
```

### Handler Pattern
All handlers follow this pattern:

```typescript
import { HandlerContext } from '@/core/handler';
import { RoomId, UserId } from '@/types';
import { createRoomId, assertValidUserId } from '@/utils/typeGuards';

async function handleAction(context: HandlerContext, query: Record<string, string>): Promise<void> {
  const { user } = context;
  
  // Validate IDs using type guards
  assertValidUserId(user.id, (id): id is UserId => true, 'User ID validation');
  
  // Implementation
  const roomId: RoomId = createRoomId(Date.now(), user.id);
  
  // Response
  if (context.ctx && context.ctx.reply) {
    await context.ctx.reply(`Action completed: ${roomId}`);
  }
}

export default handleAction;
```

### Router Features
- **Exact matching**: Direct route to handler
- **Pattern matching**: Dynamic routes with parameters
- **Auto-discovery**: Automatic handler loading
- **Module handlers**: Hierarchical routing
- **Caching**: Performance optimization
- **Error handling**: Graceful error management

## 🔒 Security & Validation

### Input Validation
- All query parameters are validated
- ID types are checked at runtime
- User permissions are verified
- Rate limiting is implemented

### Type Safety
- No runtime type errors
- Compile-time type checking
- Custom ID validation
- Proper error handling

## 📝 Development Guidelines

### Creating New Actions
1. Create folder: `src/games/{game}/{module}/{action}/`
2. Create file: `index.ts`
3. Implement handler with `export default`
4. Use proper types and validation
5. Add tests

### Adding New Games
1. Create folder: `src/games/{game}/`
2. Create `index.ts` for game handler
3. Register module with router
4. Create action folders as needed

### ID Management
1. Use custom ID types everywhere
2. Validate IDs with type guards
3. Create IDs with helper functions
4. Never use raw strings for IDs

## 🧪 Testing

### Unit Tests
- Test all handlers individually
- Test type guards and validation
- Test ID creation and validation
- Mock external dependencies

### Integration Tests
- Test router functionality
- Test auto-discovery
- Test end-to-end flows
- Test error handling

### Type Checking
- Ensure no `any` types
- Verify custom ID usage
- Check type guard coverage
- Validate interface compliance

## 🔄 Migration Guide

### From Old Structure
1. Move handlers to action folders
2. Convert to `export default` pattern
3. Update ID types to custom types
4. Remove `any` types and `as` casting
5. Update imports to use `@/` alias

### Testing Migration
1. Update test imports
2. Add type checking tests
3. Verify auto-discovery works
4. Test ID validation

## 🚀 Performance Considerations

### Router Optimization
- Handler caching prevents re-imports
- Lazy loading of handlers
- Efficient pattern matching
- Minimal memory footprint

### Type Safety Benefits
- Compile-time error detection
- No runtime type errors
- Better IDE support
- Easier refactoring

## 🔮 Future Enhancements

### Planned Features
- Dependency injection system
- Middleware support
- Plugin architecture
- WebSocket integration
- GraphQL API

### Scalability
- Microservices architecture
- Database sharding
- Load balancing
- Caching layers

## 📚 Best Practices

### Code Organization
- Keep handlers focused and small
- Use descriptive folder names
- Follow consistent naming conventions
- Document complex logic

### Error Handling
- Use proper error types
- Implement error boundaries
- Log errors with context
- Return user-friendly messages

### Performance
- Cache auto-discovered handlers
- Minimize dynamic imports
- Use efficient data structures
- Profile critical paths

## 🛠️ Tools & Configuration

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Development Tools
- **TypeScript**: Strict type checking
- **ESLint**: Code quality rules
- **Prettier**: Code formatting
- **Vitest**: Testing framework

## 📖 Examples

### Complete Handler Example
```typescript
// src/games/poker/room/bet/index.ts
import { HandlerContext } from '@/core/handler';
import { RoomId, UserId } from '@/types';
import { createRoomId, assertValidUserId, isValidRoomId } from '@/utils/typeGuards';

interface BetQuery {
  roomId: string; // Will be validated as RoomId
  amount: string;
}

async function handleBet(context: HandlerContext, query: Record<string, string>): Promise<void> {
  const { user } = context;
  const { roomId, amount } = query as BetQuery;
  
  // Validate IDs
  assertValidUserId(user.id, (id): id is UserId => true, 'User ID validation');
  
  if (!isValidRoomId(roomId)) {
    throw new Error('Invalid room ID');
  }
  
  const amountNum = parseInt(amount, 10);
  if (isNaN(amountNum) || amountNum <= 0) {
    throw new Error('Invalid bet amount');
  }
  
  // Implementation
  console.log(`User ${user.id} betting ${amountNum} in room ${roomId}`);
  
  // Response
  if (context.ctx && context.ctx.reply) {
    await context.ctx.reply(`Bet placed: ${amountNum} in room ${roomId}`);
  }
}

export default handleBet;
```

This architecture provides a solid foundation for building scalable, type-safe game applications with minimal configuration and maximum developer productivity. 