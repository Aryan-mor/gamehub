# 🎴 Card Image Service

A standalone service for generating and sending card images to Telegram channels. This service can be used independently or imported into other projects.

## 📁 Structure

```
card-image-service/
├── src/
│   ├── index.ts                 # Main exports
│   ├── generateAndSendCard.ts   # Core service logic
│   ├── config.ts                # Configuration loader
│   ├── logger.ts                # Logging utilities
│   ├── cache.ts                 # Image caching system
│   ├── telegram.ts              # Telegram API service
│   ├── types.ts                 # TypeScript interfaces
│   ├── bot.ts                   # Standalone bot
│   └── image/
│       └── composer.ts          # Image generation logic
├── assets/
│   ├── card/                    # Card images by style
│   │   └── general/            # General style cards
│   └── card_area/              # Background images by area
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Quick Start

### 1. Installation

```bash
cd card-image-service
pnpm install
```

### 2. Configuration

Copy the environment example and configure your bot:

```bash
cp env.example .env
```

Edit `.env`:
```env
BOT_TOKEN=your_card_image_bot_token_here
TARGET_CHANNEL_ID=@your_channel_username_or_id
LOG_LEVEL=info
```

### 3. Add Card Images

Place your card images in the following structure:

```
assets/
├── card/
│   └── general/                # Style name
│       ├── 2_of_clubs.png
│       ├── 3_of_clubs.png
│       ├── ace_of_hearts.png
│       └── ...
└── card_area/
    ├── general.png             # Area name
    ├── club.png
    └── ...
```

### 4. Usage

#### As a Standalone Service

```bash
# Start the bot
pnpm dev

# Build and run
pnpm build
pnpm start
```

#### As an Imported Module

```typescript
import { generateAndSendCard, generateImageBufferOnly } from './card-image-service';

// Generate and send card image
const messageId = await generateAndSendCard(
  ['ace_of_hearts', 'king_of_spades', 'queen_of_diamonds'],
  'general',  // style
  'club',     // area
  'Player Hand' // debug tag
);

// Generate image buffer only (for testing)
const imageBuffer = await generateImageBufferOnly(
  ['2_of_clubs', '3_of_hearts'],
  'general',
  'general'
);
```

## 🔧 API Reference

### `generateAndSendCard(cards, style?, area?, debugTag?)`

Generates a card image and sends it to the configured Telegram channel.

**Parameters:**
- `cards: string[]` - Array of card filenames (without extension)
- `style?: string` - Card style (default: 'general')
- `area?: string` - Background area (default: 'general')
- `debugTag?: string` - Optional debug tag for the image

**Returns:** `Promise<string>` - The message ID of the sent image

**Example:**
```typescript
const messageId = await generateAndSendCard(
  ['ace_of_hearts', 'king_of_spades'],
  'general',
  'club',
  'Player Hand'
);
```

### `generateImageBufferOnly(cards, style?, area?, debugTag?)`

Generates an image buffer without sending to Telegram (useful for testing).

**Parameters:** Same as `generateAndSendCard`

**Returns:** `Promise<Buffer>` - The generated image buffer

### `getCacheStats()`

Returns cache statistics.

**Returns:** `{ totalEntries: number, expiredEntries: number }`

### `clearCache()`

Clears the image cache.

## 🎨 Image Structure

### Card Images
- **Path:** `assets/card/{style}/{card_name}.png`
- **Style:** Determines the visual style of cards (e.g., 'general', 'blue', 'red')
- **Card Names:** Standard card names like 'ace_of_hearts', '2_of_clubs', etc.

### Background Images
- **Path:** `assets/card_area/{area}.png`
- **Area:** Determines the background for the card composition

## 💾 Caching

The service includes an intelligent caching system:

- **Cache Duration:** 24 hours
- **Cache Key:** Hash of cards, style, area, and debug tag
- **Cache Storage:** JSON file (`cache.json`)
- **Benefits:** Avoids regenerating identical images

## 🔍 Debugging

### Logging
The service uses structured logging with different levels:
- `info` - General operations
- `error` - Error conditions
- `debug` - Detailed debugging information

### Cache Commands
When running as a bot, you can use these commands:
- `/cache` - Show cache statistics
- `/clearcache` - Clear the cache
- `/status` - Check bot status

## 🧪 Testing

```bash
# Run tests
pnpm test

# Run with coverage
pnpm test:coverage
```

## 📦 Building

```bash
# Build the project
pnpm build

# Type checking
pnpm type-check

# Linting
pnpm lint
```

## 🔗 Integration with Main Project

To use this service in your main project:

1. **Add to tsconfig.json paths:**
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/card-image-service/*": ["./card-image-service/src/*"]
    }
  }
}
```

2. **Import and use:**
```typescript
import { generateAndSendCard } from '@/card-image-service';

// In your game logic
const messageId = await generateAndSendCard(
  playerCards,
  'general',
  'club',
  `Player ${playerName} Hand`
);
```

## 🚨 Error Handling

The service includes comprehensive error handling:

- **Missing Images:** Throws descriptive errors for missing card/background images
- **Telegram Errors:** Handles API failures gracefully
- **Cache Errors:** Continues operation even if cache fails
- **Configuration Errors:** Validates environment variables on startup

## 📝 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BOT_TOKEN` | Yes | Telegram bot token for the card image service |
| `TARGET_CHANNEL_ID` | Yes | Channel ID or username where images are sent |
| `LOG_LEVEL` | No | Logging level (default: 'info') |

## 🤝 Contributing

1. Follow the existing code structure
2. Add proper logging to all functions
3. Include TypeScript types for all new features
4. Test thoroughly before submitting
5. Update documentation for new features

## 📄 License

This project is part of the GameHub ecosystem and follows the same licensing terms. 