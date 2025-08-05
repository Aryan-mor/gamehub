import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestBot, createMockUsers, MockUser } from './utils/testBot';
import { 
  runScenario, 
  createMessageAction, 
  createCallbackAction,
  expectContains,
  expectKeyboard,
  expectButtons,
  expectRoomExists
} from './utils/scenarioRunner';
import { 
  assertScenarioSuccess, 
  assertBotResponse, 
  assertDatabaseState,
  assertRoomState
} from './utils/assertions';

describe('Scenario: Create and Leave Room', () => {
  let bot: any;
  let users: Map<string, MockUser>;
  let userA: MockUser;
  let userB: MockUser;

  beforeEach(async () => {
    bot = await createTestBot();
    users = createMockUsers();
    userA = users.get('userA')!;
    userB = users.get('userB')!;
  });

  afterEach(async () => {
    await bot.cleanup();
  });

  it('should allow user to create a room and immediately leave it', async () => {
    const scenario = [
      // User A starts the bot
      {
        action: createMessageAction(userA, '/start', 'User A starts the bot'),
        expectedResponse: expectContains(['Welcome', 'GameHub'])
      },
      
      // User A selects poker game
      {
        action: createMessageAction(userA, 'poker', 'User A selects poker game'),
        expectedResponse: expectContains(['Poker', 'room'])
      },
      
      // User A creates a new room
      {
        action: createCallbackAction(userA, 'gpc', undefined, 'User A creates room'),
        expectedResponse: expectContains(['Create Room', 'form'])
      },
      
      // User A fills room creation form (simplified)
      {
        action: createCallbackAction(userA, 'gpfst?s=name&v=TestRoom', undefined, 'User A sets room name'),
        expectedResponse: expectContains(['TestRoom', 'privacy'])
      },
      
      {
        action: createCallbackAction(userA, 'gpfst?s=privacy&v=true', undefined, 'User A sets privacy'),
        expectedResponse: expectContains(['maxPlayers'])
      },
      
      {
        action: createCallbackAction(userA, 'gpfst?s=maxPlayers&v=4', undefined, 'User A sets max players'),
        expectedResponse: expectContains(['smallBlind'])
      },
      
      {
        action: createCallbackAction(userA, 'gpfst?s=smallBlind&v=100', undefined, 'User A sets small blind'),
        expectedResponse: expectContains(['timeout'])
      },
      
      {
        action: createCallbackAction(userA, 'gpfst?s=timeout&v=120', undefined, 'User A sets timeout'),
        expectedResponse: expectContains(['Room created', 'TestRoom'])
      },
      
      // Verify room exists
      {
        action: createMessageAction(userA, 'room info', 'User A checks room info'),
        expectedResponse: expectContains(['TestRoom', 'Players: 1/4']),
        expectedState: expectRoomExists(true)
      },
      
      // User A leaves the room
      {
        action: createCallbackAction(userA, 'gpl', undefined, 'User A leaves room'),
        expectedResponse: expectContains(['left the room', 'deleted'])
      },
      
      // Verify room is deleted
      {
        action: createMessageAction(userA, 'room list', 'User A checks room list'),
        expectedResponse: expectContains(['No rooms available']),
        expectedState: expectRoomExists(false)
      }
    ];

    const results = await runScenario(bot, users, scenario);

    // Assert overall scenario success
    assertScenarioSuccess(results);
    
    // Assert final state
    assertDatabaseState(results, {
      roomExists: false,
      roomCount: 0
    });
    
    // Assert room state
    assertRoomState(bot, {
      exists: false
    });
  });

  it('should handle room creation with default settings', async () => {
    const scenario = [
      // User A starts the bot
      {
        action: createMessageAction(userA, '/start', 'User A starts the bot'),
        expectedResponse: expectContains(['Welcome'])
      },
      
      // User A selects poker and creates room with defaults
      {
        action: createMessageAction(userA, 'poker', 'User A selects poker'),
        expectedResponse: expectContains(['Poker'])
      },
      
      {
        action: createCallbackAction(userA, 'gpc', undefined, 'User A creates room'),
        expectedResponse: expectContains(['Create Room'])
      },
      
      // Quick room creation with minimal settings
      {
        action: createCallbackAction(userA, 'gpfst?s=name&v=QuickRoom', undefined, 'Set room name'),
        expectedResponse: expectContains(['QuickRoom'])
      },
      
      {
        action: createCallbackAction(userA, 'gpfst?s=privacy&v=false', undefined, 'Set public room'),
        expectedResponse: expectContains(['maxPlayers'])
      },
      
      {
        action: createCallbackAction(userA, 'gpfst?s=maxPlayers&v=2', undefined, 'Set 2 players'),
        expectedResponse: expectContains(['smallBlind'])
      },
      
      {
        action: createCallbackAction(userA, 'gpfst?s=smallBlind&v=50', undefined, 'Set small blind'),
        expectedResponse: expectContains(['timeout'])
      },
      
      {
        action: createCallbackAction(userA, 'gpfst?s=timeout&v=60', undefined, 'Set timeout'),
        expectedResponse: expectContains(['Room created', 'QuickRoom'])
      },
      
      // Immediately leave
      {
        action: createCallbackAction(userA, 'gpl', undefined, 'User A leaves immediately'),
        expectedResponse: expectContains(['left the room'])
      }
    ];

    const results = await runScenario(bot, users, scenario);

    assertScenarioSuccess(results);
    assertDatabaseState(results, { roomExists: false });
  });

  it('should show appropriate messages when leaving empty room', async () => {
    const scenario = [
      // Setup: Create room
      {
        action: createMessageAction(userA, '/start', 'Start bot'),
        expectedResponse: expectContains(['Welcome'])
      },
      
      {
        action: createMessageAction(userA, 'poker', 'Select poker'),
        expectedResponse: expectContains(['Poker'])
      },
      
      {
        action: createCallbackAction(userA, 'gprc', undefined, 'Create room'),
        expectedResponse: expectContains(['Create Room'])
      },
      
      // Quick room creation
      {
        action: createCallbackAction(userA, 'gpfst?s=name&v=EmptyRoom', undefined, 'Set name'),
        expectedResponse: expectContains(['EmptyRoom'])
      },
      
      {
        action: createCallbackAction(userA, 'gpfst?s=privacy&v=true', undefined, 'Set privacy'),
        expectedResponse: expectContains(['maxPlayers'])
      },
      
      {
        action: createCallbackAction(userA, 'gpfst?s=maxPlayers&v=3', undefined, 'Set players'),
        expectedResponse: expectContains(['smallBlind'])
      },
      
      {
        action: createCallbackAction(userA, 'gpfst?s=smallBlind&v=200', undefined, 'Set blind'),
        expectedResponse: expectContains(['timeout'])
      },
      
      {
        action: createCallbackAction(userA, 'gpfst?s=timeout&v=90', undefined, 'Set timeout'),
        expectedResponse: expectContains(['Room created'])
      },
      
      // Leave room and verify messages
      {
        action: createCallbackAction(userA, 'gpl', undefined, 'Leave room'),
        expectedResponse: expectContains(['left the room', 'deleted'])
      },
      
      // Try to access room info after leaving
      {
        action: createMessageAction(userA, 'room info', 'Check room info after leaving'),
        expectedResponse: expectContains(['not in a room', 'No active room'])
      }
    ];

    const results = await runScenario(bot, users, scenario);

    assertScenarioSuccess(results);
    
    // Verify final state
    assertDatabaseState(results, {
      roomExists: false,
      userInRoom: false
    });
  });

  it('should handle multiple create-leave cycles', async () => {
    const scenario = [
      // First cycle
      {
        action: createMessageAction(userA, '/start', 'Start bot'),
        expectedResponse: expectContains(['Welcome'])
      },
      
      {
        action: createMessageAction(userA, 'poker', 'Select poker'),
        expectedResponse: expectContains(['Poker'])
      },
      
      {
        action: createCallbackAction(userA, 'gprc', undefined, 'Create first room'),
        expectedResponse: expectContains(['Create Room'])
      },
      
      {
        action: createCallbackAction(userA, 'gpfst?s=name&v=Room1', undefined, 'Set name 1'),
        expectedResponse: expectContains(['Room1'])
      },
      
      {
        action: createCallbackAction(userA, 'gpfst?s=privacy&v=false', undefined, 'Set privacy 1'),
        expectedResponse: expectContains(['maxPlayers'])
      },
      
      {
        action: createCallbackAction(userA, 'gpfst?s=maxPlayers&v=2', undefined, 'Set players 1'),
        expectedResponse: expectContains(['smallBlind'])
      },
      
      {
        action: createCallbackAction(userA, 'gpfst?s=smallBlind&v=100', undefined, 'Set blind 1'),
        expectedResponse: expectContains(['timeout'])
      },
      
      {
        action: createCallbackAction(userA, 'gpfst?s=timeout&v=60', undefined, 'Set timeout 1'),
        expectedResponse: expectContains(['Room created', 'Room1'])
      },
      
      {
        action: createCallbackAction(userA, 'gpl', undefined, 'Leave first room'),
        expectedResponse: expectContains(['left the room'])
      },
      
      // Second cycle
      {
        action: createCallbackAction(userA, 'gprc', undefined, 'Create second room'),
        expectedResponse: expectContains(['Create Room'])
      },
      
      {
        action: createCallbackAction(userA, 'gpfst?s=name&v=Room2', undefined, 'Set name 2'),
        expectedResponse: expectContains(['Room2'])
      },
      
      {
        action: createCallbackAction(userA, 'gpfst?s=privacy&v=true', undefined, 'Set privacy 2'),
        expectedResponse: expectContains(['maxPlayers'])
      },
      
      {
        action: createCallbackAction(userA, 'gpfst?s=maxPlayers&v=4', undefined, 'Set players 2'),
        expectedResponse: expectContains(['smallBlind'])
      },
      
      {
        action: createCallbackAction(userA, 'gpfst?s=smallBlind&v=150', undefined, 'Set blind 2'),
        expectedResponse: expectContains(['timeout'])
      },
      
      {
        action: createCallbackAction(userA, 'gpfst?s=timeout&v=120', undefined, 'Set timeout 2'),
        expectedResponse: expectContains(['Room created', 'Room2'])
      },
      
      {
        action: createCallbackAction(userA, 'gpl', undefined, 'Leave second room'),
        expectedResponse: expectContains(['left the room'])
      }
    ];

    const results = await runScenario(bot, users, scenario);

    assertScenarioSuccess(results);
    
    // Verify no rooms exist after both cycles
    assertDatabaseState(results, {
      roomExists: false,
      roomCount: 0
    });
  });
}); 