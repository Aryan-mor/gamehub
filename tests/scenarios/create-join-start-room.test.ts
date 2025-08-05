import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestBot, createMockUsers, MockUser } from './utils/testBot';
import { 
  runScenario, 
  createMessageAction, 
  createCallbackAction,
  expectContains,
  expectKeyboard,
  expectButtons,
  expectRoomExists,
  expectGameState
} from './utils/scenarioRunner';
import { 
  assertScenarioSuccess, 
  assertBotResponse, 
  assertDatabaseState,
  assertRoomState,
  assertGameState as assertGameStateHelper
} from './utils/assertions';

describe('Scenario: Create, Join, and Start Room', () => {
  let bot: any;
  let users: Map<string, MockUser>;
  let userA: MockUser;
  let userB: MockUser;
  let userC: MockUser;

  beforeEach(async () => {
    bot = await createTestBot();
    users = createMockUsers();
    userA = users.get('userA')!;
    userB = users.get('userB')!;
    userC = users.get('userC')!;
  });

  afterEach(async () => {
    await bot.cleanup();
  });

  it('should allow complete game setup and start flow', async () => {
    const scenario = [
      // User A starts the bot and creates room
      {
        action: createMessageAction(userA, '/start', 'User A starts the bot'),
        expectedResponse: expectContains(['Welcome', 'GameHub'])
      },
      
      {
        action: createMessageAction(userA, 'poker', 'User A selects poker game'),
        expectedResponse: expectContains(['Poker', 'room'])
      },
      
      {
        action: createCallbackAction(userA, 'gpc', undefined, 'User A creates room'),
        expectedResponse: expectContains(['Create Room', 'form'])
      },
      
      // User A fills room creation form
      {
        action: createCallbackAction(userA, 'gpfst?s=name&v=TestGame', undefined, 'Set room name'),
        expectedResponse: expectContains(['TestGame', 'privacy'])
      },
      
      {
        action: createCallbackAction(userA, 'gpfst?s=privacy&v=false', undefined, 'Set public room'),
        expectedResponse: expectContains(['maxPlayers'])
      },
      
      {
        action: createCallbackAction(userA, 'gpfst?s=maxPlayers&v=3', undefined, 'Set max players'),
        expectedResponse: expectContains(['smallBlind'])
      },
      
      {
        action: createCallbackAction(userA, 'gpfst?s=smallBlind&v=100', undefined, 'Set small blind'),
        expectedResponse: expectContains(['timeout'])
      },
      
      {
        action: createCallbackAction(userA, 'gpfst?s=timeout&v=120', undefined, 'Set timeout'),
        expectedResponse: expectContains(['Room created', 'TestGame'])
      },
      
      // Verify room exists and has correct settings
      {
        action: createMessageAction(userA, 'room info', 'User A checks room info'),
        expectedResponse: expectContains(['TestGame', 'Players: 1/3', 'Small Blind: 100']),
        expectedState: expectRoomExists(true)
      },
      
      // User B starts the bot and joins via shared link
      {
        action: createMessageAction(userB, '/start', 'User B starts the bot'),
        expectedResponse: expectContains(['Welcome'])
      },
      
      {
        action: createMessageAction(userB, 'poker', 'User B selects poker'),
        expectedResponse: expectContains(['Poker'])
      },
      
      // User B joins the room (simulate shared link)
      {
        action: createCallbackAction(userB, 'gpj?r=room_ABCDEFGHIJKL', undefined, 'User B joins room'),
        expectedResponse: expectContains(['joined', 'TestGame'])
      },
      
      // Verify both users are in the room
      {
        action: createMessageAction(userA, 'room info', 'User A checks room after join'),
        expectedResponse: expectContains(['Players: 2/3', 'Alice', 'Bob'])
      },
      
      {
        action: createMessageAction(userB, 'room info', 'User B checks room info'),
        expectedResponse: expectContains(['TestGame', 'Players: 2/3'])
      },
      
      // User C joins as well
      {
        action: createMessageAction(userC, '/start', 'User C starts the bot'),
        expectedResponse: expectContains(['Welcome'])
      },
      
      {
        action: createMessageAction(userC, 'poker', 'User C selects poker'),
        expectedResponse: expectContains(['Poker'])
      },
      
      {
        action: createCallbackAction(userC, 'gpj?r=room_ABCDEFGHIJKL', undefined, 'User C joins room'),
        expectedResponse: expectContains(['joined', 'TestGame'])
      },
      
      // Verify all three users are in the room
      {
        action: createMessageAction(userA, 'room info', 'User A checks room with all players'),
        expectedResponse: expectContains(['Players: 3/3', 'Alice', 'Bob', 'Charlie'])
      },
      
      // Users get ready
      {
        action: createCallbackAction(userA, 'gprr', undefined, 'User A gets ready'),
        expectedResponse: expectContains(['ready', 'Alice'])
      },
      
      {
        action: createCallbackAction(userB, 'gprr', undefined, 'User B gets ready'),
        expectedResponse: expectContains(['ready', 'Bob'])
      },
      
      {
        action: createCallbackAction(userC, 'gprr', undefined, 'User C gets ready'),
        expectedResponse: expectContains(['ready', 'Charlie'])
      },
      
      // User A starts the game
      {
        action: createCallbackAction(userA, 'gprs', undefined, 'User A starts game'),
        expectedResponse: expectContains(['Game started', 'dealing cards'])
      },
      
      // Verify game state
      {
        action: createMessageAction(userA, 'game status', 'User A checks game status'),
        expectedResponse: expectContains(['playing', 'round 1']),
        expectedState: expectGameState('playing')
      }
    ];

    const results = await runScenario(bot, users, scenario);

    // Assert overall scenario success
    assertScenarioSuccess(results);
    
    // Assert final state
    assertDatabaseState(results, {
      roomExists: true,
      userInRoom: true,
      gameState: 'playing'
    });
    
    // Assert room state
    assertRoomState(bot, {
      exists: true,
      playerCount: 3,
      gameStarted: true,
      creator: userA
    });
    
    // Assert game state
    assertGameStateHelper(bot, {
      exists: true,
      status: 'playing',
      playerCount: 3
    });
  });

  it('should handle room joining with different user scenarios', async () => {
    const scenario = [
      // Setup: User A creates room
      {
        action: createMessageAction(userA, '/start', 'User A starts'),
        expectedResponse: expectContains(['Welcome'])
      },
      
      {
        action: createMessageAction(userA, 'poker', 'User A selects poker'),
        expectedResponse: expectContains(['Poker'])
      },
      
      {
        action: createCallbackAction(userA, 'gprc', undefined, 'Create room'),
        expectedResponse: expectContains(['Create Room'])
      },
      
      // Quick room creation
      {
        action: createCallbackAction(userA, 'gpfst?s=name&v=JoinTest', undefined, 'Set name'),
        expectedResponse: expectContains(['JoinTest'])
      },
      
      {
        action: createCallbackAction(userA, 'gpfst?s=privacy&v=false', undefined, 'Set public'),
        expectedResponse: expectContains(['maxPlayers'])
      },
      
      {
        action: createCallbackAction(userA, 'gpfst?s=maxPlayers&v=4', undefined, 'Set players'),
        expectedResponse: expectContains(['smallBlind'])
      },
      
      {
        action: createCallbackAction(userA, 'gpfst?s=smallBlind&v=50', undefined, 'Set blind'),
        expectedResponse: expectContains(['timeout'])
      },
      
      {
        action: createCallbackAction(userA, 'gpfst?s=timeout&v=60', undefined, 'Set timeout'),
        expectedResponse: expectContains(['Room created'])
      },
      
      // User B joins
      {
        action: createMessageAction(userB, '/start', 'User B starts'),
        expectedResponse: expectContains(['Welcome'])
      },
      
      {
        action: createMessageAction(userB, 'poker', 'User B selects poker'),
        expectedResponse: expectContains(['Poker'])
      },
      
      {
        action: createCallbackAction(userB, 'gpj?r=room_ABCDEFGHIJKL', undefined, 'User B joins'),
        expectedResponse: expectContains(['joined', 'JoinTest'])
      },
      
      // Verify room state after join
      {
        action: createMessageAction(userA, 'room info', 'Check room after join'),
        expectedResponse: expectContains(['Players: 2/4', 'Alice', 'Bob'])
      },
      
      // User B gets ready
      {
        action: createCallbackAction(userB, 'gprr', undefined, 'User B ready'),
        expectedResponse: expectContains(['ready', 'Bob'])
      },
      
      // User A gets ready and starts game
      {
        action: createCallbackAction(userA, 'gprr', undefined, 'User A ready'),
        expectedResponse: expectContains(['ready', 'Alice'])
      },
      
      {
        action: createCallbackAction(userA, 'gprs', undefined, 'Start game'),
        expectedResponse: expectContains(['Game started'])
      }
    ];

    const results = await runScenario(bot, users, scenario);

    assertScenarioSuccess(results);
    
    // Verify game started with 2 players
    assertDatabaseState(results, {
      roomExists: true,
      gameState: 'playing'
    });
    
    assertRoomState(bot, {
      exists: true,
      playerCount: 2,
      gameStarted: true
    });
  });

  it('should handle room joining when room is full', async () => {
    const scenario = [
      // Setup: User A creates room with max 2 players
      {
        action: createMessageAction(userA, '/start', 'User A starts'),
        expectedResponse: expectContains(['Welcome'])
      },
      
      {
        action: createMessageAction(userA, 'poker', 'User A selects poker'),
        expectedResponse: expectContains(['Poker'])
      },
      
      {
        action: createCallbackAction(userA, 'gprc', undefined, 'Create room'),
        expectedResponse: expectContains(['Create Room'])
      },
      
      {
        action: createCallbackAction(userA, 'gpfst?s=name&v=FullRoom', undefined, 'Set name'),
        expectedResponse: expectContains(['FullRoom'])
      },
      
      {
        action: createCallbackAction(userA, 'gpfst?s=privacy&v=false', undefined, 'Set public'),
        expectedResponse: expectContains(['maxPlayers'])
      },
      
      {
        action: createCallbackAction(userA, 'gpfst?s=maxPlayers&v=2', undefined, 'Set max 2 players'),
        expectedResponse: expectContains(['smallBlind'])
      },
      
      {
        action: createCallbackAction(userA, 'gpfst?s=smallBlind&v=100', undefined, 'Set blind'),
        expectedResponse: expectContains(['timeout'])
      },
      
      {
        action: createCallbackAction(userA, 'gpfst?s=timeout&v=90', undefined, 'Set timeout'),
        expectedResponse: expectContains(['Room created'])
      },
      
      // User B joins successfully
      {
        action: createMessageAction(userB, '/start', 'User B starts'),
        expectedResponse: expectContains(['Welcome'])
      },
      
      {
        action: createMessageAction(userB, 'poker', 'User B selects poker'),
        expectedResponse: expectContains(['Poker'])
      },
      
      {
        action: createCallbackAction(userB, 'gpj?r=room_ABCDEFGHIJKL', undefined, 'User B joins'),
        expectedResponse: expectContains(['joined', 'FullRoom'])
      },
      
      // User C tries to join but room is full
      {
        action: createMessageAction(userC, '/start', 'User C starts'),
        expectedResponse: expectContains(['Welcome'])
      },
      
      {
        action: createMessageAction(userC, 'poker', 'User C selects poker'),
        expectedResponse: expectContains(['Poker'])
      },
      
      {
        action: createCallbackAction(userC, 'gpj?r=room_ABCDEFGHIJKL', undefined, 'User C tries to join full room'),
        expectedResponse: expectContains(['room is full', 'maximum players'])
      },
      
      // Verify room still has only 2 players
      {
        action: createMessageAction(userA, 'room info', 'Check room is still 2 players'),
        expectedResponse: expectContains(['Players: 2/2', 'Alice', 'Bob'])
      }
    ];

    const results = await runScenario(bot, users, scenario);

    assertScenarioSuccess(results);
    
    // Verify room has correct player count
    assertDatabaseState(results, {
      roomExists: true,
      roomCount: 1
    });
    
    assertRoomState(bot, {
      exists: true,
      playerCount: 2
    });
  });

  it('should handle game start with insufficient players', async () => {
    const scenario = [
      // Setup: User A creates room
      {
        action: createMessageAction(userA, '/start', 'User A starts'),
        expectedResponse: expectContains(['Welcome'])
      },
      
      {
        action: createMessageAction(userA, 'poker', 'User A selects poker'),
        expectedResponse: expectContains(['Poker'])
      },
      
      {
        action: createCallbackAction(userA, 'gprc', undefined, 'Create room'),
        expectedResponse: expectContains(['Create Room'])
      },
      
      {
        action: createCallbackAction(userA, 'gpfst?s=name&v=MinPlayers', undefined, 'Set name'),
        expectedResponse: expectContains(['MinPlayers'])
      },
      
      {
        action: createCallbackAction(userA, 'gpfst?s=privacy&v=false', undefined, 'Set public'),
        expectedResponse: expectContains(['maxPlayers'])
      },
      
      {
        action: createCallbackAction(userA, 'gpfst?s=maxPlayers&v=3', undefined, 'Set 3 players'),
        expectedResponse: expectContains(['smallBlind'])
      },
      
      {
        action: createCallbackAction(userA, 'gpfst?s=smallBlind&v=100', undefined, 'Set blind'),
        expectedResponse: expectContains(['timeout'])
      },
      
      {
        action: createCallbackAction(userA, 'gpfst?s=timeout&v=120', undefined, 'Set timeout'),
        expectedResponse: expectContains(['Room created'])
      },
      
      // User A tries to start game alone
      {
        action: createCallbackAction(userA, 'gprr', undefined, 'User A ready'),
        expectedResponse: expectContains(['ready'])
      },
      
      {
        action: createCallbackAction(userA, 'gprs', undefined, 'User A tries to start alone'),
        expectedResponse: expectContains(['need more players', 'minimum'])
      },
      
      // Verify game hasn't started
      {
        action: createMessageAction(userA, 'room info', 'Check room still waiting'),
        expectedResponse: expectContains(['Players: 1/3', 'waiting'])
      }
    ];

    const results = await runScenario(bot, users, scenario);

    assertScenarioSuccess(results);
    
    // Verify game hasn't started
    assertDatabaseState(results, {
      roomExists: true,
      gameState: 'waiting'
    });
    
    assertRoomState(bot, {
      exists: true,
      playerCount: 1,
      gameStarted: false
    });
  });
}); 