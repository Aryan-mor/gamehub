# Poker Button System

## Overview

The Poker Button System provides a dynamic, reusable way to generate Telegram inline keyboards for poker game actions. It supports parameter replacement, custom layouts, and modular button sets.

## Architecture

### Core Components

1. **Button Templates** (`room/_button/buttonTemplates.ts`)
   - Define button appearance and callback data
   - Support dynamic parameters with `{paramName}` syntax

2. **Button Sets** (separate files in each module)
   - Group related buttons for different contexts
   - Examples: `roomControls`, `gameActions`, `raiseOptions`

3. **Helper Functions** (`buttonHelpers.ts`)
   - Generate buttons with parameters
   - Create keyboards with custom layouts

## Usage

### Basic Button Generation

```typescript
import { generatePokerButton } from './buttonHelpers';

// Generate a single button
const callButton = generatePokerButton('call', { roomId: 'room_123' });
// Result: { text: '🃏 Call', callback_data: 'games.poker.room.call?roomId=room_123' }
```

### Keyboard Generation

```typescript
import { generateMainMenuKeyboard } from './buttonHelpers';

// Generate main menu keyboard
const keyboard = generateMainMenuKeyboard();
```

### Custom Layouts

The system supports custom keyboard layouts for better UX:

#### Main Menu Layout (2 buttons per row)
```typescript
const layout = [
  ['create', 'join'],      // Row 1: Create Room | Join Room
  ['list', 'help'],        // Row 2: List Rooms | Poker Help
  ['backToMenu']           // Row 3: Back to Menu (centered)
];
```

#### Room Management Layout (3 buttons per row)
```typescript
const layout = [
  ['start', 'ready', 'notReady'],  // Row 1: Start | Ready | Not Ready
  ['leave', 'back']                // Row 2: Leave | Back
];
```

#### Game Action Layout (2 buttons per row)
```typescript
const layout = [
  ['call', 'fold'],       // Row 1: Call | Fold
  ['raise', 'allIn'],     // Row 2: Raise | All In
  ['back']                // Row 3: Back
];
```

### Creating Custom Layouts

```typescript
import { createCustomKeyboard } from '@/modules/core/buttonHelpers';

// Define your layout
const customLayout = [
  ['action1', 'action2'],     // Row 1: 2 buttons
  ['action3'],                // Row 2: 1 button (centered)
  ['action4', 'action5', 'action6']  // Row 3: 3 buttons
];

// Generate keyboard
const keyboard = createCustomKeyboard(
  customLayout, 
  pokerButtonTemplates, 
  { roomId: 'room_123' }
);
```

## Button Templates

### Room Management
- `create`: Create new poker room
- `join`: Join existing room
- `leave`: Leave current room
- `list`: List available rooms

### Game Actions
- `call`: Call current bet
- `fold`: Fold hand
- `raise`: Raise bet
- `check`: Check (pass without betting)
- `allIn`: All-in bet

### Navigation
- `help`: Show poker help
- `back`: Go back
- `backToMenu`: Return to main menu

## Button Sets

### Room Controls (`room/management/buttonSets.ts`)
```typescript
export const roomControls = {
  mainMenu: ['create', 'join', 'list', 'help', 'backToMenu'],
  roomManagement: ['start', 'ready', 'notReady', 'leave', 'back'],
  creation: ['create', 'backToMenu'],
  joining: ['join', 'list', 'backToMenu'],
  control: ['start', 'ready', 'notReady'],
  exit: ['leave', 'back']
};
```

### Game Actions (`room/game/buttonSets.ts`)
```typescript
export const gameActions = {
  standard: ['call', 'fold', 'raise'],
  withAllIn: ['call', 'fold', 'raise', 'allIn'],
  conservative: ['call', 'fold'],
  aggressive: ['raise', 'allIn'],
  checkOrFold: ['check', 'fold'],
  callOrFold: ['call', 'fold']
};
```

## Benefits

1. **Consistency**: All buttons follow the same pattern
2. **Maintainability**: Easy to update button text or actions
3. **Reusability**: Button sets can be used across different contexts
4. **Flexibility**: Custom layouts for different screen sizes
5. **Type Safety**: TypeScript ensures correct button definitions
6. **Parameter Support**: Dynamic callback data with parameter replacement

## Testing

The system includes comprehensive tests for:
- Button generation with parameters
- Custom layout creation
- Error handling for missing templates
- Button set validation

Run tests with:
```bash
pnpm test src/actions/games/poker/__tests__/buttonSystem.test.ts
```

## Migration from Old System

The new system replaces hardcoded button arrays with:
1. **Templates**: Define button appearance once
2. **Sets**: Group related buttons
3. **Helpers**: Generate keyboards with custom layouts
4. **Parameters**: Dynamic callback data

This makes the code more maintainable and provides better UX with optimized layouts. 