import { expect } from 'vitest';
import { TestBot, MockUser } from './testBot';
import { ScenarioExecution, ScenarioResult } from './scenarioRunner';
import { logFunctionStart, logFunctionEnd } from '@/modules/core/logger';

// Assertion helpers for bot responses
export function assertBotResponse(
  execution: ScenarioExecution,
  expectedResponse: {
    text?: string;
    contains?: string[];
    hasKeyboard?: boolean;
    keyboardButtons?: string[];
    method?: string;
  }
): void {
  logFunctionStart('assertBotResponse', { expectedResponse });
  
  const lastResult = execution.results[execution.results.length - 1];
  expect(lastResult.success).toBe(true);
  
  if (!lastResult.actualResponse) {
    throw new Error('No response received from bot');
  }
  
  const response = lastResult.actualResponse;
  
  // Check method
  if (expectedResponse.method) {
    expect(response.method).toBe(expectedResponse.method);
  }
  
  // Check text content
  if (expectedResponse.text) {
    expect(response.text).toBe(expectedResponse.text);
  }
  
  // Check if text contains expected strings
  if (expectedResponse.contains) {
    for (const expectedText of expectedResponse.contains) {
      expect(response.text).toContain(expectedText);
    }
  }
  
  // Check keyboard presence
  if (expectedResponse.hasKeyboard !== undefined) {
    const hasKeyboard = !!response.reply_markup?.inline_keyboard;
    expect(hasKeyboard).toBe(expectedResponse.hasKeyboard);
  }
  
  // Check specific keyboard buttons
  if (expectedResponse.keyboardButtons) {
    const actualButtons = extractKeyboardButtons(response.reply_markup);
    for (const expectedButton of expectedResponse.keyboardButtons) {
      const hasButton = actualButtons.some(btn => 
        btn.text.includes(expectedButton)
      );
      expect(hasButton).toBe(true);
    }
  }
  
  logFunctionEnd('assertBotResponse');
}

// Assertion helpers for database state
export function assertDatabaseState(
  execution: ScenarioExecution,
  expectedState: {
    roomExists?: boolean;
    userInRoom?: boolean;
    gameState?: string;
    roomCount?: number;
    gameCount?: number;
  }
): void {
  logFunctionStart('assertDatabaseState', { expectedState });
  
  const lastResult = execution.results[execution.results.length - 1];
  expect(lastResult.success).toBe(true);
  
  if (!lastResult.actualState) {
    throw new Error('No state information available');
  }
  
  const state = lastResult.actualState;
  
  // Check room existence
  if (expectedState.roomExists !== undefined) {
    const roomExists = state.rooms.length > 0;
    expect(roomExists).toBe(expectedState.roomExists);
  }
  
  // Check user in room
  if (expectedState.userInRoom !== undefined) {
    const userInRoom = state.rooms.length > 0; // Simplified for now
    expect(userInRoom).toBe(expectedState.userInRoom);
  }
  
  // Check game state
  if (expectedState.gameState) {
    expect(state.currentGameState).toBe(expectedState.gameState);
  }
  
  // Check room count
  if (expectedState.roomCount !== undefined) {
    expect(state.rooms.length).toBe(expectedState.roomCount);
  }
  
  // Check game count
  if (expectedState.gameCount !== undefined) {
    expect(state.games.length).toBe(expectedState.gameCount);
  }
  
  logFunctionEnd('assertDatabaseState');
}

// Assertion helpers for scenario execution
export function assertScenarioSuccess(execution: ScenarioExecution): void {
  logFunctionStart('assertScenarioSuccess');
  
  expect(execution.failedSteps).toBe(0);
  expect(execution.successfulSteps).toBe(execution.totalSteps);
  expect(execution.errors.length).toBe(0);
  
  logFunctionEnd('assertScenarioSuccess');
}

export function assertScenarioFailure(
  execution: ScenarioExecution,
  expectedErrorCount: number = 1
): void {
  logFunctionStart('assertScenarioFailure', { expectedErrorCount });
  
  expect(execution.failedSteps).toBeGreaterThan(0);
  expect(execution.errors.length).toBe(expectedErrorCount);
  
  logFunctionEnd('assertScenarioFailure');
}

// Assertion helpers for specific user responses
export function assertUserReceivedMessage(
  bot: TestBot,
  user: MockUser,
  expectedMessage: {
    text?: string;
    contains?: string[];
    hasKeyboard?: boolean;
    keyboardButtons?: string[];
  }
): void {
  logFunctionStart('assertUserReceivedMessage', { 
    user: user.username, 
    expectedMessage 
  });
  
  const userResponses = bot.getResponsesForUser(user);
  expect(userResponses.length).toBeGreaterThan(0);
  
  const lastResponse = userResponses[userResponses.length - 1];
  
  // Check text content
  if (expectedMessage.text) {
    expect(lastResponse.text).toBe(expectedMessage.text);
  }
  
  // Check if text contains expected strings
  if (expectedMessage.contains) {
    for (const expectedText of expectedMessage.contains) {
      expect(lastResponse.text).toContain(expectedText);
    }
  }
  
  // Check keyboard presence
  if (expectedMessage.hasKeyboard !== undefined) {
    const hasKeyboard = !!lastResponse.reply_markup?.inline_keyboard;
    expect(hasKeyboard).toBe(expectedMessage.hasKeyboard);
  }
  
  // Check specific keyboard buttons
  if (expectedMessage.keyboardButtons) {
    const actualButtons = extractKeyboardButtons(lastResponse.reply_markup);
    for (const expectedButton of expectedMessage.keyboardButtons) {
      const hasButton = actualButtons.some(btn => 
        btn.text.includes(expectedButton)
      );
      expect(hasButton).toBe(true);
    }
  }
  
  logFunctionEnd('assertUserReceivedMessage');
}

// Assertion helpers for room state
export function assertRoomState(
  bot: TestBot,
  expectedState: {
    exists: boolean;
    playerCount?: number;
    gameStarted?: boolean;
    creator?: MockUser;
  }
): void {
  logFunctionStart('assertRoomState', { expectedState });
  
  const roomExists = bot.rooms.size > 0;
  expect(roomExists).toBe(expectedState.exists);
  
  if (expectedState.exists && bot.rooms.size > 0) {
    const room = Array.from(bot.rooms.values())[0];
    
    // Check player count
    if (expectedState.playerCount !== undefined) {
      expect(room.players?.length || 0).toBe(expectedState.playerCount);
    }
    
    // Check game started
    if (expectedState.gameStarted !== undefined) {
      expect(room.gameStarted || false).toBe(expectedState.gameStarted);
    }
    
    // Check creator
    if (expectedState.creator) {
      expect(room.created_by).toBe(expectedState.creator.id);
    }
  }
  
  logFunctionEnd('assertRoomState');
}

// Assertion helpers for game state
export function assertGameState(
  bot: TestBot,
  expectedState: {
    exists: boolean;
    status?: string;
    currentPlayer?: MockUser;
    playerCount?: number;
  }
): void {
  logFunctionStart('assertGameState', { expectedState });
  
  const gameExists = bot.games.size > 0;
  expect(gameExists).toBe(expectedState.exists);
  
  if (expectedState.exists && bot.games.size > 0) {
    const game = Array.from(bot.games.values())[0];
    
    // Check game status
    if (expectedState.status) {
      expect(game.status).toBe(expectedState.status);
    }
    
    // Check current player
    if (expectedState.currentPlayer) {
      expect(game.currentPlayer).toBe(expectedState.currentPlayer.id);
    }
    
    // Check player count
    if (expectedState.playerCount !== undefined) {
      expect(game.players?.length || 0).toBe(expectedState.playerCount);
    }
  }
  
  logFunctionEnd('assertGameState');
}

// Helper function to extract keyboard buttons
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

// Assertion helpers for error messages
export function assertErrorMessage(
  execution: ScenarioExecution,
  expectedError: {
    contains?: string[];
    stepIndex?: number;
  }
): void {
  logFunctionStart('assertErrorMessage', { expectedError });
  
  if (expectedError.stepIndex !== undefined) {
    const stepResult = execution.results[expectedError.stepIndex];
    expect(stepResult.success).toBe(false);
    
    if (expectedError.contains) {
      for (const expectedText of expectedError.contains) {
        expect(stepResult.error).toContain(expectedText);
      }
    }
  } else {
    // Check all errors
    expect(execution.errors.length).toBeGreaterThan(0);
    
    if (expectedError.contains) {
      const allErrors = execution.errors.join(' ');
      for (const expectedText of expectedError.contains) {
        expect(allErrors).toContain(expectedText);
      }
    }
  }
  
  logFunctionEnd('assertErrorMessage');
}

// Assertion helpers for timing
export function assertExecutionTime(
  execution: ScenarioExecution,
  maxTimeMs: number
): void {
  logFunctionStart('assertExecutionTime', { maxTimeMs });
  
  expect(execution.executionTime).toBeLessThan(maxTimeMs);
  
  logFunctionEnd('assertExecutionTime');
}

// Assertion helpers for step count
export function assertStepCount(
  execution: ScenarioExecution,
  expectedSteps: number
): void {
  logFunctionStart('assertStepCount', { expectedSteps });
  
  expect(execution.totalSteps).toBe(expectedSteps);
  
  logFunctionEnd('assertStepCount');
}

// Utility function to get callback data from keyboard
export function getCallbackDataFromKeyboard(
  bot: TestBot,
  user: MockUser,
  buttonText: string
): string | null {
  const userResponses = bot.getResponsesForUser(user);
  const lastResponse = userResponses[userResponses.length - 1];
  
  if (!lastResponse.reply_markup?.inline_keyboard) {
    return null;
  }
  
  for (const row of lastResponse.reply_markup.inline_keyboard) {
    for (const button of row) {
      if (button.text.includes(buttonText)) {
        return button.callback_data;
      }
    }
  }
  
  return null;
}

// Utility function to wait for specific condition
export async function waitForCondition(
  condition: () => boolean,
  timeoutMs: number = 5000,
  intervalMs: number = 100
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    if (condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  throw new Error(`Condition not met within ${timeoutMs}ms`);
} 