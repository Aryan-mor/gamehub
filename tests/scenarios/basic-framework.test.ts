import { describe, it, expect, beforeEach, afterEach } from 'vitest';
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

describe('Basic Framework Test', () => {
  let bot: any;
  let users: Map<string, MockUser>;
  let userA: MockUser;

  beforeEach(async () => {
    bot = await createTestBot();
    users = createMockUsers();
    userA = users.get('userA')!;
  });

  afterEach(async () => {
    await bot.cleanup();
  });

  it('should handle basic message interaction', async () => {
    const scenario = [
      {
        action: createMessageAction(userA, '/start', 'User sends start command'),
        expectedResponse: expectContains(['Welcome'])
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

  it('should handle callback query interaction', async () => {
    const scenario = [
      {
        action: createCallbackAction(userA, 'gpst', undefined, 'User sends poker start'),
        expectedResponse: expectContains(['Poker'])
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

  it('should handle multiple interactions in sequence', async () => {
    const scenario = [
      {
        action: createMessageAction(userA, '/start', 'First message'),
        expectedResponse: expectContains(['Welcome'])
      },
      {
        action: createMessageAction(userA, 'poker', 'Second message'),
        expectedResponse: expectContains(['Poker'])
      },
      {
        action: createCallbackAction(userA, 'gpst', undefined, 'Third interaction'),
        expectedResponse: expectContains(['Poker'])
      }
    ];

    const results = await runScenario(bot, users, scenario);

    expect(results.totalSteps).toBe(3);
    expect(results.successfulSteps).toBe(3);
    expect(results.failedSteps).toBe(0);
    
    // Verify all interactions were processed
    expect(bot.messages.length).toBe(3);
    expect(bot.responses.length).toBe(3);
  });

  it('should handle test cleanup correctly', async () => {
    // Send some messages to create state
    await bot.sendMessage(userA, '/start');
    await bot.sendMessage(userA, 'poker');
    
    // Verify state exists
    expect(bot.messages.length).toBe(2);
    expect(bot.responses.length).toBe(2);
    
    // Cleanup
    await bot.cleanup();
    
    // Verify state is cleared
    expect(bot.messages.length).toBe(0);
    expect(bot.responses.length).toBe(0);
  });

  it('should track user responses correctly', async () => {
    const scenario = [
      {
        action: createMessageAction(userA, '/start', 'User A sends message'),
        expectedResponse: expectContains(['Welcome'])
      }
    ];

    await runScenario(bot, users, scenario);

    // Verify user responses are tracked
    const userResponses = bot.getResponsesForUser(userA);
    expect(userResponses.length).toBe(1);
    expect(userResponses[0].chat_id).toBe(parseInt(userA.id));
  });
}); 