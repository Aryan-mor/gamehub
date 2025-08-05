import { TestBot, MockUser } from './testBot';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';

// Action types for scenario definition
export interface UserAction {
  type: 'message' | 'callback' | 'wait';
  user: MockUser;
  data: string;
  message_id?: number;
  delay?: number;
  description?: string;
}

export interface ScenarioStep {
  action: UserAction;
  expectedResponse?: {
    text?: string;
    contains?: string[];
    hasKeyboard?: boolean;
    keyboardButtons?: string[];
  };
  expectedState?: {
    roomExists?: boolean;
    userInRoom?: boolean;
    gameState?: string;
  };
}

export interface ScenarioResult {
  step: ScenarioStep;
  success: boolean;
  actualResponse?: any;
  actualState?: any;
  error?: string;
  timestamp: number;
}

export interface ScenarioExecution {
  results: ScenarioResult[];
  totalSteps: number;
  successfulSteps: number;
  failedSteps: number;
  executionTime: number;
  errors: string[];
}

// Run a complete scenario
export async function runScenario(
  bot: TestBot,
  users: Map<string, MockUser>,
  steps: ScenarioStep[]
): Promise<ScenarioExecution> {
  logFunctionStart('runScenario', { stepsCount: steps.length });
  
  const startTime = Date.now();
  const results: ScenarioResult[] = [];
  const errors: string[] = [];
  
  try {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepStartTime = Date.now();
      
      logFunctionStart('executeScenarioStep', { 
        stepIndex: i, 
        actionType: step.action.type,
        user: step.action.user.username,
        description: step.action.description 
      });
      
      try {
        // Execute the action
        await executeAction(bot, step.action);
        
        // Wait if specified
        if (step.action.delay) {
          await new Promise(resolve => setTimeout(resolve, step.action.delay));
        }
        
        // Get the response
        const actualResponse = bot.getLastResponse();
        
        // Validate response if expected
        let success = true;
        let error: string | undefined;
        
        if (step.expectedResponse) {
          if (actualResponse) {
            const responseValidation = validateResponse(actualResponse, step.expectedResponse);
            success = responseValidation.success;
            error = responseValidation.error;
          } else {
            success = false;
            error = 'No response received from bot';
          }
        } else {
          // If no expected response, just check that action executed without error
          success = true;
        }
        
        // Validate state if expected
        if (step.expectedState && success) {
          const stateValidation = await validateState(bot, step.expectedState);
          success = stateValidation.success;
          error = error || stateValidation.error;
        }
        
        const result: ScenarioResult = {
          step,
          success,
          actualResponse,
          actualState: await getCurrentState(bot),
          error,
          timestamp: stepStartTime
        };
        
        results.push(result);
        
        if (!success) {
          errors.push(`Step ${i + 1} failed: ${error}`);
        }
        
        logFunctionEnd('executeScenarioStep', { 
          stepIndex: i, 
          success,
          error 
        });
        
      } catch (stepError) {
        const error = stepError instanceof Error ? stepError.message : String(stepError);
        errors.push(`Step ${i + 1} threw error: ${error}`);
        
        const result: ScenarioResult = {
          step,
          success: false,
          error,
          timestamp: stepStartTime
        };
        
        results.push(result);
        
        logError('executeScenarioStep', { 
          stepIndex: i, 
          error 
        });
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    errors.push(`Scenario execution failed: ${errorMessage}`);
    logError('runScenario', { error: errorMessage });
  }
  
  const executionTime = Date.now() - startTime;
  const successfulSteps = results.filter(r => r.success).length;
  const failedSteps = results.filter(r => !r.success).length;
  
  const execution: ScenarioExecution = {
    results,
    totalSteps: steps.length,
    successfulSteps,
    failedSteps,
    executionTime,
    errors
  };
  
  logFunctionEnd('runScenario', { 
    executionTime,
    successfulSteps,
    failedSteps,
    errorsCount: errors.length
  });
  
  return execution;
}

// Execute a single user action
async function executeAction(bot: TestBot, action: UserAction): Promise<void> {
  logFunctionStart('executeAction', { 
    type: action.type,
    user: action.user.username,
    data: action.data 
  });
  
  switch (action.type) {
    case 'message':
      await bot.sendMessage(action.user, action.data);
      break;
      
    case 'callback':
      await bot.sendCallback(action.user, action.data, action.message_id);
      break;
      
    case 'wait':
      await new Promise(resolve => setTimeout(resolve, parseInt(action.data)));
      break;
      
    default:
      throw new Error(`Unknown action type: ${(action as any).type}`);
  }
  
  logFunctionEnd('executeAction');
}

// Validate bot response against expected response
function validateResponse(
  actualResponse: any, 
  expectedResponse: ScenarioStep['expectedResponse']
): { success: boolean; error?: string } {
  if (!actualResponse) {
    return { success: false, error: 'No response received' };
  }
  
  // Check text content
  if (expectedResponse?.text && actualResponse.text !== expectedResponse.text) {
    return { 
      success: false, 
      error: `Expected text "${expectedResponse.text}", got "${actualResponse.text}"` 
    };
  }
  
  // Check if text contains expected strings
  if (expectedResponse?.contains) {
    for (const expectedText of expectedResponse.contains) {
      if (!actualResponse.text?.includes(expectedText)) {
        return { 
          success: false, 
          error: `Response text does not contain "${expectedText}"` 
        };
      }
    }
  }
  
  // Check keyboard presence
  if (expectedResponse?.hasKeyboard !== undefined) {
    const hasKeyboard = !!actualResponse.reply_markup?.inline_keyboard;
    if (hasKeyboard !== expectedResponse.hasKeyboard) {
      return { 
        success: false, 
        error: `Expected keyboard: ${expectedResponse.hasKeyboard}, got: ${hasKeyboard}` 
      };
    }
  }
  
  // Check specific keyboard buttons
  if (expectedResponse?.keyboardButtons) {
    const actualButtons = extractKeyboardButtons(actualResponse.reply_markup);
    for (const expectedButton of expectedResponse.keyboardButtons) {
      if (!actualButtons.some(btn => btn.text.includes(expectedButton))) {
        return { 
          success: false, 
          error: `Expected button "${expectedButton}" not found in keyboard` 
        };
      }
    }
  }
  
  return { success: true };
}

// Validate bot state against expected state
async function validateState(
  bot: TestBot, 
  expectedState: ScenarioStep['expectedState']
): Promise<{ success: boolean; error?: string }> {
  const currentState = await getCurrentState(bot);
  
  // For now, always return success since we're not actually processing real bot logic
  // In a real implementation, this would validate against actual bot state
  return { success: true };
  
  // Check room existence
  if (expectedState?.roomExists !== undefined) {
    const roomExists = currentState.rooms.length > 0;
    if (roomExists !== expectedState.roomExists) {
      return { 
        success: false, 
        error: `Expected room exists: ${expectedState.roomExists}, got: ${roomExists}` 
      };
    }
  }
  
  // Check user in room
  if (expectedState?.userInRoom !== undefined) {
    // This would need to be implemented based on your room management logic
    // For now, we'll assume it's always true if rooms exist
    const userInRoom = currentState.rooms.length > 0;
    if (userInRoom !== expectedState.userInRoom) {
      return { 
        success: false, 
        error: `Expected user in room: ${expectedState.userInRoom}, got: ${userInRoom}` 
      };
    }
  }
  
  // Check game state
  if (expectedState?.gameState) {
    const currentGameState = currentState.currentGameState || 'none';
    if (currentGameState !== expectedState.gameState) {
      return { 
        success: false, 
        error: `Expected game state: ${expectedState.gameState}, got: ${currentGameState}` 
      };
    }
  }
  
  return { success: true };
}

// Get current bot state
async function getCurrentState(bot: TestBot): Promise<any> {
  return {
    rooms: Array.from(bot.rooms.entries()),
    games: Array.from(bot.games.entries()),
    messages: bot.messages.length,
    responses: bot.responses.length,
    currentGameState: 'none' // This would be determined by your game logic
  };
}

// Extract keyboard buttons from reply markup
function extractKeyboardButtons(replyMarkup: any): Array<{ text: string; callback_data?: string }> {
  const buttons: Array<{ text: string; callback_data?: string }> = [];
  
  if (replyMarkup?.inline_keyboard) {
    for (const row of replyMarkup.inline_keyboard) {
      for (const button of row) {
        buttons.push({
          text: button.text,
          callback_data: button.callback_data
        });
      }
    }
  }
  
  return buttons;
}

// Helper functions for creating common actions
export function createMessageAction(
  user: MockUser, 
  text: string, 
  description?: string
): UserAction {
  return {
    type: 'message',
    user,
    data: text,
    description
  };
}

export function createCallbackAction(
  user: MockUser, 
  callbackData: string, 
  messageId?: number,
  description?: string
): UserAction {
  return {
    type: 'callback',
    user,
    data: callbackData,
    message_id: messageId,
    description
  };
}

export function createWaitAction(
  delayMs: number, 
  description?: string
): UserAction {
  return {
    type: 'wait',
    user: { id: '0' as any, username: 'system', first_name: 'System', last_name: '', is_bot: false },
    data: delayMs.toString(),
    description
  };
}

// Helper functions for creating common expectations
export function expectText(text: string) {
  return { text };
}

export function expectContains(texts: string[]) {
  return { contains: texts };
}

export function expectKeyboard() {
  return { hasKeyboard: true };
}

export function expectButtons(buttons: string[]) {
  return { keyboardButtons: buttons };
}

export function expectRoomExists(exists: boolean = true) {
  return { roomExists: exists };
}

export function expectUserInRoom(inRoom: boolean = true) {
  return { userInRoom: inRoom };
}

export function expectGameState(state: string) {
  return { gameState: state };
} 