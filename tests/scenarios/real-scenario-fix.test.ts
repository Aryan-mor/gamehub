import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestBot, createMockUsers, MockUser } from './utils/testBot';
import { 
  runScenario, 
  createMessageAction, 
  createCallbackAction,
  expectContains
} from './utils/scenarioRunner';

describe('Real Scenario Fix Test', () => {
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

  it('should handle room sharing and joining without undefined values', async () => {
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
        action: createCallbackAction(user1, 'gpfst?s=name&v=safsa&privacy=true&maxPlayers=2&smallBlind=50&timeout=60', undefined, 'Quick room creation'),
        expectedResponse: expectContains(['فرم تکمیل شد'])
      },
      
      {
        action: createCallbackAction(user1, 'gpcc', undefined, 'User1 confirms room creation'),
        expectedResponse: expectContains(['safsa'])
      },
      
      // User1 shares the room
      {
        action: createCallbackAction(user1, 'gpsh', undefined, 'User1 shares room'),
        expectedResponse: expectContains(['دعوت به بازی پوکر', 'safsa', 'اشتراک‌گذاری'])
      },
      
      // User2 joins via shared link
      {
        action: createMessageAction(user2, '/start', 'User2 starts'),
        expectedResponse: expectContains(['Welcome'])
      },
      
      {
        action: createMessageAction(user2, 'poker', 'User2 selects poker'),
        expectedResponse: expectContains(['Poker'])
      },
      
      {
        action: createCallbackAction(user2, 'gpj?r=room_123', undefined, 'User2 joins via shared link'),
        expectedResponse: expectContains(['safsa', 'Players: 2/2'])
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
    
    // Check that room information is properly displayed
    const roomInfoResponses = responses.filter(r => 
      r.includes('اطلاعات روم پوکر') || 
      r.includes('مشخصات روم') || 
      r.includes('تنظیمات بازی')
    );
    
    roomInfoResponses.forEach((response, index) => {
      // Check that room info contains proper values
      expect(response).toContain('safsa'); // Room name
      expect(response).toContain('Small Blind: 50'); // Small blind
      expect(response).toContain('Big Blind: 100'); // Big blind
      expect(response).toContain('تایم‌اوت نوبت: 60 ثانیه'); // Timeout
      expect(response).toContain('حداکثر بازیکن: 2 نفر'); // Max players
      expect(response).toContain('وضعیت: ⏳ منتظر بازیکنان'); // Status
      expect(response).toContain('نوع: 🔒 خصوصی'); // Privacy type
    });
  });
}); 