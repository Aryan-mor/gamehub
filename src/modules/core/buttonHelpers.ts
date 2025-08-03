/**
 * Button definition interface
 */
export interface ButtonDefinition {
  text: string;
  callback_data: string;
}

/**
 * Button template interface for dynamic generation
 */
export interface ButtonTemplate {
  text: string;
  callback_data: string;
}

/**
 * Replace parameters in button callback_data
 */
export function replaceParams(
  btn: ButtonTemplate,
  params: Record<string, string>
): ButtonDefinition {
  const replaced = { ...btn };
  for (const [key, value] of Object.entries(params)) {
    const placeholder = `{${key}}`;
    if (replaced.callback_data.includes(placeholder)) {
      replaced.callback_data = replaced.callback_data.replace(placeholder, value);
    }
  }
  return replaced;
}

/**
 * Generate a button from template with parameters
 */
export function generateButton(
  action: string,
  params: Record<string, string>,
  buttonTemplates: Record<string, ButtonTemplate>
): ButtonDefinition {
  const template = buttonTemplates[action];
  if (!template) {
    throw new Error(`Button template not found for action: ${action}`);
  }
  return replaceParams(template, params);
}

/**
 * Generate multiple buttons from templates with parameters
 */
export function generateButtons(
  actions: string[],
  params: Record<string, string>,
  buttonTemplates: Record<string, ButtonTemplate>
): ButtonDefinition[] {
  return actions.map(action => generateButton(action, params, buttonTemplates));
}

/**
 * Create inline keyboard from button definitions
 */
export function createInlineKeyboard(buttons: ButtonDefinition[]): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  const rows: Array<Array<{ text: string; callback_data: string }>> = [];
  let currentRow: Array<{ text: string; callback_data: string }> = [];
  
  // Group buttons by size (short buttons can fit 2-3 per row)
  const shortButtons = buttons.filter(btn => btn.text.length <= 8);
  const longButtons = buttons.filter(btn => btn.text.length > 8);
  
  // Add short buttons first (2-3 per row)
  for (let i = 0; i < shortButtons.length; i++) {
    currentRow.push({
      text: shortButtons[i].text,
      callback_data: JSON.stringify({ action: shortButtons[i].callback_data })
    });
    
    if (currentRow.length === 3 || i === shortButtons.length - 1) {
      rows.push([...currentRow]);
      currentRow = [];
    }
  }
  
  // Add long buttons (1 per row)
  for (const button of longButtons) {
    rows.push([{
      text: button.text,
      callback_data: JSON.stringify({ action: button.callback_data })
    }]);
  }
  
  return { inline_keyboard: rows };
}

/**
 * Create custom keyboard layout with specific button arrangements
 * @param layout Array of arrays, each inner array represents buttons in one row
 * @param buttonTemplates Button templates to use
 * @param params Parameters to replace in callback_data
 */
export function createCustomKeyboard(
  layout: string[][],
  buttonTemplates: Record<string, ButtonTemplate>,
  params: Record<string, string> = {}
): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  const rows: Array<Array<{ text: string; callback_data: string }>> = [];
  
  for (const row of layout) {
    const buttonRow: Array<{ text: string; callback_data: string }> = [];
    
    for (const action of row) {
      const button = generateButton(action, params, buttonTemplates);
      buttonRow.push({
        text: button.text,
        callback_data: button.callback_data
      });
    }
    
    if (buttonRow.length > 0) {
      rows.push(buttonRow);
    }
  }
  
  return { inline_keyboard: rows };
}

/**
 * Create optimized keyboard with back button support
 */
export function createOptimizedKeyboard(
  buttons: ButtonDefinition[],
  showBack = false
): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  const keyboard = createInlineKeyboard(buttons);
  
  // Add back button if needed
  if (showBack) {
    keyboard.inline_keyboard.push([{
      text: '⬅️ Back',
      callback_data: JSON.stringify({ action: 'back' })
    }]);
  }
  
  return keyboard;
} 