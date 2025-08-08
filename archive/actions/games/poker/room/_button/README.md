# Poker Room Button System

This directory contains the organized button system for the Poker room actions.

## Structure

```
src/actions/games/poker/room/
├── _button/
│   ├── buttonTemplates.ts    # Core button templates
│   └── README.md            # This file
├── _middleware/             # Room middleware
├── call/
│   └── index.ts
├── fold/
│   └── index.ts
├── raise/
│   ├── buttonSets.ts        # Raise-specific button sets
│   └── index.ts
├── game/
│   ├── buttonSets.ts        # Game action button sets
│   └── index.ts
├── management/
│   └── buttonSets.ts        # Room management button sets
├── gameEnd/
│   └── buttonSets.ts        # Game end button sets
└── ...
```

## Button Templates

The `buttonTemplates.ts` file contains all button definitions with dynamic parameters:

```typescript
export const pokerButtonTemplates: Record<string, ButtonTemplate> = {
  call: {
    text: '🃏 Call',
    callback_data: 'games.poker.room.call?roomId={roomId}'
  },
  // ... more templates
};
```

## Button Sets Organization

Button sets are now organized by functionality with simplified naming:

### 1. Room Management (`management/buttonSets.ts`)
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

### 2. Game Actions (`game/buttonSets.ts`)
```typescript
export const gameActions = {
  standard: ['call', 'fold', 'raise', 'check'],
  withAllIn: ['call', 'fold', 'raise', 'check', 'allIn'],
  conservative: ['call', 'fold', 'check'],
  aggressive: ['call', 'fold', 'raise', 'allIn'],
  checkOrFold: ['check', 'fold'],
  callOrFold: ['call', 'fold']
};
```

### 3. Raise Actions (`raise/buttonSets.ts`)
```typescript
export const raiseOptions = {
  all: ['raise5', 'raise10', 'raise25', 'raise50', 'raise100'],
  quick: ['raise5', 'raise10', 'raise25'],
  high: ['raise50', 'raise100'],
  low: ['raise5', 'raise10'],
  medium: ['raise25', 'raise50']
};
```

### 4. Stake Selection (`stake/buttonSets.ts`)
```typescript
export const stakeOptions = {
  standard: ['stake2', 'stake5', 'stake10', 'stake20', 'stake50'],
  low: ['stake2', 'stake5', 'stake10'],
  high: ['stake20', 'stake50'],
  quick: ['stake5', 'stake10', 'stake20'],
  all: ['stake2', 'stake5', 'stake10', 'stake20', 'stake50']
};
```

### 5. Game End (`gameEnd/buttonSets.ts`)
```typescript
export const gameEndOptions = {
  standard: ['playAgain', 'newGame', 'viewStats', 'back'],
  playAgain: ['playAgain', 'newGame', 'back'],
  analysis: ['viewStats', 'playAgain', 'back'],
  quickRestart: ['playAgain', 'back'],
  full: ['playAgain', 'newGame', 'viewStats', 'back']
};
```

## Usage Examples

### Using Button Sets in Actions

```typescript
import { generateCustomPokerKeyboard } from '../../buttonHelpers';
import { raiseOptions } from './buttonSets';

// In your action handler
const keyboard = generateCustomPokerKeyboard(
  raiseOptions.quick, 
  { roomId: 'room_123' }, 
  true
);
```

### Conditional Button Sets

```typescript
// Show different button sets based on game state
let keyboard;
if (canRaiseMore) {
  keyboard = generateCustomPokerKeyboard(
    raiseOptions.quick, 
    { roomId }, 
    true
  );
} else {
  keyboard = generateCustomPokerKeyboard(
    raiseOptions.high, 
    { roomId }, 
    true
  );
}
```

### Using Predefined Helpers

```typescript
import { 
  generateGameActionKeyboard,
  generateRaiseAmountKeyboard,
  generateStakeSelectionKeyboard 
} from '../../buttonHelpers';

// Generate keyboards using predefined helpers
const gameKeyboard = generateGameActionKeyboard('room_123', false);
const raiseKeyboard = generateRaiseAmountKeyboard('room_123');
const stakeKeyboard = generateStakeSelectionKeyboard();
```

## Naming Convention

### Before (Complex)
```typescript
raiseButtonSets.quickRaise
gameButtonSets.gameActionsWithAllIn
roomManagementButtonSets.roomCreation
stakeButtonSets.highStakes
gameEndButtonSets.playAgainOptions
```

### After (Simple)
```typescript
raiseOptions.quick
gameActions.withAllIn
roomControls.creation
stakeOptions.high
gameEndOptions.playAgain
```

## Benefits of This Structure

1. **Modularity**: Each action has its own button sets
2. **Maintainability**: Easy to find and modify button sets
3. **Reusability**: Button sets can be shared between actions
4. **Organization**: Clear separation of concerns
5. **Extensibility**: Easy to add new button sets for new actions
6. **Simplicity**: Short, intuitive names that are easy to understand

## Adding New Button Sets

To add a new button set:

1. Create a new `buttonSets.ts` file in the appropriate directory
2. Define your button sets with simple, descriptive names
3. Import and use them in your action handlers
4. Optionally add them to the main `buttonHelpers.ts` exports

Example:
```typescript
// newAction/buttonSets.ts
export const newActionOptions = {
  basic: ['option1', 'option2'],
  advanced: ['option1', 'option2', 'option3'],
  // ...
};
```

## Best Practices

1. **Naming**: Use short, descriptive names (e.g., `quick`, `high`, `standard`)
2. **Organization**: Group related buttons together
3. **Reusability**: Create generic sets that can be reused
4. **Documentation**: Document complex button set logic
5. **Testing**: Test button set generation and usage
6. **Consistency**: Follow the same naming pattern across all button sets 