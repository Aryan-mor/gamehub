import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestBot, createMockUsers, MockUser } from './utils/testBot';
import { 
  runScenario, 
  createMessageAction, 
  createCallbackAction,
  expectContains
} from './utils/scenarioRunner';

describe('Undefined Values Fix Test', () => {
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

  it('should not show undefined values when user joins room', async () => {
    const scenario = [
      // User1 creates room
      {
        action: createMessageAction(user1, '/start', 'User1 starts'),
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
        action: createCallbackAction(user1, 'gpfst?s=name&v=TestRoom&privacy=false&maxPlayers=2&smallBlind=50&timeout=60', undefined, 'Quick room creation'),
        expectedResponse: expectContains(['فرم تکمیل شد'])
      },
      
      {
        action: createCallbackAction(user1, 'gpcc', undefined, 'User1 confirms room creation'),
        expectedResponse: expectContains(['TestRoom'])
      },
      
      // User2 joins
      {
        action: createMessageAction(user2, '/start', 'User2 starts'),
        expectedResponse: expectContains(['Welcome'])
      },
      
      {
        action: createMessageAction(user2, 'poker', 'User2 selects poker'),
        expectedResponse: expectContains(['Poker'])
      },
      
      {
        action: createCallbackAction(user2, 'gpj?r=room_123', undefined, 'User2 joins room'),
        expectedResponse: expectContains(['TestRoom', 'Players: 2/2'])
      }
    ];

    const execution = await runScenario(bot, users, scenario);
    
    // Check that we have successful steps
    expect(execution.successfulSteps).toBeGreaterThan(0);
    
    // Check that there are no undefined values in the responses
    const responses = execution.results
      .filter(r => r.actualResponse)
      .map(r => r.actualResponse.text || '');
    
    // Check that no response contains "undefined"
    responses.forEach((response, index) => {
      if (response.includes('undefined')) {
        console.error(`Response ${index} contains undefined:`, response);
      }
      expect(response).not.toContain('undefined');
    });
  });
}); 