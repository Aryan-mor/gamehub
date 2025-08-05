import { FormStep } from './formStateManager';
import { formStepButtons } from '../room/create/buttonSets';
import { generatePokerKeyboard } from '../buttonHelpers';

/**
 * Generate keyboard for form step
 */
export function generateFormStepKeyboard(step: FormStep): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  switch (step) {
    case 'name':
      return generatePokerKeyboard(formStepButtons.nameInput, {}, false);
      
    case 'privacy':
      return generatePokerKeyboard(formStepButtons.privacySelection, {}, false);
      
    case 'maxPlayers':
      return generatePokerKeyboard(formStepButtons.maxPlayersSelection, {}, false);
      
    case 'smallBlind':
      return generatePokerKeyboard(formStepButtons.smallBlindSelection, {}, false);
      
    case 'timeout':
      return generatePokerKeyboard(formStepButtons.turnTimeoutSelection, {}, false);
      
    case 'confirmation':
      return generatePokerKeyboard(formStepButtons.confirmation, {}, false);
      
    default:
      return generatePokerKeyboard([['backToMenu']], {}, false);
  }
}

/**
 * Generate confirmation keyboard with invite button
 */
export function generateConfirmationKeyboard(roomId: string): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  return {
    inline_keyboard: [
      [
        {
          text: '📤 Share Room',
          callback_data: `games.poker.room.share?roomId=${roomId}`
        }
      ]
    ]
  };
}

/**
 * Generate invite message keyboard
 */
export function generateInviteKeyboard(roomId: string): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  return {
    inline_keyboard: [
      [
        {
          text: '📤 Share Room',
          callback_data: `games.poker.room.share?roomId=${roomId}`
        }
      ],
      [
        {
          text: '🔙 Back',
          callback_data: `games.poker.room.join?roomId=${roomId}`
        }
      ]
    ]
  };
} 