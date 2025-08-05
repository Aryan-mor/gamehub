import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestBot, createMockUsers, MockUser } from './utils/testBot';
import { 
  runScenario, 
  createMessageAction, 
  createCallbackAction,
  expectContains
} from './utils/scenarioRunner';

describe('Final Undefined Values Fix Test', () => {
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

  it('should not show undefined values in room information', async () => {
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
      
      // Quick room creation - step by step
      {
        action: createCallbackAction(user1, 'gpfst?s=name&v=FinalTest', undefined, 'Set room name'),
        expectedResponse: expectContains(['FinalTest'])
      },
      
      {
        action: createCallbackAction(user1, 'gpfst?s=privacy&v=false', undefined, 'Set privacy'),
        expectedResponse: expectContains(['عمومی'])
      },
      
      {
        action: createCallbackAction(user1, 'gpfst?s=maxPlayers&v=2', undefined, 'Set max players'),
        expectedResponse: expectContains(['2 نفر'])
      },
      
      {
        action: createCallbackAction(user1, 'gpfst?s=smallBlind&v=25', undefined, 'Set small blind'),
        expectedResponse: expectContains(['25 سکه'])
      },
      
      {
        action: createCallbackAction(user1, 'gpfst?s=timeout&v=45', undefined, 'Set timeout'),
        expectedResponse: expectContains(['فرم تکمیل شد'])
      },
      
      {
        action: createCallbackAction(user1, 'gpcc', undefined, 'User1 confirms room creation'),
        expectedResponse: expectContains(['FinalTest'])
      }
    ];

    const execution = await runScenario(bot, users, scenario);
    
    // Check that we have successful steps
    expect(execution.successfulSteps).toBeGreaterThan(0);
    
    // Get all responses
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
    
    console.log('All responses:', responses);
    
    // Check that the room creation response shows proper room info
    const roomCreationResponse = responses[responses.length - 1];
    if (roomCreationResponse) {
      expect(roomCreationResponse).toContain('FinalTest');
      expect(roomCreationResponse).toContain('بازیکنان (1/2)');
      expect(roomCreationResponse).toContain('Small Blind: 25 سکه');
      expect(roomCreationResponse).toContain('Big Blind: 50 سکه');
      expect(roomCreationResponse).toContain('تایم‌اوت نوبت: 45 ثانیه');
      expect(roomCreationResponse).toContain('وضعیت: ⏳ منتظر بازیکنان');
      expect(roomCreationResponse).toContain('نوع: 🌐 عمومی');
    }
  });
}); 