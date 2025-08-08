# Room Joining System

## Overview

The Room Joining System provides comprehensive functionality for players to join poker rooms through multiple methods: direct room links, public room lists, and Telegram start payloads. It includes extensive validation, security checks, and user-friendly error handling.

## Features

### ✅ Multiple Join Methods
- **Direct Room Links**: Join via room ID in query parameters
- **Public Room Lists**: Join from list of available public rooms
- **Telegram Start Payload**: Join via `room_<roomId>` in bot start command
- **Private Room Access**: Secure access to private rooms via direct links only

### ✅ Comprehensive Validation
- **Active Room Check**: Prevents joining multiple active rooms simultaneously
- **Room Capacity Validation**: Ensures room isn't full before joining
- **Player Duplication Check**: Prevents same player from joining twice
- **Privacy Validation**: Controls access to private rooms
- **Room Status Validation**: Only allows joining rooms in 'waiting' status

### ✅ Security & Access Control
- **Private Room Protection**: Private rooms only accessible via direct links
- **User Authentication**: Validates user permissions and room access
- **Input Sanitization**: Validates and sanitizes all input parameters
- **Error Isolation**: Isolated error handling per user session

### ✅ User Experience
- **Persian Language Support**: All messages and errors in Persian
- **Context-Aware Keyboards**: Dynamic button layouts based on room state
- **Progress Feedback**: Clear status messages and next steps
- **Error Recovery**: Helpful error messages with recovery options

## Architecture

### File Structure
```
src/actions/games/poker/room/join/
├── index.ts              # Main join handler
└── README.md            # This file

src/actions/games/poker/utils/
├── roomJoinValidation.ts     # Join validation logic
└── joinRoomKeyboardGenerator.ts # Keyboard generation

src/bot.ts
└── start command handler    # Telegram start payload support
```

### Key Components

#### 1. Join Handler (`index.ts`)
- **Main entry point**: Handles all join requests
- **Parameter parsing**: Extracts roomId from various sources
- **Validation orchestration**: Coordinates all validation checks
- **Response generation**: Creates appropriate messages and keyboards

#### 2. Validation System (`roomJoinValidation.ts`)
- **Active room detection**: Checks if user is already in active rooms
- **Capacity management**: Validates room capacity and availability
- **Access control**: Manages private room access permissions
- **Comprehensive validation**: Single function for all join validations

#### 3. Keyboard Generation (`joinRoomKeyboardGenerator.ts`)
- **Context-aware layouts**: Different keyboards for different scenarios
- **Success keyboards**: Appropriate buttons after successful join
- **Error keyboards**: Recovery options for failed joins
- **Room full keyboards**: Alternative actions when room is full

## Usage Flow

### 1. Direct Room Join
```
User clicks join button → handleJoin() → Validate → Join → Show success
```

### 2. Telegram Start Payload Join
```
User clicks room link → /start room_abc123 → Parse payload → handleJoin() → Join
```

### 3. Public Room List Join
```
User selects room from list → handleJoin() → Validate → Join → Show success
```

### 4. Private Room Join
```
User clicks private room link → Validate direct link → handleJoin() → Join
```

## API Reference

### Main Handler Function

#### `handleJoin(context, query)`
Main handler for room joining requests.

**Parameters:**
- `context`: HandlerContext with user and Telegram context
- `query`: Query parameters containing roomId and optional flags

**Query Parameters:**
- `roomId` or `r`: Room ID to join
- `isDirectLink`: 'true' if joining via direct link (for private rooms)

### Validation Functions

#### `validateRoomJoinRequest(room, playerId, isDirectLink)`
Comprehensive validation for room join requests.

**Parameters:**
- `room`: PokerRoom object
- `playerId`: Player ID attempting to join
- `isDirectLink`: Boolean indicating if this is a direct link join

**Returns:**
```typescript
{
  isValid: boolean;
  error?: string;
}
```

#### `isPlayerInActiveRoom(playerId)`
Checks if player is already in an active room.

#### `isRoomFull(room)`
Checks if room has reached maximum capacity.

#### `isPlayerAlreadyInRoom(room, playerId)`
Checks if player is already a member of the room.

#### `isRoomAccessible(room, isDirectLink)`
Checks if room is accessible (public or private with direct link).

#### `canRoomAcceptPlayers(room)`
Checks if room can accept new players.

#### `getRoomCapacityInfo(room)`
Returns detailed capacity information.

### Keyboard Generation Functions

#### `generateJoinSuccessKeyboard(room, playerId, isCreator)`
Generates keyboard for successful join.

#### `generateErrorKeyboard()`
Generates keyboard for error scenarios.

#### `generateRoomFullKeyboard()`
Generates keyboard when room is full.

## Data Types

### Join Request Validation Result
```typescript
interface JoinValidationResult {
  isValid: boolean;
  error?: string;
}
```

### Room Capacity Information
```typescript
interface RoomCapacityInfo {
  current: number;
  max: number;
  available: number;
  isFull: boolean;
}
```

## Error Handling

### Validation Errors
- **Active Room Error**: User already in active room
- **Room Full Error**: Room has reached maximum capacity
- **Already Member Error**: User already in this room
- **Private Room Error**: Private room access denied
- **Room Not Found Error**: Invalid room ID
- **Room Status Error**: Room not accepting players

### System Errors
- **Database Errors**: Firebase connection issues
- **Network Errors**: Communication failures
- **Validation Errors**: Invalid input parameters

### Error Recovery
- **User-friendly messages**: Clear Persian error messages
- **Recovery options**: Appropriate buttons for error scenarios
- **Alternative actions**: Suggestions for next steps

## Telegram Integration

### Start Payload Support
The system supports joining rooms via Telegram start payloads:

```
https://t.me/playonhubbot?start=room_abc123
```

**Payload Format:**
- `room_<roomId>`: Direct room join
- Example: `room_abc123def456`

**Processing Flow:**
1. User clicks room link
2. Telegram opens bot with `/start room_abc123`
3. Bot parses payload and extracts roomId
4. Bot calls join handler with direct link flag
5. Handler validates and processes join request

### Button Integration
The system integrates with existing button systems:

- **Join buttons**: In room lists and share messages
- **Invite buttons**: After successful join
- **Navigation buttons**: Back to menu, room management

## Security Considerations

### Access Control
- **Private room protection**: Only accessible via direct links
- **User validation**: Validates user permissions
- **Room ownership**: Tracks room creator for management

### Input Validation
- **Room ID validation**: Ensures valid room ID format
- **User ID validation**: Validates user identity
- **Parameter sanitization**: Cleans and validates all inputs

### State Management
- **Active room tracking**: Prevents multiple active rooms
- **Join order preservation**: Maintains player join order
- **State consistency**: Ensures database consistency

## Testing

### Unit Tests
```bash
pnpm test tests/unit/roomJoin.test.ts
```

### Test Coverage
- ✅ Room capacity validation
- ✅ Player duplication checks
- ✅ Private room access control
- ✅ Active room detection
- ✅ Error handling scenarios
- ✅ Keyboard generation
- ✅ Validation edge cases

### Test Scenarios
- **Valid join requests**: Normal room joining
- **Invalid requests**: Various error conditions
- **Private room access**: Direct link vs public access
- **Capacity limits**: Full room scenarios
- **Duplicate joins**: Multiple join attempts

## Integration Points

### Router Integration
- **Auto-discovery**: Self-registering with compact router
- **Action codes**: Uses compact action codes for efficiency
- **Parameter passing**: Handles query parameters and payloads

### Database Integration
- **Firebase**: Room data storage and retrieval
- **Player tracking**: Active room and player state management
- **Room updates**: Atomic room state updates

### Bot Integration
- **Message handling**: Integrates with main bot message handler
- **Start command**: Handles Telegram start payloads
- **Button system**: Uses existing button infrastructure

## Future Enhancements

### Planned Features
- **Room queuing**: Queue system for full rooms
- **Auto-join**: Automatic join when space becomes available
- **Join notifications**: Notify room members of new joins
- **Join history**: Track join/leave history

### Potential Improvements
- **Advanced permissions**: Role-based room access
- **Join restrictions**: Time-based or condition-based restrictions
- **Room templates**: Quick join to room templates
- **Analytics**: Join success rates and user behavior

## Performance Considerations

### Optimization
- **Efficient validation**: Minimal database queries
- **Caching**: Cache room information where appropriate
- **Batch operations**: Group related database operations

### Scalability
- **Concurrent joins**: Handle multiple simultaneous joins
- **Room limits**: Enforce reasonable room size limits
- **Rate limiting**: Prevent join spam

## Monitoring & Logging

### Logging
- **Join attempts**: Log all join requests
- **Validation failures**: Track validation errors
- **Success rates**: Monitor join success rates

### Metrics
- **Join volume**: Track join request volume
- **Error rates**: Monitor validation error rates
- **Performance**: Track response times

## Troubleshooting

### Common Issues
- **Room not found**: Invalid room ID or deleted room
- **Access denied**: Private room without direct link
- **Room full**: Maximum capacity reached
- **Already member**: Duplicate join attempt

### Debugging
- **Log analysis**: Check application logs for errors
- **Validation testing**: Test validation functions
- **Database inspection**: Verify room state in database 