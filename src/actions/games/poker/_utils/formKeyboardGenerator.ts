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
          text: '📤 اشتراک‌گذاری',
          switch_inline_query: `join_room_${roomId}`
        }
      ]
    ]
  };
}

/**
 * Generate invite message keyboard
 */
export function generateInviteKeyboard(roomId: string): {
  inline_keyboard: Array<Array<{ text: string; callback_data?: string; url?: string }>>
} {
  return {
    inline_keyboard: [
      [
        {
          text: '🎮 ورود به میز',
          url: `https://t.me/${process.env.TELEGRAM_BOT_USERNAME}?start=jgpr_${roomId}`
        }
      ],
      [
        {
          text: '📤 اشتراک‌گذاری',
          switch_inline_query: `join_room_${roomId}`
        }
      ],
      [
        {
          text: '🔙 بازگشت',
          callback_data: `gpj?roomId=${roomId}`
        }
      ]
    ]
  };
} 