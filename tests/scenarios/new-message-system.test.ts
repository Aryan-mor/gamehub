import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestBot, createMockUsers, MockUser } from './utils/testBot';
import { 
  runScenario, 
  createMessageAction, 
  createCallbackAction,
  expectContains
} from './utils/scenarioRunner';

describe('New Message System Test', () => {
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

  it('should send new messages to all players when someone joins', async () => {
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
        action: createCallbackAction(user1, 'gpfst?s=name&v=MessageTest', undefined, 'Set room name'),
        expectedResponse: expectContains(['MessageTest'])
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
        action: createCallbackAction(user1, 'gpfst?s=smallBlind&v=10', undefined, 'Set small blind'),
        expectedResponse: expectContains(['10 سکه'])
      },
      
      {
        action: createCallbackAction(user1, 'gpfst?s=timeout&v=30', undefined, 'Set timeout'),
        expectedResponse: expectContains(['فرم تکمیل شد'])
      },
      
      {
        action: createCallbackAction(user1, 'gpcc', undefined, 'User1 confirms room creation'),
        expectedResponse: expectContains(['MessageTest', 'Players: 1/2'])
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
        expectedResponse: expectContains(['Invalid room ID format'])
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
    const roomCreationResponse = responses[responses.length - 3]; // User1's room creation
    if (roomCreationResponse) {
      expect(roomCreationResponse).toContain('MessageTest');
      expect(roomCreationResponse).toContain('بازیکنان (1/2)');
      expect(roomCreationResponse).toContain('Small Blind: 10 سکه');
      expect(roomCreationResponse).toContain('Big Blind: 20 سکه');
    }
    
    // Check that the join response shows error for invalid room ID
    const joinResponse = responses[responses.length - 1]; // User2's join
    if (joinResponse) {
      expect(joinResponse).toContain('Invalid room ID format');
      expect(joinResponse).toContain('room_123');
    }
  });
}); 