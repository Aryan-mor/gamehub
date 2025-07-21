# GameHub Bot Migration to grammY

## Overview

This project has been successfully migrated from a Next.js/Express.js-style backend to a pure grammY-based Telegram bot architecture with functional programming principles.

## 🏗️ New Architecture

### Core Structure

```
src/
├── core/                    # Core services and utilities
│   ├── types.ts            # Shared TypeScript types
│   ├── logger.ts           # Structured logging with pino
│   ├── userService.ts      # User and coin management
│   ├── gameService.ts      # Game state management
│   └── telegramHelpers.ts  # Telegram API helpers
├── games/                  # Game modules
│   └── dice/               # Dice game implementation
│       ├── types.ts        # Game-specific types
│       ├── startGame.ts    # Game initialization
│       ├── handleTurn.ts   # Turn processing
│       ├── resolveResult.ts # Result resolution
│       ├── handlers.ts     # grammY handlers
│       ├── index.ts        # Module exports
│       └── __tests__/      # Game tests
└── bot.ts                  # Main bot entry point
```

### Key Features

✅ **Pure Functional Programming**
- No classes or side effects
- Pure functions where applicable
- Immutable data structures
- Testable and independent functions

✅ **Strong TypeScript**
- Full type safety
- No `any` types
- Meaningful enums and interfaces
- Strict type checking

✅ **Modular Game Architecture**
- Each game in its own folder
- Consistent interface: `startGame`, `handleTurn`, `resolveResult`
- Shared core services
- Easy to add new games

✅ **Structured Logging**
- Pino logger with pretty formatting
- Function entry/exit logging
- Error tracking with context
- Performance monitoring

✅ **Clean grammY Integration**
- Modern Telegram Bot API
- Middleware support
- Session management ready
- Error handling

## 🎮 Games

### Dice Game
- **Location**: `src/games/dice/`
- **Commands**: `/dice`
- **Features**: 
  - Stake selection (2, 5, 10, 20 coins)
  - Number guessing (1-6)
  - 5x payout for correct guesses
  - Real-time results

### Adding New Games
1. Create folder: `src/games/[gameName]/`
2. Implement required files:
   - `types.ts` - Game-specific types
   - `startGame.ts` - Game initialization
   - `handleTurn.ts` - Turn processing
   - `resolveResult.ts` - Result resolution
   - `handlers.ts` - grammY handlers
   - `index.ts` - Module exports
3. Register handlers in `src/bot.ts`
4. Add tests in `__tests__/`

## 🚀 Running the Bot

### Development
```bash
pnpm bot
```

### Production
```bash
pnpm build
pnpm start
```

### Testing
```bash
# Run all tests
pnpm test:run

# Run specific game tests
pnpm test:run src/games/dice/__tests__/dice.test.ts

# Run with coverage
pnpm test:coverage
```

## 📊 Database Schema

### Users
```typescript
interface User {
  id: string;
  username?: string;
  name?: string;
  coins: number;
  lastFreeCoinAt?: number;
  createdAt: number;
  updatedAt: number;
}
```

### Games
```typescript
interface GameState {
  id: string;
  type: GameType;
  status: GameStatus;
  players: Player[];
  currentPlayerIndex: number;
  stake: number;
  createdAt: number;
  updatedAt: number;
  data: Record<string, unknown>;
  result?: GameResult;
}
```

## 🔧 Configuration

### Environment Variables
```bash
TELEGRAM_BOT_TOKEN=your_bot_token
FIREBASE_API_KEY=your_firebase_key
FIREBASE_DATABASE_URL=your_firebase_url
LOG_LEVEL=info
```

### Firebase Setup
- Uses Firebase Realtime Database
- Collections: `users`, `games`
- Automatic user creation
- Transaction-safe coin operations

## 🧪 Testing

### Test Structure
- Unit tests for each function
- Mocked dependencies
- Coverage for normal flows
- Error case testing

### Running Tests
```bash
# All tests
pnpm test:run

# Specific test file
pnpm test:run src/games/dice/__tests__/dice.test.ts

# Watch mode
pnpm test

# Coverage
pnpm test:coverage
```

## 📈 Migration Benefits

1. **Performance**: grammY is faster than node-telegram-bot-api
2. **Type Safety**: Full TypeScript support with grammY
3. **Maintainability**: Functional programming makes code easier to test and maintain
4. **Scalability**: Modular architecture allows easy addition of new games
5. **Reliability**: Structured logging and error handling
6. **Modern**: Uses latest Telegram Bot API features

## 🔄 Migration Status

✅ **Completed**
- Core architecture migration
- User service with Firebase
- Game service with state management
- Dice game implementation
- Structured logging
- TypeScript strict mode
- Test coverage
- grammY integration

🔄 **In Progress**
- Additional games (blackjack, football, basketball)
- Admin commands
- Advanced features

📋 **Planned**
- Session management
- Rate limiting
- Advanced game features
- Analytics and monitoring

## 🛠️ Development

### Adding New Commands
1. Add handler in `src/bot.ts`
2. Use `extractUserInfo` for user data
3. Use `sendMessage` for responses
4. Add logging with context

### Adding New Games
1. Follow the dice game pattern
2. Implement required functions
3. Add grammY handlers
4. Write comprehensive tests
5. Register in main bot

### Best Practices
- Always use TypeScript strict mode
- Write tests for new functions
- Use structured logging
- Follow functional programming principles
- Keep functions pure when possible
- Handle errors gracefully

## 📝 Notes

- The old Next.js backend code remains in `src/app/` for reference
- UI pages are preserved for admin purposes
- All bot logic has been migrated to grammY
- Firebase Realtime Database is used for persistence
- Pino is used for structured logging
- Vitest is used for testing

This migration provides a solid foundation for a scalable, maintainable Telegram game bot with modern architecture and best practices. 