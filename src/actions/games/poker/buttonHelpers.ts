import { 
  generateButton, 
  generateButtons, 
  createInlineKeyboard,
  createCustomKeyboard,
  ButtonDefinition 
} from '@/modules/core/buttonHelpers';
import { pokerButtonTemplates } from './room/_button/buttonTemplates';
import { roomControls } from './room/management/buttonSets';
import { gameActions } from './room/game/buttonSets';
import { raiseOptions } from './room/raise/buttonSets';
import { stakeOptions } from './stake/buttonSets';
import { gameEndOptions } from './room/gameEnd/buttonSets';
import { generateCallbackData } from '@/modules/core/compact-router';

/**
 * Generate a single poker button with parameters
 */
export function generatePokerButton(
  action: string,
  params: Record<string, string> = {}
): ButtonDefinition {
  return generateButton(action, params, pokerButtonTemplates);
}

/**
 * Generate multiple poker buttons with parameters
 */
export function generatePokerButtons(
  actions: string[],
  params: Record<string, string> = {}
): ButtonDefinition[] {
  return generateButtons(actions, params, pokerButtonTemplates);
}

/**
 * Generate poker keyboard from button set with parameters
 */
export function generatePokerKeyboard(
  buttonSet: string[] | string[][],
  params: Record<string, string> = {},
  showBack = false
): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  // Check if buttonSet is already a layout (array of arrays)
  if (Array.isArray(buttonSet[0])) {
    // It's already a layout, use it directly
    return createCustomKeyboard(buttonSet as string[][], pokerButtonTemplates, params);
  } else {
    // It's a flat array, convert to layout and add back button if needed
    const buttons = generatePokerButtons(buttonSet as string[], params);
    
    if (showBack) {
      // Add the appropriate back button based on context
      const backAction = (buttonSet as string[]).includes('backToMenu') ? 'backToMenu' : 'back';
      const backButton = generatePokerButton(backAction, params);
      buttons.push(backButton);
    }
    
    return createInlineKeyboard(buttons);
  }
}

/**
 * Generate main menu keyboard with custom layout (2 buttons per row)
 */
export function generateMainMenuKeyboard(): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  return createCustomKeyboard(roomControls.mainMenu, pokerButtonTemplates, {});
}

/**
 * Generate room management keyboard with custom layout (3 buttons per row)
 */
export function generateRoomManagementKeyboard(roomId: string): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  return createCustomKeyboard(roomControls.roomManagement, pokerButtonTemplates, { roomId });
}

/**
 * Generate room management keyboard with custom layout (3 buttons per row)
 */
export function generateRoomManagementKeyboardCustom(roomId: string): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  // Custom layout: 3 buttons per row for better space utilization
  const layout = [
    ['startGame', 'ready', 'notReady'],  // Row 1: Start | Ready | Not Ready
    ['leaveRoom', 'back']                // Row 2: Leave | Back
  ];
  
  return createCustomKeyboard(layout, pokerButtonTemplates, { roomId });
}

/**
 * Generate game action keyboard
 */
export function generateGameActionKeyboard(
  roomId: string,
  includeAllIn = false
): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  const buttonSet = includeAllIn ? gameActions.withAllIn : gameActions.standard;
  return createCustomKeyboard(buttonSet, pokerButtonTemplates, { roomId });
}

/**
 * Generate game action keyboard with custom layout (2 buttons per row)
 */
export function generateGameActionKeyboardCustom(
  roomId: string,
  includeAllIn = false
): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  if (includeAllIn) {
    // Custom layout with All-In: 2 buttons per row
    const layout = [
      ['call', 'fold'],       // Row 1: Call | Fold
      ['raise', 'allIn'],     // Row 2: Raise | All In
      ['back']                // Row 3: Back
    ];
    return createCustomKeyboard(layout, pokerButtonTemplates, { roomId });
  } else {
    // Standard layout: 2 buttons per row
    const layout = [
      ['call', 'fold'],       // Row 1: Call | Fold
      ['raise', 'back']       // Row 2: Raise | Back
    ];
    return createCustomKeyboard(layout, pokerButtonTemplates, { roomId });
  }
}

/**
 * Generate stake selection keyboard
 */
export function generateStakeSelectionKeyboard(): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  return createCustomKeyboard(stakeOptions.standard, pokerButtonTemplates, {});
}

/**
 * Generate raise amount keyboard
 */
export function generateRaiseAmountKeyboard(roomId: string): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  return createCustomKeyboard(raiseOptions.all, pokerButtonTemplates, { roomId });
}

/**
 * Generate game end keyboard
 */
export function generateGameEndKeyboard(roomId: string): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  return createCustomKeyboard(gameEndOptions.standard, pokerButtonTemplates, { roomId });
}

/**
 * Generate spectator keyboard
 */
export function generateSpectatorKeyboard(roomId: string): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  const spectatorButtons = [
    ['refresh', 'backToMenu'],
    ['help']
  ];
  
  return createCustomKeyboard(spectatorButtons, pokerButtonTemplates, { roomId });
}

/**
 * Generate custom poker keyboard with specific actions
 */
export function generateCustomPokerKeyboard(
  actions: string[],
  params: Record<string, string> = {},
  showBack = false
): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  const buttons = generatePokerButtons(actions, params);
  
  if (showBack) {
    const backButton = generatePokerButton('back', params);
    buttons.push(backButton);
  }
  
  return createInlineKeyboard(buttons);
}

// Export button sets for direct access
export { 
  roomControls,
  gameActions,
  raiseOptions,
  stakeOptions,
  gameEndOptions
}; 