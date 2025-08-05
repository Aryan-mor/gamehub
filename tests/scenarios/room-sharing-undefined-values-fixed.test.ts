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

describe('Scenario: Room Sharing Undefined Values - Fixed', () => {
  let bot: any;
  let users: Map<string, MockUser>;
  let user1: MockUser;
  let user2: MockUser;

  beforeEach(async () => {
    bot = await createTestBot();
    users = createMockUsers();
    user1 = users.get('userA')!;
    user2 = users.get('userB')!;
  });

  afterEach(async () => {
    await bot.cleanup();
  });

  it('should fix undefined values when user joins via shared link', async () => {
    const scenario = [
      // User1 starts the bot and creates room
      {
        action: createMessageAction(user1, '/start', 'User1 starts the bot'),
        expectedResponse: expectContains(['Welcome', 'GameHub'])
      },
      
      {
        action: createMessageAction(user1, 'poker', 'User1 selects poker game'),
        expectedResponse: expectContains(['Poker', 'room'])
      },
      
      {
        action: createCallbackAction(user1, 'gpc', undefined, 'User1 creates room'),
        expectedResponse: expectContains(['Create Room', 'form'])
      },
      
      // User1 fills room creation form with complete data
      {
        action: createCallbackAction(user1, 'gpfst?s=name&v=TestPokerRoom', undefined, 'Set room name'),
        expectedResponse: expectContains(['TestPokerRoom', 'نوع روم'])
      },
      
      {
        action: createCallbackAction(user1, 'gpfst?s=privacy&v=false', undefined, 'Set public room'),
        expectedResponse: expectContains(['عمومی', 'حداکثر بازیکنان'])
      },
      
      {
        action: createCallbackAction(user1, 'gpfst?s=maxPlayers&v=4', undefined, 'Set max players'),
        expectedResponse: expectContains(['4 نفر', 'Small Blind'])
      },
      
      {
        action: createCallbackAction(user1, 'gpfst?s=smallBlind&v=50', undefined, 'Set small blind'),
        expectedResponse: expectContains(['50 سکه', 'زمان تایم‌اوت'])
      },
      
      {
        action: createCallbackAction(user1, 'gpfst?s=timeout&v=60', undefined, 'Set timeout'),
        expectedResponse: expectContains(['فرم تکمیل شد', 'ساخت روم'])
      },
      
      // User1 confirms room creation
      {
        action: createCallbackAction(user1, 'gpcc', undefined, 'User1 confirms room creation'),
        expectedResponse: expectContains(['TestPokerRoom', 'Players: 1/4'])
      },
      
      // User1 shares the room
      {
        action: createCallbackAction(user1, 'gpsh', undefined, 'User1 shares room'),
        expectedResponse: expectContains(['دعوت به بازی پوکر', 'TestPokerRoom', 'اشتراک‌گذاری'])
      },
      
      // User2 starts the bot
      {
        action: createMessageAction(user2, '/start', 'User2 starts the bot'),
        expectedResponse: expectContains(['Welcome'])
      },
      
      {
        action: createMessageAction(user2, 'poker', 'User2 selects poker'),
        expectedResponse: expectContains(['Poker'])
      },
      
      // User2 joins the room via shared link (this should show proper room info, not undefined values)
      {
        action: createCallbackAction(user2, 'gpj?r=room_fZHUfgHSy2lv', undefined, 'User2 joins room via shared link'),
        expectedResponse: expectContains([
          'TestPokerRoom',
          'Players: 2/4',
          'Small Blind: 50',
          'Big Blind: 100', 
          'تایم‌اوت نوبت: 60 ثانیه',
          'وضعیت: ⏳ منتظر بازیکنان',
          'نوع: 🌐 عمومی',
          'Alice',
          'Bob'
        ])
      }
    ];

    const results = await runScenario(bot, users, scenario);

    // Assert overall scenario success
    assertScenarioSuccess(results);
    
    // Assert final state
    assertDatabaseState(results, {
      roomExists: true,
      userInRoom: true,
      gameState: 'waiting'
    });
    
    // Assert room state
    assertRoomState(bot, {
      exists: true,
      playerCount: 2,
      gameStarted: false,
      creator: user1
    });
  });

  it('should handle message updates when players join', async () => {
    const scenario = [
      // Setup: User1 creates room
      {
        action: createMessageAction(user1, '/start', 'User1 starts the bot'),
        expectedResponse: expectContains(['Welcome'])
      },
      
      {
        action: createMessageAction(user1, 'poker', 'User1 selects poker'),
        expectedResponse: expectContains(['Poker'])
      },
      
      {
        action: createCallbackAction(user1, 'gpc', undefined, 'User1 creates room'),
        expectedResponse: expectContains(['Create Room'])
      },
      
      // Quick room creation
      {
        action: createCallbackAction(user1, 'gpfst?s=name&v=UpdateTest&privacy=false&maxPlayers=3&smallBlind=10&timeout=45', undefined, 'Quick room creation'),
        expectedResponse: expectContains(['فرم تکمیل شد', 'ساخت روم'])
      },
      
      // User1 confirms room creation
      {
        action: createCallbackAction(user1, 'gpcc', undefined, 'User1 confirms room creation'),
        expectedResponse: expectContains(['UpdateTest', 'Players: 1/3'])
      },
      
      // User1 checks initial room info
      {
        action: createMessageAction(user1, 'room info', 'User1 checks initial room info'),
        expectedResponse: expectContains(['Players: 1/3', 'Alice'])
      },
      
      // User2 joins
      {
        action: createMessageAction(user2, '/start', 'User2 starts the bot'),
        expectedResponse: expectContains(['Welcome'])
      },
      
      {
        action: createMessageAction(user2, 'poker', 'User2 selects poker'),
        expectedResponse: expectContains(['Poker'])
      },
      
      {
        action: createCallbackAction(user2, 'gpj?r=room_fZHUfgHSy2lv', undefined, 'User2 joins room'),
        expectedResponse: expectContains(['joined', 'UpdateTest'])
      },
      
      // Verify User1's message was updated automatically
      {
        action: createMessageAction(user1, 'room info', 'User1 checks updated room info'),
        expectedResponse: expectContains(['Players: 2/3', 'Alice', 'Bob'])
      }
    ];

    const results = await runScenario(bot, users, scenario);
    assertScenarioSuccess(results);
  });
}); 