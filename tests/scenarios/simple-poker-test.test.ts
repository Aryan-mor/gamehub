import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestBot, createMockUsers, MockUser } from './utils/testBot';
import { 
  runScenario, 
  createCallbackAction,
  expectContains
} from './utils/scenarioRunner';

describe('Simple Poker Test', () => {
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

  it('should handle poker start action successfully', async () => {
    const scenario = [
      {
        action: createCallbackAction(userA, 'gpst', undefined, 'User clicks poker start'),
        expectedResponse: expectContains(['Poker', 'Texas Hold'])
      }
    ];

    const results = await runScenario(bot, users, scenario);

    // Verify the test framework works
    expect(results.totalSteps).toBe(1);
    expect(results.successfulSteps).toBe(1);
    expect(results.failedSteps).toBe(0);
    expect(results.errors.length).toBe(0);
    
    // Verify bot received the callback
    expect(bot.messages.length).toBe(1);
    expect(bot.messages[0].callback_data).toBe('gpst');
    expect(bot.messages[0].user.username).toBe('user_a');
    
    // Verify bot sent a response
    expect(bot.responses.length).toBe(1);
    expect(bot.responses[0].method).toBe('editMessageText');
    expect(bot.responses[0].text).toContain('Poker');
  });

  it('should handle poker command text successfully', async () => {
    const scenario = [
      {
        action: createCallbackAction(userA, 'gpst', undefined, 'User sends poker command'),
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
}); 