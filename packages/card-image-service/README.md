# 🎴 Card Image Service

A standalone service for generating and sending card images to Telegram channels. This service is designed to work as an API for the main GameHub project, not for direct user interaction.

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
│   ├── bot.ts                   # Simple health check bot
│   ├── example-usage.ts         # Usage examples
│   └── image/
│       └── composer.ts          # Image generation logic
├── assets/
│   ├── card/                    # Card images by style
│   │   └── general/            # General style cards
│   └── card_area/              # Background images by area
├── package.json
├── tsconfig.json
├── eslint.config.mjs
├── .gitignore
├── env.example
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
# Start the bot (for health check only)
pnpm dev

# Build and run
pnpm build
pnpm start
```

#### As an Imported Module

```typescript
import { generateAndSendCard, regenerateCardImage } from './card-image-service';

// Generate PNG image as photo (compressed)
const messageId1 = await generateAndSendCard(
  ['ace_of_hearts', 'king_of_spades', 'queen_of_diamonds'],
  'general',  // style
  'club',     // area
  'Player Hand', // debug tag
  'png',      // format
  false,      // transparent
  false       // asDocument (photo mode)
);

// Generate WebP image as document (no compression)
const messageId2 = await generateAndSendCard(
  ['ace_of_hearts', 'king_of_spades'],
  'general',
  'general',
  'Player Hand (Document)',
  'webp',     // format
  true,       // transparent
  true        // asDocument (document mode)
);
```

## 🔧 API Reference

### `generateAndSendCard(cards, style?, area?, debugTag?, format?, transparent?, asDocument?)`

Generates a card image and sends it to the configured Telegram channel. Uses caching to avoid regenerating identical images.

**Parameters:**
- `cards: string[]` - Array of card filenames (without extension)
- `style?: string` - Card style (default: 'general')
- `area?: string` - Background area (default: 'general')
- `debugTag?: string` - Optional debug tag for the image
- `format?: 'png' | 'webp'` - Output format (default: 'png')
- `transparent?: boolean` - Use transparent background (default: false)
- `asDocument?: boolean` - Send as document instead of photo (default: false)

**Returns:** `Promise<string>` - The message ID of the sent image

**Examples:**
```typescript
// PNG as photo (compressed)
const messageId1 = await generateAndSendCard(
  ['ace_of_hearts', 'king_of_spades'],
  'general',
  'club',
  'Player Hand',
  'png',
  false,
  false  // asDocument: false (photo mode)
);

// WebP as document (no compression)
const messageId2 = await generateAndSendCard(
  ['ace_of_hearts', 'king_of_spades'],
  'general',
  'general',
  'Player Hand',
  'webp',
  true,
  true   // asDocument: true (document mode)
);
```

### `regenerateCardImage(cards, style?, area?, debugTag?, format?, transparent?, asDocument?)`

Forces regeneration of an image, bypassing cache. Useful when the original messageId is no longer valid.

**Parameters:** Same as `generateAndSendCard`

**Returns:** `Promise<string>` - The new message ID of the sent image

### `generateImageBufferOnly(cards, style?, area?, debugTag?, format?, transparent?)`

Generates an image buffer without sending to Telegram (useful for testing).

**Parameters:** Same as `generateAndSendCard` (except asDocument)

**Returns:** `Promise<Buffer>` - The generated image buffer

### `getCacheStats()`

Returns cache statistics.

**Returns:** `{ totalEntries: number, expiredEntries: number }`

### `clearCache()`

Clears the image cache.

## 🎨 Image Formats & Backgrounds

### Supported Formats:
- **PNG** - Lossless format with alpha channel support
- **WebP** - Modern format with better compression

### Background Options:
- **With Background** (`transparent: false`) - Uses area background or fallback green
- **Transparent** (`transparent: true`) - Creates transparent background

### Sending Modes:
- **Photo Mode** (`asDocument: false`) - Telegram compresses the image
- **Document Mode** (`asDocument: true`) - No compression, original quality preserved

### WebP Features:
- **Lossless Mode** - Used automatically for transparent images
- **Quality 90** - Used for non-transparent images
- **Alpha Channel** - Full transparency support

## 🎨 Image Structure

### Card Images
- **Path:** `assets/card/{style}/{card_name}.png`
- **Style:** Determines the visual style of cards (e.g., 'general', 'blue', 'red')
- **Card Names:** Standard card names like 'ace_of_hearts', '2_of_clubs', etc.

### Background Images
- **Path:** `assets/card_area/{area}.png`
- **Area:** Determines the background for the card composition
- **Note:** Ignored when `transparent: true`

## 💾 Caching

The service includes an intelligent caching system:

- **Cache Duration:** 24 hours
- **Cache Key:** Hash of cards, style, area, debug tag, format, transparency, and document mode
- **Cache Storage:** JSON file (`cache.json`)
- **Benefits:** Avoids regenerating identical images
- **Regeneration:** Use `regenerateCardImage()` to force new generation

## 🔍 Debugging

### Logging
The service uses structured logging with different levels:
- `info` - General operations
- `error` - Error conditions
- `debug` - Detailed debugging information

### Health Check
When running as a bot, you can use:
- `/start` - Check if bot is active

### Example Usage
Run the example to test the service:
```bash
pnpm build
node dist/example-usage.js
```

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
import { generateAndSendCard, regenerateCardImage } from '@/card-image-service';

// In your game logic - PNG as photo (compressed)
const messageId1 = await generateAndSendCard(
  playerCards,
  'general',
  'club',
  `Player ${playerName} Hand`,
  'png',
  false,
  false  // photo mode
);

// WebP as document (no compression, best quality)
const messageId2 = await generateAndSendCard(
  playerCards,
  'general',
  'general',
  `Player ${playerName} Hand`,
  'webp',
  true,
  true   // document mode
);

// If messageId becomes invalid, regenerate
try {
  // Try to use existing messageId
} catch (error) {
  const newMessageId = await regenerateCardImage(
    playerCards,
    'general',
    'club',
    `Player ${playerName} Hand`,
    'webp',
    true,
    true   // document mode
  );
}
```

## 🚨 Error Handling

The service includes comprehensive error handling:

- **Missing Images:** Throws descriptive errors for missing card/background images
- **Telegram Errors:** Handles API failures gracefully
- **Cache Errors:** Continues operation even if cache fails
- **Configuration Errors:** Validates environment variables on startup
- **Invalid MessageId:** Use `regenerateCardImage()` to get new messageId
- **Format Errors:** Validates format and transparency combinations

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