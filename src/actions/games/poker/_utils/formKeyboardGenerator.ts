import { FormStep } from './formStateManager';
import { formStepButtons } from '../room/create/buttonSets';
import { GameHubContext } from '@/plugins';

/**
 * Generate keyboard for form step
 * Note: This function requires ctx to be passed from the handler
 */
export function generateFormStepKeyboard(step: FormStep, ctx?: GameHubContext): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  if (!ctx) {
    throw new Error('Context is required for generateFormStepKeyboard');
  }

  const templates = ctx.poker.createButtonTemplates();
  
  switch (step) {
    case 'name':
      return ctx.keyboard.createCustomKeyboard(formStepButtons.nameInput, templates);
      
    case 'privacy':
      return ctx.keyboard.createCustomKeyboard(formStepButtons.privacySelection, templates);
      
    case 'maxPlayers':
      return ctx.keyboard.createCustomKeyboard(formStepButtons.maxPlayersSelection, templates);
      
    case 'smallBlind':
      return ctx.keyboard.createCustomKeyboard(formStepButtons.smallBlindSelection, templates);
      
    case 'timeout':
      return ctx.keyboard.createCustomKeyboard(formStepButtons.turnTimeoutSelection, templates);
      
    case 'confirmation':
      return ctx.keyboard.createCustomKeyboard(formStepButtons.confirmation, templates);
      
    default:
      return ctx.keyboard.createCustomKeyboard([['backToMenu']], templates);
  }
}

/**
 * Generate confirmation keyboard with invite button
 * Note: This function requires ctx to be passed from the handler
 */
export function generateConfirmationKeyboard(roomId: string, ctx?: GameHubContext): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  if (!ctx) {
    throw new Error('Context is required for generateConfirmationKeyboard');
  }

  return {
    inline_keyboard: [
      [
        { text: ctx.t('poker.room.buttons.share'), callback_data: ctx.keyboard.buildCallbackData('games.poker.room.share', { roomId }) }
      ]
    ]
  };
}

/**
 * Generate invite message keyboard
 * Note: This function requires ctx to be passed from the handler
 */
export function generateInviteKeyboard(roomId: string, ctx?: GameHubContext): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  if (!ctx) {
    throw new Error('Context is required for generateInviteKeyboard');
  }

  return {
    inline_keyboard: [
      [
        { text: ctx.t('poker.room.buttons.share'), callback_data: ctx.keyboard.buildCallbackData('games.poker.room.share', { roomId }) }
      ],
      [
        { text: ctx.t('poker.room.buttons.back'), callback_data: ctx.keyboard.buildCallbackData('games.poker.room.join', { roomId }) }
      ]
    ]
  };
} 