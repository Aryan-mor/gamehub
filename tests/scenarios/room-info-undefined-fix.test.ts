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

describe('Scenario: Room Info Undefined Values Fix', () => {
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

  it('should fix undefined values when user joins room', async () => {
    const scenario = [
      // User1 creates room
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
      
      // Quick room creation
      {
        action: createCallbackAction(user1, 'gpfst?s=name&v=TestRoom&privacy=false&maxPlayers=2&smallBlind=50&timeout=60', undefined, 'Quick room creation'),
        expectedResponse: expectContains(['فرم تکمیل شد', 'ساخت روم'])
      },
      
      {
        action: createCallbackAction(user1, 'gpcc', undefined, 'User1 confirms room creation'),
        expectedResponse: expectContains(['TestRoom', 'Players: 1/2'])
      },
      
      // User1 checks room info (should show complete info)
      {
        action: createMessageAction(user1, 'room info', 'User1 checks room info'),
        expectedResponse: expectContains([
          'TestRoom',
          'Players: 1/2',
          'Small Blind: 50',
          'Big Blind: 100',
          'تایم‌اوت نوبت: 60 ثانیه',
          'وضعیت: ⏳ منتظر بازیکنان',
          'نوع: 🌐 عمومی',
          'Alice'
        ])
      },
      
      // User2 starts and joins
      {
        action: createMessageAction(user2, '/start', 'User2 starts the bot'),
        expectedResponse: expectContains(['Welcome'])
      },
      
      {
        action: createMessageAction(user2, 'poker', 'User2 selects poker'),
        expectedResponse: expectContains(['Poker'])
      },
      
      // User2 joins the room (this should show proper room info, not undefined values)
      {
        action: createCallbackAction(user2, 'gpj?r=room_123', undefined, 'User2 joins room'),
        expectedResponse: expectContains([
          'TestRoom',
          'Players: 2/2',
          'Small Blind: 50',
          'Big Blind: 100',
          'تایم‌اوت نوبت: 60 ثانیه',
          'وضعیت: ⏳ منتظر بازیکنان',
          'نوع: 🌐 عمومی',
          'Alice',
          'Bob'
        ])
      },
      
      // User1 checks room info again (should be updated with new player)
      {
        action: createMessageAction(user1, 'room info', 'User1 checks updated room info'),
        expectedResponse: expectContains([
          'TestRoom',
          'Players: 2/2',
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
}); 