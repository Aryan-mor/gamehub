import { Bot, Context } from 'grammy';
import { UserId, RoomId } from '../../../src/utils/types';
import { PlayerId } from '../../../src/actions/games/poker/types';
import { logFunctionStart, logFunctionEnd, logError } from '../../../src/modules/core/logger';

// Mock Telegram API responses
interface MockTelegramResponse {
  ok: boolean;
  result?: any;
  description?: string;
}

// Mock user data
export interface MockUser {
  id: UserId;
  username: string;
  first_name: string;
  last_name: string;
  is_bot: boolean;
}

// Test bot interface
export interface TestBot {
  bot: Bot;
  users: Map<string, MockUser>;
  messages: Array<{
    user: MockUser;
    text?: string;
    callback_data?: string;
    chat_id: number;
    message_id?: number;
    timestamp: number;
  }>;
  responses: Array<{
    chat_id: number;
    text?: string;
    reply_markup?: any;
    method: string;
    timestamp: number;
  }>;
  rooms: Map<RoomId, any>;
  games: Map<string, any>;
  cleanup: () => Promise<void>;
  sendMessage: (user: MockUser, text: string) => Promise<void>;
  sendCallback: (user: MockUser, callback_data: string, message_id?: number) => Promise<void>;
  getLastResponse: () => any;
  getResponsesForUser: (user: MockUser) => any[];
  assertResponse: (expected: Partial<any>) => void;
}

// Utility function to generate valid room IDs
export function generateValidRoomId(): RoomId {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'room_';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result as RoomId;
}

// Create mock users
export function createMockUsers(): Map<string, MockUser> {
  const users = new Map<string, MockUser>();
  
  users.set('userA', {
    id: '123456789' as UserId,
    username: 'user_a',
    first_name: 'Alice',
    last_name: 'Johnson',
    is_bot: false
  });
  
  users.set('userB', {
    id: '987654321' as UserId,
    username: 'user_b',
    first_name: 'Bob',
    last_name: 'Smith',
    is_bot: false
  });
  
  users.set('userC', {
    id: '555666777' as UserId,
    username: 'user_c',
    first_name: 'Charlie',
    last_name: 'Brown',
    is_bot: false
  });
  
  return users;
}

// Create test bot instance
export async function createTestBot(): Promise<TestBot> {
  logFunctionStart('createTestBot');
  
  // Create bot with mock token and bot info
  const bot = new Bot('test_token_123456789', {
    botInfo: {
      id: 123456789,
      is_bot: true,
      first_name: 'TestBot',
      username: 'test_bot',
      can_join_groups: true,
      can_read_all_group_messages: false,
      supports_inline_queries: false
    }
  });

  // Import and setup real bot handlers
  try {
    // Import the main router and initialize routes
    const { initializeRoutes } = await import('../../../src/main-router');
    initializeRoutes();
    
    // Import individual handlers to ensure they're loaded
    await import('../../../src/actions/games/poker/start');
    await import('../../../src/actions/games/poker/room/create');
    await import('../../../src/actions/games/poker/room/create/form');
    await import('../../../src/actions/games/poker/room/join');
    await import('../../../src/actions/games/poker/room/leave');
    await import('../../../src/actions/games/poker/room/ready');
    await import('../../../src/actions/games/poker/room/start');
    await import('../../../src/actions/games/poker/room/share');
    await import('../../../src/actions/games/poker/room/info');
    console.log('✅ Real bot handlers imported successfully');
  } catch (error) {
    console.warn('⚠️ Could not import real bot handlers:', error);
  }
  
  // Initialize test state
  const users = createMockUsers();
  const messages: TestBot['messages'] = [];
  const responses: TestBot['responses'] = [];
  const rooms = new Map<RoomId, any>();
  const games = new Map<string, any>();
  
  // Set up global responses tracking
  (global as any).testBotResponses = responses;
  
  // Mock the bot's API methods
  const originalApi = bot.api;
  
  bot.api = {
    ...originalApi,
    sendMessage: async (chat_id: number, text: string, options?: any) => {
      logFunctionStart('mockSendMessage', { chat_id, text, options });
      
      const response = {
        ok: true,
        result: {
          message_id: Math.floor(Math.random() * 1000000) + 1,
          chat: { id: chat_id, type: 'private' },
          text,
          reply_markup: options?.reply_markup,
          date: Math.floor(Date.now() / 1000)
        }
      };
      
      responses.push({
        chat_id,
        text,
        reply_markup: options?.reply_markup,
        method: 'sendMessage',
        timestamp: Date.now()
      });
      
      logFunctionEnd('mockSendMessage', { response });
      return response;
    },
    
    editMessageText: async (chat_id: number, message_id: number, text: string, options?: any) => {
      logFunctionStart('mockEditMessageText', { chat_id, message_id, text, options });
      
      const response = {
        ok: true,
        result: {
          message_id: message_id || Math.floor(Math.random() * 1000000) + 1,
          chat: { id: chat_id, type: 'private' },
          text,
          reply_markup: options?.reply_markup,
          date: Math.floor(Date.now() / 1000)
        }
      };
      
      responses.push({
        chat_id,
        text,
        reply_markup: options?.reply_markup,
        method: 'editMessageText',
        timestamp: Date.now()
      });
      
      logFunctionEnd('mockEditMessageText', { response });
      return response;
    },
    
    answerCallbackQuery: async (callback_query_id: string, options?: any) => {
      logFunctionStart('mockAnswerCallbackQuery', { callback_query_id, options });
      
      const response = {
        ok: true,
        result: true
      };
      
      responses.push({
        chat_id: 0, // Callback queries don't have chat_id
        text: options?.text,
        method: 'answerCallbackQuery',
        timestamp: Date.now()
      });
      
      logFunctionEnd('mockAnswerCallbackQuery', { response });
      return response;
    }
  };
  
  // Test bot methods
  const testBot: TestBot = {
    bot,
    users,
    messages,
    responses,
    rooms,
    games,
    
    async cleanup() {
      logFunctionStart('testBotCleanup');
      
      // Clear all test data
      messages.length = 0;
      responses.length = 0;
      rooms.clear();
      games.clear();
      
      // Reset bot state
      bot.api = originalApi;
      
      logFunctionEnd('testBotCleanup');
    },
    
    async sendMessage(user: MockUser, text: string) {
      logFunctionStart('testBotSendMessage', { user: user.username, text });
      
      const message = {
        user,
        text,
        chat_id: parseInt(user.id),
        timestamp: Date.now()
      };
      
      messages.push(message);
      
      try {
        // Create mock context and process message
        const ctx = createMockContext(user, responses, text);
        
        // Handle /start command
        if (text === '/start') {
          await bot.handleUpdate({
            update_id: Date.now(),
            message: {
              message_id: Math.floor(Math.random() * 1000000) + 1,
              from: user,
              chat: { id: parseInt(user.id), type: 'private' },
              date: Math.floor(Date.now() / 1000),
              text
            }
          });
        }
                // Handle poker command
        else if (text === 'poker') {
          // Use compact router for poker actions
          const { dispatch } = await import('../../../src/modules/core/compact-router');
          const { HandlerContext } = await import('../../../src/modules/core/handler');
          const { UserId } = await import('../../../src/utils/types');
          
          const context: HandlerContext = {
            ctx,
            user: {
              id: user.id as UserId,
              username: user.username
            }
          };
          
          await dispatch('gpst', context, {});
        }
        // Handle other text messages
        else {
          await bot.handleUpdate({
            update_id: Date.now(),
            message: {
              message_id: Math.floor(Math.random() * 1000000) + 1,
              from: user,
              chat: { id: parseInt(user.id), type: 'private' },
              date: Math.floor(Date.now() / 1000),
              text
            }
          });
        }
      } catch (error) {
        console.error('Error processing message:', error);
        // Still record the message even if processing fails
      }
      
      logFunctionEnd('testBotSendMessage');
    },
    
    async sendCallback(user: MockUser, callback_data: string, message_id?: number) {
      logFunctionStart('testBotSendCallback', { user: user.username, callback_data });
      
      const message = {
        user,
        callback_data,
        chat_id: parseInt(user.id),
        message_id: message_id || Math.floor(Math.random() * 1000000) + 1,
        timestamp: Date.now()
      };
      
      messages.push(message);
      
      try {
        // Create mock context and process callback
        const ctx = createMockContext(user, responses, undefined, callback_data, message_id);
        
        // Use compact router for callback processing
        const { dispatch, parseCallbackData } = await import('../../../src/modules/core/compact-router');
        const { HandlerContext } = await import('../../../src/modules/core/handler');
        const { UserId } = await import('../../../src/utils/types');
        
        const context: HandlerContext = {
          ctx,
          user: {
            id: user.id as UserId,
            username: user.username
          }
        };
        
        // Parse compact callback data
        const { code, params } = parseCallbackData(callback_data);
        
        console.log(`🔍 PARSED CALLBACK DATA: code=${code}, params=`, params);
        
        // Dispatch to compact router
        await dispatch(code, context, params);
        
      } catch (error) {
        console.error('Error processing callback:', error);
        // Still record the message even if processing fails
      }
      
      logFunctionEnd('testBotSendCallback');
    },
    
    getLastResponse() {
      return responses[responses.length - 1];
    },
    
    getResponsesForUser(user: MockUser) {
      return responses.filter(r => r.chat_id === parseInt(user.id));
    },
    
    assertResponse(expected: Partial<any>) {
      const lastResponse = this.getLastResponse();
      expect(lastResponse).toMatchObject(expected);
    }
  };
  
  logFunctionEnd('createTestBot');
  return testBot;
}

// Create mock context for testing
function createMockContext(
  user: MockUser, 
  responses: TestBot['responses'],
  text?: string, 
  callback_data?: string, 
  message_id?: number
): Context {
  const ctx = {
    from: user,
    chat: { id: parseInt(user.id), type: 'private' },
    message: text ? {
      message_id: message_id || Math.floor(Math.random() * 1000000) + 1,
      from: user,
      chat: { id: parseInt(user.id), type: 'private' },
      date: Math.floor(Date.now() / 1000),
      text
    } : undefined,
    callbackQuery: callback_data ? {
      id: Date.now().toString(),
      from: user,
      chat_instance: 'test',
      data: callback_data,
      message: {
        message_id: message_id || Math.floor(Math.random() * 1000000) + 1,
        from: { id: 123456789, is_bot: true, first_name: 'TestBot' },
        chat: { id: parseInt(user.id), type: 'private' },
        date: Math.floor(Date.now() / 1000)
      }
    } : undefined,
    reply: async (text: string, options?: any) => {
      // Record the response
      const response = {
        ok: true,
        result: {
          message_id: Math.floor(Math.random() * 1000000) + 1,
          chat: { id: parseInt(user.id), type: 'private' },
          text,
          reply_markup: options?.reply_markup,
          date: Math.floor(Date.now() / 1000)
        }
      };
      
      // Add to responses array for tracking
      const responseData = {
        chat_id: parseInt(user.id),
        text,
        reply_markup: options?.reply_markup,
        method: 'reply',
        timestamp: Date.now()
      };
      
      responses.push(responseData);
      if (global.testBotResponses) {
        global.testBotResponses.push(responseData);
      }
      
      return response;
    },
    editMessageText: async (text: string, options?: any) => {
      // Record the response
      const response = {
        ok: true,
        result: {
          message_id: message_id || Math.floor(Math.random() * 1000000) + 1,
          chat: { id: parseInt(user.id), type: 'private' },
          text,
          reply_markup: options?.reply_markup,
          date: Math.floor(Date.now() / 1000)
        }
      };
      
      // Add to responses array for tracking
      const responseData = {
        chat_id: parseInt(user.id),
        text,
        reply_markup: options?.reply_markup,
        method: 'editMessageText',
        timestamp: Date.now()
      };
      
      responses.push(responseData);
      if (global.testBotResponses) {
        global.testBotResponses.push(responseData);
      }
      
      return response;
    },
    answerCallbackQuery: async (options?: any) => {
      // Record the response
      const response = {
        ok: true,
        result: true
      };
      
      // Add to responses array for tracking
      if (global.testBotResponses) {
        global.testBotResponses.push({
          chat_id: 0, // Callback queries don't have chat_id
          text: options?.text,
          method: 'answerCallbackQuery',
          timestamp: Date.now()
        });
      }
      
      return response;
    }
  } as Context;
  
  return ctx;
}

// Export types for use in tests
export type { MockUser, TestBot }; 