# Room Creation System

## Overview

The Room Creation System provides a comprehensive form-based interface for creating poker rooms in the Telegram bot. It follows a step-by-step wizard approach to collect all necessary information from users.

## Features

### ✅ Form-Based Room Creation
- **Step-by-step wizard**: Guides users through room creation process
- **Real-time validation**: Validates input at each step
- **Persian language support**: All messages and validation in Persian
- **Inline keyboard navigation**: Easy button-based navigation

### ✅ Room Configuration Options
- **Room Name**: 3-30 characters, required
- **Privacy Setting**: Public or Private rooms
- **Player Limit**: 2, 4, 6, or 8 players
- **Small Blind**: 1-1000 coins (Big Blind = 2 × Small Blind)
- **Turn Timeout**: 30-600 seconds per turn

### ✅ Validation & Security
- **Input validation**: Comprehensive validation for all fields
- **Active room check**: Prevents users from creating multiple active rooms
- **Type safety**: Full TypeScript support with custom ID types
- **Error handling**: User-friendly error messages

### ✅ User Experience
- **Message editing**: Updates existing messages instead of sending new ones
- **Progress tracking**: Shows form completion progress
- **Confirmation step**: Final review before room creation
- **Invite functionality**: Easy sharing with friends

## Architecture

### File Structure
```
src/actions/games/poker/room/create/
├── index.ts              # Main handler and form logic
├── textHandler.ts        # Text input processing
├── buttonSets.ts         # Form button configurations
└── README.md            # This file

src/actions/games/poker/utils/
├── roomValidation.ts     # Form validation logic
├── formStateManager.ts   # Form state management
└── formKeyboardGenerator.ts # Keyboard generation

src/actions/games/poker/room/share/
└── index.ts             # Room sharing functionality
```

### Key Components

#### 1. Form State Management
- **Global state storage**: In-memory Map for form states
- **Step progression**: Automatic advancement through form steps
- **Data persistence**: Maintains form data across interactions

#### 2. Validation System
- **Field-level validation**: Individual field validation functions
- **Form-level validation**: Complete form validation
- **Error reporting**: Structured error messages with field mapping

#### 3. Keyboard Generation
- **Dynamic keyboards**: Context-aware button layouts
- **Form step keyboards**: Specific keyboards for each form step
- **Invite keyboards**: Special keyboards for sharing functionality

## Usage Flow

### 1. Form Initiation
```
User clicks "Create Room" → handleCreate() → Show name input step
```

### 2. Form Navigation
```
User provides input → handleFormStep() → Update state → Show next step
```

### 3. Text Input Handling
```
User types room name → handleRoomNameInput() → Validate → Move to next step
```

### 4. Form Completion
```
User confirms → handleConfirmCreate() → Validate → Create room → Show success
```

### 5. Room Sharing
```
User clicks "Invite Friends" → handleShare() → Generate invite message
```

## API Reference

### Main Handler Functions

#### `handleCreate(context, query)`
Initiates the room creation form.

#### `handleFormStep(context, query)`
Processes form step navigation and data input.

#### `handleConfirmCreate(context, query)`
Handles form confirmation and room creation.

#### `handleRoomNameInput(context, text)`
Processes text input for room name.

### Validation Functions

#### `validateRoomName(name: string): string | null`
Validates room name (3-30 characters).

#### `validateSmallBlind(amount: number): string | null`
Validates small blind amount (1-1000).

#### `validateTurnTimeout(timeout: number): string | null`
Validates turn timeout (30-600 seconds).

#### `validateMaxPlayers(maxPlayers: number): string | null`
Validates max players (2, 4, 6, or 8).

#### `validateRoomForm(formData): RoomValidationResult`
Validates complete form data.

### State Management Functions

#### `updateFormState(state, field, value): FormState`
Updates form state with new data.

#### `isFormComplete(data): boolean`
Checks if form is complete.

#### `getFormProgress(state): number`
Gets form completion percentage.

## Data Types

### `CreateRoomFormData`
```typescript
interface CreateRoomFormData {
  name: string;           // Room name (3-30 chars)
  isPrivate: boolean;     // Privacy setting
  maxPlayers: 2 | 4 | 6 | 8; // Player limit
  smallBlind: number;     // Small blind amount
  turnTimeoutSec: number; // Turn timeout in seconds
}
```

### `FormState`
```typescript
interface FormState {
  step: FormStep;         // Current form step
  data: Partial<CreateRoomFormData>; // Form data
  isComplete: boolean;    // Form completion status
}
```

### `RoomValidationResult`
```typescript
interface RoomValidationResult {
  isValid: boolean;       // Overall validation status
  errors: RoomValidationError[]; // Validation errors
}
```

## Error Handling

### Validation Errors
- **Field-specific errors**: Each field has specific validation rules
- **Persian error messages**: User-friendly error messages in Persian
- **Error recovery**: Users can correct errors and continue

### System Errors
- **Graceful degradation**: Fallback messages for system errors
- **Error logging**: Comprehensive error logging for debugging
- **User feedback**: Clear error messages to users

## Testing

### Unit Tests
```bash
pnpm test tests/unit/roomCreation.test.ts
```

### Test Coverage
- ✅ Room name validation
- ✅ Small blind validation
- ✅ Turn timeout validation
- ✅ Max players validation
- ✅ Complete form validation
- ✅ Error handling scenarios

## Future Enhancements

### Planned Features
- **Redis state storage**: Replace in-memory storage with Redis
- **Form templates**: Predefined room configurations
- **Advanced validation**: More sophisticated validation rules
- **Analytics**: Track form completion rates and user behavior

### Potential Improvements
- **Form persistence**: Save draft forms for later completion
- **Bulk room creation**: Create multiple rooms at once
- **Room templates**: Save and reuse room configurations
- **Advanced sharing**: More sharing options and integrations

## Integration Points

### Router Integration
- **Auto-discovery**: Handlers self-register with compact router
- **Action codes**: Uses compact action codes for efficiency
- **Callback data**: Optimized callback data for Telegram limits

### Database Integration
- **Firebase**: Room storage in Firebase Realtime Database
- **Room structure**: Compatible with existing room schema
- **ID generation**: Uses nanoid for unique room IDs

### Bot Integration
- **Message handling**: Integrates with main bot message handler
- **Command processing**: Works with existing command structure
- **Error handling**: Uses centralized error handling system

## Security Considerations

### Input Sanitization
- **Text trimming**: Automatic whitespace removal
- **Length limits**: Enforced character limits
- **Type validation**: Strict type checking for all inputs

### Access Control
- **Active room check**: Prevents multiple active rooms per user
- **User validation**: Validates user permissions
- **Room ownership**: Tracks room creator for management

### Data Protection
- **State cleanup**: Automatic cleanup of form states
- **Error isolation**: Isolated error handling per user
- **Memory management**: Efficient memory usage patterns 