import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Bot, Context } from 'grammy';
import { createTestBot, createMockUsers, MockUser } from './utils/testBot';
import { 
  runScenario, 
  createMessageAction, 
  createCallbackAction,
  expectContains
} from './utils/scenarioRunner';
import { 
  assertScenarioSuccess, 
  assertBotResponse 
} from './utils/assertions';

// Import real bot logic
import { bot as realBot } from '../../src/bot';
import { register, dispatch, parseCallbackData } from '../../src/modules/core/compact-router';
import { HandlerContext } from '../../src/modules/core/handler';
import { UserId } from '../../src/utils/types';

describe('Real Bot Integration Tests', () => {
  let bot: any;
  let users: Map<string, MockUser>;
  let userA: MockUser;
  let userB: MockUser;

  beforeEach(async () => {
    // Create test bot with real logic
    bot = await createTestBot();
    users = createMockUsers();
    userA = users.get('userA')!;
    userB = users.get('userB')!;

    // Import and register all poker handlers
    await import('../../src/actions/games/poker/start');
    await import('../../src/actions/games/poker/room/create');
    await import('../../src/actions/games/poker/room/join');
    await import('../../src/actions/games/poker/room/leave');
    await import('../../src/actions/games/poker/room/ready');
    await import('../../src/actions/games/poker/room/start');
  });

  afterEach(async () => {
    await bot.cleanup();
  });

  it('should handle /start command with real bot logic', async () => {
    const scenario = [
      {
        action: createMessageAction(userA, '/start', 'User starts bot'),
        expectedResponse: expectContains(['Welcome', 'GameHub'])
      }
    ];

    const results = await runScenario(bot, users, scenario);

    // Verify the test framework works
    expect(results.totalSteps).toBe(1);
    expect(results.successfulSteps).toBe(1);
    expect(results.failedSteps).toBe(0);
    expect(results.errors.length).toBe(0);
    
    // Verify bot received the message
    expect(bot.messages.length).toBe(1);
    expect(bot.messages[0].text).toBe('/start');
    expect(bot.messages[0].user.username).toBe('user_a');
    
    // Verify bot sent a response
    expect(bot.responses.length).toBe(1);
    expect(bot.responses[0].method).toBe('sendMessage');
  });

  it('should handle poker start action with real handlers', async () => {
    const scenario = [
      {
        action: createCallbackAction(userA, 'gpst', undefined, 'User clicks poker start'),
        expectedResponse: expectContains(['Poker', 'Texas Hold'])
      }
    ];

    const results = await runScenario(bot, users, scenario);

    expect(results.totalSteps).toBe(1);
    expect(results.successfulSteps).toBe(1);
    expect(results.failedSteps).toBe(0);
    
    // Verify bot sent a response
    expect(bot.responses.length).toBe(1);
    expect(bot.responses[0].method).toBe('editMessageText');
  });

  it('should handle compact callback actions', async () => {
    const scenario = [
      {
        action: createCallbackAction(userA, 'gpst', undefined, 'User clicks poker start'),
        expectedResponse: expectContains(['Poker', 'Texas Hold'])
      }
    ];

    const results = await runScenario(bot, users, scenario);

    expect(results.totalSteps).toBe(1);
    expect(results.successfulSteps).toBe(1);
    expect(results.failedSteps).toBe(0);
    
    // Verify callback was processed
    expect(bot.messages.length).toBe(1);
    expect(bot.messages[0].callback_data).toBe('gpst');
  });

  it('should handle room creation flow', async () => {
    const scenario = [
      // User starts bot
      {
        action: createMessageAction(userA, '/start', 'User starts bot'),
        expectedResponse: expectContains(['Welcome'])
      },
      
      // User selects poker
      {
        action: createCallbackAction(userA, 'gpst', undefined, 'User selects poker'),
        expectedResponse: expectContains(['Poker'])
      },
      
      // User clicks create room
      {
        action: createCallbackAction(userA, 'gpc', undefined, 'User creates room'),
        expectedResponse: expectContains(['Create Room', 'form'])
      }
    ];

    const results = await runScenario(bot, users, scenario);

    expect(results.totalSteps).toBe(3);
    expect(results.successfulSteps).toBe(3);
    expect(results.failedSteps).toBe(0);
  });

  it('should handle multiple users in room', async () => {
    const scenario = [
      // User A starts and creates room
      {
        action: createMessageAction(userA, '/start', 'User A starts'),
        expectedResponse: expectContains(['Welcome'])
      },
      
      {
        action: createMessageAction(userA, 'poker', 'User A selects poker'),
        expectedResponse: expectContains(['Poker'])
      },
      
      {
        action: createCallbackAction(userA, 'gprc', undefined, 'User A creates room'),
        expectedResponse: expectContains(['Create Room'])
      },
      
      // User B joins
      {
        action: createMessageAction(userB, '/start', 'User B starts'),
        expectedResponse: expectContains(['Welcome'])
      },
      
      {
        action: createCallbackAction(userB, 'gpst', undefined, 'User B selects poker'),
        expectedResponse: expectContains(['Poker'])
      },
      
      {
        action: createCallbackAction(userB, 'gpj?r=room_123', undefined, 'User B joins room'),
        expectedResponse: expectContains(['joined'])
      }
    ];

    const results = await runScenario(bot, users, scenario);

    expect(results.totalSteps).toBe(6);
    expect(results.successfulSteps).toBe(6);
    expect(results.failedSteps).toBe(0);
  });
}); 