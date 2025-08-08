/**
 * Generate keyboard for joining rooms
 */
export function generateJoinRoomKeyboard(ctx?: { t: (key: string) => string; keyboard?: { buildCallbackData: (action: string, params?: Record<string, unknown>) => string } }): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  const t: (key: string) => string = (key: string) => (ctx?.t ? ctx.t(key) : key);
  return {
    inline_keyboard: [
      [
        { text: t('poker.room.buttons.findRooms'), callback_data: ctx?.keyboard?.buildCallbackData?.('games.poker.room.list') ?? 'games.poker.room.list' },
        { text: t('poker.room.buttons.createRoom'), callback_data: ctx?.keyboard?.buildCallbackData?.('games.poker.room.create') ?? 'games.poker.room.create' }
      ],
      [
        { text: t('poker.room.buttons.back'), callback_data: ctx?.keyboard?.buildCallbackData?.('games.poker.start') ?? 'games.poker.start' }
      ]
    ]
  };
}

/**
 * Generate error keyboard
 */
export function generateErrorKeyboard(ctx?: { t: (key: string) => string; keyboard?: { buildCallbackData: (action: string, params?: Record<string, unknown>) => string } }): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  return {
    inline_keyboard: [
      [
        { text: (ctx?.t ? ctx.t('poker.room.buttons.backToMenu') : 'poker.room.buttons.backToMenu'), callback_data: ctx?.keyboard?.buildCallbackData?.('games.poker.start') ?? 'games.poker.start' }
      ]
    ]
  };
}

/**
 * Generate leave room keyboard
 */
export function generateLeaveRoomKeyboard(ctx?: { t: (key: string) => string; keyboard?: { buildCallbackData: (action: string, params?: Record<string, unknown>) => string } }): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  return {
    inline_keyboard: [
      [
        { text: (ctx?.t ? ctx.t('poker.room.buttons.leave') : 'poker.room.buttons.leave'), callback_data: ctx?.keyboard?.buildCallbackData?.('games.poker.room.leave') ?? 'games.poker.room.leave' },
        { text: (ctx?.t ? ctx.t('poker.room.buttons.backToRoomInfo') : 'poker.room.buttons.backToRoomInfo'), callback_data: ctx?.keyboard?.buildCallbackData?.('games.poker.room.info') ?? 'games.poker.room.info' }
      ]
    ]
  };
} 