import { 
  generateButton, 
  generateButtons, 
  createInlineKeyboard,
  createCustomKeyboard,
  ButtonDefinition 
} from '@/modules/core/buttonHelpers';
import { createPokerButtonTemplates } from './room/_button/buttonTemplates';
import { roomControls } from './room/management/buttonSets';
import { gameActions } from './room/game/buttonSets';
import { raiseOptions } from './room/raise/buttonSets';
import { stakeOptions } from './stake/buttonSets';
import { gameEndOptions } from './room/gameEnd/buttonSets';


/**
 * Generate a single poker button with parameters
 * Note: This function requires ctx to be passed from the handler
 */
export function generatePokerButton(
  action: string,
  params: Record<string, string> = {},
  ctx?: any
): ButtonDefinition {
  const templates = ctx ? createPokerButtonTemplates(ctx) : {};
  return generateButton(action, params, templates);
}

/**
 * Generate multiple poker buttons with parameters
 * Note: This function requires ctx to be passed from the handler
 */
export function generatePokerButtons(
  actions: string[],
  params: Record<string, string> = {},
  ctx?: any
): ButtonDefinition[] {
  const templates = ctx ? createPokerButtonTemplates(ctx) : {};
  return generateButtons(actions, params, templates);
}

/**
 * Generate poker keyboard from button set with parameters
 * Note: This function requires ctx to be passed from the handler
 */
export function generatePokerKeyboard(
  buttonSet: string[] | string[][],
  params: Record<string, string> = {},
  showBack = false,
  ctx?: any
): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  const templates = ctx ? createPokerButtonTemplates(ctx) : {};
  
  // Check if buttonSet is already a layout (array of arrays)
  if (Array.isArray(buttonSet[0])) {
    // It's already a layout, use it directly
    return createCustomKeyboard(buttonSet as string[][], templates, params);
  } else {
    // It's a flat array, convert to layout and add back button if needed
    const buttons = generatePokerButtons(buttonSet as string[], params, ctx);
    
    if (showBack) {
      // Add the appropriate back button based on context
      const backAction = (buttonSet as string[]).includes('backToMenu') ? 'backToMenu' : 'back';
      const backButton = generatePokerButton(backAction, params, ctx);
      buttons.push(backButton);
    }
    
    return createInlineKeyboard(buttons);
  }
}

/**
 * Generate main menu keyboard with custom layout (2 buttons per row)
 * Note: This function requires ctx to be passed from the handler
 */
export function generateMainMenuKeyboard(ctx?: any): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  const templates = ctx ? createPokerButtonTemplates(ctx) : {};
  return createCustomKeyboard(roomControls.mainMenu, templates, {});
}

/**
 * Generate room management keyboard with custom layout (3 buttons per row)
 * Note: This function requires ctx to be passed from the handler
 */
export function generateRoomManagementKeyboard(roomId: string, ctx?: any): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  const templates = ctx ? createPokerButtonTemplates(ctx) : {};
  return createCustomKeyboard(roomControls.roomManagement, templates, { roomId });
}

/**
 * Generate room management keyboard with custom layout (3 buttons per row)
 * Note: This function requires ctx to be passed from the handler
 */
export function generateRoomManagementKeyboardCustom(roomId: string, ctx?: any): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  const templates = ctx ? createPokerButtonTemplates(ctx) : {};
  // Custom layout: 3 buttons per row for better space utilization
  const layout = [
    ['startGame', 'ready', 'notReady'],  // Row 1: Start | Ready | Not Ready
    ['leaveRoom', 'back']                // Row 2: Leave | Back
  ];
  
  return createCustomKeyboard(layout, templates, { roomId });
}

/**
 * Generate game action keyboard
 * Note: This function requires ctx to be passed from the handler
 */
export function generateGameActionKeyboard(
  roomId: string,
  includeAllIn = false,
  ctx?: any
): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  const templates = ctx ? createPokerButtonTemplates(ctx) : {};
  const buttonSet = includeAllIn ? gameActions.withAllIn : gameActions.standard;
  return createCustomKeyboard(buttonSet, templates, { roomId });
}

/**
 * Generate game action keyboard with custom layout (2 buttons per row)
 * Note: This function requires ctx to be passed from the handler
 */
export function generateGameActionKeyboardCustom(
  roomId: string,
  includeAllIn = false,
  ctx?: any
): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  const templates = ctx ? createPokerButtonTemplates(ctx) : {};
  if (includeAllIn) {
    // Custom layout with All-In: 2 buttons per row
    const layout = [
      ['call', 'fold'],       // Row 1: Call | Fold
      ['raise', 'allIn'],     // Row 2: Raise | All In
      ['back']                // Row 3: Back
    ];
    return createCustomKeyboard(layout, templates, { roomId });
  } else {
    // Standard layout: 2 buttons per row
    const layout = [
      ['call', 'fold'],       // Row 1: Call | Fold
      ['raise', 'back']       // Row 2: Raise | Back
    ];
    return createCustomKeyboard(layout, templates, { roomId });
  }
}

/**
 * Generate stake selection keyboard
 * Note: This function requires ctx to be passed from the handler
 */
export function generateStakeSelectionKeyboard(ctx?: any): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  const templates = ctx ? createPokerButtonTemplates(ctx) : {};
  return createCustomKeyboard(stakeOptions.standard, templates, {});
}

/**
 * Generate raise amount keyboard
 * Note: This function requires ctx to be passed from the handler
 */
export function generateRaiseAmountKeyboard(roomId: string, ctx?: any): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  const templates = ctx ? createPokerButtonTemplates(ctx) : {};
  return createCustomKeyboard(raiseOptions.all, templates, { roomId });
}

/**
 * Generate game end keyboard
 * Note: This function requires ctx to be passed from the handler
 */
export function generateGameEndKeyboard(roomId: string, ctx?: any): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  const templates = ctx ? createPokerButtonTemplates(ctx) : {};
  return createCustomKeyboard(gameEndOptions.standard, templates, { roomId });
}

/**
 * Generate spectator keyboard
 * Note: This function requires ctx to be passed from the handler
 */
export function generateSpectatorKeyboard(roomId: string, ctx?: any): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  const templates = ctx ? createPokerButtonTemplates(ctx) : {};
  const spectatorButtons = [
    ['refresh', 'backToMenu'],
    ['help']
  ];
  
  return createCustomKeyboard(spectatorButtons, templates, { roomId });
}

/**
 * Generate custom poker keyboard with specific actions
 * Note: This function requires ctx to be passed from the handler
 */
export function generateCustomPokerKeyboard(
  actions: string[],
  params: Record<string, string> = {},
  showBack = false,
  ctx?: any
): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  const buttons = generatePokerButtons(actions, params, ctx);
  
  if (showBack) {
    const backButton = generatePokerButton('back', params, ctx);
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