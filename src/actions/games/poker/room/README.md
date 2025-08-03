# Poker Room Pre-Game Readiness System

## Overview
This module handles the pre-game state management and interaction logic for poker rooms. It provides functionality for room information display, player management, and game preparation before the actual poker game starts.

## Core Components

### 1. Room Information Display (`/room/info/`)
- **Path**: `games.poker.room.info`
- **Purpose**: Displays comprehensive room information to users
- **Features**:
  - Shows room details (name, ID, status, type)
  - Lists all players with their status (ready/not ready)
  - Identifies room creator with 🧑‍💼 icon
  - Shows current player with 📍 icon
  - Displays game settings (blinds, max players, timeout)
  - Shows room capacity and ready status

### 2. Room Management (`/room/leave/`)
- **Path**: `games.poker.room.leave`
- **Purpose**: Allows players to leave the room
- **Features**:
  - Validates user is in the room
  - Handles creator leaving (transfers ownership or deletes room)
  - Provides appropriate feedback based on room status
  - Updates room state and player indices

### 3. Player Kicking (`/room/kick/`)
- **Path**: `games.poker.room.kick`
- **Purpose**: Allows room creator to remove other players
- **Features**:
  - Creator-only access
  - Cannot kick during active games
  - Shows player selection interface
  - Updates room state after kicking

### 4. Game Start (`/room/start/`)
- **Path**: `games.poker.room.start`
- **Purpose**: Initiates the poker game
- **Features**:
  - Creator-only access
  - Validates minimum player count (2+)
  - Sets room status to 'active'
  - Triggers game engine initialization

## File Structure

```
src/actions/games/poker/room/
├── info/
│   └── index.ts              # Room information handler
├── leave/
│   └── index.ts              # Leave room handler
├── kick/
│   └── index.ts              # Kick player handler
├── start/
│   └── index.ts              # Start game handler
└── utils/
    └── roomInfoHelper.ts     # Helper functions for room info
```

## Helper Functions

### `getRoomInfoForUser(room, userId)`
Generates personalized room information display for a specific user:
- Shows room details and settings
- Lists all players with status indicators
- Highlights current user and creator
- Shows appropriate status messages based on room state

### `generateRoomInfoKeyboard(room, userId)`
Creates context-aware keyboard based on user role:
- **Creator**: Start Game, Kick Player, Refresh, Leave, Back to Menu
- **Player**: Refresh, Leave, Back to Menu
- **Conditions**: Only shows Start Game when conditions are met

### `generateKickPlayerKeyboard(room, kickablePlayers)`
Creates keyboard for player selection during kick process:
- Shows kick buttons for each kickable player
- Navigation buttons (Back to Room Info, Back to Menu)
- Handles multiple players with proper layout

## Room States

### Waiting State
- Room is accepting players
- Creator can start game when 2+ players
- Players can be kicked by creator
- Players can leave freely

### Active State
- Game has started
- No more players can join
- Players cannot be kicked
- Players can leave (affects game)

### Playing State
- Game is in progress
- Turn-based gameplay
- Players can fold/leave
- No room management actions

## User Roles

### Room Creator (🧑‍💼)
- Can start the game
- Can kick other players
- Can leave (transfers ownership)
- Has full room management privileges

### Regular Player
- Can view room information
- Can leave the room
- Can set ready/not ready status
- Cannot manage other players

## Keyboard Layouts

### Room Info Keyboard (Creator)
```
[🎮 شروع بازی]
[👢 اخراج بازیکن]
[🔁 بروزرسانی] [🚪 خروج از روم]
[🔙 بازگشت به منو]
```

### Room Info Keyboard (Player)
```
[🔁 بروزرسانی] [🚪 خروج از روم]
[🔙 بازگشت به منو]
```

### Kick Player Keyboard
```
[👢 Player 1] [👢 Player 2]
[🔙 بازگشت به اطلاعات روم]
[🔙 بازگشت به منو]
```

## Error Handling

### Validation Errors
- **Room Not Found**: "Room not found"
- **Not in Room**: "You are not a member of this room"
- **Not Creator**: "Only the room creator can kick players"
- **Game in Progress**: "Cannot kick players when game is in progress"
- **No Players to Kick**: "No players available to kick"

### Persian Error Messages
All error messages are provided in Persian for better user experience.

## Integration Points

### Database
- Uses `pokerService.getPokerRoom()` to fetch room data
- Uses `pokerService.updatePokerRoom()` to save changes
- Uses `pokerService.kickPlayerFromRoom()` for player removal
- Uses `pokerService.leavePokerRoom()` for leaving

### Router Integration
- Registered with compact router system
- Uses short action codes (e.g., 'rin', 'kck', 'lpg')
- Handles both direct calls and callback queries

### Game Engine
- Integrates with `/engine/gameStart.ts` for game initialization
- Provides seamless transition from room management to gameplay

## Testing

### Unit Tests
- `tests/unit/roomInfo.test.ts` - Comprehensive tests for room info functionality
- Tests all helper functions
- Tests keyboard generation
- Tests different user roles and room states

### Test Coverage
- Room information display for creators and players
- Keyboard generation for different scenarios
- Kick player functionality
- Error handling and validation

## Usage Examples

### Viewing Room Information
```
User clicks "📋 مشاهده اطلاعات روم" button
→ Calls games.poker.room.info?roomId=room_123
→ Displays personalized room information
→ Shows appropriate action buttons
```

### Kicking a Player
```
Creator clicks "👢 اخراج بازیکن" button
→ Calls games.poker.room.kick?roomId=room_123
→ Shows player selection interface
→ Creator selects player to kick
→ Calls games.poker.room.kick?roomId=room_123&targetPlayerId=456
→ Player is removed from room
```

### Starting the Game
```
Creator clicks "🎮 شروع بازی" button
→ Calls games.poker.room.start?roomId=room_123
→ Validates conditions (creator, 2+ players, waiting status)
→ Sets room status to 'active'
→ Initializes game engine
→ Sends notifications to all players
```

## Future Enhancements

### Planned Features
- Player ready status management
- Room chat functionality
- Spectator mode
- Room templates and presets
- Advanced room settings

### Potential Improvements
- Real-time updates via WebSocket
- Room activity timers
- Player statistics display
- Room history and analytics 